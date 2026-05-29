/* ============================================
   YOROTA — TRAFFIC INCIDENTS PAGE (Live)
   ============================================ */

// Page-level state
let _incidents      = [];
let _filteredInc    = [];

async function renderIncidents() {
  const content = document.getElementById('main-content');

  // Fetch counts for KPIs
  const allRaw = await DB.incidents.getAll();
  _incidents   = allRaw;
  _filteredInc = [..._incidents];

  const total    = _incidents.length;
  const active   = _incidents.filter(i => i.status === 'Active').length;
  const pending  = _incidents.filter(i => i.status === 'Pending').length;
  const resolved = _incidents.filter(i => i.status === 'Resolved').length;

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Traffic Incidents</span></div>
        <h1>Incident Management</h1>
        <p>Track, manage, and resolve all road traffic incidents across Yobe State</p>
      </div>
      <button class="btn btn-primary" onclick="openAddIncidentModal()">
        <i class="fas fa-plus"></i> Report Incident
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4">
      <div class="kpi-card yellow"><div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-list"></i></div></div><div class="kpi-value">${total}</div><div class="kpi-label">Total Incidents</div></div>
      <div class="kpi-card red">   <div class="kpi-top"><div class="kpi-icon red">   <i class="fas fa-fire"></i></div></div><div class="kpi-value">${active}</div><div class="kpi-label">Active</div></div>
      <div class="kpi-card yellow"><div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-clock"></i></div></div><div class="kpi-value">${pending}</div><div class="kpi-label">Pending</div></div>
      <div class="kpi-card green"> <div class="kpi-top"><div class="kpi-icon green"> <i class="fas fa-check-circle"></i></div></div><div class="kpi-value">${resolved}</div><div class="kpi-label">Resolved</div></div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:20px;padding:16px 20px;">
      <div class="filters-bar" style="margin-bottom:0;">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input type="text" class="search-input" id="incident-search" placeholder="Search ID, location, officer…" oninput="filterIncidentsTable()" />
        </div>
        <select class="filter-select" id="incident-type-filter" onchange="filterIncidentsTable()">
          <option value="">All Types</option>
          <option>Collision</option><option>Over-speeding</option><option>DUI</option><option>Illegal Parking</option><option>Other</option>
        </select>
        <select class="filter-select" id="incident-severity-filter" onchange="filterIncidentsTable()">
          <option value="">All Severities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select class="filter-select" id="incident-status-filter" onchange="filterIncidentsTable()">
          <option value="">All Statuses</option>
          <option>Active</option><option>Pending</option><option>Resolved</option>
        </select>
        <div class="filters-right">
          <button class="btn btn-outline btn-sm" onclick="exportIncidentsCSV()"><i class="fas fa-download"></i> Export</button>
          <button class="btn btn-outline btn-sm" onclick="reloadIncidents()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Incident ID</th><th>Location</th><th>Type</th><th>Severity</th>
              <th>Officer</th><th>Status</th><th>Fine</th><th>Date / Time</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="incidents-tbody"></tbody>
        </table>
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);">
        <span id="incident-count-label"></span>
        <span style="color:var(--green);font-weight:600;" id="total-fines-label"></span>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';
  renderIncidentsTable();
}

