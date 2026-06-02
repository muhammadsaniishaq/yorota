// YOROTA Smart Office - Premium Dark Sidebar Menu Layout
import React from 'react';
import { 
  Landmark, 
  LayoutDashboard, 
  FilePlus, 
  FileSpreadsheet, 
  FileClock,
  CreditCard, 
  UserX, 
  BarChart3, 
  Settings, 
  LogOut,
  X,
  Menu,
  ShieldCheck,
  Percent
} from 'lucide-react';
import YorotaLogo from './YorotaLogo';

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
    { id: 'pending-drafts', label: 'Overnight Drafts', icon: FileClock, roles: ['admin', 'officer'] },
    { id: 'daily-records', label: 'Registry Logs', icon: FileSpreadsheet, roles: ['admin', 'officer'] },
    { id: 'ledger', label: 'Office Cash Ledger', icon: CreditCard, roles: ['admin', 'officer'] },
    { id: 'debtors', label: 'Outstanding Debts', icon: UserX, roles: ['admin', 'officer'] },
    { id: 'reports', label: 'Reports & Audits', icon: BarChart3, roles: ['admin', 'officer'] },
    { id: 'surcharges', label: 'Surcharge & Splits', icon: Percent, roles: ['admin', 'officer'] },
    { id: 'services', label: 'Manage Categories', icon: Settings, roles: ['admin', 'officer'] } // Accessible to all roles
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

      {/* Main Sidebar Frosted Glass Drawer container - Narrow on Mobile, Standard on Desktop */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-[75vw] max-w-[250px] lg:w-64 bg-[#070b14]/95 backdrop-blur-3xl border-r border-[#F5C800]/10 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 shadow-2xl shadow-black/80 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Sidebar Header */}
        <div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F5C800]/10 bg-slate-950/40 relative overflow-hidden group">
            {/* Glowing gold background indicator in header */}
            <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-[#F5C800]/5 blur-xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            
            <YorotaLogo className="w-8 h-8 shrink-0" showText={true} />
            
            {/* Mobile close button - Circular Glowing Gold Action Badge */}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 border border-[#F5C800]/20 hover:border-[#F5C800]/50 hover:bg-slate-850 hover:scale-105 active:scale-95 text-slate-400 hover:text-[#F5C800] lg:hidden transition duration-300 shadow-md select-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Caution Accents Hazard Zebra Crossing Divider */}
          <div className="zebra-crossing-line w-full opacity-90 h-2.5 rounded-none shrink-0 select-none" />
 
          {/* Navigation Links list - Tight gaps on Mobile, standard on Desktop */}
          <nav className="px-3 py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-thin">
            {menuItems.map(item => {
              if (!item.roles.includes(currentUser?.role)) return null;
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { onViewChange(item.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-extrabold transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F5C800] via-[#EAB308] to-[#CA8A04] text-[#070a13] shadow-lg shadow-[#F5C800]/15 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 hover:scale-[1.01]'
                  }`}
                >
                  {/* Left glowing vertical pill indicator on active button */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#070a13] shadow-md shadow-[#070a13]/30" />
                  )}

                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#070a13]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="tracking-wide truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User details and logout button) */}
        <div className="p-2.5 border-t border-[#F5C800]/10 bg-slate-950/40 space-y-2 shrink-0">
          
          {/* User badge with online indicator transformed into a Secure Clearance Pass */}
          <div className="flex items-center gap-2.5 p-2 bg-slate-950/80 border border-[#F5C800]/20 rounded-xl relative overflow-hidden group shadow-lg shadow-black/40">
            <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 m-2.5 shadow-lg shadow-emerald-500/50 animate-ping pointer-events-none" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 m-2.5 shadow-md shadow-emerald-500/50 pointer-events-none" />
            <div className="w-7 h-7 rounded-full bg-[#F5C800]/10 flex items-center justify-center border border-[#F5C800]/20 group-hover:border-[#F5C800]/50 transition duration-300">
              <ShieldCheck className="w-4 h-4 text-[#F5C800]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] lg:text-xs font-black text-slate-100 truncate group-hover:text-[#F5C800] transition duration-300 flex items-center gap-1">
                {currentUser?.name || 'Operator'}
              </div>
              <div className="text-[7.5px] lg:text-[8px] text-[#F5C800] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1 select-none">
                <span className="w-1 h-1 rounded-full bg-[#F5C800]/40 shrink-0" />
                {currentUser?.role || 'Officer'} SECURE PASS
              </div>
            </div>
          </div>

          {/* Double Solid yellow Traffic Lanes Divider */}
          <div className="flex flex-col gap-0.5 py-0.5 select-none">
            <div className="h-[1px] w-full bg-[#CA8A04]/40" />
            <div className="h-[1px] w-full bg-[#CA8A04]/40" />
          </div>

          {/* Log out trigger */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-950/20 border border-red-500/10 text-[11px] lg:text-xs font-black text-red-400 hover:bg-red-500 hover:text-[#070a13] hover:border-red-500 transition-all duration-300 uppercase tracking-widest cursor-pointer select-none active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Sign Out
          </button>
        </div>

      </aside>
    </>
  );
}
