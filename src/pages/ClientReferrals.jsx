import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, AlertCircle } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function ClientReferrals() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    referred_client_name: '',
    referred_client_email: '',
  });

  useEffect(() => {
    base44.auth.me()
      .then(async u => {
        if (!u) {
          setLoading(false);
          return;
        }
        setUser(u);
        // Verify client access - check if a referral exists for this email
        // This ensures only past referrers can submit new referrals
        try {
          const existingReferrals = await base44.entities.Referral.filter({ referrer_email: u.email }, null, 1);
          if (existingReferrals && existingReferrals.length > 0) {
            // User has submitted a referral before, they're a valid referrer
            setClient({ email: u.email, name: u.full_name });
          }
        } catch (err) {
          // If filter fails due to RLS, user doesn't have permission
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !client) return;

    setSubmitting(true);
    setError('');

    try {
      // Create referral
      await base44.entities.Referral.create({
        referrer_name: user.full_name,
        referrer_email: user.email,
        referred_client_name: formData.referred_client_name,
        referred_client_email: formData.referred_client_email,
        referral_date: new Date().toISOString(),
        status: 'pending',
      });

      // Send confirmation email to referrer
      await base44.functions.invoke('sendReferrerConfirmation', {
        referrer_name: user.full_name,
        referrer_email: user.email,
        referred_client_name: formData.referred_client_name,
      });

      // Send lead qualification email to referred person
      await base44.functions.invoke('sendLeadQualification', {
        referred_client_name: formData.referred_client_name,
        referred_client_email: formData.referred_client_email,
        referrer_name: user.full_name,
      });

      setSubmitted(true);
      setFormData({ referred_client_name: '', referred_client_email: '' });
    } catch (err) {
      setError('Failed to submit referral. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={24} className="text-accent" />
          </div>
          <h1 className="font-display font-black text-3xl mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">You need to be signed in to submit referrals as a client.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-8 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-[#CC3F00] transition-all inline-block"
          >
            Sign In
          </button>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={24} className="text-accent" />
          </div>
          <h1 className="font-display font-black text-3xl mb-2">Access Denied</h1>
          <p className="text-muted-foreground">This page is for current clients only. If you believe this is a mistake, please contact Derek.</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-accent/10 border border-accent/20">
              <span className="text-sm font-semibold text-accent">Exclusive for Clients</span>
            </div>
            <h1 className="font-display font-black text-5xl mb-4">Refer a Friend</h1>
            <p className="text-lg text-muted-foreground">Know someone who needs design work? Refer them and earn $100 when they become a client.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} className="text-green-600" />
                </div>
                <h2 className="font-display font-bold text-2xl mb-2">Referral Submitted!</h2>
                <p className="text-muted-foreground mb-8">Thanks for referring {formData.referred_client_name}. Derek will reach out to them within 48 hours. You'll get email updates as the status changes.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-[#CC3F00] transition-all inline-block"
                >
                  Submit Another Referral
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Your Name</label>
                  <input
                    type="text"
                    value={user.full_name}
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This is filled from your profile</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Your Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This is filled from your profile</p>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-lg mb-4">Referred Client Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Their Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.referred_client_name}
                        onChange={(e) => setFormData({ ...formData, referred_client_name: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Their Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.referred_client_email}
                        onChange={(e) => setFormData({ ...formData, referred_client_email: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-[#CC3F00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Referral'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-secondary/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">How It Works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li><span className="font-semibold text-foreground">1.</span> Submit their details above</li>
                <li><span className="font-semibold text-foreground">2.</span> Derek reaches out within 48 hours</li>
                <li><span className="font-semibold text-foreground">3.</span> If they sign a project agreement, you earn $100</li>
              </ol>
            </div>
            <div className="bg-secondary/50 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">You'll get an email update each time your referral's status changes — no login needed.</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}