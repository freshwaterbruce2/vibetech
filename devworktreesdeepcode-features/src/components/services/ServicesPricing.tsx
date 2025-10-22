import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare, Calendar, TrendingUp } from "lucide-react";
import { pricingTiers, targetIndustries } from "./personalizedServicesData";

const ServicesPricing = () => {
  return (
    <div className="space-y-12 mt-16">
      {/* Pricing Tiers */}
      <div className="text-center mb-8">
        <Badge className="bg-aura-accent/10 text-aura-accent border-aura-accent/20 mb-4">
          Investment Levels
        </Badge>
        <h2 className="text-3xl font-bold mb-4">Project Investment Guide</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transparent pricing based on project complexity and business impact. 
          Every investment includes ongoing support and measurable ROI tracking.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {pricingTiers.map((tier, index) => (
          <Card 
            key={index} 
            className={`p-6 relative ${
              index === 1 
                ? 'border-aura-accent bg-gradient-to-b from-aura-accent/5 to-transparent' 
                : 'bg-card/80 backdrop-blur-sm'
            }`}
          >
            {index === 1 && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aura-accent text-white">
                Most Popular
              </Badge>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold text-aura-accent mb-2">{tier.price}</div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>
            
            <div className="space-y-3">
              {tier.includes.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-aura-accent mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Industries */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Industries I Serve</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Deep expertise in specific verticals where I've delivered successful projects
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {targetIndustries.map((industry, index) => (
          <Card key={index} className="p-6 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-aura-accent/20 transition-all">
            <h3 className="font-semibold mb-2 text-aura-accent">{industry.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{industry.description}</p>
            <div className="space-y-1">
              {industry.projects.map((project, projectIndex) => (
                <div key={projectIndex} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-aura-accent"></div>
                  <span className="text-xs text-muted-foreground">{project}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Process & CTA */}
      <Card className="p-8 bg-gradient-to-r from-aura-accent/10 to-transparent border-aura-accent/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Project?</h2>
            <p className="text-lg text-muted-foreground">
              Let's discuss your specific requirements and create a custom solution that drives real business results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2">1. Discovery Call</h3>
              <p className="text-sm text-muted-foreground">
                Free consultation to understand your business needs and technical requirements
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2">2. Proposal & Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Detailed project plan with milestones, deliverables, and investment breakdown
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-aura-accent/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-aura-accent" />
              </div>
              <h3 className="font-semibold mb-2">3. Build & Launch</h3>
              <p className="text-sm text-muted-foreground">
                Agile development with regular updates and testing in real business environments
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button className="bg-aura-accent hover:bg-aura-accent/90 text-white px-8 py-3 text-lg">
              Schedule Free Consultation
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              30-minute call to discuss your project • No commitment required
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServicesPricing;