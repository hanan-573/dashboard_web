// ============================================================
//  CONFIG
// ============================================================
const API_URL = `http://${window.location.hostname}:3002/api`;
const MAX_POINTS = 60;

// ============================================================
//  THEME
// ============================================================
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") html.classList.add("dark");
  else html.classList.remove("dark");
  localStorage.setItem("theme", theme);
}
applyTheme(localStorage.getItem("theme") || "dark");
themeToggle.addEventListener("click", () => {
  applyTheme(html.classList.contains("dark") ? "light" : "dark");
});

// ============================================================
//  HELPERS
// ============================================================
const $ = (id) => document.getElementById(id);

function getTickColor() {
  return html.classList.contains('dark') ? '#94a3b8' : '#64748b';
}
function getGridColor() {
  return html.classList.contains('dark') ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)';
}
function pctColor(p) {
  if (p < 50) return 'from-emerald-500 to-green-500';
  if (p < 80) return 'from-amber-500 to-orange-500';
  return 'from-rose-500 to-red-500';
}

// ============================================================
//  LINE CHART FACTORY
// ============================================================
const chartLabels = Array(MAX_POINTS).fill("");

function makeLineChart(canvasId, color) {
  const ctx = $(canvasId).getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, color + '66');
  gradient.addColorStop(1, color + '00');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        data: Array(MAX_POINTS).fill(0),
        borderColor: color,
        backgroundColor: gradient,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true, max: 100,
          grid: { color: getGridColor() },
          ticks: { color: getTickColor(), font: { size: 10 }, callback: (v) => v + '%' }
        }
      },
      elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } }
    }
  });
}

const cpuChart = makeLineChart("cpuChart", "#3b82f6");
const memoryChart = makeLineChart("memoryChart", "#a855f7");
const swapChart = makeLineChart("swapChart", "#f59e0b");

// RAM Donut
const ramDonut = new Chart($("ramDonut").getContext("2d"), {
  type: 'doughnut',
  data: {
    labels: ['Used', 'Available'],
    datasets: [{
      data: [0, 100],
      backgroundColor: ['#a855f7', 'rgba(148,163,184,0.15)'],
      borderWidth: 0,
      cutout: '75%'
    }]
  },
  options: {
    responsive: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { duration: 500 }
  }
});

// ============================================================
//  BUFFERS
// ============================================================
const cpuData = Array(MAX_POINTS).fill(0);
const ramData = Array(MAX_POINTS).fill(0);
const swapData = Array(MAX_POINTS).fill(0);

// ============================================================
//  RENDER — CPU
// ============================================================
function renderCPU(cpu) {
  $("cpuPercent").textContent = cpu.usage_percent.toFixed(1) + '%';
  $("cpuFreq").textContent = cpu.frequency ? cpu.frequency.toFixed(0) + ' MHz' : 'N/A';
  $("cpuBar").style.width = cpu.usage_percent + '%';
  $("cpuChartVal").textContent = cpu.usage_percent.toFixed(1) + '%';
  $("coresInfo").textContent = `${cpu.cores_physical}p / ${cpu.cores_logical}l`;

  const grid = $("perCoreGrid");
  if (grid.children.length !== cpu.per_cpu.length) {
    grid.innerHTML = '';
    cpu.per_cpu.forEach((_, i) => {
      const div = document.createElement('div');
      div.className = 'rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800';
      div.innerHTML =
        '<div class="flex items-center justify-between mb-2">' +
          '<span class="text-xs font-medium text-slate-500 dark:text-slate-400">C' + i + '</span>' +
          '<span class="text-xs font-mono core-val text-slate-700 dark:text-slate-200">0%</span>' +
        '</div>' +
        '<div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">' +
          '<div class="core-bar h-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-bar" style="width:0%"></div>' +
        '</div>';
      grid.appendChild(div);
    });
  }
  cpu.per_cpu.forEach((val, i) => {
    const card = grid.children[i];
    if (!card) return;
    card.querySelector('.core-val').textContent = val.toFixed(0) + '%';
    const bar = card.querySelector('.core-bar');
    bar.style.width = val + '%';
    bar.className = 'core-bar h-full bg-gradient-to-r ' + pctColor(val) + ' progress-bar';
  });

  cpuData.push(cpu.usage_percent);
  cpuData.shift();
  cpuChart.data.datasets[0].data = [...cpuData];
  cpuChart.update('none');
}

// ============================================================
//  RENDER — TOP RAM / SWAP CARDS
// ============================================================
function renderRAM(ram) {
  $("ramPercent").textContent = ram.percent.toFixed(1) + '%';
  $("ramDetail").textContent = `${ram.used_human} / ${ram.total_human}`;
  $("ramBar").style.width = ram.percent + '%';

  $("swapPercent").textContent = ram.swap_percent.toFixed(1) + '%';
  $("swapDetail").textContent = `${ram.swap_used_human} / ${ram.swap_total_human}`;
  $("swapBar").style.width = ram.swap_percent + '%';

  ramData.push(ram.percent);
  ramData.shift();
  swapData.push(ram.swap_percent);
  swapData.shift();
}

