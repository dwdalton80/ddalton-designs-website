import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function PortfolioDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.PortfolioItem.filter({ id })
      .then(data => { setItem(data[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-xl text-muted-foreground">Project not found.</p>
        <Link to="/portfolio" className="text-accent hover:underline">← Back to Portfolio</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft size={16} /> Back to Portfolio
          </Link>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-accent mb-2 capitalize">{item.category}</div>
              <h1 className="font-display font-black text-5xl md:text-6xl">{item.title}</h1>
              {item.client_name && <p className="text-muted-foreground mt-2">Client: {item.client_name}</p>}
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-foreground rounded-full text-sm font-semibold hover:border-accent hover:text-accent transition-all flex-shrink-0">
                View Live <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Images */}
          {item.images?.length > 0 && (
            <div className="space-y-4 mb-12">
              {item.images.map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
                  <img
                    src={img}
                    alt={`${item.title} ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="max-w-2xl">
              <h2 className="font-display font-bold text-2xl mb-4">About This Project</h2>
              <div
                className="ql-description text-muted-foreground leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </div>
          )}

          <div className="mt-16 p-8 bg-[#111] text-white rounded-2xl text-center">
            <h3 className="font-display font-bold text-3xl mb-3">Love What You See?</h3>
            <p className="text-white/60 mb-6">Let's create something bold for your brand.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-3 bg-accent text-white rounded-full font-semibold text-sm hover:bg-red-600 transition-all">
              Request Similar Work
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}