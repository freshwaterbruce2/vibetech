export interface AgentMistake {
    id: number;
    mistake_type: string;
    mistake_category?: string | null;
    description: string;
    root_cause_analysis?: string | null;
    context_when_occurred?: string | null;
    impact_severity: string;
    prevention_strategy?: string | null;
    identified_at: string;
    resolved: boolean;
}

export type NewAgentMistake = Omit<AgentMistake, 'id'> & Partial<Pick<AgentMistake, 'identified_at' | 'resolved'>>;

export interface AgentKnowledge {
    id: number;
    knowledge_type: string;
    title: string;
    content: string;
    applicable_tasks?: string | null;
    success_rate_improvement?: number | null;
    confidence_level?: number | null;
    tags?: string | null;
}

export type NewAgentKnowledge = Omit<AgentKnowledge, 'id'>;

export interface LearningStats {
    totalMistakes: number;
    totalKnowledge: number;
    mistakesByType: Record<string, number>;
    knowledgeByType: Record<string, number>;
    recentMistakes: AgentMistake[];
    recentKnowledge: AgentKnowledge[];
}
