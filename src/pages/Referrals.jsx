import { Gift, TrendingUp, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import ReferralForm from '@/components/ReferralForm';

export default function Referrals() {
  const steps = [
    {
      number: '1',
      title: 'Submit a Referral',
      description: 'Know someone who needs bold design? Fill out the referral form with their details and a bit about their project.'
    },
    {
      number: '2',
      title: 'I Review & Connect',
      description: "I'll reach out to the referred client within 48 hours to discuss their needs and see if we're a good fit."
    },
    {
      number: '3',
      title: 'They Become a Client',
      description: 'If they sign a project agreement and move forward with work, the referral is converted to a paid one.'
    },
    {
      number: '4',
      title: 'You Get Paid',
      description: 'Once the project kicks off, you receive your $100 referral bonus. Payment is made within 30 days.'
    }
  ];

  const benefits = [
    {
      icon: Gift,
      title: '$100 Per Referral',
      description: 'Get paid for every successful referral that becomes a paid project.'
    },
    {
      icon: TrendingUp,
      title: 'Unlimited Earning',
      description: 'No caps on referrals. Refer as many clients as you want and earn $100 for each one.'
    },
    {
      icon: Zap,
      title: 'Fast Payouts',
      description: 'Get paid within 30 days of project kickoff. You can track everything in your dashboard.'
    },
    {
      icon: Users,
      title: 'Help Your Network',
      description: 'Connect people you trust with a designer who delivers exceptional results.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-accent/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-sm font-semibold text-accent">Earn Money, Help Friends</span>
          </div>
          <h1 className="font-display font-black text-6xl md:text-7xl mb-6">
            Earn <span className="text-accent">$100</span> Per Referral
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Know someone who needs stunning design work? Refer them and earn $100 when they become a client. It's that simple.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#form" className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all">
              Submit a Referral
            </a>
            <Link to="/portfolio" className="px-8 py-4 border-2 border-foreground text-foreground font-semibold rounded-xl hover:bg-foreground hover:text-primary-foreground transition-all">
              See My Work
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-black text-4xl md:text-5xl text-center mb-16">Why Refer?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-4xl md:text-5xl text-center mb-16">How It Works</h2>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Form Section */}
      <section id="form" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-4xl md:text-5xl mb-4">Ready to Refer?</h2>
            <p className="text-lg text-muted-foreground">Fill out the form below and I'll take it from there. It only takes a minute.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <ReferralForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-foreground text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-black text-4xl md:text-5xl mb-6">Track Your Referrals</h2>
          <p className="text-lg mb-8 text-white/80">Once you submit a referral, you can log into the admin dashboard to track the status and see when payments are made.</p>
          <Link
            to="/admin"
            className="inline-block px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
          >
            View Referral Dashboard
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}