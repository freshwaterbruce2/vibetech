/**
 * Model Strategy Selection Panel
 * Allows users to choose between different AI model strategies
 * DeepSeek is the primary AI with optional Anthropic models
 */

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Zap, Scale, Target, Brain } from 'lucide-react';

export type ModelStrategy = 'fast' | 'balanced' | 'accurate' | 'adaptive';

interface ModelStrategyPanelProps {
  currentStrategy: ModelStrategy;
  onStrategyChange: (strategy: ModelStrategy) => void;
  hasAnthropicKey?: boolean;
}

const strategies = [
  {
    value: 'fast' as ModelStrategy,
    label: 'Fast',
    icon: Zap,
    description: 'DeepSeek only - Best for rapid prototyping',
    details: 'Lowest latency (<800ms), good quality',
    badge: 'Default',
    color: 'text-green-600',
  },
  {
    value: 'balanced' as ModelStrategy,
    label: 'Balanced',
    icon: Scale,
    description: 'Smart switching based on code complexity',
    details: 'DeepSeek for simple code, upgrades for complex patterns',
    badge: 'Recommended',
    color: 'text-blue-600',
  },
  {
    value: 'accurate' as ModelStrategy,
    label: 'Accurate',
    icon: Target,
    description: 'Highest quality completions available',
    details: 'Uses Sonnet 4.5 if API key provided, else DeepSeek',
    badge: 'Premium',
    color: 'text-purple-600',
  },
  {
    value: 'adaptive' as ModelStrategy,
    label: 'Adaptive',
    icon: Brain,
    description: 'AI-powered selection that learns from your patterns',
    details: 'Optimizes model choice based on acceptance history',
    badge: 'Smart',
    color: 'text-orange-600',
  },
];

export const ModelStrategyPanel: React.FC<ModelStrategyPanelProps> = ({
  currentStrategy,
  onStrategyChange,
  hasAnthropicKey = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Model Strategy</CardTitle>
        <CardDescription>
          Choose how AI models are selected for code completions.
          {!hasAnthropicKey && (
            <span className="block mt-2 text-yellow-600 dark:text-yellow-500">
              Using DeepSeek only. Add Anthropic API key for Claude models.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={currentStrategy}
          onValueChange={(value) => onStrategyChange(value as ModelStrategy)}
          className="space-y-4"
        >
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            return (
              <div
                key={strategy.value}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <RadioGroupItem value={strategy.value} id={strategy.value} className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor={strategy.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className={`w-4 h-4 ${strategy.color}`} />
                    <span className="font-medium">{strategy.label}</span>
                    <Badge variant="secondary" className="ml-2">
                      {strategy.badge}
                    </Badge>
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {strategy.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {strategy.details}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Primary AI:</span> DeepSeek Chat
            </div>
            {hasAnthropicKey && (
              <>
                <div>
                  <span className="font-medium">Optional Models:</span> Claude Haiku 4.5, Claude Sonnet 4.5
                </div>
                <div>
                  <span className="font-medium">Cost Optimization:</span> Enabled
                </div>
              </>
            )}
            <div>
              <span className="font-medium">Active Strategy:</span>{' '}
              {strategies.find((s) => s.value === currentStrategy)?.label || 'Fast'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};