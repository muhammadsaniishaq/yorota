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
  AlertCircle,
  Shield,
  Activity,
  Award
} from 'lucide-react';
import { db } from '../services/db';
import { pdfGenerator } from '../services/pdfGenerator';
import YorotaLogo from '../components/YorotaLogo';

export default function Reports({ currentUser, setGlobalNotification }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter range selection
  const [filterType, setFilterType] = useState('monthly'); // 'daily', '10days', 'monthly', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Custom visual tab and command routing states
  const [activeTab, setActiveTab] = useState('general'); 
  const [commandName, setCommandName] = useState('Damaturu Zonal Command');

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

  const handleExportPDF = async () => {
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

      await pdfGenerator.generateReport(typeText, dateRangeText, filteredRecords, summaryPayload, filteredTransactions);
      setGlobalNotification({ message: `Audit Report exported successfully`, type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to compile PDF report', type: 'error' });
    }
  };



  const handleExportIctPayout = async () => {
    try {
      await pdfGenerator.generateIctPayoutReport(dateRangeText, filteredRecords, currentUser?.name, commandName);
      setGlobalNotification({ message: 'ICT Daily Payout Sheet printed successfully', type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to compile official payout sheet', type: 'error' });
    }
  };

  // Aggregate record categories for the payout form grid dynamically
  const getPayoutData = () => {
    const data = {
      // 1. Tricycle
      tricycle_own_new_qty: 0, tricycle_own_new_amt: 0,
      tricycle_own_ren_qty: 0, tricycle_own_ren_amt: 0,
      tricycle_rider_new_qty: 0, tricycle_rider_new_amt: 0,
      tricycle_rider_ren_qty: 0, tricycle_rider_ren_amt: 0,
      // 2. Motorcycle
      motorcycle_own_new_qty: 0, motorcycle_own_new_amt: 0,
      motorcycle_own_ren_qty: 0, motorcycle_own_ren_amt: 0,
      motorcycle_rider_new_qty: 0, motorcycle_rider_new_amt: 0,
      motorcycle_rider_ren_qty: 0, motorcycle_rider_ren_amt: 0,
      // 3. Taxi
      taxi_new_qty: 0, taxi_new_amt: 0,
      taxi_ren_qty: 0, taxi_ren_amt: 0,
      // 4. Kurkura
      kurkura_new_qty: 0, kurkura_new_amt: 0,
      kurkura_ren_qty: 0, kurkura_ren_amt: 0,
      // 5. Lost ID
      lost_tricycle_qty: 0, lost_tricycle_amt: 0,
      lost_motorcycle_qty: 0, lost_motorcycle_amt: 0,
      lost_taxi_qty: 0, lost_taxi_amt: 0,
      lost_kurkura_qty: 0, lost_kurkura_amt: 0,
      // 6. Change of Ownership
      change_tricycle_qty: 0, change_tricycle_amt: 0,
      change_motorcycle_qty: 0, change_motorcycle_amt: 0,
      change_taxi_qty: 0, change_taxi_amt: 0,
      change_kurkura_qty: 0, change_kurkura_amt: 0,
      // 7. Transfer
      transfer_tricycle_qty: 0, transfer_tricycle_amt: 0,
      transfer_motorcycle_qty: 0, transfer_motorcycle_amt: 0,
      transfer_taxi_qty: 0, transfer_taxi_amt: 0,
      transfer_kurkura_qty: 0, transfer_kurkura_amt: 0,
      // Others
      others_qty: 0, others_amt: 0,
    };

    filteredRecords.forEach(r => {
      const name = (r.service?.name || '').toLowerCase();
      const qty = r.quantity || 0;
      const amt = parseFloat(r.amount) || 0;

      if (name.includes('tricycle') || name.includes('napep') || name.includes('jega')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_tricycle_qty += qty; data.lost_tricycle_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_tricycle_qty += qty; data.change_tricycle_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_tricycle_qty += qty; data.transfer_tricycle_amt += amt;
        } else if (name.includes('rider')) {
          if (name.includes('new')) {
            data.tricycle_rider_new_qty += qty; data.tricycle_rider_new_amt += amt;
          } else {
            data.tricycle_rider_ren_qty += qty; data.tricycle_rider_ren_amt += amt;
          }
        } else { // ownership
          if (name.includes('new')) {
            data.tricycle_own_new_qty += qty; data.tricycle_own_new_amt += amt;
          } else {
            data.tricycle_own_ren_qty += qty; data.tricycle_own_ren_amt += amt;
          }
        }
      } else if (name.includes('motorcycle') || name.includes('bike')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_motorcycle_qty += qty; data.lost_motorcycle_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_motorcycle_qty += qty; data.change_motorcycle_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_motorcycle_qty += qty; data.transfer_motorcycle_amt += amt;
        } else if (name.includes('rider')) {
          if (name.includes('new')) {
            data.motorcycle_rider_new_qty += qty; data.motorcycle_rider_new_amt += amt;
          } else {
            data.motorcycle_rider_ren_qty += qty; data.motorcycle_rider_ren_amt += amt;
          }
        } else { // ownership
          if (name.includes('new')) {
            data.motorcycle_own_new_qty += qty; data.motorcycle_own_new_amt += amt;
          } else {
            data.motorcycle_own_ren_qty += qty; data.motorcycle_own_ren_amt += amt;
          }
        }
      } else if (name.includes('taxi') || name.includes('car')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_taxi_qty += qty; data.lost_taxi_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_taxi_qty += qty; data.change_taxi_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_taxi_qty += qty; data.transfer_taxi_amt += amt;
        } else {
          if (name.includes('new')) {
            data.taxi_new_qty += qty; data.taxi_new_amt += amt;
          } else {
            data.taxi_ren_qty += qty; data.taxi_ren_amt += amt;
          }
        }
      } else if (name.includes('kurkura') || name.includes('kura')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_kurkura_qty += qty; data.lost_kurkura_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_kurkura_qty += qty; data.change_kurkura_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_kurkura_qty += qty; data.transfer_kurkura_amt += amt;
        } else {
          if (name.includes('new')) {
            data.kurkura_new_qty += qty; data.kurkura_new_amt += amt;
          } else {
            data.kurkura_ren_qty += qty; data.kurkura_ren_amt += amt;
          }
        }
      } else {
        data.others_qty += qty; data.others_amt += amt;
      }
    });

    return data;
  };

  const pData = getPayoutData();

  const totalPayoutQty = Object.keys(pData)
    .filter(k => k.endsWith('_qty'))
    .reduce((sum, k) => sum + pData[k], 0);

  const totalPayoutAmt = Object.keys(pData)
    .filter(k => k.endsWith('_amt'))
    .reduce((sum, k) => sum + pData[k], 0);

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

      {/* Premium Glassmorphic Segmented Tabs Toggle */}
      <div className="flex border-b border-slate-800/80 gap-1.5 pb-1 mt-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 px-4 font-extrabold text-[10px] sm:text-xs tracking-wider uppercase border-b-2 transition-all duration-300 cursor-pointer select-none ${
            activeTab === 'general'
              ? 'border-[#F5C800] text-slate-100 gold-text-glow'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          General Audit Summary
        </button>
        <button
          onClick={() => setActiveTab('payout')}
          className={`pb-2.5 px-4 font-extrabold text-[10px] sm:text-xs tracking-wider uppercase border-b-2 transition-all duration-300 cursor-pointer select-none ${
            activeTab === 'payout'
              ? 'border-[#F5C800] text-slate-100 gold-text-glow'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Official ICT Payout Sheet 📋
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'general' ? (
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
      ) : (
        /* Modernized ICT Daily Payout Sheet View */
        <div className="premium-glass border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto relative overflow-hidden">
          
          {/* Top Gold/Emerald Stripe Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500" />
          
          {/* Sheet Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-[#F5C800] uppercase gold-text-glow">
                Official Payout Sheet Preview
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 leading-relaxed">
                This preview mirrors your official YOROTA paper form, modernized with road safety accents and populated by live database metrics.
              </p>
            </div>
            
            <button
              onClick={handleExportIctPayout}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              PRINT MODERNIZED OFFICIAL PDF
            </button>
          </div>

          {/* Interactive Document Header Box */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-3 sm:p-4 space-y-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Configure Print Parameters</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Unit/Zonal Command Name</label>
                <input
                  type="text"
                  value={commandName}
                  onChange={(e) => setCommandName(e.target.value)}
                  placeholder="e.g. Damaturu Zonal Command"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Scope Period Date</label>
                <div className="w-full bg-slate-950/60 border border-slate-850/80 rounded-xl py-2 px-3 text-xs text-slate-450 font-bold border-dashed select-none">
                  {dateRangeText}
                </div>
              </div>
            </div>
          </div>

          {/* Modernized Paper Form Core She          {/* Modernized Paper Form Core Sheet replica in White A4 format */}
          <div className="bg-white text-slate-800 border border-slate-300 p-6 sm:p-12 relative shadow-[0_15px_50px_rgba(0,0,0,0.5)] max-w-[820px] w-full mx-auto relative overflow-hidden text-left border-t-8 border-t-emerald-600 rounded-lg font-sans">
            
            {/* Official A4 Page Double Borders */}
            <div className="absolute inset-4 border-2 border-double border-emerald-600/20 pointer-events-none rounded-sm" />

            {/* Luxury Interlocking Corner Brackets - Redesigned Premium Decorations */}
            {/* Top-Left */}
            <div className="absolute top-6 left-6 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-600 pointer-events-none" />
            <div className="absolute top-8 left-8 w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[#F5C800] pointer-events-none" />
            
            {/* Top-Right */}
            <div className="absolute top-6 right-6 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-600 pointer-events-none" />
            <div className="absolute top-8 right-8 w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-[#F5C800] pointer-events-none" />
            
            {/* Bottom-Left */}
            <div className="absolute bottom-6 left-6 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-600 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-[#F5C800] pointer-events-none" />
            
            {/* Bottom-Right */}
            <div className="absolute bottom-6 right-6 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-600 pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[#F5C800] pointer-events-none" />

            {/* Visual Vector Road Safety Logo Background watermark */}
            <div className="absolute inset-0 opacity-[0.035] flex items-center justify-center pointer-events-none select-none">
              <img src="/logo.png" alt="YOROTA Watermark" className="w-96 h-96 object-contain filter grayscale" />
            </div>

            {/* Form Sheet Content */}
            <div className="space-y-6 relative z-10">
              
              {/* Official Headings */}
              <div className="text-center space-y-2 border-b border-slate-200 pb-5">
                <div className="flex justify-center mb-3">
                  <div className="w-18 h-18 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-md p-1">
                    <YorotaLogo className="w-14 h-14" showText={false} />
                  </div>
                </div>
                
                {/* Traffic Double Center divider lines */}
                <div className="flex justify-center gap-0.5 mb-2">
                  <div className="w-20 h-[1.5px] bg-[#CA8A04]" />
                  <div className="w-20 h-[1.5px] bg-[#CA8A04]" />
                </div>

                <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                  Yobe State Road Traffic Management Agency (YOROTA)
                </h2>
                
                <div className="pt-2 flex justify-center">
                  <h1 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-[0.15em] bg-slate-50 border border-slate-200 py-1.5 px-4 rounded-lg shadow-xs select-none">
                    ICT DAILY PAYOUT SHEET
                  </h1>
                </div>
              </div>

              {/* Sheet Metadata Row */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 text-[10px] font-black uppercase text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-extrabold">Command:</span>
                  <span className="text-slate-800 tracking-wide">{commandName || '................................'}</span>
                </span>
                <span className="flex items-center gap-1.5 sm:text-right">
                  <span className="text-slate-400 font-extrabold">Date Scope:</span>
                  <span className="text-amber-700 tracking-wide">{dateRangeText}</span>
                </span>
              </div>

              {/* Modernized Grid Table replica */}
              <div className="overflow-x-auto border border-slate-250 rounded-xl shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                  <thead>
                    <tr className="bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 text-center w-12 border border-emerald-700">S/N</th>
                      <th className="py-3 px-4 border border-emerald-700">DETAILED FEE CATEGORY BREAKDOWNS</th>
                      <th className="py-3 px-4 text-right w-32 sm:w-44 border border-emerald-700">TOTAL AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium bg-white">
                    
                    {/* 1. Tricycle */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">1.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">TRICYCLE (NAPEP/JEGA)</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRATION GRID</span>
                        </div>
                        <div className="grid grid-cols-2 text-[9px] sm:text-[10px] font-bold text-center">
                          <div className="border-r border-slate-200 flex flex-col">
                            <div className="bg-slate-50/50 py-1.5 border-b border-slate-200 text-slate-600 font-extrabold tracking-wider">OWNERSHIP</div>
                            <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-semibold divide-x divide-slate-200 flex-1">
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦10k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.tricycle_own_new_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.tricycle_own_new_qty > 0 ? `₦${pData.tricycle_own_new_amt.toLocaleString()}` : '-'}</div>
                              </div>
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.tricycle_own_ren_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.tricycle_own_ren_qty > 0 ? `₦${pData.tricycle_own_ren_amt.toLocaleString()}` : '-'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="bg-slate-50/50 py-1.5 border-b border-slate-200 text-slate-600 font-extrabold tracking-wider">RIDER</div>
                            <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-semibold divide-x divide-slate-200 flex-1">
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦1.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.tricycle_rider_new_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.tricycle_rider_new_qty > 0 ? `₦${pData.tricycle_rider_new_amt.toLocaleString()}` : '-'}</div>
                              </div>
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦1.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.tricycle_rider_ren_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.tricycle_rider_ren_qty > 0 ? `₦${pData.tricycle_rider_ren_amt.toLocaleString()}` : '-'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Tricycle Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.tricycle_own_new_amt + pData.tricycle_own_ren_amt + pData.tricycle_rider_new_amt + pData.tricycle_rider_ren_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.tricycle_own_new_qty || 0) + (pData.tricycle_own_ren_qty || 0) + (pData.tricycle_rider_new_qty || 0) + (pData.tricycle_rider_ren_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 2. Motorcycle */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">2.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">MOTORCYCLE</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRATION GRID</span>
                        </div>
                        <div className="grid grid-cols-2 text-[9px] sm:text-[10px] font-bold text-center">
                          <div className="border-r border-slate-200 flex flex-col">
                            <div className="bg-slate-50/50 py-1.5 border-b border-slate-200 text-slate-600 font-extrabold tracking-wider">OWNERSHIP</div>
                            <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-semibold divide-x divide-slate-200 flex-1">
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦2.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.motorcycle_own_new_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.motorcycle_own_new_qty > 0 ? `₦${pData.motorcycle_own_new_amt.toLocaleString()}` : '-'}</div>
                              </div>
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦2.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.motorcycle_own_ren_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.motorcycle_own_ren_qty > 0 ? `₦${pData.motorcycle_own_ren_amt.toLocaleString()}` : '-'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="bg-slate-50/50 py-1.5 border-b border-slate-200 text-slate-600 font-extrabold tracking-wider">RIDER</div>
                            <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-semibold divide-x divide-slate-200 flex-1">
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦1.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.motorcycle_rider_new_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.motorcycle_rider_new_qty > 0 ? `₦${pData.motorcycle_rider_new_amt.toLocaleString()}` : '-'}</div>
                              </div>
                              <div className="flex flex-col justify-between h-full bg-slate-50/10">
                                <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦1.5k)</div>
                                <div className="py-2.5 font-black text-slate-800 text-xs">{pData.motorcycle_rider_ren_qty || '-'}</div>
                                <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.motorcycle_rider_ren_qty > 0 ? `₦${pData.motorcycle_rider_ren_amt.toLocaleString()}` : '-'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Motorcycle Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.motorcycle_own_new_amt + pData.motorcycle_own_ren_amt + pData.motorcycle_rider_new_amt + pData.motorcycle_rider_ren_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.motorcycle_own_new_qty || 0) + (pData.motorcycle_own_ren_qty || 0) + (pData.motorcycle_rider_new_qty || 0) + (pData.motorcycle_rider_ren_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 3. Taxi */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">3.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">TAXI</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRATION GRID</span>
                        </div>
                        <div className="grid grid-cols-2 text-[9px] sm:text-[10px] font-bold text-center">
                          <div className="flex flex-col justify-between h-full border-r border-slate-200 bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦10,000)</div>
                            <div className="py-2.5 font-black text-slate-800 text-xs">{pData.taxi_new_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.taxi_new_qty > 0 ? `₦${pData.taxi_new_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦5,000)</div>
                            <div className="py-2.5 font-black text-slate-800 text-xs">{pData.taxi_ren_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.taxi_ren_qty > 0 ? `₦${pData.taxi_ren_amt.toLocaleString()}` : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Taxi Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.taxi_new_amt + pData.taxi_ren_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.taxi_new_qty || 0) + (pData.taxi_ren_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 4. Kurkura */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">4.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">KURKURA</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRATION GRID</span>
                        </div>
                        <div className="grid grid-cols-2 text-[9px] sm:text-[10px] font-bold text-center">
                          <div className="flex flex-col justify-between h-full border-r border-slate-200 bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">New (₦10,000)</div>
                            <div className="py-2.5 font-black text-slate-800 text-xs">{pData.kurkura_new_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.kurkura_new_qty > 0 ? `₦${pData.kurkura_new_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Renewal (₦5,000)</div>
                            <div className="py-2.5 font-black text-slate-800 text-xs">{pData.kurkura_ren_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.kurkura_ren_qty > 0 ? `₦${pData.kurkura_ren_amt.toLocaleString()}` : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Kurkura Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.kurkura_new_amt + pData.kurkura_ren_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.kurkura_new_qty || 0) + (pData.kurkura_ren_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 5. Lost of ID */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">5.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">LOST OF ID / STICKER</span>
                          <span className="text-[8px] bg-red-100 text-red-800 py-0.5 px-2 rounded-full font-black border border-red-200/50">REPLACEMENT FEES</span>
                        </div>
                        <div className="grid grid-cols-4 text-[8px] sm:text-[9px] font-bold text-center divide-x divide-slate-200">
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Tricycle (₦2.5k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.lost_tricycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.lost_tricycle_qty > 0 ? `₦${pData.lost_tricycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Motor (₦2.5k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.lost_motorcycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.lost_motorcycle_qty > 0 ? `₦${pData.lost_motorcycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Taxi (₦2.5k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.lost_taxi_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.lost_taxi_qty > 0 ? `₦${pData.lost_taxi_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Kurkura (₦2.5k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.lost_kurkura_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.lost_kurkura_qty > 0 ? `₦${pData.lost_kurkura_amt.toLocaleString()}` : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Lost ID Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.lost_tricycle_amt + pData.lost_motorcycle_amt + pData.lost_taxi_amt + pData.lost_kurkura_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.lost_tricycle_qty || 0) + (pData.lost_motorcycle_qty || 0) + (pData.lost_taxi_qty || 0) + (pData.lost_kurkura_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 6. Change of Ownership */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">6.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">CHANGE OF OWNERSHIP</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRY AUDIT</span>
                        </div>
                        <div className="grid grid-cols-4 text-[8px] sm:text-[9px] font-bold text-center divide-x divide-slate-200">
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Tricycle (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.change_tricycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.change_tricycle_qty > 0 ? `₦${pData.change_tricycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Motor (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.change_motorcycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.change_motorcycle_qty > 0 ? `₦${pData.change_motorcycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Taxi (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.change_taxi_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.change_taxi_qty > 0 ? `₦${pData.change_taxi_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Kurkura (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.change_kurkura_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.change_kurkura_qty > 0 ? `₦${pData.change_kurkura_amt.toLocaleString()}` : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Change Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.change_tricycle_amt + pData.change_motorcycle_amt + pData.change_taxi_amt + pData.change_kurkura_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.change_tricycle_qty || 0) + (pData.change_motorcycle_qty || 0) + (pData.change_taxi_qty || 0) + (pData.change_kurkura_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 7. Transfer */}
                    <tr>
                      <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">7.</td>
                      <td className="p-0 border border-slate-200">
                        <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                          <span className="tracking-wide uppercase">TRANSFER FEES</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full font-black border border-emerald-200/50">REGISTRY AUDIT</span>
                        </div>
                        <div className="grid grid-cols-4 text-[8px] sm:text-[9px] font-bold text-center divide-x divide-slate-200">
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Tricycle (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.transfer_tricycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.transfer_tricycle_qty > 0 ? `₦${pData.transfer_tricycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Motor (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.transfer_motorcycle_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.transfer_motorcycle_qty > 0 ? `₦${pData.transfer_motorcycle_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Taxi (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.transfer_taxi_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.transfer_taxi_qty > 0 ? `₦${pData.transfer_taxi_amt.toLocaleString()}` : '-'}</div>
                          </div>
                          <div className="flex flex-col justify-between h-full bg-slate-50/10">
                            <div className="py-1 text-slate-400 border-b border-slate-200 bg-slate-100/30 font-bold">Kurkura (₦2.0k)</div>
                            <div className="py-2 font-black text-slate-800 text-xs">{pData.transfer_kurkura_qty || '-'}</div>
                            <div className="py-1 text-emerald-700 border-t border-slate-200 bg-emerald-50/30 font-black">{pData.transfer_kurkura_qty > 0 ? `₦${pData.transfer_kurkura_amt.toLocaleString()}` : '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                        <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                          <span className="text-[8px] text-slate-450 block font-bold uppercase tracking-wider">Transfer Total</span>
                          <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                            ₦{(pData.transfer_tricycle_amt + pData.transfer_motorcycle_amt + pData.transfer_taxi_amt + pData.transfer_kurkura_amt).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                            {((pData.transfer_tricycle_qty || 0) + (pData.transfer_motorcycle_qty || 0) + (pData.transfer_taxi_qty || 0) + (pData.transfer_kurkura_qty || 0))} Units
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* 8. Other Classifications */}
                    {pData.others_qty > 0 && (
                      <tr>
                        <td className="py-4 px-3 text-center font-black border border-slate-200 text-slate-400">8.</td>
                        <td className="p-0 border border-slate-200">
                          <div className="bg-slate-50 font-black text-slate-850 py-2.5 px-4 border-b border-slate-200 text-[10px] sm:text-xs flex justify-between items-center select-none">
                            <span className="tracking-wide uppercase">OTHER UNCLASSIFIED REGISTRATIONS</span>
                            <span className="text-[8px] bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full font-black border border-yellow-200/50">MISCELLANEOUS</span>
                          </div>
                          <div className="p-4 text-xs font-bold text-slate-500 bg-slate-50/10">
                            Unclassified customized categories processed under different rates.
                          </div>
                        </td>
                        <td className="p-0 border border-slate-200 text-right bg-slate-50/30 w-32 sm:w-44">
                          <div className="h-full flex flex-col justify-center px-4 py-4 select-none">
                            <span className="text-[8px] text-slate-500 block font-bold uppercase tracking-wider">Others Total</span>
                            <span className="font-black text-emerald-700 text-sm sm:text-base tracking-wide mt-0.5">
                              ₦{pData.others_amt.toFixed(2)}
                            </span>
                            <span className="text-[8px] text-slate-500 font-black block mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs text-center uppercase">
                              {pData.others_qty} Units
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Grand Totals */}
                    <tr className="bg-slate-900 text-white font-black text-xs sm:text-sm border border-slate-800">
                      <td className="py-3.5 px-3 text-center font-black border-r border-slate-800 text-[#F5C800]">★</td>
                      <td className="py-3.5 px-4 uppercase text-[#F5C800] tracking-wider border-r border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 select-none">
                        <span>GRAND TOTAL SUMS</span>
                        <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-3 py-1 rounded border border-slate-700">TOTAL UNITS: {totalPayoutQty} UNITS</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 bg-slate-800/40 font-black text-sm sm:text-base">
                        ₦{totalPayoutAmt.toFixed(2)}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Signature Blocks preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-slate-600">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Prepared By</span>
                  <div className="text-xs font-black text-slate-700">ICT PAYOUT DESK OFFICER</div>
                  <div className="text-[10px] text-slate-600 mt-1 font-semibold">Name: {currentUser?.name || 'Authorized Officer'}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Status: Signature & Timestamp appended dynamically on PDF</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Approval Authority</span>
                  <div className="text-xs font-black text-slate-700">UNIT/ZONAL COMMAND</div>
                  <div className="text-[10px] text-slate-500 mt-1">Name: ..............................................................</div>
                  <div className="text-[10px] text-slate-500 mt-1">Sign/Date: ........................................................</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
