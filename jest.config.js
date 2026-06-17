/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  moduleNameMapper: {
    '^@angular/platform-browser-dynamic/testing$':
      '<rootDir>/src/__mocks__/@angular/platform-browser-dynamic/testing.ts',
    '^@angular/platform-browser/animations$':
      '<rootDir>/src/__mocks__/@angular/platform-browser/animations.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};
