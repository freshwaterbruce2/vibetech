import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

const UniformServicesCtaSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4 font-heading text-fuchsia-500">
          Ready to Transform Your Business?
        </h2>
        <p className="mb-8 text-lg max-w-2xl mx-auto text-white">
          Let's discuss how specialized technology solutions can drive real results for your business. 
          Schedule a free consultation to explore the possibilities.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90 group">
            <Link to="/contact">
              Schedule Free Consultation
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="border-gray-300 text-white hover:bg-white/10">
            <Link to="/portfolio">
              View My Work
              <MessageCircle className="ml-2" />
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-gray-400 mt-6">
          30-minute consultation • No commitment required • Discuss your specific needs
        </p>
      </div>
    </section>
  );
};

export default UniformServicesCtaSection;