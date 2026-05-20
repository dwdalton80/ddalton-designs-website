import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Public pages
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import PortfolioDetail from './pages/PortfolioDetail';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Admin layout + pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientRequests from './pages/admin/ClientRequests';
import Clients from './pages/admin/Clients';
import Estimates from './pages/admin/Estimates';
import Invoices from './pages/admin/Invoices';
import Tasks from './pages/admin/Tasks';
import PortfolioManager from './pages/admin/PortfolioManager';
import AdminPortalMessages from './pages/admin/PortalMessages';
import ProjectPlans from './pages/admin/ProjectPlans';
import ClientPortal from './pages/portal/ClientPortal';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:id" element={<PortfolioDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<ClientRequests />} />
        <Route path="clients" element={<Clients />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="portfolio" element={<PortfolioManager />} />
        <Route path="messages" element={<AdminPortalMessages />} />
        <Route path="plans" element={<ProjectPlans />} />
      </Route>

      {/* Client Portal */}
      <Route path="/portal" element={<ClientPortal />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;