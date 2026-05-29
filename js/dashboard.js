/* ============================================
   YOROTA — DASHBOARD PAGE (Live Data)
   ============================================ */

async function renderDashboard() {
  const content = document.getElementById('main-content');

  // Fetch all stats in parallel
  const [stats, recentIncidents, weeklyTrend, typeBreakdown, monthlyFines, severity] = await Promise.all([
    DB.dashboard.getStats(),
    DB.incidents.getRecent(6),
    DB.incidents.getWeeklyTrend(),
    DB.incidents.getByType(),
    DB.incidents.getMonthlyFines(),
    DB.incidents.getBySeverity(),
  ]);

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Dashboard</span></div>
        <h1>Operations Overview</h1>
        <p>${new Date().toLocaleDateString('en-NG', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span class="live-dot">Live</span>
        <button class="btn btn-primary btn-sm" onclick="navigate('incidents')">
          <i class="fas fa-plus"></i> New Incident
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4">
      <div class="kpi-card yellow">
        <div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-car"></i></div></div>
        <div class="kpi-value" id="kpi-vehicles">—</div>
        <div class="kpi-label">Registered Vehicles</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-top"><div class="kpi-icon red"><i class="fas fa-exclamation-triangle"></i></div></div>
        <div class="kpi-value" id="kpi-incidents">—</div>
        <div class="kpi-label">Incidents Today</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-top"><div class="kpi-icon green"><i class="fas fa-user-shield"></i></div></div>
        <div class="kpi-value" id="kpi-officers">—</div>
        <div class="kpi-label">Officers on Duty</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-top"><div class="kpi-icon blue"><i class="fas fa-money-bill-wave"></i></div></div>
        <div class="kpi-value" id="kpi-fines">—</div>
        <div class="kpi-label">Fines Collected (MTD)</div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-2-1">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Weekly Incident Trend</div><div class="card-subtitle">Last 7 days</div></div>
        </div>
        <div class="chart-container" style="height:240px;"><canvas id="incidentTrendChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Incident Types</div><div class="card-subtitle">This month</div></div>
        <div class="chart-container" style="height:200px;"><canvas id="incidentTypeChart"></canvas></div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid-2-1">
      <div class="card">
        <div class="card-header"><div class="card-title">Monthly Fines Collected</div><div class="card-subtitle">Revenue trend — ${new Date().getFullYear()}</div></div>
        <div class="chart-container" style="height:220px;"><canvas id="finesChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Incident Severity</div><span class="live-dot">Live</span></div>
        <div id="severity-bars"></div>
      </div>
    </div>

    <!-- Activity Feed -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bolt" style="color:var(--yellow);margin-right:8px;"></i>Live Activity Feed</div>
          <span class="live-dot">Live</span>
        </div>
        <div class="activity-list" id="activity-feed">
          ${recentIncidents.length === 0
            ? '<div class="empty-state" style="padding:30px;"><i class="fas fa-inbox"></i><p>No incidents recorded yet</p></div>'
            : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-map-marker-alt" style="color:var(--yellow);margin-right:8px;"></i>Quick Actions</div>
        </div>
        <div id="quick-actions-grid"></div>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';

  // Animate KPIs
  animateCounter(document.getElementById('kpi-vehicles'),  stats.vehicles);
  animateCounter(document.getElementById('kpi-incidents'), stats.incidentsToday);
  animateCounter(document.getElementById('kpi-officers'),  stats.officers);
  // Fines with ₦ prefix
  const finesEl = document.getElementById('kpi-fines');
  if (finesEl) {
    const finesAmt = stats.mtdFines;
    const startT = performance.now();
    (function animF(now) {
      const p = Math.min((now - startT) / 1200, 1), e = 1 - Math.pow(1-p, 3);
      const v = Math.floor(finesAmt * e);
      finesEl.textContent = v >= 1000000 ? '₦' + (v/1000000).toFixed(1) + 'M' : '₦' + v.toLocaleString();
      if (p < 1) requestAnimationFrame(animF);
    })(performance.now());
  }

  // Severity bars
  const sevEl = document.getElementById('severity-bars');
  if (sevEl) {
    const total = Object.values(severity).reduce((s,v) => s+v, 0) || 1;
    const highPct   = Math.round(severity.High   / total * 100);
    const medPct    = Math.round(severity.Medium  / total * 100);
    const lowPct    = Math.round(severity.Low     / total * 100);
    sevEl.innerHTML = `
      <div class="stat-bar-item mt-8">
        <div class="stat-bar-label"><span>High Severity</span><strong class="severity-high">${highPct}%</strong></div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="background:var(--red);width:0;" data-width="${highPct}%"></div></div>
      </div>
      <div class="stat-bar-item">
        <div class="stat-bar-label"><span>Medium Severity</span><strong class="severity-medium">${medPct}%</strong></div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="background:var(--orange);width:0;" data-width="${medPct}%"></div></div>
      </div>
      <div class="stat-bar-item">
        <div class="stat-bar-label"><span>Low Severity</span><strong class="severity-low">${lowPct}%</strong></div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="background:var(--green);width:0;" data-width="${lowPct}%"></div></div>
      </div>
      <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;gap:10px;">
        <div><div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:var(--red);">${severity.High}</div><div style="font-size:11px;color:var(--text-muted);">High</div></div>
        <div><div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:var(--orange);">${severity.Medium}</div><div style="font-size:11px;color:var(--text-muted);">Medium</div></div>
        <div><div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:var(--green);">${severity.Low}</div><div style="font-size:11px;color:var(--text-muted);">Low</div></div>
      </div>
    `;
    animateStatBars();
  }

  // Activity Feed
  populateActivityFeed(recentIncidents);

  // Quick Actions
  const qaEl = document.getElementById('quick-actions-grid');
  if (qaEl) {
    const actions = [
      { icon:'fa-plus-circle',     label:'Report Incident',    color:'red',    onclick:"navigate('incidents')" },
      { icon:'fa-car-side',        label:'Register Vehicle',   color:'yellow', onclick:"navigate('vehicles')" },
      { icon:'fa-user-plus',       label:'Add Officer',        color:'green',  onclick:"navigate('officers')" },
      { icon:'fa-chart-bar',       label:'View Reports',       color:'blue',   onclick:"navigate('reports')" },
      { icon:'fa-file-export',     label:'Export Incidents',   color:'orange', onclick:"navigate('incidents')" },
      { icon:'fa-cog',             label:'Settings',           color:'gray',   onclick:"navigate('settings')" },
    ];
    qaEl.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${actions.map(a => `
        <div onclick="${a.onclick}" style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--border-yellow)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--${a.color === 'gray' ? 'surface-3' : a.color + '-bg'});display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--${a.color === 'gray' ? 'text-muted' : a.color});">
            <i class="fas ${a.icon}" style="font-size:14px;"></i>
          </div>
          <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${a.label}</span>
        </div>
      `).join('')}
    </div>`;
  }

  // Charts
  initDashboardCharts(weeklyTrend, typeBreakdown, monthlyFines);

  // Subscribe to realtime new incidents
  AppState.realtimeSub = DB.incidents.subscribeToNew((newInc) => {
    prependActivityItem(newInc);
    showToast(`New incident: ${newInc.type} at ${newInc.location}`, 'warning');
    refreshIncidentBadge();
    // Refresh KPI
    DB.incidents.getTodayCount().then(count => {
      const el = document.getElementById('kpi-incidents');
      if (el) el.textContent = count.toLocaleString();
    });
  });
}

function populateActivityFeed(incidents) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  if (!incidents.length) return;

  const typeIcon = {
    'Collision':       { icon:'fa-car-crash',       color:'red'    },
    'Over-speeding':   { icon:'fa-tachometer-alt',  color:'orange' },
    'DUI':             { icon:'fa-wine-bottle',      color:'red'    },
    'Illegal Parking': { icon:'fa-parking',          color:'yellow' },
    'Other':           { icon:'fa-exclamation',      color:'blue'   },
  };
  const statusClass = { Active:'badge-red', Pending:'badge-yellow', Resolved:'badge-green' };

  feed.innerHTML = incidents.map(inc => {
    const ti = typeIcon[inc.type] || { icon:'fa-circle', color:'gray' };
    return `
      <div class="activity-item">
        <div class="activity-icon" style="background:var(--${ti.color}-bg);color:var(--${ti.color});">
          <i class="fas ${ti.icon}"></i>
        </div>
        <div class="activity-body">
          <p><span>${inc.type}</span> — ${inc.location || '—'}</p>
          <div style="display:flex;gap:8px;margin-top:4px;align-items:center;">
            <span class="badge ${statusClass[inc.status] || 'badge-gray'}">${inc.status}</span>
            <small><i class="fas fa-clock" style="margin-right:3px;"></i>${timeAgo(inc.created_at)}</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function prependActivityItem(inc) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  const typeIcon = {
    'Collision':       { icon:'fa-car-crash',       color:'red'    },
    'Over-speeding':   { icon:'fa-tachometer-alt',  color:'orange' },
    'DUI':             { icon:'fa-wine-bottle',      color:'red'    },
    'Illegal Parking': { icon:'fa-parking',          color:'yellow' },
    'Other':           { icon:'fa-exclamation',      color:'blue'   },
  };
  const ti = typeIcon[inc.type] || { icon:'fa-circle', color:'yellow' };
  const item = document.createElement('div');
  item.className = 'activity-item fade-in';
  item.innerHTML = `
    <div class="activity-icon" style="background:var(--${ti.color}-bg);color:var(--${ti.color});">
      <i class="fas ${ti.icon}"></i>
    </div>
    <div class="activity-body">
      <p><span>${inc.type}</span> — ${inc.location || '—'}</p>
      <small><i class="fas fa-clock" style="margin-right:3px;"></i>Just now</small>
    </div>
  `;
  feed.prepend(item);
}

function initDashboardCharts(weeklyTrend, typeBreakdown, monthlyFines) {
  // Incident Trend
  const trendCtx = document.getElementById('incidentTrendChart');
  if (trendCtx) {
    AppState.charts.incidentTrend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: weeklyTrend.map(d => d.day),
        datasets: [{
          label: 'Incidents',
          data: weeklyTrend.map(d => d.count),
          borderColor: '#F5C800',
          backgroundColor: 'rgba(245,200,0,0.08)',
          tension: 0.4, fill: true,
          pointBackgroundColor: '#F5C800', pointBorderColor: '#111', pointBorderWidth: 2, pointRadius: 5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false }, tooltip: tooltipDefaults() },
        scales: {
          x: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#606060'} },
          y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#606060',stepSize:1}, beginAtZero:true },
        },
      },
    });
  }

  // Incident Type Doughnut
  const typeCtx = document.getElementById('incidentTypeChart');
  if (typeCtx) {
    const typeLabels = Object.keys(typeBreakdown);
    const typeVals   = Object.values(typeBreakdown);
    AppState.charts.incidentType = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: typeLabels.length ? typeLabels : ['No Data'],
        datasets: [{
          data: typeVals.length ? typeVals : [1],
          backgroundColor: typeVals.length
            ? ['#E53E3E','#F5C800','#ED8936','#4299E1','#606060']
            : ['rgba(255,255,255,0.05)'],
          borderColor: '#1A1A1A', borderWidth: 3, hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend:{ position:'bottom', labels:{ color:'#A0A0A0', padding:12, font:{size:11} } }, tooltip: tooltipDefaults() },
      },
    });
  }

  // Monthly Fines Bar
  const finesCtx = document.getElementById('finesChart');
  if (finesCtx) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const thisMonth = new Date().getMonth();
    AppState.charts.fines = new Chart(finesCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Fines (₦)',
          data: monthlyFines,
          backgroundColor: monthlyFines.map((_, i) => i === thisMonth ? '#F5C800' : 'rgba(245,200,0,0.25)'),
          borderRadius: 6, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{display:false}, tooltip: { ...tooltipDefaults(), callbacks: { label: ctx => ' ₦' + (ctx.parsed.y || 0).toLocaleString() } } },
        scales: {
          x: { grid:{display:false}, ticks:{color:'#606060', font:{size:11}} },
          y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#606060', callback: v => v >= 1000000 ? '₦'+(v/1000000).toFixed(1)+'M' : '₦'+v.toLocaleString()}, beginAtZero:true },
        },
      },
    });
  }
}

function tooltipDefaults() {
  return {
    backgroundColor: '#1A1A1A',
    borderColor: 'rgba(245,200,0,0.3)',
    borderWidth: 1,
    titleColor: '#F5C800',
    bodyColor: '#A0A0A0',
    padding: 12,
  };
}
