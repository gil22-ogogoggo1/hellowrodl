/**
 * tests/charts.test.js
 * Charts 모듈 단위 테스트
 */

global.formatDateShort = (d) => d ? String(d).slice(5) : '';

const { Charts } = require('../js/charts');

// ────────────────────────────────────────
// Charts._guard
// ────────────────────────────────────────
describe('Charts._guard()', () => {
  afterEach(() => {
    delete global.Chart;
  });

  test('Chart 미정의 시 false 반환', () => {
    global.Chart = undefined;
    const result = Charts._guard('test-canvas');
    expect(result).toBe(false);
  });

  test('Chart 미정의 시 캔버스 부모에 폴백 메시지 삽입', () => {
    global.Chart = undefined;
    document.body.innerHTML = '<div><canvas id="test-canvas"></canvas></div>';
    Charts._guard('test-canvas');
    expect(document.body.innerHTML).toContain('차트를 불러올 수 없습니다');
  });

  test('Chart 정의 시 true 반환', () => {
    global.Chart = class {};
    const result = Charts._guard('nonexistent-canvas');
    expect(result).toBe(true);
  });

  test('캔버스 없어도 Chart 없으면 false 반환', () => {
    global.Chart = undefined;
    const result = Charts._guard('no-such-canvas');
    expect(result).toBe(false);
  });
});

// ────────────────────────────────────────
// Charts._destroy
// ────────────────────────────────────────
describe('Charts._destroy()', () => {
  test('존재하는 차트 인스턴스에 destroy 호출', () => {
    const destroyMock = jest.fn();
    window._bodyChart = { destroy: destroyMock };
    Charts._destroy('_bodyChart');
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(window._bodyChart).toBeNull();
  });

  test('존재하지 않는 키는 에러 없이 처리', () => {
    expect(() => Charts._destroy('_nonexistentChart')).not.toThrow();
  });

  test('null인 키 처리', () => {
    window._testChart = null;
    expect(() => Charts._destroy('_testChart')).not.toThrow();
  });

  test('destroy 후 window 키가 null로 설정', () => {
    window._exFreqChart = { destroy: jest.fn() };
    Charts._destroy('_exFreqChart');
    expect(window._exFreqChart).toBeNull();
  });
});
