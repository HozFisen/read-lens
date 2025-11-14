module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/migrations/',
    '/seeders/',
    '/config/',
    '/services/gemini.js' // Exclude AI service
  ],
  testMatch: [
    '**/__test__/**/*.test.js'
  ],
  verbose: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/migrations/**',
    '!**/seeders/**',
    '!**/config/**',
    '!**/services/gemini.js', // Exclude AI service from coverage
    '!**/coverage/**',
    '!jest.config.js'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/__test__/setup.js']
};
