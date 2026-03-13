/**
 * body.js — 체중 / 인바디 기록 페이지
 */

const BodyPage = {
  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 요약 카드 -->
      <div id="body-summary"></div>

      <!-- 체중 그래프 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📈 체중 변화</span>
          <span class="text-dim" style="font-size:12px;" id="body-period-label"></span>
        </div>
        <div class="chart-wrap">
          <canvas id="body-chart"></canvas>
        </div>
      </div>

      <!-- 입력 폼 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚖️ 새 기록 입력</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">날짜</label>
            <input type="date" class="form-input" id="body-date" value="${todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">체중 (kg)</label>
            <input type="number" class="form-input" id="body-weight" placeholder="예: 75.3" step="0.1" min="30" max="250">
          </div>
        </div>

        <details style="margin-bottom:14px;">
          <summary style="cursor:pointer; color:var(--text-sub); font-size:13px; user-select:none;">
            인바디 상세 입력 (선택)
          </summary>
          <div style="margin-top:12px;">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">체지방률 (%)</label>
                <input type="number" class="form-input" id="body-fat" placeholder="예: 28.5" step="0.1" min="0" max="70">
              </div>
              <div class="form-group">
                <label class="form-label">골격근량 (kg)</label>
                <input type="number" class="form-input" id="body-muscle" placeholder="예: 28.0" step="0.1" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">BMI</label>
                <input type="number" class="form-input" id="body-bmi" placeholder="예: 24.5" step="0.1" min="10" max="60">
              </div>
              <div class="form-group">
                <label class="form-label">체수분 (kg)</label>
                <input type="number" class="form-input" id="body-water" placeholder="예: 35.2" step="0.1" min="0">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">내장지방 레벨</label>
              <input type="number" class="form-input" id="body-visceral" placeholder="예: 8" min="1" max="30">
            </div>
          </div>
        </details>

        <div class="form-group">
          <label class="form-label">메모</label>
          <input type="text" class="form-input" id="body-memo" placeholder="컨디션, 특이사항 등">
        </div>

        <button class="btn btn-primary" id="body-save-btn">기록 저장</button>
      </div>

      <!-- 기록 리스트 -->
      <div class="card-header mt-16">
        <span class="card-title">📋 체중 기록</span>
      </div>
      <div id="body-list" class="record-list"></div>
    `;

    document.getElementById('body-save-btn').addEventListener('click', () => this.save());
    this.renderSummary();
    this.renderChart();
    this.renderList();
  },

  save() {
    const date    = document.getElementById('body-date').value;
    const weight  = document.getElementById('body-weight').value;
    const fat     = document.getElementById('body-fat').value;
    const muscle  = document.getElementById('body-muscle').value;
    const bmi     = document.getElementById('body-bmi').value;
    const water   = document.getElementById('body-water').value;
    const visceral = document.getElementById('body-visceral').value;
    const memo    = document.getElementById('body-memo').value.trim();

    if (!date) { showToast('날짜를 입력해주세요.'); return; }
    if (!weight) { showToast('체중을 입력해주세요.'); return; }

    Storage.add('body', {
      date,
      weight:   parseFloat(weight),
      fat:      fat ? parseFloat(fat) : null,
      muscle:   muscle ? parseFloat(muscle) : null,
      bmi:      bmi ? parseFloat(bmi) : null,
      water:    water ? parseFloat(water) : null,
      visceral: visceral ? parseInt(visceral) : null,
      memo,
    });

    showToast('✅ 체중 기록이 저장되었습니다.');
    document.getElementById('body-date').value = todayStr();
    document.getElementById('body-weight').value = '';
    document.getElementById('body-fat').value = '';
    document.getElementById('body-muscle').value = '';
    document.getElementById('body-bmi').value = '';
    document.getElementById('body-water').value = '';
    document.getElementById('body-visceral').value = '';
    document.getElementById('body-memo').value = '';

    this.renderSummary();
    this.renderChart();
    this.renderList();
  },

  renderSummary() {
    const el = document.getElementById('body-summary');
    if (!el) return;
    const records = Storage.getAll('body').filter(r => r.weight);

    if (records.length === 0) {
      el.innerHTML = '';
      return;
    }

    const latest = records[0];
    const oldest = records[records.length - 1];
    const diff   = (latest.weight - oldest.weight).toFixed(1);
    const diffClass = diff <= 0 ? 'pos' : 'neg';
    const diffSign  = diff > 0 ? '+' : '';

    el.innerHTML = `
      <div class="dash-grid" style="margin-bottom:12px;">
        <div class="dash-card">
          <div class="stat-label">현재 체중</div>
          <div class="stat-big text-amber">${latest.weight}<span class="stat-unit">kg</span></div>
          <div class="stat-label">${formatDate(latest.date)}</div>
        </div>
        <div class="dash-card">
          <div class="stat-label">시작 대비</div>
          <div class="stat-big"><span class="stat-change ${diffClass}">${diffSign}${diff}kg</span></div>
          <div class="stat-label">시작: ${oldest.weight}kg</div>
        </div>
        ${latest.fat ? `
        <div class="dash-card">
          <div class="stat-label">체지방률</div>
          <div class="stat-big">${latest.fat}<span class="stat-unit">%</span></div>
        </div>` : ''}
        ${latest.muscle ? `
        <div class="dash-card">
          <div class="stat-label">골격근량</div>
          <div class="stat-big">${latest.muscle}<span class="stat-unit">kg</span></div>
        </div>` : ''}
      </div>
    `;
  },

  renderChart() {
    const records = Storage.getAll('body')
      .filter(r => r.weight)
      .slice(0, 30)
      .reverse();

    const canvas = document.getElementById('body-chart');
    if (!canvas) return;

    const periodLabel = document.getElementById('body-period-label');
    if (records.length > 0 && periodLabel) {
      periodLabel.textContent = `최근 ${records.length}회`;
    }

    if (window._bodyChart) {
      window._bodyChart.destroy();
      window._bodyChart = null;
    }

    if (records.length < 2) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.parentElement.innerHTML += `<p class="text-dim" style="text-align:center;font-size:13px;margin-top:8px;">데이터 2개 이상 입력 시 그래프가 표시됩니다.</p>`;
      return;
    }

    Charts.renderWeightChart('body-chart', records);
  },

  renderList() {
    const records = Storage.getAll('body');
    const el = document.getElementById('body-list');
    if (!el) return;

    if (records.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚖️</div>
          <p>아직 체중 기록이 없습니다.</p>
        </div>`;
      return;
    }

    el.innerHTML = records.map(r => {
      const inbodyBadges = [];
      if (r.fat !== null && r.fat !== undefined) inbodyBadges.push(`체지방 ${r.fat}%`);
      if (r.muscle !== null && r.muscle !== undefined) inbodyBadges.push(`근육 ${r.muscle}kg`);
      if (r.bmi !== null && r.bmi !== undefined) inbodyBadges.push(`BMI ${r.bmi}`);

      return `
        <div class="record-item">
          <div class="record-icon amber">⚖️</div>
          <div class="record-body">
            <div class="record-title">${formatDate(r.date)} · <span class="text-amber">${r.weight}kg</span></div>
            ${inbodyBadges.length ? `<div class="record-meta mt-4">${inbodyBadges.join(' · ')}</div>` : ''}
            ${r.memo ? `<div class="record-meta mt-4">"${escapeHTML(r.memo)}"</div>` : ''}
          </div>
          <div class="record-actions">
            <button class="btn btn-edit btn-sm" onclick="BodyPage.openEdit('${r.id}')">편집</button>
            <button class="btn btn-danger btn-sm" onclick="BodyPage.remove('${r.id}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openEdit(id) {
    const r = Storage.getById('body', id);
    if (!r) return;

    App.Modal.open(`
      <h2 class="modal-title">⚖️ 체중 기록 편집</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">날짜</label>
          <input type="date" class="form-input" id="body-edit-date" value="${r.date}">
        </div>
        <div class="form-group">
          <label class="form-label">체중 (kg)</label>
          <input type="number" class="form-input" id="body-edit-weight" value="${r.weight || ''}" step="0.1" min="30" max="250">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">체지방률 (%)</label>
          <input type="number" class="form-input" id="body-edit-fat" value="${r.fat ?? ''}" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">골격근량 (kg)</label>
          <input type="number" class="form-input" id="body-edit-muscle" value="${r.muscle ?? ''}" step="0.1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">BMI</label>
          <input type="number" class="form-input" id="body-edit-bmi" value="${r.bmi ?? ''}" step="0.1">
        </div>
        <div class="form-group">
          <label class="form-label">체수분 (kg)</label>
          <input type="number" class="form-input" id="body-edit-water" value="${r.water ?? ''}" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">내장지방 레벨</label>
        <input type="number" class="form-input" id="body-edit-visceral" value="${r.visceral ?? ''}" min="1" max="30">
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <input type="text" class="form-input" id="body-edit-memo" value="${escapeHTML(r.memo || '')}">
      </div>
      <button class="btn btn-primary" onclick="BodyPage.saveEdit('${id}')">수정 완료</button>
    `);
  },

  saveEdit(id) {
    const date     = document.getElementById('body-edit-date').value;
    const weight   = document.getElementById('body-edit-weight').value;
    const fat      = document.getElementById('body-edit-fat').value;
    const muscle   = document.getElementById('body-edit-muscle').value;
    const bmi      = document.getElementById('body-edit-bmi').value;
    const water    = document.getElementById('body-edit-water').value;
    const visceral = document.getElementById('body-edit-visceral').value;
    const memo     = document.getElementById('body-edit-memo').value.trim();

    if (!date)   { showToast('날짜를 입력해주세요.'); return; }
    if (!weight) { showToast('체중을 입력해주세요.'); return; }

    Storage.update('body', id, {
      date,
      weight:   parseFloat(weight),
      fat:      fat ? parseFloat(fat) : null,
      muscle:   muscle ? parseFloat(muscle) : null,
      bmi:      bmi ? parseFloat(bmi) : null,
      water:    water ? parseFloat(water) : null,
      visceral: visceral ? parseInt(visceral) : null,
      memo,
    });

    App.Modal.close();
    showToast('✅ 수정되었습니다.');
    this.renderSummary();
    this.renderChart();
    this.renderList();
  },

  remove(id) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    Storage.remove('body', id);
    showToast('삭제되었습니다.');
    this.renderSummary();
    this.renderChart();
    this.renderList();
  },
};
