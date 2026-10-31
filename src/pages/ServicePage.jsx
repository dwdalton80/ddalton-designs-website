import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Seo from '@/components/Seo';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { ROUTE_META } from '@/lib/seo-meta';
import { SERVICE_PAGES } from '@/lib/service-pages';

export default function ServicePage({ path }) {
  const meta = ROUTE_META[path];
  const page = SERVICE_PAGES[path];
  const others = Object.keys(SERVICE_PAGES).filter(p => p !== path);

  return (
    <div className="min-h-screen bg-background">
      <Seo title={meta.title} description={meta.description} path={path} />
      <PublicNav />
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← All services</Link>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-8 mb-3">{page.eyebrow}</div>
          <h1 className="font-display font-black text-5xl md:text-6xl mb-6">{meta.h1}</h1>
          {page.intro.map(p => (
            <p key={p} className="text-lg text-muted-foreground leading-relaxed mb-4">{p}</p>
          ))}
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 mt-4 px-7 py-3.5 bg-foreground text-primary-foreground font-semibold rounded-full hover:bg-accent transition-all duration-200 text-sm"
          >
            Get a Free Quote <ArrowRight size={16} />
          </Link>

          <h2 className="font-display font-bold text-3xl mt-16 mb-5">What's included</h2>
          <ul className="space-y-3">
            {page.included.map(f => (
              <li key={f} className="flex items-start gap-3">
                <Check size={16} className="text-accent mt-1 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {page.steps ? (
            <>
              <h2 className="font-display font-bold text-3xl mt-16 mb-5">How it works</h2>
              <ol className="space-y-4 list-decimal pl-5">
                {page.steps.map(([name, text]) => (
                  <li key={name}><strong>{name}.</strong> {text}</li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <h2 className="font-display font-bold text-3xl mt-16 mb-5">Timeline</h2>
              <p className="text-muted-foreground">{page.timeline}</p>
            </>
          )}

          <h2 className="font-display font-bold text-3xl mt-16 mb-5">Pricing</h2>
          <p className="text-muted-foreground">{page.pricing}</p>

          <h2 className="font-display font-bold text-3xl mt-16 mb-5">Recent work</h2>
          <ul className="space-y-4">
            {page.work.map(([name, slug, text]) => (
              <li key={slug}>
                <Link to={`/portfolio/${slug}`} className="font-semibold hover:text-accent transition-colors">{name}</Link>
                <span className="text-muted-foreground"> — {text}</span>
              </li>
            ))}
          </ul>
          <Link to="/portfolio" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold hover:text-accent transition-colors">
            See the full portfolio <ArrowRight size={14} />
          </Link>

          {page.faq && (
            <>
              <h2 className="font-display font-bold text-3xl mt-16 mb-5">Questions</h2>
              <dl className="space-y-5">
                {page.faq.map(([q, a]) => (
                  <div key={q}>
                    <dt className="font-semibold">{q}</dt>
                    <dd className="text-muted-foreground mt-1">{a}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <div className="mt-20 text-center p-10 bg-[#111] text-white rounded-2xl">
            <h2 className="font-display font-black text-3xl mb-4">{page.cta}</h2>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-red-600 transition-all"
            >
              Get a Free Quote <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-12 text-sm text-muted-foreground">
            Also see:{' '}
            {others.map((p, i) => (
              <span key={p}>
                {i > 0 && ' · '}
                <Link to={p} className="hover:text-foreground underline underline-offset-4">{SERVICE_PAGES[p].eyebrow}</Link>
              </span>
            ))}
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
