/**
 * tests/diet.test.js
 * DietPage 단위 테스트
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');

global.Storage = Storage;
global.escapeHTML = escapeHTML;
global.showToast = jest.fn();
global.todayStr = () => '2026-01-01';
global.formatDate = (d) => d;
global.Charts = { renderCalorieTrendChart: jest.fn(), _destroy: jest.fn() };
global.App = { Modal: { open: jest.fn(), close: jest.fn() } };
global.RenderHelper = {
  emptyState: (icon, msg) => `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`,
};

const { DietPage } = require('../js/diet');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
  jest.clearAllMocks();
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// DietPage.MEALS 상수 검증
// ────────────────────────────────────────
describe('DietPage.MEALS', () => {
  test('4가지 끼니 포함', () => {
    expect(DietPage.MEALS).toHaveLength(4);
  });

  test('아침 포함', () => {
    expect(DietPage.MEALS).toContain('아침');
  });

  test('점심 포함', () => {
    expect(DietPage.MEALS).toContain('점심');
  });

  test('저녁 포함', () => {
    expect(DietPage.MEALS).toContain('저녁');
  });

  test('간식 포함', () => {
    expect(DietPage.MEALS).toContain('간식');
  });
});

// ────────────────────────────────────────
// DietPage.renderList (DOM)
// ────────────────────────────────────────
describe('DietPage.renderList()', () => {
  test('기록 없을 때 빈 상태 표시', () => {
    document.body.innerHTML = '<div id="diet-list"></div>';
    DietPage.renderList();
    expect(document.getElementById('diet-list').innerHTML).toContain('empty-state');
  });

  test('기록 있을 때 항목 렌더', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '닭가슴살', calories: 200 });
    document.body.innerHTML = '<div id="diet-list"></div>';
    DietPage.renderList();
    const list = document.getElementById('diet-list');
    expect(list.innerHTML).toContain('닭가슴살');
    expect(list.innerHTML).toContain('200');
  });

  test('날짜별 그룹핑 — 같은 날짜 묶음', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '아침식사' });
    Storage.add('diet', { date: '2026-01-01', meal: '점심', content: '점심식사' });
    Storage.add('diet', { date: '2026-01-02', meal: '아침', content: '아침2' });
    document.body.innerHTML = '<div id="diet-list"></div>';
    DietPage.renderList();
    const list = document.getElementById('diet-list');
    // 2개의 날짜 그룹이 있어야 함
    const cards = list.querySelectorAll('.card');
    expect(cards.length).toBe(2);
  });

  test('메모 XSS 이스케이프', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '테스트', memo: '<script>xss</script>' });
    document.body.innerHTML = '<div id="diet-list"></div>';
    DietPage.renderList();
    expect(document.getElementById('diet-list').innerHTML).not.toContain('<script>');
  });
});

// ────────────────────────────────────────
// DietPage.renderTodaySummary (DOM)
// ────────────────────────────────────────
describe('DietPage.renderTodaySummary()', () => {
  test('오늘 기록 없을 때 빈 상태', () => {
    document.body.innerHTML = '<div id="diet-today-summary"></div>';
    DietPage.renderTodaySummary();
    expect(document.getElementById('diet-today-summary').innerHTML).toBe('');
  });

  test('오늘 기록 있을 때 칼로리 합계 표시', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '아침', calories: 400 });
    Storage.add('diet', { date: '2026-01-01', meal: '점심', content: '점심', calories: 600 });
    document.body.innerHTML = '<div id="diet-today-summary"></div>';
    DietPage.renderTodaySummary();
    const el = document.getElementById('diet-today-summary');
    expect(el.innerHTML).toContain('1,000');
  });
});
