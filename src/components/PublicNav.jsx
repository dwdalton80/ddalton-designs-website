import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/lib/ThemeContext';

export default function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const logoSrc = theme === 'dark'
    ? 'https://media.base44.com/images/public/6a0deceee5167bf94f46086f/bb38fba8e_D.png'
    : 'https://media.base44.com/images/public/6a0deceee5167bf94f46086f/a412249e5_D.png';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/referrals', label: 'Refer & Earn' },
    { href: '/my-referrals', label: 'My Referrals' },
    { href: '/portal', label: 'Client Portal' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm border-b border-border' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSrc} alt="DDalton Designs Logo" className="h-10 w-auto" />
          <span className="font-display font-black text-xl tracking-tight text-foreground">
            DD<span style={{ color: '#FF4D4D' }}>alton</span> Designs
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.href}
              to={l.href}
              className={`text-sm font-medium tracking-wide transition-colors hover:text-accent ${location.pathname === l.href ? 'text-accent' : 'text-foreground/70'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="ml-2 px-5 py-2 text-sm font-semibold rounded-full border-2 border-foreground bg-foreground text-primary-foreground hover:bg-accent hover:border-accent transition-all duration-200"
          >
            Get a Quote
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-b border-border px-6 py-6 flex flex-col gap-5">
          {links.map(l => (
            <Link key={l.href} to={l.href} className="text-base font-medium" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="inline-block px-5 py-2.5 text-sm font-semibold rounded-full bg-foreground text-primary-foreground w-fit"
            onClick={() => setMenuOpen(false)}
          >
            Get a Quote
          </Link>
        </div>
      )}
    </nav>
  );
}