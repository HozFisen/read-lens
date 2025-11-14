const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { generateToken, verifyToken } = require('../helpers/jwt');

describe('Helper Functions', () => {
  describe('bcrypt helper', () => {
    describe('hashPassword', () => {
      it('should hash a password successfully', () => {
        const password = 'testPassword123';
        const hashed = hashPassword(password);
        
        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
        expect(typeof hashed).toBe('string');
        expect(hashed.length).toBeGreaterThan(0);
      });

      it('should generate different hashes for the same password', () => {
        const password = 'testPassword123';
        const hash1 = hashPassword(password);
        const hash2 = hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
      });

      it('should handle empty string', () => {
        const hashed = hashPassword('');
        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
      });
    });

    describe('comparePassword', () => {
      it('should return true for matching password', () => {
        const password = 'testPassword123';
        const hashed = hashPassword(password);
        
        const result = comparePassword(password, hashed);
        expect(result).toBe(true);
      });

      it('should return false for non-matching password', () => {
        const password = 'testPassword123';
        const wrongPassword = 'wrongPassword';
        const hashed = hashPassword(password);
        
        const result = comparePassword(wrongPassword, hashed);
        expect(result).toBe(false);
      });

      it('should be case sensitive', () => {
        const password = 'TestPassword123';
        const hashed = hashPassword(password);
        
        const result = comparePassword('testpassword123', hashed);
        expect(result).toBe(false);
      });

      it('should handle empty string comparison', () => {
        const hashed = hashPassword('password');
        const result = comparePassword('', hashed);
        expect(result).toBe(false);
      });
    });
  });

  describe('JWT helper', () => {
    const originalSecret = process.env.JWT_SECRET;
    const originalExpire = process.env.JWT_EXPIRE;

    beforeAll(() => {
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.JWT_EXPIRE = '1h';
    });

    afterAll(() => {
      process.env.JWT_SECRET = originalSecret;
      process.env.JWT_EXPIRE = originalExpire;
    });

    describe('generateToken', () => {
      it('should generate a token with valid payload', () => {
        const payload = { id: 1, email: 'test@example.com', role: 'user' };
        const token = generateToken(payload);
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3); // JWT has 3 parts
      });

      it('should generate different tokens for different payloads', () => {
        const payload1 = { id: 1, email: 'test1@example.com' };
        const payload2 = { id: 2, email: 'test2@example.com' };
        
        const token1 = generateToken(payload1);
        const token2 = generateToken(payload2);
        
        expect(token1).not.toBe(token2);
      });

      it('should handle empty payload', () => {
        const token = generateToken({});
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });
    });

    describe('verifyToken', () => {
      it('should verify and decode a valid token', () => {
        const payload = { id: 1, email: 'test@example.com', role: 'user' };
        const token = generateToken(payload);
        
        const decoded = verifyToken(token);
        
        expect(decoded).toBeDefined();
        expect(decoded.id).toBe(payload.id);
        expect(decoded.email).toBe(payload.email);
        expect(decoded.role).toBe(payload.role);
        expect(decoded.iat).toBeDefined(); // issued at
        expect(decoded.exp).toBeDefined(); // expiration
      });

      it('should throw error for invalid token', () => {
        const invalidToken = 'invalid.token.here';
        
        expect(() => {
          verifyToken(invalidToken);
        }).toThrow();
      });

      it('should throw error for tampered token', () => {
        const payload = { id: 1, email: 'test@example.com' };
        const token = generateToken(payload);
        const tamperedToken = token.slice(0, -5) + 'xxxxx';
        
        expect(() => {
          verifyToken(tamperedToken);
        }).toThrow();
      });

      it('should throw error for empty token', () => {
        expect(() => {
          verifyToken('');
        }).toThrow();
      });

      it('should throw error for expired token', () => {
        // Temporarily set expiration to 0 seconds
        process.env.JWT_EXPIRE = '0s';
        
        const payload = { id: 1, email: 'test@example.com' };
        const token = generateToken(payload);
        
        // Reset expire time
        process.env.JWT_EXPIRE = '1h';
        
        // Wait a tiny bit to ensure expiration
        return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
          expect(() => {
            verifyToken(token);
          }).toThrow();
        });
      });
    });

    describe('Token integration', () => {
      it('should generate and verify token with complete user data', () => {
        const userData = {
          id: 42,
          email: 'john.doe@example.com',
          role: 'admin',
          username: 'johndoe'
        };
        
        const token = generateToken(userData);
        const decoded = verifyToken(token);
        
        expect(decoded.id).toBe(userData.id);
        expect(decoded.email).toBe(userData.email);
        expect(decoded.role).toBe(userData.role);
        expect(decoded.username).toBe(userData.username);
      });
    });
  });
});
