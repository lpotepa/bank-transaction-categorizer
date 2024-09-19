import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Use ts-jest for TypeScript files
  },
  testEnvironment: 'node', // Use Node.js environment for tests,
  setupFilesAfterEnv: ['./jest.setup.ts'],
};

export default config;
