import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, Star, Upload, Image } from 'lucide-react';

const CATEGORIES = ['website', 'logo', 'marketing'];

export default function PortfolioManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'website', images: [], description: '', url: '', client_name: '', featured: false, order: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetch = () => {
    base44.entities.PortfolioItem.list('order', 100)
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm({ title: '', category: 'website', cover_image: '', images: [], description: '', url: '', client_name: '', featured: false, order: items.length }); setEditing(null); setImageUrl(''); setShowForm(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setImageUrl(''); setShowForm(true); };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_image: file_url }));
    setUploadingCover(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, images: [...f.images, file_url] }));
    setUploading(false);
  };

  const addImageUrl = () => {
    if (!imageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaveError('');
    const { id, created_date, updated_date, created_by, ...data } = form;
    try {
      if (editing) await base44.entities.PortfolioItem.update(editing, data);
      else await base44.entities.PortfolioItem.create(data);
      setShowForm(false);
      fetch();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save. Please try again.');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this portfolio item?')) return;
    await base44.entities.PortfolioItem.delete(id);
    fetch();
  };

  const toggleFeatured = async (item) => {
    await base44.entities.PortfolioItem.update(item.id, { featured: !item.featured });
    fetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl">Portfolio Manager</h1>
          <p className="text-muted-foreground mt-1">{items.length} items</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Image size={32} className="mx-auto mb-3 opacity-30" />
          <p>No portfolio items yet. Add your first project!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden group">
              <div className="aspect-[4/3] bg-secondary relative">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} className="text-muted-foreground opacity-30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleFeatured(item)} className={`p-1.5 rounded-lg ${item.featured ? 'bg-yellow-400' : 'bg-white/80'}`}>
                    <Star size={13} className={item.featured ? 'text-white' : 'text-muted-foreground'} />
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-white/80 text-sm">✎</button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded-lg bg-white/80"><Trash2 size={13} className="text-red-500" /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{item.title}</div>
                  <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{item.category}</span>
                </div>
                {item.client_name && <div className="text-xs text-muted-foreground mt-0.5">{item.client_name}</div>}
                {item.featured && <div className="text-xs text-yellow-500 font-semibold mt-1 flex items-center gap-1"><Star size={10} /> Featured</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">{editing ? 'Edit' : 'Add'} Portfolio Item</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Title *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Client Name</label>
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Live URL</label>
                  <input type="text" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                   className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" placeholder="https://" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
              </div>
              {/* Cover Image */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Cover Image <span className="normal-case font-normal text-muted-foreground">(shown on home page &amp; portfolio grid)</span>
                </label>
                <div className="flex items-start gap-3">
                  {form.cover_image && (
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <X size={9} />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-accent rounded-xl cursor-pointer hover:bg-accent/5 transition-colors text-sm text-accent font-medium w-fit">
                    <Upload size={14} /> {uploadingCover ? 'Uploading...' : form.cover_image ? 'Replace Cover' : 'Upload Cover Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                  </label>
                </div>
              </div>

              {/* Detail Images */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Detail Images <span className="normal-case font-normal text-muted-foreground">(shown on portfolio item page)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL..."
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                  <button type="button" onClick={addImageUrl} className="px-4 py-2 bg-secondary rounded-xl text-sm font-medium">Add</button>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-xl cursor-pointer hover:border-accent transition-colors text-sm text-muted-foreground w-fit">
                  <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
                {form.images?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-white">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-accent" />
                <label htmlFor="featured" className="text-sm">Feature on homepage</label>
                <div className="ml-4">
                  <label className="text-xs text-muted-foreground mr-2">Order:</label>
                  <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>
              {saveError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}