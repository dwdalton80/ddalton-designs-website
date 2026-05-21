import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const emptyLine = () => ({ description: '', quantity: 1, rate: 0, total: 0 });

export default function ManualInvoiceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    line_items: [emptyLine()],
    tax_rate: 0,
    discount: 0,
    due_date: '',
    payment_terms: '',
    notes: '',
    status: 'unpaid',
    paid_amount: 0,
  });
  const [saving, setSaving] = useState(false);

  const updateLine = (i, field, value) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      lines[i].total = parseFloat(lines[i].quantity || 0) * parseFloat(lines[i].rate || 0);
    }
    setForm(f => ({ ...f, line_items: lines }));
  };

  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = (i) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, j) => j !== i) }));

  const subtotal = form.line_items.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const taxAmount = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + taxAmount - (parseFloat(form.discount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Invoice.create({
      ...form,
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      tax_rate: parseFloat(form.tax_rate) || 0,
      discount: parseFloat(form.discount) || 0,
      paid_amount: form.status === 'paid' ? parseFloat(total.toFixed(2)) : parseFloat(form.paid_amount) || 0,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl">Manual Invoice</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Client Name *</label>
              <input required value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Client Email *</label>
              <input required type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Line Items</label>
            <div className="space-y-2">
              {form.line_items.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Description" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                    className="col-span-5 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="Qty" min="0" step="any" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)}
                    className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="Rate" min="0" step="any" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)}
                    className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <div className="col-span-2 px-3 py-2 text-sm font-medium text-right">${(line.total || 0).toFixed(2)}</div>
                  <button type="button" onClick={() => removeLine(i)} className="col-span-1 flex justify-center text-muted-foreground hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLine} className="mt-2 flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline">
              <Plus size={13} /> Add Line
            </button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Tax %</label>
              <input type="number" min="0" step="any" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Discount ($)</label>
              <input type="number" min="0" step="any" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
            <div className="flex items-end pb-2.5">
              <div className="text-right w-full">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-display font-black text-2xl">${total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {form.status === 'partial' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Amount Paid ($)</label>
              <input type="number" min="0" step="any" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}