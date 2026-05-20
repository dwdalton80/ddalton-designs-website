import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Globe, Palette, Megaphone, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const services = [
  { icon: Globe, title: 'Web Design', desc: 'Custom websites built to convert visitors into clients. Fast, beautiful, and uniquely yours.' },
  { icon: Palette, title: 'Logo Design', desc: 'Memorable brand marks that capture your identity and set you apart from the competition.' },
  { icon: Megaphone, title: 'Marketing Materials', desc: 'From flyers to full campaigns — cohesive design that tells your story across every touchpoint.' },
  { icon: Camera, title: 'Photography', desc: 'Over 15 years behind the lens. Professional photography that elevates your brand imagery.' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    base44.entities.PortfolioItem.filter({ featured: true }, '-created_date', 6)
      .then(setFeatured)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 border border-border rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Web Design · Logos · Marketing
              </div>
              <h1 className="font-display font-black text-6xl md:text-7xl lg:text-8xl leading-none tracking-tight mb-6">
                Design That
                <br />
                <span style={{ color: '#FF4D4D' }}>Demands</span>
                <br />
                Attention
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-10">
                I'm Derek Dalton — a designer and photographer with 15+ years of experience crafting bold identities, stunning websites, and marketing that moves people.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-foreground text-primary-foreground font-semibold rounded-full hover:bg-accent transition-all duration-200 text-sm"
                >
                  View My Work <ArrowRight size={16} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-foreground font-semibold rounded-full hover:border-accent hover:text-accent transition-all duration-200 text-sm"
                >
                  Start a Project
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden" style={{ background: '#111' }}>
                <img
                  src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=90"
                  alt="Design work"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-accent text-white px-6 py-4 rounded-xl font-display font-bold text-3xl shadow-xl">
                15+<br /><span className="text-sm font-body font-normal opacity-80">Years Exp.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-foreground text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">What I Do</div>
              <h2 className="font-display font-black text-4xl md:text-5xl">Services</h2>
            </div>
            <Link to="/services" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              All Services <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group border border-white/10 rounded-2xl p-6 hover:border-accent transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-accent transition-all duration-300">
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work */}
      {featured.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Selected Work</div>
                <h2 className="font-display font-black text-4xl md:text-5xl">Featured Projects</h2>
              </div>
              <Link to="/portfolio" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                View All <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((item) => (
                <Link key={item.id} to={`/portfolio/${item.id}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                  {item.images?.[0] && (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">{item.category}</div>
                      <div className="font-display font-bold text-white text-xl">{item.title}</div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight size={14} className="text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Band */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-black text-5xl md:text-6xl mb-6">
            Ready to Build Something <span style={{ color: '#FF4D4D' }}>Bold?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Let's talk about your project. Whether you need a new website, a logo, or a full brand refresh — I'm ready to help.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-full text-lg hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get a Free Quote <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}