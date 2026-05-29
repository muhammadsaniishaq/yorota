/* ============================================
   YOROTA ADMIN — APP ROUTER, AUTH & UTILITIES
   ============================================ */

// ── App State ──────────────────────────────
const AppState = {
  currentPage: 'dashboard',
  user: null,
  charts: {},
  realtimeSub: null,
};

// ── Page Titles ────────────────────────────
const PAGE_TITLES = {
  dashboard: ['<span>Dashboard</span>', 'Overview'],
  incidents: ['<span>Traffic</span>',   'Incidents'],
  vehicles:  ['<span>Vehicle</span>',   'Registry'],
  officers:  ['<span>Officers</span>',  'Management'],
  reports:   ['<span>Reports &amp;</span>', 'Analytics'],
  settings:  ['<span>System</span>',    'Settings'],
};

// ── Sidebar Toggle (Mobile) ─────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    if (overlay) { overlay.classList.remove('active'); }
  } else {
    sidebar.classList.add('open');
    if (overlay) { overlay.classList.add('active'); }
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// ── Password Visibility Toggle ──────────────
function togglePassword() {
  const input  = document.getElementById('login-password');
  const icon   = document.getElementById('pw-toggle');
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (icon) { icon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye'; icon.style.cssText = 'right:13px;left:auto;cursor:pointer;color:var(--text-muted);position:absolute;top:50%;transform:translateY(-50%);'; }
}

// ── Loading State ──────────────────────────
function showPageLoading() {
  document.getElementById('main-content').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:60vh;flex-direction:column;gap:20px;">
      <div style="width:48px;height:48px;border:3px solid var(--surface-3);border-top-color:var(--yellow);border-radius:50%;animation:_spin 0.8s linear infinite;"></div>
      <span style="color:var(--text-muted);font-size:14px;">Loading data…</span>
    </div>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>
  `;
}

// ── Router ─────────────────────────────────
function navigate(page) {
  AppState.currentPage = page;

  // Close sidebar on mobile after navigation
  closeSidebar();

  // Unsubscribe realtime if leaving dashboard
  if (AppState.realtimeSub && page !== 'dashboard') {
    try { AppState.realtimeSub.unsubscribe?.(); } catch(e) {}
    AppState.realtimeSub = null;
  }

  // Sidebar nav highlight
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  // Bottom nav highlight
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const bnavEl = document.getElementById('bnav-' + page);
  if (bnavEl) bnavEl.classList.add('active');

  // Navbar title
  const [p1, p2] = PAGE_TITLES[page] || ['<span>Page</span>', ''];
  document.getElementById('navbar-title').innerHTML = p1 + ' ' + p2;

  // Destroy charts
  Object.values(AppState.charts).forEach(c => { try { c.destroy(); } catch(e){} });
  AppState.charts = {};

  // Show loading then render
  showPageLoading();

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'incidents': renderIncidents(); break;
    case 'vehicles':  renderVehicles();  break;
    case 'officers':  renderOfficers();  break;
    case 'reports':   renderReports();   break;
    case 'settings':  renderSettings();  break;
    default:          renderDashboard(); break;
  }
}

let _authMode = 'signin';

function toggleAuthMode() {
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const btn = document.getElementById('login-btn');
  const toggleLink = document.getElementById('auth-toggle-link');
  const hintBox = document.getElementById('login-hint-box');
  const errBox = document.getElementById('login-error');
  
  if (errBox) errBox.style.display = 'none';

  if (_authMode === 'signin') {
    _authMode = 'signup';
    if (title) title.textContent = 'Create Admin Account';
    if (subtitle) subtitle.textContent = 'Sign up to register a new admin user';
    if (btn) btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    if (toggleLink) toggleLink.textContent = 'Already have an admin account? Sign In';
    if (hintBox) hintBox.innerHTML = '<i class="fas fa-info-circle" style="color:var(--yellow);margin-right:6px;"></i>Registering creates a live Supabase Auth account';
  } else {
    _authMode = 'signin';
    if (title) title.textContent = 'Welcome Back';
    if (subtitle) subtitle.textContent = 'Sign in to access the admin dashboard';
    if (btn) btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
    if (toggleLink) toggleLink.textContent = "Don't have an account? Register admin";
    if (hintBox) hintBox.innerHTML = '<i class="fas fa-info-circle" style="color:var(--yellow);margin-right:6px;"></i>Use your YOROTA admin email &amp; password';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  const errBox   = document.getElementById('login-error');
  const errMsg   = document.getElementById('login-error-msg');

  errBox.style.display = 'none';
  btn.disabled = true;

  if (_authMode === 'signin') {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
    const { data, error } = await DB.auth.signIn(email, password);
    if (error) {
      errMsg.textContent = error.message || 'Invalid email or password';
      errBox.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
      btn.disabled = false;
      return;
    }
  } else {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering…';
    const { data, error } = await DB.auth.signUp(email, password);
    if (error) {
      errMsg.textContent = error.message || 'Failed to create account';
      errBox.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      btn.disabled = false;
      return;
    }
    
    showToast('Account created! Attempting sign-in...', 'success');
    
    // Automatically try to sign in
    const signInResult = await DB.auth.signIn(email, password);
    if (signInResult.error) {
      if (signInResult.error.message.includes('Email not confirmed') || signInResult.error.message.includes('confirm')) {
        openModal('Registration Successful', `
          <div style="text-align:center;padding:10px 0;">
            <i class="fas fa-envelope-open-text" style="font-size:48px;color:var(--yellow);margin-bottom:16px;display:block;"></i>
            <h4 style="font-family:Outfit,sans-serif;font-weight:700;margin-bottom:8px;">Check Your Email</h4>
            <p style="color:var(--text-secondary);font-size:13px;line-height:1.5;">
              Account created successfully! A confirmation link has been sent to <strong>${email}</strong>.<br/>
              Please verify your email before logging in.
            </p>
            <div style="background:var(--surface-2);border-radius:8px;padding:12px;margin-top:16px;font-size:12px;color:var(--text-muted);text-align:left;">
              <i class="fas fa-info-circle" style="color:var(--yellow);margin-right:6px;"></i>
              <strong>Tip:</strong> You can disable email confirmation in your <strong>Supabase Dashboard → Auth → Providers → Email → Confirm Email (Toggle Off)</strong> to allow instant logins.
            </div>
          </div>
        `, '<button class="btn btn-primary" onclick="closeModal();toggleAuthMode();">Go to Login</button>');
      } else {
        errMsg.textContent = signInResult.error.message || 'Registered! Please sign in.';
        errBox.style.display = 'block';
      }
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard';
      btn.disabled = false;
      toggleAuthMode();
    }
  }
}

function showApp(user) {
  AppState.user = user;

  const email    = user.email || '';
  const name     = user.user_metadata?.name || email.split('@')[0] || 'Admin';
  const initials = name.split(' ').slice(0,2).map(w => w[0].toUpperCase()).join('');

  const sidebarName   = document.getElementById('sidebar-user-name');
  const sidebarEmail  = document.getElementById('sidebar-user-email');
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const navbarAvatar  = document.getElementById('navbar-avatar');

  if (sidebarName)   sidebarName.textContent  = name;
  if (sidebarEmail)  sidebarEmail.textContent  = email;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (navbarAvatar)  navbarAvatar.textContent  = initials;

  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display        = 'flex';

  navigate('dashboard');
  showToast(`Welcome back, ${name}! 🚦`, 'success');
  refreshIncidentBadge();
}

async function refreshIncidentBadge() {
  const count = await DB.incidents.getTodayCount();
  const badge = document.getElementById('incident-badge');
  const dot   = document.getElementById('notif-dot');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
  if (dot)   dot.style.display = count > 0 ? 'block' : 'none';
}

// ── Auth State Listener ─────────────────────
DB.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    showApp(session.user);
  } else if (event === 'SIGNED_OUT') {
    AppState.user = null;
    document.getElementById('app').style.display        = 'none';
    document.getElementById('login-page').style.display = 'flex';
    const btn = document.getElementById('login-btn');
    if (btn) { btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Dashboard'; btn.disabled = false; }
  }
});

// ── On Load ─────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  setupLogoFallbacks();
  const session = await DB.auth.getSession();
  if (session?.user) showApp(session.user);
});

// ── Swipe to close sidebar (touch) ─────────
(function setupSwipe() {
  let startX = 0;
  document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (sidebar.classList.contains('open') && dx < -60) closeSidebar();
    if (!sidebar.classList.contains('open') && startX < 20 && dx > 60) toggleSidebar();
  }, { passive: true });
})();

// ── Modal ────────────────────────────────────
function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modal-title').textContent  = title;
  document.getElementById('modal-body').innerHTML     = bodyHTML;
  document.getElementById('modal-footer').innerHTML   = footerHTML;
  document.getElementById('modal-overlay').classList.add('active');
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ── Toast ────────────────────────────────────
function showToast(message, type = 'info') {
  const colors = {
    success: { bg:'rgba(56,161,105,0.15)',  border:'rgba(56,161,105,0.4)',  icon:'fa-check-circle',       color:'#38A169' },
    warning: { bg:'rgba(237,137,54,0.15)',  border:'rgba(237,137,54,0.4)',  icon:'fa-exclamation-circle', color:'#ED8936' },
    error:   { bg:'rgba(229,62,62,0.15)',   border:'rgba(229,62,62,0.4)',   icon:'fa-times-circle',       color:'#E53E3E' },
    info:    { bg:'rgba(245,200,0,0.10)',   border:'rgba(245,200,0,0.3)',   icon:'fa-info-circle',        color:'#F5C800' },
  };
  const c   = colors[type] || colors.info;
  const box = document.getElementById('toast-container');
  const t   = document.createElement('div');
  t.style.cssText = `background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,0.4);font-family:Inter,sans-serif;pointer-events:all;`;
  t.innerHTML = `<i class="fas ${c.icon}" style="color:${c.color};font-size:16px;flex-shrink:0;"></i><span style="flex:1;">${message}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.style.transition='opacity 0.3s,transform 0.3s'; t.style.opacity='0'; t.style.transform='translateY(8px)'; setTimeout(() => t.remove(), 320); }, 3500);
}

