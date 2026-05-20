import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function InvoiceSummary({ invoices }) {
  const unpaid = invoices.filter(i => i.status !== 'paid');
  const outstanding = unpaid.reduce((sum, i) => sum + ((i.total || 0) - (i.paid_amount || 0)), 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">Outstanding Invoices</h2>
        <Link to="/admin/invoices" className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
          View All <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="text-3xl font-display font-black text-accent mb-1">
        ${outstanding.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mb-5">{unpaid.length} unpaid invoice{unpaid.length !== 1 ? 's' : ''}</div>

      <div className="space-y-2.5">
        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">All invoices are paid!</p>
        ) : unpaid.slice(0, 4).map(inv => (
          <Link key={inv.id} to="/admin/invoices" className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:opacity-70 transition-opacity">
            <div>
              <div className="font-medium text-sm">{inv.client_name}</div>
              {inv.due_date && (
                <div className="text-xs text-muted-foreground">Due {inv.due_date}</div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">${(inv.total || 0).toLocaleString()}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${inv.status === 'partial' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                {inv.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}