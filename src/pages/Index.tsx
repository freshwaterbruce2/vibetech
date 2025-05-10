
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  useEffect(() => {
    document.title = "Aura | Home";
  }, []);

  return (
    <div className="min-h-screen bg-aura-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-aura-accent to-blue-500 bg-clip-text text-transparent">
          Welcome to Aura
        </h1>
        <p className="text-xl text-aura-textSecondary max-w-2xl mb-8">
          Explore our creative digital solutions designed to transform your ideas into reality.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
            <Link to="/portfolio">View Our Work</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/contact">Get In Touch</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-aura-background/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Web Development",
                description: "Modern, responsive websites built with the latest technologies."
              },
              {
                title: "UI/UX Design",
                description: "Intuitive interfaces and seamless user experiences."
              },
              {
                title: "Digital Marketing",
                description: "Strategic campaigns to boost your online presence."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-aura-textSecondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-aura-accent/10 to-blue-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
          <p className="text-aura-textSecondary mb-8">
            Let's collaborate to bring your vision to life with our expertise and creativity.
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
            <Link to="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
