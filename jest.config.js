/** @type {import('jest').Config} */
module.exports = {
  // jsdom 환경: localStorage 등 브라우저 API 제공
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/storage.js',
    'js/users.js',
    'js/settings.js',
    'js/helpers.js',
    'js/profile.js',
    'js/sync.js',
    'js/mounjaro.js',
    'js/body.js',
    'js/exercise.js',
    'js/diet.js',
    'js/dashboard.js',
    'js/charts.js',
    'js/app.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    // 단위 테스트로 측정 가능한 순수 함수 중심 목표
    global: {
      statements: 50,
      branches: 35,
      functions: 50,
      lines: 50,
    },
  },
};
