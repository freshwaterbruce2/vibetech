
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProjectFilters from "@/components/portfolio/ProjectFilters";
import ProjectGrid from "@/components/portfolio/ProjectGrid";
import ServicesSection from "@/components/portfolio/ServicesSection";
import CtaSection from "@/components/portfolio/CtaSection";
import PortfolioHeroSection from "@/components/portfolio/PortfolioHeroSection";
import { projects } from "@/components/portfolio/projectsData";

const Portfolio = () => {
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", ...new Set(projects.map(project => project.category.toLowerCase()))];
  
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(project => project.category.toLowerCase() === filter);

  return (
    <PageLayout title="Portfolio" particleOpacity={0.15} particleCount={20}>
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
    </PageLayout>
  );
};

export default Portfolio;
