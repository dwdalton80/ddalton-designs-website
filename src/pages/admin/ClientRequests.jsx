import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Inbox, Eye, Archive, UserPlus, X, Phone, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  new: 'bg-accent/10 text-accent',
  read: 'bg-blue-50 text-blue-600',
  converted: 'bg-green-50 text-green-600',
  archived: 'bg-secondary text-muted-foreground',
};

export default function ClientRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchRequests = () => {
    base44.entities.ClientRequest.list('-created_date', 100)
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.ClientRequest.update(id, { status });
    fetchRequests();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const convertToClient = async (req) => {
    await base44.entities.Client.create({ name: req.name, email: req.email, phone: req.phone });
    await base44.entities.ClientRequest.update(req.id, { status: 'converted' });
    fetchRequests();
    if (selected?.id === req.id) setSelected({ ...selected, status: 'converted' });
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl">Client Requests</h1>
          <p className="text-muted-foreground mt-1">{requests.filter(r => r.status === 'new').length} new requests</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'new', 'read', 'converted', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Inbox size={32} className="mx-auto mb-3 opacity-30" />
              <p>No requests found</p>
            </div>
          ) : filtered.map(req => (
            <div
              key={req.id}
              onClick={() => { setSelected(req); updateStatus(req.id, req.status === 'new' ? 'read' : req.status); }}
              className={`bg-card rounded-2xl border p-4 cursor-pointer hover:border-accent transition-all ${selected?.id === req.id ? 'border-accent' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{req.name}</span>
                    {req.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{req.email} {req.project_type ? `· ${req.project_type}` : ''}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.message}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(req.created_date), 'MMM d')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="bg-card rounded-2xl border border-border p-6 h-fit">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-6">
              <a href={`mailto:${selected.email}`} className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                <Mail size={14} className="text-muted-foreground" /> {selected.email}
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                  <Phone size={14} className="text-muted-foreground" /> {selected.phone}
                </a>
              )}
              {selected.project_type && (
                <div className="flex items-center gap-3 text-sm capitalize">
                  <span className="w-2 h-2 rounded-full bg-accent" /> {selected.project_type} Design
                </div>
              )}
              {selected.budget && (
                <div className="text-sm text-muted-foreground">Budget: <span className="text-foreground font-medium">{selected.budget}</span></div>
              )}
            </div>
            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Message</div>
              <p className="text-sm leading-relaxed text-muted-foreground bg-secondary rounded-xl p-3">{selected.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${selected.email}?subject=Re: Your Project Request&body=Hi ${selected.name},%0A%0AThank you for reaching out to DDalton Designs!%0A%0A`}
                className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl text-center hover:bg-red-600 transition-all"
              >
                Reply by Email
              </a>
              {selected.status !== 'converted' && (
                <button
                  onClick={() => convertToClient(selected)}
                  className="w-full py-2.5 bg-foreground text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-80 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={14} /> Convert to Client
                </button>
              )}
              {selected.status !== 'archived' && (
                <button
                  onClick={() => updateStatus(selected.id, 'archived')}
                  className="w-full py-2.5 border border-border text-sm font-medium rounded-xl hover:border-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Archive size={14} /> Archive
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-dashed border-border p-6 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a request to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}