// ============================================================
//  RENDER — MEMORY SECTION
// ============================================================
function renderMemory(ram) {
  $("memHeaderVal").textContent = ram.percent.toFixed(1) + '%';
  $("memTotal").textContent = ram.total_human;
  $("memUsed").textContent = ram.used_human;
  $("memAvail").textContent = ram.available_human;
  $("memSwapTotal").textContent = ram.swap_total_human;
  $("memChartVal").textContent = ram.percent.toFixed(1) + '%';
  $("swapChartVal").textContent = ram.swap_percent.toFixed(1) + '%';

  memoryChart.data.datasets[0].data = [...ramData];
  memoryChart.update('none');
  swapChart.data.datasets[0].data = [...swapData];
  swapChart.update('none');

  ramDonut.data.datasets[0].data = [ram.percent, 100 - ram.percent];
  ramDonut.update('none');
  $("donutPercent").textContent = ram.percent.toFixed(0) + '%';

  const usedPct = (ram.used / ram.total) * 100;
  const availPct = (ram.available / ram.total) * 100;
  const swapPct = ram.swap_total > 0 ? (ram.swap_used / ram.swap_total) * 100 : 0;

  $("donutUsed").textContent = ram.used_human;
  $("donutUsedBar").style.width = usedPct + '%';
  $("donutAvail").textContent = ram.available_human;
  $("donutAvailBar").style.width = availPct + '%';
  $("donutSwap").textContent = ram.swap_used_human;
  $("donutSwapBar").style.width = swapPct + '%';
}

// ============================================================
//  RENDER — STORAGE
// ============================================================
function renderStorage(devices) {
  $("storageList").innerHTML = devices.map(d => {
    const color = pctColor(d.percent);
    return (
      '<div class="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">' +
        '<div class="flex flex-wrap items-center justify-between gap-2 mb-3">' +
          '<div class="flex items-center gap-3">' +
            '<div class="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">' +
              '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>' +
            '</div>' +
            '<div>' +
              '<p class="font-semibold text-sm">' + d.device + '</p>' +
              '<p class="text-xs text-slate-500 dark:text-slate-400">' + d.mountpoint + ' • ' + (d.fstype || 'unknown') + '</p>' +
            '</div>' +
          '</div>' +
          '<span class="text-sm font-mono font-semibold">' + d.percent.toFixed(1) + '%</span>' +
        '</div>' +
        '<div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">' +
          '<div class="h-full bg-gradient-to-r ' + color + ' progress-bar" style="width:' + d.percent + '%"></div>' +
        '</div>' +
        '<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">' +
          '<span>Used: <b class="text-slate-700 dark:text-slate-200">' + d.used_human + '</b></span>' +
          '<span>Free: <b class="text-slate-700 dark:text-slate-200">' + d.free_human + '</b></span>' +
          '<span>Total: <b class="text-slate-700 dark:text-slate-200">' + d.total_human + '</b></span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

// ============================================================
//  RENDER — SYSTEM
// ============================================================
function renderSystem(sys) {
  const items = [
    { label: 'OS', value: `${sys.os} ${sys.os_release}` },
    { label: 'Version', value: sys.os_version },
    { label: 'Architecture', value: sys.architecture },
    { label: 'Hostname', value: sys.hostname },
    { label: 'Uptime', value: sys.uptime_human },
    { label: 'Boot Time', value: new Date(sys.boot_time * 1000).toLocaleString() }
  ];
  $("systemInfoGrid").innerHTML = items.map(it =>
    '<div class="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">' +
      '<p class="text-xs text-slate-500 dark:text-slate-400 mb-1">' + it.label + '</p>' +
      '<p class="text-sm font-medium break-words">' + (it.value || 'N/A') + '</p>' +
    '</div>'
  ).join('');

  $("uptime").textContent = sys.uptime_human;
  $("hostname").textContent = sys.hostname;
}

// ============================================================
//  SSE CONNECTION
// ============================================================
let eventSource;
let retryDelay = 1000;

function setStatus(text, color) {
  $("statusText").textContent = text;
  const dot = $("statusDot");
  const colors = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  dot.className = 'w-2 h-2 rounded-full ' + (colors[color] || 'bg-slate-500') + ' pulse-dot';
}

function connectSSE() {
  setStatus('Connecting...', 'amber');
  eventSource = new EventSource(API_URL);

  eventSource.onopen = () => {
    retryDelay = 1000;
    setStatus('Live', 'emerald');
  };

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.status !== 'ok') return;
      renderCPU(data.cpu);
      renderRAM(data.ram);
      renderMemory(data.ram);
      renderStorage(data.storage);
      renderSystem(data.system);
      $("lastUpdate").textContent = new Date(data.timestamp * 1000).toLocaleTimeString();
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  eventSource.onerror = () => {
    setStatus('Reconnecting...', 'rose');
    eventSource.close();
    setTimeout(connectSSE, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 10000);
  };
}

connectSSE();