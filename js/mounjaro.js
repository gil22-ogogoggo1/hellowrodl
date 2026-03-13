/**
 * mounjaro.js — GLP-1 투약 기록 페이지
 */

const MounjaroPage = {
  DRUGS: {
    mounjaro: { label: '마운자로', doses: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'], interval: 7 },
    wegovy:   { label: '위고비',   doses: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],        interval: 7 },
    saxenda:  { label: '삭센다',   doses: ['0.6mg', '1.2mg', '1.8mg', '2.4mg', '3mg'],          interval: 1 },
    ozempic:  { label: '오젬픽',   doses: ['0.25mg', '0.5mg', '1mg', '2mg'],                   interval: 7 },
    other:    { label: '기타',     doses: ['0.25mg', '0.5mg', '1mg', '2.5mg', '5mg', '10mg'],  interval: 7 },
  },
  SITES: ['복부', '허벅지', '팔'],
  SIDE_EFFECTS: ['구역질', '구토', '변비', '설사', '식욕저하', '피로감', '두통', '주사부위 통증'],

  render() {
    const container = document.getElementById('page-container');
    const drugOptions = Object.entries(this.DRUGS)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
    const defaultDoses = this.DRUGS.mounjaro.doses;

    container.innerHTML = `
      <div class="accent-line"></div>

      <!-- 투약 입력 폼 -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">💉 새 투약 기록</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">약품명</label>
            <select class="form-select" id="mj-drug" onchange="MounjaroPage.updateDoses('mj-dose', this.value)">
              ${drugOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">투약일</label>
            <input type="date" class="form-input" id="mj-date" value="${todayStr()}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">용량</label>
            <select class="form-select" id="mj-dose">
              ${defaultDoses.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">투약 부위</label>
            <select class="form-select" id="mj-site">
              ${this.SITES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">비용 (원)</label>
          <input type="number" class="form-input" id="mj-cost" placeholder="예: 150000" min="0">
        </div>

        <div class="form-group">
          <label class="form-label">부작용 (해당 항목 체크)</label>
          <div class="checkbox-group">
            ${this.SIDE_EFFECTS.map(e => `
              <label class="checkbox-item">
                <input type="checkbox" value="${e}" class="mj-side-effect">
                ${e}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">메모</label>
          <textarea class="form-textarea" id="mj-memo" placeholder="컨디션, 특이사항 등 자유 메모"></textarea>
        </div>

        <button class="btn btn-primary" id="mj-save-btn">기록 저장</button>
      </div>

      <!-- 다음 투약일 카드 -->
      <div id="mj-next-card"></div>

      <!-- 투약 히스토리 -->
      <div class="card-header mt-16">
        <span class="card-title">📋 투약 히스토리</span>
      </div>
      <div id="mj-list" class="record-list"></div>
    `;

    document.getElementById('mj-save-btn').addEventListener('click', () => this.save());
    this.renderNextDose();
    this.renderList();
  },

  // 약품 변경 시 용량 옵션 갱신
  updateDoses(selectId, drugKey) {
    const drug = this.DRUGS[drugKey] || this.DRUGS.other;
    const select = document.getElementById(selectId);
    if (!select) return;
    const current = select.value;
    select.innerHTML = drug.doses
      .map(d => `<option value="${d}" ${d === current ? 'selected' : ''}>${d}</option>`)
      .join('');
  },

  // 약품 키 → 라벨 변환 (구버전 호환)
  drugLabel(key) {
    return this.DRUGS[key]?.label || key || '마운자로';
  },

  // 약품 키 → 투약 간격 (일 단위)
  drugInterval(key) {
    return this.DRUGS[key]?.interval ?? 7;
  },

  save() {
    const drugName = document.getElementById('mj-drug').value;
    const date     = document.getElementById('mj-date').value;
    const dose     = document.getElementById('mj-dose').value;
    const site     = document.getElementById('mj-site').value;
    const cost     = document.getElementById('mj-cost').value;
    const memo     = document.getElementById('mj-memo').value.trim();
    const sideEffects = [...document.querySelectorAll('.mj-side-effect:checked')]
      .map(el => el.value);

    if (!date) { showToast('투약일을 입력해주세요.'); return; }

    Storage.add('mounjaro', { date, drugName, dose, site, cost: cost ? Number(cost) : null, sideEffects, memo });
    showToast('✅ 투약 기록이 저장되었습니다.');

    document.getElementById('mj-date').value = todayStr();
    document.getElementById('mj-cost').value = '';
    document.getElementById('mj-memo').value = '';
    document.querySelectorAll('.mj-side-effect:checked').forEach(el => el.checked = false);

    this.renderNextDose();
    this.renderList();
  },

  renderNextDose() {
    const records = Storage.getAll('mounjaro');
    const card = document.getElementById('mj-next-card');
    if (!card) return;

    if (records.length === 0) { card.innerHTML = ''; return; }

    const last = records[0];
    const interval = this.drugInterval(last.drugName);
    const lastDate = new Date(last.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + interval);
    const nextStr = nextDate.toISOString().slice(0, 10);
    const daysLeft = daysFromNow(nextStr);

    let daysLabel = '';
    if (daysLeft === 0) daysLabel = '<span class="text-amber">오늘!</span>';
    else if (daysLeft > 0) daysLabel = `<span class="text-green">D-${daysLeft}</span>`;
    else daysLabel = `<span class="text-coral">${Math.abs(daysLeft)}일 경과</span>`;

    const intervalLabel = interval === 1 ? '매일 투약' : `${interval}일 간격`;

    card.innerHTML = `
      <div class="card" style="border-color: rgba(255,179,0,0.25);">
        <div class="card-header">
          <span class="card-title">📅 다음 투약 예정</span>
          ${daysLabel}
        </div>
        <div>
          <div class="stat-big text-amber">${formatDate(nextStr)}</div>
          <div class="stat-label">
            마지막: ${formatDate(last.date)} · <strong>${last.dose}</strong> ·
            <span class="drug-badge drug-${last.drugName || 'mounjaro'}">${this.drugLabel(last.drugName)}</span>
            · ${intervalLabel}
          </div>
        </div>
      </div>
    `;
  },

  renderList() {
    const records = Storage.getAll('mounjaro');
    const el = document.getElementById('mj-list');
    if (!el) return;

    if (records.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💉</div>
          <p>아직 투약 기록이 없습니다.</p>
        </div>`;
      return;
    }

    el.innerHTML = records.map(r => {
      const sideStr = r.sideEffects && r.sideEffects.length ? r.sideEffects.join(', ') : '없음';
      const costStr = r.cost ? `₩${r.cost.toLocaleString()}` : '-';
      const drugKey = r.drugName || 'mounjaro';

      return `
        <div class="record-item">
          <div class="record-icon orange">💉</div>
          <div class="record-body">
            <div class="record-title">
              ${formatDate(r.date)} ·
              <span class="drug-badge drug-${drugKey}">${this.drugLabel(drugKey)}</span>
              <span class="text-amber"> ${r.dose}</span>
            </div>
            <div class="record-meta">부위: ${r.site} · 비용: ${costStr}</div>
            <div class="record-meta mt-4">부작용: ${sideStr}</div>
            ${r.memo ? `<div class="record-meta mt-4">"${escapeHTML(r.memo)}"</div>` : ''}
          </div>
          <div class="record-actions">
            <button class="btn btn-edit btn-sm" onclick="MounjaroPage.openEdit('${r.id}')">편집</button>
            <button class="btn btn-danger btn-sm" onclick="MounjaroPage.remove('${r.id}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openEdit(id) {
    const r = Storage.getById('mounjaro', id);
    if (!r) return;

    const currentDrug = r.drugName || 'mounjaro';
    const drugDoses = this.DRUGS[currentDrug]?.doses || this.DRUGS.mounjaro.doses;

    const drugOptions = Object.entries(this.DRUGS)
      .map(([k, v]) => `<option value="${k}" ${k === currentDrug ? 'selected' : ''}>${v.label}</option>`)
      .join('');

    const doseOptions = drugDoses
      .map(d => `<option value="${d}" ${r.dose === d ? 'selected' : ''}>${d}</option>`)
      .join('');

    const sideEffectChecks = this.SIDE_EFFECTS.map(e => `
      <label class="checkbox-item">
        <input type="checkbox" value="${e}" class="mj-edit-side-effect"
          ${r.sideEffects && r.sideEffects.includes(e) ? 'checked' : ''}>
        ${e}
      </label>
    `).join('');

    App.Modal.open(`
      <h2 class="modal-title">💉 투약 기록 편집</h2>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">약품명</label>
          <select class="form-select" id="mj-edit-drug"
            onchange="MounjaroPage.updateDoses('mj-edit-dose', this.value)">
            ${drugOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">투약일</label>
          <input type="date" class="form-input" id="mj-edit-date" value="${r.date}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">용량</label>
          <select class="form-select" id="mj-edit-dose">${doseOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">투약 부위</label>
          <select class="form-select" id="mj-edit-site">
            ${this.SITES.map(s => `<option value="${s}" ${r.site === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">비용 (원)</label>
        <input type="number" class="form-input" id="mj-edit-cost" value="${r.cost || ''}" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">부작용</label>
        <div class="checkbox-group">${sideEffectChecks}</div>
      </div>
      <div class="form-group">
        <label class="form-label">메모</label>
        <textarea class="form-textarea" id="mj-edit-memo">${escapeHTML(r.memo || '')}</textarea>
      </div>
      <button class="btn btn-primary" onclick="MounjaroPage.saveEdit('${id}')">수정 완료</button>
    `);
  },

  saveEdit(id) {
    const drugName    = document.getElementById('mj-edit-drug').value;
    const date        = document.getElementById('mj-edit-date').value;
    const dose        = document.getElementById('mj-edit-dose').value;
    const site        = document.getElementById('mj-edit-site').value;
    const cost        = document.getElementById('mj-edit-cost').value;
    const memo        = document.getElementById('mj-edit-memo').value.trim();
    const sideEffects = [...document.querySelectorAll('.mj-edit-side-effect:checked')].map(el => el.value);

    if (!date) { showToast('투약일을 입력해주세요.'); return; }

    Storage.update('mounjaro', id, { date, drugName, dose, site, cost: cost ? Number(cost) : null, sideEffects, memo });
    App.Modal.close();
    showToast('✅ 수정되었습니다.');
    this.renderNextDose();
    this.renderList();
  },

  remove(id) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    Storage.remove('mounjaro', id);
    showToast('삭제되었습니다.');
    this.renderNextDose();
    this.renderList();
  },
};
