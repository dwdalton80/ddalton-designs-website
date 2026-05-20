import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, Send, FileText, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-secondary text-muted-foreground',
  sent: 'bg-blue-50 text-blue-600',
  viewed: 'bg-yellow-50 text-yellow-600',
  accepted: 'bg-green-50 text-green-600',
  declined: 'bg-red-50 text-red-600',
};

const emptyItem = { description: '', quantity: 1, rate: 0, total: 0 };

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ client_name: '', client_email: '', line_items: [{ ...emptyItem }], tax_rate: 0, discount: 0, notes: '', valid_until: '' });

  const fetch = () => {
    Promise.all([
      base44.entities.Estimate.list('-created_date', 100),
      base44.entities.Client.list('-created_date', 100),
    ]).then(([e, c]) => { setEstimates(e); setClients(c); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const calcSubtotal = (items) => items.reduce((s, i) => s + (i.total || 0), 0);
  const calcTotal = (items, tax, discount) => {
    const sub = calcSubtotal(items);
    return sub + (sub * (tax || 0) / 100) - (discount || 0);
  };

  const updateItem = (idx, field, val) => {
    const items = [...form.line_items];
    items[idx] = { ...items[idx], [field]: val };
    if (field === 'quantity' || field === 'rate') {
      items[idx].total = (items[idx].quantity || 0) * (items[idx].rate || 0);
    }
    setForm({ ...form, line_items: items });
  };

  const save = async (e) => {
    e.preventDefault();
    const subtotal = calcSubtotal(form.line_items);
    const total = calcTotal(form.line_items, form.tax_rate, form.discount);
    await base44.entities.Estimate.create({ ...form, subtotal, total });
    setShowForm(false);
    setForm({ client_name: '', client_email: '', line_items: [{ ...emptyItem }], tax_rate: 0, discount: 0, notes: '', valid_until: '' });
    fetch();
  };

  const sendEstimate = async (est) => {
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: est.client_email,
      subject: `Design Estimate from DDalton Designs`,
      body: `Hi ${est.client_name},\n\nThank you for your interest in DDalton Designs!\n\nHere is your estimate:\n\n${est.line_items?.map(i => `• ${i.description}: ${i.quantity} × $${i.rate} = $${i.total}`).join('\n')}\n\nSubtotal: $${est.subtotal}\n${est.tax_rate ? `Tax (${est.tax_rate}%): $${((est.subtotal || 0) * est.tax_rate / 100).toFixed(2)}\n` : ''}${est.discount ? `Discount: -$${est.discount}\n` : ''}Total: $${est.total}\n\n${est.notes ? `Notes: ${est.notes}\n\n` : ''}Please reply to this email to accept or request changes.\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com`,
    });
    await base44.entities.Estimate.update(est.id, { status: 'sent', sent_at: new Date().toISOString() });
    setSending(false);
    fetch();
    if (selected?.id === est.id) setSelected({ ...est, status: 'sent' });
  };

  const convertToInvoice = async (est) => {
    await base44.entities.Invoice.create({
      estimate_id: est.id,
      client_name: est.client_name,
      client_email: est.client_email,
      line_items: est.line_items,
      subtotal: est.subtotal,
      tax_rate: est.tax_rate,
      discount: est.discount,
      total: est.total,
      status: 'unpaid',
      paid_amount: 0,
      notes: est.notes,
    });
    await base44.entities.Estimate.update(est.id, { status: 'accepted' });
    fetch();
    alert('Invoice created!');
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Estimate.update(id, { status });
    fetch();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl">Estimates</h1>
          <p className="text-muted-foreground mt-1">{estimates.filter(e => e.status === 'draft').length} drafts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> New Estimate
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />) :
            estimates.length === 0 ? <div className="text-center py-20 text-muted-foreground"><FileText size={32} className="mx-auto mb-3 opacity-30" /><p>No estimates yet</p></div> :
            estimates.map(est => (
              <div key={est.id} onClick={() => setSelected(est)}
                className={`bg-card rounded-2xl border p-4 cursor-pointer hover:border-accent transition-all ${selected?.id === est.id ? 'border-accent' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{est.client_name}</div>
                    <div className="text-xs text-muted-foreground">{est.client_email} · {format(new Date(est.created_date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">${(est.total || 0).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[est.status]}`}>{est.status}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {selected ? (
          <div className="bg-card rounded-2xl border border-border p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">{selected.client_name}</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="text-xs text-muted-foreground mb-4">{selected.client_email}</div>
            <div className="space-y-1 mb-4">
              {selected.line_items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground flex-1 truncate">{item.description}</span>
                  <span className="font-medium ml-2">${item.total}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm mb-5 p-3 bg-secondary rounded-xl">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${selected.subtotal}</span></div>
              {selected.tax_rate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({selected.tax_rate}%)</span><span>${((selected.subtotal || 0) * selected.tax_rate / 100).toFixed(2)}</span></div>}
              {selected.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-${selected.discount}</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t border-border"><span>Total</span><span>${selected.total}</span></div>
            </div>
            {selected.notes && <p className="text-xs text-muted-foreground mb-4">{selected.notes}</p>}
            <div className="flex flex-col gap-2">
              {selected.status === 'draft' && (
                <button onClick={() => sendEstimate(selected)} disabled={sending}
                  className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  <Send size={14} /> {sending ? 'Sending...' : 'Send to Client'}
                </button>
              )}
              {['sent', 'viewed'].includes(selected.status) && (
                <>
                  <button onClick={() => convertToInvoice(selected)}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Mark Accepted & Invoice
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'declined')}
                    className="w-full py-2.5 border border-border rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-muted-foreground">
                    <XCircle size={14} /> Mark Declined
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground p-10">
            <div className="text-center"><FileText size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select an estimate</p></div>
          </div>
        )}
      </div>

      {/* New Estimate Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">New Estimate</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Client Name *</label>
                  <input required value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                    list="clients-list" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <datalist id="clients-list">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Client Email *</label>
                  <input required type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</label>
                  <button type="button" onClick={() => setForm({ ...form, line_items: [...form.line_items, { ...emptyItem }] })}
                    className="text-xs text-accent font-semibold">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.line_items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                        className="col-span-5 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                        className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                      <input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value))}
                        className="col-span-2 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                      <div className="col-span-2 text-sm font-medium text-right">${item.total || 0}</div>
                      <button type="button" onClick={() => setForm({ ...form, line_items: form.line_items.filter((_, i) => i !== idx) })}
                        className="col-span-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Tax Rate %</label>
                  <input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Discount $</label>
                  <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <span className="font-semibold">Total</span>
                <span className="font-display font-black text-xl">${calcTotal(form.line_items, form.tax_rate, form.discount).toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Save Estimate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}