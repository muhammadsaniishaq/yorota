// YOROTA Smart Office - Premium Dark Sidebar Menu Layout
import React from 'react';
import { 
  Landmark, 
  LayoutDashboard, 
  FilePlus, 
  FileSpreadsheet, 
  CreditCard, 
  UserX, 
  BarChart3, 
  Settings, 
  LogOut,
  X,
  Menu,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  currentUser, 
  onLogout, 
  isOpen, 
  setIsOpen 
}) {
  const isAdmin = currentUser?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'officer'] },
    { id: 'daily-entry', label: 'Create Daily Entry', icon: FilePlus, roles: ['admin', 'officer'] },
    { id: 'daily-records', label: 'Registry Logs', icon: FileSpreadsheet, roles: ['admin', 'officer'] },
    { id: 'ledger', label: 'Office Cash Ledger', icon: CreditCard, roles: ['admin', 'officer'] },
    { id: 'debtors', label: 'Outstanding Debts', icon: UserX, roles: ['admin', 'officer'] },
    { id: 'reports', label: 'Reports & Audits', icon: BarChart3, roles: ['admin', 'officer'] },
    { id: 'services', label: 'Services Category', icon: Settings, roles: ['admin'] } // Admin only
  ];

  return (
    <>
      {/* Mobile Sidebar overlay backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar Drawer container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090d16] border-r border-[#1f2937]/50 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Sidebar Header */}
        <div>
          <div className="flex items-center justify-between px-5 py-5 border-b border-[#1f2937]/40 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-[#10b981]" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-100 block">YOROTA</span>
                <span className="text-[10px] text-emerald-500 font-bold tracking-widest block uppercase">Smart Office</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md bg-[#111827] text-slate-400 hover:text-slate-100 lg:hidden border border-border"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="px-3 py-6 space-y-1">
            {menuItems.map(item => {
              if (!item.roles.includes(currentUser?.role)) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { onViewChange(item.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#10b981] text-[#090d16] shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#090d16]' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User details and logout button) */}
        <div className="p-4 border-t border-[#1f2937]/40 bg-slate-950/20 space-y-4">
          
          {/* User badge */}
          <div className="flex items-center gap-3 p-2 bg-[#111827] border border-[#1f2937]/60 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/30">
              <ShieldCheck className="w-4.5 h-4.5 text-[#10b981]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{currentUser?.name || 'Operator'}</div>
              <div className="text-[9px] text-[#10b981] font-bold uppercase tracking-wider mt-0.5">{currentUser?.role || 'Officer'} PORTAL</div>
            </div>
          </div>

          {/* Log out trigger */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            SIGN OUT SESSION
          </button>
        </div>

      </aside>
    </>
  );
}
