// YOROTA Smart Office - Core Application Root State Manager
import React, { useState, useEffect } from 'react';
import { db } from './services/db';

// Component Imports
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Page Views Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import DailyWorkForm from './pages/DailyWorkForm';
import DailyEntries from './pages/DailyEntries';
import Ledger from './pages/Ledger';
import Debtors from './pages/Debtors';
import { pdfGenerator } from './services/pdfGenerator';
import Reports from './pages/Reports';
import Surcharges from './pages/Surcharges';
import PendingDrafts from './pages/PendingDrafts';
import Profile from './pages/Profile';
import IdGenerator from './pages/IdGenerator';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Animated Floating Toast Notification State
  const [notification, setNotification] = useState(null);

  // Check persistent session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await db.auth.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session restore failure', err);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Global Notification trigger helper
  // Auto-connect to previously paired printer globally on app load
  useEffect(() => {
    const initPrinter = async () => {
      try {
        if (!pdfGenerator.isBlePrinterConnected()) {
          const name = await pdfGenerator.tryAutoConnectBlePrinter();
          if (name) {
            console.log('Globally reconnected to printer:', name);
          }
        }
      } catch (err) {
        console.warn('Global auto-reconnect failed', err);
      }
    };
    initPrinter();
  }, []);

  const triggerNotification = (payload) => {
    setNotification(payload);
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(prev => prev === payload ? null : prev);
    }, 4000);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    triggerNotification({ message: `Session unlocked. Welcome back, ${user.name}!`, type: 'success' });
  };

  const handleProfileUpdate = (updatedProfile) => {
    setCurrentUser(prev => ({
      ...prev,
      name: updatedProfile.name
    }));
    triggerNotification({ message: 'Clearance display name updated successfully!', type: 'success' });
  };

  const handleLogout = async () => {
    try {
      await db.auth.logout();
      setCurrentUser(null);
      setCurrentView('dashboard');
      triggerNotification({ message: 'Session closed successfully.', type: 'info' });
    } catch (err) {
      console.error(err);
      triggerNotification({ message: 'Error closing session.', type: 'error' });
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, render authentication portal
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        notification={notification}
        setGlobalNotification={triggerNotification}
      />
    );
  }

  // Render active page component based on view routing
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser}
            onViewChange={setCurrentView} 
            notification={notification} 
          />
        );
      case 'services':
        return <Services setGlobalNotification={triggerNotification} />;
      case 'daily-entry':
        return (
          <DailyWorkForm 
            currentUser={currentUser} 
            setGlobalNotification={triggerNotification} 
            onViewChange={setCurrentView}
          />
        );
      case 'daily-records':
        return <DailyEntries setGlobalNotification={triggerNotification} />;
      case 'pending-drafts':
        return (
          <PendingDrafts 
            currentUser={currentUser} 
            setGlobalNotification={triggerNotification} 
          />
        );
      case 'ledger':
        return (
          <Ledger 
            currentUser={currentUser} 
            setGlobalNotification={triggerNotification} 
          />
        );
      case 'debtors':
        return (
          <Debtors 
            currentUser={currentUser} 
            setGlobalNotification={triggerNotification} 
          />
        );
      case 'reports':
        return <Reports currentUser={currentUser} setGlobalNotification={triggerNotification} />;
      case 'surcharges':
        return <Surcharges setGlobalNotification={triggerNotification} />;
      case 'profile':
        return (
          <Profile 
            currentUser={currentUser} 
            onProfileUpdate={handleProfileUpdate} 
            setGlobalNotification={triggerNotification} 
          />
        );
      case 'id-gen':
        return (
          <IdGenerator 
            currentUser={currentUser} 
            setGlobalNotification={triggerNotification} 
          />
        );
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-lg font-bold text-red-400">View not found</h2>
            <button onClick={() => setCurrentView('dashboard')} className="text-emerald-500 underline text-sm mt-2">Return to Dashboard</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground dark road-overlay">
      
      {/* Sidebar - left */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Administrative Viewport Panel */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 min-h-screen bg-slate-950/20">
        
        {/* Topbar Search & Header info */}
        <Topbar 
          currentView={currentView}
          onSidebarToggle={() => setSidebarOpen(prev => !prev)}
          onViewChange={setCurrentView}
          notification={notification}
        />

        {/* Dynamic viewport layout */}
        <main className="flex-1 p-2 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-16">
          {renderViewContent()}
        </main>
      </div>

      {/* Floating Animated Toast Banner Alerts */}
      {notification && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-[#111827] border border-[#1f2937] p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 
              notification.type === 'error' ? 'bg-red-500 shadow-md shadow-red-500/50' : 'bg-blue-500 shadow-md shadow-blue-500/50'
            }`} />
            <p className="text-xs font-bold text-slate-100 truncate pr-2">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-200 text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
