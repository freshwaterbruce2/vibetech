/**
 * Recommendation Types
 * Types for AI-generated recommendations and suggestions
 */

export type RecommendationType =
  | 'next-steps'
  | 'production-check'
  | 'workflow'
  | 'code-quality'
  | 'git-reminder'
  | 'test-suggestion'
  | 'documentation';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'deferred' | 'expired';

export interface Recommendation {
  id?: number;
  type: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  title: string;
  description: string;
  reasoning: string;
  actionLabel?: string;
  actionCommand?: string;
  confidence: number; // 0-1
  context: Record<string, any>;
  createdAt: number;
  expiresAt?: number | null;
  respondedAt?: number | null;
}

export interface RecommendationFeedback {
  recommendationId: number;
  wasHelpful: boolean;
  feedback?: string;
  timestamp: number;
}

export interface PromptContext {
  recentActivity: {
    files: string[];
    gitBranches: string[];
    processes: string[];
  };
  currentFocus: {
    project?: string;
    activeFiles: string[];
  };
  userPatterns: {
    commonWorkflows: string[];
    preferredTools: string[];
  };
}
