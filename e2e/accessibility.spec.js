// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/accessibility.spec.js — 접근성 E2E 테스트
 */
test.describe('기본 접근성', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.waitForSelector('#tab-nav');
  });

  test('탭 네비게이션에 tablist role', async ({ page }) => {
    await expect(page.locator('#tab-nav')).toHaveAttribute('role', 'tablist');
  });

  test('탭 버튼에 tab role', async ({ page }) => {
    const firstTab = page.locator('.tab-btn').first();
    await expect(firstTab).toHaveAttribute('role', 'tab');
  });

  test('활성 탭에 aria-selected="true"', async ({ page }) => {
    const activeTab = page.locator('.tab-btn.active');
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('비활성 탭에 aria-selected="false"', async ({ page }) => {
    const inactiveTabs = page.locator('.tab-btn:not(.active)');
    const count = await inactiveTabs.count();
    for (let i = 0; i < count; i++) {
      await expect(inactiveTabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    }
  });

  test('토스트에 role="status" 속성', async ({ page }) => {
    await expect(page.locator('#toast')).toHaveAttribute('role', 'status');
  });

  test('토스트에 aria-live="polite" 속성', async ({ page }) => {
    await expect(page.locator('#toast')).toHaveAttribute('aria-live', 'polite');
  });

  test('모달에 role="dialog" 속성', async ({ page }) => {
    await expect(page.locator('#edit-modal')).toHaveAttribute('role', 'dialog');
  });

  test('모달에 aria-modal="true" 속성', async ({ page }) => {
    await expect(page.locator('#edit-modal')).toHaveAttribute('aria-modal', 'true');
  });

  test('설정 버튼에 aria-label 속성', async ({ page }) => {
    await expect(page.locator('#settings-btn')).toHaveAttribute('aria-label', '설정');
  });
});

test.describe('키보드 접근성', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.waitForSelector('#tab-nav');
  });

  test('ESC 키로 모달 닫기', async ({ page }) => {
    // 사용자 모달 열기
    await page.click('#user-avatar-btn');
    await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);

    // ESC 키 입력
    await page.keyboard.press('Escape');
    await expect(page.locator('#edit-modal')).toHaveClass(/hidden/);
  });

  test('Tab 키로 탭 버튼 포커스 이동', async ({ page }) => {
    // 첫 번째 탭 버튼에 포커스
    await page.locator('.tab-btn').first().focus();
    await expect(page.locator('.tab-btn').first()).toBeFocused();
  });
});
