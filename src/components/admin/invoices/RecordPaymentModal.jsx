import { useState } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RecordPaymentModal({ invoice, onClose, onRecorded }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const total = invoice.total || 0;
  const currentPaid = invoice.paid_amount || 0;
  const balance = Math.max(total - currentPaid, 0);
  const newPaid = currentPaid + (parseFloat(amount) || 0);
  const newStatus = newPaid >= total ? 'paid' : 'partial';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await base44.entities.Invoice.update(invoice.id, {
        paid_amount: parseFloat(newPaid.toFixed(2)),
        status: newStatus,
      });
      toast.success(newStatus === 'paid' ? 'Invoice marked as paid!' : 'Partial payment recorded.');
      onRecorded();
    } catch (err) {
      toast.error('Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl">Record Payment</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-secondary rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice Total</span><span className="font-semibold">${total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Already Paid</span><span className="font-semibold">${currentPaid.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1.5"><span>Balance Due</span><span className="text-accent">${balance.toFixed(2)}</span></div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Payment Amount *</label>
            <input required type="number" min="0.01" step="any" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
          </div>
          <div className="text-xs text-muted-foreground">
            After this payment: ${newPaid.toFixed(2)} paid → status becomes <span className="font-semibold capitalize">{newStatus}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}