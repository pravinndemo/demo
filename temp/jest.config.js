/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/DetailsListVOA/tests/**/*.test.ts',
    '<rootDir>/DetailsListVOA/tests/**/*.test.tsx',
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/**/__tests__/**/*.test.ts',
    '<rootDir>/**/__tests__/**/*.test.tsx',
    '<rootDir>/**/?(*.)+(spec|test).ts',
    '<rootDir>/**/?(*.)+(spec|test).tsx',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/out/', '/bin/', '/obj/', '/solution/'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
};
