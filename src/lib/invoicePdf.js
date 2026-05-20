import jsPDF from 'jspdf';

export async function generateInvoicePdf(estimate, dueDate, paymentTerms, notes) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = 612;
  const margin = 48;
  let y = 60;

  // Header bar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, W, 80, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DDalton Designs', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('derek@ddaltondesigns.com', margin, 56);
  doc.text('ddaltondesigns.com', margin, 70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 77, 77);
  doc.text('INVOICE', W - margin - 100, 52);

  y = 110;

  // Bill To / Invoice Meta
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  doc.text('INVOICE DETAILS', W / 2, y);

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(estimate.client_name || '', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(estimate.client_email || '', margin, y + 14);

  const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueFmt = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const meta = [
    ['Invoice #', invoiceId],
    ['Date', today],
    ['Due Date', dueFmt],
    ['Payment Terms', paymentTerms],
  ];
  let metaY = y;
  meta.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label, W / 2, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(val || '', W / 2 + 90, metaY);
    metaY += 16;
  });

  y += 56;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 20;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 10, W - margin * 2, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const cols = { desc: margin + 8, qty: 360, rate: 430, total: W - margin - 8 };
  doc.text('DESCRIPTION', cols.desc, y + 5);
  doc.text('QTY', cols.qty, y + 5);
  doc.text('RATE', cols.rate, y + 5);
  doc.text('TOTAL', cols.total, y + 5, { align: 'right' });
  y += 22;

  // Line items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  (estimate.line_items || []).forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y - 8, W - margin * 2, 20, 'F');
    }
    doc.text(item.description || '', cols.desc, y + 4, { maxWidth: 250 });
    doc.text(String(item.quantity || ''), cols.qty, y + 4);
    doc.text(`$${(item.rate || 0).toLocaleString()}`, cols.rate, y + 4);
    doc.text(`$${(item.total || 0).toLocaleString()}`, cols.total, y + 4, { align: 'right' });
    y += 22;
  });

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, W - margin, y);
  y += 16;

  // Totals
  const rightCol = W - margin;
  const labelCol = W - margin - 130;

  const addTotalRow = (label, value, bold = false) => {
    if (bold) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    doc.setTextColor(bold ? 20 : 100, bold ? 20 : 100, bold ? 20 : 100);
    doc.text(label, labelCol, y);
    doc.setTextColor(20, 20, 20);
    doc.text(value, rightCol, y, { align: 'right' });
    y += bold ? 20 : 16;
  };

  addTotalRow('Subtotal', `$${(estimate.subtotal || 0).toLocaleString()}`);
  if (estimate.tax_rate > 0) addTotalRow(`Tax (${estimate.tax_rate}%)`, `$${((estimate.subtotal || 0) * estimate.tax_rate / 100).toFixed(2)}`);
  if (estimate.discount > 0) addTotalRow('Discount', `-$${estimate.discount}`);
  y += 4;
  doc.setDrawColor(255, 77, 77);
  doc.line(labelCol - 10, y - 8, rightCol, y - 8);
  addTotalRow('TOTAL DUE', `$${(estimate.total || 0).toLocaleString()}`, true);

  // Notes
  if (notes) {
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('NOTES', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(notes, W - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 14;
  }

  // Footer
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 750, W, 42, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Thank you for your business!', W / 2, 769, { align: 'center' });
  doc.setTextColor(255, 77, 77);
  doc.text('derek@ddaltondesigns.com  ·  ddaltondesigns.com', W / 2, 782, { align: 'center' });

  return doc.output('blob');
}