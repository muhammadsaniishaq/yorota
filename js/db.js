/* ============================================
   YOROTA — SUPABASE CLIENT & DATABASE LAYER
   ============================================ */

const SUPABASE_URL  = 'https://yzwhenzafegxshhuxhcn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2hlbnphZmVneHNoaHV4aGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc0NjgsImV4cCI6MjA5NTU1MzQ2OH0.S1tw3pVInnDzSUrmFRHohaEBJ9hGMC60Giy9iYs9UOg';

// Wait for Supabase CDN to load
const { createClient } = window.supabase;
const _db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ── Helpers ────────────────────────────────
function startOfToday() {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString();
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString();
}
function startOfWeek() {
  const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d.toISOString();
}

// ── Unified error handler ──────────────────
function dbError(context, error) {
  console.error(`[DB] ${context}:`, error?.message || error);
  showToast(`Error: ${error?.message || 'Database error — check console'}`, 'error');
  return null;
}

// ============================================================
// AUTH
// ============================================================
const DB = {

  auth: {
    async signIn(email, password) {
      const { data, error } = await _db.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { data };
    },
    async signUp(email, password) {
      const { data, error } = await _db.auth.signUp({ email, password });
      if (error) return { error };
      return { data };
    },
    async signOut() {
      const { error } = await _db.auth.signOut();
      if (error) console.error('Sign out error:', error);
    },
    async getSession() {
      const { data } = await _db.auth.getSession();
      return data?.session || null;
    },
    onAuthStateChange(cb) {
      return _db.auth.onAuthStateChange(cb);
    },
  },

  // ============================================================
  // INCIDENTS
  // ============================================================
  incidents: {

    async getAll({ search = '', type = '', severity = '', status = '', orderBy = 'created_at', orderDir = false } = {}) {
      let q = _db.from('incidents').select('*');
      if (type)     q = q.eq('type', type);
      if (severity) q = q.eq('severity', severity);
      if (status)   q = q.eq('status', status);
      if (search)   q = q.or(`location.ilike.%${search}%,officer_name.ilike.%${search}%,incident_id.ilike.%${search}%`);
      q = q.order(orderBy, { ascending: orderDir });
      const { data, error } = await q;
      if (error) return dbError('incidents.getAll', error) || [];
      return data || [];
    },

    async create({ location, type, severity, officer_name, status = 'Active', fine = 0, notes = '' }) {
      const { data, error } = await _db.from('incidents')
        .insert({ location, type, severity, officer_name, status, fine, notes })
        .select().single();
      if (error) return dbError('incidents.create', error);
      return data;
    },

    async update(id, updates) {
      const { data, error } = await _db.from('incidents')
        .update(updates).eq('id', id).select().single();
      if (error) return dbError('incidents.update', error);
      return data;
    },

    async delete(id) {
      const { error } = await _db.from('incidents').delete().eq('id', id);
      if (error) return dbError('incidents.delete', error);
      return true;
    },

    async getTodayCount() {
      const { count, error } = await _db.from('incidents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday());
      if (error) return 0;
      return count || 0;
    },

    async getMTDFines() {
      const { data, error } = await _db.from('incidents')
        .select('fine').gte('created_at', startOfMonth());
      if (error) return 0;
      return (data || []).reduce((s, r) => s + Number(r.fine || 0), 0);
    },

    async getWeeklyTrend() {
      const { data, error } = await _db.from('incidents')
        .select('created_at').gte('created_at', startOfWeek())
        .order('created_at', { ascending: true });
      if (error) return [];
      // Group by day
      const map = {};
      (data || []).forEach(r => {
        const day = new Date(r.created_at).toLocaleDateString('en-NG', { weekday:'short' });
        map[day] = (map[day] || 0) + 1;
      });
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return days.map(d => ({ day: d, count: map[d] || 0 }));
    },

    async getByType() {
      const { data, error } = await _db.from('incidents')
        .select('type').gte('created_at', startOfMonth());
      if (error) return {};
      const map = {};
      (data || []).forEach(r => { map[r.type] = (map[r.type] || 0) + 1; });
      return map;
    },

    async getRecent(limit = 6) {
      const { data, error } = await _db.from('incidents')
        .select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) return [];
      return data || [];
    },

    async getMonthlyFines() {
      const yearStart = new Date(); yearStart.setMonth(0); yearStart.setDate(1); yearStart.setHours(0,0,0,0);
      const { data, error } = await _db.from('incidents')
        .select('fine,created_at').gte('created_at', yearStart.toISOString());
      if (error) return Array(12).fill(0);
      const months = Array(12).fill(0);
      (data || []).forEach(r => {
        const m = new Date(r.created_at).getMonth();
        months[m] += Number(r.fine || 0);
      });
      return months;
    },

    async getBySeverity() {
      const { data, error } = await _db.from('incidents').select('severity');
      if (error) return { High: 0, Medium: 0, Low: 0 };
      const map = { High: 0, Medium: 0, Low: 0 };
      (data || []).forEach(r => { if (map[r.severity] !== undefined) map[r.severity]++; });
      return map;
    },

    async getByLGA() {
      const { data, error } = await _db.from('incidents').select('location,status,fine');
      if (error) return [];
      // Simple LGA extraction from location field
      const lgaMap = {};
      (data || []).forEach(r => {
        const lga = (r.location || '').split(/[,–-]/)[0].trim() || 'Unknown';
        if (!lgaMap[lga]) lgaMap[lga] = { incidents: 0, resolved: 0, fines: 0 };
        lgaMap[lga].incidents++;
        if (r.status === 'Resolved') lgaMap[lga].resolved++;
        lgaMap[lga].fines += Number(r.fine || 0);
      });
      return Object.entries(lgaMap)
        .map(([lga, v]) => ({ lga, ...v }))
        .sort((a, b) => b.incidents - a.incidents).slice(0, 6);
    },

    async getHourlyDistribution() {
      const { data, error } = await _db.from('incidents').select('created_at');
      if (error) return Array(24).fill(0);
      const hours = Array(24).fill(0);
      (data || []).forEach(r => { hours[new Date(r.created_at).getHours()]++; });
      return hours;
    },

    async getDayOfWeekDistribution() {
      const { data, error } = await _db.from('incidents').select('created_at');
      if (error) return Array(7).fill(0);
      const days = Array(7).fill(0);
      (data || []).forEach(r => { days[new Date(r.created_at).getDay()]++; });
      return days;
    },

    subscribeToNew(callback) {
      return _db.channel('incidents-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, payload => {
          callback(payload.new);
        })
        .subscribe();
    },
  },

  // ============================================================
  // VEHICLES
  // ============================================================
  vehicles: {

    async getAll({ search = '', type = '', lga = '', status = '' } = {}) {
      let q = _db.from('vehicles').select('*').order('created_at', { ascending: false });
      if (type)   q = q.eq('type', type);
      if (lga)    q = q.eq('lga', lga);
      if (status) q = q.eq('status', status);
      if (search) q = q.or(`plate.ilike.%${search}%,owner.ilike.%${search}%,lga.ilike.%${search}%,make.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) return dbError('vehicles.getAll', error) || [];
      return data || [];
    },

    async create({ plate, owner, make, type, color, lga, expiry }) {
      const { data, error } = await _db.from('vehicles')
        .insert({ plate, owner, make, type, color, lga, expiry })
        .select().single();
      if (error) return dbError('vehicles.create', error);
      return data;
    },

    async update(id, updates) {
      const { data, error } = await _db.from('vehicles')
        .update(updates).eq('id', id).select().single();
      if (error) return dbError('vehicles.update', error);
      return data;
    },

    async getCount() {
      const { count, error } = await _db.from('vehicles')
        .select('*', { count: 'exact', head: true });
      return error ? 0 : (count || 0);
    },

    async getCountByStatus() {
      const { data, error } = await _db.from('vehicles').select('status');
      if (error) return { Valid: 0, Expired: 0, Suspended: 0 };
      const map = { Valid: 0, Expired: 0, Suspended: 0 };
      (data || []).forEach(r => { if (map[r.status] !== undefined) map[r.status]++; });
      return map;
    },

    async getLGAs() {
      const { data, error } = await _db.from('vehicles').select('lga');
      if (error) return [];
      return [...new Set((data || []).map(r => r.lga))].sort();
    },
  },

  // ============================================================
  // OFFICERS
  // ============================================================
  officers: {

    async getAll({ search = '', zone = '', status = '', rank = '' } = {}) {
      let q = _db.from('officers').select('*').order('incidents_count', { ascending: false });
      if (zone)   q = q.eq('zone', zone);
      if (status) q = q.eq('status', status);
      if (rank)   q = q.eq('rank', rank);
      if (search) q = q.or(`name.ilike.%${search}%,badge.ilike.%${search}%,zone.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) return dbError('officers.getAll', error) || [];
      return data || [];
    },

    async create({ name, badge, rank, zone, phone, joined }) {
      const { data, error } = await _db.from('officers')
        .insert({ name, badge, rank, zone, phone, joined })
        .select().single();
      if (error) return dbError('officers.create', error);
      return data;
    },

    async update(id, updates) {
      const { data, error } = await _db.from('officers')
        .update(updates).eq('id', id).select().single();
      if (error) return dbError('officers.update', error);
      return data;
    },

    async getCount() {
      const { count, error } = await _db.from('officers')
        .select('*', { count: 'exact', head: true });
      return error ? 0 : (count || 0);
    },

    async getOnDutyCount() {
      const { count, error } = await _db.from('officers')
        .select('*', { count: 'exact', head: true }).eq('status', 'On Duty');
      return error ? 0 : (count || 0);
    },

    async getZones() {
      const { data, error } = await _db.from('officers').select('zone');
      if (error) return [];
      return [...new Set((data || []).map(r => r.zone))].sort();
    },
  },

  // ============================================================
  // DASHBOARD — parallel stats fetch
  // ============================================================
  dashboard: {
    async getStats() {
      const [vehicles, incidentsToday, officers, mtdFines] = await Promise.all([
        DB.vehicles.getCount(),
        DB.incidents.getTodayCount(),
        DB.officers.getOnDutyCount(),
        DB.incidents.getMTDFines(),
      ]);
      return { vehicles, incidentsToday, officers, mtdFines };
    },
  },
};
