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
  Coins,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { db } from '../services/db';
import YorotaLogo from '../components/YorotaLogo';

// High-fidelity vector compliance speedometer dial with 270-degree math arc and pointer needle
const SurchargeCircularGauge = ({ value, maxValue, label = "Remitted", colorClass = "text-[#10b981]", gradientId = "activeGrad" }) => {
  const percent = maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0;

  // Speedometer spans 270 degrees, starting at -225deg (bottom-left) and ending at +45deg (bottom-right)
  const startAngle = -225;
  const angleSpan = 270;
  const currentAngle = startAngle + (percent / 100) * angleSpan;
  const currentAngleRad = (currentAngle * Math.PI) / 180;

  const radius = 28;
  const strokeWidth = 4.2;
  const cx = 40;
  const cy = 40;

  // Cartesian coordinates helper
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const trackStart = polarToCartesian(cx, cy, radius, startAngle);
  const trackEnd = polarToCartesian(cx, cy, radius, startAngle + angleSpan);
  const activeEnd = polarToCartesian(cx, cy, radius, currentAngle);

  // 270-deg static background track path
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;

  // Dynamic active path (large arc flag set to 1 if span > 180 degrees)
  const largeArcFlag = (percent / 100) * angleSpan > 180 ? 1 : 0;
  const activePath = percent > 0
    ? `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${activeEnd.x} ${activeEnd.y}`
    : "";

  // Pointer needle endpoint
  const needleLength = 22;
  const needleX = cx + needleLength * Math.cos(currentAngleRad);
  const needleY = cy + needleLength * Math.sin(currentAngleRad);

  // Generate glowing tech ticks along the speedometer arc
  const ticks = [0, 20, 40, 60, 80, 100].map(p => {
    const a = startAngle + (p / 100) * angleSpan;
    const rad = (a * Math.PI) / 180;
    const innerR = radius - 3.5;
    const outerR = radius;
    const x1 = cx + innerR * Math.cos(rad);
    const y1 = cy + innerR * Math.sin(rad);
    const x2 = cx + outerR * Math.cos(rad);
    const y2 = cy + outerR * Math.sin(rad);
    return (
      <line
        key={p}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="0.8"
      />
    );
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-3.5 bg-[#090d16]/95 border border-slate-800/85 rounded-2xl shadow-2xl group transition-all duration-500 hover:border-[#F5C800]/30 hover:shadow-emerald-500/5 min-w-[105px] flex-1">
      <div className="relative w-22 h-22">
        <svg className="w-full h-full" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#F5C800" />
            </linearGradient>
          </defs>

          {/* Speedometer radial ticks */}
          {ticks}

          {/* Outer tech frame ring */}
          <circle
            cx="40"
            cy="40"
            r="38"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="0.5"
            fill="transparent"
          />

          {/* Track background */}
          <path
            d={trackPath}
            fill="transparent"
            stroke="rgba(148, 163, 184, 0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active compliant arc */}
          {percent > 0 && (
            <path
              d={activePath}
              fill="transparent"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Live Needle pointer indicator */}
          <line
            x1="40"
            y1="40"
            x2={needleX}
            y2={needleY}
            stroke="#F5C800"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 2px rgba(245, 200, 0, 0.6))' }}
          />

          {/* Tech pivot center button */}
          <circle cx="40" cy="40" r="3.2" fill="#090d16" stroke="#F5C800" strokeWidth="1.2" />
          <circle cx="40" cy="40" r="1.2" fill="#ffffff" />
        </svg>
        {/* Soft neon backing ring */}
        <div className="absolute inset-2 rounded-full bg-emerald-500/5 blur-[4px] pointer-events-none animate-pulse" />
      </div>
      <div className="mt-2 text-center select-none z-10">
        <span className="text-[12px] font-black text-slate-100 block tracking-tight group-hover:scale-105 transition-transform duration-300 leading-none">
          {percent.toFixed(0)}%
        </span>
        <span className="text-[7px] text-[#F5C800] font-black uppercase tracking-[0.15em] block mt-1 leading-none">
          {label}
        </span>
      </div>
    </div>
  );
};



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
    <div className="space-y-6 px-2 sm:px-6 py-4 max-w-7xl mx-auto relative overflow-hidden grid-bg-overlay rounded-3xl min-h-[calc(100vh-120px)]">
      
      {/* Premium Sliding Hazard Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes hazardSlide {
          0% { background-position: 0 0; }
          100% { background-position: 28px 0; }
        }
        .animated-hazard-stripe {
          background-image: repeating-linear-gradient(45deg, 
            rgba(245, 200, 0, 0.15) 0px, 
            rgba(245, 200, 0, 0.15) 10px, 
            transparent 10px, 
            transparent 20px
          );
          background-size: 28px 28px;
          animation: hazardSlide 1.5s linear infinite;
        }
        .animated-hazard-stripe-emerald {
          background-image: repeating-linear-gradient(45deg, 
            rgba(16, 185, 129, 0.15) 0px, 
            rgba(16, 185, 129, 0.15) 10px, 
            transparent 10px, 
            transparent 20px
          );
          background-size: 28px 28px;
          animation: hazardSlide 1.5s linear infinite;
        }
        .grid-bg-overlay {
          background-image: radial-gradient(rgba(16, 185, 129, 0.04) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .premium-glow-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-glow-card:hover {
          border-color: rgba(245, 200, 0, 0.25) !important;
          box-shadow: 0 10px 30px rgba(245, 200, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        .premium-glow-card-emerald {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-glow-card-emerald:hover {
          border-color: rgba(16, 185, 129, 0.25) !important;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.05), inset 0 1px 0 rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        .premium-glow-card-slate {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-glow-card-slate:hover {
          border-color: rgba(148, 163, 184, 0.25) !important;
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.02), inset 0 1px 0 rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

      {/* Header section with Premium Road Safety Styling */}
      <div className="relative bg-[#070a13]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xl overflow-hidden border-t-4 border-t-emerald-500">
        
        {/* Repeating caution hazard stripe banner background (continuously animated) */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 opacity-80 animated-hazard-stripe" />
        
        <div className="flex items-center gap-4.5 z-10">
          <YorotaLogo className="w-14 h-14 shrink-0" showText={false} />
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-[#F5C800] to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
              Surcharges & Splits Vault
            </h1>

            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Audit the flat ₦500 administrative set-aside surcharge, manage Headquarters (70%) and Local Office (30%) split accounts, and review dynamic logs.
            </p>
          </div>
        </div>
        
        <button
          onClick={loadData}
          className="z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 font-extrabold text-[10px] sm:text-xs transition-all duration-300 cursor-pointer select-none text-slate-200 hover:text-slate-100 active:scale-95 shadow-md shadow-black/30 shrink-0 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F5C800] animate-spin-slow" />
          REFRESH ACCOUNTS
        </button>
      </div>

      {/* Period Filter Selector Card */}
      <div className="bg-[#070a13]/60 border border-slate-850/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 relative overflow-hidden">
        {/* Double yellow center dividing lines (traffic design marker) */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-[#F5C800]" />
        
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-450" />
            Select Audit Scope Range
          </span>
          <span className="text-[8px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-bold border border-slate-900 uppercase">
            Active Filter
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'daily', label: 'TODAY SUMMARY' },
            { id: '10days', label: '10 DAYS SCOPE' },
            { id: 'monthly', label: 'THIS MONTH' },
            { id: 'custom', label: 'CUSTOM RANGE' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all duration-300 cursor-pointer select-none active:scale-95 ${
                filterType === tab.id
                  ? 'bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black shadow-lg shadow-[#F5C800]/15'
                  : 'bg-slate-950/40 border border-slate-850/40 text-slate-400 hover:bg-slate-900/60 hover:text-slate-100 hover:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom date range controls */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-850/40 max-w-xl">
            <div>
              <label className="block text-[8px] font-black text-slate-550 uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Revenue Share Split Gauge Widget - THE BEST MODEL */}
          <div className="premium-glass border border-slate-850 rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden border-t-4 border-t-emerald-500 shadow-inner">
            
            {/* Corner security chevrons */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 flex items-center justify-center pointer-events-none select-none">
              <Shield className="w-12 h-12 text-slate-100" />
            </div>

            {/* Widget Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-850 pb-5">
              <div>
                <h3 className="text-sm font-black tracking-tight text-[#F5C800] uppercase gold-text-glow flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-emerald-450" />
                  Split Proportion Status
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                  A flat ₦500 administrative surcharge is set aside per unit and split: **70% to Headquarters / 30% retained locally**.
                  <span className="text-emerald-400 font-extrabold block mt-1 uppercase tracking-wide">
                    * Strictly Separated: Base registry value revenues are kept completely separate and are not included in this surcharge.
                  </span>
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2 text-xs font-black text-[#F5C800] uppercase shrink-0 self-start lg:self-center border-dashed">
                Fee: ₦500 / unit
              </div>
            </div>

            {/* Split Progress & SVG Speedometer Gauges Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
              
              {/* Left Speedometer Gauges */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                
                <div className="flex items-center gap-3 bg-slate-950/20 border border-slate-850 rounded-2xl p-3 shadow-inner">
                  <SurchargeCircularGauge 
                    value={hqRemitted} 
                    maxValue={setAsideHQ} 
                    label="Remitted" 
                    gradientId="activeGrad" 
                  />
                  <div>
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-wider">HQ Status</h4>
                    <span className="text-[11px] font-black text-slate-200 block mt-0.5">Remitted Share</span>
                    <span className="text-[10px] font-black text-emerald-450 block mt-1">₦{hqRemitted.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-950/20 border border-slate-850 rounded-2xl p-3 shadow-inner">
                  <SurchargeCircularGauge 
                    value={officeBalance} 
                    maxValue={setAsideOffice} 
                    label="Vault" 
                    gradientId="goldGrad" 
                  />
                  <div>
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Office Status</h4>
                    <span className="text-[11px] font-black text-slate-200 block mt-0.5">Retained Share</span>
                    <span className="text-[10px] font-black text-[#F5C800] block mt-1">₦{officeBalance.toLocaleString()}</span>
                  </div>
                </div>

              </div>

              {/* Right Progress track meter */}
              <div className="lg:col-span-7 space-y-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-sm">
                
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 px-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
                    Headquarters Share (70%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CA8A04] shadow-md shadow-[#CA8A04]/50" />
                    Local Office Share (30%)
                  </span>
                </div>

                {/* Progress Bar with glowing boundaries */}
                <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-450 h-full rounded-full transition-all duration-1000 ease-out shadow-md shadow-emerald-500/20" 
                    style={{ width: '70%' }}
                    title="Headquarters Share: 70%"
                  />
                  <div 
                    className="bg-gradient-to-r from-[#CA8A04] to-[#F5C800] h-full rounded-full transition-all duration-1000 ease-out shadow-md shadow-[#CA8A04]/20 ml-0.5" 
                    style={{ width: '30%' }}
                    title="Local Office Share: 30%"
                  />
                </div>

                <p className="text-[9px] sm:text-[10px] text-slate-450 leading-relaxed pt-1.5 border-t border-slate-850/60 uppercase font-bold text-center sm:text-left">
                  Split performance displays the overall allocation of set-aside funds generated within this date range.
                </p>

              </div>
              
            </div>
          </div>

          {/* Three Premium Split Card Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Headquarters Split */}
            <div className="bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl relative border-t-4 border-t-emerald-500 premium-glow-card-emerald group">
              
              {/* Caution hazard chevrons header decoration */}
              <div className="h-1.5 w-full animated-hazard-stripe-emerald opacity-90" />

              
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-[10px] font-black text-slate-355 uppercase tracking-widest">Headquarters Account</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-450 animate-bounce" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40">
                    <span className="text-slate-500 font-bold">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideHQ.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40">
                    <span className="text-slate-500 font-bold text-red-400">Total Remitted:</span>
                    <span className="font-extrabold text-red-400">₦{hqRemitted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2.5 px-3 bg-[#10b981]/5 rounded-xl border border-emerald-500/10 font-black">
                    <span className="text-emerald-450">Outstanding Due:</span>
                    <span className="font-black text-emerald-400 text-sm">₦{hqOutstanding.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-slate-950/40 border-t border-slate-850/40">
                <button
                  onClick={() => { setModalError(''); setRemitAmount(''); setHqModalOpen(true); }}
                  disabled={hqOutstanding <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase transition-all duration-300 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none active:scale-95"
                >
                  Record HQ Remittance
                </button>
              </div>
            </div>

            {/* Column 2: Local Office Split */}
            <div className="bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl relative border-t-4 border-t-[#F5C800] premium-glow-card group">
              
              {/* Caution hazard chevrons header decoration */}
              <div className="h-1.5 w-full animated-hazard-stripe opacity-90" />

              
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-[10px] font-black text-slate-355 uppercase tracking-widest">Local Office Account</span>
                  <ArrowDownRight className="w-4 h-4 text-[#F5C800] animate-bounce" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40">
                    <span className="text-slate-500 font-bold">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideOffice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40">
                    <span className="text-slate-500 font-bold text-red-400">Total Disbursed:</span>
                    <span className="font-extrabold text-red-400">₦{officeDisbursed.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2.5 px-3 bg-[#F5C800]/5 rounded-xl border border-[#F5C800]/10 font-black">
                    <span className="text-[#F5C800]">Retained Balance:</span>
                    <span className="font-black text-[#F5C800] text-sm">₦{officeBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-slate-950/40 border-t border-slate-850/40">
                <button
                  onClick={() => { setModalError(''); setDisburseAmount(''); setOfficeModalOpen(true); }}
                  disabled={officeBalance <= 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#F5C800] hover:from-[#F5C800] hover:to-[#EAB308] text-slate-950 font-black text-xs uppercase transition-all duration-300 shadow-md shadow-[#CA8A04]/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none active:scale-95"
                >
                  Record Office Disbursal
                </button>
              </div>
            </div>

            {/* Column 3: Cumulative Surcharge Vault (100%) */}
            <div className="bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl relative border-t-4 border-t-slate-700 premium-glow-card-slate group">
              
              <div className="h-1.5 w-full bg-slate-900 border-b border-slate-800" />

              
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-[10px] font-black text-slate-355 uppercase tracking-widest">Cumulative Vault</span>
                  <Shield className="w-4.5 h-4.5 text-slate-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40 font-bold">
                    <span className="text-slate-500">Total Generated:</span>
                    <span className="font-extrabold text-slate-200">₦{setAsideTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 px-3 bg-slate-950/40 rounded-xl border border-slate-850/40 font-bold">
                    <span className="text-slate-500">Total Outflow:</span>
                    <span className="font-extrabold text-red-400">₦{(hqRemitted + officeDisbursed).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-850 font-black">
                    <span className="text-slate-350">Remaining Vault:</span>
                    <span className="font-black text-slate-100 text-sm">₦{(hqOutstanding + officeBalance).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-slate-950/40 border-t border-slate-850/40 text-center">
                <div className="text-[10px] font-extrabold text-[#F5C800] uppercase py-3.5 bg-slate-950/80 border border-slate-850/80 rounded-xl tracking-wider select-none border-dashed">
                  Formula: ₦500 × {totalCount} Registered Units
                </div>
              </div>
            </div>
          </div>

          {/* Surcharge splits ledger feed logs */}
          <div className="premium-glass border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-[#F5C800] filter drop-shadow-[0_1px_4px_rgba(245,200,0,0.25)]" />
                  Splits Ledger Records ({surchargeLogs.length})
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Remittances and disbursals logged during this scope.</p>
              </div>
              <span className="text-[8px] sm:text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-850 font-black text-[#F5C800] uppercase tracking-widest select-none">
                Vault logs
              </span>
            </div>

            {surchargeLogs.length > 0 ? (
              <div className="space-y-3">
                
                {/* Mobile Feed (Cards) */}
                <div className="block sm:hidden space-y-2">
                  {surchargeLogs.map(log => (
                    <div key={log.id} className="bg-slate-950/30 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <span className={`font-black uppercase text-[9px] px-2 py-0.5 rounded border ${
                          log.purpose === 'HQ Remittance' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' : 'bg-yellow-950/40 text-[#F5C800] border-yellow-500/10'
                        }`}>
                          {log.purpose === 'HQ Remittance' ? 'HQ Remit' : 'Office Spend'}
                        </span>
                        <div className="font-bold text-slate-500 mt-2 text-[9px]">{new Date(log.created_at || log.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-red-400">-₦{parseFloat(log.amount).toFixed(2)}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">By: {log.collected_by}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-850/80 shadow-inner">
                  <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/60 text-[9px] sm:text-[10px] tracking-wider uppercase">
                        <th className="py-3 px-4">DATE</th>
                        <th className="py-3 px-4">RECORD ID</th>
                        <th className="py-3 px-4">PURPOSE ACCOUNT</th>
                        <th className="py-3 px-4">AMOUNT TRANSACTION</th>
                        <th className="py-3 px-4 text-right">AUTHORIZATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50 text-slate-300 font-medium">
                      {surchargeLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-900/10 transition">
                          <td className="py-3 px-4 font-semibold text-slate-400">
                            {new Date(log.created_at || log.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 uppercase text-[9px] tracking-wider">
                            {log.id.substring(0, 10)}...
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-black px-2.5 py-0.5 rounded border text-[9px] uppercase tracking-wide ${
                              log.purpose === 'HQ Remittance' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/15' : 'bg-yellow-950/30 text-[#F5C800] border-yellow-500/15'
                            }`}>
                              {log.purpose}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-red-400">-₦{parseFloat(log.amount).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-slate-400 font-semibold">{log.collected_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 bg-slate-950/20 border border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
                <p className="font-black text-xs uppercase tracking-wider text-slate-450">No split transactions recorded in scope</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* HQ Remittance Modal - Premium Glassmorphic Card */}
      {hqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 relative text-xs text-slate-100 border-t-4 border-t-emerald-500">
            <h2 className="text-xs sm:text-sm font-black text-[#F5C800] mb-4 uppercase tracking-wide flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-450 filter drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
              Record HQ Remittance
            </h2>
            {modalError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {modalError}
              </div>
            )}
            <form onSubmit={handleRecordHQRemittance} className="space-y-4">
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">
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
                  className="w-full bg-slate-900/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition font-bold"
                />
              </div>
              
              <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl text-[9px] font-semibold text-slate-400 leading-relaxed uppercase">
                Maximum remit threshold: ₦{hqOutstanding.toLocaleString()}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-900 mt-5">
                <button
                  type="button"
                  onClick={() => { setHqModalOpen(false); setModalError(''); }}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-900 transition font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-lg shadow-emerald-500/10 transition cursor-pointer active:scale-95"
                >
                  {modalLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Disbursal Modal - Premium Glassmorphic Card */}
      {officeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 relative text-xs text-slate-100 border-t-4 border-t-[#F5C800]">
            <h2 className="text-xs sm:text-sm font-black text-[#F5C800] mb-4 uppercase tracking-wide flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#F5C800] filter drop-shadow-[0_0_4px_rgba(245,200,0,0.3)]" />
              Record Office Disbursal
            </h2>
            {modalError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {modalError}
              </div>
            )}
            <form onSubmit={handleRecordOfficeDisbursal} className="space-y-4">
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">
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
                  className="w-full bg-slate-900/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition font-bold"
                />
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl text-[9px] font-semibold text-slate-400 leading-relaxed uppercase">
                Maximum disbursal threshold: ₦{officeBalance.toLocaleString()}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-900 mt-5">
                <button
                  type="button"
                  onClick={() => { setOfficeModalOpen(false); setModalError(''); }}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-900 transition font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#F5C800] text-slate-950 font-black text-[10px] uppercase shadow-lg shadow-[#CA8A04]/10 transition cursor-pointer active:scale-95"
                >
                  {modalLoading ? 'Saving...' : 'Record Disbursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
