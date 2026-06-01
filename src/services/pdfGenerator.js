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

const addLogoWatermark = (doc, logoImg) => {
  if (!logoImg) return;
  try {
    const gState = new doc.GState({ opacity: 0.035 }); // 3.5% opacity for faint overlay
    doc.saveGraphicsState();
    doc.setGState(gState);
    doc.addImage(logoImg, 'PNG', 55, 98.5, 100, 100); // perfectly centered A4
    doc.restoreGraphicsState();
  } catch (e) {
    console.error('Failed to draw logo watermark:', e);
  }
};

const addGovernmentHeader = (doc, title, logoImg) => {
  // Official green decorative bar
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, 210, 8, 'F');

  // Government Header Title - standardizing to Yobe State Government
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_DARK);
  doc.text('YOBE STATE GOVERNMENT', 105, 20, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('YOBE STATE ROAD TRAFFIC MANAGEMENT AGENCY (YOROTA)', 105, 26, { align: 'center' });
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
  generateReceipt: async (record) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Preload logo
    const logoImg = await loadImage('/logo.png');

    // 1. Premium Government & Safety Border Frame with Corner Brackets
    drawPremiumPageBorders(doc);

    // Add centered faint logo watermark
    addLogoWatermark(doc, logoImg);

    // 2. Add Standardized Government Header
    addGovernmentHeader(doc, 'Official Payment Receipt', logoImg);

    // 3. Customer Detail Panel (A4 size)
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 52, 180, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, 52, 180, 28, 'S');

    doc.setTextColor(...BRAND_DARK);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CUSTOMER RECORDS:', 20, 58);
    
    const recordId = record.id || '';
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Receipt Number:   RTO-${recordId.substring(2, 8).toUpperCase()}`, 20, 64);
    doc.text(`Customer Name:    ${record.customer_name}`, 20, 70);
    doc.text(`Phone Number:     ${record.phone_number}`, 20, 75);
    
    doc.text(`Issue Date:       ${new Date(record.created_at).toLocaleDateString()}`, 110, 64);
    doc.text(`Issuing Officer:  ${record.officer_name}`, 110, 70);
    doc.text(`Service ID:       ${recordId.substring(0, 12)}`, 110, 75);

    // 4. Itemized table using autoTable for maximum A4 elegance
    const logRows = [[
      record.service?.name || 'Service Category',
      record.quantity.toString(),
      `₦${(record.amount / record.quantity).toFixed(2)}`,
      `₦${parseFloat(record.amount).toFixed(2)}`
    ]];

    doc.autoTable({
      startY: 86,
      head: [['Service Rendered', 'Qty', 'Unit Price', 'Total Amount']],
      body: logRows,
      headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      theme: 'striped',
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      didDrawPage: (data) => {
        drawPremiumPageBorders(doc);
      }
    });

    let currentY = doc.lastAutoTable.finalY + 10;
    
    // 5. Notes / Vehicle Remarks block on the left
    if (record.notes) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, currentY, 100, 25, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(15, currentY, 100, 25, 'S');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND_DARK);
      doc.text('REMARKS / VEHICLE DETAILS:', 20, currentY + 6);
      doc.setFont('Helvetica', 'normal');
      doc.text(record.notes, 20, currentY + 12, { maxWidth: 90 });
    }

    // 6. Totals Panel on the right (x: 125 to 195)
    doc.setFillColor(248, 250, 252);
    doc.rect(125, currentY, 70, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(125, currentY, 70, 25, 'S');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal:', 130, currentY + 6);
    doc.text('Vat (0%):', 130, currentY + 12);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text('GRAND TOTAL:', 130, currentY + 20);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...BRAND_DARK);
    doc.text(`₦${parseFloat(record.amount).toFixed(2)}`, 190, currentY + 6, { align: 'right' });
    doc.text('₦0.00', 190, currentY + 12, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${parseFloat(record.amount).toFixed(2)}`, 190, currentY + 20, { align: 'right' });

    // 7. Validation Seal and Signatures
    let sigY = currentY + 35;
    if (sigY > 240) {
      doc.addPage();
      sigY = 30;
      drawPremiumPageBorders(doc);
    }

    doc.setDrawColor(...BRAND_GREEN);
    doc.setLineWidth(0.8);
    doc.circle(45, sigY + 12, 15);
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND_GREEN);
    doc.setFont('Helvetica', 'bold');
    doc.text('OFFICIAL SEAL', 45, sigY + 10, { align: 'center' });
    doc.text('PAID & VALIDATED', 45, sigY + 15, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(115, sigY + 18, 185, sigY + 18);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ISSUING DESK OFFICER', 115, sigY + 23);
    doc.setFont('Helvetica', 'bold');
    doc.text(record.officer_name, 115, sigY + 28);

    // 8. Footer notice
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('This permit acts as official temporary clearance for road services.', 105, 275, { align: 'center' });
    doc.text('Keep safely in vehicle cabin at all times.', 105, 280, { align: 'center' });

    // Download
    doc.save(`receipt-${record.customer_name.replace(/\s+/g, '_')}-${record.id.substring(2, 6)}.pdf`);
  },

  // --- GENERATE DEBTOR TRANSACTION RECEIPT ---
  generateDebtorReceipt: async (debtor, tx) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Preload logo
    const logoImg = await loadImage('/logo.png');

    // 1. Premium Government & Safety Border Frame with Corner Brackets
    drawPremiumPageBorders(doc);

    // Add centered faint logo watermark
    addLogoWatermark(doc, logoImg);

    // 2. Add Standardized Government Header
    const titleText = tx.type === 'repayment' ? 'Debt Repayment Receipt' : 'Credit Accrual Statement';
    addGovernmentHeader(doc, titleText, logoImg);

    // 3. Debtor Detail Panel (A4 size)
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 52, 180, 32, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, 52, 180, 32, 'S');

    doc.setTextColor(9, 13, 22); // BRAND_DARK
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DEBTOR PROFILE & ACCOUNT DETAILS:', 20, 58);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Customer Name:    ${debtor.customer_name}`, 20, 64);
    doc.text(`Phone Number:     ${debtor.phone_number}`, 20, 70);
    doc.text(`Payment Due Date:  ${debtor.due_date}`, 20, 76);
    
    doc.text(`Receipt Reference: RTO-DB-${debtor.id.substring(0, 6).toUpperCase()}`, 110, 64);
    doc.text(`Transaction Date:  ${tx.date}`, 110, 70);
    doc.text(`Account Status:    ${debtor.status.toUpperCase()}`, 110, 76);

    // 4. Transaction Description Table
    const txTypeLabel = tx.type === 'repayment' ? 'REPAYMENT CASH DEDUCTION (-)' : 'ADDITIONAL CREDIT ACCRUAL (+)';
    const logRows = [[
      txTypeLabel,
      tx.reason || (tx.type === 'repayment' ? 'Cash settlement repayment' : 'Accrued credit addition'),
      `₦${parseFloat(tx.amount).toFixed(2)}`
    ]];

    doc.autoTable({
      startY: 90,
      head: [['Transaction Type / Action', 'Justification / Details', 'Amount']],
      body: logRows,
      headStyles: { fillColor: tx.type === 'repayment' ? BRAND_GREEN : [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      theme: 'striped',
      columnStyles: {
        2: { halign: 'right' }
      },
      didDrawPage: (data) => {
        drawPremiumPageBorders(doc);
      }
    });

    let currentY = doc.lastAutoTable.finalY + 10;
    
    // 5. Audit Remarks block on the left
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 100, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, currentY, 100, 28, 'S');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text('REGULATORY COMPLIANCE AUDIT NOTICE:', 20, currentY + 6);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    const noticeText = tx.type === 'repayment' 
      ? 'This receipt verifies that the cash repayment has been collected, subtracted from the outstanding profile, and registered directly in the office ledger.' 
      : 'This statement confirms that credit has been accrued. Outstanding balances are subject to prompt settlement in accordance with regulatory terms.';
    doc.text(noticeText, 20, currentY + 12, { maxWidth: 90 });

    // 6. Outstanding Balance Summary Card on the right
    doc.setFillColor(248, 250, 252);
    doc.rect(125, currentY, 70, 28, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(125, currentY, 70, 28, 'S');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Transaction Amount:', 130, currentY + 6);
    doc.text('Previous Balance:', 130, currentY + 12);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(tx.type === 'repayment' ? BRAND_GREEN : [217, 119, 6]);
    doc.text('UPDATED DEBT BAL:', 130, currentY + 22);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(9, 13, 22);
    doc.text(`₦${parseFloat(tx.amount).toFixed(2)}`, 190, currentY + 6, { align: 'right' });
    const prevBal = tx.type === 'repayment' ? tx.updatedBalance + tx.amount : tx.updatedBalance - tx.amount;
    doc.text(`₦${parseFloat(Math.max(0, prevBal)).toFixed(2)}`, 190, currentY + 12, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(tx.updatedBalance > 0 ? [239, 68, 68] : BRAND_GREEN);
    doc.text(`₦${parseFloat(tx.updatedBalance).toFixed(2)}`, 190, currentY + 22, { align: 'right' });

    // 7. Validation Seal and Signatures
    let sigY = currentY + 38;
    if (sigY > 240) {
      doc.addPage();
      sigY = 30;
      drawPremiumPageBorders(doc);
    }

    doc.setDrawColor(tx.type === 'repayment' ? BRAND_GREEN : [245, 200, 0]);
    doc.setLineWidth(0.8);
    doc.circle(45, sigY + 12, 15);
    doc.setFontSize(6.5);
    doc.setTextColor(tx.type === 'repayment' ? BRAND_GREEN : [217, 119, 6]);
    doc.setFont('Helvetica', 'bold');
    doc.text('OFFICIAL RECORD', 45, sigY + 9, { align: 'center' });
    doc.text(tx.type === 'repayment' ? 'REPAYMENT STAMP' : 'ACCRUAL STAMP', 45, sigY + 14, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(115, sigY + 18, 185, sigY + 18);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('AUTHORIZING AUDIT OFFICER', 115, sigY + 23);
    doc.setFont('Helvetica', 'bold');
    doc.text(tx.received_by || 'Staff Officer', 115, sigY + 28);

    // 8. Footer notice
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('This receipt acts as an official record of balance adjustment at YOROTA Smart Office.', 105, 275, { align: 'center' });
    doc.text('Please retain this slip for reconciliation reference.', 105, 280, { align: 'center' });

    // Save
    doc.save(`debtor-slip-${debtor.customer_name.replace(/\s+/g, '_')}-${tx.type}.pdf`);
  },


  // --- GENERATE REPORT (DAILY/MONTHLY/CUSTOM RANGE) ---
  generateReport: async (type, dateRangeText, records, summary, transactions) => {
    const doc = new jsPDF();
    
    // Preload logo
    const logoImg = await loadImage('/logo.png');
    // Add Header
    addGovernmentHeader(doc, `${type} Activity & Report`, logoImg);

    // Draw premium page borders!
    drawPremiumPageBorders(doc);

    // Add centered faint logo watermark
    addLogoWatermark(doc, logoImg);

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
      didDrawPage: (data) => {
        drawPremiumPageBorders(doc);
      }
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
      theme: 'striped',
      didDrawPage: (data) => {
        drawPremiumPageBorders(doc);
      }
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

    // Draw premium page borders!
    drawPremiumPageBorders(doc);

    // Add centered faint logo watermark
    addLogoWatermark(doc, logoImg);

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
      },
      didDrawPage: (data) => {
        drawPremiumPageBorders(doc);
      }
    });

    // Signature stamp lines
    addSignatureBlock(doc, doc.lastAutoTable.finalY + 15, transactions[0]?.collected_by);

    doc.save(`ledger-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  generateIctPayoutReport: async (dateRangeText, records, officerName, commandName) => {
    const doc = new jsPDF();

    // Preload logo
    const logoImg = await loadImage('/logo.png');

    // 1. Premium Government & Safety Border Frame with Corner Brackets
    drawPremiumPageBorders(doc);

    // 2. Faint Center Watermark (Logo watermark)
    addLogoWatermark(doc, logoImg);

    // Double Solid Yellow road dividing lines (thematic top accent)
    doc.setDrawColor(245, 200, 0);
    doc.setLineWidth(0.8);
    doc.line(15, 11, 195, 11);
    doc.line(15, 12.8, 195, 12.8);

    // 3. Center Logo Container (Perfect match to high-fidelity A4 web preview)
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

    const cleanCommand = (commandName || '').toUpperCase();
    const cleanDateRange = (dateRangeText || '').toUpperCase();

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text(`COMMAND:  ${cleanCommand}`, 16, 70.5);
    doc.text(`DATE / RANGE:  ${cleanDateRange}`, 194, 70.5, { align: 'right' });

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
      const name = r.service?.name || '';
      const qty = r.quantity || 0;
      const amt = parseFloat(r.amount) || 0;

      const isLostStickerId = /\b(lost|sticker|id)\b/i.test(name);
      const isChangeOwnership = /\b(change|ownership)\b/i.test(name);
      const isTransfer = /\btransfer\b/i.test(name);
      const isRider = /\brider\b/i.test(name);
      const isNew = /\bnew\b/i.test(name);

      const isTricycle = /\b(tricycle|napep|jega)\b/i.test(name);
      const isMotorcycle = /\b(motorcycle|bike)\b/i.test(name);
      const isTaxi = /\b(taxi|cab|car)\b/i.test(name);
      const isKurkura = /\b(kurkura|kura)\b/i.test(name);

      if (isTricycle) {
        if (isLostStickerId) {
          data.lost_tricycle_qty += qty; data.lost_tricycle_amt += amt;
        } else if (isChangeOwnership) {
          data.change_tricycle_qty += qty; data.change_tricycle_amt += amt;
        } else if (isTransfer) {
          data.transfer_tricycle_qty += qty; data.transfer_tricycle_amt += amt;
        } else if (isRider) {
          if (isNew) {
            data.tricycle_rider_new_qty += qty; data.tricycle_rider_new_amt += amt;
          } else {
            data.tricycle_rider_ren_qty += qty; data.tricycle_rider_ren_amt += amt;
          }
        } else {
          if (isNew) {
            data.tricycle_own_new_qty += qty; data.tricycle_own_new_amt += amt;
          } else {
            data.tricycle_own_ren_qty += qty; data.tricycle_own_ren_amt += amt;
          }
        }
      } else if (isMotorcycle) {
        if (isLostStickerId) {
          data.lost_motorcycle_qty += qty; data.lost_motorcycle_amt += amt;
        } else if (isChangeOwnership) {
          data.change_motorcycle_qty += qty; data.change_motorcycle_amt += amt;
        } else if (isTransfer) {
          data.transfer_motorcycle_qty += qty; data.transfer_motorcycle_amt += amt;
        } else if (isRider) {
          if (isNew) {
            data.motorcycle_rider_new_qty += qty; data.motorcycle_rider_new_amt += amt;
          } else {
            data.motorcycle_rider_ren_qty += qty; data.motorcycle_rider_ren_amt += amt;
          }
        } else {
          if (isNew) {
            data.motorcycle_own_new_qty += qty; data.motorcycle_own_new_amt += amt;
          } else {
            data.motorcycle_own_ren_qty += qty; data.motorcycle_own_ren_amt += amt;
          }
        }
      } else if (isTaxi) {
        if (isLostStickerId) {
          data.lost_taxi_qty += qty; data.lost_taxi_amt += amt;
        } else if (isChangeOwnership) {
          data.change_taxi_qty += qty; data.change_taxi_amt += amt;
        } else if (isTransfer) {
          data.transfer_taxi_qty += qty; data.transfer_taxi_amt += amt;
        } else {
          if (isNew) {
            data.taxi_new_qty += qty; data.taxi_new_amt += amt;
          } else {
            data.taxi_ren_qty += qty; data.taxi_ren_amt += amt;
          }
        }
      } else if (isKurkura) {
        if (isLostStickerId) {
          data.lost_kurkura_qty += qty; data.lost_kurkura_amt += amt;
        } else if (isChangeOwnership) {
          data.change_kurkura_qty += qty; data.change_kurkura_amt += amt;
        } else if (isTransfer) {
          data.transfer_kurkura_qty += qty; data.transfer_kurkura_amt += amt;
        } else {
          if (isNew) {
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

    // 6. Draw Manual Vector Grid Table (1-to-1 scan parity, fits exactly on 1 page)
    // Draw outer boundary frame
    doc.setDrawColor(9, 13, 22);
    doc.setLineWidth(0.6);
    doc.rect(12, 78, 186, 156, 'S');

    // Draw header fill
    doc.setFillColor(...BRAND_GREEN);
    doc.rect(12.3, 78.3, 185.4, 7.4, 'F');

    // Horizontal grid line heights
    const horizontalLines = [
      86, 
      92, 97.5, 103, 108,
      114, 119.5, 125, 130,
      136, 142, 148,
      154, 160, 166,
      172, 178, 184,
      190, 196, 202,
      208, 214, 220,
      227
    ];
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.4);
    horizontalLines.forEach(hy => {
      doc.line(12, hy, 198, hy);
    });

    // Main column vertical lines
    doc.setDrawColor(9, 13, 22); // Solid black columns
    doc.setLineWidth(0.5);
    doc.line(24, 78, 24, 220); // S/N column
    doc.line(156, 78, 156, 234); // TOTAL/AMOUNT column

    // Inner Grid Dividers
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.4);

    // Row 1 (Tricycle)
    doc.line(90, 92, 90, 108); // center split
    doc.line(57, 97.5, 57, 108); // left split
    doc.line(123, 97.5, 123, 108); // right split

    // Row 2 (Motorcycle)
    doc.line(90, 114, 90, 130); // center split
    doc.line(57, 119.5, 57, 130); // left split
    doc.line(123, 119.5, 123, 130); // right split

    // Row 3 (Taxi)
    doc.line(90, 136, 90, 148);

    // Row 4 (Kurkura)
    doc.line(90, 154, 90, 166);

    // Row 5 (Lost of ID)
    doc.line(57, 172, 57, 184);
    doc.line(90, 172, 90, 184);
    doc.line(123, 172, 123, 184);

    // Row 6 (Change of Ownership)
    doc.line(57, 190, 57, 202);
    doc.line(90, 190, 90, 202);
    doc.line(123, 190, 123, 202);

    // Row 7 (Transfer)
    doc.line(57, 208, 57, 220);
    doc.line(90, 208, 90, 220);
    doc.line(123, 208, 123, 220);

    // Helper to render text centered inside cell bounds
    const drawCenteredText = (text, x1, x2, y, bold = false, size = 6.5, color = [9, 13, 22]) => {
      doc.setFont('Helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const cx = x1 + (x2 - x1) / 2;
      doc.text(text, cx, y, { align: 'center' });
    };

    // --- TABLE HEADERS ---
    drawCenteredText('S/N', 12, 24, 83, true, 8, [255, 255, 255]);
    drawCenteredText('DETAILED FEE CATEGORY BREAKDOWNS', 24, 156, 83, true, 8, [255, 255, 255]);
    drawCenteredText('TOTAL / AMOUNT', 156, 198, 83, true, 8, [255, 255, 255]);

    // --- ROW 1: TRICYCLE ---
    drawCenteredText('1.', 12, 24, 90.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text('TRICYCLE (NAPEP/JEGA)', 26, 90.5);
    drawCenteredText('OWNERSHIP', 24, 90, 96, true, 7.5);
    drawCenteredText('RIDER', 90, 156, 96, true, 7.5);
    drawCenteredText('New (₦10,000)', 24, 57, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (₦5,000)', 57, 90, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('New (₦1,500)', 90, 123, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (₦1,500)', 123, 156, 101, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 106.5);
    drawCenteredText(data.tricycle_own_new_qty > 0 ? `${data.tricycle_own_new_qty} units (₦${data.tricycle_own_new_amt.toLocaleString()})` : '-', 24, 57, 106.5, false, 7);
    drawCenteredText(data.tricycle_own_ren_qty > 0 ? `${data.tricycle_own_ren_qty} units (₦${data.tricycle_own_ren_amt.toLocaleString()})` : '-', 57, 90, 106.5, false, 7);
    drawCenteredText(data.tricycle_rider_new_qty > 0 ? `${data.tricycle_rider_new_qty} units (₦${data.tricycle_rider_new_amt.toLocaleString()})` : '-', 90, 123, 106.5, false, 7);
    drawCenteredText(data.tricycle_rider_ren_qty > 0 ? `${data.tricycle_rider_ren_qty} units (₦${data.tricycle_rider_ren_amt.toLocaleString()})` : '-', 123, 156, 106.5, false, 7);
    const triTotal = data.tricycle_own_new_amt + data.tricycle_own_ren_amt + data.tricycle_rider_new_amt + data.tricycle_rider_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${triTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 98, { align: 'right' });

    // --- ROW 2: MOTORCYCLE ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('2.', 12, 24, 112.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('MOTORCYCLE', 26, 112.5);
    drawCenteredText('OWNERSHIP', 24, 90, 118, true, 7.5);
    drawCenteredText('RIDER', 90, 156, 118, true, 7.5);
    drawCenteredText('New (₦2,500)', 24, 57, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (₦2,500)', 57, 90, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('New (₦1,500)', 90, 123, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (₦1,500)', 123, 156, 123, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 128.5);
    drawCenteredText(data.motorcycle_own_new_qty > 0 ? `${data.motorcycle_own_new_qty} units (₦${data.motorcycle_own_new_amt.toLocaleString()})` : '-', 24, 57, 128.5, false, 7);
    drawCenteredText(data.motorcycle_own_ren_qty > 0 ? `${data.motorcycle_own_ren_qty} units (₦${data.motorcycle_own_ren_amt.toLocaleString()})` : '-', 57, 90, 128.5, false, 7);
    drawCenteredText(data.motorcycle_rider_new_qty > 0 ? `${data.motorcycle_rider_new_qty} units (₦${data.motorcycle_rider_new_amt.toLocaleString()})` : '-', 90, 123, 128.5, false, 7);
    drawCenteredText(data.motorcycle_rider_ren_qty > 0 ? `${data.motorcycle_rider_ren_qty} units (₦${data.motorcycle_rider_ren_amt.toLocaleString()})` : '-', 123, 156, 128.5, false, 7);
    const motoTotal = data.motorcycle_own_new_amt + data.motorcycle_own_ren_amt + data.motorcycle_rider_new_amt + data.motorcycle_rider_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${motoTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 120, { align: 'right' });

    // --- ROW 3: TAXI ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('3.', 12, 24, 134.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TAXI', 26, 134.5);
    drawCenteredText('New (₦10,000)', 24, 90, 140, false, 7, [100, 116, 139]);
    drawCenteredText('Renewal (₦5,000)', 90, 156, 140, false, 7, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 146.5);
    drawCenteredText(data.taxi_new_qty > 0 ? `${data.taxi_new_qty} units (₦${data.taxi_new_amt.toLocaleString()})` : '-', 24, 90, 146.5, false, 7);
    drawCenteredText(data.taxi_ren_qty > 0 ? `${data.taxi_ren_qty} units (₦${data.taxi_ren_amt.toLocaleString()})` : '-', 90, 156, 146.5, false, 7);
    const taxiTotal = data.taxi_new_amt + data.taxi_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${taxiTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 140, { align: 'right' });

    // --- ROW 4: KURKURA ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('4.', 12, 24, 152.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KURKURA', 26, 152.5);
    drawCenteredText('New (₦10,000)', 24, 90, 158, false, 7, [100, 116, 139]);
    drawCenteredText('Renewal (₦5,000)', 90, 156, 158, false, 7, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 164.5);
    drawCenteredText(data.kurkura_new_qty > 0 ? `${data.kurkura_new_qty} units (₦${data.kurkura_new_amt.toLocaleString()})` : '-', 24, 90, 164.5, false, 7);
    drawCenteredText(data.kurkura_ren_qty > 0 ? `${data.kurkura_ren_qty} units (₦${data.kurkura_ren_amt.toLocaleString()})` : '-', 90, 156, 164.5, false, 7);
    const kurTotal = data.kurkura_new_amt + data.kurkura_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${kurTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 158, { align: 'right' });

    // --- ROW 5: LOST OF ID/STICKER ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('5.', 12, 24, 170.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('LOST OF ID/STICKER', 26, 170.5);
    drawCenteredText('Tricycle (₦2,500)', 24, 57, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (₦2,500)', 57, 90, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (₦2,500)', 90, 123, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (₦2,500)', 123, 156, 176, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 182.5);
    drawCenteredText(data.lost_tricycle_qty > 0 ? `${data.lost_tricycle_qty} (₦${data.lost_tricycle_amt.toLocaleString()})` : '-', 24, 57, 182.5, false, 7);
    drawCenteredText(data.lost_motorcycle_qty > 0 ? `${data.lost_motorcycle_qty} (₦${data.lost_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 182.5, false, 7);
    drawCenteredText(data.lost_taxi_qty > 0 ? `${data.lost_taxi_qty} (₦${data.lost_taxi_amt.toLocaleString()})` : '-', 90, 123, 182.5, false, 7);
    drawCenteredText(data.lost_kurkura_qty > 0 ? `${data.lost_kurkura_qty} (₦${data.lost_kurkura_amt.toLocaleString()})` : '-', 123, 156, 182.5, false, 7);
    const lostTotal = data.lost_tricycle_amt + data.lost_motorcycle_amt + data.lost_taxi_amt + data.lost_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${lostTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 176, { align: 'right' });

    // --- ROW 6: CHANGE OF OWNERSHIP ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('6.', 12, 24, 188.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CHANGE OF OWNERSHIP', 26, 188.5);
    drawCenteredText('Tricycle (₦2,000)', 24, 57, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (₦2,000)', 57, 90, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (₦2,000)', 90, 123, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (₦2,000)', 123, 156, 194, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 200.5);
    drawCenteredText(data.change_tricycle_qty > 0 ? `${data.change_tricycle_qty} (₦${data.change_tricycle_amt.toLocaleString()})` : '-', 24, 57, 200.5, false, 7);
    drawCenteredText(data.change_motorcycle_qty > 0 ? `${data.change_motorcycle_qty} (₦${data.change_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 200.5, false, 7);
    drawCenteredText(data.change_taxi_qty > 0 ? `${data.change_taxi_qty} (₦${data.change_taxi_amt.toLocaleString()})` : '-', 90, 123, 200.5, false, 7);
    drawCenteredText(data.change_kurkura_qty > 0 ? `${data.change_kurkura_qty} (₦${data.change_kurkura_amt.toLocaleString()})` : '-', 123, 156, 200.5, false, 7);
    const chgTotal = data.change_tricycle_amt + data.change_motorcycle_amt + data.change_taxi_amt + data.change_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${chgTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 194, { align: 'right' });

    // --- ROW 7: TRANSFER ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('7.', 12, 24, 206.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TRANSFER', 26, 206.5);
    drawCenteredText('Tricycle (₦2,000)', 24, 57, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (₦2,000)', 57, 90, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (₦2,000)', 90, 123, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (₦2,000)', 123, 156, 212, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 218.5);
    drawCenteredText(data.transfer_tricycle_qty > 0 ? `${data.transfer_tricycle_qty} (₦${data.transfer_tricycle_amt.toLocaleString()})` : '-', 24, 57, 218.5, false, 7);
    drawCenteredText(data.transfer_motorcycle_qty > 0 ? `${data.transfer_motorcycle_qty} (₦${data.transfer_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 218.5, false, 7);
    drawCenteredText(data.transfer_taxi_qty > 0 ? `${data.transfer_taxi_qty} (₦${data.transfer_taxi_amt.toLocaleString()})` : '-', 90, 123, 218.5, false, 7);
    drawCenteredText(data.transfer_kurkura_qty > 0 ? `${data.transfer_kurkura_qty} (₦${data.transfer_kurkura_amt.toLocaleString()})` : '-', 123, 156, 218.5, false, 7);
    const transTotal = data.transfer_tricycle_amt + data.transfer_motorcycle_amt + data.transfer_taxi_amt + data.transfer_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`₦${transTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 212, { align: 'right' });

    // --- TOTAL ROWS (AT THE BOTTOM) ---
    // Total Units Row
    doc.setFillColor(241, 245, 249);
    doc.rect(12.3, 220.3, 185.4, 6.4, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text('TOTAL UNITS', 150, 225, { align: 'right' });
    doc.text(`${totalQty.toLocaleString()} Units`, 194, 225, { align: 'right' });

    // Total Amount Row
    doc.setFillColor(...BRAND_DARK);
    doc.rect(12.3, 227.3, 185.4, 6.4, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL AMOUNT DUE', 150, 232, { align: 'right' });
    doc.text(`₦${totalAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 232, { align: 'right' });

    // 8. Signatures Block (Matching physical layout perfectly on exactly one page)
    const sigY = 248;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left Signature: ICT Payout Desk Officer
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text('ICT PAYOUT DESK OFFICER', 15, sigY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Name:   ${officerName || '................................'}`, 15, sigY + 6.5);
    doc.text('Sign/Date: ............................................', 15, sigY + 13);

    // Right Signature: Unit/Zonal Command
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(9, 13, 22);
    doc.text('UNIT/ZONAL COMMAND', 115, sigY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Name:   ............................................', 115, sigY + 6.5);
    doc.text('Sign/Date: ............................................', 115, sigY + 13);

    // Centered seal
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.6);
    doc.circle(100, sigY + 6, 8);
    doc.setFontSize(5);
    doc.setTextColor(16, 185, 129);
    doc.text('YOROTA', 100, sigY + 5, { align: 'center' });
    doc.text('ICT DEPT', 100, sigY + 8, { align: 'center' });

    // Save File
    doc.save(`YOROTA_ICT_Payout_Sheet_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};

