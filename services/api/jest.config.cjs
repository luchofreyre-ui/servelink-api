module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*.spec.ts',
    '**/src/modules/franchise-owner/__tests__/**/*.spec.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
