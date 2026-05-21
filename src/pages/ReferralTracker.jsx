import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending Review' },
  contacted: { icon: Clock, color: 'text-blue-500', label: 'Client Contacted' },
  converted: { icon: CheckCircle, color: 'text-green-500', label: 'Converted to Client' },
  rejected: { icon: AlertCircle, color: 'text-red-500', label: 'Not a Good Fit' }
};

export default function ReferralTracker() {
  const { id } = useParams();
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const data = await base44.entities.Referral.get(id);
        setReferral(data);
      } catch (error) {
        console.error('Error fetching referral:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReferral();
  }, [id]);

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

  if (!referral) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Referral not found</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const status = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const timeline = [
    { step: 'Referral Submitted', date: referral.referral_date, active: true },
    { step: 'Client Contacted', date: null, active: referral.status !== 'pending' },
    { step: 'Converted to Client', date: referral.conversion_date, active: referral.status === 'converted' },
    { step: 'Payment Issued', date: referral.status === 'converted' ? 'Within 30 days' : null, active: referral.payout_status === 'paid' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
            {/* Status Header */}
            <div className="text-center mb-12">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${status.color} bg-opacity-10`}>
                <StatusIcon size={40} className={status.color} />
              </div>
              <h1 className="font-display font-black text-4xl mb-2">Referral Status</h1>
              <p className="text-2xl font-semibold text-accent">{status.label}</p>
            </div>

            {/* Referral Details */}
            <div className="bg-secondary/30 rounded-xl p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your Name</div>
                  <div className="text-lg font-medium">{referral.referrer_name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your Email</div>
                  <div className="text-lg font-medium">{referral.referrer_email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Referred Client</div>
                  <div className="text-lg font-medium">{referral.referred_client_name}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Referral Amount</div>
                  <div className="text-lg font-medium text-accent">${referral.payout_amount}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-6">Referral Timeline</h3>
              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.active ? 'border-accent bg-accent' : 'border-border bg-background'}`}>
                        {item.active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {idx < timeline.length - 1 && <div className={`w-0.5 h-12 ${item.active ? 'bg-accent' : 'bg-border'}`} />}
                    </div>
                    <div className="pb-4">
                      <div className="font-medium">{item.step}</div>
                      {item.date && <div className="text-sm text-muted-foreground">{typeof item.date === 'string' ? item.date : new Date(item.date).toLocaleDateString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {referral.notes && (
              <div className="bg-secondary/30 rounded-xl p-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notes</div>
                <p className="text-muted-foreground">{referral.notes}</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}