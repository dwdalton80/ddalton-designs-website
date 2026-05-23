import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Inbox, FileText, Receipt, CheckSquare, Image, Users, Menu, X, ChevronRight, MessageSquare, FileSignature, LogOut, TrendingDown, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Client Requests', icon: Inbox },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/tasks', label: 'Productivity', icon: CheckSquare },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Image },
  { href: '/admin/messages', label: 'Portal Messages', icon: MessageSquare },
  { href: '/admin/plans', label: 'Project Plans', icon: FileSignature },
  { href: '/admin/referrals', label: 'Referrals', icon: Gift },
  { href: '/admin/expenses', label: 'Expenses', icon: TrendingDown },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user && user.role === 'admin') {
        setIsAdmin(true);
      } else {
        base44.auth.redirectToLogin(window.location.href);
      }
      setAuthChecked(true);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="font-display font-black text-xl">
            DD<span style={{ color: '#FF4F00' }}>alton</span> Designs
          </Link>
          <div className="text-xs text-white/40 mt-0.5 font-body">Admin Panel</div>
        </div>
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-accent text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-white/10 flex flex-col gap-2">
          <Link to="/" className="text-xs text-white/40 hover:text-white/60 transition-colors">← View Public Site</Link>
          <button
            onClick={() => base44.auth.logout(window.location.origin)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-4 border-b border-border bg-background">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="font-display font-bold text-lg">DD<span style={{ color: '#FF4F00' }}>alton</span></span>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}