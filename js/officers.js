/* ============================================
   YOROTA — OFFICERS MANAGEMENT PAGE (Live)
   ============================================ */

let _officers    = [];
let _officerZones = [];

async function renderOfficers() {
  const content = document.getElementById('main-content');

  const [allOfficers, zones] = await Promise.all([
    DB.officers.getAll(),
    DB.officers.getZones(),
  ]);

  _officers     = allOfficers;
  _officerZones = zones;

  const onDuty   = _officers.filter(o => o.status === 'On Duty').length;
  const offDuty  = _officers.filter(o => o.status === 'Off Duty').length;
  const onLeave  = _officers.filter(o => o.status === 'On Leave').length;
  const totalFines = _officers.reduce((s, o) => s + Number(o.fines_total || 0), 0);

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Officers</span></div>
        <h1>Officers Management</h1>
        <p>Monitor, manage and coordinate all YOROTA field officers</p>
      </div>
      <button class="btn btn-primary" onclick="openAddOfficerModal()">
        <i class="fas fa-user-plus"></i> Add Officer
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4">
      <div class="kpi-card yellow"><div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-users"></i></div></div><div class="kpi-value">${_officers.length}</div><div class="kpi-label">Total Officers</div></div>
      <div class="kpi-card green"> <div class="kpi-top"><div class="kpi-icon green"> <i class="fas fa-user-check"></i></div></div><div class="kpi-value">${onDuty}</div><div class="kpi-label">On Duty</div></div>
      <div class="kpi-card red">   <div class="kpi-top"><div class="kpi-icon red">   <i class="fas fa-user-times"></i></div></div><div class="kpi-value">${offDuty + onLeave}</div><div class="kpi-label">Off / On Leave</div></div>
      <div class="kpi-card blue">  <div class="kpi-top"><div class="kpi-icon blue">  <i class="fas fa-money-bill"></i></div></div>
        <div class="kpi-value" style="font-size:${totalFines>999999?'20px':'30px'};">${totalFines >= 1000000 ? '₦'+(totalFines/1000000).toFixed(1)+'M' : '₦'+totalFines.toLocaleString()}</div>
        <div class="kpi-label">Total Fines Collected</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:20px;padding:16px 20px;">
      <div class="filters-bar" style="margin-bottom:0;">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input type="text" class="search-input" id="officer-search" placeholder="Search name, badge, zone…" oninput="filterOfficerDisplay()" />
        </div>
        <select class="filter-select" id="officer-zone-filter" onchange="filterOfficerDisplay()">
          <option value="">All Zones</option>
          ${_officerZones.map(z => `<option>${z}</option>`).join('')}
        </select>
        <select class="filter-select" id="officer-status-filter" onchange="filterOfficerDisplay()">
          <option value="">All Statuses</option>
          <option>On Duty</option><option>Off Duty</option><option>On Leave</option>
        </select>
        <select class="filter-select" id="officer-rank-filter" onchange="filterOfficerDisplay()">
          <option value="">All Ranks</option>
          <option>Officer</option><option>Senior Officer</option><option>Inspector</option><option>Superintendent</option>
        </select>
      </div>
    </div>

    <!-- Officer Cards -->
    <div class="officers-grid" id="officers-grid"></div>

    <!-- Leaderboard -->
    <div class="card" style="margin-top:24px;padding:0;">
      <div class="card-header" style="padding:20px 24px 16px;">
        <div><div class="card-title">Officer Performance Leaderboard</div><div class="card-subtitle">Ranked by incidents handled</div></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rank</th><th>Officer</th><th>Badge</th><th>Zone</th><th>Incidents</th><th>Fines Collected</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="officers-leaderboard"></tbody>
        </table>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';
  renderOfficerCards(_officers);
  renderOfficerLeaderboard(_officers);
}

