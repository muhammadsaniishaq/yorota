// YOROTA Smart Office - Government-grade PDF Generator Service
// Integrates jsPDF and jsPDF-AutoTable for premium administrative prints

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Official green color theme codes
const BRAND_GREEN = [16, 185, 129]; // RGB: #10b981
const BRAND_DARK = [9, 13, 22]; // RGB: #090d16
const SECONDARY_GRAY = [241, 245, 249];

const addGovernmentHeader = (doc, title) => {
  // Official green decorative bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, 210, 8, 'F');

  // Government Header Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_DARK);
  doc.text('YOROTA STATE GOVERNMENT', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('ROAD TRAFFIC OFFICE MANAGEMENT & REVENUE DEPT', 105, 26, { align: 'center' });
  doc.text('YOROTA Smart Office - Official Document', 105, 31, { align: 'center' });

  // Thin separator line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(15, 36, 195, 36);

  // Document Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(title.toUpperCase(), 15, 45);

  // Printed date info
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Printed: ${new Date().toLocaleString()}`, 195, 45, { align: 'right' });
};

const addSignatureBlock = (doc, yPos, officerName) => {
  if (yPos > 260) {
    doc.addPage();
    yPos = 30;
  }

  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  
  // Officer Signature Line
  doc.line(20, yPos + 25, 80, yPos + 25);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED BY (OFFICER)', 20, yPos + 30);
  doc.setFont('Helvetica', 'bold');
  doc.text(officerName || 'Duty Officer', 20, yPos + 35);

  // Director Approval Line
  doc.line(130, yPos + 25, 190, yPos + 25);
  doc.setFont('Helvetica', 'normal');
  doc.text('APPROVED BY (DIRECTOR)', 130, yPos + 30);
  doc.setFont('Helvetica', 'bold');
  doc.text('Director of Road Traffic', 130, yPos + 35);

  // Official Stamp Circle representation
  doc.setDrawColor(...BRAND_GREEN);
  doc.setLineWidth(1);
  doc.circle(105, yPos + 22, 12);
  doc.setFontSize(6);
  doc.setTextColor(...BRAND_GREEN);
  doc.text('YOROTA RTO', 105, yPos + 21, { align: 'center' });
  doc.text('APPROVED', 105, yPos + 25, { align: 'center' });
};

export const pdfGenerator = {
  // --- GENERATE CUSTOMER RECEIPT ---
  generateReceipt: (record) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' // A5 is standard receipt size
    });

    // Outer border
    doc.setDrawColor(...BRAND_GREEN);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 138, 200);

    // Decorative Bar
    doc.setFillColor(...BRAND_GREEN);
    doc.rect(5, 5, 138, 5, 'F');

    // Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('YOROTA ROAD TRAFFIC OFFICE', 74, 18, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('OFFICIAL PAYMENT RECEIPT & OPERATING CLEARANCE', 74, 23, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(10, 27, 138, 27);

    // Receipt details
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`RECEIPT NO: RTO-${record.id.substring(2, 8).toUpperCase()}`, 10, 34);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${new Date(record.created_at).toLocaleDateString()}`, 138, 34, { align: 'right' });

    // Customer Detail Panel
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 39, 128, 24, 'F');
    
    doc.setTextColor(...BRAND_DARK);
    doc.setFont('Helvetica', 'bold');
    doc.text('CUSTOMER RECORDS:', 13, 44);
    
    doc.setFont('Helvetica', 'normal');
    doc.text(`Name:       ${record.customer_name}`, 13, 49);
    doc.text(`Phone:      ${record.phone_number}`, 13, 54);
    doc.text(`Officer:    ${record.officer_name}`, 13, 59);

    // Itemized table using manual rendering for A5 compactness
    doc.setFillColor(...BRAND_GREEN);
    doc.rect(10, 68, 128, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text('SERVICE RENDERED', 13, 72);
    doc.text('QTY', 95, 72, { align: 'center' });
    doc.text('UNIT PRICE', 113, 72, { align: 'right' });
    doc.text('TOTAL', 133, 72, { align: 'right' });

    doc.setTextColor(...BRAND_DARK);
    doc.setFont('Helvetica', 'normal');
    doc.text(record.service?.name || 'Service Category', 13, 82);
    doc.text(record.quantity.toString(), 95, 82, { align: 'center' });
    doc.text(`$${(record.amount / record.quantity).toFixed(2)}`, 113, 82, { align: 'right' });
    doc.text(`$${parseFloat(record.amount).toFixed(2)}`, 133, 82, { align: 'right' });

    doc.line(10, 86, 138, 86);

    // Notes
    if (record.notes) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Notes: ${record.notes}`, 10, 93);
    }

    // Totals Panel
    doc.setFillColor(248, 250, 252);
    doc.rect(80, 100, 58, 25, 'F');
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', 85, 106);
    doc.text('Vat (0%):', 85, 112);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text('GRAND TOTAL:', 85, 120);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BRAND_DARK);
    doc.text(`$${parseFloat(record.amount).toFixed(2)}`, 133, 106, { align: 'right' });
    doc.text('$0.00', 133, 112, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`$${parseFloat(record.amount).toFixed(2)}`, 133, 120, { align: 'right' });

    // Validation Seal and sign
    doc.setDrawColor(...BRAND_GREEN);
    doc.circle(35, 145, 12);
    doc.setFontSize(6);
    doc.setTextColor(...BRAND_GREEN);
    doc.text('OFFICIAL SEAL', 35, 143, { align: 'center' });
    doc.text('PAID & VALIDATED', 35, 147, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(80, 150, 130, 150);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ISSUING OFFICER SIGNATURE', 80, 154);
    doc.setFont('Helvetica', 'bold');
    doc.text(record.officer_name, 80, 159);

    // Footer notice
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('This permit acts as official temporary clearance for road services.', 74, 185, { align: 'center' });
    doc.text('Keep safely in vehicle cabin at all times.', 74, 189, { align: 'center' });

    // Download
    doc.save(`receipt-${record.customer_name.replace(/\s+/g, '_')}-${record.id.substring(2, 6)}.pdf`);
  },

  // --- GENERATE REPORT (DAILY/MONTHLY/CUSTOM RANGE) ---
  generateReport: (type, dateRangeText, records, summary, transactions) => {
    const doc = new jsPDF();
    
    // Add Header
    addGovernmentHeader(doc, `${type} Activity & Audit Report`);

    // Date Range Meta Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);
    doc.text('AUDIT PERIOD:', 15, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(dateRangeText, 45, 54);

    // Summary Metric Cards (using rectangle grids)
    doc.setFillColor(248, 250, 252);
    // Card 1
    doc.rect(15, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('TOTAL REGISTRATIONS', 19, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(summary.totalCount.toString(), 19, 75);

    // Card 2
    doc.setFillColor(248, 250, 252);
    doc.rect(77, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('TOTAL REVENUE RENDERED', 81, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`$${parseFloat(summary.totalAmount).toFixed(2)}`, 81, 75);

    // Card 3
    doc.setFillColor(248, 250, 252);
    doc.rect(140, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('LEDGER NET BALANCE', 144, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(summary.ledgerNet >= 0 ? BRAND_GREEN : [239, 68, 68]);
    doc.text(`$${parseFloat(summary.ledgerNet || 0).toFixed(2)}`, 144, 75);

    // Header 1: Category Summary Breakdowns
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('SERVICE CATEGORY SUMMARY', 15, 92);

    // Create service table body
    const catRows = Object.entries(summary.categories).map(([name, count]) => {
      const serviceRecords = records.filter(r => r.service?.name === name);
      const totalAmount = serviceRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      return [name, count.toString(), `$${totalAmount.toFixed(2)}`];
    });

    doc.autoTable({
      startY: 96,
      head: [['Category Service Name', 'Units Logged', 'Revenue Generated']],
      body: catRows.length > 0 ? catRows : [['No data recorded', '0', '$0.00']],
      headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      theme: 'striped',
    });

    let currentY = doc.lastAutoTable.finalY + 12;

    // Header 2: Daily entries logs
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('ITEMIZED WORK LOGS', 15, currentY);

    const logRows = records.map(rec => [
      new Date(rec.created_at).toLocaleDateString(),
      rec.customer_name,
      rec.service?.name || 'Unknown',
      rec.quantity.toString(),
      `$${parseFloat(rec.amount).toFixed(2)}`,
      rec.officer_name
    ]);

    doc.autoTable({
      startY: currentY + 4,
      head: [['Date', 'Customer Name', 'Service Rendered', 'Qty', 'Amount', 'Officer']],
      body: logRows.length > 0 ? logRows : [['-', 'No logs recorded for this period', '-', '-', '-', '-']],
      headStyles: { fillColor: BRAND_DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      theme: 'striped'
    });

    // Signature stamp lines
    addSignatureBlock(doc, doc.lastAutoTable.finalY + 15, records[0]?.officer_name);

    // Save
    doc.save(`report-${type.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // --- GENERATE OFFICE FINANCIAL LEDGER SUMMARY ---
  generateFinancialSummary: (summary, transactions) => {
    const doc = new jsPDF();
    
    // Add Header
    addGovernmentHeader(doc, 'Office Financial Ledger Summary');

    // Date Meta Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_DARK);
    doc.text('LEDGER RUN DATE:', 15, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), 50, 54);

    // Summary Card Grid
    doc.setFillColor(248, 250, 252);
    // Card 1: Income
    doc.rect(15, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('TOTAL INCOME LOGS', 19, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`$${parseFloat(summary.totalIncome).toFixed(2)}`, 19, 75);

    // Card 2: Expenses
    doc.setFillColor(248, 250, 252);
    doc.rect(77, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('TOTAL OFFICE EXPENSES', 81, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`$${parseFloat(summary.totalExpenses).toFixed(2)}`, 81, 75);

    // Card 3: Net Cash
    doc.setFillColor(248, 250, 252);
    doc.rect(140, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('NET CASH BALANCE', 144, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(summary.remainingBalance >= 0 ? BRAND_GREEN : [239, 68, 68]);
    doc.text(`$${parseFloat(summary.remainingBalance).toFixed(2)}`, 144, 75);

    // Header 1: Ledgers
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('ITEMIZED LEDGER TRANSACTIONS', 15, 92);

    const txRows = transactions.map(t => [
      t.date,
      t.type.toUpperCase(),
      t.purpose,
      `$${parseFloat(t.amount).toFixed(2)}`,
      t.collected_by
    ]);

    doc.autoTable({
      startY: 96,
      head: [['Date', 'Type', 'Purpose / Particulars', 'Amount', 'Collected / Paid By']],
      body: txRows.length > 0 ? txRows : [['-', 'No logs recorded', '-', '-', '-']],
      headStyles: { fillColor: BRAND_DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8 },
      theme: 'striped',
      columnStyles: {
        1: { cellWidth: 20 },
        3: { cellWidth: 25, halign: 'right' }
      }
    });

    // Signature stamp lines
    addSignatureBlock(doc, doc.lastAutoTable.finalY + 15, transactions[0]?.collected_by);

    doc.save(`ledger-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
