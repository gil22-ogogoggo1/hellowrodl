/**
 * users.js — 다중 사용자 관리 모듈
 * 사용자 데이터는 localStorage에 mj_{userId}_{store} 형태로 저장
 */

const Users = {
  USERS_KEY:   'mj_users',
  CURRENT_KEY: 'mj_current_user',
  DATA_STORES: ['mounjaro', 'body', 'exercise', 'diet'],
  COLORS: ['#ff7829', '#4ade80', '#60a5fa', '#a78bfa', '#ffb300', '#ff4d3d', '#ffd166'],

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
    } catch { return []; }
  },

  _setAll(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  getCurrentId() {
    return localStorage.getItem(this.CURRENT_KEY) || null;
  },

  getCurrent() {
    const id = this.getCurrentId();
    return this.getAll().find(u => u.id === id) || null;
  },

  add(name) {
    const users = this.getAll();
    const id    = Date.now().toString();
    const color = this.COLORS[users.length % this.COLORS.length];
    const user  = { id, name: name.trim(), createdAt: new Date().toISOString(), color };
    users.push(user);
    this._setAll(users);
    return user;
  },

  switchTo(id) {
    localStorage.setItem(this.CURRENT_KEY, id);
  },

  remove(id) {
    const users = this.getAll().filter(u => u.id !== id);
    this._setAll(users);

    // 해당 사용자의 모든 데이터 삭제
    this.DATA_STORES.forEach(store => {
      localStorage.removeItem(`mj_${id}_${store}`);
    });
    localStorage.removeItem(`mj_${id}_profile`);

    // 현재 사용자였다면 첫 번째 남은 사용자로 전환
    if (this.getCurrentId() === id) {
      if (users.length > 0) this.switchTo(users[0].id);
      else localStorage.removeItem(this.CURRENT_KEY);
    }
  },

  rename(id, newName) {
    const users = this.getAll();
    const idx   = users.findIndex(u => u.id === id);
    if (idx === -1) return;
    users[idx].name = newName.trim();
    this._setAll(users);
  },

  // ── 앱 초기화 시 호출 ────────────────────────────────────────
  // 기존 데이터가 있으면 "기본 사용자"로 마이그레이션
  init() {
    const users = this.getAll();

    if (users.length === 0) {
      // 기존 데이터 존재 여부 확인 (구버전 키)
      const hasOldData = this.DATA_STORES.some(s => localStorage.getItem(`mj_${s}`));

      const defaultUser = this.add(hasOldData ? '기본 사용자' : '나');
      this.switchTo(defaultUser.id);

      if (hasOldData) {
        // 기존 데이터를 새 사용자 키로 이전
        this.DATA_STORES.forEach(store => {
          const old = localStorage.getItem(`mj_${store}`);
          if (old) {
            localStorage.setItem(`mj_${defaultUser.id}_${store}`, old);
            localStorage.removeItem(`mj_${store}`);
          }
        });
        // 프로필도 이전
        const oldProfile = localStorage.getItem('mj_profile');
        if (oldProfile) {
          localStorage.setItem(`mj_${defaultUser.id}_profile`, oldProfile);
          localStorage.removeItem('mj_profile');
        }
      }
      return;
    }

    // 현재 사용자가 유효한지 확인
    const currentId = this.getCurrentId();
    if (!currentId || !users.find(u => u.id === currentId)) {
      this.switchTo(users[0].id);
    }
  },
};

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { Users };
}
