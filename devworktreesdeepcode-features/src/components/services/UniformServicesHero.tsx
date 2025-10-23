import React from "react";
import PageHeader from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Code, TrendingUp, Zap } from "lucide-react";
import AnimateOnScroll from "@/components/ui/animate-on-scroll";

const UniformServicesHero = () => {
  return (
    <section className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Standard PageHeader - matches other pages */}
        <PageHeader 
          title="Specialized Business Solutions" 
          subtitle="Revenue-driven technology solutions that solve real problems, generate measurable results, and provide exceptional business value."
          size="lg"
          glowColor="gradient"
        />
        
        {/* Value Proposition Cards - using consistent spacing */}
        <AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-8 mt-14">
            <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2 text-cyan-100 text-center">Real Business Impact</h3>
              <p className="text-sm text-gray-300 text-center">
                Every system I build is designed to generate revenue, reduce costs, or improve operational efficiency
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                <Code className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2 text-purple-100 text-center">Specialized Expertise</h3>
              <p className="text-sm text-gray-300 text-center">
                Advanced trading systems, enterprise PWAs, AI integration, and real-time data processing
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-teal-400" />
              </div>
              <h3 className="font-semibold mb-2 text-teal-100 text-center">Proven Results</h3>
              <p className="text-sm text-gray-300 text-center">
                Walmart operations optimization, automated trading systems, content monetization platforms
              </p>
            </Card>
          </div>
        </AnimateOnScroll>

        {/* Technologies & Approach - consistent with About page style */}
        <AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-14">
            <div>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4">
                Technical Excellence
              </Badge>
              <h3 className="text-2xl font-bold mb-4 text-gray-50">Enterprise-Grade Technologies</h3>
              <p className="text-lg mb-4 text-gray-50">
                React + TypeScript, Python + FastAPI, WebSocket v2, SQLite, Electron
              </p>
              <p className="text-gray-300">
                Windows 11 optimization, PowerShell integration, offline-first architecture for maximum reliability and performance.
              </p>
            </div>
            
            <div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4">
                Business Focus
              </Badge>
              <h3 className="text-2xl font-bold mb-4 text-gray-50">Business-First Development</h3>
              <p className="text-lg mb-4 text-gray-50">
                Every feature tied to business outcomes, revenue tracking, performance monitoring
              </p>
              <p className="text-gray-300">
                Real-world testing in production environments with measurable ROI focus and continuous optimization.
              </p>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Client Types - matching About page badge style */}
        <AnimateOnScroll>
          <div className="text-center mt-16">
            <h3 className="text-xl font-semibold mb-6 text-gray-50">Industries I Serve</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Trading Firms",
                "Enterprise Operations", 
                "Hospitality Platforms",
                "Content Publishers",
                "Property Management",
                "Financial Services"
              ].map((client) => (
                <Badge key={client} variant="outline" className="bg-background/50 hover:bg-aura-accent/20 transition-colors">
                  {client}
                </Badge>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default UniformServicesHero;