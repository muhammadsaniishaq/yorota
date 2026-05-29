/* ============================================
   YOROTA — VEHICLE REGISTRY PAGE (Live)
   ============================================ */

let _vehicles     = [];
let _filteredVeh  = [];
let _vehicleLGAs  = [];

async function renderVehicles() {
  const content = document.getElementById('main-content');

  const [allVehicles, statusCounts, lgas] = await Promise.all([
    DB.vehicles.getAll(),
    DB.vehicles.getCountByStatus(),
    DB.vehicles.getLGAs(),
  ]);

  _vehicles    = allVehicles;
  _filteredVeh = [..._vehicles];
  _vehicleLGAs = lgas;

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Vehicle Registry</span></div>
        <h1>Vehicle Registry</h1>
        <p>Manage and verify all registered vehicles across Yobe State</p>
      </div>
      <button class="btn btn-primary" onclick="openAddVehicleModal()">
        <i class="fas fa-plus"></i> Register Vehicle
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4">
      <div class="kpi-card yellow"><div class="kpi-top"><div class="kpi-icon yellow"><i class="fas fa-car"></i></div></div><div class="kpi-value">${_vehicles.length}</div><div class="kpi-label">Total Registered</div></div>
      <div class="kpi-card green"> <div class="kpi-top"><div class="kpi-icon green"> <i class="fas fa-check-circle"></i></div></div><div class="kpi-value">${statusCounts.Valid}</div><div class="kpi-label">Valid</div></div>
      <div class="kpi-card red">   <div class="kpi-top"><div class="kpi-icon red">   <i class="fas fa-times-circle"></i></div></div><div class="kpi-value">${statusCounts.Expired}</div><div class="kpi-label">Expired</div></div>
      <div class="kpi-card blue">  <div class="kpi-top"><div class="kpi-icon blue">  <i class="fas fa-ban"></i></div></div><div class="kpi-value">${statusCounts.Suspended}</div><div class="kpi-label">Suspended</div></div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:20px;padding:16px 20px;">
      <div class="filters-bar" style="margin-bottom:0;">
        <div class="search-wrap">
          <i class="fas fa-search"></i>
          <input type="text" class="search-input" id="vehicle-search" placeholder="Search plate, owner, LGA…" oninput="filterVehiclesTable()" />
        </div>
        <select class="filter-select" id="vehicle-type-filter" onchange="filterVehiclesTable()">
          <option value="">All Types</option>
          <option>Saloon</option><option>SUV</option><option>Truck</option><option>Bus</option><option>Motorcycle</option>
        </select>
        <select class="filter-select" id="vehicle-lga-filter" onchange="filterVehiclesTable()">
          <option value="">All LGAs</option>
          ${_vehicleLGAs.map(l => `<option>${l}</option>`).join('')}
        </select>
        <select class="filter-select" id="vehicle-status-filter" onchange="filterVehiclesTable()">
          <option value="">All Statuses</option>
          <option>Valid</option><option>Expired</option><option>Suspended</option>
        </select>
        <div class="filters-right">
          <button class="btn btn-outline btn-sm" onclick="exportVehiclesCSV()"><i class="fas fa-download"></i> Export</button>
          <button class="btn btn-outline btn-sm" onclick="renderVehicles()"><i class="fas fa-sync-alt"></i> Refresh</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Plate Number</th><th>Owner</th><th>Make / Model</th><th>Type</th>
              <th>Color</th><th>LGA</th><th>Reg. Date</th><th>Expiry</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody id="vehicles-tbody"></tbody>
        </table>
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted);">
        <span id="vehicle-count-label"></span>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';
  renderVehiclesTable();
}

