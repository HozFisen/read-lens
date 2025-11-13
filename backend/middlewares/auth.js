const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models');

// Authentication middleware - checks if user is logged in
const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw { name: 'Unauthenticated', message: 'Please login first' };
    }

    // Extract token from "Bearer <token>"
    const token = authorization.split(' ')[1];

    if (!token) {
      throw { name: 'Unauthenticated', message: 'Invalid token format' };
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user to ensure they still exist
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw { name: 'Unauthenticated', message: 'User not found' };
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      error.name = 'Unauthenticated';
      error.message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      error.name = 'Unauthenticated';
      error.message = 'Token has expired';
    }
    next(error);
  }
};

// Authorization middleware - checks if user has permission
// Usage: authorization('admin') or authorization(['admin', 'moderator'])
const authorization = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const { role } = req.user;

      // Flatten array in case roles are passed as array
      const roles = allowedRoles.flat();

      // Admin has access to everything
      if (role === 'admin') {
        return next();
      }

      // Check if user's role is in allowed roles
      if (!roles.includes(role)) {
        throw { name: 'Forbidden', message: 'You do not have permission to access this resource' };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Resource ownership authorization - checks if user owns the resource
// Usage: authorizeOwnership('userId') where 'userId' is the param name
const authorizeOwnership = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const { role, id: userId } = req.user;
      
      // Admin has access to everything
      if (role === 'admin') {
        return next();
      }

      // Get the resource owner ID from params or body
      const resourceOwnerId = parseInt(req.params[paramName] || req.body[paramName]);

      // Check if user owns the resource
      if (userId !== resourceOwnerId) {
        throw { name: 'Forbidden', message: 'You can only modify your own resources' };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authentication;
module.exports.authorization = authorization;
module.exports.authorizeOwnership = authorizeOwnership;