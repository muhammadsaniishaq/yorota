// YOROTA Smart Office - Officer Secure Clearance Profile & Performance Auditing
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Award, 
  TrendingUp, 
  Database, 
  Key, 
  Save, 
  Clock, 
  Fingerprint, 
  FileText,
  Activity
} from 'lucide-react';
import { db } from '../services/db';
import YorotaLogo from '../components/YorotaLogo';

export default function Profile({ currentUser, onProfileUpdate, setGlobalNotification }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [stats, setStats] = useState({
    registeredUnits: 0,
    grossValue: 0,
    hqSplit: 0,
    localSplit: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // 3D Card Tilt state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineStyle, setShineStyle] = useState({});

  // Session metadata
  const [browserAgent, setBrowserAgent] = useState('Google Chrome (Secure SSL)');
  const [sessionTime, setSessionTime] = useState('');

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    // Max rotation: 12 degrees
    const rX = -(y / (box.height / 2)) * 12;
    const rY = (x / (box.width / 2)) * 12;
    
    setRotateX(rX);
    setRotateY(rY);

    // Coordinate percentage for radial shining sweep highlight
    const px = ((e.clientX - box.left) / box.width) * 100;
    const py = ((e.clientY - box.top) / box.height) * 100;
    setShineStyle({
      background: `radial-gradient(circle 120px at ${px}% ${py}%, rgba(245, 200, 0, 0.18), transparent 75%)`
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShineStyle({});
  };

  // Extract real-time performance from daily records and transactions
  const loadPerformanceStats = async () => {
    setLoadingStats(true);
    try {
      const records = await db.dailyRecords.getAll();
      
      // Filter records registered by this active officer
      const officerNameLower = (currentUser?.name || '').toLowerCase().trim();
      const officerRecords = records.filter(r => 
        (r.officer_name || '').toLowerCase().trim() === officerNameLower
      );

      // Summarize performance metrics
      const unitsCount = officerRecords.reduce((sum, r) => sum + r.quantity, 0);
      const grossVal = officerRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      // Surcharge split = 500 Naira * quantity
      const surchargeContributed = unitsCount * 500;
      const hqSplits = surchargeContributed * 0.70;
      const localSplits = surchargeContributed * 0.30;

      setStats({
        registeredUnits: unitsCount,
        grossValue: grossVal,
        hqSplit: hqSplits,
        localSplit: localSplits
      });
    } catch (err) {
      console.error('Error loading officer stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadPerformanceStats();
    
    // Set browser agent and current session timestamp
    if (navigator.userAgent) {
      const agent = navigator.userAgent.split(') ')[0] + ')';
      setBrowserAgent(agent.substring(0, 50));
    }
    setSessionTime(new Date().toLocaleString());
  }, [currentUser]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Operator display name cannot be blank.');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      // Persist display name change inside the Supabase profiles database table
      const updatedProfile = await db.auth.updateProfileName(currentUser.id, name.trim());
      
      // Sync dynamic state in parent app component
      onProfileUpdate(updatedProfile);
      setGlobalNotification({ message: 'Secure display credentials updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update operator display profile.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-1 sm:px-4 pb-8 relative overflow-hidden grid-bg-overlay max-w-6xl mx-auto">
      
      {/* Dynamic scanline and 3D hologram card override styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scanline-anim {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        .scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #F5C800 30%, #F5C800 70%, transparent);
          box-shadow: 0 0 8px #F5C800, 0 0 15px rgba(245, 200, 0, 0.4);
          animation: scanline-anim 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }
        .card-perspective {
          perspective: 1000px;
        }
        .hud-border-glow {
          box-shadow: 0 0 25px rgba(245, 200, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .hud-border-glow:hover {
          box-shadow: 0 0 35px rgba(245, 200, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.05);
        }
      `}} />

      {/* Top Gold & Emerald Stripe Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500 rounded-full" />

      {/* Zebra Crossing Divider & Flowing Highway Line */}
      <div className="space-y-1.5 my-2 select-none">
        <div className="zebra-crossing-line opacity-95" />
        <div className="animate-road-flow" />
      </div>

      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 uppercase">Officer Clearance Pass</h1>
        <p className="text-[10px] sm:text-sm text-slate-450 mt-1 leading-relaxed">
          Manage system display credentials, check security permissions, and monitor active duty performance statistics.
        </p>
      </div>

      {/* Main Two Column Profile Layout - Stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start card-perspective">
        
        {/* Left Column: Digital Clearance Pass Badge (Aesthetic Showcase with 3D Tilt) */}
        <div className="lg:col-span-2 flex flex-col items-center">
          
          {/* Digital Badge Outer housing card with 3D TILT and holographic sweep */}
          <div 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: 'transform 0.1s ease-out, border-color 0.4s ease'
            }}
            className="w-full max-w-[320px] bg-[#070b14]/90 border-2 border-[#F5C800]/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden group select-none hover:border-[#F5C800]/60 border-t-8 border-t-[#F5C800] py-6 hud-border-glow cursor-all-scroll"
          >
            {/* Dynamic Shining sweep highlight overlay */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-100" style={shineStyle} />

            {/* Vertical holographic scanner beam line */}
            <div className="scanline" />
            
            {/* Pulsing Active Beacon in top right */}
            <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[8px] font-black text-emerald-450 tracking-wider">ON DUTY</span>
            </div>

            {/* Background vector watermark lines */}
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-emerald-500/5 blur-xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#F5C800]/5 blur-xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

            {/* Official Badge Header */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-[#F5C800]/10 relative z-10">
              <YorotaLogo className="w-12 h-12" showText={false} />
              <h2 className="text-[11px] font-black tracking-widest text-slate-200 mt-2 uppercase">YOROTA SMART OFFICE</h2>
              <span className="text-[7px] text-[#F5C800] font-bold tracking-[0.2em] uppercase mt-0.5">STATE ROAD TRAFFIC AGENCY</span>
            </div>

            {/* Avatar & Operator Details */}
            <div className="flex flex-col items-center text-center pt-5 pb-5 relative z-10">
              
              {/* Shield avatar icon representation with circular scanner rings */}
              <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-[#F5C800]/20 flex items-center justify-center shadow-lg group-hover:border-[#F5C800]/70 group-hover:shadow-[0_0_15px_rgba(245,200,0,0.15)] hover:scale-105 transition-all duration-300 relative overflow-hidden">
                {/* Visual grid backdrop inside avatar */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(245,200,0,0.06)_1px,transparent_1px)] bg-[size:8px_8px]" />
                <ShieldCheck className="w-10 h-10 text-[#F5C800] relative z-10" />
              </div>

              <h3 className="text-base font-black text-slate-105 mt-3 tracking-wide truncate max-w-full">
                {currentUser?.name || 'Authorized Officer'}
              </h3>
              
              <span className="text-[9px] font-black tracking-[0.15em] text-[#F5C800] uppercase mt-1 bg-[#F5C800]/10 border border-[#F5C800]/25 px-3.5 py-1 rounded-full shadow-inner">
                {currentUser?.role || 'OFFICER'} SECURE ACCESS
              </span>
            </div>

            {/* Clearance Credentials footer block */}
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-900 text-[9.5px] font-bold text-slate-400 space-y-1.5 relative z-10 shadow-inner">
              <div className="flex justify-between">
                <span>Access ID:</span>
                <span className="text-slate-250 truncate max-w-[130px] font-semibold font-mono">{currentUser?.id?.substring(0, 18)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Duty Clearance:</span>
                <span className="text-[#F5C800] font-extrabold uppercase">LEVEL 3 SECURED</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-1.5">
                <span>Authority Signet:</span>
                <span className="text-emerald-450 font-black uppercase text-[8px] flex items-center gap-0.5 animate-pulse">
                  <Fingerprint className="w-3.5 h-3.5" /> STAMP APPROVED
                </span>
              </div>

              {/* Graphic Barcode design */}
              <div className="pt-2 flex flex-col items-center">
                <div className="h-6 w-full max-w-[180px] bg-[#070a13] rounded-md border border-slate-800 relative flex items-center justify-center opacity-80">
                  <div className="w-[85%] h-3 flex justify-between select-none">
                    {/* Simulated barcode stripes */}
                    <div className="w-[3px] bg-slate-450 h-full" /><div className="w-[1px] bg-slate-450 h-full" /><div className="w-[4px] bg-slate-450 h-full" /><div className="w-[2px] bg-slate-450 h-full" /><div className="w-[1px] bg-slate-450 h-full" /><div className="w-[3px] bg-slate-450 h-full" /><div className="w-[2px] bg-slate-450 h-full" /><div className="w-[4px] bg-slate-450 h-full" /><div className="w-[1px] bg-slate-450 h-full" /><div className="w-[3px] bg-slate-450 h-full" /><div className="w-[1px] bg-slate-450 h-full" /><div className="w-[2px] bg-slate-450 h-full" /><div className="w-[4px] bg-slate-450 h-full" /><div className="w-[1px] bg-slate-450 h-full" /><div className="w-[3px] bg-slate-450 h-full" /><div className="w-[2px] bg-slate-450 h-full" />
                  </div>
                </div>
                <span className="text-[7px] text-slate-600 tracking-[0.35em] font-mono mt-1 uppercase select-none">SECURE PASS #{currentUser?.role?.substring(0, 3)}-{currentUser?.id?.substring(0, 4)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance Stats and Settings Modification */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Live Duty Performance Dashboard stats */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
            
            {/* Ambient gold glow highlight inside container background */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#F5C800]/3 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 pb-3 border-b border-slate-850/60 mb-4">
              <Award className="w-4.5 h-4.5 text-[#F5C800]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Operational Performance</h3>
            </div>

            {loadingStats ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                {/* Vector SVG Steering Wheel Loader Spinner */}
                <svg className="w-10 h-10 text-[#F5C800] steering-wheel-loader" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
                  <circle cx="32" cy="32" r="6" fill="currentColor" />
                  <line x1="32" y1="38" x2="32" y2="60" strokeWidth="4.5" />
                  <line x1="28" y1="30" x2="8" y2="18" strokeWidth="4.5" />
                  <line x1="36" y1="30" x2="56" y2="18" strokeWidth="4.5" />
                </svg>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">Calculating operational data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Stat 1: Vehicles Registered */}
                <div className="bg-[#070a13]/70 border border-slate-850/80 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden hover:border-[#F5C800]/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F5C800]" />
                  <div className="p-2.5 rounded-xl bg-[#F5C800]/10 text-[#F5C800] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Registered Units</span>
                    <h4 className="text-base font-black text-slate-100 mt-0.5">{stats.registeredUnits} Vehicles</h4>
                  </div>
                </div>

                {/* Stat 2: Gross Collections */}
                <div className="bg-[#070a13]/70 border border-slate-850/80 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Gross Revenue</span>
                    <h4 className="text-base font-black text-emerald-400 mt-0.5">₦{stats.grossValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                  </div>
                </div>

                {/* Stat 3: HQ Split contribution */}
                <div className="bg-[#070a13]/70 border border-slate-850/80 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden hover:border-amber-500/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">HQ Surcharges Splits (70%)</span>
                    <h4 className="text-sm font-black text-slate-200 mt-0.5">₦{stats.hqSplit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                  </div>
                </div>

                {/* Stat 4: Local splits contribution */}
                <div className="bg-[#070a13]/70 border border-slate-850/80 rounded-2xl p-4 flex items-center gap-3.5 relative overflow-hidden hover:border-indigo-500/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Local Retention splits (30%)</span>
                    <h4 className="text-sm font-black text-slate-200 mt-0.5">₦{stats.localSplit.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Settings display name modification form */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850/60 mb-4">
              <User className="w-4.5 h-4.5 text-[#F5C800]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Modify Display Credentials</h3>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Display Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full official name"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3.5 pl-11 pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Registered Email (Read-Only)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-650" />
                  <input
                    type="email"
                    readOnly
                    value={currentUser?.email || ''}
                    className="w-full bg-slate-950/20 border border-slate-900 rounded-xl py-3.5 pl-11 pr-4 text-xs text-slate-500 focus:outline-none select-all font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-850/60">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] hover:from-emerald-400 hover:to-emerald-500 text-[#070a13] font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 select-none"
                >
                  <Save className="w-4 h-4" />
                  {formLoading ? 'Saving changes...' : 'Save credentials'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Active Session Logs card */}
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-3xl p-5 shadow-xl relative overflow-hidden group">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850/60 mb-3">
              <Clock className="w-4.5 h-4.5 text-[#F5C800]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Active Security Session</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-400 font-semibold p-1">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-slate-950/65 text-slate-500 shrink-0 border border-slate-850">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Session Browser Client</span>
                  <span className="text-slate-300 font-bold block mt-0.5">{browserAgent}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 border-t border-slate-850/30 pt-3">
                <div className="p-2 rounded-xl bg-slate-950/65 text-slate-500 shrink-0 border border-slate-850">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Duty Authenticated Timestamp</span>
                  <span className="text-slate-300 font-bold block mt-0.5">{sessionTime}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
