import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, FileText, Receipt, FileSignature, LogIn, LayoutDashboard, Upload } from 'lucide-react';

import { useTheme } from '@/lib/ThemeContext';
import PortalMessages from './PortalMessages';
import PortalInvoices from './PortalInvoices';
import PortalProjectPlans from './PortalProjectPlans';
import PortalDashboard from './PortalDashboard';
import PortalFiles from './PortalFiles';
import PortalEstimates from './PortalEstimates';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'estimates', label: 'Estimates', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'plans', label: 'Project Plans', icon: FileSignature },
  { id: 'files', label: 'Files', icon: Upload },
];

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const { theme } = useTheme();
  // Header is always dark (bg-foreground), so use the inverted logic vs nav
  const logoSrc = 'https://media.base44.com/images/public/6a0deceee5167bf94f46086f/0fe3541a3_Untitleddesign.png';

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { base44.auth.redirectToLogin(window.location.href); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LogIn size={24} className="text-accent" />
          </div>
          <h1 className="font-display font-black text-3xl mb-2">Client Portal</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to access your invoices, messages, and project plans from DDalton Designs.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full px-6 py-3 bg-foreground text-primary-foreground font-semibold rounded-xl hover:bg-accent transition-all"
          >
            Sign In
          </button>
          <p className="text-xs text-muted-foreground mt-4">Don't have access? <a href="/contact" className="text-accent underline">Contact Derek</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-primary-foreground px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="DDalton Designs Logo" className="h-10 w-auto" />
            <div>
              <div className="font-display font-black text-xl">DD<span style={{ color: '#FF4D4D' }}>alton</span> Designs</div>
              <div className="text-xs text-white/50 mt-0.5">Client Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user.full_name}</div>
              <div className="text-xs text-white/50">{user.email}</div>
            </div>
            <button
              onClick={() => base44.auth.logout('/')}
              className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 flex pt-2 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap flex-1 sm:flex-none justify-center ${tab === id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon size={18} className="sm:w-4 sm:h-4" />
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {tab === 'dashboard' && <PortalDashboard user={user} onNavigate={setTab} />}
        {tab === 'estimates' && <PortalEstimates user={user} />}
        {tab === 'messages' && <PortalMessages user={user} />}
        {tab === 'invoices' && <PortalInvoices user={user} />}
        {tab === 'plans' && <PortalProjectPlans user={user} />}
        {tab === 'files' && <PortalFiles user={user} />}
      </div>
    </div>
  );
}