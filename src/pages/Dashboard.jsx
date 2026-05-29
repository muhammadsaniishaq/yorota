// YOROTA Smart Office - Administrative Dashboard
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileSpreadsheet, 
  TrendingUp, 
  UserX, 
  Activity, 
  CreditCard, 
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { db } from '../services/db';

export default function Dashboard({ onViewChange, notification }) {
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time revenue monitoring and activity center.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-secondary transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Today Income */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Income Today</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black">${stats.incomeToday.toFixed(2)}</h2>
            <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Live ledger flow
            </p>
          </div>
        </div>

        {/* Card 2: Monthly Income */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">This Month</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black">${stats.incomeThisMonth.toFixed(2)}</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Current billing cycle</p>
          </div>
        </div>

        {/* Card 3: Total Registrations */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Registrations</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black">{stats.registrations} <span className="text-xs font-normal text-muted-foreground">units</span></h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Rider permits logged</p>
          </div>
        </div>

        {/* Card 4: Renewals */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Renewals</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black">{stats.renewals} <span className="text-xs font-normal text-muted-foreground">units</span></h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Permits renewed</p>
          </div>
        </div>

        {/* Card 5: Transfers */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Ownership Transfers</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black">{stats.transfers} <span className="text-xs font-normal text-muted-foreground">units</span></h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Deeds reassigned</p>
          </div>
        </div>

        {/* Card 6: Debt */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Debtors</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-black text-red-500">${stats.totalOwed.toFixed(2)}</h2>
            <p className="text-[10px] text-red-400 font-bold flex items-center gap-0.5 mt-0.5">
              <AlertCircle className="w-3 h-3 text-red-400" /> {stats.unpaidDebts} Unsettled
            </p>
          </div>
        </div>

      </div>

      {/* Analytics Chart panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Revenue Area Graph */}
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Daily Revenue Flow (Last 7 Days)
            </h3>
            <p className="text-xs text-muted-foreground">Income streams logged through services registrations.</p>
          </div>
          
          <div className="h-[250px] w-full mt-6">
            <ResponsiveContainer width="100%" h="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f8fafc', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#10b981' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Volumes Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              Service Unit Distribution
            </h3>
            <p className="text-xs text-muted-foreground">Units processed per active category.</p>
          </div>

          <div className="h-[250px] w-full mt-6 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f8fafc', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="Units" fill="#10b981" radius={[4, 4, 0, 0]} name="Units Processed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                No units processed today
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Daily Records Shortcuts & Activity Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Activity Table */}
        <div className="bg-card border border-border rounded-xl p-5 xl:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5 mb-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              Recent Operations Log
            </h3>
            <p className="text-xs text-muted-foreground">Latest registration entries logged by officers.</p>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold">
                  <th className="py-2.5 px-3">OPERATION</th>
                  <th className="py-2.5 px-3">RECORD TITLE</th>
                  <th className="py-2.5 px-3">AMOUNT</th>
                  <th className="py-2.5 px-3 text-right">COLLECTED BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentActivities.length > 0 ? (
                  recentActivities.map(act => (
                    <tr key={act.id} className="hover:bg-secondary/40 transition">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${act.color}`}>
                          {act.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{act.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{act.time}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-500">
                        ${parseFloat(act.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground font-medium">
                        {act.actor}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-muted-foreground">No operations recorded today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fast Action Shortcuts Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight mb-1">Operations Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Navigate to forms and registry systems instantly.</p>
          </div>

          <div className="space-y-3 mt-6">
            <button 
              onClick={() => onViewChange('daily-entry')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/20 transition text-xs group"
            >
              <span>CREATE DAILY WORK ENTRY</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>

            <button 
              onClick={() => onViewChange('ledger')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-secondary hover:bg-muted font-bold border border-border transition text-xs group text-left"
            >
              <span>LOG LEDGER TRANSACTION</span>
              <CreditCard className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition" />
            </button>

            <button 
              onClick={() => onViewChange('debtors')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-secondary hover:bg-muted font-bold border border-border transition text-xs group text-left"
            >
              <span>MANAGE OUTSTANDING DEBTS</span>
              <UserX className="w-4 h-4 text-red-500 group-hover:scale-110 transition" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-[#1f2937]/30 bg-slate-900/30 text-[10px] text-muted-foreground leading-relaxed mt-6">
            <span className="font-bold text-[#10b981] block mb-1">Audit Policy Reminder</span>
            All ledger transactions, registration logs, and debtor receipts are dynamically monitored and timestamped. Modifying or deleting services instantly impacts daily entry workflows.
          </div>
        </div>

      </div>

    </div>
  );
}
