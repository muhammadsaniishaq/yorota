// YOROTA Smart Office - Administrative Dashboard
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  UserX, 
  Activity, 
  CreditCard, 
  ArrowUpRight, 
  RefreshCw, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { db } from '../services/db';
import YorotaLogo from '../components/YorotaLogo';

export default function Dashboard({ currentUser, onViewChange, notification }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    incomeToday: 0,
    incomeThisMonth: 0,
    registrations: 0,
    renewals: 0,
    transfers: 0,
    unpaidDebts: 0,
    totalOwed: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get ledger totals
      const balance = await db.transactions.getBalanceSummary();
      
      // 2. Get daily work entries
      const records = await db.dailyRecords.getAll();
      
      // 3. Get outstanding debt summary
      const debtSum = await db.debtors.getSummary();

      // Filter daily counts by category
      let regs = 0;
      let rens = 0;
      let trans = 0;

      records.forEach(r => {
        const catName = r.service?.name?.toLowerCase() || '';
        if (catName.includes('reg')) regs += r.quantity;
        else if (catName.includes('renew') || catName.includes('ren')) rens += r.quantity;
        else if (catName.includes('trans') || catName.includes('owner')) trans += r.quantity;
      });

      setStats({
        incomeToday: balance.incomeToday,
        incomeThisMonth: balance.incomeThisMonth,
        registrations: regs,
        renewals: rens,
        transfers: trans,
        unpaidDebts: debtSum.unpaidCount,
        totalOwed: debtSum.totalOwed
      });

      // Assemble recent activity feeds
      const mergedActivities = [
        ...records.slice(0, 5).map(r => ({
          id: r.id,
          type: 'Registration',
          title: `${r.service?.name || 'Category'} - ${r.customer_name}`,
          amount: r.amount,
          actor: r.officer_name,
          time: new Date(r.created_at).toLocaleTimeString() + ' ' + new Date(r.created_at).toLocaleDateString(),
          color: 'text-emerald-400 bg-emerald-500/10'
        })),
        ...records.slice(5, 7).map(r => ({
          id: r.id,
          type: 'Registration',
          title: `${r.service?.name || 'Category'} - ${r.customer_name}`,
          amount: r.amount,
          actor: r.officer_name,
          time: new Date(r.created_at).toLocaleTimeString() + ' ' + new Date(r.created_at).toLocaleDateString(),
          color: 'text-emerald-400 bg-emerald-500/10'
        }))
      ].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 6);

      setRecentActivities(mergedActivities);

      // Compute last 7 days chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const txs = await db.transactions.getAll();
      const dailyRevenues = last7Days.map(dateStr => {
        const dayTxs = txs.filter(t => t.date === dateStr && t.type === 'income');
        const revenue = dayTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        // Match day initials
        const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
        return {
          name: dayName,
          revenue
        };
      });
      setChartData(dailyRevenues);

      // Category volumes for the BarChart
      const activeCategories = await db.services.getAll();
      const catVolumes = activeCategories.map(cat => {
        const catRecords = records.filter(r => r.service_id === cat.id);
        const units = catRecords.reduce((sum, r) => sum + r.quantity, 0);
        return {
          name: cat.name.length > 12 ? cat.name.substring(0, 12) + '..' : cat.name,
          Units: units
        };
      });
      setCategoryData(catVolumes.filter(c => c.Units > 0));

    } catch (err) {
      console.error('Dashboard load failure', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {/* Vector SVG Steering Wheel Spinner */}
        <svg 
          className="w-16 h-16 text-[#F5C800] steering-wheel-loader" 
          viewBox="0 0 64 64" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Outer Rim */}
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
          {/* Inner Center Hub */}
          <circle cx="32" cy="32" r="6" fill="currentColor" />
          {/* Three Spoke columns representing official steering wheels */}
          <line x1="32" y1="38" x2="32" y2="60" strokeWidth="4.5" />
          <line x1="28" y1="30" x2="8" y2="18" strokeWidth="4.5" />
          <line x1="36" y1="30" x2="56" y2="18" strokeWidth="4.5" />
          {/* Small inner decoration rings */}
          <circle cx="32" cy="32" r="16" stroke="currentColor" strokeDasharray="6,6" strokeWidth="1.5" opacity="0.6" />
        </svg>
        <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest animate-pulse">Initializing Dashboard Feeds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <YorotaLogo className="w-12 h-12 shrink-0" showText={false} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 hidden sm:block">Real-time revenue monitoring and activity center.</p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-[#0c1220] text-[10px] sm:text-xs font-semibold hover:bg-slate-900 transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh Stats
        </button>
      </div>

      {/* Zebra Crossing Divider & Flowing Highway Line */}
      <div className="space-y-1.5 my-2">
        <div className="zebra-crossing-line opacity-95" />
        <div className="animate-road-flow" />
      </div>

      {/* Metric Cards Grid - 2 columns on mobile, highly compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
        
        {/* Card 1: Today Income */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Income Today</span>
              <h2 className="text-xs font-black text-slate-100 gold-text-glow mt-0.5">₦{stats.incomeToday.toFixed(2)}</h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Income Today</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-100 gold-text-glow">₦{stats.incomeToday.toFixed(2)}</h2>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> Live flow
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Income */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">This Month</span>
              <h2 className="text-xs font-black text-slate-100 gold-text-glow mt-0.5">₦{stats.incomeThisMonth.toFixed(2)}</h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">This Month</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-100 gold-text-glow">₦{stats.incomeThisMonth.toFixed(2)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Billing cycle</p>
            </div>
          </div>
        </div>

        {/* Card 3: Total Registrations */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Registrations</span>
              <h2 className="text-xs font-black text-slate-100 mt-0.5">{stats.registrations} <span className="text-[9px] font-normal text-slate-400">qty</span></h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Registrations</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-100">{stats.registrations} <span className="text-xs font-normal text-slate-400">units</span></h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Rider permits</p>
            </div>
          </div>
        </div>

        {/* Card 4: Renewals */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Renewals</span>
              <h2 className="text-xs font-black text-slate-100 mt-0.5">{stats.renewals} <span className="text-[9px] font-normal text-slate-400">qty</span></h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Renewals</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-100">{stats.renewals} <span className="text-xs font-normal text-slate-400">units</span></h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Permits renewed</p>
            </div>
          </div>
        </div>

        {/* Card 5: Transfers */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Transfers</span>
              <h2 className="text-xs font-black text-slate-100 mt-0.5">{stats.transfers} <span className="text-[9px] font-normal text-slate-400">qty</span></h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Transfers</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-slate-100">{stats.transfers} <span className="text-xs font-normal text-slate-400">units</span></h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Ownership reassigned</p>
            </div>
          </div>
        </div>

        {/* Card 6: Debt */}
        <div className="premium-glass rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-between relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex items-center gap-2 sm:hidden w-full">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <UserX className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Debtors</span>
              <h2 className="text-xs font-black text-red-500 mt-0.5">₦{stats.totalOwed.toFixed(2)}</h2>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Debtors</span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                <UserX className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-black text-red-500">₦{stats.totalOwed.toFixed(2)}</h2>
              <p className="text-[10px] text-red-400 font-bold flex items-center gap-0.5 mt-0.5">
                <AlertCircle className="w-3 h-3 text-red-400" /> {stats.unpaidDebts} Unpaid
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Chart panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
        
        {/* Daily Revenue Area Graph */}
        <div className="premium-glass rounded-2xl p-3.5 sm:p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 text-slate-200">
              <TrendingUp className="w-4 h-4 text-[#F5C800]" />
              Revenue Flow (Last 7 Days)
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Income streams logged through services registrations.</p>
          </div>
          
          <div className="h-[180px] sm:h-[250px] w-full mt-3 sm:mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C800" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#F5C800" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0c1220', borderColor: '#1a263d', color: '#f8fafc', borderRadius: '12px', fontSize: '10px' }}
                  labelStyle={{ fontWeight: 'black', color: '#F5C800' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F5C800" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue (₦)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Volumes Bar Chart */}
        <div className="premium-glass rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 text-slate-200">
              <Activity className="w-4 h-4 text-[#F5C800]" />
              Unit Distribution
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Units processed per active category.</p>
          </div>

          <div className="h-[180px] sm:h-[250px] w-full mt-3 sm:mt-6 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1220', borderColor: '#1a263d', color: '#f8fafc', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Bar dataKey="Units" fill="#F5C800" radius={[3, 3, 0, 0]} name="Units" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-[10px] text-slate-500">
                <AlertCircle className="w-6 h-6 text-slate-600 mb-1.5" />
                No units processed
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Daily Records Shortcuts & Activity Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3.5 sm:gap-6">
        
        {/* Recent Activity Table (Highly Compact on Mobile) */}
        <div className="premium-glass rounded-2xl p-3.5 sm:p-5 xl:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 mb-0.5 text-slate-200">
              <Activity className="w-4 h-4 text-[#F5C800]" />
              Recent Operations Log
            </h3>
            <p className="text-[10px] text-slate-500 hidden sm:block">Latest registration entries logged by officers.</p>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2 px-2 hidden sm:table-cell">OPERATION</th>
                  <th className="py-2 px-2">RECORD TITLE</th>
                  <th className="py-2 px-2">AMOUNT</th>
                  <th className="py-2 px-2 text-right hidden sm:table-cell">COLLECTED BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentActivities.length > 0 ? (
                  recentActivities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-900/30 transition duration-150">
                      <td className="py-2 px-2 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${act.color}`}>
                          {act.type}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-slate-200 truncate max-w-[150px] sm:max-w-none">{act.title}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{act.time}</div>
                      </td>
                      <td className="py-2 px-2 font-black text-emerald-400">
                        ₦{parseFloat(act.amount).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400 font-bold hidden sm:table-cell">
                        {act.actor}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-500">No operations recorded today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fast Action Shortcuts Card - 2x2 Grid on Mobile for massive height savings! */}
        <div className="premium-glass rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight mb-0.5 text-slate-200">Quick Actions</h3>
            <p className="text-[10px] text-slate-500 hidden sm:block">Navigate to forms and registry systems instantly.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-1 sm:space-y-3 mt-4 sm:mt-6">
            <button 
              onClick={() => onViewChange('daily-entry')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20 transition text-[10px] sm:text-xs group cursor-pointer"
            >
              <span>NEW WORK ENTRY</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
            </button>

            <button 
              onClick={() => onViewChange('services')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#F5C800] font-bold border border-[#F5C800]/20 transition text-[10px] sm:text-xs group text-left cursor-pointer hover:border-[#F5C800]/50"
            >
              <span>ADD CATEGORY</span>
              <Settings className="w-3.5 h-3.5 text-[#F5C800] group-hover:rotate-45 transition-transform duration-300 shrink-0" />
            </button>

            <button 
              onClick={() => onViewChange('ledger')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 font-bold border border-slate-800 transition text-[10px] sm:text-xs group text-left cursor-pointer"
            >
              <span>LOG TRANSACTION</span>
              <CreditCard className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition shrink-0" />
            </button>

            <button 
              onClick={() => onViewChange('debtors')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 font-bold border border-slate-800 transition text-[10px] sm:text-xs group text-left cursor-pointer"
            >
              <span>MANAGE DEBTS</span>
              <UserX className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition shrink-0" />
            </button>
          </div>

          <div className="p-3 rounded-xl border border-slate-800/60 bg-slate-950/30 text-[9px] text-slate-500 leading-relaxed mt-4 sm:mt-6 hidden sm:block">
            <span className="font-bold text-[#F5C800] block mb-1">Audit Policy Reminder</span>
            All ledger transactions, registration logs, and debtor receipts are dynamically monitored and timestamped.
          </div>
        </div>

      </div>

    </div>
  );
}
