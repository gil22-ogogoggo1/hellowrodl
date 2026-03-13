/**
 * tests/app-utils.test.js
 * app.js 유틸 함수 단위 테스트
 */

// app.js가 전역 변수(Storage, showToast 등)에 의존하므로 스텁 제공
global.Storage = { getAll: () => [], add: () => {} };
global.escapeHTML = (s) => String(s || '');
global.Users = {
  init: jest.fn(),
  getCurrent: () => ({ name: '테스트', color: '#ff7829' }),
  getCurrentId: () => 'default',
  getAll: () => [{ id: 'default', name: '테스트', color: '#ff7829' }],
  add: jest.fn(),
  switchTo: jest.fn(),
  remove: jest.fn(),
  rename: jest.fn(),
};
global.migrate = jest.fn();
global.AppSettings = { applyTheme: jest.fn() };
global.Dashboard = { render: jest.fn() };
global.MounjaroPage = { render: jest.fn() };
global.BodyPage = { render: jest.fn() };
global.ExercisePage = { render: jest.fn() };
global.DietPage = { render: jest.fn() };
global.SettingsPage = { render: jest.fn() };

const { formatDate, formatDateShort, todayStr, daysFromNow } = require('../js/app');

// ────────────────────────────────────────
// todayStr
// ────────────────────────────────────────
describe('todayStr()', () => {
  test('YYYY-MM-DD 형식 반환', () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('길이가 10자', () => {
    expect(todayStr()).toHaveLength(10);
  });

  test('현재 날짜와 일치', () => {
    const now = new Date().toISOString().slice(0, 10);
    expect(todayStr()).toBe(now);
  });
});

// ────────────────────────────────────────
// daysFromNow
// ────────────────────────────────────────
describe('daysFromNow()', () => {
  test('null 입력 시 null 반환', () => {
    expect(daysFromNow(null)).toBeNull();
  });

  test('빈 문자열 시 null 반환', () => {
    expect(daysFromNow('')).toBeNull();
  });

  test('오늘 날짜는 0 반환', () => {
    expect(daysFromNow(todayStr())).toBe(0);
  });

  test('어제 날짜는 -1 반환', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    expect(daysFromNow(dateStr)).toBe(-1);
  });

  test('내일 날짜는 1 반환', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    expect(daysFromNow(dateStr)).toBe(1);
  });
});

// ────────────────────────────────────────
// formatDate
// ────────────────────────────────────────
describe('formatDate()', () => {
  test('빈 문자열 → 빈 문자열', () => {
    expect(formatDate('')).toBe('');
  });

  test('null → 빈 문자열', () => {
    expect(formatDate(null)).toBe('');
  });

  test('유효한 날짜 → 한국어 포맷 문자열', () => {
    const result = formatDate('2026-01-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('날짜 문자열에 "월", "일" 포함', () => {
    const result = formatDate('2026-01-15');
    expect(result).toContain('월');
    expect(result).toContain('일');
  });
});

// ────────────────────────────────────────
// formatDateShort
// ────────────────────────────────────────
describe('formatDateShort()', () => {
  test('빈 문자열 → 빈 문자열', () => {
    expect(formatDateShort('')).toBe('');
  });

  test('null → 빈 문자열', () => {
    expect(formatDateShort(null)).toBe('');
  });

  test('2026-01-15 → 1/15', () => {
    expect(formatDateShort('2026-01-15')).toBe('1/15');
  });

  test('2026-12-31 → 12/31', () => {
    expect(formatDateShort('2026-12-31')).toBe('12/31');
  });
});
