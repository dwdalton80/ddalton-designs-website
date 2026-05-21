import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/lib/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Critical page — loaded eagerly
import Home from './pages/Home';

// Public pages — code split
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const Referrals = lazy(() => import('./pages/Referrals'));
const MyReferrals = lazy(() => import('./pages/MyReferrals'));
const ClientReferrals = lazy(() => import('./pages/ClientReferrals'));
const ReferralTracker = lazy(() => import('./pages/ReferralTracker'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// Admin layout + pages — code split
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClientRequests = lazy(() => import('./pages/admin/ClientRequests'));
const Clients = lazy(() => import('./pages/admin/Clients'));
const Estimates = lazy(() => import('./pages/admin/Estimates'));
const Invoices = lazy(() => import('./pages/admin/Invoices'));
const Tasks = lazy(() => import('./pages/admin/Tasks'));
const PortfolioManager = lazy(() => import('./pages/admin/PortfolioManager'));
const AdminPortalMessages = lazy(() => import('./pages/admin/PortalMessages'));
const ProjectPlans = lazy(() => import('./pages/admin/ProjectPlans'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));
const AdminReferrals = lazy(() => import('./pages/admin/Referrals'));
const ClientPortal = lazy(() => import('./pages/portal/ClientPortal'));

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

  const PageLoader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:id" element={<PortfolioDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/referrals" element={<Referrals />} />
      <Route path="/my-referrals" element={<ProtectedRoute><MyReferrals /></ProtectedRoute>} />
      <Route path="/client-referrals" element={<ClientReferrals />} />
      <Route path="/referral-tracker/:id" element={<ReferralTracker />} />
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
        <Route path="expenses" element={<Expenses />} />
        <Route path="referrals" element={<AdminReferrals />} />
      </Route>

      {/* Client Portal */}
      <Route path="/portal" element={<ClientPortal />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;