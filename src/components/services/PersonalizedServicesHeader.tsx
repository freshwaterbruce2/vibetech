import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Code, TrendingUp, Zap } from "lucide-react";

const PersonalizedServicesHeader = () => {
  return (
    <div className="text-center max-w-5xl mx-auto mb-16">
      {/* Main Header */}
      <div className="mb-8">
        <Badge className="bg-aura-accent/10 text-aura-accent border-aura-accent/20 mb-4">
          Specialized Business Solutions
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Revenue-Driven Technology Solutions
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          I don't build generic websites. I create specialized business applications that solve real problems, 
          generate revenue, and provide measurable operational improvements.
        </p>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="font-semibold mb-2 text-cyan-100">Real Business Impact</h3>
          <p className="text-sm text-muted-foreground">
            Every system I build is designed to generate revenue, reduce costs, or improve operational efficiency
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center justify-center mb-4">
            <Code className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="font-semibold mb-2 text-purple-100">Specialized Expertise</h3>
          <p className="text-sm text-muted-foreground">
            Advanced trading systems, enterprise PWAs, AI integration, and real-time data processing
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-teal-400" />
          </div>
          <h3 className="font-semibold mb-2 text-teal-100">Proven Results</h3>
          <p className="text-sm text-muted-foreground">
            Walmart operations optimization, automated trading systems, content monetization platforms
          </p>
        </Card>
      </div>

      {/* Technologies & Approach */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50 mb-8">
        <h3 className="text-lg font-semibold mb-4">My Technical Approach</h3>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div>
            <h4 className="font-medium text-cyan-400 mb-2">Enterprise-Grade Technologies</h4>
            <p className="text-sm text-muted-foreground mb-2">
              React + TypeScript, Python + FastAPI, WebSocket v2, SQLite, Electron
            </p>
            <p className="text-xs text-muted-foreground">
              Windows 11 optimization, PowerShell integration, offline-first architecture
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-400 mb-2">Business-First Development</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Every feature tied to business outcomes, revenue tracking, performance monitoring
            </p>
            <p className="text-xs text-muted-foreground">
              Real-world testing in production environments, measurable ROI focus
            </p>
          </div>
        </div>
      </div>

      {/* Client Types */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Who I Work With</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Trading Firms",
            "Enterprise Operations", 
            "Hospitality Platforms",
            "Content Publishers",
            "Property Management",
            "Financial Services"
          ].map((client) => (
            <Badge key={client} variant="outline" className="bg-background/50">
              {client}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedServicesHeader;