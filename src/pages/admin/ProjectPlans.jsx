import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, FileSignature, Trash2, Send, X, PlusCircle, MinusCircle } from 'lucide-react';

const statusColors = {
  draft: 'bg-secondary text-muted-foreground',
  sent: 'bg-yellow-50 text-yellow-700',
  viewed: 'bg-blue-50 text-blue-600',
  signed: 'bg-green-50 text-green-600',
  declined: 'bg-red-50 text-red-600',
};

const emptyPlan = {
  title: '',
  client_email: '',
  client_id: '',
  description: '',
  scope: '',
  deliverables: [''],
  timeline: '',
  total_amount: 0,
  status: 'draft',
};

export default function ProjectPlans() {
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [p, c] = await Promise.all([
      base44.entities.ProjectPlan.list('-created_date', 50),
      base44.entities.Client.list('name', 50),
    ]);
    setPlans(p);
    setClients(c);
    setLoading(false);
  };

  const handleClientSelect = (e) => {
    const client = clients.find(c => c.id === e.target.value);
    if (client) {
      setForm(f => ({ ...f, client_id: client.id, client_email: client.email }));
    } else {
      setForm(f => ({ ...f, client_id: '', client_email: '' }));
    }
  };

  const updateDeliverable = (i, val) => {
    const d = [...form.deliverables];
    d[i] = val;
    setForm(f => ({ ...f, deliverables: d }));
  };

  const save = async () => {
    if (!form.title || !form.client_email) return;
    setSaving(true);
    const deliverables = form.deliverables.filter(d => d.trim());
    await base44.entities.ProjectPlan.create({ ...form, deliverables });
    setShowForm(false);
    setForm(emptyPlan);
    await loadAll();
    setSaving(false);
  };

  const sendPlan = async (plan) => {
    await base44.entities.ProjectPlan.update(plan.id, { status: 'sent', sent_at: new Date().toISOString() });
    await loadAll();
  };

  const deletePlan = async (id) => {
    await base44.entities.ProjectPlan.delete(id);
    await loadAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl">Project Plans</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create and send eSign-ready project plans to clients.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-primary-foreground font-semibold rounded-xl hover:bg-accent transition-all text-sm"
        >
          <Plus size={15} />
          New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : plans.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
          <FileSignature size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold mb-1">No project plans yet</p>
          <p className="text-sm">Create a plan and send it to a client for eSigning.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <FileSignature size={17} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg">{plan.title}</div>
                    <div className="text-sm text-muted-foreground">{plan.client_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[plan.status] || statusColors.draft}`}>
                    {plan.status === 'signed' && plan.client_signature ? `Signed by ${plan.client_signature}` : plan.status}
                  </span>
                  {plan.status === 'draft' && (
                    <button
                      onClick={() => sendPlan(plan)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-all"
                    >
                      <Send size={12} />
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {plan.description && <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>}
              {plan.total_amount > 0 && <div className="text-sm font-semibold mt-2">Value: ${plan.total_amount.toLocaleString()}</div>}
            </div>
          ))}
        </div>
      )}

      {/* New Plan Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 py-10 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-8 max-w-2xl w-full shadow-xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl">New Project Plan</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-secondary"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Plan Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Website Redesign Project"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Client *</label>
                  <select
                    value={form.client_id}
                    onChange={handleClientSelect}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent"
                  >
                    <option value="">Select a client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                  </select>
                  {!form.client_id && (
                    <input
                      value={form.client_email}
                      onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                      placeholder="Or enter email manually"
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent mt-2"
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Brief project overview…"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Scope of Work</label>
                  <textarea
                    value={form.scope}
                    onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                    rows={4}
                    placeholder="Detailed scope and terms…"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Deliverables</label>
                <div className="space-y-2">
                  {form.deliverables.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={d}
                        onChange={e => updateDeliverable(i, e.target.value)}
                        placeholder={`Deliverable ${i + 1}`}
                        className="flex-1 border border-border rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:border-accent"
                      />
                      {form.deliverables.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, deliverables: f.deliverables.filter((_, j) => j !== i) }))} className="p-2 text-muted-foreground hover:text-destructive">
                          <MinusCircle size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, deliverables: [...f.deliverables, ''] }))} className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                    <PlusCircle size={14} /> Add deliverable
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Timeline</label>
                  <input
                    value={form.timeline}
                    onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
                    placeholder="e.g. 4–6 weeks"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Project Value ($)</label>
                  <input
                    type="number"
                    value={form.total_amount}
                    onChange={e => setForm(f => ({ ...f, total_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-secondary transition-all">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!form.title || !form.client_email || saving}
                className="flex-1 px-4 py-2.5 bg-foreground text-primary-foreground rounded-xl text-sm font-semibold hover:bg-accent transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}