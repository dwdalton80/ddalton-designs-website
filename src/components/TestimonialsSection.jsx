import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    base44.entities.Testimonial.filter({ featured: true }, 'order', 6)
      .then(setTestimonials)
      .catch(() => {});
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-secondary/40">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Kind Words</div>
          <h2 className="font-display font-black text-4xl md:text-5xl">What Clients Say</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-4"
            >
              <div className="flex gap-0.5">
                {[...Array(t.rating || 5)].map((_, s) => (
                  <Star key={s} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                {t.avatar_url ? (
                  <img
                    src={t.avatar_url}
                    alt={t.client_name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-display font-bold text-accent flex-shrink-0">
                    {t.client_name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm">{t.client_name}</div>
                  {(t.client_title || t.client_company) && (
                    <div className="text-xs text-muted-foreground">
                      {[t.client_title, t.client_company].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}