function renderOfficerCards(officers) {
  const grid = document.getElementById('officers-grid');
  if (!grid) return;
  const statusBadge = { 'On Duty':'badge-green', 'Off Duty':'badge-gray', 'On Leave':'badge-yellow' };

  if (!officers.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <i class="fas fa-user-shield"></i><h3>No officers found</h3>
      <p>Add your first officer to get started</p>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="openAddOfficerModal()"><i class="fas fa-user-plus"></i> Add Officer</button>
    </div>`;
    return;
  }

  grid.innerHTML = officers.map(o => {
    const initials = o.name.split(' ').slice(0,2).map(w=>w[0]).join('');
    return `
      <div class="officer-card">
        <div class="officer-avatar">${initials}</div>
        <div class="officer-name">${o.name}</div>
        <div class="officer-badge-no">${o.badge}</div>
        <div class="officer-zone"><i class="fas fa-map-pin" style="margin-right:4px;font-size:10px;"></i>${o.zone}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">${o.rank}</div>
        <div class="officer-status"><span class="badge ${statusBadge[o.status]||'badge-gray'}">${o.status}</span></div>
        <div class="officer-stats">
          <div>
            <div class="officer-stat-val">${o.incidents_count || 0}</div>
            <div class="officer-stat-label">Incidents</div>
          </div>
          <div>
            <div class="officer-stat-val">${Number(o.fines_total||0) >= 1000 ? '₦'+(Number(o.fines_total)/1000).toFixed(0)+'K' : '₦'+(o.fines_total||0)}</div>
            <div class="officer-stat-label">Fines</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:14px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="viewOfficer('${o.id}')"><i class="fas fa-eye"></i> Profile</button>
          <button class="btn btn-outline btn-sm" onclick="openEditStatusModal('${o.id}')" title="Change Status"><i class="fas fa-toggle-on"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function renderOfficerLeaderboard(officers) {
  const tbody = document.getElementById('officers-leaderboard');
  if (!tbody) return;

  const sorted = [...officers].sort((a, b) => (b.incidents_count||0) - (a.incidents_count||0));
  const rankIcons  = ['🥇','🥈','🥉'];
  const statusBadge = { 'On Duty':'badge-green', 'Off Duty':'badge-gray', 'On Leave':'badge-yellow' };
  const maxInc = sorted[0]?.incidents_count || 1;

  tbody.innerHTML = sorted.length === 0
    ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">No officers yet — add your first officer to see rankings.</td></tr>`
    : sorted.map((o, i) => {
        const initials = o.name.split(' ').slice(0,2).map(w=>w[0]).join('');
        const pct = Math.round((o.incidents_count||0) / maxInc * 100);
        return `
          <tr>
            <td><span style="font-size:18px;">${rankIcons[i] || (i+1)}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="officer-avatar" style="width:34px;height:34px;font-size:12px;">${initials}</div>
                <div><strong>${o.name}</strong><div style="font-size:11px;color:var(--text-muted);">${o.rank}</div></div>
              </div>
            </td>
            <td style="color:var(--yellow);font-family:monospace;">${o.badge}</td>
            <td>${o.zone}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <strong>${o.incidents_count || 0}</strong>
                <div class="stat-bar-track" style="width:60px;"><div class="stat-bar-fill" style="background:var(--yellow);width:0;" data-width="${pct}%"></div></div>
              </div>
            </td>
            <td style="color:var(--green);font-weight:600;">₦${Number(o.fines_total||0).toLocaleString()}</td>
            <td><span class="badge ${statusBadge[o.status]||'badge-gray'}">${o.status}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="viewOfficer('${o.id}')"><i class="fas fa-eye"></i></button>
            </td>
          </tr>
        `;
      }).join('');

  setTimeout(animateStatBars, 200);
}

function filterOfficerDisplay() {
  const search = (document.getElementById('officer-search')?.value  || '').toLowerCase();
  const zone   = document.getElementById('officer-zone-filter')?.value   || '';
  const status = document.getElementById('officer-status-filter')?.value || '';
  const rank   = document.getElementById('officer-rank-filter')?.value   || '';

  const filtered = _officers.filter(o =>
    (!search || o.name.toLowerCase().includes(search) || (o.badge||'').toLowerCase().includes(search) || o.zone.toLowerCase().includes(search)) &&
    (!zone   || o.zone   === zone)   &&
    (!status || o.status === status) &&
    (!rank   || o.rank   === rank)
  );
  renderOfficerCards(filtered);
  renderOfficerLeaderboard(filtered);
}

function viewOfficer(id) {
  const o = _officers.find(x => x.id === id);
  if (!o) return;
  const initials   = o.name.split(' ').slice(0,2).map(w=>w[0]).join('');
  const statusBadge = { 'On Duty':'badge-green', 'Off Duty':'badge-gray', 'On Leave':'badge-yellow' };
  const yearsOfService = o.joined ? Math.floor((Date.now() - new Date(o.joined)) / (365.25*24*3600*1000)) : 0;

  openModal(`Officer Profile — ${o.badge}`, `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),var(--yellow-dark));display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:900;font-size:24px;color:#000;margin:0 auto 12px;border:3px solid var(--border-yellow);box-shadow:var(--shadow-yellow);">${initials}</div>
      <div style="font-family:Outfit,sans-serif;font-size:20px;font-weight:800;">${o.name}</div>
      <div style="color:var(--yellow);font-size:13px;margin-top:4px;">${o.badge} · ${o.rank}</div>
      <span class="badge ${statusBadge[o.status]||'badge-gray'}" style="margin-top:8px;">${o.status}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${[['Zone',o.zone],['Phone',o.phone||'—'],['Incidents',o.incidents_count||0],
         ['Fines','₦'+(Number(o.fines_total||0)).toLocaleString()],
         ['Date Joined',formatDate(o.joined)],['Service',yearsOfService+' years']].map(([k,v])=>`
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">${k}</div>
          <div style="font-size:13px;color:var(--text-primary);font-weight:600;">${v}</div>
        </div>`).join('')}
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="openEditStatusModal('${o.id}');closeModal()"><i class="fas fa-edit"></i> Update Status</button>
  `);
}

function openEditStatusModal(id) {
  const o = _officers.find(x => x.id === id);
  if (!o) return;
  openModal(`Update Status — ${o.name}`, `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:16px;color:var(--text-secondary);">Current status: <span class="badge ${{ 'On Duty':'badge-green','Off Duty':'badge-gray','On Leave':'badge-yellow' }[o.status]||'badge-gray'}">${o.status}</span></div>
    </div>
    <div class="form-group">
      <label>New Status</label>
      <select class="form-control" id="edit-officer-status">
        <option ${o.status==='On Duty'?'selected':''}>On Duty</option>
        <option ${o.status==='Off Duty'?'selected':''}>Off Duty</option>
        <option ${o.status==='On Leave'?'selected':''}>On Leave</option>
      </select>
    </div>
    <div class="form-group">
      <label>Update Incidents Count</label>
      <input type="number" class="form-control" id="edit-officer-incidents" value="${o.incidents_count||0}" min="0" />
    </div>
    <div class="form-group">
      <label>Update Fines Total (₦)</label>
      <input type="number" class="form-control" id="edit-officer-fines" value="${o.fines_total||0}" min="0" step="100" />
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveOfficerStatus('${o.id}')"><i class="fas fa-save"></i> Save</button>
  `);
}

async function saveOfficerStatus(id) {
  const status          = document.getElementById('edit-officer-status')?.value;
  const incidents_count = parseInt(document.getElementById('edit-officer-incidents')?.value || 0);
  const fines_total     = parseFloat(document.getElementById('edit-officer-fines')?.value   || 0);

  const btn = document.querySelector('#modal-footer .btn-primary');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  const result = await DB.officers.update(id, { status, incidents_count, fines_total });
  if (result) {
    const o = _officers.find(x => x.id === id);
    if (o) { o.status = status; o.incidents_count = incidents_count; o.fines_total = fines_total; }
    closeModal();
    renderOfficerCards(_officers);
    renderOfficerLeaderboard(_officers);
    showToast(`Officer updated`, 'success');
  } else if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save';
  }
}

function openAddOfficerModal() {
  const zoneOpts = _officerZones.length
    ? _officerZones.map(z => `<option>${z}</option>`).join('')
    : ['Damaturu Central','Potiskum Road','Gashua Highway','Nguru Axis','Bade Zone','HQ — Damaturu','Fune LGA'].map(z=>`<option>${z}</option>`).join('');

  openModal('Add New Officer', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-group" style="grid-column:1/-1;">
        <label>Full Name *</label>
        <input type="text" class="form-control" id="no-name" placeholder="Officer's full name" />
      </div>
      <div class="form-group">
        <label>Badge Number *</label>
        <input type="text" class="form-control" id="no-badge" placeholder="e.g. YRTA-0120" />
      </div>
      <div class="form-group">
        <label>Rank</label>
        <select class="form-control" id="no-rank">
          <option>Officer</option><option>Senior Officer</option><option>Inspector</option><option>Superintendent</option>
        </select>
      </div>
      <div class="form-group">
        <label>Assigned Zone</label>
        <select class="form-control" id="no-zone">${zoneOpts}</select>
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="text" class="form-control" id="no-phone" placeholder="+234 800 000 0000" />
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label>Date Joined</label>
        <input type="date" class="form-control" id="no-joined" value="${new Date().toISOString().split('T')[0]}" style="background:var(--surface-2);border:1px solid var(--border);color:var(--text-primary);padding:12px 16px;border-radius:8px;" />
      </div>
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitNewOfficer()"><i class="fas fa-save"></i> Add Officer</button>
  `);
}

async function submitNewOfficer() {
  const name   = (document.getElementById('no-name')?.value  || '').trim();
  const badge  = (document.getElementById('no-badge')?.value || '').trim().toUpperCase();
  const rank   = document.getElementById('no-rank')?.value;
  const zone   = document.getElementById('no-zone')?.value;
  const phone  = (document.getElementById('no-phone')?.value || '').trim();
  const joined = document.getElementById('no-joined')?.value;

  if (!name || !badge) { showToast('Name and Badge are required', 'error'); return; }
  if (_officers.find(o => o.badge === badge)) { showToast('Badge number already exists', 'error'); return; }

  const btn = document.querySelector('#modal-footer .btn-primary');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  const result = await DB.officers.create({ name, badge, rank, zone, phone, joined });
  if (result) {
    _officers.push(result);
    closeModal();
    renderOfficerCards(_officers);
    renderOfficerLeaderboard(_officers);
    showToast(`Officer ${name} added`, 'success');
  } else if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Add Officer';
  }
}
