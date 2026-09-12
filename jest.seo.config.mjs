import baseConfig from './jest.config.mjs';

export default async function config() {
  return {
    ...await baseConfig(),
    setupFilesAfterEnv: [],
    testMatch: ['<rootDir>/tests/seo/**/*.test.ts'],
    testTimeout: 60000,
  };
}
