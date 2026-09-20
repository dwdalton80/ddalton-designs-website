import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.replace(/^\//, '');

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Page Not Found | DDalton Designs';

    // A 404 should never be indexed; the tag is removed again on unmount so it
    // can't leak onto a real page during client-side navigation.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);

    return () => {
      document.title = prevTitle;
      robots.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <section className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="font-display font-black text-8xl md:text-9xl text-accent leading-none mb-4">
            404
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl mb-5">
            This Page Got Away
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {pageName
              ? <>I couldn't find <span className="text-foreground font-medium">/{pageName}</span>. It may have moved or never existed.</>
              : <>That page may have moved or never existed.</>}
            {' '}Let's get you somewhere useful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-[#CC3F00] transition-all"
            >
              Go Home <ArrowRight size={16} />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-foreground font-semibold rounded-xl hover:border-accent hover:text-accent transition-all"
            >
              View My Work
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-10">
            Looking for something specific?{' '}
            <Link to="/contact" className="text-accent hover:underline">Get in touch</Link>.
          </p>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
