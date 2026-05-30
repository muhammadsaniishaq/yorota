// YOROTA Smart Office - Government-grade PDF Generator Service
// Integrates jsPDF and jsPDF-AutoTable for premium administrative prints

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Official green color theme codes
const BRAND_GREEN = [16, 185, 129]; // RGB: #10b981
const BRAND_DARK = [9, 13, 22]; // RGB: #090d16
const SECONDARY_GRAY = [241, 245, 249];

// Helper to pre-load image for jsPDF synchronously using HTML Image Element
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};


const drawPremiumPageBorders = (doc) => {
  // 1. Premium Government & Safety Border Frame
  doc.setDrawColor(16, 185, 129); // Forest Green
  doc.setLineWidth(1.2);
  doc.rect(5, 5, 200, 287); // Page Frame

  doc.setDrawColor(245, 200, 0); // Gold Accent Line
  doc.setLineWidth(0.4);
  doc.rect(6.2, 6.2, 197.6, 284.6);

  // Redesigned Premium Decorations: Interlocking Executive Corner Brackets representing highway frames
  doc.setFillColor(16, 185, 129); // Green blocks
  // Top-Left Corner
  doc.rect(5, 5, 12, 2.5, 'F'); doc.rect(5, 5, 2.5, 12, 'F');
  // Top-Right Corner
  doc.rect(193, 5, 12, 2.5, 'F'); doc.rect(202.5, 5, 2.5, 12, 'F');
  // Bottom-Left Corner
  doc.rect(5, 289.5, 12, 2.5, 'F'); doc.rect(5, 280, 2.5, 12, 'F');
  // Bottom-Right Corner
  doc.rect(193, 289.5, 12, 2.5, 'F'); doc.rect(202.5, 280, 2.5, 12, 'F');

  doc.setFillColor(245, 200, 0); // Gold blocks
  // Inner Golden brackets
  doc.rect(7.5, 7.5, 8, 1.2, 'F'); doc.rect(7.5, 7.5, 1.2, 8, 'F');
  doc.rect(194.5, 7.5, 8, 1.2, 'F'); doc.rect(201.3, 7.5, 1.2, 8, 'F');
  doc.rect(7.5, 288.3, 8, 1.2, 'F'); doc.rect(7.5, 282, 1.2, 8, 'F');
  doc.rect(194.5, 288.3, 8, 1.2, 'F'); doc.rect(201.3, 282, 1.2, 8, 'F');
};

