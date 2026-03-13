// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/multi-user.spec.js — 다중 사용자 E2E 테스트
 */
test.describe('다중 사용자 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.waitForSelector('#user-avatar-btn');
  });

  test('새 사용자 추가', async ({ page }) => {
    await page.click('#user-avatar-btn');
    await page.fill('#new-user-name', '테스트사용자');
    await page.click('.user-add-form .btn-primary');

    await expect(page.locator('#toast')).toContainText('테스트사용자');
  });

  test('사용자 전환 후 데이터 분리 확인', async ({ page }) => {
    // 기본 사용자 체중 기록
    await page.click('[data-tab="body"]');
    await page.fill('#body-date', '2026-01-15');
    await page.fill('#body-weight', '80.0');
    await page.click('#body-save-btn');

    // 새 사용자 추가 및 전환
    await page.click('#user-avatar-btn');
    await page.fill('#new-user-name', '사용자2');
    await page.click('.user-add-form .btn-primary');

    // 사용자2의 체중 기록이 없어야 함
    await page.click('[data-tab="body"]');
    await page.waitForSelector('#body-list');
    await expect(page.locator('#body-list')).not.toContainText('80.00');
  });

  test('사용자 이름 변경', async ({ page }) => {
    await page.click('#user-avatar-btn');
    await page.click('.user-list-item button:has-text("이름변경")');

    // prompt() 다이얼로그 처리
    page.on('dialog', async (dialog) => {
      await dialog.accept('새이름');
    });

    await expect(page.locator('#toast')).toContainText('이름이 변경됨');
  });
});
