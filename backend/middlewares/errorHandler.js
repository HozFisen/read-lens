const errorHandler = (error, req, res, next) => {
  let status = 500;
  let message = 'Internal Server Error';

  // Log error for debugging (consider using a proper logger in production)
  console.error('Error:', error);

  switch (error.name) {
    // Validation errors
    case 'ValidationError':
    case 'SequelizeValidationError':
      status = 400;
      message = error.message || 'Validation error';
      
      // Handle Sequelize validation errors with multiple fields
      if (error.errors && Array.isArray(error.errors)) {
        message = error.errors.map(err => err.message).join(', ');
      }
      break;

    // Duplicate entry errors
    case 'DuplicateError':
    case 'SequelizeUniqueConstraintError':
      status = 400;
      message = error.message || 'Duplicate entry';
      break;

    // Foreign key constraint errors
    case 'SequelizeForeignKeyConstraintError':
      status = 400;
      message = 'Invalid reference to related resource';
      break;

    // Authentication errors
    case 'Unauthenticated':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      status = 401;
      message = error.message || 'Authentication required';
      break;

    // Invalid credentials
    case 'InvalidCredentials':
      status = 401;
      message = error.message || 'Invalid credentials';
      break;

    // Authorization errors
    case 'Forbidden':
      status = 403;
      message = error.message || 'Access forbidden';
      break;

    // Not found errors
    case 'NotFound':
      status = 404;
      message = error.message || 'Resource not found';
      break;

    // Google OAuth errors
    case 'InvalidGoogleToken':
      status = 400;
      message = error.message || 'Invalid Google token';
      break;

    // Database errors
    case 'SequelizeDatabaseError':
      status = 500;
      message = 'Database error occurred';
      break;

    // Connection errors
    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
      status = 503;
      message = 'Database connection failed';
      break;

    default:
      // Check if error has a status property (from custom errors)
      if (error.status) {
        status = error.status;
        message = error.message;
      }
      // Keep default 500 status and message for unknown errors
      break;
  }

  // Send error response
  res.status(status).json({
    error: message,
    // Include stack trace in development mode only
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;