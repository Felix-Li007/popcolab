import nextJest from 'next/jest';
import type { Config } from 'jest';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig: Config = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/playwright/'],

  // testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "**/__tests__/**/*.spec.[jt]s?(x)"],
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Jest Test Report',
      outputPath: 'test-reports/unit/jest-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
    }]
  ],
};

export default createJestConfig(customJestConfig);
