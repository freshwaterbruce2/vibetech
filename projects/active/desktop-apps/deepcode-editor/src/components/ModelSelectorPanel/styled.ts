/**
 * ModelSelectorPanel Styled Components
 */
import styled from 'styled-components';

export const PanelContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: #1e1e1e;
  border-left: 1px solid #333;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #333;
  background: #252525;
`;

export const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }
`;

export const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

export const StatCard = styled.div`
  background: #1e1e1e;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #333;
`;

export const StatLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
`;

export const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

export const BudgetSection = styled.div`
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

export const BudgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #fff;
  font-size: 14px;
`;

export const BudgetInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #007acc;
  }
`;

export const BudgetBar = styled.div`
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

export const BudgetProgress = styled.div<{ $width: number; $isOver: boolean }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: ${(props) => (props.$isOver ? '#f44336' : '#4caf50')};
  transition: width 0.3s, background 0.3s;
`;

export const BudgetText = styled.div`
  font-size: 12px;
  color: #888;
  text-align: center;
`;

export const OverBudgetWarning = styled.span`
  color: #f44336;
  font-weight: 600;
`;

export const ControlsSection = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #333;
`;

export const ControlGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    color: #888;
  }
`;

export const Select = styled.select`
  padding: 6px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #007acc;
  }
`;

export const ModelsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ModelCard = styled.div<{ $isSelected: boolean; $isRecommended: boolean }>`
  background: #252525;
  border: 2px solid ${(props) => (props.$isSelected ? '#007acc' : props.$isRecommended ? '#ffa726' : '#333')};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #007acc;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 122, 204, 0.2);
  }
`;

export const ModelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const ModelName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const RecommendedBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #ffa726;
  background: rgba(255, 167, 38, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
`;

export const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;

  &:hover {
    color: #fff;
  }
`;

export const ModelProvider = styled.div`
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

export const PricingRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
`;

export const PricingLabel = styled.span`
  color: #888;
`;

export const PricingValue = styled.span`
  color: #4caf50;
  font-weight: 500;
`;

export const PerformanceRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
`;

export const PerformanceMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;

  svg {
    color: #ffa726;
  }
`;

export const UsageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding-top: 8px;
  border-top: 1px solid #333;
`;

export const UsageLabel = styled.span`
  color: #888;
`;

export const UsageValue = styled.span`
  color: #fff;
  font-weight: 500;
`;

export const ExpandedDetails = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
`;

export const DetailLabel = styled.span`
  color: #888;
`;

export const DetailValue = styled.span`
  color: #fff;
  font-weight: 500;
`;

export const CapabilitiesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

export const CapabilityBadge = styled.span`
  font-size: 10px;
  color: #007acc;
  background: rgba(0, 122, 204, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 204, 0.3);
`;

export const ActionsSection = styled.div`
  padding: 16px;
  border-top: 1px solid #333;
  background: #252525;
`;

export const ResetButton = styled.button`
  width: 100%;
  padding: 8px;
  background: #f44336;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d32f2f;
  }
`;
