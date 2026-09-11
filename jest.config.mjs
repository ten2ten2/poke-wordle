import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = async () => ({
  ...(await createJestConfig({
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/data/**',
    ],
  })()),
  // next-intl distributes ESM; transform its routing helpers for Jest.
  transformIgnorePatterns: ['node_modules/(?!(next-intl|use-intl)/)'],
});

export default config;
