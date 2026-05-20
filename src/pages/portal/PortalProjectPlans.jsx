import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { FileSignature, CheckCircle2, Clock, PenLine, X } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-secondary text-muted-foreground' },
  sent: { label: 'Awaiting Signature', color: 'bg-yellow-50 text-yellow-700' },
  viewed: { label: 'Viewed', color: 'bg-blue-50 text-blue-600' },
  signed: { label: 'Signed', color: 'bg-green-50 text-green-600' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600' },
};

export default function PortalProjectPlans({ user }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [user.email]);

  const loadPlans = async () => {
    const data = await base44.entities.ProjectPlan.filter({ client_email: user.email }, '-created_date', 50);
    setPlans(data);
    setLoading(false);
    // Mark sent as viewed
    data.filter(p => p.status === 'sent').forEach(p =>
      base44.entities.ProjectPlan.update(p.id, { status: 'viewed' })
    );
  };

  const handleSign = async () => {
    if (!signatureName.trim() || !agreed) return;
    setSubmitting(true);
    await base44.entities.ProjectPlan.update(signing.id, {
      status: 'signed',
      client_signature: signatureName.trim(),
      client_name_signed: user.full_name,
      signed_at: new Date().toISOString(),
    });
    setSigning(null);
    setSignatureName('');
    setAgreed(false);
    await loadPlans();
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">Project Plans</h2>
        <p className="text-sm text-muted-foreground">Review and eSign your project plans below.</p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <FileSignature size={36} className="mx-auto mb-3 opacity-30" />
          <p>No project plans yet. Derek will send one when your project kicks off.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const cfg = statusConfig[plan.status] || statusConfig.sent;
            const canSign = ['sent', 'viewed'].includes(plan.status);
            return (
              <div key={plan.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileSignature size={17} />
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg">{plan.title}</div>
                      {plan.total_amount > 0 && (
                        <div className="text-sm text-muted-foreground">Project value: ${plan.total_amount.toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                </div>

                {plan.description && <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>}

                {plan.scope && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Scope of Work</div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-secondary/50 rounded-xl p-4">{plan.scope}</p>
                  </div>
                )}

                {plan.deliverables?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Deliverables</div>
                    <ul className="space-y-1.5">
                      {plan.deliverables.map((d, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.timeline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Timeline:</span>
                    <span className="font-medium">{plan.timeline}</span>
                  </div>
                )}

                {plan.status === 'signed' && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm">
                    <CheckCircle2 size={16} />
                    Signed by <strong>{plan.client_signature}</strong> on {plan.signed_at ? new Date(plan.signed_at).toLocaleDateString() : ''}
                  </div>
                )}

                {canSign && (
                  <button
                    onClick={() => setSigning(plan)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-primary-foreground font-semibold rounded-xl hover:bg-accent transition-all text-sm"
                  >
                    <PenLine size={15} />
                    Sign This Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signature Modal */}
      {signing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-xl">eSign Project Plan</h3>
              <button onClick={() => setSigning(null)} className="p-1 rounded-lg hover:bg-secondary"><X size={18} /></button>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
              By signing, you confirm you've read and agree to the project plan: <strong className="text-foreground">"{signing.title}"</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Your Full Name (as signature)</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={e => setSignatureName(e.target.value)}
                  placeholder={user.full_name}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-base bg-background focus:outline-none focus:border-accent transition-colors font-display italic"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-accent"
                />
                <span className="text-sm text-muted-foreground">I have read and agree to all the terms outlined in this project plan. I understand this constitutes a legal agreement.</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSigning(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!signatureName.trim() || !agreed || submitting}
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <PenLine size={14} />
                {submitting ? 'Signing…' : 'Sign Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}