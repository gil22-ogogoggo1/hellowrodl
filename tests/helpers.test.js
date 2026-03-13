/**
 * tests/helpers.test.js
 * FormHelper, RenderHelper 단위 테스트
 */

const { FormHelper, RenderHelper } = require('../js/helpers');

// ────────────────────────────────────────
// FormHelper.parseNum
// ────────────────────────────────────────
describe('FormHelper.parseNum()', () => {
  test('float 파싱 — "75.3" → 75.3', () => {
    expect(FormHelper.parseNum('75.3')).toBe(75.3);
  });

  test('int 파싱 — "5" → 5', () => {
    expect(FormHelper.parseNum('5', 'int')).toBe(5);
  });

  test('빈 문자열 → null', () => {
    expect(FormHelper.parseNum('')).toBeNull();
  });

  test('null → null', () => {
    expect(FormHelper.parseNum(null)).toBeNull();
  });

  test('undefined → null', () => {
    expect(FormHelper.parseNum(undefined)).toBeNull();
  });

  test('"abc" (NaN) → null', () => {
    expect(FormHelper.parseNum('abc')).toBeNull();
  });

  test('0은 null이 아님', () => {
    expect(FormHelper.parseNum('0')).toBe(0);
    expect(FormHelper.parseNum('0', 'int')).toBe(0);
  });

  test('음수 파싱', () => {
    expect(FormHelper.parseNum('-5.5')).toBe(-5.5);
  });

  test('정수 float 파싱', () => {
    expect(FormHelper.parseNum('100')).toBe(100);
  });

  test('int 타입에서 소수는 정수 부분만', () => {
    expect(FormHelper.parseNum('5.9', 'int')).toBe(5);
  });
});

// ────────────────────────────────────────
// FormHelper.validate (DOM 의존)
// ────────────────────────────────────────
describe('FormHelper.validate()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="form-group">
        <input id="test-input" value="">
      </div>
    `;
  });

  test('빈값 검증 실패 시 false 반환', () => {
    const result = FormHelper.validate([
      { id: 'test-input', message: '필수 항목', test: (v) => v.trim() !== '' },
    ]);
    expect(result).toBe(false);
  });

  test('검증 통과 시 true 반환', () => {
    document.getElementById('test-input').value = '값있음';
    const result = FormHelper.validate([
      { id: 'test-input', message: '필수', test: (v) => v.trim() !== '' },
    ]);
    expect(result).toBe(true);
  });

  test('실패 시 has-error 클래스 추가', () => {
    FormHelper.validate([
      { id: 'test-input', message: '에러', test: () => false },
    ]);
    const group = document.getElementById('test-input').closest('.form-group');
    expect(group.classList.contains('has-error')).toBe(true);
  });

  test('clearErrors 호출 시 has-error 제거', () => {
    const group = document.getElementById('test-input').closest('.form-group');
    group.classList.add('has-error');
    FormHelper.clearErrors('test-input');
    expect(group.classList.contains('has-error')).toBe(false);
  });
});

// ────────────────────────────────────────
// RenderHelper.emptyState
// ────────────────────────────────────────
describe('RenderHelper.emptyState()', () => {
  test('icon과 message가 포함된 HTML 반환', () => {
    const html = RenderHelper.emptyState('⚖️', '기록 없음');
    expect(html).toContain('empty-state');
    expect(html).toContain('⚖️');
    expect(html).toContain('기록 없음');
  });

  test('empty-icon 클래스 포함', () => {
    const html = RenderHelper.emptyState('🏃', '운동 기록 없음');
    expect(html).toContain('empty-icon');
  });

  test('다양한 아이콘에 대응', () => {
    const html1 = RenderHelper.emptyState('💉', '투약 기록 없음');
    const html2 = RenderHelper.emptyState('🥗', '식사 기록 없음');
    expect(html1).toContain('💉');
    expect(html2).toContain('🥗');
  });

  test('반환값이 string 타입', () => {
    expect(typeof RenderHelper.emptyState('⚖️', '테스트')).toBe('string');
  });
});
