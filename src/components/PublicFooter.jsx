import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="font-display font-black text-2xl mb-3">
            DD<span style={{ color: '#FF4D4D' }}>alton</span> Designs
          </div>
          <p className="text-sm text-white/60 leading-relaxed max-w-xs">
            Bold, intentional design for businesses that want to stand out. Web design, logos, and marketing materials.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Navigation</div>
          <div className="flex flex-col gap-2">
            {[['/', 'Home'], ['/portfolio', 'Portfolio'], ['/services', 'Services'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
              <Link key={href} to={href} className="text-sm text-white/70 hover:text-white transition-colors">{label}</Link>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Get in Touch</div>
          <div className="text-sm text-white/70 mb-1">Derek Dalton</div>
          <a href="mailto:derek@ddaltondesigns.com" className="text-sm text-white/70 hover:text-white transition-colors block mb-4">
            derek@ddaltondesigns.com
          </a>
          <Link
            to="/contact"
            className="inline-block px-5 py-2 text-sm font-semibold rounded-full border-2 border-white/30 hover:bg-accent hover:border-accent transition-all duration-200"
          >
            Start a Project
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">
        <span>© {new Date().getFullYear()} DDalton Designs. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <span>Design & Photography by Derek Dalton</span>
          <Link to="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}