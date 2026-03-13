/**
 * dashboard.js — 메인 대시보드 페이지
 */

const Dashboard = {
  render() {
    const container = document.getElementById('page-container');

    const mj      = Storage.getAll('mounjaro');
    const body    = Storage.getAll('body').filter(r => r.weight);
    const exercise = Storage.getAll('exercise');
    const diet    = Storage.getAll('diet');

    container.innerHTML = `
      <div class="accent-line"></div>

      ${this._renderMounjaroCard(mj)}
      ${this._renderWeightCard(body)}
      ${this._renderTodayCard(exercise, diet)}
      ${this._renderRecentExercise(exercise)}
      ${this._renderRecentDiet(diet)}
    `;

    // 체중 차트 렌더 (DOM이 생성된 후)
    this._renderWeightChart(body);
  },

  _renderMounjaroCard(records) {
    if (records.length === 0) {
      return `
        <div class="card" style="border-color:rgba(255,179,0,0.2);">
          <div class="card-header">
            <span class="card-title">💉 마운자로 투약</span>
          </div>
          <div class="empty-state" style="padding:20px;">
            <p>투약 기록을 추가해주세요.</p>
          </div>
        </div>`;
    }

    const last  = records[0];
    const lastDate = new Date(last.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 7);
    const daysLeft = daysFromNow(nextDate.toISOString().slice(0, 10));

    let daysLabel = '';
    if (daysLeft === 0)      daysLabel = `<span class="badge badge-orange">오늘 투약!</span>`;
    else if (daysLeft > 0)   daysLabel = `<span class="badge badge-green">D-${daysLeft}</span>`;
    else                     daysLabel = `<span class="badge" style="background:rgba(255,77,61,0.15);color:var(--coral);border:1px solid rgba(255,77,61,0.3);">${Math.abs(daysLeft)}일 경과</span>`;

    return `
      <div class="card" style="border-color:rgba(255,179,0,0.2);margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">💉 마운자로 투약</span>
          ${daysLabel}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div class="stat-big text-amber">${last.dose}</div>
            <div class="stat-label">마지막: ${formatDate(last.date)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:var(--text-sub);">다음 예정</div>
            <div style="font-size:15px;font-weight:600;">${formatDate(nextDate.toISOString().slice(0,10))}</div>
          </div>
        </div>
      </div>
    `;
  },

  _renderWeightCard(records) {
    if (records.length === 0) {
      return `
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚖️ 체중 변화</span>
          </div>
          <div class="empty-state" style="padding:20px;">
            <p>체중 기록을 추가해주세요.</p>
          </div>
        </div>`;
    }

    const latest = records[0];
    const oldest = records[records.length - 1];
    const diff   = (latest.weight - oldest.weight).toFixed(1);
    const diffClass = diff <= 0 ? 'pos' : 'neg';
    const diffSign  = diff > 0 ? '+' : '';

    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">⚖️ 체중 변화</span>
          <span class="stat-change ${diffClass}">${diffSign}${diff}kg</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
          <div>
            <div class="stat-big text-amber">${latest.weight}<span class="stat-unit">kg</span></div>
            <div class="stat-label">현재 · ${formatDate(latest.date)}</div>
          </div>
          <div style="height:40px;width:1px;background:var(--border);"></div>
          <div>
            <div style="font-size:20px;font-weight:700;">${oldest.weight}<span class="stat-unit">kg</span></div>
            <div class="stat-label">시작 · ${formatDate(oldest.date)}</div>
          </div>
        </div>
        <div class="chart-wrap" style="height:160px;">
          <canvas id="dash-weight-chart"></canvas>
        </div>
      </div>
    `;
  },

  _renderWeightChart(records) {
    if (records.length < 2) return;
    const subset = records.slice(0, 20).reverse();
    Charts.renderDashWeightChart('dash-weight-chart', subset);
  },

  _renderTodayCard(exercise, diet) {
    const today = todayStr();
    const todayEx = exercise.filter(r => r.date === today);
    const todayDiet = diet.filter(r => r.date === today);
    const todayCal  = todayDiet.filter(r => r.calories).reduce((s, r) => s + r.calories, 0);

    return `
      <div class="dash-grid" style="margin-bottom:12px;">
        <div class="dash-card">
          <div class="stat-label">오늘 운동</div>
          <div class="stat-big text-green">${todayEx.length}<span class="stat-unit">회</span></div>
          <div class="stat-label">${todayEx.length ? todayEx.map(r => r.type).join(', ') : '기록 없음'}</div>
        </div>
        <div class="dash-card">
          <div class="stat-label">오늘 칼로리</div>
          <div class="stat-big text-blue">${todayCal ? todayCal.toLocaleString() : '-'}<span class="stat-unit">${todayCal ? 'kcal' : ''}</span></div>
          <div class="stat-label">${todayDiet.length ? `${todayDiet.length}끼 기록` : '기록 없음'}</div>
        </div>
      </div>
    `;
  },

  _renderRecentExercise(records) {
    const recent = records.slice(0, 3);
    if (recent.length === 0) return '';

    const typeIcon = { 런닝: '🏃', 걷기: '🚶', 웨이트: '🏋️', 자전거: '🚴', 수영: '🏊', 기타: '💪' };

    return `
      <div class="card-header">
        <span class="card-title">🏃 최근 운동</span>
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('exercise')">전체 보기</button>
      </div>
      <div class="record-list" style="margin-bottom:12px;">
        ${recent.map(r => {
          let meta = '';
          if (r.distance) meta = `${r.distance}km`;
          if (r.duration) meta += (meta ? ' · ' : '') + `${r.duration}분`;
          return `
            <div class="record-item">
              <div class="record-icon orange">${typeIcon[r.type] || '💪'}</div>
              <div class="record-body">
                <div class="record-title">${r.type} <span class="text-dim" style="font-size:12px;">· ${formatDate(r.date)}</span></div>
                ${meta ? `<div class="record-meta">${meta}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  _renderRecentDiet(records) {
    const recent = records.slice(0, 3);
    if (recent.length === 0) return '';

    const mealIcon = { 아침: '🌅', 점심: '☀️', 저녁: '🌙', 간식: '🍎' };

    return `
      <div class="card-header">
        <span class="card-title">🥗 최근 식사</span>
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('diet')">전체 보기</button>
      </div>
      <div class="record-list" style="margin-bottom:12px;">
        ${recent.map(r => `
          <div class="record-item">
            <div class="record-icon green">${mealIcon[r.meal] || '🍽️'}</div>
            <div class="record-body">
              <div class="record-title">${r.meal} <span class="text-dim" style="font-size:12px;">· ${formatDate(r.date)}</span></div>
              <div class="record-meta">${escapeHTML(r.content.length > 40 ? r.content.slice(0,40) + '…' : r.content)}</div>
              ${r.calories ? `<div class="record-meta">${r.calories} kcal</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    `;
  },
};
