import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Calendar, TrendingUp } from "lucide-react";
import { pricingTiers, targetIndustries } from "./personalizedServicesData";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";

const UniformServicesPricing = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Pricing Tiers */}
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <Badge className="bg-aura-accent/10 text-aura-accent border-aura-accent/20 mb-4">
              Investment Levels
            </Badge>
            <h2 className="text-3xl font-bold mb-4 text-gray-50">Project Investment Guide</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Transparent pricing based on project complexity and business impact. 
              Every investment includes ongoing support and measurable ROI tracking.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`p-6 relative hover:shadow-lg transition-all duration-300 ${
                  index === 1 
                    ? 'border-aura-accent bg-gradient-to-b from-aura-accent/5 to-transparent hover:shadow-aura-accent/20' 
                    : 'bg-card/80 backdrop-blur-sm hover:shadow-aura-accent/10'
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aura-accent text-white">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-50">{tier.name}</h3>
                  <div className="text-3xl font-bold text-aura-accent mb-2">{tier.price}</div>
                  <p className="text-sm text-gray-300">{tier.description}</p>
                </div>
                
                <div className="space-y-3">
                  {tier.includes.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-aura-accent mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Industries */}
        <AnimateOnScroll>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-50">Industries I Serve</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Deep expertise in specific verticals where I've delivered successful projects
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {targetIndustries.map((industry, index) => (
              <Card key={index} className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-aura-accent/20 transition-all h-full">
                <h3 className="font-semibold mb-2 text-aura-accent">{industry.name}</h3>
                <p className="text-sm text-gray-300 mb-4">{industry.description}</p>
                <div className="space-y-1">
                  {industry.projects.map((project, projectIndex) => (
                    <div key={projectIndex} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-aura-accent"></div>
                      <span className="text-xs text-gray-400">{project}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Process Steps */}
        <AnimateOnScroll>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-50">Development Process</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              A proven methodology that ensures project success and exceptional results
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">1. Discovery Call</h3>
              <p className="text-sm text-gray-300">
                Free consultation to understand your business needs and technical requirements
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">2. Proposal & Timeline</h3>
              <p className="text-sm text-gray-300">
                Detailed project plan with milestones, deliverables, and investment breakdown
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-50">3. Build & Launch</h3>
              <p className="text-sm text-gray-300">
                Agile development with regular updates and testing in real business environments
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default UniformServicesPricing;