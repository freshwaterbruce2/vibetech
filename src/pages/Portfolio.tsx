
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ProjectFilters from "@/components/portfolio/ProjectFilters";
import ProjectGrid from "@/components/portfolio/ProjectGrid";
import ServicesSection from "@/components/portfolio/ServicesSection";
import CtaSection from "@/components/portfolio/CtaSection";
import PortfolioHeroSection from "@/components/portfolio/PortfolioHeroSection";
import { projects } from "@/components/portfolio/projectsData";
import { Project } from "@/components/portfolio/types";

const Portfolio = () => {
  useEffect(() => {
    document.title = "Portfolio | Vibe Tech";
  }, []);

  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", ...new Set(projects.map(project => project.category.toLowerCase()))];
  
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(project => project.category.toLowerCase() === filter);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      
      {/* Hero Section */}
      <PortfolioHeroSection />

      {/* Filter Controls */}
      <ProjectFilters 
        categories={categories}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {/* Projects Grid */}
      <ProjectGrid projects={filteredProjects} />

      {/* Services Section */}
      <ServicesSection />

      {/* CTA Section */}
      <CtaSection />
      
      <Footer />
    </div>
  );
};

export default Portfolio;
