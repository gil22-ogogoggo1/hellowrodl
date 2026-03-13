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
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    // settings.js의 SettingsPage/DataIO는 DOM·Blob·FileReader 의존으로 단위 테스트 불가
    // (storage.js: 100%, users.js: 93%를 기준으로 전체 임계값 설정)
    global: {
      statements: 65,
      branches: 50,
      functions: 75,
      lines: 65,
    },
    './js/storage.js': { statements: 95, branches: 85, functions: 95, lines: 95 },
    './js/users.js':   { statements: 85, branches: 75, functions: 95, lines: 85 },
  },
};
