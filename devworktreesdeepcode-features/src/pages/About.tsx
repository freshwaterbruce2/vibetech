
import AboutHeroSection from "@/components/about/AboutHeroSection";
import CoreValuesSection from "@/components/about/CoreValuesSection";
import TeamSection from "@/components/about/TeamSection";
import GamingSocialSection from "@/components/about/GamingSocialSection";
import CtaSection from "@/components/about/CtaSection";
import PageLayout from "@/components/layout/PageLayout";

const About = () => {
  return (
    <PageLayout 
      title="About" 
      description="Learn about Vibe Tech - our mission, vision, and the family behind our innovative digital solutions. Meet the Freshwater family and our talented members."
      keywords="Vibe Tech family, Bruce Freshwater, family business, software development, digital agency"
    >
      {/* Hero Section */}
      <AboutHeroSection />
      
      {/* Core Values */}
      <CoreValuesSection />
      
      {/* Family Section */}
      <TeamSection />
      
      {/* Blake's Section */}
      <GamingSocialSection />
      
      {/* CTA Section */}
      <CtaSection />
    </PageLayout>
  );
};

export default About;
