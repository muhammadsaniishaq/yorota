// YOROTA Smart Office - Revenue Splits & Surcharges Ledger Account
import React, { useState, useEffect } from 'react';
import { 
  Percent,
  RefreshCw, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { db } from '../services/db';

export default function Surcharges({ setGlobalNotification }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);

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
      setRecords(recs);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading surcharge account ledger', type: 'error' });
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

  // Filter surcharge-specific transaction logs inside range
  const surchargeLogs = filteredTransactions.filter(t => 
    t.purpose === 'HQ Remittance' || t.purpose === 'Office Disbursal'
  );

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
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#F5C800]" />
            Surcharge & Revenue Splits
          </h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Audit Naira set-aside allocations and manage splits ledger.
          </p>
        </div>
        
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-secondary font-extrabold text-[10px] sm:text-xs transition cursor-pointer select-none"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F5C800]" />
          REFRESH LEDGER
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
          
          {/* Revenue Share Split Gauge Widget */}
          <div className="premium-glass border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            
            {/* Widget Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/50 pb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-[#F5C800] uppercase gold-text-glow flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  Split Proportion Status
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 leading-relaxed">
                  A flat ₦500 administrative surcharge is set aside per unit and split: **70% to Headquarters / 30% retained locally**.
                  <span className="text-emerald-450 font-extrabold block mt-0.5">
                    * Strictly Separated: Base registry value revenues are kept completely separate and are not included in this surcharge.
                  </span>
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-black text-[#F5C800] uppercase shrink-0 self-start">
                Fee: ₦500 / unit
              </div>
            </div>

            {/* Split Proportion Progress Bar Gauge */}
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-850">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-[#F5C800] h-full shadow-md shadow-emerald-500/10 transition-all duration-500" 
                  style={{ width: '70%' }}
                  title="Headquarters Share: 70%"
                />
                <div 
                  className="bg-[#CA8A04]/45 h-full transition-all duration-500" 
                  style={{ width: '30%' }}
                  title="Local Office Share: 30%"
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-450 px-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                  Headquarters Share (70%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#CA8A04] shadow-sm" />
                  Local Office Share (30%)
                </span>
              </div>
            </div>

            {/* Shares Split Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              
              {/* Column 1: Headquarters Split */}
              <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between border-l-3 border-l-emerald-500 shadow-sm space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Headquarters Share (70%)</span>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-slate-850/40">
                    <span className="text-slate-500 font-bold">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideHQ.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold text-red-400">Total Remitted:</span>
                    <span className="font-extrabold text-red-400">₦{hqRemitted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-slate-850/30 pt-1.5">
                    <span className="text-emerald-450">Outstanding Due:</span>
                    <span className="font-black text-emerald-400">₦{hqOutstanding.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setModalError(''); setRemitAmount(''); setHqModalOpen(true); }}
                  disabled={hqOutstanding <= 0}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
                >
                  Record HQ Remittance
                </button>
              </div>

              {/* Column 2: Local Office Split */}
              <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between border-l-3 border-l-[#CA8A04] shadow-sm space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Local Office Share (30%)</span>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-slate-850/40">
                    <span className="text-slate-500 font-bold">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideOffice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold text-red-400">Total Disbursed:</span>
                    <span className="font-extrabold text-red-400">₦{officeDisbursed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-slate-850/30 pt-1.5">
                    <span className="text-[#F5C800]">Retained Balance:</span>
                    <span className="font-black text-[#F5C800]">₦{officeBalance.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setModalError(''); setDisburseAmount(''); setOfficeModalOpen(true); }}
                  disabled={officeBalance <= 0}
                  className="w-full py-2.5 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/20 text-[10px] font-black uppercase text-[#F5C800] hover:bg-[#CA8A04] hover:text-slate-950 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
                >
                  Record Office Disbursal
                </button>
              </div>

              {/* Column 3: Set-aside Surcharge Audit (100%) */}
              <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 flex flex-col justify-between border border-slate-800 shadow-sm space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Cumulative Audit (100%)</span>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-slate-850/40">
                    <span className="text-slate-500 font-bold">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Total Outflow:</span>
                    <span className="font-extrabold text-red-400">₦{(hqRemitted + officeDisbursed).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-slate-850/30 pt-1.5">
                    <span className="text-slate-350">Remaining Vault:</span>
                    <span className="font-black text-slate-200">₦{(hqOutstanding + officeBalance).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-[10px] font-extrabold text-slate-500 text-center py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  Formula: ₦500 × {totalCount} units
                </div>
              </div>

            </div>
          </div>

          {/* Surcharge splits ledger feed logs */}
          <div className="premium-glass border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#F5C800]" />
                Splits Ledger Records ({surchargeLogs.length})
              </h3>
              <p className="text-[9px] text-slate-500 mt-0.5">Remittances and disbursals logged during this scope.</p>
            </div>

            {surchargeLogs.length > 0 ? (
              <div className="space-y-2">
                
                {/* Mobile Feed (Cards) */}
                <div className="block sm:hidden space-y-2">
                  {surchargeLogs.map(log => (
                    <div key={log.id} className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${
                          log.purpose === 'HQ Remittance' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/10' : 'bg-yellow-950/30 text-yellow-550 border border-yellow-500/10'
                        }`}>
                          {log.purpose === 'HQ Remittance' ? 'HQ Remit' : 'Office Spend'}
                        </span>
                        <div className="font-bold text-slate-450 mt-1.5 text-[10px]">{new Date(log.created_at || log.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-400">-₦{parseFloat(log.amount).toFixed(2)}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">By: {log.collected_by}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-450 font-bold bg-slate-950/30">
                        <th className="py-2.5 px-3">DATE</th>
                        <th className="py-2.5 px-3">RECORD ID</th>
                        <th className="py-2.5 px-3">PURPOSE ACCOUNT</th>
                        <th className="py-2.5 px-3">AMOUNT TRANSACTION</th>
                        <th className="py-2.5 px-3 text-right">AUTHORIZATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {surchargeLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/20 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">
                            {new Date(log.created_at || log.date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 uppercase">
                            {log.id.substring(0, 8)}...
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`font-extrabold px-2 py-0.5 rounded text-[9px] uppercase ${
                              log.purpose === 'HQ Remittance' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/10' : 'bg-yellow-950/30 text-yellow-550 border border-yellow-500/10'
                            }`}>
                              {log.purpose}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-black text-red-400">-₦{parseFloat(log.amount).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500 font-semibold">{log.collected_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-550 bg-slate-950/20 border border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-700 mb-2" />
                <p className="font-bold text-xs">No split transactions recorded in scope</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* HQ Remittance Modal */}
      {hqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs text-slate-100">
            <h2 className="text-xs font-black text-[#F5C800] mb-3.5 uppercase tracking-wide flex items-center gap-1.5">
              <Landmark className="w-4.5 h-4.5" />
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
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
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
            <h2 className="text-xs font-black text-[#F5C800] mb-3.5 uppercase tracking-wide flex items-center gap-1.5">
              <Percent className="w-4.5 h-4.5" />
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
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
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
