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
    <div className="space-y-4 px-1 sm:px-4">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">Audit & Reports</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Compile operational metrics and group processed categories.
          </p>
        </div>
        
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-secondary font-extrabold text-[10px] sm:text-xs transition cursor-pointer select-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F5C800]" />
          REFRESH AUDIT
        </button>
      </div>

      {/* Period Filter Selector Tabs - highly compact */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Audit Scope Range</span>
        
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'daily', label: 'TODAY SUMMARY' },
            { id: '10days', label: '10 DAYS' },
            { id: 'monthly', label: 'THIS MONTH' },
            { id: 'custom', label: 'CUSTOM RANGE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer select-none ${
                filterType === tab.id
                  ? 'bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] shadow-md shadow-[#F5C800]/10'
                  : 'bg-slate-950/40 text-slate-400 hover:bg-slate-850 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom date range controls */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 max-w-lg">
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-1.5 px-2 text-[10px] text-slate-400 focus:outline-none focus:border-[#F5C800] transition"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-1.5 px-2 text-[10px] text-slate-400 focus:outline-none focus:border-[#F5C800] transition"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Summary Audit Metric Grid - Highly compact 2x2 layout on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            
            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Units Registered</span>
              <h3 className="text-xs sm:text-lg font-black mt-1 text-slate-200">{totalCount} units</h3>
            </div>

            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registry Value</span>
              <h3 className="text-xs sm:text-lg font-black mt-1 text-emerald-400">${totalAmount.toFixed(2)}</h3>
            </div>

            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Expenses</span>
              <h3 className="text-xs sm:text-lg font-black mt-1 text-red-500">${ledgerExpense.toFixed(2)}</h3>
            </div>

            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Net Cash</span>
              <h3 className={`text-xs sm:text-lg font-black mt-1 ${ledgerNet >= 0 ? 'text-emerald-400' : 'text-red-550'}`}>
                ${ledgerNet.toFixed(2)}
              </h3>
            </div>

          </div>

          {/* Grouped counts and detailed logs section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3.5 sm:gap-6">
            
            {/* Dynamic groupings (Left column) */}
            <div className="premium-glass border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3">
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">Category summaries</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Registration distributions across services.</p>
              </div>

              <div className="divide-y divide-slate-800/40 text-[10px] sm:text-xs">
                {Object.entries(serviceSummary).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-2.5 hover:bg-slate-900/20 px-1 rounded transition">
                    <span className="text-slate-400 font-semibold">{name}</span>
                    <span className="font-black text-slate-200 bg-slate-950/40 px-2 py-0.5 rounded">{count} units</span>
                  </div>
                ))}
                
                {Object.keys(serviceSummary).length === 0 && (
                  <div className="text-center py-4 text-slate-500">No categories processed in scope.</div>
                )}

                <div className="flex justify-between py-3 font-bold text-emerald-450 border-t border-slate-800/80 mt-2">
                  <span>TOTAL SCOPE VOLUME:</span>
                  <span className="font-extrabold">{totalCount} units</span>
                </div>
              </div>
            </div>

            {/* Itemized tables list logs (Right column) */}
            <div className="premium-glass border border-slate-800 rounded-xl p-3.5 sm:p-5 xl:col-span-2 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">Itemized logs ({filteredRecords.length})</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">Entries logged during this auditing scope.</p>
                </div>
                
                <button
                  onClick={handleExportPDF}
                  disabled={filteredRecords.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs transition disabled:opacity-50 select-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  GENERATE PDF AUDIT REPORT
                </button>
              </div>

              {/* Range Logs Section */}
              {filteredRecords.length > 0 ? (
                <div className="space-y-2">
                  
                  {/* MOBILE COMPACT CARD VIEW (sm:hidden) */}
                  <div className="block sm:hidden space-y-2">
                    {filteredRecords.map(rec => (
                      <div key={rec.id} className="bg-slate-950/30 p-2.5 rounded-xl border border-slate-850 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                          <span className="bg-[#10b981]/10 text-emerald-400 font-black px-1.5 py-0.5 rounded text-[8px] uppercase">
                            {rec.service?.name || 'Category'}
                          </span>
                        </div>
                        <div className="flex justify-between items-end pt-1">
                          <div>
                            <div className="font-bold text-slate-100">{rec.customer_name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">Officer: {rec.officer_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-400">${parseFloat(rec.amount).toFixed(2)}</div>
                            <div className="text-[8px] text-slate-400 mt-0.5">Qty: x{rec.quantity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE VIEW (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
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
                        {filteredRecords.map(rec => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-xl flex flex-col items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-slate-650 mb-2" />
                  <p className="font-bold text-xs">No entries within date range scope</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

