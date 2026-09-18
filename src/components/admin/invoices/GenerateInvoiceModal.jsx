import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, FileText, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { generateInvoicePdf } from '@/lib/invoicePdf';

export default function GenerateInvoiceModal({ onClose, onCreated }) {
  const [estimates, setEstimates] = useState([]);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Estimate.filter({ status: 'accepted' }, '-created_date', 50)
      .then(d => { setEstimates(d); setLoadingEstimates(false); })
      .catch(() => setLoadingEstimates(false));
  }, []);

  const handleTermsChange = (terms) => {
    setPaymentTerms(terms);
    const daysMap = { 'Net 15': 15, 'Net 30': 30, 'Net 45': 45, 'Net 60': 60, 'Due on Receipt': 0 };
    if (daysMap[terms] !== undefined) {
      setDueDate(format(addDays(new Date(), daysMap[terms]), 'yyyy-MM-dd'));
    }
  };

  const handleCreate = async () => {
    if (!selectedEstimate) return;
    setSaving(true);

    // Generate PDF
    let pdfUrl = null;
    try {
      const pdfBlob = await generateInvoicePdf(
        { ...selectedEstimate, id: `INV-${Date.now().toString().slice(-6)}`, paid_amount: 0 },
        dueDate, paymentTerms, notes, 'invoice'
      );
      const file = new File([pdfBlob], `invoice-${Date.now()}.toString().slice(-6)}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      pdfUrl = file_url;
    } catch (e) {
      console.error('PDF generation failed', e);
    }

    // Create the invoice
    const invoice = await base44.entities.Invoice.create({
      estimate_id: selectedEstimate.id,
      client_name: selectedEstimate.client_name,
      client_email: selectedEstimate.client_email,
      line_items: selectedEstimate.line_items,
      subtotal: selectedEstimate.subtotal,
      tax_rate: selectedEstimate.tax_rate,
      discount: selectedEstimate.discount,
      total: selectedEstimate.total,
      status: 'unpaid',
      paid_amount: 0,
      due_date: dueDate,
      payment_terms: paymentTerms,
      notes,
      pdf_url: pdfUrl,
    });

    // Mark estimate as accepted (invoice generated)
    await base44.entities.Estimate.update(selectedEstimate.id, { status: 'accepted' });

    // Email the invoice to the client
    try {
      await base44.functions.invoke('sendInvoice', { invoiceId: invoice.id, pdf_url: pdfUrl });
    } catch (e) {
      console.warn('Failed to send invoice email', e);
    }

    setSaving(false);
    onCreated(invoice);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl">Generate Invoice from Estimate</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Estimate picker */}
        <div className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Select Accepted Estimate</label>
          {loadingEstimates ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : estimates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No accepted estimates found. Accept an estimate first.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {estimates.map(est => (
                <div key={est.id} onClick={() => setSelectedEstimate(est)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedEstimate?.id === est.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{est.client_name}</div>
                      <div className="text-xs text-muted-foreground">{est.client_email} · {format(new Date(est.created_date), 'MMM d, yyyy')}</div>
                    </div>
                    <div className="font-display font-bold">${(est.total || 0).toLocaleString()}</div>
                  </div>
                  {selectedEstimate?.id === est.id && est.line_items?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                      {est.line_items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.description}</span>
                          <span>${item.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Terms */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Payment Terms</label>
            <select value={paymentTerms} onChange={e => handleTermsChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
              <option>Due on Receipt</option>
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Net 60</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes (optional)</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Payment via bank transfer or check..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
          <button onClick={handleCreate} disabled={!selectedEstimate || saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><FileText size={14} /> Create Invoice</>}
          </button>
        </div>
      </div>
    </div>
  );
}