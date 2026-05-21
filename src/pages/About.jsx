import { Link } from 'react-router-dom';
import { ArrowRight, Award, Clock, Star, Camera } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const stats = [
{ icon: Clock, value: '15+', label: 'Years Experience' },
{ icon: Star, value: '30+', label: 'Projects Completed' },
{ icon: Award, value: '3', label: 'Design Awards' },
{ icon: Camera, value: '5K+', label: 'Photos Taken' }];


export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">About Me</div>
              <h1 className="font-display font-black text-6xl md:text-7xl mb-6">Derek Dalton</h1>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                <p>
                  I'm a designer and photographer based out of passion — with over 15 years of experience helping businesses of all sizes build compelling visual identities.
                </p>
                <p>
                  DDalton Designs was built on the belief that great design isn't just about aesthetics — it's about strategy, storytelling, and results. Whether it's a website that converts, a logo that's instantly recognizable, or marketing materials that get noticed, I bring the same obsessive attention to detail to every project.
                </p>
                <p>
                  My background in photography also gives me a unique edge — I understand light, composition, and visual narrative in a way that elevates every design I touch.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 bg-foreground text-primary-foreground font-semibold rounded-full hover:bg-accent transition-all duration-200 text-sm">
                  Work With Me <ArrowRight size={16} />
                </Link>
                <Link to="/portfolio" className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-foreground font-semibold rounded-full hover:border-accent hover:text-accent transition-all duration-200 text-sm">
                  View Portfolio
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                <img src="https://media.base44.com/images/public/6a0deceee5167bf94f46086f/88f0a22e3_49345F4C-4170-410D-8153-D285540B7FB8.PNG"

                alt="Derek Dalton"
                className="w-full h-full object-cover" />
                
              </div>
              <div className="absolute -bottom-5 -right-5 bg-accent text-white p-5 rounded-xl text-center shadow-xl">
                <div className="font-display font-black text-3xl">15+</div>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Years</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
            {stats.map(({ icon: Icon, value, label }) =>
            <div key={label} className="text-center p-8 border border-border rounded-2xl">
                <Icon size={24} className="mx-auto mb-3 text-accent" />
                <div className="font-display font-black text-4xl mb-1">{value}</div>
                <div className="text-sm text-muted-foreground font-medium">{label}</div>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-[#111] text-white rounded-2xl p-10 md:p-16">
            <h2 className="font-display font-black text-4xl mb-10">Skills & Expertise</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
              { title: 'Web Design & Development', items: ['UI/UX Design', 'Responsive Layouts', 'WordPress', 'Custom Web Apps', 'Landing Pages'] },
              { title: 'Brand & Graphic Design', items: ['Logo Design', 'Brand Identity', 'Typography', 'Color Theory', 'Print Design'] },
              { title: 'Photography & Media', items: ['Product Photography', 'Portrait Photography', 'Photo Editing', 'Marketing Materials', 'Social Media Graphics'] }].
              map((group) =>
              <div key={group.title}>
                  <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.items.map((s) =>
                  <li key={s} className="text-white/60 text-sm flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                        {s}
                      </li>
                  )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>);

}