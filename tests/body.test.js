/**
 * tests/body.test.js
 * BodyPage 단위 테스트
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');

global.Storage = Storage;
global.escapeHTML = escapeHTML;
global.showToast = jest.fn();
global.todayStr = () => '2026-01-01';
global.formatDate = (d) => d;
global.daysFromNow = (d) => d ? 0 : null;
global.Profile = {
  get: () => null,
  calcBMI: () => null,
  bmiLabel: () => ({ text: '정상', cls: 'text-green' }),
  genderLabel: () => '남성',
  ageGroupLabel: () => '30대',
  getAverage: () => null,
};
global.Charts = {
  renderWeightChart: jest.fn(),
  renderBodyCompChart: jest.fn(),
  _destroy: jest.fn(),
};
global.App = { Modal: { open: jest.fn(), close: jest.fn() } };
global.Sync = {
  connectBluetoothScale: jest.fn(),
  importSamsungZip: jest.fn(),
  importSamsungBody: jest.fn(),
  importGenericBody: jest.fn(),
};
global.RenderHelper = {
  emptyState: (icon, msg) => `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`,
};

const { BodyPage } = require('../js/body');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
  jest.clearAllMocks();
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// BodyPage.fmtW
// ────────────────────────────────────────
describe('BodyPage.fmtW()', () => {
  test('숫자 → 소수점 2자리 문자열', () => {
    expect(BodyPage.fmtW(75.3)).toBe('75.30');
  });

  test('null → 대시 반환', () => {
    expect(BodyPage.fmtW(null)).toBe('-');
  });

  test('undefined → 대시 반환', () => {
    expect(BodyPage.fmtW(undefined)).toBe('-');
  });

  test('정수도 .00 포맷', () => {
    expect(BodyPage.fmtW(80)).toBe('80.00');
  });

  test('소수점 많은 숫자 정확히 2자리 반올림', () => {
    expect(BodyPage.fmtW(75.345)).toBe('75.35');
  });

  test('0 → 0.00', () => {
    expect(BodyPage.fmtW(0)).toBe('0.00');
  });
});

// ────────────────────────────────────────
// BodyPage.renderList (DOM)
// ────────────────────────────────────────
describe('BodyPage.renderList()', () => {
  test('기록 없을 때 빈 상태 표시', () => {
    document.body.innerHTML = '<div id="body-list"></div>';
    BodyPage.renderList();
    expect(document.getElementById('body-list').innerHTML).toContain('empty-state');
  });

  test('기록 있을 때 항목 렌더', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3, fat: null, muscle: null, bmi: null, memo: '' });
    document.body.innerHTML = '<div id="body-list"></div>';
    BodyPage.renderList();
    const list = document.getElementById('body-list');
    expect(list.innerHTML).toContain('75.30');
  });

  test('인바디 정보 포함 렌더', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3, fat: 28.5, muscle: 30.1, bmi: 24.5, memo: '테스트' });
    document.body.innerHTML = '<div id="body-list"></div>';
    BodyPage.renderList();
    const list = document.getElementById('body-list');
    expect(list.innerHTML).toContain('체지방');
    expect(list.innerHTML).toContain('근육');
  });

  test('메모 XSS 이스케이프', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3, memo: '<script>alert(1)</script>' });
    document.body.innerHTML = '<div id="body-list"></div>';
    BodyPage.renderList();
    const list = document.getElementById('body-list');
    expect(list.innerHTML).not.toContain('<script>');
  });
});

// ────────────────────────────────────────
// BodyPage.renderSummary (DOM)
// ────────────────────────────────────────
describe('BodyPage.renderSummary()', () => {
  test('기록 없을 때 빈 상태', () => {
    document.body.innerHTML = '<div id="body-summary"></div>';
    BodyPage.renderSummary();
    expect(document.getElementById('body-summary').innerHTML).toBe('');
  });

  test('기록 있을 때 현재 체중 표시', () => {
    Storage.add('body', { date: '2026-01-01', weight: 80 });
    Storage.add('body', { date: '2026-01-10', weight: 78 });
    document.body.innerHTML = '<div id="body-summary"></div>';
    BodyPage.renderSummary();
    const el = document.getElementById('body-summary');
    expect(el.innerHTML).toContain('78.00');
  });
});
