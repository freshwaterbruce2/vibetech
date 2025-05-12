import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import PalettePreview from './pages/PalettePreview';
import FuturisticDemo from './pages/FuturisticDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/post-1" element={<BlogPost />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<Dashboard />} />
		<Route path="/palette-preview" element={<PalettePreview />} />
        <Route path="/futuristic-demo" element={<FuturisticDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
