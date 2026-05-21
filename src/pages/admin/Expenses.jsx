import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, Upload, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['software', 'hardware', 'marketing', 'travel', 'office', 'contractor', 'education', 'other'];

const CATEGORY_COLORS = {
  software: 'bg-blue-500/15 text-blue-600',
  hardware: 'bg-purple-500/15 text-purple-600',
  marketing: 'bg-pink-500/15 text-pink-600',
  travel: 'bg-yellow-500/15 text-yellow-600',
  office: 'bg-green-500/15 text-green-600',
  contractor: 'bg-orange-500/15 text-orange-600',
  education: 'bg-cyan-500/15 text-cyan-600',
  other: 'bg-gray-500/15 text-gray-600',
};

const emptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: 'other',
  amount: '',
  vendor: '',
  notes: '',
  receipt_url: '',
});

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  const fetchExpenses = () => {
    base44.entities.Expense.list('-date', 200)
      .then(d => { setExpenses(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetchExpenses(); }, []);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setShowForm(true); };
  const openEdit = (exp) => { setForm({ ...exp }); setEditing(exp.id); setShowForm(true); };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, receipt_url: file_url }));
    setUploading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    const { id, created_date, updated_date, created_by, ...data } = form;
    data.amount = parseFloat(data.amount) || 0;
    if (editing) await base44.entities.Expense.update(editing, data);
    else await base44.entities.Expense.create(data);
    setShowForm(false);
    fetchExpenses();
  };

  const del = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await base44.entities.Expense.delete(id);
    fetchExpenses();
  };

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
  const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalFiltered = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  // Group by month for summary
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses
    .filter(e => e.date?.startsWith(thisMonth))
    .reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl">Expenses</h1>
          <p className="text-muted-foreground mt-1">{expenses.length} records</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">This Month</div>
          <div className="font-display font-black text-2xl text-accent">${monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">All Time</div>
          <div className="font-display font-black text-2xl">${totalAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 col-span-2 md:col-span-1">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {filter === 'all' ? 'Total Records' : `${filter} Total`}
          </div>
          <div className="font-display font-black text-2xl">
            {filter === 'all' ? expenses.length : `$${totalFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === 'all' ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === c ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <TrendingDown size={32} className="mx-auto mb-3 opacity-30" />
          <p>No expenses yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => (
            <div key={exp.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 group hover:border-accent/50 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{exp.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.other}`}>
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>{exp.date ? format(new Date(exp.date + 'T00:00:00'), 'MMM d, yyyy') : '—'}</span>
                  {exp.vendor && <span>· {exp.vendor}</span>}
                  {exp.receipt_url && <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">Receipt ↗</a>}
                </div>
              </div>
              <div className="font-display font-bold text-lg">${(exp.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg border border-border hover:border-foreground text-xs">✎</button>
                <button onClick={() => del(exp.id)} className="p-1.5 rounded-lg border border-border hover:border-red-400"><Trash2 size={13} className="text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">{editing ? 'Edit' : 'Add'} Expense</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Amount ($) *</label>
                  <input required type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Description *</label>
                <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Vendor</label>
                  <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Receipt</label>
                <div className="flex items-center gap-3">
                  {form.receipt_url && (
                    <a href={form.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View Receipt ↗</a>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-xl cursor-pointer hover:border-accent transition-colors text-sm text-muted-foreground w-fit">
                    <Upload size={14} /> {uploading ? 'Uploading...' : form.receipt_url ? 'Replace' : 'Upload Receipt'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">
                  {editing ? 'Update' : 'Save'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}