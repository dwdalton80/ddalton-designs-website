import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Receipt, FileSignature, MessageSquare, CheckCircle2, Clock, AlertCircle, ArrowRight, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const invoiceStatusCfg = {
  paid:    { label: 'Paid',    color: 'bg-green-50 text-green-600' },
  partial: { label: 'Partial', color: 'bg-yellow-50 text-yellow-600' },
  unpaid:  { label: 'Unpaid',  color: 'bg-red-50 text-red-600' },
};

const planStatusCfg = {
  draft:    { label: 'Draft',             color: 'bg-secondary text-muted-foreground' },
  sent:     { label: 'Awaiting Signature', color: 'bg-yellow-50 text-yellow-700' },
  viewed:   { label: 'Viewed',            color: 'bg-blue-50 text-blue-600' },
  signed:   { label: 'Signed',            color: 'bg-green-50 text-green-600' },
  declined: { label: 'Declined',          color: 'bg-red-50 text-red-600' },
};

export default function PortalDashboard({ user, onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [messages, setMessages] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [acting, setActing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Invoice.filter({ client_email: user.email }, '-created_date', 10),
      base44.entities.ProjectPlan.filter({ client_email: user.email }, '-created_date', 10),
      base44.entities.PortalMessage.filter({ client_email: user.email }, '-created_date', 5),
      base44.entities.Estimate.filter({ client_email: user.email.toLowerCase() }, '-created_date', 10),
    ]).then(([inv, pl, msg, est]) => {
      setInvoices(inv);
      setPlans(pl);
      setMessages(msg);
      setEstimates(est);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.email]);

  const respondToEstimate = async (est, status) => {
    setActing(est.id + status);
    try {
      if (status === 'accepted') {
        await base44.functions.invoke('handleEstimateAccept', { estimateId: est.id });
      } else {
        await base44.entities.Estimate.update(est.id, { status });
      }
      setEstimates(prev => prev.map(e => e.id === est.id ? { ...e, status } : e));
      toast.success(status === 'accepted' ? 'Estimate accepted! Derek will be in touch shortly.' : 'Estimate declined.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setActing(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" />
    </div>
  );

  const totalBilled = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || (i.status === 'paid' ? i.total : 0) || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const unreadMessages = messages.filter(m => m.from_admin && !m.read).length;
  const pendingPlans = plans.filter(p => ['sent', 'viewed'].includes(p.status)).length;
  const pendingEstimates = estimates.filter(e => ['sent', 'viewed'].includes(e.status));
  const activePlan = plans.find(p => !['signed', 'declined', 'draft'].includes(p.status)) || plans[0];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="font-display font-black text-3xl">
          Welcome back, {user.full_name?.split(' ')[0]}.
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Here's a summary of your projects with DDalton Designs.</p>
      </div>

      {/* Pending Estimates Alert */}
      {pendingEstimates.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <FileText size={18} className="text-accent" />
              Estimates Awaiting Your Response
            </h3>
            <button onClick={() => onNavigate('estimates')} className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {pendingEstimates.map(est => (
              <div key={est.id} className="bg-card border border-accent/40 rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="font-semibold">Estimate #{est.id?.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {est.valid_until ? `Valid until ${new Date(est.valid_until + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </div>
                  </div>
                  <span className="font-display font-black text-2xl">${(est.total || 0).toLocaleString()}</span>
                </div>
                {est.line_items?.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {est.line_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground flex-1">{item.description}</span>
                        <span className="font-medium ml-4">${(item.total || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                {est.notes && <p className="text-xs text-muted-foreground italic mb-4">{est.notes}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => respondToEstimate(est, 'accepted')}
                    disabled={!!acting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    <CheckCircle size={14} />
                    {acting === est.id + 'accepted' ? 'Accepting...' : 'Accept Estimate'}
                  </button>
                  <button
                    onClick={() => respondToEstimate(est, 'declined')}
                    disabled={!!acting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-all disabled:opacity-60"
                  >
                    <XCircle size={14} />
                    {acting === est.id + 'declined' ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Receipt}
          label="Outstanding"
          value={`$${outstanding.toLocaleString()}`}
          sub={`${invoices.filter(i => i.status !== 'paid').length} unpaid invoice${invoices.filter(i => i.status !== 'paid').length !== 1 ? 's' : ''}`}
          accent={outstanding > 0}
          onClick={() => onNavigate('invoices')}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Amount Paid"
          value={`$${totalPaid.toLocaleString()}`}
          sub="Total to date"
          onClick={() => onNavigate('invoices')}
        />
        <SummaryCard
          icon={FileSignature}
          label="Plans"
          value={pendingPlans > 0 ? `${pendingPlans} pending` : `${plans.length} total`}
          sub={pendingPlans > 0 ? 'Awaiting your signature' : 'All up to date'}
          accent={pendingPlans > 0}
          onClick={() => onNavigate('plans')}
        />
        <SummaryCard
          icon={MessageSquare}
          label="Messages"
          value={unreadMessages > 0 ? `${unreadMessages} new` : messages.length > 0 ? 'Up to date' : 'No messages'}
          sub={unreadMessages > 0 ? 'From Derek' : 'No unread messages'}
          accent={unreadMessages > 0}
          onClick={() => onNavigate('messages')}
        />
      </div>

      {/* Active Project Plan */}
      {activePlan && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">Active Project</h3>
            <button onClick={() => onNavigate('plans')} className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="font-display font-bold text-xl mb-1">{activePlan.title}</div>
                {activePlan.description && (
                  <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{activePlan.description}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${(planStatusCfg[activePlan.status] || planStatusCfg.sent).color}`}>
                {(planStatusCfg[activePlan.status] || planStatusCfg.sent).label}
              </span>
            </div>
            {activePlan.deliverables?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Deliverables</div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {activePlan.deliverables.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activePlan.timeline && (
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Clock size={13} className="text-muted-foreground" />
                <span className="text-muted-foreground">Timeline:</span>
                <span className="font-medium">{activePlan.timeline}</span>
              </div>
            )}
            {['sent', 'viewed'].includes(activePlan.status) && (
              <button
                onClick={() => onNavigate('plans')}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all text-sm"
              >
                <FileSignature size={14} />
                Sign This Plan
              </button>
            )}
          </div>
        </section>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">Recent Invoices</h3>
            <button onClick={() => onNavigate('invoices')} className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 3).map(inv => {
              const cfg = invoiceStatusCfg[inv.status] || invoiceStatusCfg.unpaid;
              return (
                <div key={inv.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center">
                      <Receipt size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Invoice #{inv.id?.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{inv.due_date ? `Due ${inv.due_date}` : 'No due date'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">${(inv.total || 0).toLocaleString()}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg">Recent Messages</h3>
            <button onClick={() => onNavigate('messages')} className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              Open Chat <ArrowRight size={12} />
            </button>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {messages.slice(0, 3).map((msg, i) => (
              <div key={msg.id} className={`px-5 py-4 flex gap-4 ${i < Math.min(messages.length, 3) - 1 ? 'border-b border-border' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.from_admin ? 'bg-accent text-white' : 'bg-secondary text-foreground'}`}>
                  {msg.from_admin ? 'D' : user.full_name?.[0]?.toUpperCase() || 'Y'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{msg.from_admin ? 'Derek' : 'You'}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {msg.created_date ? new Date(msg.created_date).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{msg.body}</p>
                </div>
                {msg.from_admin && !msg.read && (
                  <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
            <button
              onClick={() => onNavigate('messages')}
              className="w-full py-3 text-sm text-accent font-semibold hover:bg-secondary transition-colors border-t border-border"
            >
              Go to Messages →
            </button>
          </div>
        </section>
      )}

      {/* Empty state */}
      {invoices.length === 0 && plans.length === 0 && messages.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
          <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nothing here yet.</p>
          <p className="text-sm mt-1">Derek will add your project details shortly.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-5 text-left hover:border-accent transition-all group w-full"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? 'bg-accent/10' : 'bg-secondary'}`}>
        <Icon size={17} className={accent ? 'text-accent' : 'text-muted-foreground'} />
      </div>
      <div className={`font-display font-black text-xl ${accent ? 'text-accent' : ''}`}>{value}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}