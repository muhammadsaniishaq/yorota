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
        message: `Successfully logged ${type} transaction of ₦${parseFloat(amount).toFixed(2)}`, 
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

  const handlePrintLedger = async () => {
    try {
      await pdfGenerator.generateFinancialSummary(summary, filteredTransactions);
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
    <div className="space-y-4 px-1 sm:px-4">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">Office Ledger</h1>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
            Cash receipts, administrative expenditure audits, and net balance controls.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={() => openModal('expense')}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold border border-red-500/20 text-[10px] sm:text-xs transition cursor-pointer select-none"
          >
            <FolderMinus className="w-3.5 h-3.5" />
            LOG EXPENSE
          </button>
          
          <button
            onClick={() => openModal('income')}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/20 text-[10px] sm:text-xs transition cursor-pointer select-none"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            LOG INCOME
          </button>
        </div>
      </div>

      {/* Financial Ledger Metric Cards - Highly compact 3 columns on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        
        {/* Card 1: Balance */}
        <div className="premium-glass rounded-xl p-2 sm:p-4 flex items-center justify-between border border-slate-800 shadow-sm relative overflow-hidden">
          {/* Mobile View */}
          <div className="flex sm:hidden flex-col w-full">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Balance</span>
            <h2 className="text-xs font-black text-slate-100 mt-0.5">₦{summary.remainingBalance.toFixed(2)}</h2>
          </div>
          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Net Balance</span>
              <div className="p-1.5 rounded-lg bg-[#F5C800]/10 text-[#F5C800]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-black text-slate-100">₦{summary.remainingBalance.toFixed(2)}</h2>
              <p className="text-[9px] text-slate-500 mt-0.5">Remaining cash assets</p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="premium-glass rounded-xl p-2 sm:p-4 flex items-center justify-between border border-slate-800 shadow-sm">
          {/* Mobile View */}
          <div className="flex sm:hidden flex-col w-full">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Gross In</span>
            <h2 className="text-xs font-black text-emerald-400 mt-0.5">₦{summary.totalIncome.toFixed(2)}</h2>
          </div>
          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Gross Income</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-black text-emerald-500">₦{summary.totalIncome.toFixed(2)}</h2>
              <p className="text-[9px] text-slate-500 mt-0.5">Gross collections</p>
            </div>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="premium-glass rounded-xl p-2 sm:p-4 flex items-center justify-between border border-slate-800 shadow-sm">
          {/* Mobile View */}
          <div className="flex sm:hidden flex-col w-full">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block truncate">Expenses</span>
            <h2 className="text-xs font-black text-red-500 mt-0.5">₦{summary.totalExpenses.toFixed(2)}</h2>
          </div>
          {/* Desktop View */}
          <div className="hidden sm:flex flex-col justify-between h-full w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Total Expenses</span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-black text-red-500">₦{summary.totalExpenses.toFixed(2)}</h2>
              <p className="text-[9px] text-slate-500 mt-0.5">Office outflows</p>
            </div>
          </div>
        </div>

      </div>

      {/* Ledger Table Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 sm:p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search particulars or officer..."
            className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
          />
        </div>

        {/* Print Summary */}
        <button
          onClick={handlePrintLedger}
          disabled={filteredTransactions.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs transition disabled:opacity-50 select-none cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          EXPORT LEDGER PDF
        </button>

      </div>

      {/* Table Data Section */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#F5C800] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          
          {/* MOBILE RESPONSIVE COMPACT CARD VIEW (sm:hidden) */}
          <div className="block sm:hidden space-y-2">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="premium-glass p-3 rounded-xl border border-slate-800 space-y-2 text-xs shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-400 text-[9px]">{tx.date}</span>
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    tx.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/10'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-100 truncate pr-2">{tx.purpose}</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Logged by: {tx.collected_by}</div>
                  </div>
                  <div className={`font-black text-xs shrink-0 ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}₦{parseFloat(tx.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TRADITIONAL TABLE VIEW (hidden sm:block) */}
          <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-bold">
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">TRANSACTION TYPE</th>
                  <th className="py-3 px-4">PURPOSE / PARTICULARS</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4 text-right">LOGGED BY</th>
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
                      {tx.type === 'income' ? '+' : '-'}₦{parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground font-medium">
                      {tx.collected_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 premium-glass border border-slate-800 rounded-xl flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
          <p className="font-bold text-xs">No transactions in ledger</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Manual cash receipts or outflows will display here in real-time.
          </p>
        </div>
      )}

      {/* Manual Ledger Log Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 relative text-xs">
            <h2 className="text-xs font-black text-slate-100 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              {type === 'income' ? (
                <FolderPlus className="w-4 h-4 text-emerald-500" />
              ) : (
                <FolderMinus className="w-4 h-4 text-red-500" />
              )}
              Log Ledger {type}
            </h2>

            {error && (
              <div className="mb-3.5 p-2 rounded bg-red-950/40 border border-red-500/20 text-red-200 text-[10px]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Cash Flow Amount ($) *
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
                  Particulars / Description *
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={type === 'income' ? 'Describe income details...' : 'Describe expenditure details...'}
                  required
                  rows="2"
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Security Operator stamp
                </label>
                <input
                  type="text"
                  value={currentUser.name}
                  disabled
                  className="w-full bg-slate-950/20 border border-slate-850 rounded-xl py-2 px-3 text-xs text-slate-500 select-none font-bold"
                />
              </div>

              <div className="p-2 bg-slate-950/40 rounded border border-slate-850 text-[9px] text-slate-400 flex gap-1.5 leading-relaxed">
                <HelpCircle className="w-3.5 h-3.5 text-[#F5C800] shrink-0" />
                <span>Impacts cash assets instantly and appears in audits, but does not alter customer registries.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-950 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md transition cursor-pointer select-none ${
                    type === 'income'
                      ? 'bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13]'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {formLoading ? 'Posting...' : `Post ${type}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