const addGovernmentHeader = (doc, title, logoImg) => {
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

  // Optional Left side Logo image for high-end feel, perfectly matching margins
  if (logoImg) {
    const boxX = 15;
    const boxY = 12;
    const boxSize = 18;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxSize, boxSize, 2, 2, 'FD');
    doc.addImage(logoImg, 'PNG', boxX + 1.5, boxY + 1.5, boxSize - 3, boxSize - 3);
  }

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
    doc.text(`₦${(record.amount / record.quantity).toFixed(2)}`, 113, 82, { align: 'right' });
    doc.text(`₦${parseFloat(record.amount).toFixed(2)}`, 133, 82, { align: 'right' });

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
    doc.text(`₦${parseFloat(record.amount).toFixed(2)}`, 133, 106, { align: 'right' });
    doc.text('₦0.00', 133, 112, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${parseFloat(record.amount).toFixed(2)}`, 133, 120, { align: 'right' });

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
  generateReport: async (type, dateRangeText, records, summary, transactions) => {
    const doc = new jsPDF();
    
    // Preload logo
    const logoImg = await loadImage('/logo.png');
    // Add Header
    addGovernmentHeader(doc, `${type} Activity & Audit Report`, logoImg);

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
    doc.text(`₦${parseFloat(summary.totalAmount).toFixed(2)}`, 81, 75);

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
    doc.text(`₦${parseFloat(summary.ledgerNet || 0).toFixed(2)}`, 144, 75);

    // Set-aside Revenue Surcharge Splits Audit Block (₦500 per unit, 70% HQ / 30% local office)
    let ySplit = 85;
    doc.setFillColor(245, 247, 250);
    doc.rect(15, ySplit, 180, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, ySplit, 180, 22, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_GREEN);
    doc.text('REVENUE SHARE & RETENTION SURCHARGE AUDIT (₦500 / unit)', 20, ySplit + 5.5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text('Headquarters Share (70%):', 20, ySplit + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Gen: ₦${parseFloat(summary.setAsideHQ || 0).toFixed(2)} | Paid: ₦${parseFloat(summary.hqRemitted || 0).toFixed(2)} | Due: ₦${parseFloat(summary.hqOutstanding || 0).toFixed(2)}`, 20, ySplit + 16);

    doc.setFont('Helvetica', 'bold');
    doc.text('Local Office Share (30%):', 110, ySplit + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Gen: ₦${parseFloat(summary.setAsideOffice || 0).toFixed(2)} | Spent: ₦${parseFloat(summary.officeDisbursed || 0).toFixed(2)} | Retained: ₦${parseFloat(summary.officeBalance || 0).toFixed(2)}`, 110, ySplit + 16);

    // Header 1: Category Summary Breakdowns
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('SERVICE CATEGORY SUMMARY', 15, 114);

    // Create service table body
    const catRows = Object.entries(summary.categories).map(([name, count]) => {
      const serviceRecords = records.filter(r => r.service?.name === name);
      const totalAmount = serviceRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      return [name, count.toString(), `₦${totalAmount.toFixed(2)}`];
    });

    doc.autoTable({
      startY: 118,
      head: [['Category Service Name', 'Units Logged', 'Revenue Generated']],
      body: catRows.length > 0 ? catRows : [['No data recorded', '0', '₦0.00']],
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
      `₦${parseFloat(rec.amount).toFixed(2)}`,
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
  generateFinancialSummary: async (summary, transactions) => {
    const doc = new jsPDF();
    
    // Preload logo
    const logoImg = await loadImage('/logo.png');
    // Add Header
    addGovernmentHeader(doc, 'Office Financial Ledger Summary', logoImg);

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
    doc.text(`₦${parseFloat(summary.totalIncome).toFixed(2)}`, 19, 75);

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
    doc.text(`₦${parseFloat(summary.totalExpenses).toFixed(2)}`, 81, 75);

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
    doc.text(`₦${parseFloat(summary.remainingBalance).toFixed(2)}`, 144, 75);

    // Header 1: Ledgers
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('ITEMIZED LEDGER TRANSACTIONS', 15, 92);

    const txRows = transactions.map(t => [
      t.date,
      t.type.toUpperCase(),
      t.purpose,
      `₦${parseFloat(t.amount).toFixed(2)}`,
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
  },

  // --- GENERATE YOROTA ICT DAILY PAYOUT FORM ---
  generateIctPayoutReport: async (dateRangeText, records, officerName, commandName) => {
    const doc = new jsPDF();

    // 1. Premium Government & Safety Border Frame with Corner Brackets
    drawPremiumPageBorders(doc);

    // Double Solid Yellow road dividing lines (thematic top accent)
    doc.setDrawColor(245, 200, 0);
    doc.setLineWidth(0.8);
    doc.line(15, 11, 195, 11);
    doc.line(15, 12.8, 195, 12.8);


    // 2. Faint Center Watermark (Road safety emblem / traffic lanes)
    const wcx = 105;
    const wcy = 150;
    doc.setDrawColor(242, 248, 245); // Extremely faint green-slate
    doc.setLineWidth(1.2);
    doc.circle(wcx, wcy, 45, 'S'); // Outer circle
    doc.circle(wcx, wcy, 38, 'S'); // Inner circle
    doc.setLineWidth(0.5);
    // Dashed road lane dividers
    doc.setLineDash([3, 3]);
    doc.line(wcx, wcy - 35, wcx, wcy + 35); // Vertical dividing line
    doc.line(wcx - 35, wcy, wcx + 35, wcy); // Horizontal dividing line
    doc.setLineDash([]); // Reset dash pattern
    
    // Watermark core shield
    doc.circle(wcx, wcy, 12, 'S');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(230, 242, 235);
    doc.text('YOROTA SAFETY', wcx, wcy - 2, { align: 'center' });
    doc.text('SECURE SEAL', wcx, wcy + 3, { align: 'center' });

    // 3. Center Logo Container (Perfect match to high-fidelity A4 web preview)
    const logoImg = await loadImage('/logo.png');
    const logoBoxSize = 18;
    const logoBoxX = 105 - (logoBoxSize / 2);
    const logoBoxY = 16;

    // White rounded card background for logo
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.3);
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 2, 2, 'FD'); // 2mm corners

    if (logoImg) {
      // Fit official logo image inside
      doc.addImage(logoImg, 'PNG', logoBoxX + 1.5, logoBoxY + 1.5, logoBoxSize - 3, logoBoxSize - 3);
    } else {
      // Fallback text if asset fails
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text('YOROTA', 105, logoBoxY + 10, { align: 'center' });
    }


    // 4. Government Official Headings
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(9, 13, 22);
    doc.text('YOBE STATE ROAD TRAFFIC MANAGEMENT AGENCY (YOROTA)', 105, 48, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text('ICT DAILY PAYOUT SHEET', 105, 54, { align: 'center' });

    // Separator Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(12, 59, 198, 59);

    // 4. Command & Scope Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.rect(12, 63, 186, 11, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(12, 63, 186, 11, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text(`COMMAND:  ${commandName.toUpperCase()}`, 16, 70.5);
    doc.text(`DATE / RANGE:  ${dateRangeText.toUpperCase()}`, 194, 70.5, { align: 'right' });

    // 5. Aggregate Payout Record Columns
    const data = {
      tricycle_own_new_qty: 0, tricycle_own_new_amt: 0,
      tricycle_own_ren_qty: 0, tricycle_own_ren_amt: 0,
      tricycle_rider_new_qty: 0, tricycle_rider_new_amt: 0,
      tricycle_rider_ren_qty: 0, tricycle_rider_ren_amt: 0,
      motorcycle_own_new_qty: 0, motorcycle_own_new_amt: 0,
      motorcycle_own_ren_qty: 0, motorcycle_own_ren_amt: 0,
      motorcycle_rider_new_qty: 0, motorcycle_rider_new_amt: 0,
      motorcycle_rider_ren_qty: 0, motorcycle_rider_ren_amt: 0,
      taxi_new_qty: 0, taxi_new_amt: 0,
      taxi_ren_qty: 0, taxi_ren_amt: 0,
      kurkura_new_qty: 0, kurkura_new_amt: 0,
      kurkura_ren_qty: 0, kurkura_ren_amt: 0,
      lost_tricycle_qty: 0, lost_tricycle_amt: 0,
      lost_motorcycle_qty: 0, lost_motorcycle_amt: 0,
      lost_taxi_qty: 0, lost_taxi_amt: 0,
      lost_kurkura_qty: 0, lost_kurkura_amt: 0,
      change_tricycle_qty: 0, change_tricycle_amt: 0,
      change_motorcycle_qty: 0, change_motorcycle_amt: 0,
      change_taxi_qty: 0, change_taxi_amt: 0,
      change_kurkura_qty: 0, change_kurkura_amt: 0,
      transfer_tricycle_qty: 0, transfer_tricycle_amt: 0,
      transfer_motorcycle_qty: 0, transfer_motorcycle_amt: 0,
      transfer_taxi_qty: 0, transfer_taxi_amt: 0,
      transfer_kurkura_qty: 0, transfer_kurkura_amt: 0,
      others_qty: 0, others_amt: 0,
    };

    records.forEach(r => {
      const name = (r.service?.name || '').toLowerCase();
      const qty = r.quantity || 0;
      const amt = parseFloat(r.amount) || 0;

      if (name.includes('tricycle') || name.includes('napep') || name.includes('jega')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_tricycle_qty += qty; data.lost_tricycle_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_tricycle_qty += qty; data.change_tricycle_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_tricycle_qty += qty; data.transfer_tricycle_amt += amt;
        } else if (name.includes('rider')) {
          if (name.includes('new')) {
            data.tricycle_rider_new_qty += qty; data.tricycle_rider_new_amt += amt;
          } else {
            data.tricycle_rider_ren_qty += qty; data.tricycle_rider_ren_amt += amt;
          }
        } else {
          if (name.includes('new')) {
            data.tricycle_own_new_qty += qty; data.tricycle_own_new_amt += amt;
          } else {
            data.tricycle_own_ren_qty += qty; data.tricycle_own_ren_amt += amt;
          }
        }
      } else if (name.includes('motorcycle') || name.includes('bike')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_motorcycle_qty += qty; data.lost_motorcycle_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_motorcycle_qty += qty; data.change_motorcycle_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_motorcycle_qty += qty; data.transfer_motorcycle_amt += amt;
        } else if (name.includes('rider')) {
          if (name.includes('new')) {
            data.motorcycle_rider_new_qty += qty; data.motorcycle_rider_new_amt += amt;
          } else {
            data.motorcycle_rider_ren_qty += qty; data.motorcycle_rider_ren_amt += amt;
          }
        } else {
          if (name.includes('new')) {
            data.motorcycle_own_new_qty += qty; data.motorcycle_own_new_amt += amt;
          } else {
            data.motorcycle_own_ren_qty += qty; data.motorcycle_own_ren_amt += amt;
          }
        }
      } else if (name.includes('taxi') || name.includes('cab')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_taxi_qty += qty; data.lost_taxi_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_taxi_qty += qty; data.change_taxi_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_taxi_qty += qty; data.transfer_taxi_amt += amt;
        } else {
          if (name.includes('new')) {
            data.taxi_new_qty += qty; data.taxi_new_amt += amt;
          } else {
            data.taxi_ren_qty += qty; data.taxi_ren_amt += amt;
          }
        }
      } else if (name.includes('kurkura') || name.includes('kura')) {
        if (name.includes('lost') || name.includes('sticker') || name.includes('id')) {
          data.lost_kurkura_qty += qty; data.lost_kurkura_amt += amt;
        } else if (name.includes('change') || name.includes('ownership')) {
          data.change_kurkura_qty += qty; data.change_kurkura_amt += amt;
        } else if (name.includes('transfer')) {
          data.transfer_kurkura_qty += qty; data.transfer_kurkura_amt += amt;
        } else {
          if (name.includes('new')) {
            data.kurkura_new_qty += qty; data.kurkura_new_amt += amt;
          } else {
            data.kurkura_ren_qty += qty; data.kurkura_ren_amt += amt;
          }
        }
      } else {
        data.others_qty += qty; data.others_amt += amt;
      }
    });

    const rows = [
      // 1. Tricycle
      ['1.', 'TRICYCLE (NAPEP/JEGA)', '', ''],
      ['', '  - OWNERSHIP: New (₦10,000)', data.tricycle_own_new_qty > 0 ? data.tricycle_own_new_qty.toString() : '-', data.tricycle_own_new_qty > 0 ? `₦${data.tricycle_own_new_amt.toFixed(2)}` : '-'],
      ['', '  - OWNERSHIP: Renewal (₦5,000)', data.tricycle_own_ren_qty > 0 ? data.tricycle_own_ren_qty.toString() : '-', data.tricycle_own_ren_qty > 0 ? `₦${data.tricycle_own_ren_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: New (₦1,500)', data.tricycle_rider_new_qty > 0 ? data.tricycle_rider_new_qty.toString() : '-', data.tricycle_rider_new_qty > 0 ? `₦${data.tricycle_rider_new_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: Renewal (₦1,500)', data.tricycle_rider_ren_qty > 0 ? data.tricycle_rider_ren_qty.toString() : '-', data.tricycle_rider_ren_qty > 0 ? `₦${data.tricycle_rider_ren_amt.toFixed(2)}` : '-'],
      
      // 2. Motorcycle
      ['2.', 'MOTORCYCLE', '', ''],
      ['', '  - OWNERSHIP: New (₦2,500)', data.motorcycle_own_new_qty > 0 ? data.motorcycle_own_new_qty.toString() : '-', data.motorcycle_own_new_qty > 0 ? `₦${data.motorcycle_own_new_amt.toFixed(2)}` : '-'],
      ['', '  - OWNERSHIP: Renewal (₦2,500)', data.motorcycle_own_ren_qty > 0 ? data.motorcycle_own_ren_qty.toString() : '-', data.motorcycle_own_ren_qty > 0 ? `₦${data.motorcycle_own_ren_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: New (₦1,500)', data.motorcycle_rider_new_qty > 0 ? data.motorcycle_rider_new_qty.toString() : '-', data.motorcycle_rider_new_qty > 0 ? `₦${data.motorcycle_rider_new_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: Renewal (₦1,500)', data.motorcycle_rider_ren_qty > 0 ? data.motorcycle_rider_ren_qty.toString() : '-', data.motorcycle_rider_ren_qty > 0 ? `₦${data.motorcycle_rider_ren_amt.toFixed(2)}` : '-'],
      
      // 3. Taxi
      ['3.', 'TAXI', '', ''],
      ['', '  - New (₦10,000)', data.taxi_new_qty > 0 ? data.taxi_new_qty.toString() : '-', data.taxi_new_qty > 0 ? `₦${data.taxi_new_amt.toFixed(2)}` : '-'],
      ['', '  - Renewal (₦5,000)', data.taxi_ren_qty > 0 ? data.taxi_ren_qty.toString() : '-', data.taxi_ren_qty > 0 ? `₦${data.taxi_ren_amt.toFixed(2)}` : '-'],
      
      // 4. Kurkura
      ['4.', 'KURKURA', '', ''],
      ['', '  - New (₦10,000)', data.kurkura_new_qty > 0 ? data.kurkura_new_qty.toString() : '-', data.kurkura_new_qty > 0 ? `₦${data.kurkura_new_amt.toFixed(2)}` : '-'],
      ['', '  - Renewal (₦5,000)', data.kurkura_ren_qty > 0 ? data.kurkura_ren_qty.toString() : '-', data.kurkura_ren_qty > 0 ? `₦${data.kurkura_ren_amt.toFixed(2)}` : '-'],
      
      // 5. Lost ID
      ['5.', 'LOST OF ID/STICKER', '', ''],
      ['', '  - Tricycle (₦2,500)', data.lost_tricycle_qty > 0 ? data.lost_tricycle_qty.toString() : '-', data.lost_tricycle_qty > 0 ? `₦${data.lost_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (₦2,500)', data.lost_motorcycle_qty > 0 ? data.lost_motorcycle_qty.toString() : '-', data.lost_motorcycle_qty > 0 ? `₦${data.lost_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (₦2,500)', data.lost_taxi_qty > 0 ? data.lost_taxi_qty.toString() : '-', data.lost_taxi_qty > 0 ? `₦${data.lost_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (₦2,500)', data.lost_kurkura_qty > 0 ? data.lost_kurkura_qty.toString() : '-', data.lost_kurkura_qty > 0 ? `₦${data.lost_kurkura_amt.toFixed(2)}` : '-'],
      
      // 6. Change of Ownership
      ['6.', 'CHANGE OF OWNERSHIP', '', ''],
      ['', '  - Tricycle (₦2,000)', data.change_tricycle_qty > 0 ? data.change_tricycle_qty.toString() : '-', data.change_tricycle_qty > 0 ? `₦${data.change_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (₦2,000)', data.change_motorcycle_qty > 0 ? data.change_motorcycle_qty.toString() : '-', data.change_motorcycle_qty > 0 ? `₦${data.change_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (₦2,000)', data.change_taxi_qty > 0 ? data.change_taxi_qty.toString() : '-', data.change_taxi_qty > 0 ? `₦${data.change_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (₦2,000)', data.change_kurkura_qty > 0 ? data.change_kurkura_qty.toString() : '-', data.change_kurkura_qty > 0 ? `₦${data.change_kurkura_amt.toFixed(2)}` : '-'],
      
      // 7. Transfer
      ['7.', 'TRANSFER', '', ''],
      ['', '  - Tricycle (₦2,000)', data.transfer_tricycle_qty > 0 ? data.transfer_tricycle_qty.toString() : '-', data.transfer_tricycle_qty > 0 ? `₦${data.transfer_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (₦2,000)', data.transfer_motorcycle_qty > 0 ? data.transfer_motorcycle_qty.toString() : '-', data.transfer_motorcycle_qty > 0 ? `₦${data.transfer_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (₦2,000)', data.transfer_taxi_qty > 0 ? data.transfer_taxi_qty.toString() : '-', data.transfer_taxi_qty > 0 ? `₦${data.transfer_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (₦2,000)', data.transfer_kurkura_qty > 0 ? data.transfer_kurkura_qty.toString() : '-', data.transfer_kurkura_qty > 0 ? `₦${data.transfer_kurkura_amt.toFixed(2)}` : '-'],
    ];

    // Append custom/other classifications if present in records
    if (data.others_qty > 0) {
      rows.push(
        ['8.', 'OTHER SERVICES / REGISTRATIONS', '', ''],
        ['', '  - Custom Category Registrations', data.others_qty.toString(), `₦${data.others_amt.toFixed(2)}`]
      );
    }

    const totalQty = Object.keys(data)
      .filter(k => k.endsWith('_qty'))
      .reduce((sum, k) => sum + data[k], 0);

    const totalAmt = Object.keys(data)
      .filter(k => k.endsWith('_amt'))
      .reduce((sum, k) => sum + data[k], 0);

    // 6. Render Table (Modern layout)
    doc.autoTable({
      startY: 78,
      head: [['S/N', 'DETAILED REGISTRATION FEE DISCLOSURE', 'TOTAL UNITS', 'TOTAL AMOUNT']],
      body: rows,
      headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7, textColor: [9, 13, 22] },
      theme: 'grid',
      styles: { cellPadding: 1.2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { fontStyle: 'normal' },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (dataCell) => {
        // Highlight main headings (S/N is not empty)
        if (dataCell.row.index % 5 === 0 || dataCell.cell.text[0]?.startsWith('1.') || dataCell.cell.text[0]?.startsWith('2.') || dataCell.cell.text[0]?.startsWith('3.') || dataCell.cell.text[0]?.startsWith('4.') || dataCell.cell.text[0]?.startsWith('5.') || dataCell.cell.text[0]?.startsWith('6.') || dataCell.cell.text[0]?.startsWith('7.') || dataCell.cell.text[0]?.startsWith('8.')) {
          if (dataCell.column.index === 1) {
            dataCell.cell.styles.fontStyle = 'bold';
            dataCell.cell.styles.fillColor = [241, 245, 249];
          }
        }
      }
    });

    // 7. Add Grand Total Row Box below table
    let yPos = doc.lastAutoTable.finalY + 3;
    doc.setFillColor(9, 13, 22);
    doc.rect(12, yPos, 186, 9.5, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL SUMS', 16, yPos + 6);
    doc.text(totalQty.toString(), 155, yPos + 6, { align: 'center' });
    doc.text(`₦${totalAmt.toFixed(2)}`, 194, yPos + 6, { align: 'right' });

    // 8. Signatures Block (Matching paper layout perfectly)
    yPos += 18;
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
      // Re-apply premium frame border and corner decorations on new page
      drawPremiumPageBorders(doc);

    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left Signature: ICT Payout Desk Officer
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(9, 13, 22);
    doc.text('ICT PAYOUT DESK OFFICER', 15, yPos);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Officer Name:    ${officerName || 'Duty Officer'}`, 15, yPos + 5.5);
    doc.text('Signature/Date: ............................................', 15, yPos + 12);

    // Right Signature: Unit/Zonal Command
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(9, 13, 22);
    doc.text('UNIT/ZONAL COMMAND', 115, yPos);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Command Officer Name: .............................', 115, yPos + 5.5);
    doc.text('Signature/Date:             .............................', 115, yPos + 12);

    // Centered seal
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.circle(100, yPos + 6, 8);
    doc.setFontSize(5);
    doc.setTextColor(16, 185, 129);
    doc.text('YOROTA', 100, yPos + 5, { align: 'center' });
    doc.text('ICT DEPT', 100, yPos + 8, { align: 'center' });

    // Save File
    doc.save(`YOROTA_ICT_Payout_Sheet_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};

