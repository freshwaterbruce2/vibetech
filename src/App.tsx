
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import PalettePreview from './pages/PalettePreview';
import FuturisticDemo from './pages/FuturisticDemo';
import BlogPostPage from './pages/public/BlogPostPage';
import Services from './pages/Services';
import Tools from './pages/Tools';
import About from './pages/About';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';

// ScrollToTop component to handle scrolling to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="dashboard-bg min-h-screen">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/category/:categoryName" element={<Blog />} />
          <Route path="/blog/tag/:tagName" element={<Blog />} />
          <Route path="/blog/:postId" element={<BlogPostPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/palette-preview" element={<PalettePreview />} />
          <Route path="/futuristic-demo" element={<FuturisticDemo />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
