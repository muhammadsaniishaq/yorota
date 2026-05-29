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
      {/* Mobile Sidebar overlay frosted backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Frosted Glass Drawer container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#070b14]/95 backdrop-blur-3xl border-r border-[#F5C800]/10 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 shadow-2xl shadow-black/80 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Sidebar Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-6 border-b border-[#F5C800]/10 bg-slate-950/40 relative overflow-hidden group">
            {/* Glowing gold background indicator in header */}
            <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-[#F5C800]/5 blur-xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5C800]/10 border border-[#F5C800]/30 flex items-center justify-center shadow-lg shadow-[#F5C800]/5 group-hover:border-[#F5C800]/60 transition duration-300">
                <Landmark className="w-4.5 h-4.5 text-[#F5C800]" />
              </div>
              <div>
                <span className="font-black text-sm tracking-widest text-slate-100 block gold-text-glow">YOROTA</span>
                <span className="text-[9px] text-[#F5C800] font-black tracking-[0.2em] block uppercase">Smart Office</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-slate-100 lg:hidden border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
 
          {/* Navigation Links list */}
          <nav className="px-4 py-6 space-y-2">
            {menuItems.map(item => {
              if (!item.roles.includes(currentUser?.role)) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { onViewChange(item.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F5C800] via-[#EAB308] to-[#CA8A04] text-[#070a13] shadow-lg shadow-[#F5C800]/15 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:scale-[1.01]'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#070a13]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User details and logout button) */}
        <div className="p-4 border-t border-[#F5C800]/10 bg-slate-950/40 space-y-4">
          
          {/* User badge with golden pulsing indicator */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 m-3 shadow-md shadow-emerald-500/50 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-[#F5C800]/10 flex items-center justify-center border border-[#F5C800]/25 group-hover:border-[#F5C800]/50 transition duration-300">
              <ShieldCheck className="w-5 h-5 text-[#F5C800]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-100 truncate group-hover:text-[#F5C800] transition duration-300">{currentUser?.name || 'Operator'}</div>
              <div className="text-[9px] text-[#F5C800] font-black uppercase tracking-wider mt-0.5">{currentUser?.role || 'Officer'} Portal</div>
            </div>
          </div>

          {/* Log out trigger */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-950/20 border border-red-500/10 text-xs font-black text-red-400 hover:bg-red-500 hover:text-[#070a13] hover:border-red-500 transition-all duration-300 uppercase tracking-widest cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>

      </aside>
    </>
  );
}
