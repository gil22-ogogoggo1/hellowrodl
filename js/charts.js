/**
 * charts.js — Chart.js 차트 렌더링 유틸
 */

const Charts = {
  _defaults: {
    font: { family: "'Outfit', sans-serif" },
    color: 'rgba(255,255,255,0.45)',
  },

  _gridColor: 'rgba(255,255,255,0.06)',

  // Chart.js 미로드 시 graceful fallback
  _guard(canvasId) {
    if (typeof Chart === 'undefined') {
      const el = document.getElementById(canvasId);
      if (el) {
        el.parentElement.innerHTML =
          '<p class="text-dim" style="text-align:center;padding:20px;font-size:13px;">차트를 불러올 수 없습니다 (오프라인 환경)</p>';
      }
      return false;
    }
    return true;
  },

  _destroy(key) {
    if (window[key]) { window[key].destroy(); window[key] = null; }
  },

  _getGrad(ctx, color, height) {
    const [r, g, b] = color;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0.0)`);
    return grad;
  },

  _tooltipDefaults() {
    return {
      backgroundColor: 'rgba(18,18,26,0.95)',
      borderColor: 'rgba(255,120,41,0.3)',
      borderWidth: 1,
      titleColor: '#ffb300',
      bodyColor: 'rgba(255,255,255,0.8)',
    };
  },

  _scaleDefaults() {
    return {
      x: {
        grid: { color: this._gridColor },
        ticks: { color: this._defaults.color, font: { size: 11 } },
      },
      y: {
        grid: { color: this._gridColor },
        ticks: { color: this._defaults.color, font: { size: 11 } },
      },
    };
  },

  // ── 체중 단일 라인 (body.js 메인 차트) ──
  renderWeightChart(canvasId, records) {
    if (!this._guard(canvasId)) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this._destroy('_bodyChart');

    const ctx     = canvas.getContext('2d');
    const labels  = records.map(r => formatDateShort(r.date));
    const weights = records.map(r => r.weight);

    window._bodyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '체중 (kg)',
          data: weights,
          borderColor: '#ff7829',
          borderWidth: 2.5,
          backgroundColor: this._getGrad(ctx, [255, 120, 41], canvas.offsetHeight || 200),
          pointBackgroundColor: '#ff7829',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this._tooltipDefaults(),
            callbacks: { label: c => ` ${c.raw} kg` },
          },
        },
        scales: {
          ...this._scaleDefaults(),
          y: {
            ...this._scaleDefaults().y,
            ticks: { ...this._scaleDefaults().y.ticks, callback: v => `${v}kg` },
          },
        },
      },
    });
  },

  // ── 체성분 듀얼 라인 (fat% + muscle) ──
  renderBodyCompChart(canvasId, records) {
    if (!this._guard(canvasId)) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this._destroy('_bodyCompChart');

    const filtered = records.filter(r => r.fat || r.muscle);
    if (filtered.length < 2) {
      canvas.parentElement.innerHTML =
        '<p class="text-dim" style="text-align:center;padding:16px;font-size:13px;">인바디 데이터 2개 이상 필요</p>';
      return;
    }

    const ctx    = canvas.getContext('2d');
    const labels = filtered.map(r => formatDateShort(r.date));

    window._bodyCompChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '체지방률 (%)',
            data: filtered.map(r => r.fat || null),
            borderColor: '#ff4d3d',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.35,
            fill: false,
            spanGaps: true,
          },
          {
            label: '골격근량 (kg)',
            data: filtered.map(r => r.muscle || null),
            borderColor: '#4ade80',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.35,
            fill: false,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: 'rgba(255,255,255,0.65)', font: { size: 11 } },
          },
          tooltip: { ...this._tooltipDefaults() },
        },
        scales: this._scaleDefaults(),
      },
    });
  },

  // ── 대시보드 미니 체중 차트 ──
  renderDashWeightChart(canvasId, records) {
    if (!this._guard(canvasId)) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this._destroy('_dashWeightChart');

    const ctx    = canvas.getContext('2d');
    const labels  = records.map(r => formatDateShort(r.date));
    const weights = records.map(r => r.weight);

    window._dashWeightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '체중',
          data: weights,
          borderColor: '#ff7829',
          borderWidth: 2,
          backgroundColor: this._getGrad(ctx, [255, 120, 41], canvas.offsetHeight || 160),
          pointBackgroundColor: '#ff7829',
          pointRadius: 3,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this._tooltipDefaults(),
            callbacks: { label: c => ` ${c.raw}kg` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this._defaults.color, font: { size: 10 }, maxTicksLimit: 6 },
          },
          y: {
            grid: { color: this._gridColor },
            ticks: { color: this._defaults.color, font: { size: 10 }, maxTicksLimit: 5 },
          },
        },
      },
    });
  },

  // ── 운동 빈도 막대 차트 (주별) ──
  renderExerciseFreqChart(canvasId, records) {
    if (!this._guard(canvasId)) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this._destroy('_exFreqChart');

    // 최근 8주 데이터 집계
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i + 1) * 7 + 1);
      const end   = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const label = `${start.getMonth()+1}/${start.getDate()}`;
      const count = records.filter(r => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      }).length;
      weeks.push({ label, count });
    }

    const ctx = canvas.getContext('2d');
    window._exFreqChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks.map(w => w.label),
        datasets: [{
          label: '운동 횟수',
          data: weeks.map(w => w.count),
          backgroundColor: 'rgba(74,222,128,0.6)',
          borderColor: '#4ade80',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this._tooltipDefaults(),
            callbacks: { label: c => ` ${c.raw}회` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this._defaults.color, font: { size: 10 } },
          },
          y: {
            grid: { color: this._gridColor },
            ticks: { color: this._defaults.color, font: { size: 10 }, stepSize: 1, precision: 0 },
            min: 0,
          },
        },
      },
    });
  },

  // ── 칼로리 추이 라인 (최근 14일) ──
  renderCalorieTrendChart(canvasId, records) {
    if (!this._guard(canvasId)) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this._destroy('_calTrendChart');

    // 최근 14일 날짜 배열 생성
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const dailyCal = days.map(date => {
      const dayRecs = records.filter(r => r.date === date && r.calories);
      return dayRecs.reduce((s, r) => s + r.calories, 0) || null;
    });

    const ctx = canvas.getContext('2d');
    window._calTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days.map(d => formatDateShort(d)),
        datasets: [{
          label: '칼로리 (kcal)',
          data: dailyCal,
          backgroundColor: 'rgba(96,165,250,0.55)',
          borderColor: '#60a5fa',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this._tooltipDefaults(),
            callbacks: { label: c => ` ${c.raw ? c.raw.toLocaleString() : 0} kcal` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this._defaults.color, font: { size: 10 }, maxTicksLimit: 7 },
          },
          y: {
            grid: { color: this._gridColor },
            ticks: {
              color: this._defaults.color,
              font: { size: 10 },
              callback: v => v ? `${(v/1000).toFixed(1)}k` : '0',
            },
            min: 0,
          },
        },
      },
    });
  },
};
