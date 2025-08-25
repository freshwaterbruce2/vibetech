
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';

// Eager load critical paths
import Index from './pages/Index';
import NotFound from './pages/NotFound';

// Lazy load other routes
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PalettePreview = lazy(() => import('./pages/PalettePreview'));
const FuturisticDemo = lazy(() => import('./pages/FuturisticDemo'));
const BlogPostPage = lazy(() => import('./pages/public/BlogPostPage'));
const BlogEditor = lazy(() => import('./pages/BlogEditor'));
const Services = lazy(() => import('./pages/Services'));
const Tools = lazy(() => import('./pages/Tools'));
const Resources = lazy(() => import('./pages/Resources'));
const About = lazy(() => import('./pages/About'));

// Loading component for suspense fallback
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

// Enhanced analytics tracker to track page navigation and performance metrics
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  
  useEffect(() => {
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
  }, [trackEvent, location.pathname]);
  
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AnalyticsTracker />
      <div className="dashboard-bg min-h-screen">
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
            <Route path="/palette-preview" element={<PalettePreview />} />
            <Route path="/futuristic-demo" element={<FuturisticDemo />} />
            <Route path="/services" element={<Services />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
