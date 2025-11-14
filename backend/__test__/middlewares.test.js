const authentication = require('../middlewares/auth');
const { authorization, authorizeOwnership } = require('../middlewares/auth');
const errorHandler = require('../middlewares/errorHandler');
const { generateToken } = require('../helpers/jwt');
const { User } = require('../models');

// Mock the User model
jest.mock('../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Setup mock request, response, and next
    req = {
      headers: {},
      params: {},
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();

    // Set JWT secret for tests
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('Authentication Middleware', () => {
    describe('authentication', () => {
      it('should authenticate user with valid token', async () => {
        const user = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'user'
        };

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        req.headers.authorization = `Bearer ${token}`;

        User.findByPk.mockResolvedValue(user);

        await authentication(req, res, next);

        expect(User.findByPk).toHaveBeenCalledWith(user.id);
        expect(req.user).toEqual({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        });
        expect(next).toHaveBeenCalledWith();
      });

      it('should reject request without authorization header', async () => {
        await authentication(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Unauthenticated',
            message: 'Please login first'
          })
        );
      });

      it('should reject request with invalid token format', async () => {
        req.headers.authorization = 'InvalidFormat';

        await authentication(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Unauthenticated'
          })
        );
      });

      it('should reject request with invalid token', async () => {
        req.headers.authorization = 'Bearer invalid.token.here';

        await authentication(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Unauthenticated',
            message: 'Invalid token'
          })
        );
      });

      it('should reject token if user not found', async () => {
        const token = generateToken({ id: 999, email: 'test@example.com', role: 'user' });
        req.headers.authorization = `Bearer ${token}`;

        User.findByPk.mockResolvedValue(null);

        await authentication(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Unauthenticated',
            message: 'User not found'
          })
        );
      });

      it('should handle expired token', async () => {
        // Create token with 0 second expiration
        process.env.JWT_EXPIRE = '0s';
        const token = generateToken({ id: 1, email: 'test@example.com', role: 'user' });
        process.env.JWT_EXPIRE = '7d';

        req.headers.authorization = `Bearer ${token}`;

        // Wait for token to expire
        await new Promise(resolve => setTimeout(resolve, 100));

        await authentication(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Unauthenticated',
            message: 'Token has expired'
          })
        );
      });

      it('should handle missing Bearer prefix', async () => {
        const token = generateToken({ id: 1, email: 'test@example.com', role: 'user' });
        req.headers.authorization = token; // No "Bearer " prefix

        await authentication(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    describe('authorization', () => {
      beforeEach(() => {
        req.user = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'user'
        };
      });

      it('should allow admin to access any resource', () => {
        req.user.role = 'admin';
        const middleware = authorization('moderator');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should allow user with matching role', () => {
        req.user.role = 'moderator';
        const middleware = authorization('moderator');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should allow user with role in allowed roles array', () => {
        req.user.role = 'editor';
        const middleware = authorization('editor', 'moderator', 'admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should reject user without required role', () => {
        req.user.role = 'user';
        const middleware = authorization('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Forbidden',
            message: 'You do not have permission to access this resource'
          })
        );
      });

      it('should handle error in authorization check', () => {
        req.user = null; // Simulate error condition
        const middleware = authorization('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      });
    });

    describe('authorizeOwnership', () => {
      beforeEach(() => {
        req.user = {
          id: 5,
          email: 'test@example.com',
          username: 'testuser',
          role: 'user'
        };
      });

      it('should allow admin to access any resource', () => {
        req.user.role = 'admin';
        req.params.id = '10';
        const middleware = authorizeOwnership('id');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should allow user to access their own resource', () => {
        req.params.id = '5'; // Same as user ID
        const middleware = authorizeOwnership('id');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should reject user accessing another user resource', () => {
        req.params.id = '10'; // Different from user ID
        const middleware = authorizeOwnership('id');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Forbidden',
            message: 'You can only modify your own resources'
          })
        );
      });

      it('should check custom param name', () => {
        req.params.userId = '5';
        const middleware = authorizeOwnership('userId');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should check body for resource owner ID', () => {
        req.body.id = '5';
        const middleware = authorizeOwnership('id');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      it('should handle string vs number comparison', () => {
        req.user.id = 5; // number
        req.params.id = '5'; // string
        const middleware = authorizeOwnership('id');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('Error Handler Middleware', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle ValidationError with 400 status', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed'
      });
    });

    it('should handle SequelizeValidationError with multiple errors', () => {
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Email is required' },
          { message: 'Password is required' }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email is required, Password is required'
      });
    });

    it('should handle DuplicateError with 400 status', () => {
      const error = {
        name: 'DuplicateError',
        message: 'Email already exists'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email already exists'
      });
    });

    it('should handle Unauthenticated error with 401 status', () => {
      const error = {
        name: 'Unauthenticated',
        message: 'Please login first'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Please login first'
      });
    });

    it('should handle InvalidCredentials with 401 status', () => {
      const error = {
        name: 'InvalidCredentials',
        message: 'Invalid email or password'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid email or password'
      });
    });

    it('should handle Forbidden error with 403 status', () => {
      const error = {
        name: 'Forbidden',
        message: 'Access forbidden'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access forbidden'
      });
    });

    it('should handle NotFound error with 404 status', () => {
      const error = {
        name: 'NotFound',
        message: 'User not found'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should handle JsonWebTokenError with 401 status', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'jwt malformed'
      });
    });

    it('should handle SequelizeForeignKeyConstraintError', () => {
      const error = {
        name: 'SequelizeForeignKeyConstraintError',
        message: 'Foreign key constraint failed'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid reference to related resource'
      });
    });

    it('should handle SequelizeDatabaseError with 500 status', () => {
      const error = {
        name: 'SequelizeDatabaseError',
        message: 'Database error'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database error occurred'
      });
    });

    it('should handle SequelizeConnectionError with 503 status', () => {
      const error = {
        name: 'SequelizeConnectionError',
        message: 'Connection failed'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database connection failed'
      });
    });

    it('should handle unknown errors with 500 status', () => {
      const error = {
        name: 'UnknownError',
        message: 'Something went wrong'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = {
        name: 'TestError',
        message: 'Test error',
        stack: 'Error stack trace...'
      };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        stack: 'Error stack trace...'
      });
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = {
        name: 'TestError',
        message: 'Test error',
        stack: 'Error stack trace...'
      };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('should handle error with custom status property', () => {
      const error = {
        name: 'CustomError',
        message: 'Custom error message',
        status: 418
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Custom error message'
      });
    });
  });
});
