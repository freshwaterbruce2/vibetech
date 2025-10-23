import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { toolsData } from '@/components/tools/toolsData';
import AffiliateSection from '@/components/tools/AffiliateSection';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Award, ExternalLink } from 'lucide-react';

const Resources = () => {
  // Filter tools that have affiliate links
  const affiliateTools = toolsData.filter(tool => tool.affiliateLinks && tool.affiliateLinks.length > 0);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Award className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Recommended Resources</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Developer Resources
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Curated tools, courses, and resources that I personally use and recommend for building modern web applications. 
            These affiliate partnerships help support the development of free content and tutorials.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-border/50">
              <TrendingUp className="h-8 w-8 text-aura-accent mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-foreground mb-1">50+</h3>
              <p className="text-muted-foreground">Recommended Tools</p>
            </Card>
            
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-border/50">
              <Users className="h-8 w-8 text-aura-accent mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-foreground mb-1">10K+</h3>
              <p className="text-muted-foreground">Developers Trust These</p>
            </Card>
            
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm border-border/50">
              <Award className="h-8 w-8 text-aura-accent mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-foreground mb-1">Exclusive</h3>
              <p className="text-muted-foreground">Discounts & Trials</p>
            </Card>
          </div>
        </div>

        {/* Affiliate Sections */}
        <div className="space-y-12">
          {affiliateTools.map((tool, index) => (
            <AffiliateSection
              key={index}
              title={tool.title}
              description={tool.description}
              affiliateLinks={tool.affiliateLinks!}
              variant={tool.variant}
            />
          ))}
        </div>

        {/* Disclosure Section */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <Card className="p-6 bg-muted/50 border-border/50">
            <div className="flex items-start gap-4">
              <ExternalLink className="h-5 w-5 text-aura-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Affiliate Disclosure</h3>
                <p className="text-sm text-muted-foreground">
                  This page contains affiliate links. When you click on these links and make a purchase, 
                  I may earn a commission at no additional cost to you. I only recommend tools and services 
                  that I personally use and believe will add value to your development workflow. 
                  Your support helps me create more free content and tutorials.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Popular Categories */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Categories</h2>
          <div className="flex flex-wrap gap-3">
            {['Development', 'Design', 'Marketing', 'Education', 'Business', 'Hardware'].map((category) => (
              <Badge 
                key={category}
                variant="secondary" 
                className="px-4 py-2 text-sm hover:bg-aura-accent/10 hover:text-aura-accent cursor-pointer transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Resources;