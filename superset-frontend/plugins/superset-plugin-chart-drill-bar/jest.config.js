/** jest.config.js */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.png$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};
