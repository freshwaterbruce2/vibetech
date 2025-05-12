import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Portfolio from "@/pages/Portfolio";
import Blog from "@/pages/Blog";
import BlogPostPage from "@/pages/BlogPostPage";
import Contact from "@/pages/Contact";
import Pricing from "@/pages/Pricing";
import Tools from "@/pages/Tools";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/context/ThemeProvider";
import PalettePreview from "@/pages/PalettePreview";

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:postId" element={<BlogPostPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/palette-preview" element={<PalettePreview />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
