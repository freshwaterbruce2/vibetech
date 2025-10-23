
export type PricingTier = {
  name: string;
  price: {
    monthly: string;
    yearly: string;
  };
  description: string;
  features: {
    text: string;
    included: boolean;
    tooltip?: string;
  }[];
  comparisons?: {
    text: string;
    tooltip?: string;
  }[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
};

export type MarketComparisonType = {
  category: string;
  description: string;
  pricing: string;
  limitations: string;
  highlighted?: boolean;
};
