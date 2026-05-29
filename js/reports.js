/* ============================================
   YOROTA — REPORTS & ANALYTICS PAGE (Live)
   ============================================ */

async function renderReports() {
  const content = document.getElementById('main-content');

  const today      = new Date().toISOString().split('T')[0];
  const monthStart = new Date(); monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // Fetch all data in parallel
  const [allIncidents, allVehicles, allOfficers, hourly, dow, lgaData, monthlyFines] = await Promise.all([
    DB.incidents.getAll(),
    DB.vehicles.getAll(),
    DB.officers.getAll(),
    DB.incidents.getHourlyDistribution(),
    DB.incidents.getDayOfWeekDistribution(),
    DB.incidents.getByLGA(),
    DB.incidents.getMonthlyFines(),
  ]);

  const total    = allIncidents.length;
  const resolved = allIncidents.filter(i => i.status === 'Resolved').length;
  const rate     = total > 0 ? Math.round(resolved / total * 100) : 0;
  const totalFines = allIncidents.reduce((s, i) => s + Number(i.fine||0), 0);

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Reports</span></div>
        <h1>Reports &amp; Analytics</h1>
        <p>In-depth intelligence on traffic incidents, fines, and officer performance</p>
      </div>
      <button class="btn btn-primary" onclick="generateReport()">
        <i class="fas fa-file-pdf"></i> Generate Report
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4">
      <div class="kpi-card yellow"><div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-exclamation-triangle"></i></div></div><div class="kpi-value" id="rpt-incidents">0</div><div class="kpi-label">Total Incidents</div></div>
      <div class="kpi-card green"> <div class="kpi-top"><div class="kpi-icon green"> <i class="fas fa-check-circle"></i></div></div><div class="kpi-value" id="rpt-resolved">0</div><div class="kpi-label">Resolved</div></div>
      <div class="kpi-card blue">  <div class="kpi-top"><div class="kpi-icon blue">  <i class="fas fa-money-bill-wave"></i></div></div><div class="kpi-value" id="rpt-fines">₦0</div><div class="kpi-label">Total Fines</div></div>
      <div class="kpi-card red">   <div class="kpi-top"><div class="kpi-icon red">   <i class="fas fa-percentage"></i></div></div><div class="kpi-value" id="rpt-rate">0%</div><div class="kpi-label">Resolution Rate</div></div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Incidents by LGA</div><div class="card-subtitle">Top locations</div></div>
        <div class="chart-container" style="height:260px;"><canvas id="lgaChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Fines by Incident Type</div><div class="card-subtitle">Revenue breakdown</div></div>
        <div class="chart-container" style="height:260px;"><canvas id="finesTypeChart"></canvas></div>
      </div>
    </div>

    <!-- Officer Performance -->
    <div class="card">
      <div class="card-header"><div class="card-title">Officer Performance</div><div class="card-subtitle">Top officers by incidents handled</div></div>
      <div class="chart-container" style="height:280px;"><canvas id="officerPerfChart"></canvas></div>
    </div>

    <!-- Time Charts -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">Incidents by Time of Day</div><div class="card-subtitle">Hourly distribution</div></div>
        <div class="chart-container" style="height:220px;"><canvas id="hourlyChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Incidents by Day of Week</div><div class="card-subtitle">Weekly pattern</div></div>
        <div class="chart-container" style="height:220px;"><canvas id="dowChart"></canvas></div>
      </div>
    </div>

    <!-- LGA Table -->
    <div class="card" style="margin-top:24px;padding:0;">
      <div class="card-header" style="padding:20px 24px 16px;">
        <div class="card-title">LGA Performance Report</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Location Group</th><th>Incidents</th><th>Resolved</th><th>Resolution Rate</th><th>Fines Collected</th></tr></thead>
          <tbody id="lga-table-body"></tbody>
        </table>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid-3" style="margin-top:24px;">
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;font-weight:900;font-family:Outfit,sans-serif;color:var(--yellow);">${allVehicles.length}</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">Registered Vehicles</div>
        <div style="color:var(--green);font-size:12px;margin-top:8px;"><i class="fas fa-check-circle" style="margin-right:4px;"></i>${allVehicles.filter(v=>v.status==='Valid').length} Valid</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;font-weight:900;font-family:Outfit,sans-serif;color:var(--yellow);">${allOfficers.length}</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">Total Officers</div>
        <div style="color:var(--green);font-size:12px;margin-top:8px;"><i class="fas fa-user-check" style="margin-right:4px;"></i>${allOfficers.filter(o=>o.status==='On Duty').length} On Duty</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:36px;font-weight:900;font-family:Outfit,sans-serif;color:var(--yellow);">${allIncidents.filter(i=>i.severity==='High').length}</div>
        <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">High Severity Incidents</div>
        <div style="color:var(--red);font-size:12px;margin-top:8px;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i>${allIncidents.filter(i=>i.status==='Active').length} Still Active</div>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';

  // Animate KPIs
  animateCounter(document.getElementById('rpt-incidents'), total);
  animateCounter(document.getElementById('rpt-resolved'),  resolved);
  const rateEl = document.getElementById('rpt-rate');
  if (rateEl) { let rs=performance.now(); (function c(t){const p=Math.min((t-rs)/1000,1),e=1-Math.pow(1-p,3);rateEl.textContent=Math.round(rate*e)+'%';if(p<1)requestAnimationFrame(c);})(performance.now()); }
  const fEl = document.getElementById('rpt-fines');
  if (fEl) { let fs=performance.now(); (function c(t){const p=Math.min((t-fs)/1200,1),e=1-Math.pow(1-p,3);const v=Math.floor(totalFines*e);fEl.textContent=v>=1000000?'₦'+(v/1000000).toFixed(1)+'M':'₦'+v.toLocaleString();if(p<1)requestAnimationFrame(c);})(performance.now()); }

  // LGA Table
  renderLGATable(lgaData);

  // Charts
  initReportCharts(allIncidents, allOfficers, hourly, dow, lgaData, monthlyFines);
}

