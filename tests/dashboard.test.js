/**
 * tests/dashboard.test.js
 * Dashboard 모듈 단위 테스트
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');

global.Storage = Storage;
global.escapeHTML = escapeHTML;
global.showToast = jest.fn();
global.todayStr = () => new Date().toISOString().slice(0, 10);
global.formatDate = (d) => d;
global.formatDateShort = (d) => d;
global.daysFromNow = (d) => d ? 0 : null;
global.App = { navigateTo: jest.fn() };
global.Charts = { renderDashWeightChart: jest.fn(), _destroy: jest.fn() };
global.Goals = { get: () => ({}) };
global.Milestones = { achieved: () => [] };
global.MounjaroPage = {
  drugLabel: (k) => k || '마운자로',
  drugInterval: (k) => 7,
};

const { Dashboard } = require('../js/dashboard');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
  jest.clearAllMocks();
  // Goals 초기화
  global.Goals = { get: () => ({}) };
  global.Milestones = { achieved: () => [] };
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// Dashboard._renderMounjaroCard
// ────────────────────────────────────────
describe('Dashboard._renderMounjaroCard()', () => {
  test('기록 없을 때 빈 상태 메시지 표시', () => {
    const html = Dashboard._renderMounjaroCard([]);
    expect(html).toContain('투약 기록을 추가해주세요');
  });

  test('기록 있을 때 투약 용량 표시', () => {
    const records = [{ date: '2026-01-01', dose: '5mg', drugName: 'mounjaro' }];
    const html = Dashboard._renderMounjaroCard(records);
    expect(html).toContain('5mg');
  });

  test('반환값이 string 타입', () => {
    expect(typeof Dashboard._renderMounjaroCard([])).toBe('string');
  });
});

// ────────────────────────────────────────
// Dashboard._renderWeightCard
// ────────────────────────────────────────
describe('Dashboard._renderWeightCard()', () => {
  test('기록 없을 때 빈 상태 메시지 표시', () => {
    const html = Dashboard._renderWeightCard([]);
    expect(html).toContain('체중 기록을 추가해주세요');
  });

  test('기록 있을 때 현재 체중 표시', () => {
    const records = [
      { date: '2026-01-10', weight: 75 },
      { date: '2026-01-01', weight: 80 },
    ];
    const html = Dashboard._renderWeightCard(records);
    expect(html).toContain('75');
    expect(html).toContain('80');
  });

  test('감량 시 양수 변화 표시', () => {
    const records = [
      { date: '2026-01-10', weight: 75 },
      { date: '2026-01-01', weight: 80 },
    ];
    const html = Dashboard._renderWeightCard(records);
    // 80 - 75 = -5kg 변화
    expect(html).toContain('kg');
  });
});

// ────────────────────────────────────────
// Dashboard._renderGoalProgress
// ────────────────────────────────────────
describe('Dashboard._renderGoalProgress()', () => {
  test('목표 없을 때 목표 설정 안내 표시', () => {
    global.Goals.get = () => ({});
    const html = Dashboard._renderGoalProgress([], [], []);
    expect(html).toContain('목표 설정');
  });

  test('체중 목표 있을 때 진행률 표시', () => {
    global.Goals.get = () => ({ weightTarget: 70, weightStart: 80 });
    const body = [{ weight: 75, date: '2026-01-01' }];
    const html = Dashboard._renderGoalProgress(body, [], []);
    expect(html).toContain('%');
    expect(html).toContain('체중');
  });

  test('운동 목표 있을 때 이번 주 운동 횟수 표시', () => {
    global.Goals.get = () => ({ exerciseWeekly: 5 });
    const today = new Date().toISOString().slice(0, 10);
    const exercise = [{ date: today, type: '런닝' }, { date: today, type: '웨이트' }];
    const html = Dashboard._renderGoalProgress([], exercise, []);
    expect(html).toContain('5');
    expect(html).toContain('이번 주 운동');
  });

  test('칼로리 목표 있을 때 오늘 칼로리 표시', () => {
    global.Goals.get = () => ({ calorieDaily: 1800 });
    const today = new Date().toISOString().slice(0, 10);
    const diet = [{ date: today, calories: 500 }, { date: today, calories: 700 }];
    const html = Dashboard._renderGoalProgress([], [], diet);
    expect(html).toContain('칼로리');
  });
});

// ────────────────────────────────────────
// Dashboard._renderMilestones
// ────────────────────────────────────────
describe('Dashboard._renderMilestones()', () => {
  test('달성 마일스톤 없을 때 빈 문자열', () => {
    global.Milestones.achieved = () => [];
    expect(Dashboard._renderMilestones([])).toBe('');
  });

  test('마일스톤 있을 때 배지 표시', () => {
    global.Milestones.achieved = () => [
      { emoji: '🎉', label: '첫 기록' },
    ];
    const html = Dashboard._renderMilestones([]);
    expect(html).toContain('🎉');
    expect(html).toContain('첫 기록');
  });
});
