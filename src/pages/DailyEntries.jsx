// YOROTA Smart Office - Historical Daily Entries Log
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Calendar,
  User,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/db';
import { pdfGenerator } from '../services/pdfGenerator';

export default function DailyEntries({ setGlobalNotification }) {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Search States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const recs = await db.dailyRecords.getAll();
      const cats = await db.services.getAll();
      setRecords(recs);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading registry data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetailModal = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handlePrintReceipt = (record) => {
    try {
      pdfGenerator.generateReceipt(record);
      setGlobalNotification({ message: `Receipt downloaded for ${record.customer_name}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to generate PDF receipt', type: 'error' });
    }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                           r.phone_number.includes(search) ||
                           (r.notes && r.notes.toLowerCase().includes(search.toLowerCase())) ||
                           r.officer_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || r.service_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 px-1 sm:px-4">
      
      {/* Header section */}
      <div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">Registration Logs</h1>
        <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
          Archived records of processed registrations and permits.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 sm:p-4 shadow-sm">
        
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone, or officer..."
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
          />
        </div>

        {/* Dropdown Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-1.5 pl-8 pr-2 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition appearance-none font-bold"
          >
            <option value="all">ALL CATEGORIES</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Data Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="space-y-2">
          
          {/* MOBILE RESPONSIVE COMPACT CARD VIEW (sm:hidden) */}
          <div className="block sm:hidden space-y-2">
            {filteredRecords.map(rec => (
              <div key={rec.id} className="premium-glass p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#F5C800] text-[10px]">
                    {new Date(rec.created_at).toLocaleDateString()} {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-[#10b981]/10 text-emerald-400 border border-emerald-500/10 uppercase">
                    {rec.service?.name || 'Category'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <div>
                    <div className="font-bold text-slate-100">{rec.customer_name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{rec.phone_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-400 text-xs">₦{parseFloat(rec.amount).toFixed(2)}</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Officer: {rec.officer_name}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => openDetailModal(rec)}
                    className="px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 font-bold hover:bg-slate-800 transition"
                  >
                    View Info
                  </button>
                  <button
                    onClick={() => handlePrintReceipt(rec)}
                    className="px-2 py-1 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 text-[10px] text-emerald-400 font-bold hover:bg-[#10b981] hover:text-[#090d16] transition"
                  >
                    Receipt PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TRADITIONAL DATA TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                    <th className="py-3 px-4">DATE & TIME</th>
                    <th className="py-3 px-4">CUSTOMER DETAILS</th>
                    <th className="py-3 px-4">SERVICE CATEGORY</th>
                    <th className="py-3 px-4">QTY</th>
                    <th className="py-3 px-4">TOTAL CHARGE</th>
                    <th className="py-3 px-4">OFFICER</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px]">{new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{rec.customer_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{rec.phone_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/10 text-emerald-400 border border-emerald-500/10">
                          {rec.service?.name || 'Category'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-300">
                        {rec.quantity}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-500">
                        ₦{parseFloat(rec.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {rec.officer_name}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailModal(rec)}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-slate-200 hover:border-slate-400 transition"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(rec)}
                            className="p-1.5 rounded-lg border border-[#10b981]/20 bg-emerald-500/5 text-emerald-400 hover:bg-[#10b981] hover:text-[#090d16] transition"
                            title="Print PDF Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 premium-glass border border-slate-800 rounded-xl flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="font-bold text-xs">No entries recorded in journal</p>
          <p className="text-[10px] text-slate-500 mt-1">
            New registration records will display here in real-time.
          </p>
        </div>
      )}

      {/* Detail Modal Drawer */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#F5C800]" />
                Journal Entry Particulars
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              
              {/* Receipt Ticket Code */}
              <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="font-extrabold text-slate-500 uppercase tracking-widest text-[9px]">Receipt ID</span>
                <span className="font-black text-[#F5C800] tracking-wider">RTO-{selectedRecord.id.substring(2,8).toUpperCase()}</span>
              </div>

              {/* Timestamp & Operator */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">TIMESTAMP</span>
                  <div className="font-semibold text-slate-300">{new Date(selectedRecord.created_at).toLocaleString()}</div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">OPERATOR</span>
                  <div className="font-semibold text-slate-300">{selectedRecord.officer_name}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="space-y-2 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">CUSTOMER NAME</span>
                  <div className="font-bold text-slate-200">{selectedRecord.customer_name}</div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">PHONE CONTACT</span>
                  <div className="font-medium text-slate-300">{selectedRecord.phone_number}</div>
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-2">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Service Particulars</span>
                
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Category Type:</span>
                  <span className="font-bold text-slate-200">{selectedRecord.service?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Unit Price:</span>
                  <span className="font-medium text-slate-200">₦{(selectedRecord.amount / selectedRecord.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Volume Quantity:</span>
                  <span className="font-bold text-slate-200">x{selectedRecord.quantity}</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-400 font-bold">
                  <span>Settled Amount:</span>
                  <span className="font-black text-xs">₦{parseFloat(selectedRecord.amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div className="p-2.5 bg-slate-950/30 rounded-xl border border-slate-850">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block mb-1">Journal Officer Notes:</span>
                  <p className="italic text-slate-400 leading-relaxed text-[10px]">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-between pt-3.5 border-t border-slate-800 mt-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Close
                </button>
                
                <button
                  onClick={() => { handlePrintReceipt(selectedRecord); setModalOpen(false); }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-[10px] uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

