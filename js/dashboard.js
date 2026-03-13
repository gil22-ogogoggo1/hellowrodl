/**
 * dashboard.js — 메인 대시보드 페이지
 */

const Dashboard = {
  render() {
    const container = document.getElementById('page-container');

    const mj       = Storage.getAll('mounjaro');
    const body     = Storage.getAll('body').filter(r => r.weight);
    const exercise = Storage.getAll('exercise');
    const diet     = Storage.getAll('diet');

    container.innerHTML = `
      <div class="accent-line"></div>
      ${this._renderGoalProgress(body, exercise, diet)}
      ${this._renderMounjaroCard(mj)}
      ${this._renderWeightCard(body)}
      ${this._renderWeeklyReport(exercise, diet, body)}
      ${this._renderMilestones(body)}
      ${this._renderTodayCard(exercise, diet)}
      ${this._renderRecentExercise(exercise)}
      ${this._renderRecentDiet(diet)}
    `;

    this._renderWeightChart(body);
  },

  // ── Sprint 2: 목표 진행률 위젯 ──────────────────────────────
  _renderGoalProgress(body, exercise, diet) {
    const goals = Goals.get();
    if (!goals.weightTarget && !goals.exerciseWeekly && !goals.calorieDaily) {
      return `
        <div class="card" style="border-color:rgba(255,179,0,0.15);margin-bottom:12px;">
          <div class="card-header">
            <span class="card-title">🎯 목표 진행률</span>
            <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('settings')">목표 설정</button>
          </div>
          <p class="text-dim" style="font-size:13px;">설정에서 목표를 입력하면 진행률을 확인할 수 있습니다.</p>
        </div>`;
    }

    const items = [];

    // 체중 목표
    if (goals.weightTarget && body.length > 0) {
      const current = parseFloat(body[0].weight);
      const start   = goals.weightStart ? parseFloat(goals.weightStart) : parseFloat(body[body.length - 1].weight);
      const target  = parseFloat(goals.weightTarget);
      const total   = Math.abs(start - target);
      const done    = Math.max(0, Math.abs(start - current));
      const pct     = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      const isLoss  = target < start;
      const onTrack = isLoss ? current <= start : current >= start;

      items.push(`
        <div class="goal-item">
          <div class="goal-label">
            <span>⚖️ 체중</span>
            <span class="text-amber">${Number(current).toFixed(1)}kg → ${target}kg</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar ${onTrack ? '' : 'off-track'}" style="width:${pct}%"></div>
          </div>
          <div class="goal-sub">${pct}% 달성 · 남은 목표: ${Math.max(0, Math.abs(current - target)).toFixed(1)}kg</div>
        </div>`);
    }

    // 주간 운동 목표
    if (goals.exerciseWeekly) {
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      const thisWeek = exercise.filter(r => new Date(r.date) >= monday).length;
      const goal     = goals.exerciseWeekly;
      const pct      = Math.min(100, Math.round((thisWeek / goal) * 100));
      items.push(`
        <div class="goal-item">
          <div class="goal-label">
            <span>🏃 이번 주 운동</span>
            <span class="text-green">${thisWeek} / ${goal}회</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar green" style="width:${pct}%"></div>
          </div>
          <div class="goal-sub">${pct}% 달성</div>
        </div>`);
    }

    // 오늘 칼로리 목표
    if (goals.calorieDaily) {
      const today    = todayStr();
      const todayCal = diet.filter(r => r.date === today && r.calories)
        .reduce((s, r) => s + r.calories, 0);
      const goal     = goals.calorieDaily;
      const pct      = Math.min(100, Math.round((todayCal / goal) * 100));
      const over     = todayCal > goal;
      items.push(`
        <div class="goal-item">
          <div class="goal-label">
            <span>🥗 오늘 칼로리</span>
            <span class="${over ? 'text-coral' : 'text-blue'}">${todayCal.toLocaleString()} / ${goal.toLocaleString()} kcal</span>
          </div>
          <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar blue${over ? ' off-track' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="goal-sub">${over ? '목표 초과' : `${goal - todayCal}kcal 남음`}</div>
        </div>`);
    }

    return `
      <div class="card" style="border-color:rgba(255,179,0,0.2);margin-bottom:12px;">
        <div class="card-header" style="margin-bottom:12px;">
          <span class="card-title">🎯 목표 진행률</span>
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('settings')">수정</button>
        </div>
        ${items.join('')}
      </div>`;
  },

  // ── Sprint 4: 마일스톤 ───────────────────────────────────────
  _renderMilestones(body) {
    const achieved = Milestones.achieved();
    if (achieved.length === 0) return '';

    return `
      <div class="card" style="border-color:rgba(255,209,102,0.25);margin-bottom:12px;">
        <div class="card-header" style="margin-bottom:10px;">
          <span class="card-title">🏅 달성 마일스톤</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${achieved.map(m => `
            <div class="milestone-badge">
              <span style="font-size:20px;">${m.emoji}</span>
              <span>${m.label}</span>
            </div>`).join('')}
        </div>
      </div>`;
  },

  // ── Sprint 4: 주간 요약 ──────────────────────────────────────
  _renderWeeklyReport(exercise, diet, body) {
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const thisWeekEx  = exercise.filter(r => new Date(r.date) >= monday);
    const thisWeekDiet = diet.filter(r => new Date(r.date) >= monday && r.calories);
    const thisWeekBody = body.filter(r => new Date(r.date) >= monday);

    const totalCal  = thisWeekDiet.reduce((s, r) => s + r.calories, 0);
    const avgCal    = thisWeekDiet.length
      ? Math.round(totalCal / [...new Set(thisWeekDiet.map(r => r.date))].length)
      : 0;
    const weightChange = thisWeekBody.length >= 2
      ? (parseFloat(thisWeekBody[0].weight) - parseFloat(thisWeekBody[thisWeekBody.length-1].weight)).toFixed(1)
      : null;

    if (thisWeekEx.length === 0 && thisWeekDiet.length === 0) return '';

    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-header" style="margin-bottom:10px;">
          <span class="card-title">📅 이번 주 요약</span>
          <span class="text-dim" style="font-size:12px;">월요일 기준</span>
        </div>
        <div class="dash-grid">
          <div class="dash-card">
            <div class="stat-label">운동 횟수</div>
            <div class="stat-big text-green">${thisWeekEx.length}<span class="stat-unit">회</span></div>
          </div>
          <div class="dash-card">
            <div class="stat-label">평균 칼로리</div>
            <div class="stat-big text-blue">${avgCal ? avgCal.toLocaleString() : '-'}<span class="stat-unit">${avgCal ? 'kcal' : ''}</span></div>
          </div>
          ${weightChange !== null ? `
          <div class="dash-card" style="grid-column:1/-1;">
            <div class="stat-label">이번 주 체중 변화</div>
            <div class="stat-big ${parseFloat(weightChange) < 0 ? 'text-green' : parseFloat(weightChange) > 0 ? 'text-coral' : 'text-dim'}">
              ${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange}<span class="stat-unit">kg</span>
            </div>
          </div>` : ''}
        </div>
      </div>`;
  },

  _renderMounjaroCard(records) {
    if (records.length === 0) {
      return `
        <div class="card" style="border-color:rgba(255,179,0,0.2);margin-bottom:12px;">
          <div class="card-header">
            <span class="card-title">💉 투약</span>
          </div>
          <div class="empty-state" style="padding:20px;">
            <p>투약 기록을 추가해주세요.</p>
          </div>
        </div>`;
    }

    const last      = records[0];
    const drugKey   = last.drugName || 'mounjaro';
    const drugLabel = MounjaroPage.drugLabel(drugKey);
    const interval  = MounjaroPage.drugInterval(drugKey);
    const lastDate  = new Date(last.date);
    const nextDate  = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + interval);
    const daysLeft  = daysFromNow(nextDate.toISOString().slice(0, 10));

    let badge = '';
    if (daysLeft === 0)    badge = `<span class="badge badge-orange">오늘 투약!</span>`;
    else if (daysLeft > 0) badge = `<span class="badge badge-green">D-${daysLeft}</span>`;
    else                   badge = `<span class="badge" style="background:rgba(255,77,61,0.15);color:var(--coral);border:1px solid rgba(255,77,61,0.3);">${Math.abs(daysLeft)}일 경과</span>`;

    return `
      <div class="card" style="border-color:rgba(255,179,0,0.2);margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">💉 투약</span>
          ${badge}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div class="stat-big text-amber">${last.dose}</div>
            <div class="stat-label">
              <span class="drug-badge drug-${drugKey}">${drugLabel}</span>
              마지막: ${formatDate(last.date)}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:var(--text-sub);">다음 예정</div>
            <div style="font-size:15px;font-weight:600;">${formatDate(nextDate.toISOString().slice(0,10))}</div>
          </div>
        </div>
      </div>`;
  },

  _renderWeightCard(records) {
    if (records.length === 0) {
      return `
        <div class="card" style="margin-bottom:12px;">
          <div class="card-header"><span class="card-title">⚖️ 체중 변화</span></div>
          <div class="empty-state" style="padding:20px;"><p>체중 기록을 추가해주세요.</p></div>
        </div>`;
    }

    const latest  = records[0];
    const oldest  = records[records.length - 1];
    const diff    = (latest.weight - oldest.weight).toFixed(2);
    const diffCls = diff <= 0 ? 'pos' : 'neg';
    const diffSign = diff > 0 ? '+' : '';

    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">⚖️ 체중 변화</span>
          <span class="stat-change ${diffCls}">${diffSign}${diff}kg</span>
        </div>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
          <div>
            <div class="stat-big text-amber">${Number(latest.weight).toFixed(2)}<span class="stat-unit">kg</span></div>
            <div class="stat-label">현재 · ${formatDate(latest.date)}</div>
          </div>
          <div style="height:40px;width:1px;background:var(--border);"></div>
          <div>
            <div style="font-size:20px;font-weight:700;">${Number(oldest.weight).toFixed(2)}<span class="stat-unit">kg</span></div>
            <div class="stat-label">시작 · ${formatDate(oldest.date)}</div>
          </div>
        </div>
        <div class="chart-wrap" style="height:160px;">
          <canvas id="dash-weight-chart"></canvas>
        </div>
      </div>`;
  },

  _renderWeightChart(records) {
    if (records.length < 2) return;
    const subset = records.slice(0, 20).reverse();
    Charts.renderDashWeightChart('dash-weight-chart', subset);
  },

  _renderTodayCard(exercise, diet) {
    const today    = todayStr();
    const todayEx  = exercise.filter(r => r.date === today);
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
      </div>`;
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
      </div>`;
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
      </div>`;
  },
};
