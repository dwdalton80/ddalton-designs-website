import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, Send, FileText, Eye, CheckCircle, XCircle, AlertTriangle, Download, Pencil } from 'lucide-react';
import { generateEstimatePdf } from '@/lib/invoicePdf';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: 'bg-secondary text-muted-foreground',
  sent: 'bg-blue-500/15 text-blue-500',
  viewed: 'bg-yellow-500/15 text-yellow-500',
  accepted: 'bg-green-500/15 text-green-500',
  declined: 'bg-red-500/15 text-red-500',
};

const emptyItem = { description: '', quantity: 1, rate: 0, total: 0 };
const emptyForm = { source: 'client', source_id: '', client_id: '', client_name: '', client_email: '', line_items: [{ ...emptyItem }], tax_rate: 0, discount: 0, notes: '', valid_until: '' };

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [clients, setClients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectValue, setSelectValue] = useState('');
  const [editingEstimate, setEditingEstimate] = useState(null);

  const fetch = () => {
    Promise.all([
      base44.entities.Estimate.list('-created_date', 100),
      base44.entities.Client.list('-created_date', 100),
      base44.entities.ClientRequest.list('-created_date', 100),
    ]).then(([e, c, r]) => {
      setEstimates(e);
      setClients(c);
      setRequests(r.filter(req => req.status === 'new' || req.status === 'read'));
      // Keep selected in sync with refreshed data
      setSelected(prev => prev ? (e.find(x => x.id === prev.id) || null) : null);
      setLoading(false);
    }).catch(() => setLoading(false));
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

  const openEdit = (est) => {
    setEditingEstimate(est);
    setSelectValue('');
    setForm({
      source: 'client',
      source_id: '',
      client_id: est.client_id || '',
      client_name: est.client_name || '',
      client_email: (est.client_email || '').toLowerCase(),
      line_items: est.line_items?.length ? est.line_items : [{ ...emptyItem }],
      tax_rate: est.tax_rate || 0,
      discount: est.discount || 0,
      notes: est.notes || '',
      valid_until: est.valid_until || '',
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const subtotal = calcSubtotal(form.line_items);
    const total = calcTotal(form.line_items, form.tax_rate, form.discount);
    const { source, source_id, ...estimateData } = form;
    if (editingEstimate) {
      await base44.entities.Estimate.update(editingEstimate.id, { ...estimateData, subtotal, total });
      const updated = { ...editingEstimate, ...estimateData, subtotal, total };
      setEditingEstimate(null);
      setForm({ ...emptyForm });
      setSelectValue('');
      setShowForm(false);
      fetch();
      setSelected(updated);
      toast.success('Estimate updated.');
      return;
    }
    await base44.entities.Estimate.create({ ...estimateData, subtotal, total });
    // If sourced from a request, mark it as read so we know an estimate was sent
    if (source === 'request' && source_id) {
      await base44.entities.ClientRequest.update(source_id, { status: 'read' });
    }
    setShowForm(false);
    setForm({ ...emptyForm });
    setSelectValue('');
    fetch();
  };

  const sendEstimate = async (est) => {
    setSending(true);
    try {
      const blob = await generateEstimatePdf(est, est.valid_until, est.notes);
      let pdf_url;
      try {
        const file = new File([blob], `estimate-${est.id}.pdf`, { type: 'application/pdf' });
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        pdf_url = res?.file_url;
      } catch (e) { console.warn('PDF upload failed, sending without link', e); }
      await base44.functions.invoke('sendEstimate', { estimateId: est.id, pdf_url });
      toast.success(`Estimate sent to ${est.client_email}`);
      fetch();
    } catch (err) {
      console.error('Send estimate error:', err);
      toast.error(`Failed to send: ${err?.response?.data?.error || err?.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const convertToInvoice = async (est) => {
    try {
      // Auto-create client record if they don't already exist as a client
      const existingClients = await base44.entities.Client.filter({ email: est.client_email });
      let clientId = est.client_id;
      if (existingClients.length === 0) {
        const newClient = await base44.entities.Client.create({ name: est.client_name, email: est.client_email });
        clientId = newClient.id;
        await base44.entities.Estimate.update(est.id, { client_id: clientId });
      } else {
        clientId = existingClients[0].id;
      }
      // Mark any matching requests as converted
      const matchingRequests = await base44.entities.ClientRequest.filter({ email: est.client_email });
      for (const req of matchingRequests) {
        if (req.status !== 'converted') {
          await base44.entities.ClientRequest.update(req.id, { status: 'converted' });
        }
      }
      await base44.entities.Invoice.create({
        estimate_id: est.id,
        client_id: clientId,
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
      toast.success('Client added & invoice created!');
    } catch (err) {
      console.error('Convert to invoice error:', err);
      toast.error(`Error: ${err?.message || 'Something went wrong'}`);
    }
  };

  const downloadPdf = async (est) => {
    const blob = await generateEstimatePdf(est, est.valid_until, est.notes);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimate-${est.client_name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteEstimate = async (est) => {
    if (!confirm('Delete this estimate permanently?')) return;
    await base44.entities.Estimate.delete(est.id);
    setSelected(null);
    fetch();
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
        <button onClick={() => { setEditingEstimate(null); setForm({ ...emptyForm }); setSelectValue(''); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
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
                <div key={i} className="flex justify-between items-start text-sm py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground flex-1 pr-2 break-words whitespace-normal">{item.description}</span>
                  <span className="font-medium ml-2 flex-shrink-0">${item.total}</span>
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
              <button onClick={() => openEdit(selected)}
                className="w-full py-2.5 border border-border rounded-xl text-sm font-medium hover:border-foreground transition-all flex items-center justify-center gap-2">
                <Pencil size={14} /> Edit Estimate
              </button>
              <button onClick={() => downloadPdf(selected)}
                className="w-full py-2.5 border border-border rounded-xl text-sm font-medium hover:border-foreground transition-all flex items-center justify-center gap-2">
                <Download size={14} /> Download PDF
              </button>
              <button onClick={() => deleteEstimate(selected)}
                className="w-full py-2.5 border border-destructive/40 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/10 transition-all flex items-center justify-center gap-2">
                <Trash2 size={14} /> Delete Estimate
              </button>
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
              <h2 className="font-display font-bold text-xl">{editingEstimate ? 'Edit Estimate' : 'New Estimate'}</h2>
              <button onClick={() => { setShowForm(false); setSelectValue(''); setEditingEstimate(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{editingEstimate ? 'Client' : 'Send To *'}</label>
                {editingEstimate ? (
                  <div className="px-3 py-2.5 rounded-xl border border-border bg-secondary text-sm">
                    <div className="font-medium">{form.client_name}</div>
                    <div className="text-xs text-muted-foreground">{form.client_email}</div>
                  </div>
                ) : (
                <select
                  required
                  value={selectValue}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectValue(val);
                    if (!val) { setForm({ ...form, source: 'client', source_id: '', client_id: '', client_name: '', client_email: '' }); return; }
                    const [type, id] = val.split(':');
                    if (type === 'request') {
                      const req = requests.find(r => r.id === id);
                      setForm({ ...form, source: 'request', source_id: id, client_id: '', client_name: req?.name || '', client_email: (req?.email || '').toLowerCase() });
                    } else {
                      const client = clients.find(c => c.id === id);
                      setForm({ ...form, source: 'client', source_id: id, client_id: id, client_name: client?.name || '', client_email: (client?.email || '').toLowerCase() });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm"
                >
                  <option value="">Select recipient...</option>
                  {requests.length > 0 && (
                    <optgroup label="— Contact Requests (not yet clients)">
                      {requests.map(r => (
                        <option key={r.id} value={`request:${r.id}`}>{r.name} — {r.email} ({r.project_type || 'inquiry'})</option>
                      ))}
                    </optgroup>
                  )}
                  {clients.length > 0 && (
                    <optgroup label="— Existing Clients">
                      {clients.map(c => (
                        <option key={c.id} value={`client:${c.id}`}>{c.name} — {c.email}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                )}
                {!editingEstimate && form.source === 'request' && form.client_name && (
                  <p className="text-xs text-accent mt-1.5">⚡ This person will be added as a client when you mark the estimate accepted.</p>
                )}
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
                <button type="button" onClick={() => { setShowForm(false); setSelectValue(''); setEditingEstimate(null); }} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">{editingEstimate ? 'Update Estimate' : 'Save Estimate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}