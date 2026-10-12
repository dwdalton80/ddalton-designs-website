import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const emptyLine = () => ({ description: '', quantity: 1, rate: 0, total: 0 });

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5';

export default function ManualInvoiceModal({ onClose, onCreated, invoice }) {
  const [form, setForm] = useState(() => invoice ? {
    client_id: invoice.client_id || '',
    client_name: invoice.client_name || '',
    client_email: invoice.client_email || '',
    line_items: (invoice.line_items && invoice.line_items.length ? invoice.line_items : [emptyLine()]),
    tax_rate: invoice.tax_rate || 0,
    discount: invoice.discount || 0,
    due_date: invoice.due_date || '',
    payment_terms: invoice.payment_terms || '',
    notes: invoice.notes || '',
    status: invoice.status || 'unpaid',
    paid_amount: invoice.paid_amount || 0,
  } : {
    client_id: '',
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
  const [clients, setClients] = useState([]);
  // '' means "new client" — the name/email fields are typed in by hand.
  const [clientChoice, setClientChoice] = useState(invoice?.client_id || '');
  const [saveAsClient, setSaveAsClient] = useState(true);

  useEffect(() => {
    base44.entities.Client.list('name', 200).then(list => {
      setClients(list);
      // An invoice can outlive the client it was written for. If that record is
      // gone the picker has nothing to select, so fall back to the free-text
      // fields rather than showing an empty dropdown.
      setClientChoice(c => (c && !list.some(x => x.id === c) ? '' : c));
    }).catch(() => setClients([]));
  }, []);

  const pickClient = (id) => {
    setClientChoice(id);
    if (!id) {
      setForm(f => ({ ...f, client_id: '', client_name: '', client_email: '' }));
      return;
    }
    const client = clients.find(c => c.id === id);
    setForm(f => ({
      ...f,
      client_id: id,
      client_name: client?.name || '',
      client_email: (client?.email || '').toLowerCase(),
    }));
  };

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
    try {
      const email = form.client_email.trim().toLowerCase();
      let client_id = form.client_id;

      // A hand-typed client can be promoted to a real Client record, but only
      // when the email is genuinely new — matching on email keeps a repeat
      // customer from turning into a second row.
      if (!client_id && saveAsClient) {
        const existing = clients.find(c => (c.email || '').toLowerCase() === email);
        if (existing) {
          client_id = existing.id;
        } else {
          const created = await base44.entities.Client.create({
            name: form.client_name.trim(),
            email,
          });
          client_id = created?.id || '';
        }
      }

      const payload = {
        ...form,
        client_id,
        client_name: form.client_name.trim(),
        client_email: email,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        tax_rate: parseFloat(form.tax_rate) || 0,
        discount: parseFloat(form.discount) || 0,
        paid_amount: form.status === 'paid' ? parseFloat(total.toFixed(2)) : parseFloat(form.paid_amount) || 0,
      };

      if (invoice) {
        await base44.entities.Invoice.update(invoice.id, payload);
      } else {
        await base44.entities.Invoice.create(payload);
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  const isNewClient = !clientChoice;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 w-full max-w-2xl my-4 sm:my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl">{invoice ? 'Edit Invoice' : 'Manual Invoice'}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className={labelClass}>Client *</label>
            <select value={clientChoice} onChange={e => pickClient(e.target.value)} className={inputClass}>
              <option value="">+ New client (enter details below)</option>
              {clients.length > 0 && (
                <optgroup label="— Existing Clients">
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {isNewClient ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Client Name *</label>
                  <input required value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Client Email *</label>
                  <input required type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={saveAsClient} onChange={e => setSaveAsClient(e.target.checked)}
                  className="accent-[#FF4F00]" />
                Also save them to Clients
              </label>
            </>
          ) : (
            <div className="px-3 py-2.5 rounded-xl border border-border bg-secondary text-sm">
              <div className="font-medium">{form.client_name}</div>
              <div className="text-xs text-muted-foreground break-all">{form.client_email}</div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Line Items</label>
            <div className="space-y-3 sm:space-y-2">
              {form.line_items.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Description" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                    className="col-span-12 sm:col-span-5 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="Qty" min="0" step="any" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)}
                    className="col-span-4 sm:col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <input type="number" placeholder="Rate" min="0" step="any" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)}
                    className="col-span-4 sm:col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <div className="col-span-3 sm:col-span-2 px-1 sm:px-3 py-2 text-sm font-medium text-right">${(line.total || 0).toFixed(2)}</div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tax %</label>
              <input type="number" min="0" step="any" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Discount ($)</label>
              <input type="number" min="0" step="any" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-end pb-2.5">
              <div className="text-right w-full">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-display font-black text-2xl">${total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className={inputClass}>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {form.status === 'partial' && (
            <div>
              <label className={labelClass}>Amount Paid ($)</label>
              <input type="number" min="0" step="any" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: e.target.value })}
                className={inputClass} />
            </div>
          )}

          <div>
            <label className={labelClass}>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className={`${inputClass} resize-none`} />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
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
