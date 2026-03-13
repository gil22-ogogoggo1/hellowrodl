// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * e2e/data-crud.spec.js — 데이터 CRUD E2E 테스트
 */
test.describe('투약 기록 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('[data-tab="mounjaro"]');
    await page.waitForSelector('#mj-save-btn');
  });

  test('투약 기록 저장 후 리스트에 표시', async ({ page }) => {
    await page.selectOption('#mj-drug', 'mounjaro');
    await page.fill('#mj-date', '2026-01-15');
    await page.click('#mj-save-btn');

    // 토스트 확인
    await expect(page.locator('#toast')).toContainText('저장');

    // 리스트에 기록 표시
    await expect(page.locator('#mj-list .record-item')).toHaveCount(1);
  });

  test('투약 기록 삭제', async ({ page }) => {
    // 기록 추가
    await page.fill('#mj-date', '2026-01-15');
    await page.click('#mj-save-btn');
    await page.waitForSelector('#mj-list .record-item');

    // 삭제 버튼 클릭
    page.on('dialog', dialog => dialog.accept());
    await page.click('#mj-list .btn-danger');
    await expect(page.locator('#mj-list .record-item')).toHaveCount(0);
  });
});

test.describe('체중 기록 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('[data-tab="body"]');
    await page.waitForSelector('#body-save-btn');
  });

  test('체중 기록 저장 후 리스트에 표시', async ({ page }) => {
    await page.fill('#body-date', '2026-01-15');
    await page.fill('#body-weight', '75.3');
    await page.click('#body-save-btn');

    await expect(page.locator('#body-list .record-item')).toHaveCount(1);
    await expect(page.locator('#body-list')).toContainText('75.30');
  });

  test('새로고침 후 데이터 유지', async ({ page }) => {
    await page.fill('#body-date', '2026-01-15');
    await page.fill('#body-weight', '75.3');
    await page.click('#body-save-btn');

    // 새로고침
    await page.reload();
    await page.click('[data-tab="body"]');
    await page.waitForSelector('#body-list');
    await expect(page.locator('#body-list')).toContainText('75.30');
  });
});

test.describe('식사 기록 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('[data-tab="diet"]');
    await page.waitForSelector('#diet-save-btn');
  });

  test('식사 기록 저장 후 리스트에 표시', async ({ page }) => {
    await page.fill('#diet-date', '2026-01-15');
    await page.fill('#diet-content', '닭가슴살 200g');
    await page.fill('#diet-calories', '300');
    await page.click('#diet-save-btn');

    await expect(page.locator('#diet-list')).toContainText('닭가슴살 200g');
    await expect(page.locator('#diet-list')).toContainText('300');
  });
});

test.describe('운동 기록 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/fitjourney.html');
    await page.click('[data-tab="exercise"]');
    await page.waitForSelector('#ex-save-btn');
  });

  test('운동 기록 저장 후 리스트에 표시', async ({ page }) => {
    await page.fill('#ex-date', '2026-01-15');
    await page.selectOption('#ex-type', '런닝');
    await page.fill('#ex-distance', '5');
    await page.fill('#ex-duration', '30');
    await page.click('#ex-save-btn');

    await expect(page.locator('#exercise-list')).toContainText('런닝');
  });
});
