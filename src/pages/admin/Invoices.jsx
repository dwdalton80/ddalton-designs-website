import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Receipt, X, Send, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { format } from 'date-fns';
import GenerateInvoiceModal from '@/components/admin/invoices/GenerateInvoiceModal';

const STATUS_COLORS = {
  unpaid: 'bg-red-50 text-red-600',
  partial: 'bg-yellow-50 text-yellow-600',
  paid: 'bg-green-50 text-green-600',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showGenerate, setShowGenerate] = useState(false);

  const fetch = () => {
    base44.entities.Invoice.list('-created_date', 100)
      .then(d => { setInvoices(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const sendInvoice = async (inv) => {
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: inv.client_email,
      subject: `Invoice from DDalton Designs`,
      body: `Hi ${inv.client_name},\n\nPlease find your invoice below:\n\n${inv.line_items?.map(i => `• ${i.description}: ${i.quantity} × $${i.rate} = $${i.total}`).join('\n')}\n\nSubtotal: $${inv.subtotal}\n${inv.tax_rate ? `Tax (${inv.tax_rate}%): $${((inv.subtotal || 0) * inv.tax_rate / 100).toFixed(2)}\n` : ''}${inv.discount ? `Discount: -$${inv.discount}\n` : ''}Total Due: $${inv.total}\n\n${inv.due_date ? `Due Date: ${inv.due_date}\n\n` : ''}Please send payment via your preferred method and reply to this email with any questions.\n\nBest,\nDerek Dalton\nDDalton Designs`,
    });
    setSending(false);
    alert('Invoice sent!');
  };

  const markPaid = async (inv) => {
    await base44.entities.Invoice.update(inv.id, { status: 'paid', paid_amount: inv.total });
    fetch();
    setSelected({ ...inv, status: 'paid', paid_amount: inv.total });
  };

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl">Invoices</h1>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</div>
          <div className="font-display font-black text-2xl text-green-600">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Outstanding</div>
          <div className="font-display font-black text-2xl text-accent">${outstanding.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 col-span-2 md:col-span-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Invoices</div>
          <div className="font-display font-black text-2xl">{invoices.length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'unpaid', 'partial', 'paid'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />) :
            filtered.length === 0 ? <div className="text-center py-20 text-muted-foreground"><Receipt size={32} className="mx-auto mb-3 opacity-30" /><p>No invoices found</p></div> :
            filtered.map(inv => (
              <div key={inv.id} onClick={() => setSelected(inv)}
                className={`bg-card rounded-2xl border p-4 cursor-pointer hover:border-accent transition-all ${selected?.id === inv.id ? 'border-accent' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{inv.client_name}</div>
                    <div className="text-xs text-muted-foreground">{inv.due_date ? `Due ${format(new Date(inv.due_date), 'MMM d, yyyy')}` : format(new Date(inv.created_date), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">${(inv.total || 0).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {selected ? (
          <div className="bg-card rounded-2xl border border-border p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Invoice</h3>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="font-semibold mb-0.5">{selected.client_name}</div>
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
              {selected.tax_rate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${((selected.subtotal || 0) * selected.tax_rate / 100).toFixed(2)}</span></div>}
              {selected.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-${selected.discount}</span></div>}
              <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>${selected.total}</span></div>
              {selected.paid_amount > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>${selected.paid_amount}</span></div>}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => sendInvoice(selected)} disabled={sending}
                className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-60">
                <Send size={14} /> {sending ? 'Sending...' : 'Send Invoice'}
              </button>
              {selected.status !== 'paid' && (
                <button onClick={() => markPaid(selected)}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> Mark as Paid
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground p-10">
            <div className="text-center"><Receipt size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select an invoice</p></div>
          </div>
        )}
      </div>
    </div>
    {showGenerate && (
      <GenerateInvoiceModal
        onClose={() => setShowGenerate(false)}
        onCreated={() => { setShowGenerate(false); fetch(); }}
      />
    )}
    </>
  );
}