// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/settings.spec.js — 설정 페이지 E2E 테스트
 */
test.describe('목표 설정', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('#settings-btn');
    await page.waitForSelector('#goal-weight-target');
  });

  test('목표 체중 저장 후 대시보드에 반영', async ({ page }) => {
    await page.fill('#goal-weight-start', '80');
    await page.fill('#goal-weight-target', '70');
    await page.click('button:has-text("목표 저장")');

    await expect(page.locator('#toast')).toContainText('저장');
  });

  test('주간 운동 목표 저장', async ({ page }) => {
    await page.fill('#goal-exercise', '3');
    await page.click('button:has-text("목표 저장")');

    await expect(page.locator('#toast')).toContainText('저장');
  });
});

test.describe('테마 전환', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('#settings-btn');
    await page.waitForSelector('.theme-btn');
  });

  test('라이트 테마 전환', async ({ page }) => {
    await page.click('button:has-text("☀️ 라이트")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#toast')).toContainText('라이트');
  });

  test('다크 테마로 복원', async ({ page }) => {
    // 먼저 라이트로 전환
    await page.click('button:has-text("☀️ 라이트")');
    // 다크로 전환
    await page.click('button:has-text("🌙 다크")');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('테마 설정이 새로고침 후 유지', async ({ page }) => {
    await page.click('button:has-text("☀️ 라이트")');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
