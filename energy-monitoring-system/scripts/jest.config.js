module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.ts'],
  coverageDirectory: '../coverage/scripts',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!uuid)'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/../node_modules/uuid/dist/index.js',
  },
};
