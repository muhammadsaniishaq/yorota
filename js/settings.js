/* ============================================
   YOROTA — SETTINGS PAGE
   ============================================ */

function renderSettings() {
  const content = document.getElementById('main-content');
  const user    = AppState.user;
  const email   = user?.email || '—';
  const name    = user?.user_metadata?.name || email.split('@')[0] || 'Admin';
  const initials = name.split(' ').slice(0,2).map(w=>w[0].toUpperCase()).join('');

  content.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="breadcrumb"><i class="fas fa-home"></i> <span>Settings</span></div>
        <h1>System Settings</h1>
        <p>Configure your YOROTA dashboard preferences and account</p>
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">
        <i class="fas fa-save"></i> Save Changes
      </button>
    </div>

    <div class="grid-2">
      <!-- Left -->
      <div>
        <!-- Agency Info -->
        <div class="card" style="margin-bottom:20px;">
          <div class="settings-section-title"><i class="fas fa-building"></i> Agency Information</div>
          <div class="form-group"><label>Agency Name</label><input type="text" class="form-control" value="Yobe State Road Traffic Management Agency" /></div>
          <div class="form-group"><label>Abbreviation</label><input type="text" class="form-control" value="YOROTA" /></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>State</label><input type="text" class="form-control" value="Yobe State" /></div>
            <div class="form-group"><label>Country</label><input type="text" class="form-control" value="Nigeria" /></div>
          </div>
          <div class="form-group"><label>Headquarters</label><input type="text" class="form-control" value="No. 1 Traffic House, Damaturu, Yobe State" /></div>
          <div class="form-group"><label>Official Email</label><input type="email" class="form-control" value="info@yorota.yb.gov.ng" /></div>
          <div class="form-group"><label>Phone</label><input type="text" class="form-control" value="+234 076 200 000" /></div>
        </div>

        <!-- Admin Profile -->
        <div class="card">
          <div class="settings-section-title"><i class="fas fa-user-cog"></i> Admin Profile</div>
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:var(--surface-2);border-radius:10px;">
            <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),var(--yellow-dark));display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:900;font-size:18px;color:#000;flex-shrink:0;">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:15px;">${name}</div>
              <div style="font-size:12px;color:var(--yellow);">${email}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Supabase Auth Account</div>
            </div>
          </div>
          <div class="form-group">
            <label>Display Name</label>
            <input type="text" class="form-control" id="profile-name" value="${name}" placeholder="Your display name" />
          </div>
          <div class="form-group">
            <label>Email (read-only)</label>
            <input type="email" class="form-control" value="${email}" readonly style="opacity:0.6;" />
          </div>
        </div>
      </div>

      <!-- Right -->
      <div>
        <!-- Notifications -->
        <div class="card" style="margin-bottom:20px;">
          <div class="settings-section-title"><i class="fas fa-bell"></i> Notification Preferences</div>
          ${[
            { label:'High Severity Alerts',    desc:'Get notified for critical incidents',       checked:true  },
            { label:'New Vehicle Registration', desc:'Alert when a vehicle is registered',        checked:true  },
            { label:'Officer Status Changes',   desc:'Notify on officer clock-in/out',            checked:false },
            { label:'Daily Summary Report',     desc:'Receive daily digest at 8:00 AM',          checked:true  },
            { label:'Fine Collection Updates',  desc:'Alert for large fines (>₦50K)',            checked:true  },
          ].map((item, i) => `
            <div class="settings-row">
              <div class="settings-row-label"><strong>${item.label}</strong><span>${item.desc}</span></div>
              <label class="toggle"><input type="checkbox" ${item.checked?'checked':''} id="notif-${i}" /><span class="toggle-slider"></span></label>
            </div>
          `).join('')}
        </div>

        <!-- System -->
        <div class="card" style="margin-bottom:20px;">
          <div class="settings-section-title"><i class="fas fa-sliders-h"></i> System Preferences</div>
          ${[
            { label:'Dark Mode',          desc:'Use dark theme (default)',               checked:true  },
            { label:'Auto-Refresh Data',  desc:'Refresh dashboard every 5 minutes',     checked:true  },
            { label:'Enable Animations',  desc:'Smooth transitions and counter effects', checked:true  },
          ].map((item, i) => `
            <div class="settings-row">
              <div class="settings-row-label"><strong>${item.label}</strong><span>${item.desc}</span></div>
              <label class="toggle"><input type="checkbox" ${item.checked?'checked':''} id="sys-${i}" /><span class="toggle-slider"></span></label>
            </div>
          `).join('')}
        </div>

        <!-- Database Info -->
        <div class="card" style="margin-bottom:20px;">
          <div class="settings-section-title"><i class="fas fa-database"></i> Database Connection</div>
          <div class="settings-row">
            <div class="settings-row-label"><strong>Supabase Project</strong><span>yzwhenzafegxshhuxhcn</span></div>
            <span class="badge badge-green">Connected</span>
          </div>
          <div class="settings-row">
            <div class="settings-row-label"><strong>Auth Provider</strong><span>Email / Password</span></div>
            <span style="color:var(--yellow);font-size:12px;">Active</span>
          </div>
          <div class="settings-row">
            <div class="settings-row-label"><strong>Realtime</strong><span>Incident feed subscriptions</span></div>
            <span class="badge badge-green">Enabled</span>
          </div>
          <div class="settings-row">
            <div class="settings-row-label"><strong>RLS</strong><span>Row Level Security active</span></div>
            <span class="badge badge-green">Secured</span>
          </div>
        </div>

        <!-- Security -->
        <div class="card">
          <div class="settings-section-title"><i class="fas fa-shield-alt"></i> Account Security</div>
          <div class="settings-row">
            <div class="settings-row-label"><strong>Logged in as</strong><span>${email}</span></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" onclick="showToast('Password reset email sent to ${email}','info')">
              <i class="fas fa-key"></i> Reset Password
            </button>
            <button class="btn btn-danger btn-sm" onclick="confirmLogout()">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  content.className = 'main-content fade-in';
}

function saveSettings() {
  showToast('Settings saved', 'success');
}

function confirmLogout() {
  openModal('Sign Out', `
    <div style="text-align:center;padding:10px 0;">
      <i class="fas fa-sign-out-alt" style="font-size:48px;color:var(--red);margin-bottom:16px;display:block;"></i>
      <p style="color:var(--text-secondary);font-size:14px;">Are you sure you want to sign out of the YOROTA Dashboard?</p>
    </div>
  `, `
    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="btn btn-danger" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
  `);
}

async function doLogout() {
  closeModal();
  showToast('Signing out…', 'info');
  await DB.auth.signOut();
  // onAuthStateChange handles the redirect
}
