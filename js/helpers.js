/**
 * helpers.js — 폼/렌더링 공통 헬퍼 유틸
 * 로드 순서: users.js 이후, charts.js 이전
 */

const FormHelper = {
  /**
   * 숫자 안전 파싱 (빈값/NaN → null)
   * @param {string|number} value
   * @param {'float'|'int'} type
   * @returns {number|null}
   */
  parseNum(value, type = 'float') {
    if (value === '' || value === null || value === undefined) return null;
    const n = type === 'int' ? parseInt(value, 10) : parseFloat(value);
    return isNaN(n) ? null : n;
  },

  /**
   * 인라인 에러 표시
   * @param {string} fieldId - input의 id
   * @param {string} message - 에러 메시지
   */
  setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    let errEl = group.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'form-error';
      errEl.setAttribute('role', 'alert');
      input.after(errEl);
    }
    errEl.textContent = message;
  },

  /**
   * 인라인 에러 초기화
   * @param {...string} fieldIds
   */
  clearErrors(...fieldIds) {
    fieldIds.forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      const group = input.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  },

  /**
   * 검증 규칙 실행 — 실패한 룰에 인라인 에러 표시
   * @param {Array<{id: string, message: string, test: function}>} rules
   * @returns {boolean} 모두 통과하면 true
   */
  validate(rules) {
    const fieldIds = rules.map(r => r.id).filter(Boolean);
    this.clearErrors(...fieldIds);
    let valid = true;
    rules.forEach(({ id, message, test }) => {
      const input = id ? document.getElementById(id) : null;
      const value = input ? input.value : '';
      if (!test(value, input)) {
        if (id) this.setError(id, message);
        valid = false;
      }
    });
    return valid;
  },

  /**
   * 더블 제출 방지 래퍼
   * @param {HTMLElement} btn
   * @param {Function} fn
   */
  withSubmitGuard(btn, fn) {
    if (!btn || btn._submitting) return;
    btn._submitting = true;
    const orig = btn.textContent;
    btn.classList.add('loading');
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        result.finally(() => {
          btn._submitting = false;
          btn.classList.remove('loading');
          btn.textContent = orig;
        });
      } else {
        btn._submitting = false;
        btn.classList.remove('loading');
      }
    } catch (e) {
      btn._submitting = false;
      btn.classList.remove('loading');
      throw e;
    }
  },

  /**
   * 로딩 상태 토글
   * @param {HTMLElement|string} btnOrId
   * @param {boolean} loading
   * @param {string} [text]
   */
  setLoading(btnOrId, loading, text) {
    const btn = typeof btnOrId === 'string'
      ? document.getElementById(btnOrId)
      : btnOrId;
    if (!btn) return;
    if (loading) {
      btn._origText = btn.textContent;
      btn.classList.add('loading');
      if (text) btn.textContent = text;
    } else {
      btn.classList.remove('loading');
      if (btn._origText !== undefined) {
        btn.textContent = btn._origText;
      }
    }
  },
};

const RenderHelper = {
  /**
   * 빈 상태 HTML 생성
   * @param {string} icon
   * @param {string} message
   * @returns {string}
   */
  emptyState(icon, message) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <p>${message}</p>
      </div>`;
  },
};

if (typeof module !== 'undefined') {
  module.exports = { FormHelper, RenderHelper };
}
