import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { AdminProvider } from '@/contexts/AdminContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Eager load critical paths
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import TradingTest from './pages/TradingTest';

// Lazy load other routes
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./components/dashboard/Dashboard'));
const CryptoTradingDashboard = lazy(() => import('./components/crypto/CryptoTradingDashboard'));
const PalettePreview = lazy(() => import('./pages/PalettePreview'));
const FuturisticDemo = lazy(() => import('./pages/FuturisticDemo'));
const BlogPostPage = lazy(() => import('./pages/public/BlogPostPage'));
const BlogEditor = lazy(() => import('./pages/BlogEditor'));
const Services = lazy(() => import('./pages/Services'));
const Tools = lazy(() => import('./pages/Tools'));
const Resources = lazy(() => import('./pages/Resources'));
const About = lazy(() => import('./pages/About'));

// Loading component for suspense fallback with enhanced error handling
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-16 w-16 rounded-full border-4 border-t-[color:var(--c-purple)] border-r-transparent border-b-[color:var(--c-cyan)] border-l-transparent animate-spin"></div>
      <p className="text-aura-accent">Loading...</p>
    </div>
  </div>
);

// ScrollToTop component to handle scrolling to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Enhanced analytics tracker with proper error handling
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  
  useEffect(() => {
    try {
      // Track initial page load time
      if (window.performance) {
        const pageLoadTime = Math.round(performance.now());
        
        trackEvent('page_performance', {
          category: 'Performance',
          label: location.pathname,
          value: pageLoadTime,
          customDimensions: {
            page_path: location.pathname,
            load_time_ms: pageLoadTime
          }
        });
      }
      
      // Track user session data
      const sessionId = localStorage.getItem('session_id') || 
        `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', sessionId);
        
        // Track new session
        trackEvent('session_start', {
          category: 'User Sessions',
          customDimensions: {
            session_id: sessionId,
            is_new_session: true
          }
        });
      }
      
      // Set the session ID as a user property using the correct syntax
      if (typeof window.gtag !== 'undefined') {
        window.gtag('set', 'user_properties', {
          'session_id': sessionId
        });
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Fail silently to not break the app
    }
  }, [trackEvent, location.pathname]);
  
  return null;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <Router>
          <ScrollToTop />
          <AnalyticsTracker />
          <div className="dashboard-bg min-h-screen">
            <ErrorBoundary fallback={
              <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Navigation Error
                  </h2>
                  <p className="text-aura-textMuted mb-6">
                    There was an issue loading the page content.
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="rounded-lg bg-aura-accent px-4 py-2 text-white transition-colors hover:bg-aura-accentSecondary"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            }>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/portfolio/:projectId" element={<ProjectDetail />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/category/:categoryName" element={<Blog />} />
                  <Route path="/blog/tag/:tagName" element={<Blog />} />
                  <Route path="/blog/editor" element={<BlogEditor />} />
                  <Route path="/blog/:postId" element={<BlogPostPage />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/palette-preview" element={<PalettePreview />} />
                  <Route path="/futuristic-demo" element={<FuturisticDemo />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/trading-test" element={<TradingTest />} />
                  <Route path="/trading" element={<CryptoTradingDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <Toaster />
          </div>
        </Router>
      </AdminProvider>
    </ErrorBoundary>
  );
}

export default App;