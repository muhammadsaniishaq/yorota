// YOROTA Smart Office - Premium Global Search & Header Topbar
import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Database,
  User,
  ShieldCheck,
  FileText,
  UserX,
  CreditCard,
  X,
  ArrowRight
} from 'lucide-react';
import { db } from '../services/db';

export default function Topbar({ 
  currentView, 
  onSidebarToggle, 
  onViewChange,
  notification
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState({ records: [], debtors: [], transactions: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMockActive, setIsMockActive] = useState(true);
  const [draftsCount, setDraftsCount] = useState(0);

  useEffect(() => {
    const checkDrafts = () => {
      try {
        const localData = localStorage.getItem('yorota_overnight_drafts');
        if (localData) {
          const list = JSON.parse(localData);
          setDraftsCount(list.length || 0);
        } else {
          setDraftsCount(0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkDrafts();
    // Poll every 2.5 seconds to track active changes without overhead
    const interval = setInterval(checkDrafts, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMockActive(db.isMock());
  }, []);

  const handleSearch = async (val) => {
    setSearch(val);
    if (!val.trim()) {
      setResults({ records: [], debtors: [], transactions: [] });
      setShowDropdown(false);
      return;
    }

    try {
      const data = await db.globalSearch(val);
      setResults(data);
      setShowDropdown(
        data.records.length > 0 || 
        data.debtors.length > 0 || 
        data.transactions.length > 0
      );
    } catch (err) {
      console.error('Search query failure', err);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setResults({ records: [], debtors: [], transactions: [] });
    setShowDropdown(false);
  };

  const handleResultClick = (targetView) => {
    onViewChange(targetView);
    clearSearch();
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Operational Dashboard';
      case 'daily-entry': return 'Daily Work Registry';
      case 'daily-records': return 'Historical Records Roster';
      case 'ledger': return 'Cash Balance Ledger';
      case 'debtors': return 'Outstanding Debts';
      case 'reports': return 'Revenue Audit Reports';
      case 'services': return 'Manage Categories';
      default: return 'Administrative Portal';
    }
  };

  return (
    <header className="h-16 border-b border-[#F5C800]/10 bg-[#0c1220]/80 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md shadow-black/10">
      
      {/* Mobile Hamburger menu & Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-[#F5C800] lg:hidden border border-slate-800 transition cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        
        <div className="hidden sm:block">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">ADMINISTRATIVE SYSTEM</span>
          <h2 className="text-xs font-black text-slate-200 mt-0.5 tracking-wide gold-text-glow">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Global search and dynamic dropdown overlays */}
      <div className="relative max-w-[200px] sm:max-w-md w-full mx-2 sm:mx-4">
        <div className="relative group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within/search:text-[#F5C800] transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search details..."
            className="w-full bg-[#070a13]/80 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition"
          />
          {search && (
            <button 
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown overlay */}
        {showDropdown && (
          <div className="absolute top-11 left-0 right-0 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-40 p-4 divide-y divide-border/60">
            
            {/* 1. Records */}
            {results.records.length > 0 && (
              <div className="py-2.5">
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider flex items-center gap-1 uppercase mb-1">
                  <FileText className="w-3 h-3" /> Registry Journals ({results.records.length})
                </span>
                <div className="space-y-1">
                  {results.records.map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => handleResultClick('daily-records')}
                      className="p-2 rounded-lg hover:bg-secondary/40 cursor-pointer flex justify-between items-center text-[10px] group transition"
                    >
                      <div>
                        <span className="font-semibold block text-slate-200">{r.customer_name}</span>
                        <span className="text-muted-foreground">{r.service?.name} - {r.phone_number}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Debtors */}
            {results.debtors.length > 0 && (
              <div className="py-2.5">
                <span className="text-[9px] font-bold text-red-400 tracking-wider flex items-center gap-1 uppercase mb-1">
                  <UserX className="w-3 h-3" /> Debtor Records ({results.debtors.length})
                </span>
                <div className="space-y-1">
                  {results.debtors.map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => handleResultClick('debtors')}
                      className="p-2 rounded-lg hover:bg-secondary/40 cursor-pointer flex justify-between items-center text-[10px] group transition"
                    >
                      <div>
                        <span className="font-semibold block text-slate-200">{d.customer_name}</span>
                        <span className="text-red-400 font-bold">Owes: ₦{d.amount_owed.toFixed(2)}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Ledger Transactions */}
            {results.transactions.length > 0 && (
              <div className="py-2.5">
                <span className="text-[9px] font-bold text-blue-400 tracking-wider flex items-center gap-1 uppercase mb-1">
                  <CreditCard className="w-3 h-3" /> Ledger Transactions ({results.transactions.length})
                </span>
                <div className="space-y-1">
                  {results.transactions.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleResultClick('ledger')}
                      className="p-2 rounded-lg hover:bg-secondary/40 cursor-pointer flex justify-between items-center text-[10px] group transition"
                    >
                      <div>
                        <span className="font-semibold block text-slate-200">{t.purpose}</span>
                        <span className="text-muted-foreground">{t.date} • {t.collected_by}</span>
                      </div>
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}₦{parseFloat(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Dynamic Traffic Light Health Signal Widget */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Vertical Traffic Light Housing Container */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-950/80 border border-slate-850 shadow-inner group/traffic relative select-none">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest hidden md:inline pl-1">SYSTEM STATE:</span>
          
          {/* Bulb 1: Red (Sandbox/Error Warning) */}
          <div 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 relative group cursor-help ${
              isMockActive 
                ? 'bg-red-500/25 border border-red-500/40 shadow-lg shadow-red-500/20' 
                : 'bg-slate-800 border border-slate-900'
            }`}
          >
            {isMockActive && (
              <div className="absolute inset-0 rounded-full bg-red-500/90 pulse-red" />
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-red-200 font-extrabold text-center shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 uppercase tracking-wider z-50">
              🚨 Sandbox active. Supabase connection bypassed!
            </span>
          </div>

          {/* Bulb 2: Yellow (Caution - Overnight Unsubmitted Drafts waiting) */}
          <div 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 relative group cursor-help ${
              draftsCount > 0 
                ? 'bg-amber-500/25 border border-amber-500/40 shadow-lg shadow-amber-500/20' 
                : 'bg-slate-800 border border-slate-900'
            }`}
          >
            {draftsCount > 0 && (
              <div className="absolute inset-0 rounded-full bg-[#F5C800]/90 pulse-yellow" />
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-amber-200 font-extrabold text-center shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 uppercase tracking-wider z-50">
              ⚠️ {draftsCount} Drafts waiting in overnight vault!
            </span>
          </div>

          {/* Bulb 3: Green (Go - Connected & Secured live database) */}
          <div 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 relative group cursor-help ${
              !isMockActive 
                ? 'bg-emerald-500/25 border border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 border border-slate-900'
            }`}
          >
            {!isMockActive && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/90 pulse-green" />
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-emerald-200 font-extrabold text-center shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition duration-200 uppercase tracking-wider z-50">
              ✅ Securely synchronized to Supabase Cloud!
            </span>
          </div>
        </div>

        {/* Database Mode Status Badges */}
        {isMockActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs select-none">
            <Database className="w-3 h-3" />
            SANDBOX
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs select-none animate-pulse">
            <Database className="w-3 h-3 text-emerald-400" />
            LIVE SQL
          </span>
        )}
      </div>

    </header>
  );
}
