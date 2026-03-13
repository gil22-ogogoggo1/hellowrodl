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
  },

  init() {
    this.renderShell();
    this.navigateTo('dashboard');
  },

  renderShell() {
    document.body.innerHTML = `
      <div id="app">
        <header id="app-header">
          <h1 id="page-title">대시보드</h1>
          <span style="font-size:20px;" id="header-icon">🏠</span>
        </header>

        <div id="page-container"></div>

        <nav id="tab-nav">
          <button class="tab-btn active" data-tab="dashboard">
            <span class="tab-icon">🏠</span>
            <span>홈</span>
          </button>
          <button class="tab-btn" data-tab="mounjaro">
            <span class="tab-icon">💉</span>
            <span>투약</span>
          </button>
          <button class="tab-btn" data-tab="body">
            <span class="tab-icon">⚖️</span>
            <span>체중</span>
          </button>
          <button class="tab-btn" data-tab="exercise">
            <span class="tab-icon">🏃</span>
            <span>운동</span>
          </button>
          <button class="tab-btn" data-tab="diet">
            <span class="tab-icon">🥗</span>
            <span>식사</span>
          </button>
        </nav>

        <div id="toast"></div>

        <!-- 편집 바텀시트 모달 -->
        <div id="edit-modal" class="modal-overlay hidden">
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
  },

  navigateTo(tab) {
    if (!this.tabs.includes(tab)) return;
    this.currentTab = tab;

    // 탭 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 헤더 타이틀
    const titles = {
      dashboard: '핏저니',
      mounjaro:  '투약 기록',
      body:      '체중 / 인바디',
      exercise:  '운동 기록',
      diet:      '식사 기록',
    };
    const icons = {
      dashboard: '🏠',
      mounjaro:  '💉',
      body:      '⚖️',
      exercise:  '🏃',
      diet:      '🥗',
    };

    document.getElementById('page-title').textContent = titles[tab];
    document.getElementById('header-icon').textContent = icons[tab];

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