// ── Logo Fallback ───────────────────────────
function setupLogoFallbacks() {
  ['login-logo-img','sidebar-logo-img'].forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    img.onerror = function() {
      this.style.display = 'none';
      const size = id === 'login-logo-img' ? 72 : 40;
      const fs   = id === 'login-logo-img' ? 26 : 15;
      const div  = document.createElement('div');
      div.style.cssText = `width:${size}px;height:${size}px;background:linear-gradient(135deg,#F5C800,#C9A400);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:900;font-size:${fs}px;color:#0A0A0A;margin:0 auto;flex-shrink:0;`;
      div.textContent = 'Y';
      this.parentNode.insertBefore(div, this);
    };
  });
}

// ── Utilities ───────────────────────────────
function animateCounter(el, target, prefix = '', suffix = '', duration = 1200) {
  if (!el) return;
  const num = parseFloat(String(target).replace(/,/g,''));
  const s   = performance.now();
  (function u(now) {
    const p = Math.min((now - s) / duration, 1), e = 1 - Math.pow(1-p,3);
    el.textContent = prefix + Math.floor(num * e).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(u);
    else el.textContent = prefix + num.toLocaleString() + suffix;
  })(performance.now());
}

function animateStatBars() {
  document.querySelectorAll('.stat-bar-fill[data-width]').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.width; }, 100);
  });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' });
}

function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' });
}

function timeAgo(d) {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return formatDate(d);
}

function exportCSV(filename, headers, rows) {
  const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported as CSV', 'success');
}

// Chart defaults
Chart.defaults.color       = '#606060';
Chart.defaults.font.family = 'Inter';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding  = 14;
