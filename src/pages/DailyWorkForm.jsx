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
      await db.dailyRecords.create({
        service_id: serviceId,
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        quantity: parseInt(quantity),
        officer_name: currentUser.name || 'Duty Officer',
        notes: notes.trim()
      });

      // Show success message
      setGlobalNotification({ 
        message: `Registered ${customerName} for ${selectedService.name} (₦${totalAmount}) successfully!`, 
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-1 sm:px-4">
      
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">New Daily Entry</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Process registrations and generate clearances.
          </p>
        </div>
        {/* Mobile Quick Summary Valuation */}
        <div className="sm:hidden premium-glass px-2.5 py-1 rounded-xl border border-[#F5C800]/20 text-right">
          <span className="text-[8px] font-bold text-slate-400 block uppercase">VALUATION</span>
          <span className="text-xs font-black text-emerald-400">₦{totalAmount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
        
        {/* Entry Form Column */}
        <div className="lg:col-span-2 premium-glass rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-slate-800/80 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Service Dropdown Selector */}
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>Select Service Category *</span>
                <span className="text-[#F5C800] font-extrabold text-[8px] cursor-pointer hover:underline" onClick={() => onViewChange('services')}>Manage Categories</span>
              </label>
              {categories.length > 0 ? (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition font-bold"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.toUpperCase()} - (₦{parseFloat(cat.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-200 text-center">
                  No active categories found. Please create one in Services first.
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Customer Full Name *
              </label>
              <input
                type="text"
                ref={customerInputRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition"
              />
            </div>

            {/* Phone contact & Qty row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#F5C800]" /> Phone Contact *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone Contact"
                  required
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  Quantity Units *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition text-center font-bold"
                />
              </div>

            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Officer Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="License plates, fleet particulars, or custom references..."
                rows="2"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 px-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800] transition resize-none"
              />
            </div>

            {/* Save trigger */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={formLoading || categories.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F5C800] to-[#EAB308] hover:from-[#FFD740] hover:to-[#F5C800] text-[#070a13] font-black py-3 rounded-xl shadow-lg shadow-[#F5C800]/10 text-xs uppercase transition disabled:opacity-50 select-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {formLoading ? 'Saving...' : 'Process & Post Entry'}
              </button>
            </div>

          </form>
        </div>

        {/* Live Calculation Panel (Right Column) - Made extremely compact */}
        <div className="space-y-3">
          
          {/* Amount Card */}
          <div className="premium-glass rounded-xl sm:rounded-2xl p-4 border border-slate-800 shadow-md relative overflow-hidden">
            <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase block mb-1">Scope Valuation</span>
            <h3 className="text-2xl font-black text-[#F5C800] tracking-tight">₦{totalAmount}</h3>
            
            <div className="divide-y divide-slate-800/60 text-[10px] mt-4 space-y-2">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Category Service:</span>
                <span className="font-bold text-slate-200 truncate max-w-[130px] text-right">{selectedService?.name || '—'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Unit Processing:</span>
                <span className="font-medium text-slate-200">₦{unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Volume Units:</span>
                <span className="font-bold text-slate-200">x{quantity}</span>
              </div>
              <div className="flex justify-between pt-2 text-[#F5C800] font-bold border-none">
                <span>Calculated Total:</span>
                <span className="font-black">₦{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Officer Session Stamp */}
          <div className="premium-glass rounded-xl sm:rounded-2xl p-4 border border-slate-800 shadow-md text-[10px] space-y-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold tracking-widest uppercase">
              <UserCheck className="w-3.5 h-3.5 text-[#F5C800]" />
              Journal Operator
            </div>
            <div className="flex justify-between border-t border-slate-800/40 pt-2">
              <span className="text-slate-400">Duty Officer:</span>
              <span className="font-bold text-slate-200">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Clearance:</span>
              <span className="font-bold text-emerald-400 uppercase text-[9px] flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> {currentUser.role}
              </span>
            </div>
          </div>

          {/* Quick Help Hints */}
          <div className="p-3 rounded-xl bg-slate-900/20 border border-slate-800 text-[9px] text-slate-400 leading-relaxed flex gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-[#F5C800] shrink-0" />
            <div>
              <span className="font-bold text-slate-300 block mb-0.5">Speed Workflow:</span>
              Entries instantly sync with ledger counts, reset custom fields, and ready the cursor for rapid consecutive inputs.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

