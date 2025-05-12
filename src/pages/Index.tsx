
import { useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import PortfolioSection from "@/components/home/PortfolioSection";
import BlogSection from "@/components/home/BlogSection";
import CtaSection from "@/components/home/CtaSection";

const Index = () => {
  useEffect(() => {
    document.title = "Vibe Tech | Home";
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Services Section */}
      <ServicesSection />
      
      {/* Portfolio Highlights */}
      <PortfolioSection />
      
      {/* Latest Blog Posts */}
      <BlogSection />
      
      {/* CTA Section */}
      <CtaSection />
    </PageLayout>
  );
};

export default Index;
