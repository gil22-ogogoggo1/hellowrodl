/**
 * settings.js — 목표 설정, 앱 설정, 데이터 내보내기/가져오기
 */

// ── 목표 (사용자별) ──────────────────────────────────────────
const Goals = {
  get KEY() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_goals`; },

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; }
  },

  save(data) {
    const cur = this.get();
    localStorage.setItem(this.KEY, JSON.stringify({ ...cur, ...data }));
  },
};

// ── 앱 전역 설정 (테마 등) ────────────────────────────────────
const AppSettings = {
  KEY: 'mj_settings',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; }
  },

  save(data) {
    const cur = this.get();
    localStorage.setItem(this.KEY, JSON.stringify({ ...cur, ...data }));
  },

  applyTheme() {
    const theme = this.get().theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  },
};

// ── 데이터 내보내기 / 가져오기 ─────────────────────────────────
const DataIO = {
  exportAll() {
    const userId = localStorage.getItem('mj_current_user') || 'default';
    const user   = (Users.getAll().find(u => u.id === userId)) || { name: '사용자' };

    const stores = ['mounjaro', 'body', 'exercise', 'diet'];
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userId,
      userName: user.name,
      data: {},
    };
    stores.forEach(s => {
      backup.data[s] = Storage.getAll(s);
    });
    try {
      backup.profile  = JSON.parse(localStorage.getItem(Profile.KEY)) || null;
      backup.goals    = Goals.get();
    } catch { /* 무시 */ }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fitjourney_${userId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ 백업 파일이 다운로드됩니다.');
  },

  importAll(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.data) throw new Error('형식 오류');

        const userId = localStorage.getItem('mj_current_user') || 'default';
        const stores = ['mounjaro', 'body', 'exercise', 'diet'];

        stores.forEach(s => {
          if (Array.isArray(backup.data[s])) {
            localStorage.setItem(KEYS[s], JSON.stringify(backup.data[s]));
          }
        });
        if (backup.profile) {
          localStorage.setItem(Profile.KEY, JSON.stringify(backup.profile));
        }
        if (backup.goals) {
          Goals.save(backup.goals);
        }

        showToast(`✅ 복원 완료 (${backup.userName || '사용자'})`);
        App.navigateTo(App.currentTab);
      } catch {
        showToast('❌ 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  },
};

// ── 마일스톤 ────────────────────────────────────────────────
const Milestones = {
  BADGES: [
    { kg: 2,  emoji: '🌱', label: '2kg 감량 달성!' },
    { kg: 5,  emoji: '🎯', label: '5kg 감량 달성!' },
    { kg: 10, emoji: '🏆', label: '10kg 감량 달성!' },
    { kg: 15, emoji: '💎', label: '15kg 감량 달성!' },
    { kg: 20, emoji: '👑', label: '20kg 감량 달성!' },
  ],

  // 달성한 마일스톤 목록 반환
  achieved() {
    const goals = Goals.get();
    const records = Storage.getAll('body').filter(r => r.weight);
    if (records.length < 2) return [];

    const start   = goals.weightStart
      ? parseFloat(goals.weightStart)
      : parseFloat(records[records.length - 1].weight);
    const current = parseFloat(records[0].weight);
    const lost    = start - current;

    return this.BADGES.filter(b => lost >= b.kg);
  },
};

// ── 설정 페이지 ──────────────────────────────────────────────
const SettingsPage = {
  render() {
    const container = document.getElementById('page-container');
    const goals     = Goals.get();
    const settings  = AppSettings.get();
    const theme     = settings.theme || 'dark';

    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 목표 설정 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🎯 목표 설정</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">시작 체중 (kg)</label>
            <input type="number" class="form-input" id="goal-weight-start"
              placeholder="예: 85" step="0.1" min="30" max="250"
              value="${goals.weightStart || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">목표 체중 (kg)</label>
            <input type="number" class="form-input" id="goal-weight-target"
              placeholder="예: 70" step="0.1" min="30" max="250"
              value="${goals.weightTarget || ''}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">주간 운동 목표 (회)</label>
            <input type="number" class="form-input" id="goal-exercise"
              placeholder="예: 3" min="1" max="14"
              value="${goals.exerciseWeekly || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">일일 칼로리 목표 (kcal)</label>
            <input type="number" class="form-input" id="goal-calorie"
              placeholder="예: 1500" min="500" max="5000"
              value="${goals.calorieDaily || ''}">
          </div>
        </div>

        <button class="btn btn-primary" onclick="SettingsPage.saveGoals()">목표 저장</button>
      </div>

      <!-- 테마 설정 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🎨 화면 테마</span>
        </div>
        <div class="theme-options">
          <button class="theme-btn ${theme === 'dark' ? 'active' : ''}"
            onclick="SettingsPage.setTheme('dark')">
            🌙 다크
          </button>
          <button class="theme-btn ${theme === 'light' ? 'active' : ''}"
            onclick="SettingsPage.setTheme('light')">
            ☀️ 라이트
          </button>
        </div>
      </div>

      <!-- 데이터 백업 / 복원 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">💾 데이터 백업 · 복원</span>
        </div>
        <p class="text-dim" style="font-size:13px;margin-bottom:14px;">
          모든 기록을 JSON 파일로 저장하거나 이전 백업을 불러옵니다.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost" onclick="DataIO.exportAll()">📤 백업 다운로드</button>
          <label class="btn btn-ghost" style="cursor:pointer;">
            📥 백업 복원
            <input type="file" accept=".json" style="display:none;"
              onchange="DataIO.importAll(this.files[0])">
          </label>
        </div>
        <p class="text-dim" style="font-size:11px;margin-top:10px;">
          ⚠️ 복원 시 현재 사용자의 기존 데이터가 덮어씌워집니다.
        </p>
      </div>

      <!-- 앱 정보 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">ℹ️ 앱 정보</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text-sub);">
          <span>앱 이름: 핏저니 (FitJourney)</span>
          <span>버전: Sprint 6 완성판</span>
          <span>저장소: 브라우저 LocalStorage</span>
          <span>서버 없이 모든 데이터는 이 기기에만 저장됩니다.</span>
        </div>
      </div>

      <div style="height:24px;"></div>
    `;
  },

  saveGoals() {
    const weightStart  = document.getElementById('goal-weight-start').value;
    const weightTarget = document.getElementById('goal-weight-target').value;
    const exercise     = document.getElementById('goal-exercise').value;
    const calorie      = document.getElementById('goal-calorie').value;

    Goals.save({
      weightStart:    weightStart  ? parseFloat(weightStart)  : null,
      weightTarget:   weightTarget ? parseFloat(weightTarget) : null,
      exerciseWeekly: exercise     ? parseInt(exercise)       : null,
      calorieDaily:   calorie      ? parseInt(calorie)        : null,
    });
    showToast('✅ 목표가 저장되었습니다.');
  },

  setTheme(theme) {
    AppSettings.save({ theme });
    AppSettings.applyTheme();
    this.render(); // 버튼 활성 상태 갱신
    showToast(theme === 'dark' ? '🌙 다크 테마 적용' : '☀️ 라이트 테마 적용');
  },
};

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { Goals, AppSettings, Milestones };
}
