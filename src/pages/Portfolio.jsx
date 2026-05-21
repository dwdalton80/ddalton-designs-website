import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const FILTERS = ['all', 'website', 'logo', 'marketing'];

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PortfolioItem.list('order', 50)
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">My Work</div>
            <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl mb-6">Portfolio</h1>
            <div className="flex flex-wrap gap-2 mt-6 md:mt-8">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 md:py-2 rounded-full text-sm font-semibold capitalize transition-all duration-200 min-h-[44px] md:min-h-0 ${filter === f ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}
                >
                  {f === 'all' ? 'All Work' : f}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <p className="text-lg">No portfolio items yet.</p>
              <p className="text-sm mt-2">Check back soon for new work!</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35 }}
                  >
                    <Link
                      to={`/portfolio/${item.id}`}
                      className={`group relative rounded-2xl overflow-hidden bg-muted block ${i === 0 ? 'md:col-span-2 aspect-[16/7]' : 'aspect-[4/3]'}`}
                    >
                      {(item.cover_image || item.images?.[0]) ? (
                        <img
                          src={item.cover_image || item.images[0]}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="font-display font-bold text-2xl text-muted-foreground">{item.title[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 md:p-6">
                        <div className="flex items-end justify-between w-full">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1 capitalize">{item.category}</div>
                            <div className="font-display font-bold text-white text-lg md:text-2xl leading-tight">{item.title}</div>
                            {item.client_name && <div className="text-sm text-white/60 mt-0.5">{item.client_name}</div>}
                          </div>
                          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 ml-4">
                            <ArrowUpRight size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}