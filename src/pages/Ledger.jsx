// YOROTA Smart Office - Office Ledger System
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Plus, 
  FileText,
  AlertCircle,
  HelpCircle,
  FolderMinus,
  FolderPlus
} from 'lucide-react';
import { db } from '../services/db';
import { pdfGenerator } from '../services/pdfGenerator';

export default function Ledger({ currentUser, setGlobalNotification }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remainingBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const txs = await db.transactions.getAll();
      const sum = await db.transactions.getBalanceSummary();
      setTransactions(txs);
      setSummary(sum);
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Error loading ledger logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (txType) => {
    setType(txType);
    setAmount('');
    setPurpose('');
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !purpose.trim()) {
      setError('Please fill in all transaction columns.');
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Transaction amount must be a number greater than 0.');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      await db.transactions.create({
        type,
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        collected_by: currentUser.name || 'Duty Officer'
      });

      setGlobalNotification({ 
        message: `Successfully logged ${type} transaction of $${parseFloat(amount).toFixed(2)}`, 
        type: 'success' 
      });
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while saving transaction.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePrintLedger = () => {
    try {
      pdfGenerator.generateFinancialSummary(summary, filteredTransactions);
      setGlobalNotification({ message: 'Office Ledger PDF summary downloaded.', type: 'success' });
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to generate Ledger PDF', type: 'error' });
    }
  };

  // Search filter
  const filteredTransactions = transactions.filter(t => 
    t.purpose.toLowerCase().includes(search.toLowerCase()) || 
    t.collected_by.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Office Cash Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Cash receipts, administrative expenditure audits, and net balance controls.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => openModal('expense')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 text-xs transition"
          >
            <FolderMinus className="w-4 h-4" />
            LOG EXPENSE
          </button>
          
          <button
            onClick={() => openModal('income')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20 text-xs transition"
          >
            <FolderPlus className="w-4 h-4" />
            LOG EXTERNAL INCOME
          </button>
        </div>
      </div>

      {/* Financial Ledger Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Balance */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Net Cash Balance</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black">${summary.remainingBalance.toFixed(2)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Remaining office cash assets</p>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Gross Income</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-emerald-500">${summary.totalIncome.toFixed(2)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Total revenue collected</p>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Office Expenses</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-red-500">${summary.totalExpenses.toFixed(2)}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Total operational outflows</p>
          </div>
        </div>

      </div>

      {/* Ledger Table controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border rounded-xl p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ledger by transaction details, collected by..."
            className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition"
          />
        </div>

        {/* Print Summary */}
        <button
          onClick={handlePrintLedger}
          disabled={filteredTransactions.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-bold text-xs transition disabled:opacity-50"
        >
          <FileText className="w-4 h-4" />
          EXPORT LEDGER PDF
        </button>

      </div>

      {/* Table Data */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4">DATE</th>
                  <th className="py-3.5 px-4">TRANSACTION TYPE</th>
                  <th className="py-3.5 px-4">PURPOSE / PARTICULARS</th>
                  <th className="py-3.5 px-4">AMOUNT</th>
                  <th className="py-3.5 px-4 text-right">LOGGED BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/20 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-400">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {tx.purpose}
                    </td>
                    <td className={`py-3.5 px-4 font-black ${
                      tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground font-medium">
                      {tx.collected_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
            <p className="font-semibold text-sm">No ledger entries found</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Adjust search keywords or add a manual cash record above.
            </p>
          </div>
        )}
      </div>

      {/* Manual Ledger Log Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              {type === 'income' ? (
                <FolderPlus className="w-5 h-5 text-emerald-500" />
              ) : (
                <FolderMinus className="w-5 h-5 text-red-500" />
              )}
              Log Office {type} Entry
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Cash Flow Amount ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Purpose / Particulars *
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={type === 'income' ? 'e.g. Licensing donor grants, auction revenues...' : 'e.g. Utility electricity, office water refills, printer ink replacements...'}
                  required
                  rows="3"
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#10b981] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Logged By (Security Stamp)
                </label>
                <input
                  type="text"
                  value={currentUser.name}
                  disabled
                  className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-xs text-muted-foreground select-none"
                />
              </div>

              {/* Tips block */}
              <div className="p-3 bg-secondary/40 border border-border text-[9px] text-muted-foreground leading-relaxed flex gap-1">
                <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Entering cash flow here impacts the net ledger assets instantly and appears in audits, but does not add daily registration files.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:bg-secondary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition ${
                    type === 'income'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-[#090d16] shadow-emerald-500/10'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10'
                  }`}
                >
                  {formLoading ? 'Logging...' : `Post ${type.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
