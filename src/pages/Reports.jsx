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
      const name = r.service?.name || '';
      const qty = r.quantity || 0;
      const amt = parseFloat(r.amount) || 0;

      const isLostStickerId = /\b(lost|sticker|id)\b/i.test(name);
      const isChangeOwnership = /\b(change|ownership)\b/i.test(name);
      const isTransfer = /\btransfer\b/i.test(name);
      const isRider = /\brider\b/i.test(name);
      const isNew = /\bnew\b/i.test(name);

      const isTricycle = /\b(tricycle|napep|jega)\b/i.test(name);
      const isMotorcycle = /\b(motorcycle|bike)\b/i.test(name);
      const isTaxi = /\b(taxi|cab|car)\b/i.test(name);
      const isKurkura = /\b(kurkura|kura)\b/i.test(name);

      if (isTricycle) {
        if (isLostStickerId) {
          data.lost_tricycle_qty += qty; data.lost_tricycle_amt += amt;
        } else if (isChangeOwnership) {
          data.change_tricycle_qty += qty; data.change_tricycle_amt += amt;
        } else if (isTransfer) {
          data.transfer_tricycle_qty += qty; data.transfer_tricycle_amt += amt;
        } else if (isRider) {
          if (isNew) {
            data.tricycle_rider_new_qty += qty; data.tricycle_rider_new_amt += amt;
          } else {
            data.tricycle_rider_ren_qty += qty; data.tricycle_rider_ren_amt += amt;
          }
        } else { // ownership
          if (isNew) {
            data.tricycle_own_new_qty += qty; data.tricycle_own_new_amt += amt;
          } else {
            data.tricycle_own_ren_qty += qty; data.tricycle_own_ren_amt += amt;
          }
        }
      } else if (isMotorcycle) {
        if (isLostStickerId) {
          data.lost_motorcycle_qty += qty; data.lost_motorcycle_amt += amt;
        } else if (isChangeOwnership) {
          data.change_motorcycle_qty += qty; data.change_motorcycle_amt += amt;
        } else if (isTransfer) {
          data.transfer_motorcycle_qty += qty; data.transfer_motorcycle_amt += amt;
        } else if (isRider) {
          if (isNew) {
            data.motorcycle_rider_new_qty += qty; data.motorcycle_rider_new_amt += amt;
          } else {
            data.motorcycle_rider_ren_qty += qty; data.motorcycle_rider_ren_amt += amt;
          }
        } else { // ownership
          if (isNew) {
            data.motorcycle_own_new_qty += qty; data.motorcycle_own_new_amt += amt;
          } else {
            data.motorcycle_own_ren_qty += qty; data.motorcycle_own_ren_amt += amt;
          }
        }
      } else if (isTaxi) {
        if (isLostStickerId) {
          data.lost_taxi_qty += qty; data.lost_taxi_amt += amt;
        } else if (isChangeOwnership) {
          data.change_taxi_qty += qty; data.change_taxi_amt += amt;
        } else if (isTransfer) {
          data.transfer_taxi_qty += qty; data.transfer_taxi_amt += amt;
        } else {
          if (isNew) {
            data.taxi_new_qty += qty; data.taxi_new_amt += amt;
          } else {
            data.taxi_ren_qty += qty; data.taxi_ren_amt += amt;
          }
        }
      } else if (isKurkura) {
        if (isLostStickerId) {
          data.lost_kurkura_qty += qty; data.lost_kurkura_amt += amt;
        } else if (isChangeOwnership) {
          data.change_kurkura_qty += qty; data.change_kurkura_amt += amt;
        } else if (isTransfer) {
          data.transfer_kurkura_qty += qty; data.transfer_kurkura_amt += amt;
        } else {
          if (isNew) {
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
    <div className="space-y-5 px-1 sm:px-4 pb-8">
      
      {/* Top Gold & Emerald Stripe Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500 rounded-full" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">Audit & Reports</h1>
          <p className="text-[10px] sm:text-sm text-slate-450 mt-1 leading-relaxed">
            Compile real-time operational metrics and visualize category distributions.
          </p>
        </div>
        
        <button
          onClick={loadData}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-[#F5C800]/40 font-extrabold text-[10px] sm:text-xs transition-all duration-300 shadow-md hover:shadow-[#F5C800]/5 cursor-pointer select-none active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F5C800] animate-spin-slow" />
          REFRESH AUDIT DATA
        </button>
      </div>

      {/* Period Filter Selector Tabs - highly compact & premium */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#F5C800]/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F5C800]" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Audit Scope Range Selection</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'daily', label: 'TODAY SUMMARY' },
            { id: '10days', label: '10 DAYS SCOPE' },
            { id: 'monthly', label: 'THIS MONTH' },
            { id: 'custom', label: 'CUSTOM RANGE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`py-2 px-3.5 rounded-xl text-[10px] font-extrabold uppercase transition-all duration-300 cursor-pointer select-none active:scale-95 border ${
                filterType === tab.id
                  ? 'bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] border-[#F5C800] shadow-lg shadow-[#F5C800]/10 font-black'
                  : 'bg-slate-950/60 text-slate-400 border-slate-850 hover:bg-slate-850 hover:text-slate-100 hover:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom date range controls */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-850 max-w-lg animate-fade-in">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-850 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-350 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-850 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-350 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Premium Sliding Capsule Segmented Tabs Toggle */}
      <div className="flex justify-center sm:justify-start pt-1.5">
        <div className="relative flex p-1 bg-slate-950/80 border border-slate-850 rounded-2xl max-w-md w-full shadow-inner backdrop-blur-md">
          {/* Background Slider Card */}
          <div 
            className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] transition-all duration-300 shadow-md shadow-[#F5C800]/10 pointer-events-none"
            style={{
              left: activeTab === 'general' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
            }}
          />
          
          <button
            onClick={() => setActiveTab('general')}
            className={`relative z-10 w-1/2 py-2.5 rounded-xl font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-colors duration-300 text-center select-none cursor-pointer ${
              activeTab === 'general' ? 'text-[#070a13] font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            General Audit Summary
          </button>
          
          <button
            onClick={() => setActiveTab('payout')}
            className={`relative z-10 w-1/2 py-2.5 rounded-xl font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-colors duration-300 text-center select-none cursor-pointer ${
              activeTab === 'payout' ? 'text-[#070a13] font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Official Payout Sheet 📋
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'general' ? (
        <div className="space-y-5">
          
          {/* Summary Audit Metric Grid - Highly visual, structured 2x2 layout on mobile, 1x4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            
            {/* 1. Units Registered */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Units Registered</span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                  <Activity className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
              <h3 className="text-sm sm:text-2xl font-black mt-2 text-slate-100 tracking-tight">
                {totalCount} <span className="text-[10px] text-slate-400 font-medium tracking-normal">units</span>
              </h3>
            </div>

            {/* 2. Registry Value */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 hover:border-[#F5C800]/50 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F5C800]" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Registry Value</span>
                <div className="p-1.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 group-hover:scale-110 transition duration-300">
                  <Award className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
              <h3 className="text-sm sm:text-2xl font-black mt-2 text-emerald-400 tracking-tight">
                ₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>

            {/* 3. Ledger Expenses */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 hover:border-red-500/50 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-550" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Ledger Expenses</span>
                <div className="p-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-110 transition duration-300">
                  <TrendingDown className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
              <h3 className="text-sm sm:text-2xl font-black mt-2 text-red-500 tracking-tight">
                ₦{ledgerExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>

            {/* 4. Ledger Net Cash */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-300 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Ledger Net Cash</span>
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </div>
              </div>
              <h3 className={`text-sm sm:text-2xl font-black mt-2 tracking-tight ${ledgerNet >= 0 ? 'text-emerald-400' : 'text-red-550'}`}>
                ₦{ledgerNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>

          </div>

          {/* Grouped counts and detailed logs section */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Dynamic visual progress bars (Left column) */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Category summaries</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Registration distributions across services.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(serviceSummary).map(([name, count]) => {
                  const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={name} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-slate-400 font-bold">{name}</span>
                        <span className="font-extrabold text-slate-200 bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800/80">
                          {count} units ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      
                      {/* Gradient Progress Indicator */}
                      <div className="w-full h-2 bg-slate-950/60 rounded-full border border-slate-850 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#F5C800] via-[#10b981] to-[#10b981] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(serviceSummary).length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs">No categories processed in scope.</div>
                )}

                <div className="flex justify-between py-3 font-bold text-emerald-400 border-t border-slate-800/80 mt-4 text-xs sm:text-sm">
                  <span>TOTAL SCOPE VOLUME:</span>
                  <span className="font-black text-slate-100 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-xl">{totalCount} units</span>
                </div>
              </div>
            </div>

            {/* Itemized tables list logs (Right column) */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 xl:col-span-2 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">
                    Itemized logs ({filteredRecords.length})
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-550 mt-0.5">Entries logged during this auditing scope.</p>
                </div>
                
                <button
                  onClick={handleExportPDF}
                  disabled={filteredRecords.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 select-none cursor-pointer shadow-md shadow-[#F5C800]/5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  GENERATE PDF AUDIT REPORT
                </button>
              </div>

              {/* Range Logs Section */}
              {filteredRecords.length > 0 ? (
                <div className="space-y-2">
                  
                  {/* MOBILE COMPACT CARD VIEW (sm:hidden) */}
                  <div className="block sm:hidden space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredRecords.map(rec => (
                      <div key={rec.id} className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-slate-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                          <span className="bg-emerald-500/10 text-emerald-400 font-black px-2 py-0.5 rounded border border-emerald-500/20 text-[8px] uppercase">
                            {rec.service?.name || 'Category'}
                          </span>
                        </div>
                        <div className="flex justify-between items-end pt-1">
                          <div>
                            <div className="font-black text-slate-100">{rec.customer_name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 font-bold">Officer: {rec.officer_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-400">₦{parseFloat(rec.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-[8px] text-slate-400 mt-0.5 font-extrabold">Qty: x{rec.quantity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE VIEW (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-black bg-slate-950/30">
                          <th className="py-3 px-3">DATE</th>
                          <th className="py-3 px-3">CUSTOMER NAME</th>
                          <th className="py-3 px-3">SERVICE CATEGORY</th>
                          <th className="py-3 px-3 text-center">QTY</th>
                          <th className="py-3 px-3">CHARGE</th>
                          <th className="py-3 px-3 text-right">OFFICER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredRecords.map(rec => (
                          <tr key={rec.id} className="hover:bg-slate-900/30 transition duration-150">
                            <td className="py-3 px-3 font-semibold text-slate-400">
                              {new Date(rec.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-200">
                              {rec.customer_name}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] uppercase">
                                {rec.service?.name || 'Category'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-black text-center text-slate-300">{rec.quantity}</td>
                            <td className="py-3 px-3 font-black text-emerald-400">
                              ₦{parseFloat(rec.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-450 font-bold">{rec.officer_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                <div className="text-center py-14 text-slate-400 bg-slate-950/10 border border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="font-bold text-xs text-slate-350">No registry entries found in this scope</p>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Modernized ICT Daily Payout Sheet View */
        <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-2xl space-y-6 max-w-4xl mx-auto relative overflow-hidden">
          
          {/* Top Gold/Emerald Stripe Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500" />
          
          {/* Sheet Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h3 className="text-sm font-black tracking-tight text-[#F5C800] uppercase gold-text-glow">
                Official Payout Sheet Preview
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                This high-fidelity preview mirrors your official YOROTA A4 paper layout, modernized with interlocking road safety accents.
              </p>
            </div>
            
            <button
              onClick={handleExportIctPayout}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] text-slate-950 font-black text-xs transition duration-300 shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] select-none cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              PRINT OFFICIAL A4 PDF SHEET
            </button>
          </div>

          {/* Interactive Document Header Configuration Panel */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Configure Form Print Parameters</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Unit/Zonal Command Name</label>
                <input
                  type="text"
                  value={commandName}
                  onChange={(e) => setCommandName(e.target.value)}
                  placeholder="e.g. Damaturu Zonal Command"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Scope Period Date</label>
                <div className="w-full bg-slate-950/60 border border-slate-850/80 rounded-xl py-2 px-3 text-xs text-slate-450 font-bold border-dashed select-none">
                  {dateRangeText}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mobile Swipe Horizontal warning banner - visible on mobile only */}
          <div className="sm:hidden flex items-center gap-2.5 p-3.5 bg-gradient-to-r from-emerald-950/40 via-[#CA8A04]/10 to-emerald-950/40 border border-emerald-800/40 rounded-xl animate-pulse">
            <span className="text-sm select-none">👉</span>
            <div className="text-[9px] font-black text-slate-200 tracking-wider uppercase leading-none">
              SWIPE HORIZONTALLY TO BROWSE FULL A4 PRINT PREVIEW SHEET
            </div>
          </div>

          {/* Modernized Paper Form Core Sheet replica in White A4 format - Wrapped for horizontal scrolling on mobile */}
          <div className="overflow-x-auto scrollbar-thin pb-4">
            <div className="min-w-[820px] mx-auto bg-white text-slate-850 border border-slate-300 p-6 sm:p-12 relative shadow-2xl relative overflow-hidden text-left border-t-8 border-t-emerald-600 rounded-xl font-sans">
              
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
                    <h1 className="text-xs sm:text-xs font-black text-slate-900 uppercase tracking-[0.15em] bg-slate-50 border border-slate-200 py-1.5 px-4 rounded-lg shadow-xs select-none">
                      ICT DAILY PAYOUT SHEET
                    </h1>
                  </div>
                </div>

                {/* Sheet Metadata Row */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 text-[10px] font-black uppercase text-slate-650 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
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
                    <tbody className="divide-y divide-slate-200 text-slate-750 font-medium bg-white">
                      
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
                              ₦{(pData.tricycle_own_new_amt + pData.tricycle_own_ren_amt + pData.tricycle_rider_new_amt + pData.tricycle_rider_ren_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.motorcycle_own_new_amt + pData.motorcycle_own_ren_amt + pData.motorcycle_rider_new_amt + pData.motorcycle_rider_ren_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.taxi_new_amt + pData.taxi_ren_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.kurkura_new_amt + pData.kurkura_ren_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.lost_tricycle_amt + pData.lost_motorcycle_amt + pData.lost_taxi_amt + pData.lost_kurkura_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.change_tricycle_amt + pData.change_motorcycle_amt + pData.change_taxi_amt + pData.change_kurkura_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              ₦{(pData.transfer_tricycle_amt + pData.transfer_motorcycle_amt + pData.transfer_taxi_amt + pData.transfer_kurkura_amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                ₦{pData.others_amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-3 py-1 rounded border border-slate-750">TOTAL UNITS: {totalPayoutQty} UNITS</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 bg-slate-800/40 font-black text-sm sm:text-base">
                          ₦{totalPayoutAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        </div>
      )}

    </div>
  );
}
