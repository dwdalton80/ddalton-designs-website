import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Star, Quote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const EMPTY = {
  client_name: '', client_title: '', client_company: '', quote: '',
  avatar_url: '', rating: 5, featured: true, order: 0,
};

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Testimonial.list('order', 100)
      .then(setTestimonials)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ ...t });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.Testimonial.update(editing.id, form);
    } else {
      await base44.entities.Testimonial.create(form);
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    await base44.entities.Testimonial.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-3xl">Testimonials</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage client success stories displayed on the homepage.</p>
        </div>
        <Button onClick={openNew} className="bg-accent hover:bg-accent/90 text-white gap-2">
          <Plus size={16} /> Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No testimonials yet. Add your first one!</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.client_name} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold font-display flex-shrink-0">
                      {t.client_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm">{t.client_name}</div>
                    {(t.client_title || t.client_company) && (
                      <div className="text-xs text-muted-foreground">{[t.client_title, t.client_company].filter(Boolean).join(' · ')}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-0.5">
                {[...Array(t.rating || 5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-accent text-accent" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                <Quote size={12} className="inline text-accent/40 mr-1" />
                {t.quote}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.featured ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {t.featured ? 'Featured' : 'Hidden'}
                </span>
                <span className="text-xs text-muted-foreground">Order: {t.order ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input value={form.client_title} onChange={e => set('client_title', e.target.value)} placeholder="CEO" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input value={form.client_company} onChange={e => set('client_company', e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="space-y-1.5">
                <Label>Avatar URL</Label>
                <Input value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quote *</Label>
              <Textarea value={form.quote} onChange={e => set('quote', e.target.value)} placeholder="What did this client say about working with you?" rows={4} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rating (1–5)</Label>
                <Input type="number" min={1} max={5} value={form.rating} onChange={e => set('rating', Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="featured" checked={!!form.featured} onCheckedChange={v => set('featured', v)} />
              <Label htmlFor="featured">Featured on homepage</Label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.client_name || !form.quote} className="bg-accent hover:bg-accent/90 text-white">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Testimonial'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.client_name}'s testimonial. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}