/**
 * charts.js — Chart.js 차트 렌더링 유틸
 */

const Charts = {
  _defaults: {
    font: { family: "'Outfit', sans-serif" },
    color: 'rgba(255,255,255,0.45)',
  },

  _gridColor: 'rgba(255,255,255,0.06)',
  _orangeGrad: null,

  _getGrad(ctx, height) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0,   'rgba(255,120,41,0.35)');
    grad.addColorStop(1,   'rgba(255,120,41,0.0)');
    return grad;
  },

  renderWeightChart(canvasId, records) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (window._bodyChart) {
      window._bodyChart.destroy();
      window._bodyChart = null;
    }

    const ctx = canvas.getContext('2d');
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
          backgroundColor: this._getGrad(ctx, canvas.offsetHeight || 200),
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
            backgroundColor: 'rgba(18,18,26,0.95)',
            borderColor: 'rgba(255,120,41,0.3)',
            borderWidth: 1,
            titleColor: '#ffb300',
            bodyColor: 'rgba(255,255,255,0.8)',
            callbacks: {
              label: ctx => ` ${ctx.raw} kg`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: this._gridColor },
            ticks: { color: this._defaults.color, font: { size: 11 } },
          },
          y: {
            grid: { color: this._gridColor },
            ticks: {
              color: this._defaults.color,
              font: { size: 11 },
              callback: v => `${v}kg`,
            },
          },
        },
      },
    });
  },

  renderDashWeightChart(canvasId, records) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (window._dashWeightChart) {
      window._dashWeightChart.destroy();
      window._dashWeightChart = null;
    }

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
          backgroundColor: this._getGrad(ctx, canvas.offsetHeight || 160),
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
            backgroundColor: 'rgba(18,18,26,0.95)',
            borderColor: 'rgba(255,120,41,0.3)',
            borderWidth: 1,
            titleColor: '#ffb300',
            bodyColor: 'rgba(255,255,255,0.8)',
            callbacks: { label: ctx => ` ${ctx.raw}kg` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this._defaults.color, font: { size: 10 }, maxTicksLimit: 6 },
          },
          y: {
            grid: { color: this._gridColor },
            ticks: {
              color: this._defaults.color,
              font: { size: 10 },
              callback: v => `${v}`,
              maxTicksLimit: 5,
            },
          },
        },
      },
    });
  },
};
