module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'nodes/**/*.js',
    '!nodes/**/*.html'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
  // Coverage thresholds - set to current baseline, improve over time
  // Note: Full HTTP path coverage requires mocking external APIs
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 15,
      statements: 15
    }
  }
};
