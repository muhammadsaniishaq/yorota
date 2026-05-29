// YOROTA Smart Office - Debtor Tracking System
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  UserX,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { db } from '../services/db';

export default function Debtors({ currentUser, setGlobalNotification }) {
  const [debtors, setDebtors] = useState([]);
  const [summary, setSummary] = useState({
    unpaidCount: 0,
    totalOwed: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Form State - Add Debtor
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Form State - Settle Payment
  const [payAmount, setPayAmount] = useState('');
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.debtors.getAll();
      const sum = await db.debtors.getSummary();
      setDebtors(data);
      setSummary(sum);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading debtors roster', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setName('');
    setPhone('');
    setAmount('');
    setDueDate('');
    setError('');
    setAddModalOpen(true);
  };

  const openPayModal = (debtor) => {
    setSelectedDebtor(debtor);
    setPayAmount(debtor.amount_owed.toString());
    setError('');
    setPayModalOpen(true);
  };

  const handleAddDebtor = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !amount || !dueDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Outstanding debt must be greater than ₦0.');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      await db.debtors.create({
        customer_name: name.trim(),
        phone_number: phone.trim(),
        amount_owed: parseFloat(amount),
        due_date: dueDate
      });

      setGlobalNotification({ message: `Successfully registered debt of ₦${parseFloat(amount).toFixed(2)} for ${name}`, type: 'success' });
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating debtor log.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePayDebtor = async (e) => {
    e.preventDefault();
    if (!payAmount || isNaN(parseFloat(payAmount)) || parseFloat(payAmount) <= 0) {
      setError('Payment must be a valid number greater than 0.');
      return;
    }
    if (parseFloat(payAmount) > selectedDebtor.amount_owed) {
      setError('Payment amount cannot exceed the total outstanding debt.');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      await db.debtors.recordPayment(
        selectedDebtor.id,
        parseFloat(payAmount),
        currentUser.name || 'Duty Officer'
      );

      setGlobalNotification({ 
        message: `Registered payment of ₦${parseFloat(payAmount).toFixed(2)} for ${selectedDebtor.customer_name}. Cash posted to ledger!`, 
        type: 'success' 
      });
      setPayModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error posting payment.');
    } finally {
      setFormLoading(false);
    }
  };

  // Search Filter
  const filteredDebtors = debtors.filter(d => 
    d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone_number.includes(search)
  );

  const getDueDateStatus = (dateStr, status) => {
    if (status === 'paid') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (due < today) return 'text-red-400 bg-red-500/10 border-red-500/20'; // Overdue
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20'; // Pending
  };

  return (
    <div className="space-y-4 px-1 sm:px-4">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">Debtors Registry</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Monitor credit balances and process repayments.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-extrabold hover:from-[#FFD740] hover:to-[#F5C800] shadow-md shadow-[#F5C800]/10 text-[10px] sm:text-xs transition cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5" />
          ADD DEBTOR
        </button>
      </div>

      {/* Summary outstanding widgets - compact grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        
        {/* Card 1: Debt amount */}
        <div className="premium-glass rounded-xl p-2.5 sm:p-4 flex items-center gap-2.5 border border-slate-800 shadow-sm">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
            <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Owed</span>
            <h2 className="text-xs sm:text-lg font-black text-red-500 mt-0.5">₦{summary.totalOwed.toFixed(2)}</h2>
          </div>
        </div>

        {/* Card 2: Count */}
        <div className="premium-glass rounded-xl p-2.5 sm:p-4 flex items-center gap-2.5 border border-slate-800 shadow-sm">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unpaid Roster</span>
            <h2 className="text-xs sm:text-lg font-black text-amber-500 mt-0.5">{summary.unpaidCount} <span className="text-[9px] font-normal text-slate-400">users</span></h2>
          </div>
        </div>

      </div>

      {/* Search toolbar */}
      <div className="relative bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 shadow-sm">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search debtor name or phone contact number..."
          className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-1.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
        />
      </div>

      {/* Data Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDebtors.length > 0 ? (
        <div className="space-y-2">
          
          {/* MOBILE RESPONSIVE COMPACT CARD VIEW (sm:hidden) */}
          <div className="block sm:hidden space-y-2">
            {filteredDebtors.map(deb => (
              <div key={deb.id} className="premium-glass p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#F5C800] text-[10px]">Due: {deb.due_date}</span>
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    deb.status === 'unpaid' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/10' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  }`}>
                    {deb.status === 'unpaid' ? 'UNPAID' : 'SETTLED'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <div>
                    <div className="font-bold text-slate-100">{deb.customer_name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{deb.phone_number}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-xs ${deb.status === 'unpaid' ? 'text-red-500' : 'text-emerald-500'}`}>
                      ₦{parseFloat(deb.amount_owed).toFixed(2)}
                    </div>
                    {deb.status === 'unpaid' && new Date(deb.due_date) < new Date().setHours(0,0,0,0) && (
                      <div className="text-[8px] text-red-400 font-extrabold mt-0.5">OVERDUE</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                  {deb.status === 'unpaid' ? (
                    <button
                      onClick={() => openPayModal(deb)}
                      className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition font-bold text-[10px] select-none cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      RECORD PAYMENT
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-400 inline-flex items-center gap-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> PAID
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TRADITIONAL TABULAR VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4">CUSTOMER NAME</th>
                  <th className="py-3.5 px-4">PHONE NUMBER</th>
                  <th className="py-3.5 px-4">OUTSTANDING BALANCE</th>
                  <th className="py-3.5 px-4">PAYMENT DUE DATE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">COLLECT PAYMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDebtors.map((deb) => (
                  <tr key={deb.id} className="hover:bg-secondary/20 transition">
                    <td className="py-4 px-4 font-bold text-slate-200">
                      {deb.customer_name}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-400">
                      {deb.phone_number}
                    </td>
                    <td className={`py-4 px-4 font-black ${deb.status === 'unpaid' ? 'text-red-500' : 'text-emerald-500'}`}>
                      ₦{parseFloat(deb.amount_owed).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getDueDateStatus(deb.due_date, deb.status)}`}>
                          {deb.due_date} {deb.status === 'unpaid' && new Date(deb.due_date) < new Date().setHours(0,0,0,0) && ' (OVERDUE)'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        deb.status === 'unpaid' 
                          ? 'bg-red-500/10 text-red-400' 
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {deb.status === 'unpaid' ? 'UNPAID' : 'SETTLED'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {deb.status === 'unpaid' ? (
                        <button
                          onClick={() => openPayModal(deb)}
                          className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition font-bold text-[10px]"
                        >
                          <CreditCard className="w-3 h-3" />
                          RECORD PAYMENT
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 inline-flex items-center gap-0.5">
                          <CheckCircle className="w-3.5 h-3.5" /> PAID
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 premium-glass border border-slate-800 rounded-xl flex flex-col items-center justify-center">
          <UserX className="w-8 h-8 text-slate-500 mb-2" />
          <p className="font-bold text-xs">No outstanding debtors registered</p>
          <p className="text-[10px] text-slate-500 mt-1">
            New outstanding client accounts will display here in real-time.
          </p>
        </div>
      )}

      {/* Modal - Add Debtor */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs">
            <h2 className="text-xs font-black text-slate-100 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
              <UserX className="w-4.5 h-4.5 text-red-500" />
              Register Outstanding Debt
            </h2>

            {error && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDebtor} className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number Contact *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Amount Owed (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#F5C800] transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase shadow-md shadow-red-500/10 transition cursor-pointer"
                >
                  {formLoading ? 'Saving...' : 'Register Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Settle Repayment */}
      {payModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs">
            <h2 className="text-xs font-black text-slate-100 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard className="w-4.5 h-4.5 text-emerald-500" />
              Collect Repayment Cash
            </h2>

            {error && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {error}
              </div>
            )}

            <form onSubmit={handlePayDebtor} className="space-y-3.5">
              <div className="p-2.5 bg-slate-950/60 rounded-xl text-xs space-y-1.5 border border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Debtor:</span>
                  <span className="font-bold text-slate-200">{selectedDebtor.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Owed:</span>
                  <span className="font-black text-red-500">₦{selectedDebtor.amount_owed.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Cash Repayment Amount (₦ Naira) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDebtor.amount_owed}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-black text-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Issuing Operator Stamp</span>
                <div className="flex items-center gap-1 font-bold text-slate-300 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-[#F5C800]" />
                  {currentUser.name}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-[10px] uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer"
                >
                  {formLoading ? 'Settling...' : 'Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

