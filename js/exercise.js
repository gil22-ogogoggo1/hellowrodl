/**
 * exercise.js — 운동 기록 페이지
 */

const ExercisePage = {
  TYPES: ['런닝', '걷기', '웨이트', '자전거', '수영', '기타'],

  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 운동 통계 요약 -->
      <div id="exercise-summary"></div>

      <!-- 입력 폼 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🏃 새 운동 기록</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">날짜</label>
            <input type="date" class="form-input" id="ex-date" value="${todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">운동 종류</label>
            <select class="form-select" id="ex-type">
              ${this.TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- 런닝/걷기/자전거 상세 -->
        <div id="ex-cardio-fields">
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">거리 (km)</label>
              <input type="number" class="form-input" id="ex-distance" placeholder="5.0" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">시간 (분)</label>
              <input type="number" class="form-input" id="ex-duration" placeholder="30" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">페이스 (분/km)</label>
              <input type="text" class="form-input" id="ex-pace" placeholder="6'00&quot;">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">장소</label>
            <input type="text" class="form-input" id="ex-place" placeholder="예: 한강공원, 트레드밀">
          </div>
        </div>

        <!-- 웨이트 상세 -->
        <div id="ex-weight-fields" class="hidden">
          <div id="ex-sets-container">
            <div class="form-group">
              <label class="form-label">운동명 / 세트수 / 무게(kg) / 횟수</label>
              <div id="ex-sets-list">
                ${this.setRowHTML(0)}
              </div>
              <button class="btn btn-ghost btn-sm mt-8" id="ex-add-set-btn" style="width:100%;">+ 운동 추가</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">메모</label>
          <textarea class="form-textarea" id="ex-memo" placeholder="컨디션, 특이사항 등" style="min-height:60px;"></textarea>
        </div>

        <button class="btn btn-primary" id="ex-save-btn">기록 저장</button>
      </div>

      <!-- 운동 데이터 가져오기 -->
      <div class="card" style="border-color:rgba(74,222,128,0.2);">
        <div class="card-header" style="margin-bottom:10px;">
          <span class="card-title">📥 삼성헬스 운동 가져오기</span>
        </div>
        <div class="sync-section">
          <p class="sync-desc">삼성헬스 앱 → 설정 → 개인 데이터 다운로드 → ZIP 파일 업로드<br>또는 <code>exercise</code> CSV 파일을 직접 업로드하세요.<br><span class="text-dim">런닝·걷기·자전거·웨이트·수영 자동 변환</span></p>
          <label class="btn btn-ghost" style="cursor:pointer;display:inline-flex;">
            📂 파일 선택 (.zip / .csv)
            <input type="file" accept=".zip,.csv" id="sh-exercise-file" style="display:none;" onchange="ExercisePage.importFile(this)">
          </label>
          <div id="sh-exercise-result" style="margin-top:8px;"></div>
        </div>
      </div>

      <!-- 운동 기록 리스트 -->
      <div class="card-header mt-16">
        <span class="card-title">📋 운동 기록</span>
      </div>
      <div id="exercise-list" class="record-list"></div>
    `;

    // 운동 종류 변경 시 필드 토글
    document.getElementById('ex-type').addEventListener('change', () => this.toggleFields());
    document.getElementById('ex-add-set-btn').addEventListener('click', () => this.addSetRow());
    document.getElementById('ex-save-btn').addEventListener('click', () => this.save());

    this.toggleFields();
    this.renderSummary();
    this.renderList();
  },

  setRowHTML(idx) {
    return `
      <div class="form-row set-row" data-idx="${idx}" style="margin-bottom:8px; grid-template-columns: 2fr 1fr 1fr 1fr auto;">
        <input type="text" class="form-input set-name" placeholder="운동명" style="grid-column:1;">
        <input type="number" class="form-input set-sets" placeholder="세트" min="1">
        <input type="number" class="form-input set-weight" placeholder="kg" min="0" step="0.5">
        <input type="number" class="form-input set-reps" placeholder="횟수" min="1">
        <button class="btn btn-danger" onclick="ExercisePage.removeSetRow(this)" style="padding:8px 10px;">×</button>
      </div>
    `;
  },

  editSetRowHTML(idx, set = {}) {
    return `
      <div class="form-row set-row" data-idx="${idx}" style="margin-bottom:8px; grid-template-columns: 2fr 1fr 1fr 1fr auto;">
        <input type="text" class="form-input set-name" placeholder="운동명" value="${escapeHTML(set.name || '')}" style="grid-column:1;">
        <input type="number" class="form-input set-sets" placeholder="세트" min="1" value="${set.sets || ''}">
        <input type="number" class="form-input set-weight" placeholder="kg" min="0" step="0.5" value="${set.weight || ''}">
        <input type="number" class="form-input set-reps" placeholder="횟수" min="1" value="${set.reps || ''}">
        <button class="btn btn-danger" onclick="ExercisePage.removeEditSetRow(this)" style="padding:8px 10px;">×</button>
      </div>
    `;
  },

  addSetRow() {
    const container = document.getElementById('ex-sets-list');
    const idx = container.querySelectorAll('.set-row').length;
    const div = document.createElement('div');
    div.innerHTML = this.setRowHTML(idx);
    container.appendChild(div.firstElementChild);
  },

  removeSetRow(btn) {
    const row = btn.closest('.set-row');
    const container = document.getElementById('ex-sets-list');
    if (container.querySelectorAll('.set-row').length > 1) {
      row.remove();
    }
  },

  addEditSetRow() {
    const container = document.getElementById('ex-edit-sets-list');
    if (!container) return;
    const idx = container.querySelectorAll('.set-row').length;
    const div = document.createElement('div');
    div.innerHTML = this.editSetRowHTML(idx);
    container.appendChild(div.firstElementChild);
  },

  removeEditSetRow(btn) {
    const row = btn.closest('.set-row');
    const container = document.getElementById('ex-edit-sets-list');
    if (container && container.querySelectorAll('.set-row').length > 1) {
      row.remove();
    }
  },

  toggleFields() {
    const type = document.getElementById('ex-type').value;
    const cardio  = document.getElementById('ex-cardio-fields');
    const weights = document.getElementById('ex-weight-fields');

    if (type === '웨이트') {
      cardio.classList.add('hidden');
      weights.classList.remove('hidden');
    } else if (type === '기타') {
      cardio.classList.add('hidden');
      weights.classList.add('hidden');
    } else {
      cardio.classList.remove('hidden');
      weights.classList.add('hidden');
    }
  },

  save() {
    const date = document.getElementById('ex-date').value;
    const type = document.getElementById('ex-type').value;
    const memo = document.getElementById('ex-memo').value.trim();

    if (!date) { showToast('날짜를 입력해주세요.'); return; }

    const record = { date, type, memo };

    if (type === '웨이트') {
      const sets = [];
      document.querySelectorAll('.set-row').forEach(row => {
        const name   = row.querySelector('.set-name').value.trim();
        const setNum = row.querySelector('.set-sets').value;
        const weight = row.querySelector('.set-weight').value;
        const reps   = row.querySelector('.set-reps').value;
        if (name) sets.push({ name, sets: setNum ? parseInt(setNum) : null, weight: weight ? parseFloat(weight) : null, reps: reps ? parseInt(reps) : null });
      });
      record.sets = sets;
    } else if (type !== '기타') {
      const distance = document.getElementById('ex-distance').value;
      const duration = document.getElementById('ex-duration').value;
      const pace     = document.getElementById('ex-pace').value.trim();
      const place    = document.getElementById('ex-place').value.trim();
      if (distance) record.distance = parseFloat(distance);
      if (duration) record.duration = parseInt(duration);
      if (pace)     record.pace     = pace;
      if (place)    record.place    = place;
    }

    Storage.add('exercise', record);
    showToast('✅ 운동 기록이 저장되었습니다.');

    document.getElementById('ex-date').value = todayStr();
    document.getElementById('ex-memo').value = '';
    if (document.getElementById('ex-distance')) document.getElementById('ex-distance').value = '';
    if (document.getElementById('ex-duration')) document.getElementById('ex-duration').value = '';
    if (document.getElementById('ex-pace'))     document.getElementById('ex-pace').value = '';
    if (document.getElementById('ex-place'))    document.getElementById('ex-place').value = '';

    // 웨이트 세트 초기화
    const setsList = document.getElementById('ex-sets-list');
    if (setsList) {
      setsList.innerHTML = this.setRowHTML(0);
    }

    this.renderSummary();
    this.renderList();
  },

  renderSummary() {
    const el = document.getElementById('exercise-summary');
    if (!el) return;
    const all = Storage.getAll('exercise');
    if (all.length === 0) { el.innerHTML = ''; return; }

    // 이번 달
    const now = new Date();
    const thisMonth = all.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const totalDist = thisMonth
      .filter(r => r.distance)
      .reduce((s, r) => s + r.distance, 0)
      .toFixed(1);

    const typeCounts = {};
    thisMonth.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    el.innerHTML = `
      <div class="dash-grid" style="margin-bottom:12px;">
        <div class="dash-card">
          <div class="stat-label">이번 달 운동</div>
          <div class="stat-big text-green">${thisMonth.length}<span class="stat-unit">회</span></div>
        </div>
        <div class="dash-card">
          <div class="stat-label">이번 달 거리</div>
          <div class="stat-big text-blue">${totalDist}<span class="stat-unit">km</span></div>
        </div>
        ${topType ? `
        <div class="dash-card full">
          <div class="stat-label">가장 많은 운동</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px;">${topType[0]} <span class="text-dim" style="font-size:14px;">· ${topType[1]}회</span></div>
        </div>` : ''}
      </div>
    `;
  },

  renderList() {
    const records = Storage.getAll('exercise');
    const el = document.getElementById('exercise-list');
    if (!el) return;

    if (records.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏃</div>
          <p>아직 운동 기록이 없습니다.</p>
        </div>`;
      return;
    }

    const typeIcon = { 런닝: '🏃', 걷기: '🚶', 웨이트: '🏋️', 자전거: '🚴', 수영: '🏊', 기타: '💪' };
    const typeColor = { 런닝: 'orange', 걷기: 'green', 웨이트: 'blue', 자전거: 'purple', 수영: 'blue', 기타: 'amber' };

    el.innerHTML = records.map(r => {
      let detail = '';
      if (r.distance) detail += `${r.distance}km`;
      if (r.duration) detail += ` · ${r.duration}분`;
      if (r.pace)     detail += ` · ${escapeHTML(r.pace)}/km`;
      if (r.place)    detail += ` · ${escapeHTML(r.place)}`;
      if (r.sets && r.sets.length) {
        detail = r.sets.map(s => `${escapeHTML(s.name || '')}${s.sets ? ` ${s.sets}세트` : ''}${s.weight ? ` ${s.weight}kg` : ''}${s.reps ? ` ${s.reps}회` : ''}`).join(', ');
      }

      return `
        <div class="record-item">
          <div class="record-icon ${typeColor[r.type] || 'amber'}">${typeIcon[r.type] || '💪'}</div>
          <div class="record-body">
            <div class="record-title">${formatDate(r.date)} · <span class="text-orange">${r.type}</span></div>
            ${detail ? `<div class="record-meta mt-4">${detail}</div>` : ''}
            ${r.memo ? `<div class="record-meta mt-4">"${escapeHTML(r.memo)}"</div>` : ''}
          </div>
          <div class="record-actions">
            <button class="btn btn-edit btn-sm" onclick="ExercisePage.openEdit('${r.id}')">편집</button>
            <button class="btn btn-danger btn-sm" onclick="ExercisePage.remove('${r.id}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openEdit(id) {
    const r = Storage.getById('exercise', id);
    if (!r) return;

    let extraFields = '';
    if (r.type === '웨이트') {
      const sets = r.sets && r.sets.length ? r.sets : [{}];
      extraFields = `
        <div class="form-group">
          <label class="form-label">운동 세트 (운동명 / 세트 / kg / 횟수)</label>
          <div id="ex-edit-sets-list">
            ${sets.map((s, i) => this.editSetRowHTML(i, s)).join('')}
          </div>
          <button class="btn btn-ghost btn-sm mt-8" onclick="ExercisePage.addEditSetRow()" style="width:100%;">+ 운동 추가</button>
        </div>
      `;
    } else if (r.type !== '기타') {
      extraFields = `
        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">거리 (km)</label>
            <input type="number" class="form-input" id="ex-edit-distance" value="${r.distance || ''}" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">시간 (분)</label>
            <input type="number" class="form-input" id="ex-edit-duration" value="${r.duration || ''}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">페이스</label>
            <input type="text" class="form-input" id="ex-edit-pace" value="${escapeHTML(r.pace || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">장소</label>
          <input type="text" class="form-input" id="ex-edit-place" value="${escapeHTML(r.place || '')}">
        </div>
      `;
    }

    App.Modal.open(`
      <h2 class="modal-title">🏃 운동 기록 편집</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">날짜</label>
          <input type="date" class="form-input" id="ex-edit-date" value="${r.date}">
        </div>
        <div class="form-group">
          <label class="form-label">운동 종류</label>
          <div class="form-input" style="display:flex;align-items:center;color:var(--text-sub);">${r.type}</div>
        </div>
      </div>
      ${extraFields}
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="ex-edit-memo" style="min-height:60px;">${escapeHTML(r.memo || '')}</textarea>
      </div>
      <button class="btn btn-primary" onclick="ExercisePage.saveEdit('${id}')">수정 완료</button>
    `);
  },

  saveEdit(id) {
    const r = Storage.getById('exercise', id);
    if (!r) return;

    const date = document.getElementById('ex-edit-date').value;
    const memo = document.getElementById('ex-edit-memo').value.trim();

    if (!date) { showToast('날짜를 입력해주세요.'); return; }

    const changes = { date, memo };

    if (r.type === '웨이트') {
      const sets = [];
      document.querySelectorAll('#ex-edit-sets-list .set-row').forEach(row => {
        const name   = row.querySelector('.set-name').value.trim();
        const setNum = row.querySelector('.set-sets').value;
        const weight = row.querySelector('.set-weight').value;
        const reps   = row.querySelector('.set-reps').value;
        if (name) sets.push({ name, sets: setNum ? parseInt(setNum) : null, weight: weight ? parseFloat(weight) : null, reps: reps ? parseInt(reps) : null });
      });
      changes.sets = sets;
    } else if (r.type !== '기타') {
      const distance = document.getElementById('ex-edit-distance')?.value;
      const duration = document.getElementById('ex-edit-duration')?.value;
      const pace     = document.getElementById('ex-edit-pace')?.value.trim();
      const place    = document.getElementById('ex-edit-place')?.value.trim();
      changes.distance = distance ? parseFloat(distance) : null;
      changes.duration = duration ? parseInt(duration) : null;
      changes.pace     = pace || null;
      changes.place    = place || null;
    }

    Storage.update('exercise', id, changes);
    App.Modal.close();
    showToast('✅ 수정되었습니다.');
    this.renderSummary();
    this.renderList();
  },

  remove(id) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    Storage.remove('exercise', id);
    showToast('삭제되었습니다.');
    this.renderSummary();
    this.renderList();
  },

  // ── 삼성헬스 운동 ZIP / CSV 가져오기 ───────────────────────
  async importFile(input) {
    const file = input.files[0];
    if (!file) return;

    const result = document.getElementById('sh-exercise-result');
    result.innerHTML = `<p class="text-dim" style="font-size:12px;">⏳ 처리 중...</p>`;

    try {
      let res;
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zipRes = await Sync.importSamsungZip(file);
        res = zipRes.exercise;
        if (zipRes.body.success > 0) {
          showToast(`체중 데이터 ${zipRes.body.success}건도 가져왔습니다.`);
        }
      } else {
        const text = await file.text();
        res = Sync.importSamsungExercise(text);
      }

      result.innerHTML = `<p class="sync-success">✅ ${res.success}건 추가 / ${res.skip}건 건너뜀</p>`;
      if (res.success > 0) {
        showToast(`✅ 운동 기록 ${res.success}건을 가져왔습니다.`);
        this.renderSummary();
        this.renderList();
      }
    } catch (err) {
      result.innerHTML = `<p class="sync-error">⚠️ ${escapeHTML(err.message)}</p>`;
    }
    input.value = '';
  },
};
