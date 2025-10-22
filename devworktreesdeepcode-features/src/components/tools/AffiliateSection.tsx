import React from 'react';
import { Card } from '@/components/ui/card';
import AffiliateLink from './AffiliateLink';
import { AffiliateLink as AffiliateLinkType } from './toolsData';

interface AffiliateSectionProps {
  title: string;
  description: string;
  affiliateLinks: AffiliateLinkType[];
  variant?: 'blue' | 'purple' | 'teal';
}

const AffiliateSection: React.FC<AffiliateSectionProps> = ({
  title,
  description,
  affiliateLinks,
  variant = 'blue'
}) => {
  const variantClasses = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    teal: 'border-teal-500/20 bg-teal-500/5'
  };

  return (
    <Card className={`p-6 ${variantClasses[variant]} border backdrop-blur-sm`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {affiliateLinks.map((link, index) => (
          <AffiliateLink
            key={index}
            name={link.name}
            url={link.url}
            description={link.description}
            commission={link.commission}
            category={link.category}
          />
        ))}
      </div>
    </Card>
  );
};

export default AffiliateSection;