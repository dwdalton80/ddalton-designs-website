import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';

// Critical page — loaded eagerly
import Home from './pages/Home';

// Public pages — code split
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const Referrals = lazy(() => import('./pages/Referrals'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const WriteReview = lazy(() => import('./pages/WriteReview'));

// Admin layout + pages — code split.
// These are gated by Cloudflare Access at the edge, not in the app: an
// unauthenticated visitor is stopped by Access's login page and never loads
// this bundle. There is deliberately no ProtectedRoute wrapper any more —
// client-side gating was only ever UX, and the real boundary now sits in front
// of the origin.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ClientRequests = lazy(() => import('./pages/admin/ClientRequests'));
const Clients = lazy(() => import('./pages/admin/Clients'));
const Estimates = lazy(() => import('./pages/admin/Estimates'));
const Invoices = lazy(() => import('./pages/admin/Invoices'));
const Tasks = lazy(() => import('./pages/admin/Tasks'));
const PortfolioManager = lazy(() => import('./pages/admin/PortfolioManager'));
const ProjectPlans = lazy(() => import('./pages/admin/ProjectPlans'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));
const AdminReferrals = lazy(() => import('./pages/admin/Referrals'));
const AdminTestimonials = lazy(() => import('./pages/admin/Testimonials'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
  </div>
);

/**
 * The Meta Pixel's snippet fires one PageView at load. This is a SPA, so every
 * click after that is a history push the pixel never hears about — without
 * this, only the first page of a visit is ever counted. The init in
 * index.html already covers that first view, so the first run here is skipped
 * rather than double-counted.
 */
function PixelPageViews() {
  const { pathname, search } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView');
  }, [pathname, search]);

  return null;
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <PixelPageViews />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/portfolio/:id" element={<PortfolioDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/referrals" element={<Referrals />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      {/* Reached only from an emailed one-time link. */}
      <Route path="/review/:token" element={<WriteReview />} />

      {/* Admin — behind Cloudflare Access */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<ClientRequests />} />
        <Route path="clients" element={<Clients />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="portfolio" element={<PortfolioManager />} />
        <Route path="plans" element={<ProjectPlans />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="referrals" element={<AdminReferrals />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="testimonials" element={<AdminTestimonials />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </Suspense>
);

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
