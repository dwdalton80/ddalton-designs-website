import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Inbox, FileText, Receipt, CheckSquare, Image, Users, Menu, X, ChevronRight } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Client Requests', icon: Inbox },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/tasks', label: 'Productivity', icon: CheckSquare },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Image },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-foreground text-primary-foreground flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        <div className="px-6 py-6 border-b border-white/10">
          <Link to="/" className="font-display font-black text-xl">
            DD<span style={{ color: '#FF4D4D' }}>alton</span>
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
        <div className="px-6 py-4 border-t border-white/10">
          <Link to="/" className="text-xs text-white/40 hover:text-white/60 transition-colors">← View Public Site</Link>
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
          <span className="font-display font-bold text-lg">DD<span style={{ color: '#FF4D4D' }}>alton</span></span>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}