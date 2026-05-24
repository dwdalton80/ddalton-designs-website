import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Star, Quote } from 'lucide-react';

function TestimonialCard({ t, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-card border border-border rounded-3xl p-7 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <Quote size={28} className="text-accent/20 fill-accent/10 flex-shrink-0" />

      <div className="flex gap-1">
        {[...Array(t.rating || 5)].map((_, i) => (
          <Star key={i} size={14} className="fill-accent text-accent" />
        ))}
      </div>

      <p className="text-foreground font-display leading-relaxed text-base flex-1">
        "{t.quote}"
      </p>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        {t.avatar_url ? (
          <img
            src={t.avatar_url}
            alt={t.client_name}
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover border-2 border-border flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-display font-bold text-white text-base flex-shrink-0">
            {t.client_name[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold text-sm">{t.client_name}</div>
          {(t.client_title || t.client_company) && (
            <div className="text-xs text-muted-foreground">
              {[t.client_title, t.client_company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    base44.entities.Testimonial.filter({ featured: true }, 'order', 12)
      .then(setTestimonials)
      .catch(() => {});
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-secondary/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Kind Words</div>
          <h2 className="font-display font-black text-4xl md:text-5xl">What Clients Say</h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} t={t} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}