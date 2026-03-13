/**
 * app.js — SPA 초기화 및 탭 라우팅
 */

const App = {
  currentTab: 'dashboard',

  tabs: ['dashboard', 'mounjaro', 'body', 'exercise', 'diet'],

  pageModules: {
    dashboard: () => Dashboard.render(),
    mounjaro:  () => MounjaroPage.render(),
    body:      () => BodyPage.render(),
    exercise:  () => ExercisePage.render(),
    diet:      () => DietPage.render(),
    settings:  () => SettingsPage.render(),
  },

  init() {
    Users.init();          // 사용자 초기화 (기존 데이터 마이그레이션 포함)
    migrate();             // 현재 사용자의 스키마 마이그레이션
    AppSettings.applyTheme(); // 저장된 테마 적용
    this.renderShell();
    this.navigateTo('dashboard');
  },

  renderShell() {
    const user = Users.getCurrent();
    const avatarChar = user ? escapeHTML(user.name[0]) : '?';
    const avatarColor = user ? user.color : 'var(--orange)';

    document.body.innerHTML = `
      <div id="app">
        <header id="app-header">
          <h1 id="page-title">대시보드</h1>
          <div style="display:flex;align-items:center;gap:8px;">
            <button id="settings-btn" class="btn btn-ghost btn-sm" onclick="App.navigateTo('settings')" aria-label="설정" style="font-size:18px;padding:6px 10px;">⚙️</button>
            <button id="user-avatar-btn" class="user-avatar-btn" style="background:${avatarColor}" title="${user ? escapeHTML(user.name) : ''}" aria-label="사용자 전환" onclick="App.openUserModal()">${avatarChar}</button>
          </div>
        </header>

        <nav id="tab-nav" role="tablist" aria-label="메인 메뉴">
          <button class="tab-btn active" role="tab" data-tab="dashboard" aria-selected="true" aria-label="홈 대시보드">
            <span class="tab-icon" aria-hidden="true">🏠</span>
            <span>홈</span>
          </button>
          <button class="tab-btn" role="tab" data-tab="mounjaro" aria-selected="false" aria-label="투약 기록">
            <span class="tab-icon" aria-hidden="true">💉</span>
            <span>투약</span>
          </button>
          <button class="tab-btn" role="tab" data-tab="body" aria-selected="false" aria-label="체중 인바디 기록">
            <span class="tab-icon" aria-hidden="true">⚖️</span>
            <span>체중</span>
          </button>
          <button class="tab-btn" role="tab" data-tab="exercise" aria-selected="false" aria-label="운동 기록">
            <span class="tab-icon" aria-hidden="true">🏃</span>
            <span>운동</span>
          </button>
          <button class="tab-btn" role="tab" data-tab="diet" aria-selected="false" aria-label="식사 기록">
            <span class="tab-icon" aria-hidden="true">🥗</span>
            <span>식사</span>
          </button>
        </nav>

        <div id="page-container" role="tabpanel" aria-live="polite"></div>

        <div id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

        <!-- 편집 / 사용자 바텀시트 모달 -->
        <div id="edit-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title-sr">
          <span id="modal-title-sr" class="sr-only">편집 모달</span>
          <div class="modal-sheet">
            <div class="modal-handle"></div>
            <div id="edit-modal-content"></div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigateTo(btn.dataset.tab);
      });
    });

    // 오버레이 클릭 시 모달 닫기
    document.getElementById('edit-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('edit-modal')) {
        App.Modal.close();
      }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('edit-modal');
        if (modal && !modal.classList.contains('hidden')) {
          App.Modal.close();
        }
      }
    });
  },

  navigateTo(tab) {
    if (!this.pageModules[tab]) return;
    this.currentTab = tab;

    // 탭 버튼 활성화 (설정 페이지는 탭 하이라이트 없음)
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 헤더 타이틀
    const titles = {
      dashboard: '핏저니',
      mounjaro:  '투약 기록',
      body:      '체중 / 인바디',
      exercise:  '운동 기록',
      diet:      '식사 기록',
      settings:  '설정',
    };

    document.getElementById('page-title').textContent = titles[tab];

    // 페이지 렌더
    const container = document.getElementById('page-container');
    container.scrollTop = 0;

    if (this.pageModules[tab]) {
      this.pageModules[tab]();
    }
  },

  // ── 편집 모달 공통 ──
  Modal: {
    open(contentHTML) {
      const modal = document.getElementById('edit-modal');
      document.getElementById('edit-modal-content').innerHTML = contentHTML;
      modal.classList.remove('hidden');
    },
    close() {
      document.getElementById('edit-modal').classList.add('hidden');
      document.getElementById('edit-modal-content').innerHTML = '';
    },
  },

  // ── 사용자 관리 ──
  renderUserButton() {
    const btn = document.getElementById('user-avatar-btn');
    if (!btn) return;
    const user = Users.getCurrent();
    if (user) {
      btn.textContent = user.name[0];
      btn.style.background = user.color;
      btn.title = user.name;
    }
  },

  openUserModal() {
    const users = Users.getAll();
    const currentId = Users.getCurrentId();

    const userItems = users.map(u => {
      const isCurrent = u.id === currentId;
      const switchBtn = !isCurrent
        ? `<button class="btn btn-sm btn-ghost" onclick="App.switchUser('${u.id}')">전환</button>`
        : '';
      const deleteBtn = users.length > 1
        ? `<button class="btn btn-sm btn-danger" onclick="App.deleteUser('${u.id}')">삭제</button>`
        : '';
      return `
        <div class="user-list-item${isCurrent ? ' current' : ''}">
          <div class="user-color-dot" style="background:${u.color}">${escapeHTML(u.name[0])}</div>
          <span class="user-list-name">${escapeHTML(u.name)}</span>
          ${isCurrent ? '<span class="user-current-badge">현재</span>' : ''}
          <div class="user-list-actions">
            ${switchBtn}
            <button class="btn btn-sm btn-ghost" onclick="App.renameUser('${u.id}')">이름변경</button>
            ${deleteBtn}
          </div>
        </div>
      `;
    }).join('');

    App.Modal.open(`
      <div class="modal-title">사용자 관리</div>
      <div id="user-list">${userItems}</div>
      <div class="user-add-form">
        <input id="new-user-name" type="text" class="form-input" placeholder="새 사용자 이름" maxlength="20"
          onkeydown="if(event.key==='Enter') App.addUser()">
        <button class="btn btn-primary" onclick="App.addUser()">추가</button>
      </div>
    `);

    // 입력창에 포커스
    setTimeout(() => {
      const input = document.getElementById('new-user-name');
      if (input) input.focus();
    }, 100);
  },

  switchUser(id) {
    Users.switchTo(id);
    migrate(); // 새로 전환된 사용자의 스키마 마이그레이션
    App.Modal.close();
    this.renderUserButton();
    this.navigateTo(this.currentTab);
    const user = Users.getCurrent();
    showToast(`${user ? escapeHTML(user.name) : ''} 으로 전환됨`);
  },

  addUser() {
    const input = document.getElementById('new-user-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) { showToast('이름을 입력하세요'); return; }

    const user = Users.add(name);
    Users.switchTo(user.id);
    App.Modal.close();
    this.renderUserButton();
    this.navigateTo(this.currentTab);
    showToast(`${escapeHTML(name)} 추가됨`);
  },

  deleteUser(id) {
    const users = Users.getAll();
    if (users.length <= 1) { showToast('마지막 사용자는 삭제할 수 없습니다'); return; }
    const user = users.find(u => u.id === id);
    if (!confirm(`"${user?.name}" 사용자와 모든 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    Users.remove(id);
    App.Modal.close();
    this.renderUserButton();
    this.navigateTo(this.currentTab);
    showToast('삭제됨');
  },

  renameUser(id) {
    const user = Users.getAll().find(u => u.id === id);
    if (!user) return;
    const newName = prompt('새 이름을 입력하세요:', user.name);
    if (!newName || !newName.trim()) return;
    Users.rename(id, newName);
    this.openUserModal(); // 모달 내용 갱신
    if (id === Users.getCurrentId()) this.renderUserButton();
    showToast('이름이 변경됨');
  },
};

// 토스트 알림
function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// 날짜 포맷 유틸
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 며칠 후인지 계산
function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// DOMContentLoaded 시 앱 부트
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { App, showToast, formatDate, formatDateShort, todayStr, daysFromNow };
}
