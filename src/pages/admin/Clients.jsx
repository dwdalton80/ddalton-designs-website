import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Plus, X, Edit2, Trash2, Paperclip } from 'lucide-react';
import ClientFilesPanel from '@/components/admin/ClientFilesPanel';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | client object
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [sendInvite, setSendInvite] = useState(false);
  const [filesClient, setFilesClient] = useState(null);

  const fetch = () => {
    base44.entities.Client.list('-created_date', 100)
      .then(d => { setClients(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm({ name: '', email: '', phone: '', company: '', notes: '' }); setSendInvite(false); setModal('add'); };
  const openEdit = (c) => { setForm({ name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', notes: c.notes || '' }); setModal(c); };

  const save = async (e) => {
    e.preventDefault();
    if (modal === 'add') {
      await base44.entities.Client.create(form);
      if (sendInvite) {
        try { await base44.users.inviteUser(form.email, 'user'); } catch {}
        await base44.integrations.Core.SendEmail({
          to: form.email,
          subject: `You're invited to the DDalton Designs Client Portal`,
          body: `Hi ${form.name},\n\nYou've been invited to the DDalton Designs Client Portal, where you can view your invoices, project plans, estimates, and send messages directly.\n\nAccess your portal here:\n${window.location.origin}/portal\n\nYou'll receive a separate login email shortly. If you already have an account, just sign in with your email.\n\nBest,\nDerek Dalton\nDDalton Designs\nderek@ddaltondesigns.com`,
        });
      }
    } else {
      await base44.entities.Client.update(modal.id, form);
    }
    setModal(null);
    fetch();
  };

  const del = async (id) => {
    if (!confirm('Delete this client?')) return;
    await base44.entities.Client.delete(id);
    fetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients.length} total clients</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p>No clients yet. Add your first client or convert a request.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-display font-bold text-accent flex-shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setFilesClient(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" title="View files"><Paperclip size={14} /></button>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="font-semibold">{c.name}</div>
              {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
              <div className="text-xs text-muted-foreground mt-1">{c.email}</div>
              {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Files Panel */}
      {filesClient && <ClientFilesPanel client={filesClient} onClose={() => setFilesClient(null)} />}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">{modal === 'add' ? 'Add Client' : 'Edit Client'}</h2>
              <button onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              {[['name', 'Name', true], ['email', 'Email', true], ['phone', 'Phone'], ['company', 'Company'], ['notes', 'Notes']].map(([field, label, req]) => (
                field === 'notes' ? (
                  <div key={field}>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
                    <textarea rows={3} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
                  </div>
                ) : (
                  <div key={field}>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label} {req && '*'}</label>
                    <input required={!!req} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  </div>
                )
              ))}
              {modal === 'add' && (
                <label className="flex items-center gap-3 cursor-pointer pt-1">
                  <input type="checkbox" checked={sendInvite} onChange={e => setSendInvite(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent" />
                  <span className="text-sm text-muted-foreground">Send portal invite email</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}