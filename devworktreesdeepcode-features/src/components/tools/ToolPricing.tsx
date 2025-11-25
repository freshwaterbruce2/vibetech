import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock, CheckCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

export interface ToolPricingProps {
  toolName: string;
  description: string;
  price?: number;
  originalPrice?: number;
  features: string[];
  isAdvanced?: boolean;
  accessUrl?: string;
  onPurchase?: () => void;
}

const ToolPricing: React.FC<ToolPricingProps> = ({
  toolName,
  description,
  price = 0,
  originalPrice,
  features,
  isAdvanced = false,
  accessUrl,
  onPurchase
}) => {
  const { isAdmin } = useAdmin();

  const handleAccess = () => {
    if (isAdmin) {
      // Admin gets free access
      if (accessUrl) {
        window.open(accessUrl, '_blank');
      }
    } else if (price === 0) {
      // Free tool
      if (accessUrl) {
        window.open(accessUrl, '_blank');
      }
    } else {
      // Paid tool - trigger purchase flow
      if (onPurchase) {
        onPurchase();
      }
    }
  };

  const getAccessButtonText = () => {
    if (isAdmin) return 'Access Tool (Admin)';
    if (price === 0) return 'Access Free Tool';
    return `Purchase Access - $${price}`;
  };

  const getAccessButtonVariant = () => {
    if (isAdmin) return 'default';
    if (price === 0) return 'default';
    return 'premium';
  };

  return (
    <Card className="glass-card border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.4)] transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {toolName}
            {isAdvanced && <Crown className="h-4 w-4 text-yellow-500" />}
            {isAdmin && <Badge variant="secondary">Admin Access</Badge>}
          </CardTitle>
          {!isAdmin && price > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-[color:var(--c-cyan)]">${price}</div>
              {originalPrice && (
                <div className="text-sm line-through text-gray-400">${originalPrice}</div>
              )}
            </div>
          )}
        </div>
        <CardDescription className="text-gray-300">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <h4 className="font-semibold text-white">Features:</h4>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleAccess}
          className="w-full"
          variant={getAccessButtonVariant() as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
          disabled={!isAdmin && price > 0 && !onPurchase}
        >
          {!isAdmin && price > 0 && <Lock className="mr-2 h-4 w-4" />}
          {isAdmin && <Crown className="mr-2 h-4 w-4" />}
          {getAccessButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ToolPricing;