import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const AUTOPLAY_DELAY = 5000;

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    base44.entities.Testimonial.filter({ featured: true }, 'order', 6)
      .then(setTestimonials)
      .catch(() => {});
  }, []);

  const go = useCallback((nextIndex, dir) => {
    setDirection(dir);
    setIndex(nextIndex);
  }, []);

  const prev = useCallback(() => {
    if (!testimonials.length) return;
    go((index - 1 + testimonials.length) % testimonials.length, -1);
  }, [index, testimonials.length, go]);

  const next = useCallback(() => {
    if (!testimonials.length) return;
    go((index + 1) % testimonials.length, 1);
  }, [index, testimonials.length, go]);

  // Autoplay
  useEffect(() => {
    if (testimonials.length < 2) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex(i => (i + 1) % testimonials.length);
    }, AUTOPLAY_DELAY);
    return () => clearInterval(timerRef.current);
  }, [testimonials.length]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setIndex(i => (i + 1) % testimonials.length);
    }, AUTOPLAY_DELAY);
  };

  if (testimonials.length === 0) return null;

  const t = testimonials[index];

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -60 : 60, transition: { duration: 0.3, ease: 'easeIn' } }),
  };

  return (
    <section className="py-24 px-6 bg-secondary/40 overflow-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
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

        {/* Slider */}
        <div className="relative">
          <div className="min-h-[280px] flex items-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={t.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full bg-card rounded-3xl border border-border p-8 md:p-12 shadow-sm"
              >
                {/* Quote icon */}
                <Quote size={36} className="text-accent/20 mb-6 fill-accent/10" />

                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating || 5)].map((_, s) => (
                    <Star key={s} size={16} className="fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-foreground leading-relaxed text-lg md:text-xl font-display mb-8">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.client_name}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-display font-bold text-white text-lg flex-shrink-0">
                      {t.client_name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{t.client_name}</div>
                    {(t.client_title || t.client_company) && (
                      <div className="text-sm text-muted-foreground">
                        {[t.client_title, t.client_company].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / Next arrows */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={() => { prev(); resetTimer(); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 md:-translate-x-8 w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:border-accent hover:text-accent transition-all"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => { next(); resetTimer(); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 md:translate-x-8 w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:border-accent hover:text-accent transition-all"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Dot navigation */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { go(i, i > index ? 1 : -1); resetTimer(); }}
                className={`transition-all duration-300 rounded-full ${i === index ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-border hover:bg-muted-foreground'}`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}