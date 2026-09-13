module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Handle ESM modules like uuid and @nestjs/cache-manager
  transformIgnorePatterns: ['node_modules/(?!uuid|@nestjs/cache-manager)'],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
    '^@nestjs/cache-manager$': '<rootDir>/../node_modules/@nestjs/cache-manager/dist/index.js',
  },
};
