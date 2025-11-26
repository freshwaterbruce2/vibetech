/**
 * SidePanelView Component
 * Renders the side panel with workspace context, planning insights, and task info
 */
import React from 'react';
import { Activity, AlertTriangle, Clock, FileText } from 'lucide-react';

import { vibeTheme } from '../../../styles/theme';
import type { AgentTask, PlanningInsights } from '../../../types';
import {
    InfoRow,
    SectionTitle,
    SidePanel,
    SidePanelSection,
    WarningItem,
    WarningList,
} from './styled';
import type { WorkspaceContext } from './types';

interface SidePanelViewProps {
    workspaceContext?: WorkspaceContext;
    planningInsights: PlanningInsights | null;
    reasoning: string;
    warnings: string[];
    currentTask: AgentTask | null;
    estimatedTime: string;
}

export const SidePanelView: React.FC<SidePanelViewProps> = ({
    workspaceContext,
    planningInsights,
    reasoning,
    warnings,
    currentTask,
    estimatedTime,
}) => {
    return (
        <SidePanel>
        {/* Workspace Context Section */ }
      {
        workspaceContext && (
            <SidePanelSection>
            <SectionTitle>
            <FileText />
            Workspace Context
            </SectionTitle>
            < InfoRow >
            <span className="label" > Root: </span>
                < span className = "value" > { workspaceContext.workspaceRoot } </span>
                    </InfoRow>
        {
            workspaceContext.currentFile && (
                <InfoRow>
                <span className="label" > Current File: </span>
                    < span className = "value" > { workspaceContext.currentFile } </span>
                        </InfoRow>
          )}
<InfoRow>
    <span className="label" > Open Files: </span>
        < span className = "value" > { workspaceContext.openFiles.length } </span>
            </InfoRow>
            </SidePanelSection>
      )}

{/* Phase 6: Planning Insights Section */ }
{
    planningInsights && (
        <SidePanelSection>
        <SectionTitle>
        <Activity />
            Planning Insights
        </SectionTitle>
        < InfoRow >
        <span className="label" > Confidence: </span>
            < span className = "value" style = {{
        color: planningInsights.overallConfidence >= 70 ? vibeTheme.colors.success :
            planningInsights.overallConfidence >= 40 ? '#fbbf24' : vibeTheme.colors.error
    }
}>
    { Math.round(planningInsights.overallConfidence) } %
    </span>
    </InfoRow>
    < InfoRow >
    <span className="label" > Success Rate: </span>
        < span className = "value" style = {{ color: vibeTheme.colors.success }}>
            { Math.round(planningInsights.estimatedSuccessRate) } %
            </span>
            </InfoRow>
            < InfoRow >
            <span className="label" > Memory - Backed: </span>
                < span className = "value" >
                    { planningInsights.memoryBackedSteps } / { currentTask?.steps.length || 0 } steps
                        </span>
                        </InfoRow>
                        < InfoRow >
                        <span className="label" > Fallbacks: </span>
                            < span className = "value" >
                                { planningInsights.fallbacksGenerated } plan{ planningInsights.fallbacksGenerated !== 1 ? 's' : '' }
</span>
    </InfoRow>
{
    planningInsights.highRiskSteps > 0 && (
        <InfoRow>
        <span className="label" > High Risk: </span>
            < span className = "value" style = {{ color: vibeTheme.colors.error }
}>
    { planningInsights.highRiskSteps } step{ planningInsights.highRiskSteps !== 1 ? 's' : '' }
</span>
    </InfoRow>
          )}
</SidePanelSection>
      )}

{/* AI Reasoning Section */ }
{
    reasoning && (
        <SidePanelSection>
        <SectionTitle>
        <Activity />
            AI Reasoning
        </SectionTitle>
        < div style = {{ fontSize: '13px', lineHeight: '1.6', color: vibeTheme.colors.text }
}>
    { reasoning }
    </div>
    </SidePanelSection>
      )}

{/* Warnings Section */ }
{
    warnings.length > 0 && (
        <SidePanelSection>
        <SectionTitle>
        <AlertTriangle />
            Warnings
        </SectionTitle>
        <WarningList>
    {
        warnings.map((warning, index) => (
            <WarningItem key= { index } > { warning } </WarningItem>
        ))
    }
    </WarningList>
        </SidePanelSection>
      )
}

{/* Task Info Section */ }
{
    currentTask && (
        <SidePanelSection>
        <SectionTitle>
        <Clock />
            Task Info
        </SectionTitle>
        < InfoRow >
        <span className="label" > Task ID: </span>
            < span className = "value" style = {{ fontSize: '11px', fontFamily: 'monospace' }
}>
    { currentTask.id }
    </span>
    </InfoRow>
    < InfoRow >
    <span className="label" > Total Steps: </span>
        < span className = "value" > { currentTask.steps.length } </span>
            </InfoRow>
{
    estimatedTime && (
        <InfoRow>
        <span className="label" > Est.Time: </span>
            < span className = "value" > { estimatedTime } </span>
                </InfoRow>
          )
}
{
    currentTask.createdAt && (
        <InfoRow>
        <span className="label" > Created: </span>
            < span className = "value" > { currentTask.createdAt.toLocaleTimeString() } </span>
                </InfoRow>
          )
}
</SidePanelSection>
      )}
</SidePanel>
  );
};
