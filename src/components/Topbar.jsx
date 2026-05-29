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
      case 'services': return 'Category configuration';
      default: return 'Administrative Portal';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Mobile Hamburger menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className="p-1.5 rounded-lg bg-secondary text-slate-400 hover:text-slate-100 lg:hidden border border-border transition"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <div className="hidden sm:block">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">ADMINISTRATIVE SYSTEM</span>
          <h2 className="text-sm font-extrabold text-slate-200 mt-0.5">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Global search and dynamic dropdown overlays */}
      <div className="relative max-w-xs sm:max-w-md w-full mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Global cross-module search..."
            className="w-full bg-secondary/50 border border-border rounded-xl py-1.5 pl-9 pr-8 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
          />
          {search && (
            <button 
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-secondary text-muted-foreground"
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
                        <span className="text-red-400 font-bold">Owes: ${d.amount_owed.toFixed(2)}</span>
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
                        {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Database Mode Status Badges */}
      <div className="flex items-center gap-3">
        {isMockActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs select-none">
            <Database className="w-3 h-3" />
            LOCAL SANDBOX
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs select-none animate-pulse">
            <Database className="w-3 h-3 text-emerald-400" />
            LIVE SUPABASE
          </span>
        )}
      </div>

    </header>
  );
}
