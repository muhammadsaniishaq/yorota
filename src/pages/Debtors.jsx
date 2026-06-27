// YOROTA Smart Office - Debtor Tracking System with Dynamic Balance Adjustment
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
  UserCheck,
  History,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  MinusCircle,
  X,
  MessageSquare,
  Printer,
  Bluetooth,
  Trash
} from 'lucide-react';
import { db } from '../services/db';
import { pdfGenerator } from '../services/pdfGenerator';

export default function Debtors({ currentUser, setGlobalNotification }) {
  const [debtors, setDebtors] = useState([]);
  const [summary, setSummary] = useState({
    unpaidCount: 0,
    totalOwed: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [useThermalPref, setUseThermalPref] = useState(() => {
    return localStorage.getItem('yorota_pref_thermal_print') === 'true';
  });

  const handleToggleThermalPref = (e) => {
    const checked = e.target.checked;
    setUseThermalPref(checked);
    localStorage.setItem('yorota_pref_thermal_print', checked ? 'true' : 'false');
  };

  // Expanded / Toggleable History State (stores debtor IDs)
  const [expandedHistories, setExpandedHistories] = useState({});

  // Bluetooth Printer States
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('Disconnected');
  const [printerName, setPrinterName] = useState(localStorage.getItem('yorota_last_printer_name') || '');
  const [isPrinterScanning, setIsPrinterScanning] = useState(false);

  // Modals States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [addDebtModalOpen, setAddDebtModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Form State - Add New Debtor Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Form State - Settle Repayment (Deduct Balance)
  const [payAmount, setPayAmount] = useState('');
  
  // Form State - Add Debt (Increase Balance)
  const [addDebtAmount, setAddDebtAmount] = useState('');
  const [addDebtReason, setAddDebtReason] = useState('');
  const [addDebtOfficer, setAddDebtOfficer] = useState(currentUser?.name || '');

  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletePin, setDeletePin] = useState('');

  const handleSendReminder = (debtor) => {
    const rawPhone = debtor.phone_number.replace(/\D/g, ''); // strip non-digits
    // Standardize to international format (234 for Nigeria) if starts with 0
    const formattedPhone = rawPhone.startsWith('0') ? `234${rawPhone.substring(1)}` : rawPhone;
    
    const message = `Assalamu alaikum, a polite reminder from *YOROTA Smart Office*.\n\nDear *${debtor.customer_name}*, this is a friendly notification regarding your outstanding credit balance of *₦${parseFloat(debtor.amount_owed).toLocaleString(undefined, {minimumFractionDigits: 2})}*.\n\nYour scheduled payment settlement is due on *${debtor.due_date}*. Please arrange for prompt payment at your earliest convenience.\n\nThank you for your cooperation!`;
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setGlobalNotification({ message: `Pre-filled WhatsApp reminder opened for ${debtor.customer_name}!`, type: 'info' });
  };

  const handlePrintPastReceipt = async (debtor, hist, format = 'a4') => {
    try {
      const isPay = hist.amount_paid !== undefined;
      const txPayload = {
        type: isPay ? 'repayment' : 'accrual',
        amount: isPay ? hist.amount_paid : hist.amount_added,
        date: hist.date,
        reason: hist.reason || (isPay ? 'Cash settlement repayment' : 'Accrued credit addition'),
        received_by: hist.received_by || 'Staff Officer',
        updatedBalance: debtor.amount_owed
      };
      if (format === 'thermal') {
        pdfGenerator.printDebtorThermalSlip(debtor, txPayload);
        setGlobalNotification({ message: 'Sending past receipt to thermal printer...', type: 'info' });
      } else {
        await pdfGenerator.generateDebtorReceipt(debtor, txPayload);
        setGlobalNotification({ message: 'Compiling past standard receipt PDF...', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setGlobalNotification({ message: 'Failed to generate PDF: ' + err.message, type: 'error' });
    }
  };


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
    // Try to silently auto-connect to previously paired printer
    if (pdfGenerator.isBlePrinterConnected()) {
      setPrinterStatus('Connected');
      setPrinterName(pdfGenerator.activeBleDevice?.name || 'Generic BT Printer');
    } else {
      pdfGenerator.tryAutoConnectBlePrinter().then(name => {
        if (name) {
          setPrinterStatus('Connected');
          setPrinterName(name);
          setGlobalNotification({ message: `Auto-reconnected to Bluetooth printer: ${name}`, type: 'success' });
        }
      });
    }
  }, []);

  const handleConnectPrinter = async () => {
    setIsPrinterScanning(true);
    setError('');
    try {
      const name = await pdfGenerator.connectBlePrinter();
      setPrinterStatus('Connected');
      setPrinterName(name);
      setGlobalNotification({ message: `Successfully connected to printer: ${name}!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Bluetooth connection failed or cancelled.');
    } finally {
      setIsPrinterScanning(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    try {
      await pdfGenerator.disconnectBlePrinter();
      setPrinterStatus('Disconnected');
      setPrinterName('');
      setGlobalNotification({ message: 'Disconnected Bluetooth printer.', type: 'info' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error disconnecting printer.');
    }
  };

  const handlePrintTestSlip = async () => {
    try {
      await pdfGenerator.printBleTestSlip();
      setGlobalNotification({ message: 'Test slip printed successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to print test slip.');
    }
  };

  const toggleHistory = (debtorId) => {
    setExpandedHistories(prev => ({
      ...prev,
      [debtorId]: !prev[debtorId]
    }));
  };

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

  const openAddDebtModal = (debtor) => {
    setSelectedDebtor(debtor);
    setAddDebtAmount('');
    setAddDebtReason('');
    setAddDebtOfficer(currentUser?.name || '');
    setError('');
    setAddDebtModalOpen(true);
  };

  const openEditModal = (debtor) => {
    setSelectedDebtor(debtor);
    setName(debtor.customer_name);
    setPhone(debtor.phone_number);
    setDueDate(debtor.due_date || '');
    setError('');
    setEditModalOpen(true);
  };

  const openDeleteModal = (debtor) => {
    setSelectedDebtor(debtor);
    setDeletePin('');
    setError('');
    setDeleteModalOpen(true);
  };

  const handleDeleteDebtor = async (e) => {
    e.preventDefault();
    if (deletePin !== '1234') {
      setError('Incorrect Security PIN.');
      return;
    }
    setFormLoading(true);
    setError('');
    try {
      await db.debtors.delete(selectedDebtor.id);
      setGlobalNotification({ message: `Deleted account for ${selectedDebtor.customer_name}`, type: 'success' });
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditDebtor = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !dueDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    setFormLoading(true);
    setError('');
    try {
      await db.debtors.updateInfo(selectedDebtor.id, {
        customer_name: name.trim(),
        phone_number: phone.trim(),
        due_date: dueDate
      });
      setGlobalNotification({ message: `Updated profile for ${name}`, type: 'success' });
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error updating debtor info.');
    } finally {
      setFormLoading(false);
    }
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

    let printWindow = null;
    if (useThermalPref) {
      printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>YOROTA Print Connector</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                padding: 30px 15px;
                color: #e2e8f0;
                background-color: #0f172a;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80vh;
              }
              .card {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                max-width: 280px;
              }
              .spinner {
                margin: 20px auto;
                width: 45px;
                height: 45px;
                border: 4px solid #334155;
                border-top: 4px solid #10b981;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 { font-size: 15px; margin: 12px 0 6px 0; font-weight: 700; color: #fff; }
              p { font-size: 11px; color: #94a3b8; line-height: 1.4; margin: 4px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2>Processing Ledger Transaction</h2>
              <p>Please wait while the transaction is saved to the database. The receipt print screen will load automatically.</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    setFormLoading(true);
    setError('');

    try {
      const createdDebtor = await db.debtors.create({
        customer_name: name.trim(),
        phone_number: phone.trim(),
        amount_owed: parseFloat(amount),
        due_date: dueDate,
        payment_history: [{
          date: new Date().toISOString().split('T')[0],
          amount_added: parseFloat(amount),
          reason: 'Initial credit account created',
          received_by: currentUser?.name || 'Authorized Officer'
        }]
      });

      setGlobalNotification({ message: `Registered credit account of ₦${parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})} for ${name}`, type: 'success' });
      setAddModalOpen(false);
      loadData();

      // Trigger automatic PDF receipt download
      const createdTx = {
        type: 'accrual',
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        reason: 'Initial credit account created',
        received_by: currentUser?.name || 'Authorized Officer',
        updatedBalance: parseFloat(amount)
      };
      try {
        if (useThermalPref) {
          pdfGenerator.printDebtorThermalSlip(createdDebtor, createdTx, printWindow);
        } else {
          await pdfGenerator.generateDebtorReceipt(createdDebtor, createdTx);
        }
      } catch (pdfErr) {
        console.error(pdfErr);
        setGlobalNotification({ message: 'Saved successfully, but PDF generation failed.', type: 'warning' });
      }
    } catch (err) {
      console.error(err);
      if (printWindow) {
        try { printWindow.close(); } catch(e) {}
      }
      setError(err.message || 'Error creating debtor log.');
    } finally {
      setFormLoading(false);
    }
  };

  // Deduct/Pay outstanding credit balance
  const handlePayDebtor = async (e) => {
    e.preventDefault();
    if (!payAmount || isNaN(parseFloat(payAmount)) || parseFloat(payAmount) <= 0) {
      setError('Payment must be a valid number greater than 0.');
      return;
    }
    if (parseFloat(payAmount) > selectedDebtor.amount_owed) {
      setError('Payment amount cannot exceed the outstanding balance.');
      return;
    }

    let printWindow = null;
    if (useThermalPref) {
      printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>YOROTA Print Connector</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                padding: 30px 15px;
                color: #e2e8f0;
                background-color: #0f172a;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80vh;
              }
              .card {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                max-width: 280px;
              }
              .spinner {
                margin: 20px auto;
                width: 45px;
                height: 45px;
                border: 4px solid #334155;
                border-top: 4px solid #10b981;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 { font-size: 15px; margin: 12px 0 6px 0; font-weight: 700; color: #fff; }
              p { font-size: 11px; color: #94a3b8; line-height: 1.4; margin: 4px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2>Processing Ledger Transaction</h2>
              <p>Please wait while the transaction is saved to the database. The receipt print screen will load automatically.</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    setFormLoading(true);
    setError('');

    try {
      const updatedDebtor = await db.debtors.recordPayment(
        selectedDebtor.id,
        parseFloat(payAmount),
        currentUser.name || 'Duty Officer'
      );

      setGlobalNotification({ 
        message: `Deducted ₦${parseFloat(payAmount).toLocaleString(undefined, {minimumFractionDigits:2})} from ${selectedDebtor.customer_name}. Cash posted to ledger!`, 
        type: 'success' 
      });
      setPayModalOpen(false);
      loadData();

      // Trigger automatic PDF receipt download
      const repaymentTx = {
        type: 'repayment',
        amount: parseFloat(payAmount),
        date: new Date().toISOString().split('T')[0],
        reason: 'Cash settlement repayment',
        received_by: currentUser?.name || 'Duty Officer',
        updatedBalance: updatedDebtor.amount_owed
      };
      try {
        if (useThermalPref) {
          pdfGenerator.printDebtorThermalSlip(updatedDebtor, repaymentTx, printWindow);
        } else {
          await pdfGenerator.generateDebtorReceipt(updatedDebtor, repaymentTx);
        }
      } catch (pdfErr) {
        console.error(pdfErr);
        setGlobalNotification({ message: 'Repayment posted, but PDF generation failed.', type: 'warning' });
      }
    } catch (err) {
      console.error(err);
      if (printWindow) {
        try { printWindow.close(); } catch(e) {}
      }
      setError(err.message || 'Error posting payment.');
    } finally {
      setFormLoading(false);
    }
  };

  // Accumulate / Add extra debt dynamically
  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!addDebtAmount || isNaN(parseFloat(addDebtAmount)) || parseFloat(addDebtAmount) <= 0) {
      setError('Credit amount to add must be greater than ₦0.');
      return;
    }

    let printWindow = null;
    if (useThermalPref) {
      printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>YOROTA Print Connector</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                padding: 30px 15px;
                color: #e2e8f0;
                background-color: #0f172a;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80vh;
              }
              .card {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                max-width: 280px;
              }
              .spinner {
                margin: 20px auto;
                width: 45px;
                height: 45px;
                border: 4px solid #334155;
                border-top: 4px solid #10b981;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 { font-size: 15px; margin: 12px 0 6px 0; font-weight: 700; color: #fff; }
              p { font-size: 11px; color: #94a3b8; line-height: 1.4; margin: 4px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2>Processing Ledger Transaction</h2>
              <p>Please wait while the transaction is saved to the database. The receipt print screen will load automatically.</p>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    setFormLoading(true);
    setError('');

    try {
      const updatedDebtor = await db.debtors.increaseDebt(
        selectedDebtor.id,
        parseFloat(addDebtAmount),
        addDebtReason.trim() || 'Accrued additional credit',
        addDebtOfficer.trim() || currentUser?.name || 'Duty Officer'
      );

      setGlobalNotification({ 
        message: `Successfully accrued ₦${parseFloat(addDebtAmount).toLocaleString(undefined, {minimumFractionDigits:2})} to ${selectedDebtor.customer_name}'s outstanding balance.`, 
        type: 'success' 
      });
      setAddDebtModalOpen(false);
      loadData();

      // Trigger automatic PDF receipt download
      const accrualTx = {
        type: 'accrual',
        amount: parseFloat(addDebtAmount),
        date: new Date().toISOString().split('T')[0],
        reason: addDebtReason.trim() || 'Accrued additional credit',
        received_by: addDebtOfficer.trim() || currentUser?.name || 'Duty Officer',
        updatedBalance: updatedDebtor.amount_owed
      };
      try {
        if (useThermalPref) {
          pdfGenerator.printDebtorThermalSlip(updatedDebtor, accrualTx, printWindow);
        } else {
          await pdfGenerator.generateDebtorReceipt(updatedDebtor, accrualTx);
        }
      } catch (pdfErr) {
        console.error(pdfErr);
        setGlobalNotification({ message: 'Credit accrued, but PDF generation failed.', type: 'warning' });
      }
    } catch (err) {
      console.error(err);
      if (printWindow) {
        try { printWindow.close(); } catch(e) {}
      }
      setError(err.message || 'Error adding credit balance.');
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
    <div className="space-y-5 px-1 sm:px-4 pb-8">
      
      {/* Top Gold & Emerald Stripe Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-[#F5C800] to-emerald-500 rounded-full" />

      {/* Zebra Crossing Divider & Flowing Highway Line */}
      <div className="space-y-1.5 my-2">
        <div className="zebra-crossing-line opacity-95" />
        <div className="animate-road-flow" />
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100 uppercase">Debtors Registry</h1>
          <p className="text-[10px] sm:text-sm text-slate-450 mt-1 leading-relaxed">
            Monitor credit balances, accrue additional debt, and deduct dynamic repayments.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPrinterModalOpen(true)}
            className={`flex items-center justify-center gap-1.5 px-4.5 py-3 rounded-xl border font-black text-[10px] sm:text-xs transition duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer select-none \${printerStatus === 'Connected' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-md shadow-emerald-500/5' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-850'}`}
            title="Configure Bluetooth Thermal Printer"
          >
            <Bluetooth className={`w-4 h-4 \${printerStatus === 'Connected' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            {printerStatus === 'Connected' ? `PRINTER: \${printerName.substring(0, 10)}` : 'PRINTER SETTINGS'}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4.5 py-3 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black hover:from-[#FFD740] hover:to-[#F5C800] shadow-lg shadow-[#F5C800]/10 text-[10px] sm:text-xs transition duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" />
            CREATE DEBTOR ACCOUNT
          </button>
        </div>
      </div>

      {/* Summary outstanding widgets - compact grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        
        {/* Card 1: Debt amount */}
        <div className="backdrop-blur-md bg-slate-900/60 rounded-2xl p-3 sm:p-5 flex items-center gap-3.5 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          {/* Ambient red hazard warning beacon */}
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-red-500/10 blur-xl animate-pulse" />
          <div className="p-2 sm:p-3 rounded-xl bg-red-500/10 text-red-500 shrink-0">
            <UserX className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Total Outstanding Credit</span>
            <h2 className="text-sm sm:text-2xl font-black text-red-500 mt-1 tracking-tight">
              ₦{summary.totalOwed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </h2>
          </div>
        </div>

        {/* Card 2: Count */}
        <div className="backdrop-blur-md bg-slate-900/60 rounded-2xl p-3 sm:p-5 flex items-center gap-3.5 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-450 uppercase tracking-widest block">Active Unpaid Roster</span>
            <h2 className="text-sm sm:text-2xl font-black text-amber-500 mt-1 tracking-tight">
              {summary.unpaidCount} <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-normal">Accounts</span>
            </h2>
          </div>
        </div>

      </div>

      {/* Search toolbar */}
      <div className="relative bg-slate-900/40 border border-slate-850 rounded-2xl p-3 shadow-lg">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search credit account by customer name or phone number..."
          className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2 pl-11 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] focus:ring-1 focus:ring-[#F5C800]/30 transition duration-300 font-bold"
        />
      </div>

      {/* Data Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          {/* Vector SVG Steering Wheel Spinner */}
          <svg 
            className="w-14 h-14 text-[#F5C800] steering-wheel-loader" 
            viewBox="0 0 64 64" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
            <circle cx="32" cy="32" r="6" fill="currentColor" />
            <line x1="32" y1="38" x2="32" y2="60" strokeWidth="4.5" />
            <line x1="28" y1="30" x2="8" y2="18" strokeWidth="4.5" />
            <line x1="36" y1="30" x2="56" y2="18" strokeWidth="4.5" />
            <circle cx="32" cy="32" r="16" stroke="currentColor" strokeDasharray="6,6" strokeWidth="1.5" opacity="0.6" />
          </svg>
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest animate-pulse">Loading Outstanding Accounts...</span>
        </div>
      ) : filteredDebtors.length > 0 ? (
        <div className="space-y-3">
          
          {/* MOBILE RESPONSIVE COMPACT CARD VIEW (sm:hidden) */}
          <div className="block sm:hidden space-y-3">
            {filteredDebtors.map(deb => {
              const isHistoryOpen = !!expandedHistories[deb.id];
              return (
                <div key={deb.id} className="backdrop-blur-md bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 bg-[#F5C800]" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#F5C800] text-[10px] uppercase tracking-wide">Due: {deb.due_date}</span>
                    <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                      deb.status === 'unpaid' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {deb.status === 'unpaid' ? 'UNPAID' : 'SETTLED'}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <div className="font-black text-slate-100 text-sm tracking-wide">{deb.customer_name}</div>
                      <div className="text-[10px] text-slate-450 mt-1 font-bold">{deb.phone_number}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-sm tracking-wide ${deb.status === 'unpaid' ? 'text-red-400' : 'text-emerald-400'}`}>
                        ₦{parseFloat(deb.amount_owed).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      {deb.status === 'unpaid' && new Date(deb.due_date) < new Date().setHours(0,0,0,0) && (
                        <div className="text-[8px] text-red-450 font-black mt-1 tracking-widest uppercase bg-red-500/15 border border-red-500/35 px-1.5 py-0.5 rounded">OVERDUE</div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Action Buttons Footer for Mobile - Separate ACCRUE and DEDUCT triggers */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-850/60 justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleHistory(deb.id)}
                        className="flex items-center gap-1 text-[10px] font-black text-slate-450 hover:text-slate-200 transition"
                      >
                        <History className="w-3.5 h-3.5" />
                        {isHistoryOpen ? 'HIDE LOGS' : 'VIEW LOGS'}
                        {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => openEditModal(deb)}
                        className="flex items-center gap-1 text-[10px] font-black text-slate-450 hover:text-blue-400 transition"
                      >
                        EDIT INFO
                      </button>
                      <button
                        onClick={() => openDeleteModal(deb)}
                        className="flex items-center gap-1 text-[10px] font-black text-slate-450 hover:text-red-400 transition"
                      >
                        DELETE
                      </button>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {/* 1. Add Debt (+) - ALWAYS VISIBLE */}
                      <button
                        onClick={() => openAddDebtModal(deb)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-[#CA8A04] hover:text-[#070a13] text-[#F5C800] transition font-black text-[9px] uppercase cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        ADD DEBT
                      </button>
                      
                      {deb.status === 'unpaid' && (
                        <>
                          {/* 2. Deduct Debt (-) */}
                          <button
                            onClick={() => openPayModal(deb)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-[#10b981] hover:text-[#070a13] text-emerald-400 transition font-black text-[9px] uppercase cursor-pointer"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            DEDUCT
                          </button>

                          {/* 3. Send WhatsApp Reminder */}
                          <button
                            onClick={() => handleSendReminder(deb)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-[#128C7E] hover:text-white text-[#25D366] transition font-black text-[9px] uppercase cursor-pointer"
                            title="Send polite WhatsApp due reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            REMIND
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Mobile Audit History logs */}
                  {isHistoryOpen && (
                    <div className="pt-3 border-t border-slate-850/80 space-y-2 text-[10px] font-bold text-slate-350 animate-fade-in bg-slate-950/20 p-2.5 rounded-xl border border-dashed border-slate-800">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Account History Trail</span>
                      {(deb.payment_history || []).map((hist, idx) => {
                        const isPay = hist.amount_paid !== undefined;
                        return (
                          <div key={idx} className="flex justify-between items-start py-1 border-b border-slate-850/40 last:border-b-0">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {isPay ? (
                                  <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <TrendingUp className="w-3 h-3 text-[#F5C800] shrink-0" />
                                )}
                                <span className={isPay ? 'text-emerald-400 font-extrabold' : 'text-[#F5C800] font-extrabold'}>
                                  {isPay ? `Deduction: -₦${hist.amount_paid.toLocaleString(undefined, {minimumFractionDigits: 2})}` : `Accrual: +₦${hist.amount_added.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                                </span>
                              </div>
                              {!isPay && hist.reason && (
                                <div className="text-[9px] text-slate-500 italic mt-0.5 pl-4">Reason: "{hist.reason}"</div>
                              )}
                              <div className="text-[8px] text-slate-500 mt-0.5 pl-4">Officer: {hist.received_by || 'Staff'}</div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1 shrink-0">
                              <span className="text-slate-500 text-[9px]">{hist.date}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPastReceipt(deb, hist, 'a4')}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[8px] font-black text-[#F5C800] uppercase hover:bg-slate-700 transition cursor-pointer select-none"
                                  title="Reprint A4 PDF receipt"
                                >
                                  <FileText className="w-2.5 h-2.5 text-[#F5C800]" />
                                  A4
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintPastReceipt(deb, hist, 'thermal')}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[8px] font-black text-[#10b981] uppercase hover:bg-slate-700 transition cursor-pointer select-none"
                                  title="Reprint 58mm Thermal receipt"
                                >
                                  <FileText className="w-2.5 h-2.5 text-[#10b981]" />
                                  MINI
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!deb.payment_history || deb.payment_history.length === 0) && (
                        <div className="text-center py-2 text-slate-500">No transactions recorded.</div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* DESKTOP TRADITIONAL TABULAR VIEW (hidden sm:block) */}
          <div className="hidden sm:block backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-4 w-12 text-center">TRAIL</th>
                  <th className="py-4 px-4">CUSTOMER NAME</th>
                  <th className="py-4 px-4">PHONE NUMBER</th>
                  <th className="py-4 px-4">OUTSTANDING BALANCE</th>
                  <th className="py-4 px-4">PAYMENT DUE DATE</th>
                  <th className="py-4 px-4">STATUS</th>
                  <th className="py-4 px-4 text-right">ACCUMULATE & DEDUCT ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {filteredDebtors.map((deb) => {
                  const isHistoryOpen = !!expandedHistories[deb.id];
                  return (
                    <React.Fragment key={deb.id}>
                      <tr className="hover:bg-slate-900/30 transition duration-150">
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => toggleHistory(deb.id)}
                            title="View dynamic audit history trail"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer select-none"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-4 px-4 font-black text-slate-200 text-sm tracking-wide">
                          {deb.customer_name}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-400">
                          {deb.phone_number}
                        </td>
                        <td className={`py-4 px-4 font-black text-sm ${deb.status === 'unpaid' ? 'text-red-400' : 'text-emerald-400'}`}>
                          ₦{parseFloat(deb.amount_owed).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${getDueDateStatus(deb.due_date, deb.status)}`}>
                              {deb.due_date} {deb.status === 'unpaid' && new Date(deb.due_date) < new Date().setHours(0,0,0,0) && ' (OVERDUE)'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            deb.status === 'unpaid' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {deb.status === 'unpaid' ? 'UNPAID' : 'SETTLED'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => openEditModal(deb)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500 hover:text-white text-blue-400 transition font-black text-[10px] uppercase cursor-pointer select-none active:scale-[0.98]"
                            >
                              EDIT INFO
                            </button>

                            <button
                              onClick={() => openDeleteModal(deb)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 transition font-black text-[10px] uppercase cursor-pointer select-none active:scale-[0.98]"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              DELETE
                            </button>

                            {/* 1. Add Debt (+) ALWAYS VISIBLE */}
                            <button
                              onClick={() => openAddDebtModal(deb)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-[#CA8A04] hover:text-[#070a13] text-[#F5C800] transition font-black text-[10px] uppercase cursor-pointer select-none active:scale-[0.98]"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              ACCURUE DEBT
                            </button>

                            {deb.status === 'unpaid' ? (
                              <>
                                {/* 2. Deduct/Pay Debt (-) */}
                                <button
                                  onClick={() => openPayModal(deb)}
                                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-[#10b981] hover:text-[#070a13] text-emerald-400 transition font-black text-[10px] uppercase cursor-pointer select-none active:scale-[0.98]"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                  DEDUCT REPAYMENT
                                </button>

                                {/* 3. Send WhatsApp Reminder */}
                                <button
                                  onClick={() => handleSendReminder(deb)}
                                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-[#128C7E] hover:text-white text-[#25D366] transition font-black text-[10px] uppercase cursor-pointer select-none active:scale-[0.98]"
                                  title="Send polite WhatsApp due reminder"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  SEND REMINDER
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-emerald-400 inline-flex items-center gap-1 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> PAID SETTLED
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Desktop History details Row */}
                      {isHistoryOpen && (
                        <tr className="bg-slate-950/20">
                          <td colSpan="7" className="p-5">
                            <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/30 space-y-3 max-w-4xl text-xs font-semibold text-slate-350">
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                                <History className="w-4 h-4 text-[#F5C800]" />
                                <h4 className="font-black text-slate-200 uppercase tracking-wide">Credit Audit Trail & Repayments Log</h4>
                              </div>
                              
                              <div className="divide-y divide-slate-850/60 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                {(deb.payment_history || []).map((hist, idx) => {
                                  const isPay = hist.amount_paid !== undefined;
                                  return (
                                    <div key={idx} className="flex justify-between items-start py-2.5">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          {isPay ? (
                                            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                                          ) : (
                                            <TrendingUp className="w-4 h-4 text-[#F5C800] shrink-0" />
                                          )}
                                          <span className={isPay ? 'text-emerald-400 font-extrabold' : 'text-[#F5C800] font-extrabold'}>
                                            {isPay ? `Cash Repayment (Deduction): -₦${hist.amount_paid.toLocaleString(undefined, {minimumFractionDigits: 2})}` : `Accrued Credit Addition: +₦${hist.amount_added.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                                          </span>
                                        </div>
                                        {!isPay && hist.reason && (
                                          <p className="text-[10px] text-slate-500 pl-6 italic">Accrual Justification: "{hist.reason}"</p>
                                        )}
                                        <div className="text-[9px] text-slate-550 pl-6">Stamped & Verified by Officer: <span className="text-slate-400 font-bold">{hist.received_by || 'System'}</span></div>
                                      </div>
                                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                          <div className="text-slate-500 font-bold text-[10px] flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-650" />
                                            {hist.date}
                                          </div>
                                          <div className="flex gap-1.5 justify-end">
                                            <button
                                              type="button"
                                              onClick={() => handlePrintPastReceipt(deb, hist, 'a4')}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-[#F5C800] hover:text-[#070a13] text-[#F5C800] font-black text-[9px] uppercase transition cursor-pointer select-none"
                                              title="Reprint standard A4 receipt"
                                            >
                                              <FileText className="w-3 h-3 text-[#F5C800]" />
                                              A4 SLIP
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handlePrintPastReceipt(deb, hist, 'thermal')}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-955/60 hover:bg-[#10b981] hover:text-[#070a13] text-[#10b981] font-black text-[9px] uppercase transition cursor-pointer select-none"
                                              title="Reprint 58mm Thermal receipt"
                                            >
                                              <FileText className="w-3 h-3 text-[#10b981]" />
                                              MINI PRINT
                                            </button>
                                          </div>
                                        </div>
                                    </div>
                                  );
                                })}

                                {(!deb.payment_history || deb.payment_history.length === 0) && (
                                  <div className="text-center py-4 text-slate-500">No transactions logged on this credit profile.</div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 backdrop-blur-md bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4">
          <UserX className="w-8 h-8 text-slate-500 mb-2" />
          <p className="font-bold text-xs">No outstanding debtors registered</p>
          <p className="text-[10px] text-slate-550 mt-1">
            New outstanding client accounts will display here in real-time.
          </p>
        </div>
      )}

      {/* Modal - Add Debtor Account */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-[#F5C800]" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <UserX className="w-4.5 h-4.5 text-red-500 shrink-0" />
              Register Outstanding Debt Account
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDebtor} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammadu Buhari"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Phone Number Contact *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08031234567"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-855 rounded-xl py-2.5 px-3 text-xs text-slate-400 focus:outline-none focus:border-[#F5C800] transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Thermal Printer Option */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="thermal_add_debtor"
                  checked={useThermalPref}
                  onChange={handleToggleThermalPref}
                  className="rounded border-slate-800 text-[#F5C800] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="thermal_add_debtor" className="text-[10px] font-bold text-slate-400 cursor-pointer">
                  Use Bluetooth Thermal Printer (58mm)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase shadow-md shadow-red-500/10 transition cursor-pointer select-none active:scale-[0.98]"
                >
                  {formLoading ? 'Saving...' : 'Register Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Debtor Info */}
      {editModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck className="w-4.5 h-4.5 text-blue-500 shrink-0" />
              Edit Client Profile
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleEditDebtor} className="space-y-4">
              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammadu Buhari"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Phone Number Contact *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08031234567"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full bg-slate-950/60 border border-slate-855 rounded-xl py-2.5 px-3 text-xs text-slate-400 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase shadow-md shadow-blue-500/10 transition cursor-pointer select-none active:scale-[0.98]"
                >
                  {formLoading ? 'Saving...' : 'Save Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Settle Repayment / DEDUCT BALANCE (-) */}
      {payModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              Collect / Deduct Repayment Cash
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handlePayDebtor} className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-2 border border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Profile:</span>
                  <span className="font-bold text-slate-200">{selectedDebtor.customer_name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-850/40 pt-1.5">
                  <span className="text-slate-400">Outstanding Balance:</span>
                  <span className="font-black text-red-400">₦{selectedDebtor.amount_owed.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Cash Repayment Deducted (₦ Naira) *
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
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-black text-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-slate-555 uppercase tracking-wider block">Issuing Officer Seal</span>
                <div className="flex items-center gap-1 font-bold text-slate-350 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-[#F5C800]" />
                  {currentUser.name}
                </div>
              </div>

              {/* Thermal Printer Option */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="thermal_pay_debtor"
                  checked={useThermalPref}
                  onChange={handleToggleThermalPref}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="thermal_pay_debtor" className="text-[10px] font-bold text-slate-400 cursor-pointer">
                  Use Bluetooth Thermal Printer (58mm)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] text-[#070a13] font-black text-xs uppercase shadow-md shadow-emerald-500/10 transition cursor-pointer select-none active:scale-[0.99]"
                >
                  {formLoading ? 'Settling...' : 'Deduct repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Dynamic Accrue Debt / ADD BALANCE (+) */}
      {addDebtModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-[#F5C800]" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <PlusCircle className="w-4.5 h-4.5 text-[#F5C800] shrink-0" />
              Accrue / Add Additional Credit
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddDebt} className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-2 border border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Profile:</span>
                  <span className="font-bold text-slate-200">{selectedDebtor.customer_name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-850/40 pt-1.5">
                  <span className="text-slate-400">Active Balance:</span>
                  <span className="font-black text-red-400">₦{selectedDebtor.amount_owed.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Credit Value to Accrue (₦ Naira) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={addDebtAmount}
                  onChange={(e) => setAddDebtAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition font-black text-[#F5C800]"
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Credit Accrual Explanation / Reason *
                </label>
                <input
                  type="text"
                  required
                  value={addDebtReason}
                  onChange={(e) => setAddDebtReason(e.target.value)}
                  placeholder="e.g. Additional Jega registration credit..."
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#F5C800] transition"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-slate-555 uppercase tracking-wider block">Authorizing Officer Stamp</span>
                <div className="flex items-center gap-1 font-bold text-slate-350 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-[#F5C800]" />
                  {currentUser.name}
                </div>
              </div>

              {/* Thermal Printer Option */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="thermal_add_debt"
                  checked={useThermalPref}
                  onChange={handleToggleThermalPref}
                  className="rounded border-slate-800 text-[#F5C800] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="thermal_add_debt" className="text-[10px] font-bold text-slate-400 cursor-pointer">
                  Use Bluetooth Thermal Printer (58mm)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setAddDebtModalOpen(false)}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-[#F5C800] to-[#EAB308] text-[#070a13] font-black text-xs uppercase shadow-md shadow-[#F5C800]/10 transition cursor-pointer select-none active:scale-[0.99]"
                >
                  {formLoading ? 'Accruing...' : 'Add dynamic debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Delete Debtor Account */}
      {deleteModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <Trash className="w-4.5 h-4.5 text-red-500 shrink-0" />
              Delete Account
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleDeleteDebtor} className="space-y-4">
              <p className="text-slate-400 text-xs">
                Are you sure you want to completely delete the account for <strong className="text-red-400">{selectedDebtor.customer_name}</strong>? This action cannot be undone.
              </p>

              <div>
                <label className="block text-[8px] font-black text-slate-555 uppercase tracking-wider mb-1.5">
                  Enter Security PIN to confirm *
                </label>
                <input
                  type="password"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="****"
                  required
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition text-center tracking-[1em]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase shadow-md shadow-red-500/10 transition cursor-pointer select-none active:scale-[0.98]"
                >
                  {formLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Bluetooth Printer Settings */}
      {printerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-xs text-slate-350 font-semibold animate-in zoom-in-95 duration-200">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-[#10b981]" />

            <h2 className="text-xs font-black text-slate-100 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
              <Bluetooth className="w-4.5 h-4.5 text-blue-500 shrink-0" />
              Bluetooth Thermal Printer Settings
            </h2>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-2 border border-slate-850">
                <div className="flex justify-between items-center">
                  <span className="text-slate-450">Bluetooth Support:</span>
                  {navigator.bluetooth ? (
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Supported
                    </span>
                  ) : (
                    <span className="text-red-400 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Unsupported (Use Chrome)
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center border-t border-slate-850/40 pt-2 mt-1">
                  <span className="text-slate-450">Printer Status:</span>
                  <span className={`font-black uppercase tracking-wider \${printerStatus === 'Connected' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                    {printerStatus}
                  </span>
                </div>
                {printerStatus === 'Connected' && (
                  <div className="flex justify-between items-center border-t border-slate-850/40 pt-2 mt-1">
                    <span className="text-slate-450">Device Name:</span>
                    <span className="font-extrabold text-slate-200">{printerName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {printerStatus !== 'Connected' ? (
                  <button
                    type="button"
                    onClick={handleConnectPrinter}
                    disabled={isPrinterScanning || !navigator.bluetooth}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-md shadow-blue-500/10 transition cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPrinterScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Scanning for Printers...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Scan & Connect Near Printer
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handlePrintTestSlip}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] text-[#070a13] font-black text-xs uppercase shadow-md shadow-emerald-500/10 transition cursor-pointer select-none"
                    >
                      <Printer className="w-4 h-4" />
                      Print Test Slip
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectPrinter}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900/60 hover:bg-red-900/40 border border-slate-850 text-red-400 hover:text-red-300 font-extrabold text-xs uppercase transition cursor-pointer select-none"
                    >
                      Disconnect Printer
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 leading-normal bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/50">
                <span className="font-bold text-slate-400">Pairing Instructions:</span> Make sure your 58mm thermal printer is powered ON and has Bluetooth enabled. When you click scan, select it in the browser's device chooser. Once paired, it will remain connected for subsequent transactions.
              </div>

              <div className="flex justify-end pt-2 mt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrinterModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-955/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition font-bold uppercase select-none cursor-pointer"
                >
                  Close Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
