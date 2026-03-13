/**
 * tests/exercise.test.js
 * ExercisePage 단위 테스트
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');

global.Storage = Storage;
global.escapeHTML = escapeHTML;
global.showToast = jest.fn();
global.todayStr = () => '2026-01-01';
global.formatDate = (d) => d;
global.Charts = {
  renderExerciseFreqChart: jest.fn(),
  _destroy: jest.fn(),
};
global.App = { Modal: { open: jest.fn(), close: jest.fn() } };
global.Sync = { importSamsungZip: jest.fn(), importSamsungExercise: jest.fn() };
global.RenderHelper = {
  emptyState: (icon, msg) => `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`,
};

const { ExercisePage } = require('../js/exercise');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
  jest.clearAllMocks();
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// ExercisePage.TYPES 상수 검증
// ────────────────────────────────────────
describe('ExercisePage.TYPES', () => {
  test('6가지 운동 종류 포함', () => {
    expect(ExercisePage.TYPES).toHaveLength(6);
  });

  test('런닝 포함', () => {
    expect(ExercisePage.TYPES).toContain('런닝');
  });

  test('웨이트 포함', () => {
    expect(ExercisePage.TYPES).toContain('웨이트');
  });

  test('수영 포함', () => {
    expect(ExercisePage.TYPES).toContain('수영');
  });
});

// ────────────────────────────────────────
// ExercisePage.renderList (DOM)
// ────────────────────────────────────────
describe('ExercisePage.renderList()', () => {
  test('기록 없을 때 빈 상태 표시', () => {
    document.body.innerHTML = '<div id="exercise-list"></div>';
    ExercisePage.renderList();
    expect(document.getElementById('exercise-list').innerHTML).toContain('empty-state');
  });

  test('런닝 기록 렌더', () => {
    Storage.add('exercise', { date: '2026-01-01', type: '런닝', distance: 5.0, duration: 30 });
    document.body.innerHTML = '<div id="exercise-list"></div>';
    ExercisePage.renderList();
    const list = document.getElementById('exercise-list');
    expect(list.innerHTML).toContain('런닝');
    expect(list.innerHTML).toContain('5');
  });

  test('웨이트 세트 정보 렌더', () => {
    Storage.add('exercise', {
      date: '2026-01-01',
      type: '웨이트',
      sets: [{ name: '벤치프레스', sets: 3, weight: 60, reps: 10 }],
    });
    document.body.innerHTML = '<div id="exercise-list"></div>';
    ExercisePage.renderList();
    const list = document.getElementById('exercise-list');
    expect(list.innerHTML).toContain('벤치프레스');
  });
});

// ────────────────────────────────────────
// ExercisePage.renderSummary (DOM)
// ────────────────────────────────────────
describe('ExercisePage.renderSummary()', () => {
  test('기록 없을 때 빈 상태', () => {
    document.body.innerHTML = '<div id="exercise-summary"></div>';
    ExercisePage.renderSummary();
    expect(document.getElementById('exercise-summary').innerHTML).toBe('');
  });

  test('운동 기록 있을 때 이번 달 통계 표시', () => {
    const today = new Date().toISOString().slice(0, 10);
    Storage.add('exercise', { date: today, type: '런닝', distance: 5 });
    document.body.innerHTML = '<div id="exercise-summary"></div>';
    ExercisePage.renderSummary();
    const el = document.getElementById('exercise-summary');
    expect(el.innerHTML).toContain('회');
  });
});
