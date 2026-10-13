import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Send, Check, X, Trash2, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_STYLES = {
  sent: 'bg-blue-500/15 text-blue-500',
  submitted: 'bg-yellow-500/15 text-yellow-600',
  approved: 'bg-green-500/15 text-green-600',
  declined: 'bg-secondary text-muted-foreground',
};

const STATUS_LABELS = {
  sent: 'Awaiting reply',
  submitted: 'Needs review',
  approved: 'Approved',
  declined: 'Declined',
};

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm';
const labelClass = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5';

export default function Reviews() {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [choice, setChoice] = useState('');
  const [form, setForm] = useState({ client_id: '', client_name: '', client_email: '' });

  const fetch = () => {
    base44.entities.ReviewRequest.list('-created_date', 200)
      .then(d => { setRequests(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    base44.entities.Client.list('name', 200).then(setClients).catch(() => setClients([]));
  }, []);

  const pickClient = (id) => {
    setChoice(id);
    if (!id) { setForm({ client_id: '', client_name: '', client_email: '' }); return; }
    const c = clients.find(x => x.id === id);
    setForm({ client_id: id, client_name: c?.name || '', client_email: (c?.email || '').toLowerCase() });
  };

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.functions.invoke('sendReviewRequest', form);
      toast.success(`Review request sent to ${form.client_email}`);
      setShowSend(false);
      setChoice('');
      setForm({ client_id: '', client_name: '', client_email: '' });
      fetch();
    } catch (err) {
      toast.error(`Couldn't send: ${err?.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const approve = async (r) => {
    try {
      await base44.functions.invoke('approveReview', { id: r.id });
      toast.success('Approved. Feature it from the Testimonials page when you are ready.');
      fetch();
    } catch (err) {
      toast.error(`Couldn't approve: ${err?.message || 'Unknown error'}`);
    }
  };

  const decline = async (r) => {
    if (!confirm(`Decline the review from ${r.client_name}? It will not be published.`)) return;
    await base44.entities.ReviewRequest.update(r.id, { status: 'declined' });
    fetch();
  };

  const del = async (r) => {
    if (!confirm('Delete this review request permanently?')) return;
    await base44.entities.ReviewRequest.delete(r.id);
    fetch();
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const awaiting = requests.filter(r => r.status === 'submitted').length;

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-black text-3xl">Reviews</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {awaiting > 0 ? `${awaiting} waiting for your approval` : 'Ask a client for a review and approve what comes back.'}
            </p>
          </div>
          <button
            onClick={() => setShowSend(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all"
          >
            <Send size={15} /> Request a Review
          </button>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {['all', 'sent', 'submitted', 'approved', 'declined'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquareQuote size={32} className="mx-auto mb-3 opacity-30" />
            <p>No review requests here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{r.client_name}</div>
                    <div className="text-xs text-muted-foreground break-all">{r.client_email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <button onClick={() => del(r)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {r.quote ? (
                  <>
                    <div className="flex gap-1 mb-2">
                      {[...Array(r.rating || 5)].map((_, i) => (
                        <Star key={i} size={13} className="fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-1">"{r.quote}"</p>
                    {(r.client_title || r.client_company) && (
                      <p className="text-xs text-muted-foreground">
                        {[r.client_title, r.client_company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Sent {r.sent_at ? format(new Date(r.sent_at), 'MMM d, yyyy') : ''} — no reply yet.
                  </p>
                )}

                {r.status === 'submitted' && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => approve(r)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all"
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      onClick={() => decline(r)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-secondary transition-all"
                    >
                      <X size={13} /> Decline
                    </button>
                  </div>
                )}

                {r.status === 'approved' && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Saved as a testimonial. Turn on <strong>Featured</strong> in Testimonials to show it on the homepage.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showSend && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 w-full max-w-md my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">Request a Review</h2>
              <button onClick={() => setShowSend(false)}><X size={18} /></button>
            </div>
            <form onSubmit={send} className="space-y-4">
              <div>
                <label className={labelClass}>Client</label>
                <select value={choice} onChange={e => pickClient(e.target.value)} className={inputClass}>
                  <option value="">+ Someone not in Clients</option>
                  {clients.length > 0 && (
                    <optgroup label="— Existing Clients">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    required
                    value={form.client_name}
                    onChange={e => setForm({ ...form, client_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    required
                    type="email"
                    value={form.client_email}
                    onChange={e => setForm({ ...form, client_email: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                They get a one-time link. Nothing reaches the site until you approve it.
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button type="button" onClick={() => setShowSend(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={sending} className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60">
                  {sending ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
