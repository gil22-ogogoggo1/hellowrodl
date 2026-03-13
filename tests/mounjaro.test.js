/**
 * tests/mounjaro.test.js
 * MounjaroPage 단위 테스트
 */

const { Storage, escapeHTML, KEYS } = require('../js/storage');

global.Storage = Storage;
global.escapeHTML = escapeHTML;
global.showToast = jest.fn();
global.todayStr = () => '2026-01-01';
global.formatDate = (d) => d;
global.daysFromNow = (d) => d ? 1 : null;
global.App = { Modal: { open: jest.fn(), close: jest.fn() } };
global.RenderHelper = {
  emptyState: (icon, msg) => `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`,
};

const { MounjaroPage } = require('../js/mounjaro');

let mockNow = 1710000000000;
beforeEach(() => {
  localStorage.clear();
  mockNow = 1710000000000;
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow++);
  jest.clearAllMocks();
});
afterEach(() => jest.restoreAllMocks());

// ────────────────────────────────────────
// MounjaroPage.drugLabel
// ────────────────────────────────────────
describe('MounjaroPage.drugLabel()', () => {
  test('mounjaro → 마운자로', () => {
    expect(MounjaroPage.drugLabel('mounjaro')).toBe('마운자로');
  });

  test('wegovy → 위고비', () => {
    expect(MounjaroPage.drugLabel('wegovy')).toBe('위고비');
  });

  test('saxenda → 삭센다', () => {
    expect(MounjaroPage.drugLabel('saxenda')).toBe('삭센다');
  });

  test('ozempic → 오젬픽', () => {
    expect(MounjaroPage.drugLabel('ozempic')).toBe('오젬픽');
  });

  test('other → 기타', () => {
    expect(MounjaroPage.drugLabel('other')).toBe('기타');
  });

  test('알 수 없는 키 → 키 그대로 반환', () => {
    expect(MounjaroPage.drugLabel('unknown_drug')).toBe('unknown_drug');
  });

  test('빈 문자열 → 기본값 마운자로', () => {
    expect(MounjaroPage.drugLabel('')).toBe('마운자로');
  });

  test('null → 기본값 마운자로', () => {
    expect(MounjaroPage.drugLabel(null)).toBe('마운자로');
  });
});

// ────────────────────────────────────────
// MounjaroPage.drugInterval
// ────────────────────────────────────────
describe('MounjaroPage.drugInterval()', () => {
  test('mounjaro → 7일', () => {
    expect(MounjaroPage.drugInterval('mounjaro')).toBe(7);
  });

  test('wegovy → 7일', () => {
    expect(MounjaroPage.drugInterval('wegovy')).toBe(7);
  });

  test('saxenda → 1일', () => {
    expect(MounjaroPage.drugInterval('saxenda')).toBe(1);
  });

  test('ozempic → 7일', () => {
    expect(MounjaroPage.drugInterval('ozempic')).toBe(7);
  });

  test('알 수 없는 키 → 기본값 7', () => {
    expect(MounjaroPage.drugInterval('unknown')).toBe(7);
  });

  test('null → 기본값 7', () => {
    expect(MounjaroPage.drugInterval(null)).toBe(7);
  });
});

// ────────────────────────────────────────
// MounjaroPage DRUGS 상수 검증
// ────────────────────────────────────────
describe('MounjaroPage.DRUGS 상수', () => {
  test('5가지 약품 포함', () => {
    const keys = Object.keys(MounjaroPage.DRUGS);
    expect(keys).toContain('mounjaro');
    expect(keys).toContain('wegovy');
    expect(keys).toContain('saxenda');
    expect(keys).toContain('ozempic');
    expect(keys).toContain('other');
  });

  test('각 약품에 doses 배열 존재', () => {
    Object.values(MounjaroPage.DRUGS).forEach(drug => {
      expect(Array.isArray(drug.doses)).toBe(true);
      expect(drug.doses.length).toBeGreaterThan(0);
    });
  });

  test('각 약품에 interval 존재', () => {
    Object.values(MounjaroPage.DRUGS).forEach(drug => {
      expect(typeof drug.interval).toBe('number');
    });
  });
});

// ────────────────────────────────────────
// MounjaroPage.renderList (DOM 테스트)
// ────────────────────────────────────────
describe('MounjaroPage.renderList()', () => {
  test('기록 없을 때 빈 상태 표시', () => {
    document.body.innerHTML = '<div id="mj-list"></div>';
    MounjaroPage.renderList();
    expect(document.getElementById('mj-list').innerHTML).toContain('empty-state');
  });

  test('기록 있을 때 항목 렌더', () => {
    Storage.add('mounjaro', {
      date: '2026-01-01',
      drugName: 'mounjaro',
      dose: '5mg',
      site: '복부',
      cost: 150000,
      sideEffects: [],
      memo: '',
    });
    document.body.innerHTML = '<div id="mj-list"></div>';
    MounjaroPage.renderList();
    const list = document.getElementById('mj-list');
    expect(list.innerHTML).toContain('5mg');
    expect(list.innerHTML).toContain('마운자로');
  });
});
