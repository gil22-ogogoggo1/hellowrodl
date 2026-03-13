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
    // 전체 합산(storage:100%, users:93%, settings:36%) → 70% 수준을 기준으로 설정
    global: {
      statements: 65,
      branches: 50,
      functions: 75,
      lines: 65,
    },
  },
};
