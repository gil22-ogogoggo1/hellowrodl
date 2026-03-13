/**
 * body.js — 체중 / 인바디 기록 페이지
 */

const BodyPage = {
  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 프로필 카드 -->
      <div id="body-profile"></div>

      <!-- 또래 평균 비교 카드 -->
      <div id="body-comparison"></div>

      <!-- 요약 카드 -->
      <div id="body-summary"></div>

      <!-- 체중 그래프 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📈 체중 변화</span>
          <div class="chart-filter-group" role="group" aria-label="기간 필터">
            <button class="chart-filter-btn active" onclick="BodyPage.setChartPeriod('all', this)">전체</button>
            <button class="chart-filter-btn" onclick="BodyPage.setChartPeriod('3m', this)">3달</button>
            <button class="chart-filter-btn" onclick="BodyPage.setChartPeriod('1m', this)">1달</button>
            <button class="chart-filter-btn" onclick="BodyPage.setChartPeriod('1w', this)">1주</button>
          </div>
        </div>
        <div class="chart-wrap" id="body-chart-wrap">
          <canvas id="body-chart"></canvas>
        </div>
      </div>

      <!-- 체성분 그래프 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 체성분 변화</span>
          <span class="text-dim" style="font-size:11px;">체지방률 · 골격근량</span>
        </div>
        <div class="chart-wrap" id="body-comp-chart-wrap">
          <canvas id="body-comp-chart"></canvas>
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
            <input type="number" class="form-input" id="body-weight" placeholder="예: 75.3" step="0.01" min="30" max="250">
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

      <!-- 데이터 가져오기 -->
      <div class="card" style="border-color:rgba(74,222,128,0.2);">
        <div class="card-header" style="margin-bottom:10px;">
          <span class="card-title">📥 데이터 연동</span>
        </div>

        <!-- Bluetooth 체중계 -->
        <div class="sync-section">
          <div class="sync-section-title">🔵 Bluetooth 체중계</div>
          <p class="sync-desc">Bluetooth LE 체중계(샤오미 Mi Scale, Withings, Garmin Index 등)를 직접 연결해 측정값을 가져옵니다.<br><span class="text-dim">Chrome / Edge 브라우저만 지원</span></p>
          <button class="btn btn-ghost" id="bt-connect-btn" onclick="BodyPage.connectBluetooth()">
            🔗 체중계 연결하기
          </button>
          <div id="bt-result" style="margin-top:8px;"></div>
        </div>

        <div class="sync-divider"></div>

        <!-- 삼성헬스 내보내기 -->
        <div class="sync-section">
          <div class="sync-section-title">📱 삼성헬스 가져오기</div>
          <p class="sync-desc">삼성헬스 앱 → 설정 → 개인 데이터 다운로드 → ZIP 파일 업로드<br>또는 압축 해제 후 <code>body_composition</code> CSV 파일을 업로드하세요.</p>
          <label class="btn btn-ghost" style="cursor:pointer;display:inline-flex;">
            📂 삼성헬스 파일 선택 (.zip / .csv)
            <input type="file" accept=".zip,.csv" id="sh-body-file" style="display:none;" onchange="BodyPage.importFile(this)">
          </label>
          <div id="sh-body-result" style="margin-top:8px;"></div>
        </div>

        <div class="sync-divider"></div>

        <!-- 일반 CSV (인바디, 기타) -->
        <div class="sync-section">
          <div class="sync-section-title">📊 인바디 / 일반 CSV 가져오기</div>
          <p class="sync-desc">인바디 앱, 핏빗, 체지방계 앱 등에서 내보낸 CSV 파일을 업로드하세요.<br>
          <span class="text-dim">컬럼 예: 날짜, 체중, 체지방률, 골격근량, BMI</span></p>
          <a href="#" class="text-dim" style="font-size:11px;" onclick="BodyPage.downloadSampleCSV(event)">샘플 CSV 양식 다운로드</a>
          <div style="margin-top:8px;">
            <label class="btn btn-ghost" style="cursor:pointer;display:inline-flex;">
              📂 CSV 파일 선택
              <input type="file" accept=".csv,.txt" id="generic-body-file" style="display:none;" onchange="BodyPage.importGenericFile(this)">
            </label>
          </div>
          <div id="generic-body-result" style="margin-top:8px;"></div>
        </div>
      </div>

      <!-- 기록 리스트 -->
      <div class="card-header mt-16">
        <span class="card-title">📋 체중 기록</span>
      </div>
      <div id="body-list" class="record-list"></div>
    `;

    document.getElementById('body-save-btn').addEventListener('click', () => this.save());
    this._chartPeriod = 'all';
    this.renderProfile();
    this.renderComparison();
    this.renderSummary();
    this.renderChart();
    this.renderCompChart();
    this.renderList();
  },

  // ── 체중 소수점 2자리 포맷 ──
  fmtW(val) {
    if (val === null || val === undefined) return '-';
    return Number(val).toFixed(2);
  },

  // ── 프로필 카드 ──────────────────────────────────────────────
  renderProfile() {
    const el = document.getElementById('body-profile');
    if (!el) return;
    const p = Profile.get();

    if (!p) {
      el.innerHTML = `
        <div class="card" style="border-color:rgba(167,139,250,0.25);margin-bottom:12px;">
          <div class="card-header" style="margin-bottom:0;">
            <span class="card-title">👤 내 프로필</span>
            <button class="btn btn-ghost btn-sm" onclick="BodyPage.openProfileEdit()">설정하기</button>
          </div>
          <p class="text-dim" style="font-size:12px;margin-top:8px;">
            키·나이·성별을 입력하면 또래 평균과 비교할 수 있습니다.
          </p>
        </div>`;
      return;
    }

    const bmiVal = Profile.calcBMI(
      Storage.getAll('body').filter(r => r.weight)[0]?.weight,
      p.height
    );
    const bmiInfo = bmiVal ? Profile.bmiLabel(bmiVal) : null;

    el.innerHTML = `
      <div class="card" style="border-color:rgba(167,139,250,0.25);margin-bottom:12px;">
        <div class="card-header" style="margin-bottom:8px;">
          <span class="card-title">👤 내 프로필</span>
          <button class="btn btn-ghost btn-sm" onclick="BodyPage.openProfileEdit()">편집</button>
        </div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
          <div class="profile-chip">${Profile.genderLabel(p.gender)}</div>
          <div class="profile-chip">${p.age}세 <span class="text-dim">(${Profile.ageGroupLabel(p.age)})</span></div>
          <div class="profile-chip">${p.height}cm</div>
          ${bmiInfo ? `<div class="profile-chip"><span class="${bmiInfo.cls}">BMI ${bmiVal.toFixed(2)} · ${bmiInfo.text}</span></div>` : ''}
        </div>
      </div>`;
  },

  openProfileEdit() {
    const p = Profile.get() || {};
    App.Modal.open(`
      <h2 class="modal-title">👤 내 프로필 설정</h2>
      <div class="form-group">
        <label class="form-label">성별</label>
        <div style="display:flex;gap:10px;">
          <label class="profile-radio-label">
            <input type="radio" name="profile-gender" value="male" ${p.gender === 'male' ? 'checked' : ''}>
            남성
          </label>
          <label class="profile-radio-label">
            <input type="radio" name="profile-gender" value="female" ${p.gender === 'female' ? 'checked' : ''}>
            여성
          </label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">나이</label>
          <input type="number" class="form-input" id="profile-age" value="${p.age || ''}" min="10" max="90" placeholder="예: 35">
        </div>
        <div class="form-group">
          <label class="form-label">키 (cm)</label>
          <input type="number" class="form-input" id="profile-height" value="${p.height || ''}" min="100" max="220" placeholder="예: 170">
        </div>
      </div>
      <p class="text-dim" style="font-size:12px;margin-bottom:14px;">
        * 한국인 평균 체성분(국민건강영양조사 기반)과 비교하는 데 사용됩니다.
      </p>
      <button class="btn btn-primary" onclick="BodyPage.saveProfile()">저장</button>
    `);
  },

  saveProfile() {
    const gender = document.querySelector('input[name="profile-gender"]:checked')?.value;
    const age    = document.getElementById('profile-age').value;
    const height = document.getElementById('profile-height').value;

    if (!gender) { showToast('성별을 선택해주세요.'); return; }
    if (!age)    { showToast('나이를 입력해주세요.'); return; }
    if (!height) { showToast('키를 입력해주세요.'); return; }

    Profile.save({ gender, age: parseInt(age), height: parseFloat(height) });
    App.Modal.close();
    showToast('✅ 프로필이 저장되었습니다.');
    this.renderProfile();
    this.renderComparison();
  },

  // ── 또래 평균 비교 카드 ──────────────────────────────────────
  renderComparison() {
    const el = document.getElementById('body-comparison');
    if (!el) return;

    const p = Profile.get();
    if (!p) { el.innerHTML = ''; return; }

    const records = Storage.getAll('body').filter(r => r.weight);
    if (records.length === 0) { el.innerHTML = ''; return; }

    const latest  = records[0];
    const avg     = Profile.getAverage(p.gender, p.age);
    if (!avg) { el.innerHTML = ''; return; }

    // BMI: 프로필 키 + 최근 체중으로 계산
    const myBMI = Profile.calcBMI(latest.weight, p.height);

    const rows = [
      this._compRow('체중',    latest.weight,  avg.weight,  'kg',  true),
      this._compRow('BMI',     myBMI,          avg.bmi,     '',    true),
      this._compRow('체지방률', latest.fat,     avg.fat,     '%',   true),
      this._compRow('골격근량', latest.muscle,  avg.muscle,  'kg',  false),
    ].filter(Boolean).join('');

    const gLabel = Profile.genderLabel(p.gender);
    const aLabel = Profile.ageGroupLabel(p.age);

    el.innerHTML = `
      <div class="card" style="border-color:rgba(96,165,250,0.25);margin-bottom:12px;">
        <div class="card-header" style="margin-bottom:4px;">
          <span class="card-title">📊 또래 평균 비교</span>
          <span class="badge badge-blue" style="font-size:10px;">${gLabel} ${aLabel}</span>
        </div>
        <p class="text-dim" style="font-size:11px;margin-bottom:12px;">
          기준: 한국인 국민건강영양조사 · ${latest.fat ? '인바디 포함' : '체중/BMI만 표시'}
        </p>
        <div class="comparison-header">
          <span></span>
          <span>나</span>
          <span>또래 평균</span>
          <span>차이</span>
        </div>
        ${rows}
      </div>`;
  },

  _compRow(label, myVal, avgVal, unit, lowerIsBetter) {
    if (myVal === null || myVal === undefined) return '';

    const diff    = myVal - avgVal;
    const absDiff = Math.abs(diff);
    const threshold = avgVal * 0.03; // 3% 이내 → 평균 수준

    let cls, text;
    if (absDiff < threshold) {
      cls  = 'text-dim';
      text = '≈ 평균 수준';
    } else if (lowerIsBetter) {
      cls  = diff < 0 ? 'text-green' : 'text-coral';
      text = diff < 0
        ? `▼${absDiff.toFixed(2)}${unit} 낮음`
        : `▲${absDiff.toFixed(2)}${unit} 높음`;
    } else {
      cls  = diff > 0 ? 'text-green' : 'text-coral';
      text = diff > 0
        ? `▲${absDiff.toFixed(2)}${unit} 높음`
        : `▼${absDiff.toFixed(2)}${unit} 낮음`;
    }

    return `
      <div class="comparison-row">
        <span class="comparison-label">${label}</span>
        <span class="comparison-mine">${Number(myVal).toFixed(2)}<span class="comparison-unit">${unit}</span></span>
        <span class="comparison-avg">${Number(avgVal).toFixed(2)}<span class="comparison-unit">${unit}</span></span>
        <span class="comparison-delta ${cls}">${text}</span>
      </div>`;
  },

  // ── 요약 카드 ────────────────────────────────────────────────
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
    const diff   = (latest.weight - oldest.weight).toFixed(2);
    const diffClass = diff <= 0 ? 'pos' : 'neg';
    const diffSign  = diff > 0 ? '+' : '';

    el.innerHTML = `
      <div class="dash-grid" style="margin-bottom:12px;">
        <div class="dash-card">
          <div class="stat-label">현재 체중</div>
          <div class="stat-big text-amber">${this.fmtW(latest.weight)}<span class="stat-unit">kg</span></div>
          <div class="stat-label">${formatDate(latest.date)}</div>
        </div>
        <div class="dash-card">
          <div class="stat-label">시작 대비</div>
          <div class="stat-big"><span class="stat-change ${diffClass}">${diffSign}${diff}kg</span></div>
          <div class="stat-label">시작: ${this.fmtW(oldest.weight)}kg</div>
        </div>
        ${latest.fat !== null && latest.fat !== undefined ? `
        <div class="dash-card">
          <div class="stat-label">체지방률</div>
          <div class="stat-big">${this.fmtW(latest.fat)}<span class="stat-unit">%</span></div>
        </div>` : ''}
        ${latest.muscle !== null && latest.muscle !== undefined ? `
        <div class="dash-card">
          <div class="stat-label">골격근량</div>
          <div class="stat-big">${this.fmtW(latest.muscle)}<span class="stat-unit">kg</span></div>
        </div>` : ''}
      </div>
    `;
  },

  // ── 기간 필터 ─────────────────────────────────────────────────
  setChartPeriod(period, btn) {
    this._chartPeriod = period;
    document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.renderChart();
  },

  // ── 체중 차트 ─────────────────────────────────────────────────
  renderChart() {
    const all = Storage.getAll('body').filter(r => r.weight);
    const now = new Date();
    let filtered = all;

    if (this._chartPeriod === '1w') {
      const cut = new Date(now); cut.setDate(now.getDate() - 7);
      filtered = all.filter(r => new Date(r.date) >= cut);
    } else if (this._chartPeriod === '1m') {
      const cut = new Date(now); cut.setMonth(now.getMonth() - 1);
      filtered = all.filter(r => new Date(r.date) >= cut);
    } else if (this._chartPeriod === '3m') {
      const cut = new Date(now); cut.setMonth(now.getMonth() - 3);
      filtered = all.filter(r => new Date(r.date) >= cut);
    }

    const records = filtered.slice(0, 60).reverse();
    const wrap = document.getElementById('body-chart-wrap');
    if (!wrap) return;

    if (records.length < 2) {
      wrap.innerHTML = `<p class="text-dim" style="text-align:center;font-size:13px;padding:20px;">데이터 2개 이상 필요합니다.</p>`;
      return;
    }
    if (!wrap.querySelector('canvas')) {
      wrap.innerHTML = '<canvas id="body-chart"></canvas>';
    }
    Charts.renderWeightChart('body-chart', records);
  },

  // ── 체성분 차트 ────────────────────────────────────────────────
  renderCompChart() {
    const records = Storage.getAll('body').filter(r => r.weight).slice(0, 30).reverse();
    Charts.renderBodyCompChart('body-comp-chart', records);
  },

  // ── 기록 리스트 ───────────────────────────────────────────────
  renderList() {
    const records = Storage.getAll('body');
    const el = document.getElementById('body-list');
    if (!el) return;

    if (records.length === 0) {
      el.innerHTML = RenderHelper.emptyState('⚖️', '아직 체중 기록이 없습니다.');
      return;
    }

    el.innerHTML = records.map(r => {
      const inbodyBadges = [];
      if (r.fat    !== null && r.fat    !== undefined) inbodyBadges.push(`체지방 ${this.fmtW(r.fat)}%`);
      if (r.muscle !== null && r.muscle !== undefined) inbodyBadges.push(`근육 ${this.fmtW(r.muscle)}kg`);
      if (r.bmi    !== null && r.bmi    !== undefined) inbodyBadges.push(`BMI ${this.fmtW(r.bmi)}`);

      return `
        <div class="record-item">
          <div class="record-icon amber">⚖️</div>
          <div class="record-body">
            <div class="record-title">${formatDate(r.date)} · <span class="text-amber">${this.fmtW(r.weight)}kg</span></div>
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

  // ── 공통 리렌더 시퀀스 ──────────────────────────────────────
  _refreshAll() {
    this.renderProfile();
    this.renderComparison();
    this.renderSummary();
    this.renderChart();
    this.renderList();
  },

  // ── 저장 ─────────────────────────────────────────────────────
  save() {
    const date     = document.getElementById('body-date').value;
    const weight   = document.getElementById('body-weight').value;
    const fat      = document.getElementById('body-fat').value;
    const muscle   = document.getElementById('body-muscle').value;
    const bmi      = document.getElementById('body-bmi').value;
    const water    = document.getElementById('body-water').value;
    const visceral = document.getElementById('body-visceral').value;
    const memo     = document.getElementById('body-memo').value.trim();

    if (!date)   { showToast('날짜를 입력해주세요.'); return; }
    if (!weight) { showToast('체중을 입력해주세요.'); return; }

    Storage.add('body', {
      date,
      weight:   parseFloat(weight),
      fat:      fat      ? parseFloat(fat)      : null,
      muscle:   muscle   ? parseFloat(muscle)   : null,
      bmi:      bmi      ? parseFloat(bmi)      : null,
      water:    water    ? parseFloat(water)    : null,
      visceral: visceral ? parseInt(visceral)   : null,
      memo,
    });

    showToast('✅ 체중 기록이 저장되었습니다.');
    document.getElementById('body-date').value    = todayStr();
    document.getElementById('body-weight').value  = '';
    document.getElementById('body-fat').value     = '';
    document.getElementById('body-muscle').value  = '';
    document.getElementById('body-bmi').value     = '';
    document.getElementById('body-water').value   = '';
    document.getElementById('body-visceral').value = '';
    document.getElementById('body-memo').value    = '';

    this._refreshAll();
  },

  // ── 편집 모달 ─────────────────────────────────────────────────
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
          <input type="number" class="form-input" id="body-edit-weight" value="${r.weight || ''}" step="0.01" min="30" max="250">
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
      fat:      fat      ? parseFloat(fat)      : null,
      muscle:   muscle   ? parseFloat(muscle)   : null,
      bmi:      bmi      ? parseFloat(bmi)      : null,
      water:    water    ? parseFloat(water)    : null,
      visceral: visceral ? parseInt(visceral)   : null,
      memo,
    });

    App.Modal.close();
    showToast('✅ 수정되었습니다.');
    this._refreshAll();
  },

  remove(id) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    Storage.remove('body', id);
    showToast('삭제되었습니다.');
    this._refreshAll();
  },

  // ── Bluetooth 체중계 연결 ───────────────────────────────────
  async connectBluetooth() {
    const btn    = document.getElementById('bt-connect-btn');
    const result = document.getElementById('bt-result');
    if (!btn || !result) return;

    btn.disabled = true;
    btn.textContent = '⏳ 기기 검색 중...';
    result.innerHTML = '';

    try {
      const data = await Sync.connectBluetoothScale();

      // 측정값 미리보기 + 저장 확인
      const weightStr  = data.weight  ? `체중: ${data.weight.toFixed(2)}kg` : '';
      const fatStr     = data.fat     ? ` · 체지방: ${data.fat}%` : '';
      const bmiStr     = data.bmi     ? ` · BMI: ${data.bmi}` : '';
      const previewMsg = [weightStr, fatStr, bmiStr].filter(Boolean).join('');

      result.innerHTML = `
        <div class="sync-preview">
          <div class="sync-preview-value">${previewMsg}</div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-primary" style="flex:1;" onclick="BodyPage._saveBtData(${JSON.stringify(data)})">저장하기</button>
            <button class="btn btn-ghost" style="flex:1;" onclick="document.getElementById('bt-result').innerHTML=''">취소</button>
          </div>
        </div>`;
    } catch (err) {
      if (err.name === 'NotFoundError') {
        result.innerHTML = `<p class="sync-error">기기 선택이 취소되었습니다.</p>`;
      } else {
        result.innerHTML = `<p class="sync-error">⚠️ ${escapeHTML(err.message)}</p>`;
      }
    } finally {
      btn.disabled = false;
      btn.textContent = '🔗 체중계 연결하기';
    }
  },

  _saveBtData(data) {
    if (!data.weight) { showToast('체중 데이터가 없습니다.'); return; }
    Storage.add('body', {
      date: todayStr(),
      weight:   data.weight,
      fat:      data.fat    || null,
      muscle:   data.muscle || null,
      bmi:      data.bmi    || null,
      water:    null,
      visceral: null,
      memo: '(Bluetooth 체중계)',
    });
    document.getElementById('bt-result').innerHTML =
      `<p class="sync-success">✅ 저장되었습니다.</p>`;
    showToast('✅ 체중계 측정값이 저장되었습니다.');
    this._refreshAll();
  },

  // ── 삼성헬스 ZIP / CSV 가져오기 ────────────────────────────
  async importFile(input) {
    const file = input.files[0];
    if (!file) return;

    const result = document.getElementById('sh-body-result');
    result.innerHTML = `<p class="text-dim" style="font-size:12px;">⏳ 처리 중...</p>`;

    try {
      let res;
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zipRes = await Sync.importSamsungZip(file);
        res = zipRes.body;
        // 운동 데이터도 가져왔으면 알림
        if (zipRes.exercise.success > 0) {
          showToast(`운동 ${zipRes.exercise.success}건도 가져왔습니다.`);
        }
      } else {
        const text = await file.text();
        res = Sync.importSamsungBody(text);
      }

      result.innerHTML = `<p class="sync-success">✅ ${res.success}건 추가 / ${res.skip}건 건너뜀</p>`;
      if (res.success > 0) {
        showToast(`✅ 체중 데이터 ${res.success}건을 가져왔습니다.`);
        this._refreshAll();
      }
    } catch (err) {
      result.innerHTML = `<p class="sync-error">⚠️ ${escapeHTML(err.message)}</p>`;
    }
    input.value = '';
  },

  // ── 일반 CSV 가져오기 ────────────────────────────────────────
  async importGenericFile(input) {
    const file = input.files[0];
    if (!file) return;

    const result = document.getElementById('generic-body-result');
    result.innerHTML = `<p class="text-dim" style="font-size:12px;">⏳ 처리 중...</p>`;

    try {
      const text = await file.text();
      const res  = Sync.importGenericBody(text);
      result.innerHTML = `<p class="sync-success">✅ ${res.success}건 추가 / ${res.skip}건 건너뜀</p>`;
      if (res.success > 0) {
        showToast(`✅ ${res.success}건을 가져왔습니다.`);
        this._refreshAll();
      } else {
        result.innerHTML += `<p class="sync-error" style="margin-top:4px;">컬럼을 인식하지 못했습니다. 샘플 CSV 양식을 참고해주세요.</p>`;
      }
    } catch (err) {
      result.innerHTML = `<p class="sync-error">⚠️ ${escapeHTML(err.message)}</p>`;
    }
    input.value = '';
  },

  // ── 샘플 CSV 다운로드 ────────────────────────────────────────
  downloadSampleCSV(e) {
    e.preventDefault();
    const csv = '날짜,체중,체지방률,골격근량,BMI,체수분,내장지방\n2026-01-01,75.30,28.50,29.80,24.30,35.20,8\n2026-01-08,74.80,28.10,30.00,24.10,35.40,7\n';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '핏저니_체중_샘플.csv';
    a.click();
  },
};

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { BodyPage };
}
