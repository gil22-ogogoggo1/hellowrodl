/**
 * storage.js — LocalStorage CRUD 유틸리티
 *
 * 의존성: 없음 (가장 먼저 로드되어야 함)
 * 전역 노출: escapeHTML(), KEYS, Storage, migrate(), SCHEMA_VERSION
 *
 * 사용 예시:
 *   const record = Storage.add('body', { date: '2026-03-10', weight: 75.3 });
 *   const all    = Storage.getAll('body');           // 날짜 내림차순
 *   const found  = Storage.getById('body', record.id);
 *   Storage.update('body', record.id, { weight: 74.8 });
 *   Storage.remove('body', record.id);
 */

// ── XSS 방지 유틸 ──
/**
 * HTML 특수문자를 이스케이프하여 XSS 공격을 방지한다.
 * 모든 사용자 입력을 innerHTML에 삽입하기 전에 반드시 적용할 것.
 * @param {*} str - 이스케이프할 문자열 (null/undefined 허용)
 * @returns {string} 이스케이프된 안전한 HTML 문자열
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * KEYS — 현재 사용자 ID를 동적으로 반영하는 LocalStorage 키 getter 객체.
 * mj_{currentUserId}_{store} 패턴. 사용자 전환 시 자동으로 올바른 키를 반환한다.
 *
 * ⚠️ 키 패턴 변경 금지: 변경 시 기존 사용자 데이터 유실.
 *    변경이 필요한 경우 migrate() 함수에 마이그레이션 로직을 먼저 작성할 것.
 */
const KEYS = {
  get mounjaro() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_mounjaro`; },
  get body()     { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_body`; },
  get exercise() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_exercise`; },
  get diet()     { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_diet`; },
};

const Storage = {
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * 지정 스토어의 모든 레코드를 날짜 내림차순으로 반환한다.
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @returns {object[]} 날짜 내림차순 정렬된 레코드 배열
   */
  getAll(store) {
    const items = this._get(KEYS[store]);
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  /**
   * 레코드를 추가한다. id(timestamp)와 createdAt(ISO8601)을 자동 생성한다.
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @param {object} record - 저장할 데이터 (date 필드 필수)
   * @returns {object} id, createdAt이 포함된 저장된 레코드
   */
  add(store, record) {
    const items = this._get(KEYS[store]);
    const newRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...record,
    };
    items.push(newRecord);
    this._set(KEYS[store], items);
    return newRecord;
  },

  /**
   * 기존 레코드를 부분 수정한다 (updatedAt 자동 갱신).
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @param {string} id - 수정할 레코드 id
   * @param {object} changes - 변경할 필드 (기존 필드는 유지됨)
   * @returns {object|null} 수정된 레코드, id 미존재 시 null
   */
  update(store, id, changes) {
    const items = this._get(KEYS[store]);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() };
    this._set(KEYS[store], items);
    return items[idx];
  },

  /**
   * 지정 id의 레코드를 삭제한다. id 미존재 시 무시.
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @param {string} id - 삭제할 레코드 id
   */
  remove(store, id) {
    const items = this._get(KEYS[store]);
    const filtered = items.filter(i => i.id !== id);
    this._set(KEYS[store], filtered);
  },

  /**
   * id로 단일 레코드를 조회한다.
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @param {string} id
   * @returns {object|null} 레코드 또는 null
   */
  getById(store, id) {
    const items = this._get(KEYS[store]);
    return items.find(i => i.id === id) || null;
  },

  /**
   * 최신 N건을 반환한다 (날짜 내림차순 기준).
   * @param {'mounjaro'|'body'|'exercise'|'diet'} store
   * @param {number} [n=5] - 가져올 레코드 수
   * @returns {object[]} 최신 N건 배열
   */
  getRecent(store, n = 5) {
    return this.getAll(store).slice(0, n);
  },
};

// ── 스키마 마이그레이션 ──
const SCHEMA_VERSION = 1;

function migrate() {
  const current = parseInt(localStorage.getItem('mj_version') || '0');
  if (current >= SCHEMA_VERSION) return;

  // v0 → v1: mounjaro 기록에 drugName 기본값 추가
  if (current < 1) {
    try {
      const key = KEYS.mounjaro;
      const raw = localStorage.getItem(key);
      if (raw) {
        const records = JSON.parse(raw);
        records.forEach(r => { if (!r.drugName) r.drugName = 'mounjaro'; });
        localStorage.setItem(key, JSON.stringify(records));
      }
    } catch(e) { /* 무시 */ }
  }

  localStorage.setItem('mj_version', SCHEMA_VERSION.toString());
}

// migrate()는 app.js에서 Users.init() 이후 명시적으로 호출

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { Storage, escapeHTML, migrate, KEYS, SCHEMA_VERSION };
}
