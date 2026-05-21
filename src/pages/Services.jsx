import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Palette, Megaphone, Camera, Check } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const services = [
  {
    icon: Globe,
    title: 'Web Design',
    desc: 'A website that works as hard as you do. I design and build custom websites that look stunning, load fast, and are built to convert visitors into clients.',
    features: ['Custom design (no templates)', 'Mobile-responsive', 'SEO-ready structure', 'Contact forms & CTAs', 'Portfolio/gallery pages', 'Ongoing support available'],
    price: 'Starting at $1,200',
  },
  {
    icon: Palette,
    title: 'Logo & Brand Identity',
    desc: 'Your logo is the face of your business. I create timeless, versatile marks that capture your brand\'s personality and look great at every size.',
    features: ['3 initial concepts', 'Unlimited revisions', 'Full brand guidelines', 'All file formats (SVG, PNG, PDF)', 'Color palette + typography', 'Social media kit'],
    price: 'Starting at $499',
  },
  {
    icon: Megaphone,
    title: 'Marketing Materials',
    desc: 'From business cards to full campaign assets — I create cohesive, professional print and digital marketing materials that make your brand unforgettable.',
    features: ['Business cards & stationery', 'Flyers & brochures', 'Social media graphics', 'Email templates', 'Banners & signage', 'Consistent with your brand'],
    price: 'Starting at $299',
  },
  {
    icon: Camera,
    title: 'Photography',
    desc: '15+ years of photography experience. I shoot products, portraits, and brand imagery that elevates the visual quality of everything you put out.',
    features: ['Product photography', 'Portrait sessions', 'Professional editing', 'High-res delivery', 'Usage rights included', 'Quick turnaround'],
    price: 'Starting at $350',
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What I Offer</div>
            <h1 className="font-display font-black text-6xl md:text-7xl mb-4">Services</h1>
            <p className="text-lg text-muted-foreground max-w-xl">Bold design solutions for businesses ready to make a statement. Every project is custom — no templates, no shortcuts.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map(({ icon: Icon, title, desc, features, price }) => (
              <div key={title} className="border border-border rounded-2xl p-8 hover:border-accent transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent transition-all duration-300">
                    <Icon size={22} className="group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-accent">{price}</span>
                </div>
                <h3 className="font-display font-bold text-2xl mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{desc}</p>
                <ul className="space-y-2 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent transition-colors"
                >
                  Get a Quote <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center p-12 bg-[#111] text-white rounded-2xl">
            <h2 className="font-display font-black text-4xl mb-4">Need Something Custom?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">Every project is different. Let's talk about what you need and I'll put together a tailored proposal.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-red-600 transition-all"
            >
              Contact Me <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}