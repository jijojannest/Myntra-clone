module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/utils/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/node_modules/$1',
    '^(\\.{1}|src)/(.*)$': '<rootDir>/src/$2',
  },
  transform: {
    '^.+\\.(css|less|scss|sass)$': 'jest-transform-css',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: 'src',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js,jsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],
  reporters: [
    'text',
    'coverage',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    {
      displayName: 'React Components',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
      ],
      collectCoverageFrom: 'src',
    },
  ],
  setupFilesAfterEnv: ['<rootDir>/src/utils/setupTests.js'],
};