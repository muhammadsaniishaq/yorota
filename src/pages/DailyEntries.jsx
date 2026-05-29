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
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Registration Registry</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Comprehensive archives of processed permits, operating licenses, and officer journals.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-xl p-4 shadow-sm">
        
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records by customer name, phone, or officer..."
            className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
          />
        </div>

        {/* Dropdown Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition appearance-none"
          >
            <option value="all">ALL REGISTRATION TYPES</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Data Table Panel */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4">DATE & TIME</th>
                  <th className="py-3.5 px-4">CUSTOMER DETAILS</th>
                  <th className="py-3.5 px-4">SERVICE CATEGORY</th>
                  <th className="py-3.5 px-4">QTY</th>
                  <th className="py-3.5 px-4">TOTAL CHARGE</th>
                  <th className="py-3.5 px-4">OFFICER</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition">
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="font-semibold text-foreground">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px]">{new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{rec.customer_name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{rec.phone_number}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/10 text-emerald-400 border border-emerald-500/10">
                        {rec.service?.name || 'Category'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">
                      {rec.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-500">
                      ${parseFloat(rec.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">
                      {rec.officer_name}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(rec)}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-slate-200 hover:border-slate-400 transition"
                          title="View Ledger Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(rec)}
                          className="p-1.5 rounded-lg border border-[#10b981]/20 bg-emerald-500/5 text-emerald-400 hover:bg-[#10b981] hover:text-[#090d16] transition"
                          title="Print Clearance Receipt"
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
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
            <p className="font-semibold text-sm">No registry entries found</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Adjust filters or enter new entries using the daily form.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal Drawer */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-500" />
                Registry Journal Details
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Receipt Code Banner */}
              <div className="p-3 bg-secondary rounded-xl flex items-center justify-between border border-border">
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Registry Ticket</span>
                <span className="font-black text-emerald-500 tracking-wider">RTO-{selectedRecord.id.substring(2,8).toUpperCase()}</span>
              </div>

              {/* Grid rows */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Calendar className="w-3 h-3 text-emerald-500" /> TIMESTAMP</span>
                  <div className="font-medium text-slate-200">{new Date(selectedRecord.created_at).toLocaleString()}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><User className="w-3 h-3 text-emerald-500" /> RECORDED BY</span>
                  <div className="font-medium text-slate-200">{selectedRecord.officer_name}</div>
                </div>
              </div>

              <div className="space-y-3 p-3.5 bg-slate-900/30 border border-[#1f2937]/50 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><User className="w-3 h-3 text-emerald-500" /> CUSTOMER FULL NAME</span>
                  <div className="font-bold text-sm text-slate-100">{selectedRecord.customer_name}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> PHONE CONTACT</span>
                  <div className="font-medium text-slate-200">{selectedRecord.phone_number}</div>
                </div>
              </div>

              {/* Service Pricing Grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Service Particulars</span>
                
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Category Type:</span>
                  <span className="font-bold text-slate-200">{selectedRecord.service?.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Unit Processing Price:</span>
                  <span className="font-medium text-slate-200">${(selectedRecord.amount / selectedRecord.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Volume Units:</span>
                  <span className="font-bold text-slate-200">x{selectedRecord.quantity}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground font-bold">Total Settled Amount:</span>
                  <span className="font-black text-sm text-emerald-500">${parseFloat(selectedRecord.amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Note card */}
              {selectedRecord.notes && (
                <div className="p-3 bg-secondary/50 rounded-xl border border-border">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Officer Journal Notes:</span>
                  <p className="italic text-muted-foreground leading-relaxed">{selectedRecord.notes}</p>
                </div>
              )}

              {/* Modal Prints buttons */}
              <div className="flex gap-2 justify-between pt-4 border-t border-border mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary transition"
                >
                  Close Drawer
                </button>
                
                <button
                  onClick={() => { handlePrintReceipt(selectedRecord); setModalOpen(false); }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-bold text-xs shadow-md shadow-emerald-500/10 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt & Clearance PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
