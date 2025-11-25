import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AffiliateLinkProps {
  name: string;
  url: string;
  description: string;
  commission?: string;
  category: string;
}

const AffiliateLink: React.FC<AffiliateLinkProps> = ({
  name,
  url,
  description,
  commission,
  category
}) => {
  const handleClick = () => {
    // Track affiliate link clicks
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'affiliate_click', {
        event_category: 'affiliate',
        event_label: name,
        value: category
      });
    }
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-aura-accent/50 hover:bg-card/80 hover:shadow-lg hover:shadow-aura-accent/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground group-hover:text-aura-accent transition-colors">
              {name}
            </h4>
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
          
          {commission && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-aura-accent font-medium">
                {commission}
              </span>
            </div>
          )}
          
          <Button
            onClick={handleClick}
            size="sm"
            className="bg-gradient-to-r from-aura-accent to-aura-accent/80 hover:from-aura-accent/90 hover:to-aura-accent/70 text-white shadow-lg hover:shadow-aura-accent/25 transition-all duration-300"
          >
            <span>Get Started</span>
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-aura-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default AffiliateLink;