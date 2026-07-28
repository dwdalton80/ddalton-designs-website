import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Receipt, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const statusConfig = {
  paid: { label: 'Paid', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
  partial: { label: 'Partial', icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
  unpaid: { label: 'Unpaid', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
};

export default function PortalInvoices({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Invoice.filter({ client_email: user.email }, '-created_date', 50)
      .then(data => { setInvoices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.email]);

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" /></div>;

  const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const paid = invoices.reduce((s, i) => s + (i.paid_amount || (i.status === 'paid' ? i.total : 0) || 0), 0);
  const outstanding = Math.max(total - paid, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">Your Invoices</h2>
        <p className="text-sm text-muted-foreground">View and track all invoices from DDalton Designs.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: `$${total.toLocaleString()}`, sub: `${invoices.length} invoices` },
          { label: 'Amount Paid', value: `$${paid.toLocaleString()}`, sub: 'Completed' },
          { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, sub: outstanding > 0 ? 'Due now' : 'All clear!' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="font-display font-black text-xl">{s.value}</div>
            <div className="text-xs font-semibold text-foreground mt-0.5">{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Receipt size={36} className="mx-auto mb-3 opacity-30" />
          <p>No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const cfg = statusConfig[inv.status] || statusConfig.unpaid;
            const Icon = cfg.icon;
            return (
              <div
                key={inv.id}
                onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
                className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-accent transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <Receipt size={17} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Invoice #{inv.id?.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{inv.due_date ? `Due ${inv.due_date}` : 'No due date'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-display font-bold">${(inv.total || 0).toLocaleString()}</div>
                      {inv.paid_amount > 0 && inv.status !== 'paid' && (
                        <div className="text-xs text-muted-foreground">${inv.paid_amount.toLocaleString()} paid</div>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Expanded line items */}
                {selected?.id === inv.id && inv.line_items?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="text-left pb-2">Description</th>
                          <th className="text-right pb-2">Qty</th>
                          <th className="text-right pb-2">Rate</th>
                          <th className="text-right pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.line_items.map((item, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2">{item.description}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">${(item.rate || 0).toLocaleString()}</td>
                            <td className="py-2 text-right font-semibold">${(item.total || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-3 gap-6 text-sm">
                      <span className="text-muted-foreground">Subtotal: <strong className="text-foreground">${(inv.subtotal || 0).toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Total: <strong className="text-foreground text-base">${(inv.total || 0).toLocaleString()}</strong></span>
                    </div>
                    {inv.paid_amount > 0 && inv.status !== 'paid' && (
                      <div className="flex justify-end mt-2 gap-6 text-sm">
                        <span className="text-green-600">Paid: <strong>${(inv.paid_amount || 0).toLocaleString()}</strong></span>
                        <span className="text-accent font-semibold">Balance Due: ${((inv.total || 0) - (inv.paid_amount || 0)).toLocaleString()}</span>
                      </div>
                    )}
                    {inv.notes && <p className="text-xs text-muted-foreground mt-3 italic">{inv.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}