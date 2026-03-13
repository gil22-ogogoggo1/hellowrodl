// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * playwright.config.js — E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'e2e-report', open: 'never' }], ['list']],

  use: {
    // 로컬 서버 URL (CI에서 npx serve . 로 실행)
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: '모바일 (375px)',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: '데스크톱 (1024px)',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // CI 환경에서 로컬 서버 자동 시작
  webServer: process.env.CI ? {
    command: 'npx serve . -p 8080 -s',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  } : undefined,
});
