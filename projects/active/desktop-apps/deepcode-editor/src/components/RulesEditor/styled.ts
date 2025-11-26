/**
 * RulesEditor Styled Components
 * All styled components for the Rules Editor UI
 */
import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #1e1e1e);
  color: var(--text-primary, #d4d4d4);
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-secondary, #252525);
  border-bottom: 1px solid var(--border-color, #3e3e3e);
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

export const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ModeSelector = styled.div`
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 6px;
  padding: 4px;
`;

export const ModeButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${(props) => (props.active ? 'var(--accent-color, #007acc)' : 'transparent')};
  color: ${(props) => (props.active ? '#fff' : 'var(--text-secondary, #9d9d9d)')};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.active ? 'var(--accent-color-hover, #005a9e)' : 'var(--bg-hover, #3a3a3a)'};
  }
`;

export const FilenameSelector = styled.select`
  padding: 6px 12px;
  background: var(--bg-tertiary, #2d2d30);
  color: var(--text-primary, #d4d4d4);
  border: 1px solid var(--border-color, #3e3e3e);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
`;

export const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 6px 16px;
  border: none;
  background: ${(props) =>
    props.variant === 'secondary' ? 'transparent' : 'var(--accent-color, #007acc)'};
  color: ${(props) => (props.variant === 'secondary' ? 'var(--text-secondary)' : '#fff')};
  border: ${(props) =>
    props.variant === 'secondary' ? '1px solid var(--border-color)' : 'none'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

export const ContentArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const Sidebar = styled.aside`
  width: 250px;
  background: var(--bg-secondary, #252525);
  border-right: 1px solid var(--border-color, #3e3e3e);
  overflow-y: auto;
  padding: 16px;
`;

export const SidebarSection = styled.div`
  margin-bottom: 24px;
`;

export const SidebarTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #9d9d9d);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const TemplateButton = styled.button<{ active?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: none;
  background: ${(props) => (props.active ? 'var(--accent-color, #007acc)' : 'transparent')};
  color: ${(props) => (props.active ? '#fff' : 'var(--text-primary, #d4d4d4)')};
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.active ? 'var(--accent-color-hover, #005a9e)' : 'var(--bg-hover, #3a3a3a)'};
  }
`;

export const ReferenceText = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #9d9d9d);

  strong {
    display: block;
    margin-top: 12px;
    margin-bottom: 6px;
    color: var(--text-primary, #d4d4d4);
  }

  ul {
    margin: 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 4px;
  }

  code {
    background: var(--bg-tertiary, #2d2d30);
    padding: 2px 4px;
    border-radius: 2px;
    font-family: 'Consolas', 'Monaco', monospace;
  }
`;

export const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const EditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
`;

export const ErrorBanner = styled.div`
  padding: 12px;
  background: #5a1e1e;
  border-top: 2px solid #f44747;
  color: #f48771;
  font-size: 13px;
`;

export const StatusBanner = styled.div`
  padding: 12px;
  background: #1e3a1e;
  border-top: 2px solid #4ec9b0;
  color: #89d185;
  font-size: 13px;
`;

export const PreviewArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

export const PreviewTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
`;

export const RuleCard = styled.div`
  background: var(--bg-secondary, #252525);
  border: 1px solid var(--border-color, #3e3e3e);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

export const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const RuleName = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
`;

export const RulePriority = styled.span<{ priority: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(props) =>
    props.priority === 'high'
      ? '#5a1e1e'
      : props.priority === 'low'
        ? '#1e3a1e'
        : '#2d2d30'};
  color: ${(props) =>
    props.priority === 'high'
      ? '#f48771'
      : props.priority === 'low'
        ? '#89d185'
        : '#9d9d9d'};
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

export const Tag = styled.span`
  padding: 3px 8px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 3px;
  font-size: 11px;
  color: var(--text-secondary, #9d9d9d);
`;

export const RuleScope = styled.div`
  margin-bottom: 12px;
`;

export const ScopeLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary, #9d9d9d);
  margin-bottom: 6px;
`;

export const GlobList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const GlobItem = styled.code<{ isNegative?: boolean }>`
  padding: 4px 8px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: ${(props) => (props.isNegative ? '#f48771' : '#4ec9b0')};
`;

export const RuleContent = styled.pre`
  margin: 0;
  padding: 12px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--text-primary, #d4d4d4);
`;

export const TestArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

export const TestTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
`;

export const TestInput = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--text-secondary, #9d9d9d);
  }

  input {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-secondary, #252525);
    border: 1px solid var(--border-color, #3e3e3e);
    border-radius: 4px;
    color: var(--text-primary, #d4d4d4);
    font-size: 14px;
    font-family: 'Consolas', 'Monaco', monospace;

    &:focus {
      outline: none;
      border-color: var(--accent-color, #007acc);
    }
  }
`;

export const TestResults = styled.div`
  margin-top: 20px;
`;

export const ResultsTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #9d9d9d);
`;

export const NoMatch = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text-secondary, #9d9d9d);
  font-size: 14px;
`;

export const MatchCard = styled.div`
  background: var(--bg-secondary, #252525);
  border-left: 3px solid var(--accent-color, #007acc);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
`;

export const MatchHeader = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--accent-color, #007acc);
`;

export const MatchContent = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #9d9d9d);
  white-space: pre-wrap;
`;
