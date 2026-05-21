import { useState } from 'react';
import { CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const PROJECT_TYPES = [
  { value: 'website', label: 'Website Design' },
  { value: 'logo', label: 'Logo & Brand Identity' },
  { value: 'marketing', label: 'Marketing Materials' },
  { value: 'other', label: 'Something Else' },
];

const BUDGETS = ['Under $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500 – $5,000', '$5,000+'];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', project_type: '', message: '', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ClientRequest.create(form);
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-accent" />
          </div>
          <h2 className="font-display font-black text-4xl mb-3">Message Sent!</h2>
          <p className="text-muted-foreground mb-6">Thanks for reaching out, {form.name}. I'll review your request and get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="text-sm text-muted-foreground hover:text-accent transition-colors underline">Send another message</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Let's Connect</div>
              <h1 className="font-display font-black text-6xl md:text-7xl mb-6">Start a Project</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                Fill out the form and I'll get back to you within 48 hours with a personalized response and a free quote.
              </p>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Email</div>
                    <a href="mailto:derek@ddaltondesigns.com" className="font-medium hover:text-accent transition-colors">derek@ddaltondesigns.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Response Time</div>
                    <div className="font-medium">Within 48 hours</div>
                  </div>
                </div>
              </div>

              <div className="mt-16 p-6 border border-border rounded-2xl">
                <div className="text-sm font-semibold mb-3">What happens next?</div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {['I review your request and project details', 'I send you a personalized estimate within 24–48 hrs', 'We hop on a quick call to align on scope & timeline', 'We get to work!'].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Name *</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Email *</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm"
                    placeholder="(optional)"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Budget</label>
                  <select
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm"
                  >
                    <option value="">Select range</option>
                    {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Project Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setForm({ ...form, project_type: t.value })}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.project_type === t.value ? 'bg-foreground text-primary-foreground border-foreground' : 'border-border hover:border-foreground'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Tell Me About Your Project *</label>
                <textarea
                  required rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm resize-none"
                  placeholder="Describe what you're looking for, your timeline, and any specific requirements..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all text-sm disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send My Request'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}