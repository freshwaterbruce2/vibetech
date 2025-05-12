
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Work With Us?</h2>
        <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
          Let's turn your vision into reality. Our team is ready to help you create exceptional digital experiences.
        </p>
        <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90 group">
          <Link to="/contact">
            Contact Us 
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default CtaSection;
