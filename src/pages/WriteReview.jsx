import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

// The Google Business Profile link, same one declared as sameAs in the
// homepage JSON-LD.
const GOOGLE_REVIEW_URL = 'https://share.google/TVE3XOgjTQ9OSJyzU';

export default function WriteReview() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | ready | done | invalid | used
  const [clientName, setClientName] = useState('');
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState({ quote: '', client_title: '', client_company: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Write a Review | DDalton Designs';
    // Nothing here should be indexed — the page only means anything with a
    // token, and those are private to one client.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    base44.functions.invoke('getReviewInvite', { token })
      .then(res => {
        setClientName(res.client_name || '');
        setState(res.already_submitted ? 'used' : 'ready');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await base44.functions.invoke('submitReview', { token, rating, ...form });
      setState('done');
    } catch (err) {
      console.error('Review submission failed:', err);
      setError(err?.message || 'Something went wrong sending that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="min-h-screen flex items-center justify-center px-6 py-28">
        <div className="w-full max-w-xl">{children}</div>
      </section>
      <PublicFooter />
    </div>
  );

  if (state === 'loading') {
    return shell(
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'invalid' || state === 'used') {
    return shell(
      <div className="text-center">
        <h1 className="font-display font-black text-4xl mb-3">
          {state === 'used' ? 'Already received' : 'This link has expired'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {state === 'used'
            ? 'Thanks again — your review is already in. There is nothing else to do.'
            : 'This review link is no longer valid. If you think that is a mistake, just reply to the email and I will send a fresh one.'}
        </p>
        <a href="/" className="inline-block px-7 py-3.5 bg-foreground text-primary-foreground font-semibold rounded-full text-sm">
          Go to the homepage
        </a>
      </div>
    );
  }

  if (state === 'done') {
    return shell(
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-accent" />
        </div>
        <h1 className="font-display font-black text-4xl mb-3">Thank you!</h1>
        <p className="text-muted-foreground mb-8">
          That genuinely helps. I read every one of these, and I will let you know if it ends up on the site.
        </p>
        {/* Asked only after they have already written something, so it reads as
            an optional extra rather than a second request up front. */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
          <p className="font-semibold mb-1">Would you post it on Google too?</p>
          <p className="text-sm text-muted-foreground mb-4">
            Totally optional — but a Google review is the single biggest help for a small business like mine.
            You can paste what you just wrote.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl text-sm hover:bg-red-600 transition-all"
          >
            <Star size={15} className="fill-white" /> Leave a Google review
          </a>
        </div>
        <a href="/" className="inline-block px-7 py-3.5 bg-foreground text-primary-foreground font-semibold rounded-full text-sm">
          Go to the homepage
        </a>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors text-sm';

  return shell(
    <>
      <h1 className="font-display font-black text-4xl md:text-5xl mb-3">
        {clientName ? `Thanks, ${clientName.split(' ')[0]}!` : 'Thanks!'}
      </h1>
      <p className="text-muted-foreground mb-10">
        A sentence or two about how the project went is plenty. Nothing is published until I have read it.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            How did it go?
          </label>
          <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="p-1 rounded transition-transform hover:scale-110"
              >
                <Star
                  size={30}
                  className={n <= (hovered || rating) ? 'fill-accent text-accent' : 'text-border'}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            Your review *
          </label>
          <textarea
            required
            rows={6}
            minLength={10}
            maxLength={2000}
            value={form.quote}
            onChange={e => setForm({ ...form, quote: e.target.value })}
            placeholder="What were you looking for, and how did it turn out?"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Your title (optional)
            </label>
            <input
              value={form.client_title}
              onChange={e => setForm({ ...form, client_title: e.target.value })}
              placeholder="Owner, Marketing Director…"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Company (optional)
            </label>
            <input
              value={form.client_company}
              onChange={e => setForm({ ...form, client_company: e.target.value })}
              placeholder="Your business name"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all text-sm disabled:opacity-60"
        >
          {saving ? 'Sending…' : 'Send My Review'}
        </button>
      </form>
    </>
  );
}
