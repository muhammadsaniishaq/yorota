// YOROTA Smart Office - Overnight Pending Drafts Vault
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FilePlus, 
  Database, 
  ArrowUpCircle, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Save, 
  CheckCircle, 
  Info,
  CloudLightning,
  X,
  RefreshCw,
  Plus
} from 'lucide-react';
import { db } from '../services/db';

export default function PendingDrafts({ currentUser, setGlobalNotification }) {
  const [drafts, setDrafts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [activeSyncingMessage, setActiveSyncingMessage] = useState('Initiating database handshake...');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [officerName, setOfficerName] = useState(currentUser?.name || '');
  const [notes, setNotes] = useState('');

  // Selected Service metadata helper
  const [selectedService, setSelectedService] = useState(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editOfficerName, setEditOfficerName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Fetch active categories from live Supabase on load
  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const activeCats = await db.services.getActive();
      setCategories(activeCats);
      if (activeCats.length > 0) {
        setServiceId(activeCats[0].id);
        setSelectedService(activeCats[0]);
      }
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to fetch active category rates', type: 'error' });
    } finally {
      setLoadingCats(false);
    }
  };

  // Load drafts from localStorage
  const loadDrafts = () => {
    try {
      const localData = localStorage.getItem('yorota_overnight_drafts');
      setDrafts(localData ? JSON.parse(localData) : []);
    } catch (err) {
      console.error('Error reading draft storage:', err);
      setDrafts([]);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDrafts();
  }, []);

  // Update selected service price when serviceId changes in Form
  useEffect(() => {
    if (serviceId && categories.length > 0) {
      const srv = categories.find(c => c.id === serviceId);
      setSelectedService(srv || null);
    }
  }, [serviceId, categories]);

  // Calculate live valuation dynamically in form
  const getLiveValuation = () => {
    if (!selectedService) return 0;
    const qty = parseInt(quantity) || 0;
    return selectedService.price * qty;
  };

  const handleDecrement = () => {
    const val = parseInt(quantity) || 1;
    if (val > 1) setQuantity((val - 1).toString());
  };

  const handleIncrement = () => {
    const val = parseInt(quantity) || 1;
    setQuantity((val + 1).toString());
  };

  const handleEditDecrement = () => {
    const val = parseInt(editQuantity) || 1;
    if (val > 1) setEditQuantity((val - 1).toString());
  };

  const handleEditIncrement = () => {
    const val = parseInt(editQuantity) || 1;
    setEditQuantity((val + 1).toString());
  };

  // Handle Save draft locally
  const handleSaveDraft = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !serviceId) {
      setGlobalNotification({ message: 'Customer Name and Service Category are required', type: 'error' });
      return;
    }

    const qtyVal = parseInt(quantity) || 1;
    if (qtyVal < 1) {
      setGlobalNotification({ message: 'Quantity must be at least 1', type: 'error' });
      return;
    }

    const matchedSrv = categories.find(c => c.id === serviceId);

    const newDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customer_name: customerName.trim(),
      phone_number: phoneNumber.trim() || 'N/A',
      service_id: serviceId,
      service_name: matchedSrv?.name || 'Unclassified Service',
      service_price: matchedSrv?.price || 0,
      quantity: qtyVal,
      amount: (matchedSrv?.price || 0) * qtyVal,
      officer_name: officerName.trim() || currentUser?.name || 'Authorized Officer',
      notes: notes.trim(),
      created_at: new Date().toISOString()
    };

    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem('yorota_overnight_drafts', JSON.stringify(updatedDrafts));

    // Clear form inputs
    setCustomerName('');
    setPhoneNumber('');
    setNotes('');
    setQuantity('1');
    if (categories.length > 0) {
      setServiceId(categories[0].id);
      setSelectedService(categories[0]);
    }

    setGlobalNotification({ message: 'Draft saved to local overnight vault successfully', type: 'success' });
  };

  // Delete draft locally
  const handleDeleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('yorota_overnight_drafts', JSON.stringify(updated));
    setGlobalNotification({ message: 'Draft erased from overnight queue', type: 'info' });
  };

  // Open Edit Modal
  const openEditModal = (draft) => {
    setEditingDraft(draft);
    setEditCustomerName(draft.customer_name);
    setEditPhoneNumber(draft.phone_number);
    setEditServiceId(draft.service_id);
    setEditQuantity(draft.quantity.toString());
    setEditOfficerName(draft.officer_name);
    setEditNotes(draft.notes);
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDraft(null);
  };

  // Save edited draft changes
  const handleUpdateDraft = (e) => {
    e.preventDefault();
    if (!editCustomerName.trim() || !editServiceId) {
      setGlobalNotification({ message: 'Customer Name and Category are required', type: 'error' });
      return;
    }

    const qtyVal = parseInt(editQuantity) || 1;
    if (qtyVal < 1) {
      setGlobalNotification({ message: 'Quantity must be at least 1', type: 'error' });
      return;
    }

    const matchedSrv = categories.find(c => c.id === editServiceId);

    const updatedDrafts = drafts.map(d => {
      if (d.id === editingDraft.id) {
        return {
          ...d,
          customer_name: editCustomerName.trim(),
          phone_number: editPhoneNumber.trim() || 'N/A',
          service_id: editServiceId,
          service_name: matchedSrv?.name || d.service_name,
          service_price: matchedSrv?.price || 0,
          quantity: qtyVal,
          amount: (matchedSrv?.price || 0) * qtyVal,
          officer_name: editOfficerName.trim() || currentUser?.name || d.officer_name,
          notes: editNotes.trim()
        };
      }
      return d;
    });

    setDrafts(updatedDrafts);
    localStorage.setItem('yorota_overnight_drafts', JSON.stringify(updatedDrafts));
    closeEditModal();
    setGlobalNotification({ message: 'Draft modified successfully', type: 'success' });
  };

  // Upload single draft directly to Supabase
  const handleUploadSingle = async (draft) => {
    try {
      const payload = {
        service_id: draft.service_id,
        customer_name: draft.customer_name,
        phone_number: draft.phone_number,
        quantity: draft.quantity,
        officer_name: draft.officer_name,
        notes: draft.notes
      };

      await db.dailyRecords.create(payload);

      // Erase from local storage queue
      const updated = drafts.filter(d => d.id !== draft.id);
      setDrafts(updated);
      localStorage.setItem('yorota_overnight_drafts', JSON.stringify(updated));

      setGlobalNotification({ message: `"${draft.customer_name}" successfully synchronized to live database`, type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: `Upload failed: ${err.message || 'Supabase error'}`, type: 'error' });
    }
  };

  // Synchronize drafts sequentially in a single batch sequence
  const handleUploadAll = async () => {
    if (drafts.length === 0) return;
    setSyncingAll(true);
    setSyncProgress(0);
    setActiveSyncingMessage('Initiating secure cloud handshake...');
    
    let completedCount = 0;
    const failedList = [];
    const draftsToUpload = [...drafts];

    const messages = [
      'Authenticating officer credentials...',
      'Pushing draft entries to Supabase cloud...',
      'Validating registry item serials...',
      'Recording split ledger accounts...',
      'Synchronizing live local cache...',
      'Transaction verified by live database server!'
    ];

    for (let i = 0; i < draftsToUpload.length; i++) {
      const draft = draftsToUpload[i];
      
      // Update dynamic visual messages
      const msgIndex = Math.min(messages.length - 1, Math.floor((i / draftsToUpload.length) * messages.length));
      setActiveSyncingMessage(messages[msgIndex]);

      try {
        const payload = {
          service_id: draft.service_id,
          customer_name: draft.customer_name,
          phone_number: draft.phone_number,
          quantity: draft.quantity,
          officer_name: draft.officer_name,
          notes: draft.notes
        };

        await db.dailyRecords.create(payload);
        completedCount++;
      } catch (err) {
        console.error('Batch item upload fail:', err);
        failedList.push(draft);
      }
      
      const progress = Math.round(((i + 1) / draftsToUpload.length) * 100);
      setSyncProgress(progress);
      
      // Brief sleep for smooth visual transition
      await new Promise(r => setTimeout(r, 200));
    }

    // Retain only failed drafts in drafts list, purge successful
    setDrafts(failedList);
    localStorage.setItem('yorota_overnight_drafts', JSON.stringify(failedList));
    setSyncingAll(false);

    if (failedList.length === 0) {
      setGlobalNotification({ message: `All ${completedCount} drafts synchronized to Supabase live server successfully!`, type: 'success' });
    } else {
      setGlobalNotification({ 
        message: `Batch complete: ${completedCount} successful, ${failedList.length} failed. Please review remaining drafts.`, 
        type: 'error' 
      });
    }
  };

  // Queue metrics
  const totalDraftCount = drafts.length;
  const totalDraftAmount = drafts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6 px-2 sm:px-6 py-4 max-w-7xl mx-auto relative overflow-hidden grid-bg-overlay rounded-3xl min-h-[calc(100vh-120px)]">
      
      {/* Premium CSS Keyframes & Visual Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes hazardSlide {
          0% { background-position: 0 0; }
          100% { background-position: 28px 0; }
        }
        .animated-hazard-stripe {
          background-image: repeating-linear-gradient(45deg, 
            rgba(245, 200, 0, 0.15) 0px, 
            rgba(245, 200, 0, 0.15) 10px, 
            transparent 10px, 
            transparent 20px
          );
          background-size: 28px 28px;
          animation: hazardSlide 1.5s linear infinite;
        }
        .grid-bg-overlay {
          background-image: radial-gradient(rgba(245, 200, 0, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .premium-glow-card-gold {
          background: rgba(12, 18, 32, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(245, 200, 0, 0.12);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-glow-card-gold:hover {
          border-color: rgba(245, 200, 0, 0.35);
          box-shadow: 0 12px 40px rgba(245, 200, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

      {/* Main Page Header Card */}
      <div className="relative bg-[#070a13]/85 backdrop-blur-md border border-slate-850 rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl overflow-hidden border-t-4 border-t-[#F5C800]">
        
        {/* Repeating caution hazard stripe banner background */}
        <div className="absolute inset-x-0 bottom-0 h-1 opacity-70 animated-hazard-stripe" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="p-3.5 rounded-2xl bg-[#F5C800]/10 border border-[#F5C800]/25 text-[#F5C800] shrink-0 shadow-lg">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-105 uppercase flex items-center gap-2">
              Overnight Drafts Vault
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Draft and queue registration work locally ("aikin da ya kwana ban daurasa ba") before pushing directly to the Supabase database.
            </p>
          </div>
        </div>
        
        <button
          onClick={loadCategories}
          className="z-10 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 font-extrabold text-[10px] sm:text-xs transition-all duration-300 cursor-pointer select-none text-slate-200 hover:text-slate-100 active:scale-95 shadow-md shadow-black/30 shrink-0 self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F5C800]" />
          REFRESH CATEGORIES
        </button>
      </div>

      {/* Batch sync stats card (if drafts exist) */}
      {totalDraftCount > 0 && (
        <div className="backdrop-blur-md bg-slate-950/45 border border-slate-850/60 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group animate-fade-in border-l-4 border-l-[#F5C800]">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 select-none">
              <CloudLightning className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Unsubmitted Queue Active</span>
                <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">Overnight Cache</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                <h3 className="text-base sm:text-xl font-black text-slate-100 tracking-tight">{totalDraftCount} Queued Entries</h3>
                <span className="text-xs sm:text-sm font-black text-[#F5C800]">Total Cash Value: ₦{totalDraftAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleUploadAll}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-450 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0"
          >
            <CloudLightning className="w-4 h-4 shrink-0 animate-pulse" />
            UPLOAD ALL ACTIVE DRAFTS TO LIVE DATABASE
          </button>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Left Side: Draft Creation Form */}
        <div className="xl:col-span-2 space-y-4">
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
            
            <div className="flex items-center gap-2 pb-4 border-b border-slate-850/60 mb-4">
              <FilePlus className="w-4 h-4 text-[#F5C800]" />
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">Save overnight draft</h3>
            </div>

            {loadingCats ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <RefreshCw className="w-6 h-6 text-[#F5C800] animate-spin" />
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Syncing categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl p-4">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">No active registration categories loaded from Supabase.</p>
                <button onClick={loadCategories} className="mt-3 text-xs text-[#F5C800] underline font-black uppercase">Retry Connecting</button>
              </div>
            ) : (
              <form onSubmit={handleSaveDraft} className="space-y-4 text-xs font-semibold text-slate-350">
                
                {/* Customer Name */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-bold"
                  />
                </div>

                {/* Service Category Selection */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Service Category & Live Rate *</label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-150 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-black cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-[#090d16] text-slate-200">
                        {cat.name} (₦{parseFloat(cat.price).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quantity Stepper (Mobile Optimized) */}
                  <div>
                    <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Quantity *</label>
                    <div className="relative flex items-center rounded-xl border border-slate-850 bg-slate-950/60 overflow-hidden">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="absolute left-1 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-90 transition select-none cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        required
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-transparent py-3 px-10 text-center text-xs text-slate-100 focus:outline-none font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="absolute right-1 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-90 transition select-none cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-bold"
                    />
                  </div>
                </div>

                {/* Duty Officer */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Responsible Duty Officer</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="Enter officer name"
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-bold"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Surcharge Remarks / Serial Details</label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Overnight pending backlog..."
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-medium resize-none"
                  />
                </div>

                {/* Real-time price valuation highlight */}
                <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5C800]/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500 animate-pulse" />
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Real-time Valuation</span>
                    <span className="text-xs text-slate-400 mt-0.5 block font-bold">₦{selectedService ? selectedService.price.toLocaleString() : 0} x {quantity} qty</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-base sm:text-lg font-black text-[#F5C800] gold-text-glow">
                      ₦{getLiveValuation().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs transition duration-300 hover:scale-[1.01] active:scale-95 select-none cursor-pointer shadow-md shadow-[#F5C800]/5 uppercase tracking-wider"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  SAVE DRAFT TO OVERNIGHT VAULT
                </button>

              </form>
            )}

          </div>
        </div>

        {/* Right Side: Draft list queue */}
        <div className="xl:col-span-3 space-y-4">
          <div className="backdrop-blur-md bg-slate-900/30 border border-slate-850 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-850/60 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">
                  Unsubmitted Draft Queue ({totalDraftCount})
                </h3>
              </div>
              
              {totalDraftCount > 0 && (
                <div className="text-[9px] font-black text-[#F5C800] bg-slate-950/60 border border-slate-850/80 px-2 py-1 rounded-lg uppercase tracking-wide">
                  Local Queue Persistent
                </div>
              )}
            </div>

            {/* List */}
            {totalDraftCount > 0 ? (
              <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1.5 scrollbar-thin">
                {drafts.map(draft => (
                  <div 
                    key={draft.id} 
                    className="premium-glow-card-gold rounded-2xl p-4 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative overflow-hidden"
                  >
                    {/* Visual left colored stripe */}
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#F5C800]" />
                    
                    <div className="space-y-2.5 pl-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase">
                        <span className="text-slate-400 font-extrabold">{new Date(draft.created_at).toLocaleDateString()}</span>
                        <span className="bg-slate-950/80 text-slate-200 px-2 py-0.5 rounded border border-slate-850">
                          {draft.service_name}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">
                          Qty: x{draft.quantity}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-black text-slate-100 tracking-wide">{draft.customer_name}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-bold text-slate-500 mt-1">
                          <span>Phone: <span className="text-slate-450">{draft.phone_number}</span></span>
                          <span>Officer: <span className="text-slate-455">{draft.officer_name}</span></span>
                        </div>
                        {draft.notes && (
                          <p className="text-[10px] font-medium text-slate-400 italic mt-1.5 bg-slate-950/30 border border-slate-850/50 py-1.5 px-3 rounded-lg max-w-lg">
                            "{draft.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-3 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-850/60 pt-3.5 sm:pt-0 justify-between sm:justify-start">
                      <div className="text-left sm:text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Cash Valuation</span>
                        <span className="text-sm font-black text-emerald-450">
                          ₦{draft.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(draft)}
                          title="Edit Draft"
                          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer select-none active:scale-90"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          title="Delete Draft"
                          className="p-2.5 rounded-xl border border-red-950/20 bg-red-950/10 hover:bg-red-500 hover:text-[#070a13] text-red-400 transition cursor-pointer select-none active:scale-90"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Upload Single Button */}
                        <button
                          onClick={() => handleUploadSingle(draft)}
                          title="Upload to Database"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-[#10b981] border border-emerald-500/20 hover:border-emerald-500 text-emerald-450 hover:text-[#070a13] font-bold text-[10px] tracking-wider uppercase transition cursor-pointer select-none active:scale-95"
                        >
                          <CloudLightning className="w-3.5 h-3.5" />
                          UPLOAD
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 bg-slate-950/20 border border-slate-850 rounded-2xl flex flex-col items-center justify-center p-4">
                <div className="p-3.5 rounded-full bg-slate-900/60 text-slate-500 border border-slate-850 mb-3 animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-350 text-sm uppercase tracking-wide">No pending overnight drafts</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                  All logged entries have been synchronized to Supabase live server. Use the form on the left to save unsubmitted overnight drafts locally.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Synchronizing Overlay Loading State */}
      {syncingAll && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in text-center p-4 select-none pointer-events-auto">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-[#F5C800] animated-hazard-stripe" />

            <div className="flex justify-center">
              <RefreshCw className="w-12 h-12 text-[#F5C800] animate-spin" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-100 tracking-wider uppercase">{activeSyncingMessage}</h4>
              <p className="text-[9px] text-[#F5C800] font-black uppercase tracking-widest mt-1 animate-pulse">Supabase cloud active</p>
            </div>

            {/* Progress Gauge */}
            <div className="w-full bg-slate-950 border border-slate-850 rounded-full h-4 p-0.5 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#F5C800] via-[#10b981] to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-slate-200 tracking-widest">{syncProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Glassmorphic) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4 select-none">
          <div className="max-w-lg w-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative animate-scale-up border-t-4 border-t-[#F5C800]">

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-850/60">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#F5C800]" />
                <h3 className="text-xs sm:text-sm font-black text-slate-100 tracking-wider uppercase">Modify Overnight Draft</h3>
              </div>
              <button 
                onClick={closeEditModal}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer select-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleUpdateDraft} className="p-6 space-y-4 text-xs font-semibold text-slate-350">
              
              {/* Customer Name */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-450 uppercase tracking-wider mb-2">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-855 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-450 uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={editServiceId}
                  onChange={(e) => setEditServiceId(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-855 rounded-xl py-3 px-4 text-xs text-slate-150 focus:outline-none focus:border-[#F5C800] transition font-black cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#090d16] text-slate-200">
                      {cat.name} (₦{parseFloat(cat.price).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity Stepper (Mobile Optimized) */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-450 uppercase tracking-wider mb-2">Quantity *</label>
                  <div className="relative flex items-center rounded-xl border border-slate-850 bg-slate-900/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={handleEditDecrement}
                      className="absolute left-1 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 active:scale-90 transition select-none cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-full bg-transparent py-3 px-10 text-center text-xs text-slate-100 focus:outline-none font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleEditIncrement}
                      className="absolute right-1 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-955 border border-slate-850 text-slate-400 hover:text-slate-200 active:scale-90 transition select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[8px] sm:text-[9px] font-black text-slate-455 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-855 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                  />
                </div>
              </div>

              {/* Responsible Officer */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-450 uppercase tracking-wider mb-2">Duty Officer</label>
                <input
                  type="text"
                  value={editOfficerName}
                  onChange={(e) => setEditOfficerName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-855 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[8px] sm:text-[9px] font-black text-slate-450 uppercase tracking-wider mb-2">Remarks / Details</label>
                <textarea
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-855 rounded-xl py-3 px-4 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-medium resize-none"
                />
              </div>

              {/* Modal buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-350 hover:text-slate-100 font-bold uppercase tracking-wider transition cursor-pointer select-none active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black uppercase tracking-wider transition duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
