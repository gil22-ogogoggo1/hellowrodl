// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/navigation.spec.js — 탭 네비게이션 E2E 테스트
 */
test.describe('탭 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fitjourney.html');
    // 앱 초기화 대기
    await page.waitForSelector('#tab-nav');
  });

  test('페이지 로드 시 대시보드 탭이 활성화', async ({ page }) => {
    const activeTab = page.locator('.tab-btn.active');
    await expect(activeTab).toContainText('홈');
  });

  test('투약 탭 클릭 시 투약 페이지로 이동', async ({ page }) => {
    await page.click('[data-tab="mounjaro"]');
    await expect(page.locator('#page-title')).toContainText('투약 기록');
    await expect(page.locator('[data-tab="mounjaro"]')).toHaveClass(/active/);
  });

  test('체중 탭 클릭 시 체중 페이지로 이동', async ({ page }) => {
    await page.click('[data-tab="body"]');
    await expect(page.locator('#page-title')).toContainText('체중');
  });

  test('운동 탭 클릭 시 운동 페이지로 이동', async ({ page }) => {
    await page.click('[data-tab="exercise"]');
    await expect(page.locator('#page-title')).toContainText('운동 기록');
  });

  test('식사 탭 클릭 시 식사 페이지로 이동', async ({ page }) => {
    await page.click('[data-tab="diet"]');
    await expect(page.locator('#page-title')).toContainText('식사 기록');
  });

  test('설정 버튼 클릭 시 설정 페이지 진입', async ({ page }) => {
    await page.click('#settings-btn');
    await expect(page.locator('#page-title')).toContainText('설정');
  });

  test('탭 전환 시 aria-selected 속성 업데이트', async ({ page }) => {
    await page.click('[data-tab="body"]');
    const bodyTab = page.locator('[data-tab="body"]');
    await expect(bodyTab).toHaveAttribute('aria-selected', 'true');

    const dashTab = page.locator('[data-tab="dashboard"]');
    await expect(dashTab).toHaveAttribute('aria-selected', 'false');
  });

  test('탭 네비게이션에 role="tablist" 속성', async ({ page }) => {
    await expect(page.locator('#tab-nav')).toHaveAttribute('role', 'tablist');
  });

  test('탭 버튼에 role="tab" 속성', async ({ page }) => {
    const tabs = page.locator('.tab-btn');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await expect(tabs.nth(i)).toHaveAttribute('role', 'tab');
    }
  });
});
