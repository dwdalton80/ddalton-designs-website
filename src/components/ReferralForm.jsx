import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle } from 'lucide-react';

export default function ReferralForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    try {
      await base44.entities.Referral.create({
        ...formData,
        referral_date: new Date().toISOString(),
        status: 'pending'
      });
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all disabled:opacity-60"
      >
        {loading ? 'Submitting...' : 'Submit Referral'}
      </button>
    </form>
  );
}