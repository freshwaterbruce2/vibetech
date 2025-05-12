
import PageHeader from "@/components/ui/page-header";

const PortfolioHeroSection = () => {
  return (
    <section className="pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Our Portfolio"
          subtitle="Explore our collection of projects spanning web development, mobile applications, and custom software solutions."
        />
      </div>
    </section>
  );
};

export default PortfolioHeroSection;
