import angular from 'angular-eslint';

export default [
  {
    ignores: ['.angular/**', 'coverage/**', 'dist/**', 'node_modules/**', 'public/**'],
  },
  ...angular.configs.tsRecommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
  })),
  ...angular.configs.templateRecommended.map((config) => ({
    ...config,
    files: ['**/*.html'],
  })),
];
