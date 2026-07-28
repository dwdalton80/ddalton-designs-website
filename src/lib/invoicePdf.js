import jsPDF from 'jspdf';

const LOGO_URL = 'https://media.base44.com/images/public/6a0deceee5167bf94f46086f/0fe3541a3_Untitleddesign.png';
const ORANGE = [255, 79, 0];   // #FF4F00
const DARK   = [17, 17, 17];   // #111
const GRAY   = [120, 120, 120];
const LIGHT  = [245, 245, 245];

async function loadImageAsDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function generateInvoicePdf(invoice, dueDate, paymentTerms, notes, type = 'invoice') {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = 612;
  const margin = 48;
  const isEstimate = type === 'estimate';

  // --- Load logo ---
  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
  } catch (_) {}

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 88, 'F');

  // Orange accent strip at top
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 5, 'F');

  // Logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 16, 52, 52);
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('DDalton Designs', margin + 60, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('derek@ddaltondesigns.com  ·  (580) 916-0098  ·  ddaltondesigns.com', margin + 60, 52);
  doc.text('21 Wilderness Rd N, Calera OK 74730, United States', margin + 60, 64);

  // Document type label (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...ORANGE);
  const docLabel = isEstimate ? 'ESTIMATE' : 'INVOICE';
  doc.text(docLabel, W - margin, 54, { align: 'right' });

  let y = 108;

  // ── Bill To + Meta ───────────────────────────────────────────
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('BILL TO', margin, y);

  y += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(invoice.client_name || '', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.text(invoice.client_email || '', margin, y + 14);

  // Meta (right column)
  const invoiceId = isEstimate
    ? `EST-${invoice.id?.slice(-6).toUpperCase() || Date.now().toString().slice(-6)}`
    : `INV-${invoice.id?.slice(-6).toUpperCase() || Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueFmt = dueDate
    ? new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const metaRows = [
    [isEstimate ? 'Estimate #' : 'Invoice #', invoiceId],
    ['Issue Date', today],
    ...(dueDate ? [[isEstimate ? 'Valid Until' : 'Due Date', dueFmt]] : []),
    ...(paymentTerms ? [['Payment Terms', paymentTerms]] : []),
  ];

  let metaY = y - 13;
  const metaLeft = W / 2 + 20;
  metaRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(label, metaLeft, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(val || '', W - margin, metaY, { align: 'right' });
    metaY += 16;
  });

  y += 44;

  // ── Summary bar ─────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(margin, y, W - margin * 2, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(isEstimate ? 'ESTIMATE #' : 'INVOICE #', margin + 12, y + 17);
  doc.text('ISSUE DATE', margin + 110, y + 17);
  doc.text(dueDate ? (isEstimate ? 'VALID UNTIL' : 'DUE DATE') : '', margin + 230, y + 17);
  doc.text('TOTAL', W - margin - 12, y + 17, { align: 'right' });

  y += 28;
  doc.setFillColor(245, 240, 237);
  doc.rect(margin, y, W - margin * 2, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(invoiceId, margin + 12, y + 17);
  doc.text(today, margin + 110, y + 17);
  doc.text(dueFmt, margin + 230, y + 17);
  doc.setTextColor(...ORANGE);
  doc.text(`$${(invoice.total || 0).toLocaleString()}`, W - margin - 12, y + 17, { align: 'right' });

  y += 38;

  // ── Line items table ─────────────────────────────────────────
  // Header
  doc.setFillColor(...DARK);
  doc.rect(margin, y, W - margin * 2, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  const cols = { desc: margin + 10, qty: 360, rate: 435, total: W - margin - 8 };
  doc.text('DESCRIPTION', cols.desc, y + 14);
  doc.text('QTY', cols.qty, y + 14, { align: 'center' });
  doc.text('RATE', cols.rate, y + 14, { align: 'right' });
  doc.text('AMOUNT', cols.total, y + 14, { align: 'right' });
  y += 22;

  // Rows
  const descMaxWidth = cols.qty - cols.desc - 16;
  const lineH = 13;
  (invoice.line_items || []).forEach((item, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(String(item.description || ''), descMaxWidth);
    const rowH = Math.max(26, descLines.length * lineH + 12);
    const bg = idx % 2 === 0 ? 255 : 249;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, y, W - margin * 2, rowH, 'F');

    doc.setTextColor(...DARK);
    // Description: top-aligned with 10pt padding from row top
    doc.text(descLines, cols.desc, y + 14);
    // QTY/RATE/AMOUNT: vertically centered in the row
    const midY = y + rowH / 2 + 3.5;
    doc.text(String(item.quantity || ''), cols.qty, midY, { align: 'center' });
    doc.text(`$${(item.rate || 0).toLocaleString()}`, cols.rate, midY, { align: 'right' });
    doc.text(`$${(item.total || 0).toLocaleString()}`, cols.total, midY, { align: 'right' });
    y += rowH;
  });

  // Bottom border of table
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1.5);
  doc.line(margin, y, W - margin, y);
  doc.setLineWidth(0.5);
  y += 16;

  // ── Totals ───────────────────────────────────────────────────
  const labelCol = W - margin - 130;
  const valueCol = W - margin;

  const addRow = (label, value, bold = false, colored = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9.5);
    const textColor = colored ? ORANGE : bold ? DARK : GRAY;
    doc.setTextColor(...textColor);
    doc.text(label, labelCol, y);
    doc.setTextColor(...(colored ? ORANGE : DARK));
    doc.text(value, valueCol, y, { align: 'right' });
    y += bold ? 20 : 16;
  };

  addRow('Subtotal', `$${(invoice.subtotal || 0).toLocaleString()}`);
  if (invoice.tax_rate > 0) addRow(`Tax (${invoice.tax_rate}%)`, `$${((invoice.subtotal || 0) * invoice.tax_rate / 100).toFixed(2)}`);
  if (invoice.discount > 0) addRow('Discount', `-$${invoice.discount}`);
  if (invoice.paid_amount > 0) addRow('Paid', `-$${invoice.paid_amount.toLocaleString()}`);

  y += 4;
  doc.setDrawColor(...ORANGE);
  doc.line(labelCol - 10, y - 6, valueCol, y - 6);
  y += 4;
  addRow('TOTAL DUE', `$${(invoice.total || 0).toLocaleString()}`, true, true);

  // ── Notes ────────────────────────────────────────────────────
  const notesText = notes || invoice.notes;
  if (notesText) {
    y += 16;
    doc.setFillColor(...LIGHT);
    const noteLines = doc.splitTextToSize(notesText, W - margin * 2 - 20);
    const noteBoxH = noteLines.length * 13 + 20;
    doc.rect(margin, y, W - margin * 2, noteBoxH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text('NOTES', margin + 10, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(noteLines, margin + 10, y + 26);
    y += noteBoxH + 10;
  }

  // ── Footer ───────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 752, W, 5, 'F');
  doc.setFillColor(...DARK);
  doc.rect(0, 757, W, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Thank you for your business!', W / 2, 773, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ORANGE);
  doc.text('derek@ddaltondesigns.com  ·  (580) 916-0098  ·  ddaltondesigns.com', W / 2, 786, { align: 'center' });

  return doc.output('blob');
}

// Convenience wrapper for estimates
export function generateEstimatePdf(estimate, validUntil, notes) {
  return generateInvoicePdf(estimate, validUntil, null, notes, 'estimate');
}