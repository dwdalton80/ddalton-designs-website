import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  contacted: { icon: Clock, color: 'text-blue-500', label: 'Contacted' },
  converted: { icon: CheckCircle, color: 'text-green-500', label: 'Converted' },
  rejected: { icon: AlertCircle, color: 'text-red-500', label: 'Rejected' }
};

export default function MyReferrals() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        setUser(currentUser);

        const userReferrals = await base44.entities.Referral.filter({ referrer_email: currentUser.email }, '-referral_date');
        setReferrals(userReferrals);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const totalEarnings = referrals
    .filter(r => r.payout_status === 'paid')
    .reduce((sum, r) => sum + (r.payout_amount || 0), 0);

  const pendingEarnings = referrals
    .filter(r => r.status === 'converted' && r.payout_status === 'unpaid')
    .reduce((sum, r) => sum + (r.payout_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="font-display font-black text-4xl md:text-5xl mb-3">My Referrals</h1>
            <p className="text-lg text-muted-foreground">Track your referrals and earnings</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Total Referrals</div>
              <div className="font-display font-black text-4xl">{referrals.length}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Earned</div>
              <div className="font-display font-black text-4xl text-green-500">${totalEarnings.toFixed(0)}</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Pending</div>
              <div className="font-display font-black text-4xl text-yellow-500">${pendingEarnings.toFixed(0)}</div>
            </div>
          </div>

          {/* Referrals List */}
          {referrals.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <AlertCircle size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">You haven't submitted any referrals yet.</p>
              <a href="/referrals" className="inline-block px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all">
                Submit Your First Referral
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map(referral => {
                const status = STATUS_CONFIG[referral.status];
                const StatusIcon = status.icon;
                return (
                  <div key={referral.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.color} bg-opacity-10`}>
                          <StatusIcon size={24} className={status.color} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{referral.referred_client_name}</div>
                          <div className="text-sm text-muted-foreground">{referral.referred_client_email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(referral.referral_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-accent">${referral.payout_amount}</div>
                        <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
                        {referral.payout_status === 'paid' && <div className="text-xs text-green-500 mt-1">Paid</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}