function renderIncidentsTable() {
  const tbody = document.getElementById('incidents-tbody');
  if (!tbody) return;
  const statusBadge   = { Active:'badge-red', Pending:'badge-yellow', Resolved:'badge-green' };
  const severityClass = { High:'severity-high', Medium:'severity-medium', Low:'severity-low' };

  if (!_filteredInc.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fas fa-search" style="display:block;font-size:32px;margin-bottom:12px;opacity:0.3;"></i>
      No incidents found. <button class="btn btn-primary btn-sm" onclick="openAddIncidentModal()" style="margin-left:10px;"><i class="fas fa-plus"></i> Report First Incident</button>
    </td></tr>`;
  } else {
    tbody.innerHTML = _filteredInc.map(inc => `
      <tr>
        <td><strong style="color:var(--yellow);font-family:monospace;">${inc.incident_id || '—'}</strong></td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${inc.location}">
          <i class="fas fa-map-marker-alt" style="color:var(--red);margin-right:6px;font-size:11px;"></i>${inc.location}
        </td>
        <td>${inc.type}</td>
        <td><span class="${severityClass[inc.severity] || ''}">● ${inc.severity}</span></td>
        <td>${inc.officer_name || '—'}</td>
        <td><span class="badge ${statusBadge[inc.status] || 'badge-gray'}">${inc.status}</span></td>
        <td style="color:var(--green);font-weight:600;">₦${Number(inc.fine || 0).toLocaleString()}</td>
        <td>
          <div style="font-size:12px;">${formatDate(inc.created_at)}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatTime(inc.created_at)}</div>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="viewIncident('${inc.id}')" title="View"><i class="fas fa-eye"></i></button>
            ${inc.status !== 'Resolved'
              ? `<button class="btn btn-success btn-sm" onclick="resolveIncident('${inc.id}')" title="Resolve"><i class="fas fa-check"></i></button>`
              : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteIncident('${inc.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const countLabel  = document.getElementById('incident-count-label');
  const finesLabel  = document.getElementById('total-fines-label');
  if (countLabel) countLabel.textContent = `Showing ${_filteredInc.length} of ${_incidents.length} incidents`;
  if (finesLabel) {
    const total = _filteredInc.reduce((s, i) => s + Number(i.fine || 0), 0);
    finesLabel.textContent = `Total Fines: ₦${total.toLocaleString()}`;
  }
}

function filterIncidentsTable() {
  const search   = (document.getElementById('incident-search')?.value  || '').toLowerCase();
  const type     = document.getElementById('incident-type-filter')?.value     || '';
  const severity = document.getElementById('incident-severity-filter')?.value || '';
  const status   = document.getElementById('incident-status-filter')?.value   || '';

  _filteredInc = _incidents.filter(i =>
    (!search   || (i.incident_id||'').toLowerCase().includes(search) ||
                  (i.location||'').toLowerCase().includes(search) ||
                  (i.officer_name||'').toLowerCase().includes(search)) &&
    (!type     || i.type === type) &&
    (!severity || i.severity === severity) &&
    (!status   || i.status === status)
  );
  renderIncidentsTable();
}

async function reloadIncidents() {
  showPageLoading();
  await renderIncidents();
}

function viewIncident(id) {
  const inc = _incidents.find(i => i.id === id);
  if (!inc) return;
  const statusBadge = { Active:'badge-red', Pending:'badge-yellow', Resolved:'badge-green' };
  openModal(`Incident Details — ${inc.incident_id}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${[
        ['Incident ID', inc.incident_id], ['Type', inc.type],
        ['Severity',    inc.severity],    ['Status', `<span class="badge ${statusBadge[inc.status]||''}">${inc.status}</span>`],
        ['Officer',     inc.officer_name || '—'], ['Fine', '₦' + Number(inc.fine||0).toLocaleString()],
        ['Date',        formatDate(inc.created_at)], ['Time', formatTime(inc.created_at)],
      ].map(([k,v]) => `
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">${k}</div>
          <div style="font-size:14px;color:var(--text-primary);font-weight:600;">${v}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:12px;background:var(--surface-2);border-radius:8px;padding:14px;">
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">Location</div>
      <div style="font-size:14px;color:var(--text-primary);"><i class="fas fa-map-marker-alt" style="color:var(--red);margin-right:8px;"></i>${inc.location}</div>
    </div>
    ${inc.notes ? `<div style="margin-top:12px;background:var(--surface-2);border-radius:8px;padding:14px;"><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">Notes</div><div style="font-size:13px;color:var(--text-secondary);">${inc.notes}</div></div>` : ''}
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Close</button>
    ${inc.status !== 'Resolved' ? `<button class="btn btn-primary" onclick="resolveIncident('${inc.id}');closeModal()"><i class="fas fa-check"></i> Mark Resolved</button>` : ''}
  `);
}

async function resolveIncident(id) {
  const result = await DB.incidents.update(id, { status: 'Resolved' });
  if (!result) return;
  const inc = _incidents.find(i => i.id === id);
  if (inc) inc.status = 'Resolved';
  _filteredInc = [..._incidents];
  filterIncidentsTable();
  showToast(`Incident marked as resolved`, 'success');
  refreshIncidentBadge();
}

async function deleteIncident(id) {
  if (!confirm('Delete this incident? This cannot be undone.')) return;
  const ok = await DB.incidents.delete(id);
  if (!ok) return;
  _incidents    = _incidents.filter(i => i.id !== id);
  _filteredInc  = _filteredInc.filter(i => i.id !== id);
  renderIncidentsTable();
  showToast('Incident deleted', 'info');
  refreshIncidentBadge();
}

async function openAddIncidentModal() {
  // Fetch officer names for dropdown
  const officers = await DB.officers.getAll({ status: 'On Duty' });
  const officerOpts = officers.length
    ? officers.map(o => `<option>${o.name}</option>`).join('')
    : '<option>N/A — No officers on duty</option>';

  openModal('Report New Incident', `
    <div class="form-group">
      <label>Incident Type *</label>
      <select class="form-control" id="new-type">
        <option>Collision</option><option>Over-speeding</option><option>DUI</option><option>Illegal Parking</option><option>Other</option>
      </select>
    </div>
    <div class="form-group">
      <label>Location *</label>
      <input type="text" class="form-control" id="new-location" placeholder="e.g. Damaturu–Potiskum Road, Km 8" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-group">
        <label>Severity *</label>
        <select class="form-control" id="new-severity">
          <option>High</option><option selected>Medium</option><option>Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="new-status">
          <option>Active</option><option>Pending</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Assigned Officer</label>
      <select class="form-control" id="new-officer">${officerOpts}</select>
    </div>
    <div class="form-group">
      <label>Fine Amount (₦)</label>
      <input type="number" class="form-control" id="new-fine" placeholder="0" min="0" step="500" value="0" />
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea class="form-control" id="new-notes" rows="2" placeholder="Additional details…" style="resize:vertical;"></textarea>
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitNewIncident()"><i class="fas fa-save"></i> Submit Report</button>
  `);
}

async function submitNewIncident() {
  const type         = document.getElementById('new-type')?.value;
  const location     = document.getElementById('new-location')?.value.trim();
  const severity     = document.getElementById('new-severity')?.value;
  const status       = document.getElementById('new-status')?.value;
  const officer_name = document.getElementById('new-officer')?.value;
  const fine         = parseFloat(document.getElementById('new-fine')?.value || 0);
  const notes        = document.getElementById('new-notes')?.value.trim();

  if (!location) { showToast('Please enter an incident location', 'error'); return; }

  const submitBtn = document.querySelector('#modal-footer .btn-primary');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  const result = await DB.incidents.create({ location, type, severity, officer_name, status, fine, notes });

  if (result) {
    _incidents.unshift(result);
    _filteredInc = [..._incidents];
    renderIncidentsTable();
    closeModal();
    showToast(`Incident ${result.incident_id} reported`, 'success');
    refreshIncidentBadge();
  } else if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Submit Report';
  }
}

function exportIncidentsCSV() {
  exportCSV(
    'yorota_incidents.csv',
    ['ID','Location','Type','Severity','Officer','Status','Fine (₦)','Date'],
    _filteredInc.map(i => [
      i.incident_id, `"${i.location}"`, i.type, i.severity,
      `"${i.officer_name}"`, i.status, i.fine, formatDate(i.created_at)
    ])
  );
}
