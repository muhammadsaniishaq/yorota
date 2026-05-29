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

  // Interactive splits actions modals states
  const [hqModalOpen, setHqModalOpen] = useState(false);
  const [officeModalOpen, setOfficeModalOpen] = useState(false);
  const [remitAmount, setRemitAmount] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

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

  // Revenue Sharing Set-Aside Audits (₦500 per unit, split 70/30)
  const setAsideTotal = totalCount * 500;
  const setAsideHQ = setAsideTotal * 0.7;
  const setAsideOffice = setAsideTotal * 0.3;

  // Retrieve remittances logged as expenditures in cash ledger
  const hqRemitted = filteredTransactions
    .filter(t => t.type === 'expense' && t.purpose === 'HQ Remittance')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const hqOutstanding = Math.max(0, setAsideHQ - hqRemitted);

  const officeDisbursed = filteredTransactions
    .filter(t => t.type === 'expense' && t.purpose === 'Office Disbursal')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const officeBalance = Math.max(0, setAsideOffice - officeDisbursed);

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
        categories: serviceSummary,
        setAsideTotal,
        setAsideHQ,
        setAsideOffice,
        hqRemitted,
        hqOutstanding,
        officeDisbursed,
        officeBalance
      };

      pdfGenerator.generateReport(typeText, dateRangeText, filteredRecords, summaryPayload, filteredTransactions);
      setGlobalNotification({ message: `Audit Report exported successfully`, type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to compile PDF report', type: 'error' });
    }
  };

  const handleRecordHQRemittance = async (e) => {
    e.preventDefault();
    if (!remitAmount || isNaN(parseFloat(remitAmount)) || parseFloat(remitAmount) <= 0) {
      setModalError('Please enter a valid amount.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await db.transactions.create({
        type: 'expense',
        amount: parseFloat(remitAmount),
        purpose: 'HQ Remittance',
        collected_by: 'Authorized Officer'
      });
      setHqModalOpen(false);
      setRemitAmount('');
      setGlobalNotification({ message: `HQ Remittance of ₦${parseFloat(remitAmount).toFixed(2)} logged successfully!`, type: 'success' });
      loadData();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Error occurred while saving remittance.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRecordOfficeDisbursal = async (e) => {
    e.preventDefault();
    if (!disburseAmount || isNaN(parseFloat(disburseAmount)) || parseFloat(disburseAmount) <= 0) {
      setModalError('Please enter a valid amount.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await db.transactions.create({
        type: 'expense',
        amount: parseFloat(disburseAmount),
        purpose: 'Office Disbursal',
        collected_by: 'Authorized Officer'
      });
      setOfficeModalOpen(false);
      setDisburseAmount('');
      setGlobalNotification({ message: `Office Disbursal of ₦${parseFloat(disburseAmount).toFixed(2)} logged successfully!`, type: 'success' });
      loadData();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Error occurred while saving disbursal.');
    } finally {
      setModalLoading(false);
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
              <h3 className="text-xs sm:text-lg font-black mt-1 text-emerald-400">₦{totalAmount.toFixed(2)}</h3>
            </div>

            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Expenses</span>
              <h3 className="text-xs sm:text-lg font-black mt-1 text-red-500">₦{ledgerExpense.toFixed(2)}</h3>
            </div>

            <div className="premium-glass border border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-sm">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Net Cash</span>
              <h3 className={`text-xs sm:text-lg font-black mt-1 ${ledgerNet >= 0 ? 'text-emerald-400' : 'text-red-550'}`}>
                ₦{ledgerNet.toFixed(2)}
              </h3>
            </div>

          </div>

          {/* Revenue Share Split Gauge Widget */}
          <div className="premium-glass border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-4">
            
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-[#F5C800] uppercase gold-text-glow">
                  Revenue Share & Retention Audit
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  A flat ₦500 administrative surcharge is set aside per unit and split: 70% to Headquarters / 30% retained locally.
                  <span className="text-emerald-450 font-bold block mt-0.5">
                    * Surcharge Separation: Base category fees (e.g. Registry Value above) are kept 100% separate and do not include this surcharge.
                  </span>
                </p>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-1 text-[10px] font-black text-slate-400 uppercase shrink-0">
                Surcharge: ₦500 / unit
              </div>
            </div>

            {/* Split Proportion Progress Bar Gauge */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-900">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-[#F5C800] h-full shadow-md shadow-emerald-500/10 transition-all duration-500" 
                  style={{ width: '70%' }}
                  title="Headquarters Portion: 70%"
                />
                <div 
                  className="bg-[#CA8A04]/45 h-full transition-all duration-500" 
                  style={{ width: '30%' }}
                  title="Local Office Portion: 30%"
                />
              </div>
              <div className="flex justify-between text-[9px] font-extrabold uppercase text-slate-400 px-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Headquarters Share (70%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CA8A04]" />
                  Local Office Share (30%)
                </span>
              </div>
            </div>

            {/* Shares Split Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              {/* Column 1: Headquarters Split */}
              <div className="bg-slate-950/20 border border-slate-850/60 rounded-xl p-3 flex flex-col justify-between border-l-2 border-l-emerald-500/30 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider block">Headquarters Share (70%)</span>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-slate-850/40">
                    <span className="text-slate-500">Total Generated:</span>
                    <span className="font-bold text-slate-200">₦{setAsideHQ.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 text-red-400">Total Paid (Remitted):</span>
                    <span className="font-bold text-red-400">₦{hqRemitted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold border-t border-slate-850/30 pt-1">
                    <span className="text-emerald-450">Outstanding Due:</span>
                    <span className="font-black text-emerald-400">₦{hqOutstanding.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setModalError(''); setRemitAmount(''); setHqModalOpen(true); }}
                  disabled={hqOutstanding <= 0}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer select-none disabled:opacity-50"
                >
                  Record HQ Remittance
                </button>
              </div>

              {/* Column 2: Local Office Split */}
              <div className="bg-slate-950/20 border border-slate-850/60 rounded-xl p-3 flex flex-col justify-between border-l-2 border-l-[#CA8A04]/40 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider block">Local Office Share (30%)</span>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-slate-850/40">
                    <span className="text-slate-500">Total Generated:</span>
                    <span className="font-bold text-slate-200">₦{setAsideOffice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500 text-red-400">Total Disbursed:</span>
                    <span className="font-bold text-red-400">₦{officeDisbursed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold border-t border-slate-850/30 pt-1">
                    <span className="text-[#F5C800]">Retained Balance:</span>
                    <span className="font-black text-[#F5C800]">₦{officeBalance.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setModalError(''); setDisburseAmount(''); setOfficeModalOpen(true); }}
                  disabled={officeBalance <= 0}
                  className="w-full py-1.5 rounded-lg bg-[#CA8A04]/10 border border-[#CA8A04]/20 text-[9px] font-black uppercase text-[#F5C800] hover:bg-[#CA8A04] hover:text-slate-950 transition cursor-pointer select-none disabled:opacity-50"
                >
                  Record Office Disbursal
                </button>
              </div>

              {/* Column 3: Set-aside Surcharge Audit (100%) */}
              <div className="bg-slate-950/20 border border-slate-850/60 rounded-xl p-3 flex flex-col justify-between border-slate-800 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider block">Surcharge Audit (100%)</span>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-slate-850/40">
                    <span className="text-slate-500">Cumulative Generated:</span>
                    <span className="font-bold text-slate-200">₦{setAsideTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Total Outflow:</span>
                    <span className="font-bold text-red-400">₦{(hqRemitted + officeDisbursed).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold border-t border-slate-850/30 pt-1">
                    <span className="text-slate-350">Remaining Vault:</span>
                    <span className="font-black text-slate-200">₦{(hqOutstanding + officeBalance).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-[8.5px] font-bold text-slate-500 text-center py-1 bg-slate-950/40 border border-slate-850/80 rounded-lg">
                  Formula: ₦500 × {totalCount} units
                </div>
              </div>

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
                            <div className="font-black text-emerald-400">₦{parseFloat(rec.amount).toFixed(2)}</div>
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
                            <td className="py-2.5 px-2 font-black text-emerald-500">₦{parseFloat(rec.amount).toFixed(2)}</td>
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

      {/* HQ Remittance Modal */}
      {hqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs text-slate-100">
            <h2 className="text-xs font-black text-[#F5C800] mb-3.5 uppercase tracking-wide">
              Record Headquarters Remittance
            </h2>
            {modalError && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {modalError}
              </div>
            )}
            <form onSubmit={handleRecordHQRemittance} className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  HQ Remittance Amount (₦ Naira) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={hqOutstanding}
                  value={remitAmount}
                  onChange={(e) => setRemitAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => { setHqModalOpen(false); setModalError(''); }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-[10px] uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer"
                >
                  {modalLoading ? 'Logging...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Disbursal Modal */}
      {officeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs text-slate-100">
            <h2 className="text-xs font-black text-[#F5C800] mb-3.5 uppercase tracking-wide">
              Record Office Retention Disbursal
            </h2>
            {modalError && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {modalError}
              </div>
            )}
            <form onSubmit={handleRecordOfficeDisbursal} className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Disbursal Amount (₦ Naira) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={officeBalance}
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => { setOfficeModalOpen(false); setModalError(''); }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-[10px] uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer"
                >
                  {modalLoading ? 'Logging...' : 'Record Disbursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