function renderVehiclesTable() {
  const tbody = document.getElementById('vehicles-tbody');
  if (!tbody) return;
  const statusBadge = { Valid:'badge-green', Expired:'badge-red', Suspended:'badge-orange' };
  const typeIcon    = { Saloon:'fa-car', SUV:'fa-car-side', Truck:'fa-truck', Bus:'fa-bus', Motorcycle:'fa-motorcycle' };

  if (!_filteredVeh.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">
      <i class="fas fa-car" style="display:block;font-size:32px;margin-bottom:12px;opacity:0.3;"></i>
      No vehicles found. <button class="btn btn-primary btn-sm" onclick="openAddVehicleModal()" style="margin-left:10px;"><i class="fas fa-plus"></i> Register First Vehicle</button>
    </td></tr>`;
  } else {
    tbody.innerHTML = _filteredVeh.map(v => `
      <tr>
        <td><strong style="color:var(--yellow);font-family:monospace;letter-spacing:1px;">${v.plate}</strong></td>
        <td><strong>${v.owner}</strong></td>
        <td style="color:var(--text-secondary);">${v.make}</td>
        <td><i class="fas ${typeIcon[v.type] || 'fa-car'}" style="color:var(--text-muted);font-size:12px;margin-right:6px;"></i>${v.type}</td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:6px;">
            <span style="width:12px;height:12px;border-radius:50%;background:${vehicleColorHex(v.color)};border:1px solid rgba(255,255,255,0.15);flex-shrink:0;"></span>
            ${v.color}
          </span>
        </td>
        <td>${v.lga}</td>
        <td style="font-size:12px;">${formatDate(v.reg_date)}</td>
        <td style="font-size:12px;${v.status==='Expired'?'color:var(--red);':''}">${formatDate(v.expiry)}</td>
        <td><span class="badge ${statusBadge[v.status]||'badge-gray'}">${v.status}</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="viewVehicle('${v.id}')" title="View"><i class="fas fa-eye"></i></button>
            ${v.status !== 'Suspended'
              ? `<button class="btn btn-danger btn-sm" onclick="suspendVehicle('${v.id}')" title="Suspend"><i class="fas fa-ban"></i></button>`
              : `<button class="btn btn-success btn-sm" onclick="reinstateVehicle('${v.id}')" title="Reinstate"><i class="fas fa-check"></i></button>`}
          </div>
        </td>
      </tr>
    `).join('');
  }
  const label = document.getElementById('vehicle-count-label');
  if (label) label.textContent = `Showing ${_filteredVeh.length} of ${_vehicles.length} vehicles`;
}

function vehicleColorHex(c) {
  const map = { Black:'#111', White:'#eee', Blue:'#4299E1', Silver:'#A0A0A0', Yellow:'#F5C800', Red:'#E53E3E', Green:'#38A169', Gold:'#D69E2E', Grey:'#808080' };
  return map[c] || '#666';
}

function filterVehiclesTable() {
  const search = (document.getElementById('vehicle-search')?.value   || '').toLowerCase();
  const type   = document.getElementById('vehicle-type-filter')?.value   || '';
  const lga    = document.getElementById('vehicle-lga-filter')?.value    || '';
  const status = document.getElementById('vehicle-status-filter')?.value || '';

  _filteredVeh = _vehicles.filter(v =>
    (!search || v.plate.toLowerCase().includes(search) || v.owner.toLowerCase().includes(search) ||
                v.lga.toLowerCase().includes(search)   || (v.make||'').toLowerCase().includes(search)) &&
    (!type   || v.type   === type)   &&
    (!lga    || v.lga    === lga)    &&
    (!status || v.status === status)
  );
  renderVehiclesTable();
}

function viewVehicle(id) {
  const v = _vehicles.find(x => x.id === id);
  if (!v) return;
  const statusBadge = { Valid:'badge-green', Expired:'badge-red', Suspended:'badge-orange' };
  const typeIcon    = { Saloon:'fa-car', SUV:'fa-car-side', Truck:'fa-truck', Bus:'fa-bus', Motorcycle:'fa-motorcycle' };
  openModal(`Vehicle — ${v.plate}`, `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="width:64px;height:64px;background:var(--surface-2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;border:2px solid var(--border-yellow);">
        <i class="fas ${typeIcon[v.type]||'fa-car'}" style="font-size:24px;color:var(--yellow);"></i>
      </div>
      <div style="font-family:Outfit,sans-serif;font-size:22px;font-weight:800;color:var(--yellow);letter-spacing:2px;">${v.plate}</div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px;">${v.make}</div>
      <span class="badge ${statusBadge[v.status]||''}" style="margin-top:8px;">${v.status}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${[['Owner',v.owner],['Type',v.type],['Color',v.color],['LGA',v.lga],
         ['Registration',formatDate(v.reg_date)],['Expiry',formatDate(v.expiry)]].map(([k,val]) => `
        <div style="background:var(--surface-2);border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">${k}</div>
          <div style="font-size:13px;color:var(--text-primary);font-weight:600;">${val}</div>
        </div>`).join('')}
    </div>
  `, `<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
}

async function suspendVehicle(id) {
  if (!confirm('Suspend this vehicle?')) return;
  const result = await DB.vehicles.update(id, { status: 'Suspended' });
  if (!result) return;
  const v = _vehicles.find(x => x.id === id);
  if (v) v.status = 'Suspended';
  _filteredVeh = [..._vehicles];
  renderVehiclesTable();
  showToast('Vehicle suspended', 'warning');
}

async function reinstateVehicle(id) {
  const result = await DB.vehicles.update(id, { status: 'Valid' });
  if (!result) return;
  const v = _vehicles.find(x => x.id === id);
  if (v) v.status = 'Valid';
  _filteredVeh = [..._vehicles];
  renderVehiclesTable();
  showToast('Vehicle reinstated', 'success');
}

function openAddVehicleModal() {
  const lgaOpts = _vehicleLGAs.length
    ? _vehicleLGAs.map(l => `<option>${l}</option>`).join('')
    : ['Damaturu','Potiskum','Gashua','Nguru','Geidam','Bade','Fune','Nangere','Machina','Jakusko','Karasuwa','Tarmuwa','Yusufari'].map(l=>`<option>${l}</option>`).join('');

  openModal('Register New Vehicle', `
    <div class="form-group">
      <label>Plate Number *</label>
      <input type="text" class="form-control" id="nv-plate" placeholder="e.g. YB-001-DAM" />
    </div>
    <div class="form-group">
      <label>Owner Full Name *</label>
      <input type="text" class="form-control" id="nv-owner" placeholder="Enter owner's full name" />
    </div>
    <div class="form-group">
      <label>Make / Model *</label>
      <input type="text" class="form-control" id="nv-make" placeholder="e.g. Toyota Corolla" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-group">
        <label>Vehicle Type</label>
        <select class="form-control" id="nv-type"><option>Saloon</option><option>SUV</option><option>Truck</option><option>Bus</option><option>Motorcycle</option></select>
      </div>
      <div class="form-group">
        <label>Color</label>
        <select class="form-control" id="nv-color"><option>Black</option><option>White</option><option>Silver</option><option>Blue</option><option>Red</option><option>Gold</option><option>Green</option><option>Yellow</option><option>Grey</option></select>
      </div>
    </div>
    <div class="form-group">
      <label>LGA</label>
      <select class="form-control" id="nv-lga">${lgaOpts}</select>
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitNewVehicle()"><i class="fas fa-save"></i> Register</button>
  `);
}

async function submitNewVehicle() {
  const plate = (document.getElementById('nv-plate')?.value || '').trim().toUpperCase();
  const owner = (document.getElementById('nv-owner')?.value || '').trim();
  const make  = (document.getElementById('nv-make')?.value  || '').trim();
  const type  = document.getElementById('nv-type')?.value;
  const color = document.getElementById('nv-color')?.value;
  const lga   = document.getElementById('nv-lga')?.value;

  if (!plate || !owner || !make) { showToast('Please fill all required fields', 'error'); return; }
  if (_vehicles.find(v => v.plate === plate)) { showToast('Plate number already registered', 'error'); return; }

  const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);

  const btn = document.querySelector('#modal-footer .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

  const result = await DB.vehicles.create({ plate, owner, make, type, color, lga, expiry: expiry.toISOString().split('T')[0] });

  if (result) {
    _vehicles.unshift(result);
    _filteredVeh = [..._vehicles];
    renderVehiclesTable();
    closeModal();
    showToast(`Vehicle ${plate} registered successfully`, 'success');
  } else if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Register';
  }
}

function exportVehiclesCSV() {
  exportCSV(
    'yorota_vehicles.csv',
    ['Plate','Owner','Make','Type','Color','LGA','Reg Date','Expiry','Status'],
    _filteredVeh.map(v => [`"${v.plate}"`,`"${v.owner}"`,`"${v.make}"`,v.type,v.color,v.lga,v.reg_date,v.expiry,v.status])
  );
}
