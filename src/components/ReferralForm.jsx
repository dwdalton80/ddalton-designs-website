import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function ReferralForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    referrer_name: '',
    referrer_email: '',
    referred_client_name: '',
    referred_client_email: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // One public endpoint. It writes the referral and sends all three emails
      // server-side, so the form doesn't need entity-write or email routes
      // exposed to the public.
      await base44.functions.invoke('submitReferral', formData);

      setSubmitted(true);
      setFormData({
        referrer_name: '',
        referrer_email: '',
        referred_client_name: '',
        referred_client_email: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting referral:', error);
      setError("Something went wrong sending that referral. Please try again, or email derek@ddaltondesigns.com directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-accent" />
        </div>
        <h3 className="font-display font-black text-3xl mb-2">Referral Submitted!</h3>
        <p className="text-muted-foreground mb-6">Thanks for the referral! I'll be in touch shortly and update you on the outcome.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm text-accent hover:underline"
        >
          Submit Another Referral
        </button>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-accent transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Your Name *</label>
          <input
            type="text"
            name="referrer_name"
            value={formData.referrer_name}
            onChange={handleChange}
            placeholder="Your name"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Your Email *</label>
          <input
            type="email"
            name="referrer_email"
            value={formData.referrer_email}
            onChange={handleChange}
            placeholder="your@email.com"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Client Name *</label>
          <input
            type="text"
            name="referred_client_name"
            value={formData.referred_client_name}
            onChange={handleChange}
            placeholder="Client's name"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Client Email *</label>
          <input
            type="email"
            name="referred_client_email"
            value={formData.referred_client_email}
            onChange={handleChange}
            placeholder="client@email.com"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Notes (Optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Tell me about the referral, their project needs, etc."
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-[#CC3F00] transition-all disabled:opacity-60"
      >
        {loading ? 'Submitting...' : 'Submit Referral'}
      </button>
    </form>
  );
}