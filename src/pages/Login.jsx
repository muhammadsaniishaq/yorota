// YOROTA Smart Office - Premium Unified Access Portal
import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/db';
import YorotaLogo from '../components/YorotaLogo';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all security credentials.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { user } = await db.auth.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Access Denied: Invalid email, password, or security mismatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center px-4 relative overflow-hidden font-sans">
      
      {/* ── HIGH-END LUXURY NEON GLOW EFFECTS ── */}
      {/* Golden Pulsing Halo (Top-Left) */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#F5C800]/10 via-[#F5C800]/5 to-transparent blur-[130px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '8s' }} 
      />
      {/* Emerald Cyan Pulsing Halo (Bottom-Right) */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-[#10b981]/8 via-[#10b981]/3 to-transparent blur-[130px] animate-pulse pointer-events-none" 
        style={{ animationDuration: '10s' }} 
      />
      {/* Floating Ambient Core Light */}
      <div 
        className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#F5C800]/4 to-[#10b981]/4 blur-[100px] pointer-events-none" 
      />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#F5C800 1px, transparent 1px), linear-gradient(90deg, #F5C800 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Diagonal Light Beam Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,0,0.4) 0%, rgba(7,10,19,0) 50%, rgba(16,185,129,0.4) 100%)'
        }}
      />

      {/* ── UNIFIED GLASSMORPHIC LOGIN PORTAL CARD ── */}
      <div className="w-full max-w-[440px] bg-[#0c1220]/80 backdrop-blur-3xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 transition-all duration-700 hover:border-[#F5C800]/40 hover:shadow-2xl hover:shadow-[#F5C800]/5 group">
        
        {/* Dynamic Glowing Border Line (Sleek Hover Highlight) */}
        <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-gradient-to-r from-[#F5C800]/30 to-[#10b981]/30 transition-all duration-700 pointer-events-none" />

        {/* Top Gold & Emerald Gradient Stripe */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] bg-gradient-to-r from-transparent via-[#F5C800]/70 to-transparent blur-[1px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-[1px] bg-gradient-to-r from-transparent via-[#10b981]/80 to-transparent" />

        {/* Agency Logo & Unified Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-22 h-22 rounded-2xl bg-[#070a13]/90 flex items-center justify-center border border-slate-800 mb-4 shadow-xl shadow-black/40 group-hover:border-[#F5C800]/50 transition-all duration-500 relative overflow-hidden">
            {/* Background Glow inside logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F5C800]/10 to-[#10b981]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <YorotaLogo className="w-16 h-16 justify-center" showText={false} />

          </div>
          
          <h1 className="text-[26px] font-extrabold text-slate-100 tracking-tight text-center flex items-center gap-1.5 select-none">
            YOROTA <span className="bg-gradient-to-r from-[#F5C800] to-[#FFDF52] bg-clip-text text-transparent font-black">Smart Office</span>
          </h1>
          
          <p className="text-[10px] font-bold text-slate-400 mt-2.5 uppercase tracking-[0.25em] text-center border-t border-slate-800/80 pt-2.5 w-[70%] select-none">
            Secure Entry Portal
          </p>
        </div>

        {/* Premium Secure Shield Subtitle Badge */}
        <div className="mb-6 py-2.5 px-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-[#F5C800]" />
          <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase select-none">
            Authorized Personnel Only
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 flex items-start gap-3 text-red-200 text-xs leading-relaxed animate-in fade-in duration-300">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-md shadow-red-500/50" />
            <div>
              <span className="font-extrabold text-red-400">Security Alert: </span>
              {error}
            </div>
          </div>
        )}

        {/* ── SECURITY LOGIN FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 select-none">
              Official Email Address
            </label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-500 group-focus-within/input:text-[#F5C800] transition-colors duration-300" />
              </div>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@yorota.gov"
                className="w-full bg-[#070a13]/85 border border-slate-800/90 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] hover:border-slate-700/80 transition-all duration-300 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 select-none">
              Security Access Password
            </label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-slate-500 group-focus-within/input:text-[#F5C800] transition-colors duration-300" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#070a13]/85 border border-slate-800/90 rounded-2xl py-3.5 pl-12 pr-11 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] hover:border-slate-700/80 transition-all duration-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F5C800] via-[#EAB308] to-[#CA8A04] hover:from-[#FFD740] hover:via-[#F5C800] hover:to-[#EAB308] text-[#070a13] py-4 rounded-2xl font-black tracking-wider transition-all duration-500 flex items-center justify-center gap-2.5 text-xs uppercase mt-8 shadow-xl shadow-[#F5C800]/10 hover:shadow-[#F5C800]/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#070a13] border-t-transparent animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4.5 h-4.5 shrink-0" />
                Unlock Access Key
              </>
            )}
          </button>
        </form>

        {/* Small subtle footer security label */}
        <div className="mt-8 pt-4 border-t border-slate-800/40 text-center select-none">
          <p className="text-[10px] text-slate-500 font-medium">
            System protected by cryptographic layers. 
          </p>
        </div>

      </div>
    </div>
  );
}
