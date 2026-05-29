// YOROTA Smart Office - Advanced Auditing & Reports
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  FileText, 
  RefreshCw, 
  Printer,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/db';
import { pdfGenerator } from '../services/pdfGenerator';

export default function Reports({ setGlobalNotification }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter range selection
  const [filterType, setFilterType] = useState('monthly'); // 'daily', '10days', 'monthly', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await db.dailyRecords.getAll();
      const txs = await db.transactions.getAll();
      const cats = await db.services.getAll();
      setRecords(recs);
      setTransactions(txs);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading auditing reports data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute boundaries based on selection
  const getFilterBounds = () => {
    const start = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (filterType === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (filterType === '10days') {
      start.setDate(start.getDate() - 10);
      start.setHours(0, 0, 0, 0);
    } else if (filterType === 'monthly') {
      start.setDate(1); // First day of current month
      start.setHours(0, 0, 0, 0);
    } else if (filterType === 'custom') {
      const s = customStart ? new Date(customStart) : new Date();
      s.setHours(0, 0, 0, 0);
      const e = customEnd ? new Date(customEnd) : new Date();
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }

    return { start, end };
  };

  const { start, end } = getFilterBounds();

  // Filter records & transactions by Date boundaries
  const filteredRecords = records.filter(r => {
    const dt = new Date(r.created_at);
    return dt >= start && dt <= end;
  });

  const filteredTransactions = transactions.filter(t => {
    const dt = new Date(t.created_at);
    return dt >= start && dt <= end;
  });

  // Calculate summaries dynamically
  const totalCount = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  // Dynamic Grouping of service categories processed
  const serviceSummary = {};
  categories.forEach(cat => {
    serviceSummary[cat.name] = 0;
  });

  filteredRecords.forEach(r => {
    const catName = r.service?.name || 'Unassigned Services';
    serviceSummary[catName] = (serviceSummary[catName] || 0) + r.quantity;
  });

  // Ledger summaries within range
  const ledgerIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const ledgerExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const ledgerNet = ledgerIncome - ledgerExpense;

  const dateRangeText = filterType === 'custom' 
    ? `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
    : `${start.toLocaleDateString()} to Present`;

  const handleExportPDF = () => {
    try {
      const typeText = 
        filterType === 'daily' ? 'Daily Summary' :
        filterType === '10days' ? '10 Days Auditing' :
        filterType === 'monthly' ? 'Monthly Operational' : 'Custom Bounds';

      const summaryPayload = {
        totalCount,
        totalAmount,
        ledgerNet,
        categories: serviceSummary
      };

      pdfGenerator.generateReport(typeText, dateRangeText, filteredRecords, summaryPayload, filteredTransactions);
      setGlobalNotification({ message: `Audit Report exported successfully`, type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to compile PDF report', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audits & Reports Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compile dynamic registration metrics, group services processing, and export official PDFs.
          </p>
        </div>
        
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary font-bold text-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Data
        </button>
      </div>

      {/* Period Filter Selector Tabs */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Audit Scope Range Selection</span>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'daily', label: 'TODAY SUMMARY' },
            { id: '10days', label: 'LAST 10 DAYS' },
            { id: 'monthly', label: 'CURRENT MONTH' },
            { id: 'custom', label: 'CUSTOM DATE RANGE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`py-2 px-4 rounded-xl text-xs font-bold uppercase transition ${
                filterType === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-500/10'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom date range controls */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60 max-w-xl">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#10b981] transition"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#10b981] transition"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Audit Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block">Units Registered</span>
              <h3 className="text-xl font-black mt-2 text-slate-200">{totalCount} units</h3>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block">Registry Value</span>
              <h3 className="text-xl font-black mt-2 text-emerald-500">${totalAmount.toFixed(2)}</h3>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block">Ledger Expenses Logged</span>
              <h3 className="text-xl font-black mt-2 text-red-400">${ledgerExpense.toFixed(2)}</h3>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase block">Ledger Net Cash</span>
              <h3 className={`text-xl font-black mt-2 ${ledgerNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ${ledgerNet.toFixed(2)}
              </h3>
            </div>

          </div>

          {/* Grouped counts and detailed logs section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Dynamic groupings (Left column) */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">Category Summaries</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Registration distributions across services.</p>
              </div>

              <div className="divide-y divide-border/60 text-xs">
                {Object.entries(serviceSummary).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-3 hover:bg-secondary/20 px-1 rounded transition">
                    <span className="text-slate-400 font-semibold">{name}</span>
                    <span className="font-black text-slate-200 bg-secondary px-2.5 py-0.5 rounded-full">{count} units</span>
                  </div>
                ))}
                
                {Object.keys(serviceSummary).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">No dynamic categories processed.</div>
                )}

                <div className="flex justify-between py-4 font-bold text-emerald-400 border-t border-border/80 mt-2">
                  <span>TOTAL SCOPE VOLUME:</span>
                  <span className="font-extrabold">{totalCount} units processed</span>
                </div>
              </div>
            </div>

            {/* Itemized tables list logs (Right column) */}
            <div className="bg-card border border-border rounded-xl p-5 xl:col-span-2 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">Itemized Range Logs ({filteredRecords.length})</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Entries logged during this auditing scope.</p>
                </div>
                
                <button
                  onClick={handleExportPDF}
                  disabled={filteredRecords.length === 0}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-black text-xs transition disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  GENERATE PDF AUDIT REPORT
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold bg-secondary/30">
                      <th className="py-2.5 px-2">DATE</th>
                      <th className="py-2.5 px-2">CUSTOMER</th>
                      <th className="py-2.5 px-2">SERVICE</th>
                      <th className="py-2.5 px-2">QTY</th>
                      <th className="py-2.5 px-2">CHARGE</th>
                      <th className="py-2.5 px-2 text-right">OFFICER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-secondary/20 transition">
                          <td className="py-2.5 px-2 font-medium text-slate-400">
                            {new Date(rec.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-200">
                            {rec.customer_name}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="bg-[#10b981]/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                              {rec.service?.name || 'Category'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold">{rec.quantity}</td>
                          <td className="py-2.5 px-2 font-black text-emerald-500">${parseFloat(rec.amount).toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">{rec.officer_name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          No logs found within this date range scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
