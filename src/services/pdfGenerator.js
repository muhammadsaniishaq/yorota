// YOROTA Smart Office - Government-grade PDF Generator Service
// Integrates jsPDF and jsPDF-AutoTable for premium administrative prints

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// Auto-sanitize texts passed to jsPDF to prevent WinAnsiEncoding (CP-1252) crashes
const cleanText = (val) => {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(cleanText);
  if (typeof val !== 'string') return String(val);
  
  // Replace Naira symbol with N
  let cleaned = val.replace(/₦/g, 'N');
  
  let result = '';
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    // CP-1252 allowed characters range check
    const isCp1252 = 
      (code >= 32 && code <= 126) || 
      (code >= 160 && code <= 255) ||
      code === 9 || code === 10 || code === 13 ||
      [0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017D, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x017E, 0x0178].includes(code);
      
    if (isCp1252) {
      result += cleaned[i];
    } else {
      if (code === 8358 || code === 8374) {
        result += 'N';
      } else {
        result += ' ';
      }
    }
  }
  return result;
};



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
    doc.text(`Customer Name:    ${cleanText(record.customer_name)}`, 20, 70);
    doc.text(`Phone Number:     ${cleanText(record.phone_number)}`, 20, 75);
    
    doc.text(`Issue Date:       ${new Date(record.created_at).toLocaleDateString()}`, 110, 64);
    doc.text(`Issuing Officer:  ${cleanText(record.officer_name)}`, 110, 70);
    doc.text(`Service ID:       ${recordId.substring(0, 12)}`, 110, 75);

    // 4. Itemized table using autoTable for maximum A4 elegance
    const logRows = [[
      cleanText(record.service?.name || 'Service Category'),
      record.quantity.toString(),
      `N${(record.amount / record.quantity).toFixed(2)}`,
      `N${parseFloat(record.amount).toFixed(2)}`
    ]];

    autoTable(doc, {
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
      doc.text(cleanText(record.notes), 20, currentY + 12, { maxWidth: 90 });
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
    doc.text(`N${parseFloat(record.amount).toFixed(2)}`, 190, currentY + 6, { align: 'right' });
    doc.text('N0.00', 190, currentY + 12, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${parseFloat(record.amount).toFixed(2)}`, 190, currentY + 20, { align: 'right' });

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
    doc.text(cleanText(record.officer_name), 115, sigY + 28);

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
    try {
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
    doc.text(`Customer Name:    ${cleanText(debtor.customer_name)}`, 20, 64);
    doc.text(`Phone Number:     ${cleanText(debtor.phone_number)}`, 20, 70);
    doc.text(`Payment Due Date:  ${cleanText(debtor.due_date)}`, 20, 76);
    
    doc.text(`Receipt Reference: RTO-DB-${cleanText(debtor.id.substring(0, 6).toUpperCase())}`, 110, 64);
    doc.text(`Transaction Date:  ${cleanText(tx.date)}`, 110, 70);
    doc.text(`Account Status:    ${cleanText(debtor.status.toUpperCase())}`, 110, 76);

    // 4. Transaction Description Table
    const txTypeLabel = tx.type === 'repayment' ? 'REPAYMENT CASH DEDUCTION (-)' : 'ADDITIONAL CREDIT ACCRUAL (+)';
    const logRows = [[
      txTypeLabel,
      cleanText(tx.reason || (tx.type === 'repayment' ? 'Cash settlement repayment' : 'Accrued credit addition')),
      `N${parseFloat(tx.amount).toFixed(2)}`
    ]];

    autoTable(doc, {
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
    doc.setTextColor(...(tx.type === 'repayment' ? BRAND_GREEN : [217, 119, 6]));
    doc.text('UPDATED DEBT BAL:', 130, currentY + 22);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(9, 13, 22);
    doc.text(`N${parseFloat(tx.amount).toFixed(2)}`, 190, currentY + 6, { align: 'right' });
    const prevBal = tx.type === 'repayment' ? Number(tx.updatedBalance) + Number(tx.amount) : Number(tx.updatedBalance) - Number(tx.amount);
    doc.text(`N${parseFloat(Math.max(0, prevBal)).toFixed(2)}`, 190, currentY + 12, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...(tx.updatedBalance > 0 ? [239, 68, 68] : BRAND_GREEN));
    doc.text(`N${parseFloat(tx.updatedBalance).toFixed(2)}`, 190, currentY + 22, { align: 'right' });

    // 7. Validation Seal and Signatures
    let sigY = currentY + 38;
    if (sigY > 240) {
      doc.addPage();
      sigY = 30;
      drawPremiumPageBorders(doc);
    }

    doc.setDrawColor(...(tx.type === 'repayment' ? BRAND_GREEN : [245, 200, 0]));
    doc.setLineWidth(0.8);
    doc.circle(45, sigY + 12, 15);
    doc.setFontSize(6.5);
    doc.setTextColor(...(tx.type === 'repayment' ? BRAND_GREEN : [217, 119, 6]));
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
    doc.text(cleanText(tx.received_by || 'Staff Officer'), 115, sigY + 28);

    // 8. Footer notice
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('This receipt acts as an official record of balance adjustment at YOROTA Smart Office.', 105, 275, { align: 'center' });
    doc.text('Please retain this slip for reconciliation reference.', 105, 280, { align: 'center' });

      // Save
      doc.save(`debtor-slip-${debtor.customer_name.replace(/\s+/g, '_')}-${tx.type}.pdf`);
    } catch (e) {
      console.error('generateDebtorReceipt error:', e);
      throw e;
    }
  },

  // --- GENERATE DEBTOR TRANSACTION THERMAL RECEIPT (58MM) ---
  generateDebtorThermalReceipt: async (debtor, tx) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 140]
    });

    // 1. Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Solid black for thermal printer
    doc.text('YOROTA SMART OFFICE', 29, 8, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('YOBE STATE ROAD TRAFFIC MANAGEMENT AGENCY', 29, 12, { align: 'center' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(tx.type === 'repayment' ? 'DEBT REPAYMENT SLIP' : 'CREDIT ACCRUAL SLIP', 29, 16, { align: 'center' });

    // Separator line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(4, 19, 54, 19);

    // 2. Debtor Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('DEBTOR PROFILE:', 4, 23);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Name: ${debtor.customer_name}`, 4, 27);
    doc.text(`Phone: ${debtor.phone_number}`, 4, 31);
    doc.text(`Ref: RTO-DB-${debtor.id.substring(0, 6).toUpperCase()}`, 4, 35);
    doc.text(`Date: ${tx.date}`, 4, 39);
    doc.text(`Due Date: ${debtor.due_date}`, 4, 43);

    doc.line(4, 46, 54, 46);

    // 3. Transaction Details
    const txTypeLabel = tx.type === 'repayment' ? 'REPAYMENT DEDUCTION' : 'CREDIT ACCRUAL';
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('TRANSACTION DETAILS:', 4, 50);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Type: ${txTypeLabel}`, 4, 54);
    doc.text(`Reason: ${tx.reason || (tx.type === 'repayment' ? 'Cash settlement repayment' : 'Accrued credit addition')}`, 4, 58, { maxWidth: 50 });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`Amount: N${parseFloat(tx.amount).toFixed(2)}`, 4, 66);

    doc.line(4, 69, 54, 69);

    // 4. Balances
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6);
    const prevBal = tx.type === 'repayment' ? Number(tx.updatedBalance) + Number(tx.amount) : Number(tx.updatedBalance) - Number(tx.amount);
    doc.text(`Previous Balance:  N${parseFloat(Math.max(0, prevBal)).toFixed(2)}`, 4, 73);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`UPDATED BALANCE:   N${parseFloat(tx.updatedBalance).toFixed(2)}`, 4, 78);

    doc.line(4, 81, 54, 81);

    // 5. Compliance & Signature
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(5.5);
    const noticeText = tx.type === 'repayment'
      ? 'Verified: Cash repayment collected and subtracted from outstanding balance.'
      : 'Statement: Credit accrued subject to prompt settlement under regulatory terms.';
    doc.text(noticeText, 4, 85, { maxWidth: 50 });

    // Authorizing Officer
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.text(`Officer: ${tx.received_by || 'Staff Officer'}`, 4, 96);

    // Signature lines
    doc.setLineWidth(0.1);
    doc.line(4, 110, 24, 110);
    doc.line(34, 110, 54, 110);
    doc.setFont('Helvetica', 'normal');
    doc.text('Officer Sig', 8, 113);
    doc.text('Customer Sig', 38, 113);

    // Footer message
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.text('Thank you for your cooperation!', 29, 123, { align: 'center' });
    doc.text('YOROTA Smart Office', 29, 126, { align: 'center' });

    // Save
    doc.save(`thermal-slip-${debtor.customer_name.replace(/\s+/g, '_')}-${tx.type}.pdf`);
  },

  // --- PRINT DEBTOR TRANSACTION THERMAL SLIP DIRECTLY TO BLUETOOTH/SYSTEM PRINTER ---
  printDebtorThermalSlip: (debtor, tx) => {
    try {
      const isRepayment = tx.type === 'repayment';
      const txTypeLabel = isRepayment ? 'DEBT REPAYMENT SLIP' : 'CREDIT ACCRUAL SLIP';
      const prevBal = isRepayment ? Number(tx.updatedBalance) + Number(tx.amount) : Number(tx.updatedBalance) - Number(tx.amount);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Thermal Print Receipt</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              width: 50mm;
              margin: 0 auto;
              padding: 4mm 0;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              line-height: 1.3;
              color: #000;
              background-color: #fff;
            }
            .text-center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .title {
              font-size: 11px;
              line-height: 1.2;
              margin-bottom: 2px;
            }
            .subtitle {
              font-size: 7px;
              line-height: 1.2;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
            }
            .section-title {
              font-size: 9px;
              font-weight: bold;
              margin-top: 6px;
              margin-bottom: 3px;
              text-decoration: underline;
            }
            .amount-box {
              font-size: 11px;
              margin: 8px 0;
              text-align: center;
              border: 1px solid #000;
              padding: 4px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 25px;
              margin-bottom: 10px;
            }
            .sig-box {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .sig-line {
              width: 20mm;
              border-top: 1px solid #000;
              margin-bottom: 2px;
            }
            .sig-label {
              font-size: 7px;
              text-transform: uppercase;
            }
            .footer {
              font-size: 7px;
              text-align: center;
              margin-top: 15px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="text-center bold title">YOROTA SMART OFFICE</div>
          <div class="text-center subtitle">Yobe State Road Traffic Management Agency</div>
          <div class="text-center bold" style="font-size: 9px; margin-top: 2px;">${txTypeLabel}</div>
          
          <div class="divider"></div>
          
          <div class="section-title">DEBTOR PROFILE:</div>
          <div class="row"><span>Name:</span><span class="bold">${debtor.customer_name}</span></div>
          <div class="row"><span>Phone:</span><span>${debtor.phone_number}</span></div>
          <div class="row"><span>Ref:</span><span>RTO-DB-${debtor.id.substring(0, 6).toUpperCase()}</span></div>
          <div class="row"><span>Date:</span><span>${tx.date}</span></div>
          <div class="row"><span>Due Date:</span><span>${debtor.due_date}</span></div>
          
          <div class="divider"></div>
          
          <div class="section-title">TRANSACTION DETAILS:</div>
          <div style="word-wrap: break-word; max-width: 50mm;">
            <span>Reason:</span><br/>
            <span style="font-style: italic;">${tx.reason || (isRepayment ? 'Cash settlement repayment' : 'Accrued credit addition')}</span>
          </div>
          <div class="amount-box bold">
            AMOUNT: ₦${parseFloat(tx.amount).toFixed(2)}
          </div>
          
          <div class="divider"></div>
          
          <div class="row">
            <span>Previous Balance:</span>
            <span>₦${parseFloat(Math.max(0, prevBal)).toFixed(2)}</span>
          </div>
          <div class="row bold" style="font-size: 11px; margin-top: 2px;">
            <span>UPDATED BALANCE:</span>
            <span>₦${parseFloat(tx.updatedBalance).toFixed(2)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 8px; margin-top: 4px; text-align: justify;">
            ${isRepayment 
              ? 'Verified: Cash repayment collected and subtracted from outstanding balance.' 
              : 'Statement: Credit accrued subject to prompt settlement under regulatory terms.'}
          </div>
          <div style="margin-top: 6px; font-size: 8px;">
            <span>Officer:</span> <span class="bold">${tx.received_by || 'Staff Officer'}</span>
          </div>
          
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Officer Sig</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Customer Sig</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            Thank you for your cooperation!<br/>
            YOROTA Smart Office
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (!printWindow) {
        throw new Error('Popup blocked! Please allow popups for this site to print receipts.');
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error('printDebtorThermalSlip error:', err);
      throw err;
    }
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
    doc.text(`N${parseFloat(summary.totalAmount).toFixed(2)}`, 81, 75);

    // Card 3
    doc.setFillColor(248, 250, 252);
    doc.rect(140, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('LEDGER NET BALANCE', 144, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...(summary.ledgerNet >= 0 ? BRAND_GREEN : [239, 68, 68]));
    doc.text(`N${parseFloat(summary.ledgerNet || 0).toFixed(2)}`, 144, 75);

    // Set-aside Revenue Surcharge Splits Audit Block (N500 per unit, 70% HQ / 30% local office)
    let ySplit = 85;
    doc.setFillColor(245, 247, 250);
    doc.rect(15, ySplit, 180, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(15, ySplit, 180, 22, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND_GREEN);
    doc.text('REVENUE SHARE & RETENTION SURCHARGE AUDIT (N500 / unit)', 20, ySplit + 5.5);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND_DARK);
    doc.text('Headquarters Share (70%):', 20, ySplit + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Gen: N${parseFloat(summary.setAsideHQ || 0).toFixed(2)} | Paid: N${parseFloat(summary.hqRemitted || 0).toFixed(2)} | Due: N${parseFloat(summary.hqOutstanding || 0).toFixed(2)}`, 20, ySplit + 16);

    doc.setFont('Helvetica', 'bold');
    doc.text('Local Office Share (30%):', 110, ySplit + 11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Gen: N${parseFloat(summary.setAsideOffice || 0).toFixed(2)} | Spent: N${parseFloat(summary.officeDisbursed || 0).toFixed(2)} | Retained: N${parseFloat(summary.officeBalance || 0).toFixed(2)}`, 110, ySplit + 16);

    // Header 1: Category Summary Breakdowns
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('SERVICE CATEGORY SUMMARY', 15, 114);

    // Create service table body
    const catRows = Object.entries(summary.categories).map(([name, count]) => {
      const serviceRecords = records.filter(r => r.service?.name === name);
      const totalAmount = serviceRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      return [name, count.toString(), `N${totalAmount.toFixed(2)}`];
    });

    autoTable(doc, {
      startY: 118,
      head: [['Category Service Name', 'Units Logged', 'Revenue Generated']],
      body: catRows.length > 0 ? catRows : [['No data recorded', '0', 'N0.00']],
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
      `N${parseFloat(rec.amount).toFixed(2)}`,
      rec.officer_name
    ]);

    autoTable(doc, {
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
    doc.text(`N${parseFloat(summary.totalIncome).toFixed(2)}`, 19, 75);

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
    doc.text(`N${parseFloat(summary.totalExpenses).toFixed(2)}`, 81, 75);

    // Card 3: Net Cash
    doc.setFillColor(248, 250, 252);
    doc.rect(140, 60, 55, 20, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_DARK);
    doc.text('NET CASH BALANCE', 144, 65);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...(summary.remainingBalance >= 0 ? BRAND_GREEN : [239, 68, 68]));
    doc.text(`N${parseFloat(summary.remainingBalance).toFixed(2)}`, 144, 75);

    // Header 1: Ledgers
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text('ITEMIZED LEDGER TRANSACTIONS', 15, 92);

    const txRows = transactions.map(t => [
      t.date,
      t.type.toUpperCase(),
      t.purpose,
      `N${parseFloat(t.amount).toFixed(2)}`,
      t.collected_by
    ]);

    autoTable(doc, {
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
      const isChangeOwnership = /\bchange\b/i.test(name);
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
      ['', '  - OWNERSHIP: New (N10,000)', data.tricycle_own_new_qty > 0 ? data.tricycle_own_new_qty.toString() : '-', data.tricycle_own_new_qty > 0 ? `N${data.tricycle_own_new_amt.toFixed(2)}` : '-'],
      ['', '  - OWNERSHIP: Renewal (N5,000)', data.tricycle_own_ren_qty > 0 ? data.tricycle_own_ren_qty.toString() : '-', data.tricycle_own_ren_qty > 0 ? `N${data.tricycle_own_ren_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: New (N1,500)', data.tricycle_rider_new_qty > 0 ? data.tricycle_rider_new_qty.toString() : '-', data.tricycle_rider_new_qty > 0 ? `N${data.tricycle_rider_new_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: Renewal (N1,500)', data.tricycle_rider_ren_qty > 0 ? data.tricycle_rider_ren_qty.toString() : '-', data.tricycle_rider_ren_qty > 0 ? `N${data.tricycle_rider_ren_amt.toFixed(2)}` : '-'],
      
      // 2. Motorcycle
      ['2.', 'MOTORCYCLE', '', ''],
      ['', '  - OWNERSHIP: New (N2,500)', data.motorcycle_own_new_qty > 0 ? data.motorcycle_own_new_qty.toString() : '-', data.motorcycle_own_new_qty > 0 ? `N${data.motorcycle_own_new_amt.toFixed(2)}` : '-'],
      ['', '  - OWNERSHIP: Renewal (N2,500)', data.motorcycle_own_ren_qty > 0 ? data.motorcycle_own_ren_qty.toString() : '-', data.motorcycle_own_ren_qty > 0 ? `N${data.motorcycle_own_ren_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: New (N1,500)', data.motorcycle_rider_new_qty > 0 ? data.motorcycle_rider_new_qty.toString() : '-', data.motorcycle_rider_new_qty > 0 ? `N${data.motorcycle_rider_new_amt.toFixed(2)}` : '-'],
      ['', '  - RIDER: Renewal (N1,500)', data.motorcycle_rider_ren_qty > 0 ? data.motorcycle_rider_ren_qty.toString() : '-', data.motorcycle_rider_ren_qty > 0 ? `N${data.motorcycle_rider_ren_amt.toFixed(2)}` : '-'],
      
      // 3. Taxi
      ['3.', 'TAXI', '', ''],
      ['', '  - New (N10,000)', data.taxi_new_qty > 0 ? data.taxi_new_qty.toString() : '-', data.taxi_new_qty > 0 ? `N${data.taxi_new_amt.toFixed(2)}` : '-'],
      ['', '  - Renewal (N5,000)', data.taxi_ren_qty > 0 ? data.taxi_ren_qty.toString() : '-', data.taxi_ren_qty > 0 ? `N${data.taxi_ren_amt.toFixed(2)}` : '-'],
      
      // 4. Kurkura
      ['4.', 'KURKURA', '', ''],
      ['', '  - New (N10,000)', data.kurkura_new_qty > 0 ? data.kurkura_new_qty.toString() : '-', data.kurkura_new_qty > 0 ? `N${data.kurkura_new_amt.toFixed(2)}` : '-'],
      ['', '  - Renewal (N5,000)', data.kurkura_ren_qty > 0 ? data.kurkura_ren_qty.toString() : '-', data.kurkura_ren_qty > 0 ? `N${data.kurkura_ren_amt.toFixed(2)}` : '-'],
      
      // 5. Lost ID
      ['5.', 'LOST OF ID/STICKER', '', ''],
      ['', '  - Tricycle (N2,500)', data.lost_tricycle_qty > 0 ? data.lost_tricycle_qty.toString() : '-', data.lost_tricycle_qty > 0 ? `N${data.lost_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (N2,500)', data.lost_motorcycle_qty > 0 ? data.lost_motorcycle_qty.toString() : '-', data.lost_motorcycle_qty > 0 ? `N${data.lost_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (N2,500)', data.lost_taxi_qty > 0 ? data.lost_taxi_qty.toString() : '-', data.lost_taxi_qty > 0 ? `N${data.lost_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (N2,500)', data.lost_kurkura_qty > 0 ? data.lost_kurkura_qty.toString() : '-', data.lost_kurkura_qty > 0 ? `N${data.lost_kurkura_amt.toFixed(2)}` : '-'],
      
      // 6. Change of Ownership
      ['6.', 'CHANGE OF OWNERSHIP', '', ''],
      ['', '  - Tricycle (N2,000)', data.change_tricycle_qty > 0 ? data.change_tricycle_qty.toString() : '-', data.change_tricycle_qty > 0 ? `N${data.change_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (N2,000)', data.change_motorcycle_qty > 0 ? data.change_motorcycle_qty.toString() : '-', data.change_motorcycle_qty > 0 ? `N${data.change_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (N2,000)', data.change_taxi_qty > 0 ? data.change_taxi_qty.toString() : '-', data.change_taxi_qty > 0 ? `N${data.change_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (N2,000)', data.change_kurkura_qty > 0 ? data.change_kurkura_qty.toString() : '-', data.change_kurkura_qty > 0 ? `N${data.change_kurkura_amt.toFixed(2)}` : '-'],
      
      // 7. Transfer
      ['7.', 'TRANSFER', '', ''],
      ['', '  - Tricycle (N2,000)', data.transfer_tricycle_qty > 0 ? data.transfer_tricycle_qty.toString() : '-', data.transfer_tricycle_qty > 0 ? `N${data.transfer_tricycle_amt.toFixed(2)}` : '-'],
      ['', '  - Motorcycle (N2,000)', data.transfer_motorcycle_qty > 0 ? data.transfer_motorcycle_qty.toString() : '-', data.transfer_motorcycle_qty > 0 ? `N${data.transfer_motorcycle_amt.toFixed(2)}` : '-'],
      ['', '  - Taxi (N2,000)', data.transfer_taxi_qty > 0 ? data.transfer_taxi_qty.toString() : '-', data.transfer_taxi_qty > 0 ? `N${data.transfer_taxi_amt.toFixed(2)}` : '-'],
      ['', '  - Kurkura (N2,000)', data.transfer_kurkura_qty > 0 ? data.transfer_kurkura_qty.toString() : '-', data.transfer_kurkura_qty > 0 ? `N${data.transfer_kurkura_amt.toFixed(2)}` : '-'],
    ];

    // Append custom/other classifications if present in records
    if (data.others_qty > 0) {
      rows.push(
        ['8.', 'OTHER SERVICES / REGISTRATIONS', '', ''],
        ['', '  - Custom Category Registrations', data.others_qty.toString(), `N${data.others_amt.toFixed(2)}`]
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
    drawCenteredText('New (N10,000)', 24, 57, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (N5,000)', 57, 90, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('New (N1,500)', 90, 123, 101, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (N1,500)', 123, 156, 101, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 106.5);
    drawCenteredText(data.tricycle_own_new_qty > 0 ? `${data.tricycle_own_new_qty} units (N${data.tricycle_own_new_amt.toLocaleString()})` : '-', 24, 57, 106.5, false, 7);
    drawCenteredText(data.tricycle_own_ren_qty > 0 ? `${data.tricycle_own_ren_qty} units (N${data.tricycle_own_ren_amt.toLocaleString()})` : '-', 57, 90, 106.5, false, 7);
    drawCenteredText(data.tricycle_rider_new_qty > 0 ? `${data.tricycle_rider_new_qty} units (N${data.tricycle_rider_new_amt.toLocaleString()})` : '-', 90, 123, 106.5, false, 7);
    drawCenteredText(data.tricycle_rider_ren_qty > 0 ? `${data.tricycle_rider_ren_qty} units (N${data.tricycle_rider_ren_amt.toLocaleString()})` : '-', 123, 156, 106.5, false, 7);
    const triTotal = data.tricycle_own_new_amt + data.tricycle_own_ren_amt + data.tricycle_rider_new_amt + data.tricycle_rider_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${triTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 98, { align: 'right' });

    // --- ROW 2: MOTORCYCLE ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('2.', 12, 24, 112.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('MOTORCYCLE', 26, 112.5);
    drawCenteredText('OWNERSHIP', 24, 90, 118, true, 7.5);
    drawCenteredText('RIDER', 90, 156, 118, true, 7.5);
    drawCenteredText('New (N2,500)', 24, 57, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (N2,500)', 57, 90, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('New (N1,500)', 90, 123, 123, false, 6.5, [100, 116, 139]);
    drawCenteredText('Renewal (N1,500)', 123, 156, 123, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 128.5);
    drawCenteredText(data.motorcycle_own_new_qty > 0 ? `${data.motorcycle_own_new_qty} units (N${data.motorcycle_own_new_amt.toLocaleString()})` : '-', 24, 57, 128.5, false, 7);
    drawCenteredText(data.motorcycle_own_ren_qty > 0 ? `${data.motorcycle_own_ren_qty} units (N${data.motorcycle_own_ren_amt.toLocaleString()})` : '-', 57, 90, 128.5, false, 7);
    drawCenteredText(data.motorcycle_rider_new_qty > 0 ? `${data.motorcycle_rider_new_qty} units (N${data.motorcycle_rider_new_amt.toLocaleString()})` : '-', 90, 123, 128.5, false, 7);
    drawCenteredText(data.motorcycle_rider_ren_qty > 0 ? `${data.motorcycle_rider_ren_qty} units (N${data.motorcycle_rider_ren_amt.toLocaleString()})` : '-', 123, 156, 128.5, false, 7);
    const motoTotal = data.motorcycle_own_new_amt + data.motorcycle_own_ren_amt + data.motorcycle_rider_new_amt + data.motorcycle_rider_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${motoTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 120, { align: 'right' });

    // --- ROW 3: TAXI ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('3.', 12, 24, 134.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TAXI', 26, 134.5);
    drawCenteredText('New (N10,000)', 24, 90, 140, false, 7, [100, 116, 139]);
    drawCenteredText('Renewal (N5,000)', 90, 156, 140, false, 7, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 146.5);
    drawCenteredText(data.taxi_new_qty > 0 ? `${data.taxi_new_qty} units (N${data.taxi_new_amt.toLocaleString()})` : '-', 24, 90, 146.5, false, 7);
    drawCenteredText(data.taxi_ren_qty > 0 ? `${data.taxi_ren_qty} units (N${data.taxi_ren_amt.toLocaleString()})` : '-', 90, 156, 146.5, false, 7);
    const taxiTotal = data.taxi_new_amt + data.taxi_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${taxiTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 140, { align: 'right' });

    // --- ROW 4: KURKURA ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('4.', 12, 24, 152.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KURKURA', 26, 152.5);
    drawCenteredText('New (N10,000)', 24, 90, 158, false, 7, [100, 116, 139]);
    drawCenteredText('Renewal (N5,000)', 90, 156, 158, false, 7, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 164.5);
    drawCenteredText(data.kurkura_new_qty > 0 ? `${data.kurkura_new_qty} units (N${data.kurkura_new_amt.toLocaleString()})` : '-', 24, 90, 164.5, false, 7);
    drawCenteredText(data.kurkura_ren_qty > 0 ? `${data.kurkura_ren_qty} units (N${data.kurkura_ren_amt.toLocaleString()})` : '-', 90, 156, 164.5, false, 7);
    const kurTotal = data.kurkura_new_amt + data.kurkura_ren_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${kurTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 158, { align: 'right' });

    // --- ROW 5: LOST OF ID/STICKER ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('5.', 12, 24, 170.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('LOST OF ID/STICKER', 26, 170.5);
    drawCenteredText('Tricycle (N2,500)', 24, 57, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (N2,500)', 57, 90, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (N2,500)', 90, 123, 176, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (N2,500)', 123, 156, 176, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 182.5);
    drawCenteredText(data.lost_tricycle_qty > 0 ? `${data.lost_tricycle_qty} (N${data.lost_tricycle_amt.toLocaleString()})` : '-', 24, 57, 182.5, false, 7);
    drawCenteredText(data.lost_motorcycle_qty > 0 ? `${data.lost_motorcycle_qty} (N${data.lost_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 182.5, false, 7);
    drawCenteredText(data.lost_taxi_qty > 0 ? `${data.lost_taxi_qty} (N${data.lost_taxi_amt.toLocaleString()})` : '-', 90, 123, 182.5, false, 7);
    drawCenteredText(data.lost_kurkura_qty > 0 ? `${data.lost_kurkura_qty} (N${data.lost_kurkura_amt.toLocaleString()})` : '-', 123, 156, 182.5, false, 7);
    const lostTotal = data.lost_tricycle_amt + data.lost_motorcycle_amt + data.lost_taxi_amt + data.lost_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${lostTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 176, { align: 'right' });

    // --- ROW 6: CHANGE OF OWNERSHIP ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('6.', 12, 24, 188.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CHANGE OF OWNERSHIP', 26, 188.5);
    drawCenteredText('Tricycle (N2,000)', 24, 57, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (N2,000)', 57, 90, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (N2,000)', 90, 123, 194, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (N2,000)', 123, 156, 194, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 200.5);
    drawCenteredText(data.change_tricycle_qty > 0 ? `${data.change_tricycle_qty} (N${data.change_tricycle_amt.toLocaleString()})` : '-', 24, 57, 200.5, false, 7);
    drawCenteredText(data.change_motorcycle_qty > 0 ? `${data.change_motorcycle_qty} (N${data.change_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 200.5, false, 7);
    drawCenteredText(data.change_taxi_qty > 0 ? `${data.change_taxi_qty} (N${data.change_taxi_amt.toLocaleString()})` : '-', 90, 123, 200.5, false, 7);
    drawCenteredText(data.change_kurkura_qty > 0 ? `${data.change_kurkura_qty} (N${data.change_kurkura_amt.toLocaleString()})` : '-', 123, 156, 200.5, false, 7);
    const chgTotal = data.change_tricycle_amt + data.change_motorcycle_amt + data.change_taxi_amt + data.change_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${chgTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 194, { align: 'right' });

    // --- ROW 7: TRANSFER ---
    doc.setTextColor(9, 13, 22);
    drawCenteredText('7.', 12, 24, 206.5, true, 8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TRANSFER', 26, 206.5);
    drawCenteredText('Tricycle (N2,000)', 24, 57, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Motorcycle (N2,000)', 57, 90, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Taxi (N2,000)', 90, 123, 212, false, 6.5, [100, 116, 139]);
    drawCenteredText('Kurkura (N2,000)', 123, 156, 212, false, 6.5, [100, 116, 139]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('AMOUNT', 14, 218.5);
    drawCenteredText(data.transfer_tricycle_qty > 0 ? `${data.transfer_tricycle_qty} (N${data.transfer_tricycle_amt.toLocaleString()})` : '-', 24, 57, 218.5, false, 7);
    drawCenteredText(data.transfer_motorcycle_qty > 0 ? `${data.transfer_motorcycle_qty} (N${data.transfer_motorcycle_amt.toLocaleString()})` : '-', 57, 90, 218.5, false, 7);
    drawCenteredText(data.transfer_taxi_qty > 0 ? `${data.transfer_taxi_qty} (N${data.transfer_taxi_amt.toLocaleString()})` : '-', 90, 123, 218.5, false, 7);
    drawCenteredText(data.transfer_kurkura_qty > 0 ? `${data.transfer_kurkura_qty} (N${data.transfer_kurkura_amt.toLocaleString()})` : '-', 123, 156, 218.5, false, 7);
    const transTotal = data.transfer_tricycle_amt + data.transfer_motorcycle_amt + data.transfer_taxi_amt + data.transfer_kurkura_amt;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND_GREEN);
    doc.text(`N${transTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 212, { align: 'right' });

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
    doc.text(`N${totalAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 194, 232, { align: 'right' });

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
  },

  generateMarshalIdCard: async (idData) => {
    // Standard A4 dimensions in mm: 210 x 297
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Preload logos
    const logoImg = await loadImage('/logo.png');
    const coatOfArmsImg = await loadImage('/coat_of_arms.png');

    // Generate QR Code dynamically
    let qrCodeUrl = null;
    try {
      const payload = `YOROTA OFFICIAL STAFF ID\nName: ${idData.name}\nRank: ${idData.rank}\nService No: ${idData.serviceNo}\nBlood Group: ${idData.bloodGroup}\nIssued: ${idData.issuedDate}`;
      qrCodeUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 150,
        color: {
          dark: '#090d16',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Failed to generate QR Code for PDF:', err);
    }

    // Title / Print Frame instructions
    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 297, 'F');

    // Soft repeated watermark or grid in A4 background
    doc.setDrawColor(255, 255, 255, 0.015);
    doc.setLineWidth(0.1);
    for (let i = 10; i < 200; i += 20) {
      doc.line(i, 0, i, 297);
    }
    for (let j = 10; j < 290; j += 20) {
      doc.line(0, j, 210, j);
    }

    // Header label
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(245, 200, 0); // Gold
    doc.text('YOROTA STAFF IDENTITY CARD', 105, 25, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175); // gray 400
    doc.text('Official Printable Marshal Identity Slip (CR80 Standard: 54mm x 85.6mm)', 105, 31, { align: 'center' });

    // Thin divider line
    doc.setDrawColor(245, 200, 0, 0.2);
    doc.setLineWidth(0.3);
    doc.line(20, 36, 190, 36);

    const cardW = 54;
    const cardH = 85.6;
    const frontX = 35;
    const backX = 121;
    const cardY = 55;

    // Draw print boundaries and cut-out guides
    doc.setDrawColor(156, 163, 175, 0.4);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    // Draw outer cut borders
    doc.rect(frontX - 2, cardY - 2, cardW + 4, cardH + 4);
    doc.rect(backX - 2, cardY - 2, cardW + 4, cardH + 4);
    doc.setLineDashPattern([], 0); // Reset

    // ----------------------------------------------------
    // 1. FRONT CARD GRAPHICS (x: 35, y: 55)
    // ----------------------------------------------------
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(frontX, cardY, cardW, cardH, 2, 2, 'F');
    
    // Borders: outer boundary card double borders (Emerald / Gold)
    doc.setDrawColor(245, 200, 0); // Gold outer border
    doc.setLineWidth(0.6);
    doc.roundedRect(frontX + 1.2, cardY + 1.2, cardW - 2.4, cardH - 2.4, 1.5, 1.5, 'D');

    // Top Right Decorative Chevron matching Physical Card
    // 1. Big Yellow shape (2 triangles)
    doc.setFillColor(245, 200, 0);
    doc.triangle(frontX + cardW, cardY, frontX + 22, cardY, frontX + 38, cardY + 15, 'F');
    doc.triangle(frontX + cardW, cardY, frontX + 38, cardY + 15, frontX + cardW, cardY + 10, 'F');
    // 2. Black Triangle
    doc.setFillColor(9, 13, 22);
    doc.triangle(frontX + cardW, cardY + 10, frontX + 38, cardY + 15, frontX + cardW, cardY + 21, 'F');
    // 3. Small Yellow Triangle
    doc.setFillColor(245, 200, 0);
    doc.triangle(frontX + cardW, cardY + 21, frontX + 45, cardY + 17.6, frontX + cardW, cardY + 30, 'F');

    // Front Card Agency Headings
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(9, 13, 22);
    doc.text('YOBE STATE', frontX + 4.5, cardY + 7);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.text('ROAD TRAFFIC MANAGEMENT', frontX + 4.5, cardY + 10.5);
    doc.setFontSize(5.5);
    doc.text('AGENCY', frontX + 4.5, cardY + 13.5);

    // Add Logo inside top right triangle
    if (logoImg) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(frontX + cardW - 14, cardY + 3, 10, 10, 1, 1, 'F');
      doc.addImage(logoImg, 'PNG', frontX + cardW - 13.5, cardY + 3.5, 9, 9);
    }

    // Vertical Staff Identity Card Label
    doc.setFillColor(55, 65, 81); // Grey box
    doc.rect(frontX + 3.8, cardY + 18.5, 3.8, 32.5, 'F');
    // Rotate text by 90 degrees
    doc.saveGraphicsState();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5.2);
    doc.setTextColor(255, 255, 255);
    // Draw rotated text inside box
    doc.text('STAFF IDENTITY CARD', frontX + 6.4, cardY + 48, { angle: 90 });
    doc.restoreGraphicsState();

    // Gold frame for Passport image
    doc.setDrawColor(245, 200, 0);
    doc.setLineWidth(0.6);
    doc.rect(frontX + 9, cardY + 18.5, 25, 32.5, 'D');

    // Draw Passport image inside frame
    if (idData.passportPhoto) {
      try {
        doc.addImage(idData.passportPhoto, 'JPEG', frontX + 9.3, cardY + 18.8, 24.4, 31.9);
      } catch (err) {
        console.error('Failed to draw passport photo in PDF:', err);
      }
    } else {
      // Fallback gray silhouette box
      doc.setFillColor(226, 232, 240);
      doc.rect(frontX + 9.3, cardY + 18.8, 24.4, 31.9, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(148, 163, 184);
      doc.text('PASSPORT', frontX + 21.5, cardY + 34, { align: 'center' });
    }

    // Details section - starts at y: 55
    const detailsStart = cardY + 55;
    doc.setFontSize(5.2);
    
    // Name
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(75, 85, 99); // Grey text labels
    doc.text('NAME:', frontX + 3.8, detailsStart);
    doc.setTextColor(9, 13, 22);
    doc.setFont('Helvetica', 'bold');
    doc.text((idData.name || '').toUpperCase(), frontX + 11.5, detailsStart);

    // Rank
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('RANK:', frontX + 3.8, detailsStart + 4.2);
    doc.setTextColor(9, 13, 22);
    doc.setFont('Helvetica', 'bold');
    doc.text((idData.rank || '').toUpperCase(), frontX + 11.5, detailsStart + 4.2);

    // Service No
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('SERVICE NO:', frontX + 3.8, detailsStart + 8.4);
    doc.setTextColor(9, 13, 22);
    doc.text((idData.serviceNo || '').toUpperCase(), frontX + 17.5, detailsStart + 8.4);

    // Blood Group
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('BLOOD GROUP:', frontX + 3.8, detailsStart + 12.6);
    doc.setTextColor(239, 68, 68); // Red
    doc.text((idData.bloodGroup || '').toUpperCase(), frontX + 20, detailsStart + 12.6);

    // Holder's Sign label
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(75, 85, 99);
    doc.text('HOLDER\'S SIGN:', frontX + 3.8, detailsStart + 16.8);
    
    // Draw Signature (image or typed cursive text)
    if (idData.signature) {
      try {
        doc.addImage(idData.signature, 'PNG', frontX + 21, detailsStart + 13.8, 14, 4.5);
      } catch (err) {
        console.error('Failed to draw signature image in PDF:', err);
      }
    } else {
      doc.setFont('Times-Italic', 'bolditalic');
      doc.setFontSize(6);
      doc.setTextColor(9, 13, 22);
      doc.text(idData.name?.substring(0, 10) || '', frontX + 21, detailsStart + 16.8);
    }

    // Front QR Code
    const qrSize = 9;
    const qrX = frontX + cardW - 13.5;
    const qrY = detailsStart + 8;
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } else {
      // Fallback outline if QR generation fails
      doc.setDrawColor(9, 13, 22);
      doc.setLineWidth(0.2);
      doc.rect(qrX, qrY, qrSize, qrSize, 'D');
    }

    // Bottom Warning Stripes (Yellow/Gold & Black chevrons)
    const frontStripeY = cardY + cardH - 3.8;
    const stripeH = 2.3;
    doc.setFillColor(245, 200, 0); // Yellow backing
    doc.rect(frontX + 1.5, frontStripeY, cardW - 3, stripeH, 'F');
    doc.setFillColor(9, 13, 22); // Black diagonal stripes
    doc.setLineWidth(0.4);
    for (let k = frontX + 3; k < frontX + cardW - 3; k += 4.5) {
      doc.triangle(
        k, frontStripeY + stripeH,
        k + 1.8, frontStripeY + stripeH,
        k + 2.8, frontStripeY,
        'F'
      );
      doc.triangle(
        k + 1.8, frontStripeY + stripeH,
        k + 2.8, frontStripeY,
        k + 1, frontStripeY,
        'F'
      );
    }

    // ----------------------------------------------------
    // 2. BACK CARD GRAPHICS (x: 121, y: 55)
    // ----------------------------------------------------
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(backX, cardY, cardW, cardH, 2, 2, 'F');
    
    // Double Border
    doc.setDrawColor(245, 200, 0);
    doc.setLineWidth(0.6);
    doc.roundedRect(backX + 1.2, cardY + 1.2, cardW - 2.4, cardH - 2.4, 1.5, 1.5, 'D');

    // Top Right Decorative Chevron matching Physical Card
    // 1. Big Yellow shape (2 triangles)
    doc.setFillColor(245, 200, 0);
    doc.triangle(backX + cardW, cardY, backX + 22, cardY, backX + 38, cardY + 15, 'F');
    doc.triangle(backX + cardW, cardY, backX + 38, cardY + 15, backX + cardW, cardY + 10, 'F');
    // 2. Black Triangle
    doc.setFillColor(9, 13, 22);
    doc.triangle(backX + cardW, cardY + 10, backX + 38, cardY + 15, backX + cardW, cardY + 21, 'F');
    // 3. Small Yellow Triangle
    doc.setFillColor(245, 200, 0);
    doc.triangle(backX + cardW, cardY + 21, backX + 45, cardY + 17.6, backX + cardW, cardY + 30, 'F');

    // Nigerian Coat of Arms Graphic centerpiece inside top gold triangle
    if (coatOfArmsImg) {
      doc.addImage(coatOfArmsImg, 'PNG', backX + cardW - 14, cardY + 2.5, 11, 11);
    }

    // Back card Bearer Terms Text
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(55, 65, 81);
    doc.text('The bearer whose Name,', backX + cardW / 2, cardY + 22, { align: 'center' });
    doc.text('Signature and Photograph', backX + cardW / 2, cardY + 25.5, { align: 'center' });
    doc.text('appears overleaf is a Staff of', backX + cardW / 2, cardY + 29, { align: 'center' });

    // Dark banner representing Yobe Traffic Management Agency
    doc.setFillColor(9, 13, 22);
    doc.rect(backX + 1.5, cardY + 32, cardW - 3, 9, 'F');
    // White text inside dark banner
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('YOBE STATE', backX + cardW / 2, cardY + 36, { align: 'center' });
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.4);
    doc.text('ROAD TRAFFIC MANAGEMENT AGENCY', backX + cardW / 2, cardY + 39.5, { align: 'center' });

    // Lost & Found Notice Instructions
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(9, 13, 22);
    doc.text('If lost but found please', backX + cardW / 2, cardY + 46.5, { align: 'center' });
    doc.text('return to the YOROTA office', backX + cardW / 2, cardY + 50.2, { align: 'center' });

    // Custom Issued Date
    const issuedDateString = idData.issuedDate 
      ? new Date(idData.issuedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      : '1ST, OCTOBER, 2021';
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(75, 85, 99);
    doc.text(`ISSUED DATE: ${issuedDateString.toUpperCase()}`, backX + cardW / 2, cardY + 56, { align: 'center' });

    // Back card QR Code
    const backQrX = backX + 4.5;
    const backQrY = cardY + 62;
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', backQrX, backQrY, qrSize, qrSize);
    } else {
      doc.setDrawColor(9, 13, 22);
      doc.setLineWidth(0.2);
      doc.rect(backQrX, backQrY, qrSize, qrSize, 'D');
    }

    // Commander General Signature stamp
    const sigEndX = backX + cardW - 4.5;
    const sigEndY = cardY + 68;
    // Draw signature line
    doc.setDrawColor(9, 13, 22);
    doc.setLineWidth(0.4);
    doc.line(backX + cardW - 20, sigEndY, sigEndX, sigEndY);
    // Draw cursive CG Signature visual
    doc.setFont('Times-Italic', 'bolditalic');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('CG YOROTA', backX + cardW - 17, sigEndY - 1.2);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(4.4);
    doc.setTextColor(9, 13, 22);
    doc.text('Commander General', backX + cardW - 12.2, sigEndY + 2.8, { align: 'center' });

    // Bottom Warning Stripes
    doc.setFillColor(245, 200, 0);
    doc.rect(backX + 1.5, frontStripeY, cardW - 3, stripeH, 'F');
    doc.setFillColor(9, 13, 22);
    for (let m = backX + 3; m < backX + cardW - 3; m += 4.5) {
      doc.triangle(
        m, frontStripeY + stripeH,
        m + 1.8, frontStripeY + stripeH,
        m + 2.8, frontStripeY,
        'F'
      );
      doc.triangle(
        m + 1.8, frontStripeY + stripeH,
        m + 2.8, frontStripeY,
        m + 1, frontStripeY,
        'F'
      );
    }

    // A4 Footer Guidelines
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175); // gray 400
    doc.text('INSTRUCTIONS: Print on dynamic PVC Card sheets or cardstock, cut along dotted guides, fold, and laminate.', 105, cardY + cardH + 15, { align: 'center' });

    // Save PDF
    doc.save(`YOROTA_Marshal_ID_Card_${(idData.name || 'Marshal').replace(/\s+/g, '_')}.pdf`);
  }
};

