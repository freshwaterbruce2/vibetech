import React from 'react';
import { ExternalLink, Star, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AffiliateRecommendation } from './types';

interface AffiliateBoxProps {
  recommendation: AffiliateRecommendation;
  variant?: 'sidebar' | 'inline' | 'footer';
}

const AffiliateBox: React.FC<AffiliateBoxProps> = ({ 
  recommendation, 
  variant = 'sidebar' 
}) => {
  const handleClick = () => {
    // Track affiliate link clicks
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'affiliate_click', {
        event_category: 'blog_affiliate',
        event_label: recommendation.name,
        value: recommendation.category,
        custom_parameters: {
          placement: variant
        }
      });
    }
    
    window.open(recommendation.url, '_blank', 'noopener,noreferrer');
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'inline':
        return 'border-l-4 border-l-aura-accent bg-aura-accent/5 p-4 my-6';
      case 'footer': 
        return 'bg-gradient-to-r from-aura-accent/10 to-transparent border border-aura-accent/20 p-6';
      default: // sidebar
        return 'bg-card/80 backdrop-blur-sm border border-border/50 hover:border-aura-accent/50 p-4';
    }
  };

  const getButtonSize = () => {
    return variant === 'footer' ? 'default' : 'sm';
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg hover:shadow-aura-accent/20 ${getVariantStyles()}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {recommendation.isPrimary && (
                <Gift className="h-4 w-4 text-aura-accent" />
              )}
              <h4 className="font-semibold text-foreground text-sm">
                {recommendation.name}
              </h4>
              <Badge variant="outline" className="text-xs">
                {recommendation.category}
              </Badge>
            </div>
            
            <p className={`text-muted-foreground leading-relaxed ${
              variant === 'footer' ? 'text-sm' : 'text-xs'
            }`}>
              {recommendation.description}
            </p>
          </div>
        </div>

        {/* Commission Info */}
        {recommendation.commission && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-aura-accent font-medium">
              {recommendation.commission}
            </span>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleClick}
          size={getButtonSize()}
          className={`w-full bg-gradient-to-r from-aura-accent to-aura-accent/80 hover:from-aura-accent/90 hover:to-aura-accent/70 text-white shadow-lg hover:shadow-aura-accent/25 transition-all duration-300 ${
            recommendation.isPrimary ? 'ring-2 ring-aura-accent/30' : ''
          }`}
        >
          <span>Get Started</span>
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>

        {/* Affiliate Disclosure for Primary Recommendations */}
        {recommendation.isPrimary && variant !== 'inline' && (
          <p className="text-xs text-muted-foreground/70 italic">
            Affiliate link - supports free content creation
          </p>
        )}
      </div>
    </Card>
  );
};

export default AffiliateBox;