function renderLGATable(lgaData) {
  const tbody = document.getElementById('lga-table-body');
  if (!tbody) return;

  if (!lgaData.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">No incident data available yet</td></tr>`;
    return;
  }

  tbody.innerHTML = lgaData.map(row => {
    const rate = row.incidents > 0 ? Math.round(row.resolved / row.incidents * 100) : 0;
    const rateColor = rate >= 80 ? 'var(--green)' : rate >= 60 ? 'var(--orange)' : 'var(--red)';
    return `
      <tr>
        <td><strong>${row.lga}</strong></td>
        <td>${row.incidents}</td>
        <td>${row.resolved}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:700;color:${rateColor};">${rate}%</span>
            <div class="stat-bar-track" style="width:80px;"><div class="stat-bar-fill" style="background:${rateColor};width:0;" data-width="${rate}%"></div></div>
          </div>
        </td>
        <td style="color:var(--green);font-weight:600;">₦${Number(row.fines||0).toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  setTimeout(animateStatBars, 300);
}

function initReportCharts(incidents, officers, hourly, dow, lgaData, monthlyFines) {
  const td = (opts) => ({ backgroundColor:'#1A1A1A', borderColor:'rgba(245,200,0,0.3)', borderWidth:1, titleColor:'#F5C800', bodyColor:'#A0A0A0', padding:10, ...opts });

  // LGA Horizontal Bar
  const lgaCtx = document.getElementById('lgaChart');
  if (lgaCtx && lgaData.length) {
    AppState.charts.lga = new Chart(lgaCtx, {
      type: 'bar',
      data: {
        labels: lgaData.map(d => d.lga),
        datasets: [{ label:'Incidents', data: lgaData.map(d => d.incidents),
          backgroundColor: lgaData.map((_,i) => `rgba(245,200,0,${1 - i*0.15})`), borderRadius:6, borderSkipped:false }],
      },
      options: { indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ ...td(), callbacks:{label:ctx=>` ${ctx.parsed.x} incidents`} } },
        scales:{ x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#606060'},beginAtZero:true}, y:{grid:{display:false},ticks:{color:'#A0A0A0'}} } },
    });
  } else if (lgaCtx) {
    lgaCtx.parentElement.innerHTML = '<div class="empty-state" style="padding:40px;"><i class="fas fa-chart-bar"></i><p>No incident data yet</p></div>';
  }

  // Fines by Type Polar
  const ftCtx = document.getElementById('finesTypeChart');
  if (ftCtx) {
    const typeMap = {};
    incidents.forEach(i => { typeMap[i.type] = (typeMap[i.type]||0) + Number(i.fine||0); });
    const labels = Object.keys(typeMap);
    const vals   = Object.values(typeMap);
    if (labels.length) {
      AppState.charts.finesType = new Chart(ftCtx, {
        type: 'polarArea',
        data: { labels, datasets:[{ data:vals,
          backgroundColor:['rgba(229,62,62,0.7)','rgba(245,200,0,0.7)','rgba(237,137,54,0.7)','rgba(66,153,225,0.7)','rgba(96,96,96,0.7)'],
          borderColor:'#1A1A1A', borderWidth:2 }] },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{position:'right',labels:{color:'#A0A0A0',font:{size:11},padding:10}},
            tooltip:{ ...td(), callbacks:{label:ctx=>` ₦${Number(ctx.parsed.r).toLocaleString()}`} } },
          scales:{r:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{display:false}}} },
      });
    } else {
      ftCtx.parentElement.innerHTML = '<div class="empty-state" style="padding:40px;"><i class="fas fa-money-bill"></i><p>No fine data yet</p></div>';
    }
  }

  // Officer Performance
  const opCtx = document.getElementById('officerPerfChart');
  if (opCtx) {
    const top8 = [...officers].sort((a,b)=>(b.incidents_count||0)-(a.incidents_count||0)).slice(0,8);
    if (top8.length) {
      AppState.charts.officerPerf = new Chart(opCtx, {
        type: 'bar',
        data: {
          labels: top8.map(o => o.name.split(' ')[0]),
          datasets: [
            { label:'Incidents', data:top8.map(o=>o.incidents_count||0), backgroundColor:'rgba(245,200,0,0.7)', borderRadius:6, borderSkipped:false },
            { label:'Fines (÷1000)', data:top8.map(o=>Math.round(Number(o.fines_total||0)/1000)), backgroundColor:'rgba(66,153,225,0.5)', borderRadius:6, borderSkipped:false },
          ],
        },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{position:'top',align:'end',labels:{color:'#A0A0A0',font:{size:11}}}, tooltip:td() },
          scales:{ x:{grid:{display:false},ticks:{color:'#A0A0A0'}}, y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#606060'},beginAtZero:true} } },
      });
    } else {
      opCtx.parentElement.innerHTML = '<div class="empty-state" style="padding:40px;"><i class="fas fa-users"></i><p>No officer data yet</p></div>';
    }
  }

  // Hourly Line
  const hourCtx = document.getElementById('hourlyChart');
  if (hourCtx) {
    AppState.charts.hourly = new Chart(hourCtx, {
      type: 'line',
      data: {
        labels: Array.from({length:24},(_,i)=>`${String(i).padStart(2,'0')}:00`),
        datasets: [{ label:'Incidents', data:hourly,
          borderColor:'#F5C800', backgroundColor:'rgba(245,200,0,0.06)', tension:0.4, fill:true,
          pointBackgroundColor:'#F5C800', pointRadius:2, pointHoverRadius:5 }],
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:td() },
        scales:{ x:{grid:{display:false},ticks:{color:'#606060',maxTicksLimit:8,font:{size:10}}}, y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#606060'},beginAtZero:true} } },
    });
  }

  // Day-of-Week Radar
  const dowCtx = document.getElementById('dowChart');
  if (dowCtx) {
    AppState.charts.dow = new Chart(dowCtx, {
      type: 'radar',
      data: {
        labels: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        datasets: [{ label:'Incidents', data:dow,
          borderColor:'#F5C800', backgroundColor:'rgba(245,200,0,0.1)',
          pointBackgroundColor:'#F5C800', pointBorderColor:'#1A1A1A', pointBorderWidth:2, pointRadius:4 }],
      },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:td() },
        scales:{ r:{ grid:{color:'rgba(255,255,255,0.06)'}, angleLines:{color:'rgba(255,255,255,0.06)'},
          pointLabels:{color:'#A0A0A0',font:{size:11}}, ticks:{display:false} } } },
    });
  }
}

function generateReport() {
  const total = document.getElementById('rpt-incidents')?.textContent || '0';
  showToast(`Generating PDF report (${total} incidents)…`, 'info');
  setTimeout(() => showToast('Report ready — PDF generation requires jsPDF integration', 'warning'), 2000);
}
