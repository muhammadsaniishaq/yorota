// YOROTA Smart Office - Debtor Tracking System
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  DollarSign, 
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
      setError('Outstanding debt must be greater than $0.');
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

      setGlobalNotification({ message: `Successfully registered debt of $${parseFloat(amount).toFixed(2)} for ${name}`, type: 'success' });
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
        message: `Registered payment of $${parseFloat(payAmount).toFixed(2)} for ${selectedDebtor.customer_name}. Cash posted to ledger!`, 
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
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outstanding Debtor Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor credit balances, dispatch alerts, and process repayments.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/10 text-xs transition"
        >
          <Plus className="w-4 h-4" />
          ADD OUTSTANDING DEBTOR
        </button>
      </div>

      {/* Summary outstanding widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Debt amount */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase block">Total Outstanding Debts</span>
            <h2 className="text-2xl font-black text-red-500 mt-1">${summary.totalOwed.toFixed(2)}</h2>
          </div>
        </div>

        {/* Card 2: Count */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase block">Unpaid Roster Count</span>
            <h2 className="text-2xl font-black text-amber-500 mt-1">{summary.unpaidCount} <span className="text-xs font-normal text-muted-foreground">customers</span></h2>
          </div>
        </div>

      </div>

      {/* Search toolbar */}
      <div className="relative bg-card border border-border rounded-xl p-4 shadow-sm">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search debtors by full name or phone contact number..."
          className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-12 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
        />
      </div>

      {/* Roster table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDebtors.length > 0 ? (
          <div className="overflow-x-auto">
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
                      ${parseFloat(deb.amount_owed).toFixed(2)}
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
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
            <UserX className="w-8 h-8 text-slate-500 mb-2" />
            <p className="font-semibold text-sm">No debtors logged</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Add outstanding credit files using the trigger button above.
            </p>
          </div>
        )}
      </div>

      {/* Modal - Add Debtor */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <UserX className="w-5 h-5 text-red-500" />
              Register Outstanding Debt
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddDebtor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grace Nwosu"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Phone Number Contact *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 703 444 5555"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Amount Owed ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#10b981] transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/10 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Collect Repayment Cash
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handlePayDebtor} className="space-y-4">
              <div className="p-3 bg-secondary rounded-xl text-xs space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debtor:</span>
                  <span className="font-bold text-slate-200">{selectedDebtor.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Debt Owed:</span>
                  <span className="font-black text-red-500">${selectedDebtor.amount_owed.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Cash Repayment Amount ($ USD) *
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
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-[#10b981] transition font-black text-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Issuing Operator Stamp</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  {currentUser.name}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-extrabold text-xs shadow-md shadow-emerald-500/10 transition"
                >
                  {formLoading ? 'Processing...' : 'Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
