// YOROTA Smart Office - High-Speed Registration Entry System
import React, { useState, useEffect, useRef } from 'react';
import { 
  FilePlus2, 
  UserCheck, 
  DollarSign, 
  HelpCircle, 
  Save, 
  Sparkles,
  Phone,
  Bookmark
} from 'lucide-react';
import { db } from '../services/db';

export default function DailyWorkForm({ currentUser, setGlobalNotification, onViewChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields State
  const [serviceId, setServiceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Focus ref for fast workflow
  const customerInputRef = useRef(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const activeCats = await db.services.getActive();
      setCategories(activeCats);
      if (activeCats.length > 0) {
        setServiceId(activeCats[0].id); // Auto-select first active service
      }
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading service types', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Get currently selected service details for calculations
  const selectedService = categories.find(c => c.id === serviceId);
  const unitPrice = selectedService ? selectedService.price : 0;
  const totalAmount = (unitPrice * quantity).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceId || !customerName.trim() || !phoneNumber.trim() || quantity <= 0) {
      setGlobalNotification({ message: 'Please fill in all mandatory registry details.', type: 'error' });
      return;
    }

    setFormLoading(true);
    try {
      const newRecord = await db.dailyRecords.create({
        service_id: serviceId,
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        quantity: parseInt(quantity),
        officer_name: currentUser.name || 'Duty Officer',
        notes: notes.trim()
      });

      // Show success message
      setGlobalNotification({ 
        message: `Registered ${customerName} for ${selectedService.name} ($${totalAmount}) successfully!`, 
        type: 'success' 
      });

      // Fast Reset: Keep service category select, clear customer logs to speed up workflow
      setCustomerName('');
      setPhoneNumber('');
      setQuantity(1);
      setNotes('');
      
      // Auto-focus customer input for consecutive entries
      if (customerInputRef.current) {
        customerInputRef.current.focus();
      }

    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: err.message || 'Error occurred while saving entry.', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Daily Work Entry</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Process registrations and generate clearances instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Entry Form Column */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Service Dropdown Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex justify-between">
                <span>Select Service Category *</span>
                <span className="text-emerald-500 font-extrabold text-[9px] cursor-pointer hover:underline" onClick={() => onViewChange('services')}>Manage Services</span>
              </label>
              {categories.length > 0 ? (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition font-semibold"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()} - (${parseFloat(cat.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-200 text-center">
                  No active services found. Please create one in Services Management first.
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Customer Full Name *
              </label>
              <input
                type="text"
                ref={customerInputRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ibrahim Abubakar"
                required
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
              />
            </div>

            {/* Phone contact & Qty row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-500" /> Phone Number Contact *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Volume Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition text-center font-bold"
                />
              </div>

            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Officer Registry Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="License plates, fleet counts, operating bounds, or special references..."
                rows="3"
                className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition resize-none"
              />
            </div>

            {/* Save trigger */}
            <div className="pt-4 border-t border-border mt-6">
              <button
                type="submit"
                disabled={formLoading || categories.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-600 text-primary-foreground font-black py-3 rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {formLoading ? 'SAVING JOURNAL RECORD...' : 'PROCESS REGISTRATION & POST TO LEDGER'}
              </button>
            </div>

          </form>
        </div>

        {/* Live Calculation Panel (Right Column) */}
        <div className="space-y-4">
          
          {/* Amount Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#10b981]/5 blur-lg" />
            
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block mb-1">Receipt Valuation</span>
            <h3 className="text-3xl font-black text-emerald-500 tracking-tight">${totalAmount}</h3>
            
            <div className="divide-y divide-border/60 text-xs mt-6 space-y-2.5">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Category Service:</span>
                <span className="font-bold text-slate-200 truncate max-w-[130px] text-right">{selectedService?.name || '—'}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Unit Processing:</span>
                <span className="font-medium text-slate-200">${unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Registration Units:</span>
                <span className="font-bold text-slate-200">x{quantity}</span>
              </div>
              <div className="flex justify-between pt-2.5 text-emerald-400 font-bold border-none">
                <span>Auto-Calculated Total:</span>
                <span className="font-black">${totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Officer Session Stamp */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 shadow-sm text-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-[10px] tracking-widest uppercase mb-1">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Journal Operator
            </div>
            
            <div className="space-y-2">
              <div className="text-slate-400">Duty Officer:</div>
              <div className="font-bold text-slate-200">{currentUser.name}</div>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400">Security Clearance:</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1 uppercase text-[10px]">
                <Sparkles className="w-3 h-3" /> {currentUser.role} portal
              </div>
            </div>
          </div>

          {/* Quick Help Hints */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border text-[10px] text-muted-foreground leading-relaxed flex gap-2">
            <HelpCircle className="w-5 h-5 text-[#10b981] shrink-0" />
            <div>
              <span className="font-bold text-slate-300 block mb-0.5">Speed Shortcut:</span>
              Once saved, the system automatically registers the payment in the Ledger, updates Dashboard counters, and readies the cursor for consecutive customer inputs instantly.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
