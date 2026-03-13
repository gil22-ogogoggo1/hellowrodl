/**
 * diet.js — 식사 기록 페이지
 */

const DietPage = {
  MEALS: ['아침', '점심', '저녁', '간식'],

  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 오늘 식사 요약 -->
      <div id="diet-today-summary"></div>

      <!-- 입력 폼 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🥗 새 식사 기록</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">날짜</label>
            <input type="date" class="form-input" id="diet-date" value="${todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">끼니</label>
            <select class="form-select" id="diet-meal">
              ${this.MEALS.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">식사 내용</label>
          <textarea class="form-textarea" id="diet-content" placeholder="예: 닭가슴살 200g, 현미밥 반공기, 샐러드"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">칼로리 (kcal, 선택)</label>
          <input type="number" class="form-input" id="diet-calories" placeholder="예: 450" min="0">
        </div>

        <div class="form-group">
          <label class="form-label">메모</label>
          <input type="text" class="form-input" id="diet-memo" placeholder="공복감, 포만감, 특이사항 등">
        </div>

        <button class="btn btn-primary" id="diet-save-btn">기록 저장</button>
      </div>

      <!-- 칼로리 추이 차트 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📈 칼로리 추이</span>
          <span class="text-dim" style="font-size:11px;">최근 14일</span>
        </div>
        <div class="chart-wrap" style="height:140px;">
          <canvas id="cal-trend-chart"></canvas>
        </div>
      </div>

      <!-- 날짜별 식사 기록 -->
      <div class="card-header mt-16">
        <span class="card-title">📋 식사 기록</span>
      </div>
      <div id="diet-list"></div>
    `;

    document.getElementById('diet-save-btn').addEventListener('click', () => this.save());
    this.renderTodaySummary();
    this.renderCalChart();
    this.renderList();
  },

  save() {
    const date     = document.getElementById('diet-date').value;
    const meal     = document.getElementById('diet-meal').value;
    const content  = document.getElementById('diet-content').value.trim();
    const calories = document.getElementById('diet-calories').value;
    const memo     = document.getElementById('diet-memo').value.trim();

    if (!date)    { showToast('날짜를 입력해주세요.'); return; }
    if (!content) { showToast('식사 내용을 입력해주세요.'); return; }

    Storage.add('diet', {
      date,
      meal,
      content,
      calories: calories ? parseInt(calories) : null,
      memo,
    });

    showToast('✅ 식사 기록이 저장되었습니다.');
    document.getElementById('diet-date').value = todayStr();
    document.getElementById('diet-content').value = '';
    document.getElementById('diet-calories').value = '';
    document.getElementById('diet-memo').value = '';

    this.renderTodaySummary();
    this.renderList();
  },

  renderCalChart() {
    const records = Storage.getAll('diet');
    Charts.renderCalorieTrendChart('cal-trend-chart', records);
  },

  renderTodaySummary() {
    const el = document.getElementById('diet-today-summary');
    if (!el) return;

    const today = todayStr();
    const todayRecords = Storage.getAll('diet').filter(r => r.date === today);
    if (todayRecords.length === 0) { el.innerHTML = ''; return; }

    const totalCal = todayRecords
      .filter(r => r.calories)
      .reduce((s, r) => s + r.calories, 0);

    const mealDone = this.MEALS.filter(m => todayRecords.some(r => r.meal === m));

    el.innerHTML = `
      <div class="card" style="border-color: rgba(74,222,128,0.2); margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">🌟 오늘 식사</span>
          ${totalCal ? `<span class="text-amber fw-600">${totalCal.toLocaleString()} kcal</span>` : ''}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${this.MEALS.map(m => `
            <span class="badge ${mealDone.includes(m) ? 'badge-green' : ''}"
                  style="${!mealDone.includes(m) ? 'background:var(--bg-input);color:var(--text-dim);border-color:var(--border);' : ''}">
              ${m}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderList() {
    const records = Storage.getAll('diet');
    const el = document.getElementById('diet-list');
    if (!el) return;

    if (records.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🥗</div>
          <p>아직 식사 기록이 없습니다.</p>
        </div>`;
      return;
    }

    // 날짜별 그룹핑
    const grouped = {};
    records.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });

    const mealIcon = { 아침: '🌅', 점심: '☀️', 저녁: '🌙', 간식: '🍎' };
    const mealOrder = ['아침', '점심', '저녁', '간식'];

    el.innerHTML = Object.entries(grouped)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, items]) => {
        const sortedItems = items.sort((a, b) => mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal));
        const totalCal = items.filter(r => r.calories).reduce((s, r) => s + r.calories, 0);

        return `
          <div class="card" style="margin-bottom:10px;">
            <div class="card-header" style="margin-bottom:10px;">
              <span style="font-size:14px;font-weight:700;">${formatDate(date)}</span>
              ${totalCal ? `<span class="text-amber" style="font-size:13px;">${totalCal.toLocaleString()} kcal</span>` : ''}
            </div>
            ${sortedItems.map(r => `
              <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);" class="diet-row">
                <span style="font-size:18px;">${mealIcon[r.meal] || '🍽️'}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;">
                    <span class="badge badge-green" style="font-size:10px;">${r.meal}</span>
                    ${r.calories ? `<span class="text-amber" style="font-size:12px;">${r.calories}kcal</span>` : ''}
                  </div>
                  <div style="font-size:13px;color:var(--text-sub);margin-top:3px;">${escapeHTML(r.content)}</div>
                  ${r.memo ? `<div style="font-size:12px;color:var(--text-dim);margin-top:2px;">"${escapeHTML(r.memo)}"</div>` : ''}
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0;">
                  <button class="btn btn-edit btn-sm" onclick="DietPage.openEdit('${r.id}')">편집</button>
                  <button class="btn btn-danger btn-sm" onclick="DietPage.remove('${r.id}')">삭제</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('');
  },

  openEdit(id) {
    const r = Storage.getById('diet', id);
    if (!r) return;

    App.Modal.open(`
      <h2 class="modal-title">🥗 식사 기록 편집</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">날짜</label>
          <input type="date" class="form-input" id="diet-edit-date" value="${r.date}">
        </div>
        <div class="form-group">
          <label class="form-label">끼니</label>
          <select class="form-select" id="diet-edit-meal">
            ${this.MEALS.map(m => `<option value="${m}" ${r.meal === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">식사 내용</label>
        <textarea class="form-textarea" id="diet-edit-content">${escapeHTML(r.content || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">칼로리 (kcal)</label>
        <input type="number" class="form-input" id="diet-edit-calories" value="${r.calories || ''}" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <input type="text" class="form-input" id="diet-edit-memo" value="${escapeHTML(r.memo || '')}">
      </div>
      <button class="btn btn-primary" onclick="DietPage.saveEdit('${id}')">수정 완료</button>
    `);
  },

  saveEdit(id) {
    const date     = document.getElementById('diet-edit-date').value;
    const meal     = document.getElementById('diet-edit-meal').value;
    const content  = document.getElementById('diet-edit-content').value.trim();
    const calories = document.getElementById('diet-edit-calories').value;
    const memo     = document.getElementById('diet-edit-memo').value.trim();

    if (!date)    { showToast('날짜를 입력해주세요.'); return; }
    if (!content) { showToast('식사 내용을 입력해주세요.'); return; }

    Storage.update('diet', id, {
      date,
      meal,
      content,
      calories: calories ? parseInt(calories) : null,
      memo,
    });

    App.Modal.close();
    showToast('✅ 수정되었습니다.');
    this.renderTodaySummary();
    this.renderList();
  },

  remove(id) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    Storage.remove('diet', id);
    showToast('삭제되었습니다.');
    this.renderTodaySummary();
    this.renderList();
  },
};
