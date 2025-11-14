// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

// Suppress console errors during tests (optional)
// Uncomment if you want cleaner test output
// global.console.error = jest.fn();

// Global test timeout
jest.setTimeout(10000);
