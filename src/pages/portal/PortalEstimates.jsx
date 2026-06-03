import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft:    'bg-secondary text-muted-foreground',
  sent:     'bg-blue-500/15 text-blue-600',
  viewed:   'bg-yellow-500/15 text-yellow-600',
  accepted: 'bg-green-500/15 text-green-600',
  declined: 'bg-red-500/15 text-red-600',
};

export default function PortalEstimates({ user }) {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.Estimate.filter({ client_email: user.email }, '-created_date', 50)
      .then(data => { setEstimates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.email]);

  // Mark as viewed when opened
  const toggle = async (est) => {
    if (expanded === est.id) { setExpanded(null); return; }
    setExpanded(est.id);
    if (est.status === 'sent') {
      await base44.entities.Estimate.update(est.id, { status: 'viewed' });
      setEstimates(prev => prev.map(e => e.id === est.id ? { ...e, status: 'viewed' } : e));
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" />
    </div>
  );

  if (estimates.length === 0) return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center text-muted-foreground">
      <FileText size={36} className="mx-auto mb-3 opacity-30" />
      <p className="font-medium">No estimates yet.</p>
      <p className="text-sm mt-1">Your estimate will appear here once Derek sends it.</p>
    </div>
  );

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      <h2 className="font-display font-black text-2xl mb-6">Your Estimates</h2>
      {estimates.map(est => {
        const isOpen = expanded === est.id;
        return (
          <div key={est.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(est)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={15} />
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    Estimate #{est.id?.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {est.created_date ? format(new Date(est.created_date), 'MMM d, yyyy') : ''}
                    {est.valid_until ? ` · Valid until ${format(new Date(est.valid_until + 'T00:00:00'), 'MMM d, yyyy')}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold">${(est.total || 0).toLocaleString()}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[est.status]}`}>
                  {est.status}
                </span>
                {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border px-5 py-5 space-y-4">
                {/* Line Items */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Line Items</div>
                  <div className="space-y-1">
                    {est.line_items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                        <span className="text-foreground flex-1 pr-4">{item.description}</span>
                        <span className="text-muted-foreground text-xs mr-4">{item.quantity} × ${(item.rate || 0).toLocaleString()}</span>
                        <span className="font-semibold">${(item.total || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-secondary rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(est.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {est.tax_rate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({est.tax_rate}%)</span>
                      <span>${((est.subtotal || 0) * est.tax_rate / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {est.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>−${est.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1.5 border-t border-border text-base">
                    <span>Total</span>
                    <span>${(est.total || 0).toLocaleString()}</span>
                  </div>
                </div>

                {est.notes && (
                  <p className="text-sm text-muted-foreground italic">{est.notes}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}