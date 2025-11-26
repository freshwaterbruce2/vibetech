/**
 * CustomInstructionsPanel Module Exports
 * Barrel file for Custom Instructions Panel component
 */

// Types
export type {
  CustomInstructionsPanelProps,
  TabType,
  StylePreferences,
  NamingConventions,
  AIConfig,
  CodeTemplate,
  DeepCodeRules,
} from './types';

// Styled components
export {
  Container,
  Header,
  Title,
  Actions,
  IconButton,
  SaveButton,
  Info,
  InfoIcon,
  InfoText,
  Tabs,
  Tab,
  TabContent,
  Section,
  SectionTitle,
  Grid,
  Field,
  Label,
  Input,
  Select,
  Checkbox,
  TextArea,
  TemplateList,
  TemplateSource,
  SourceName,
  TemplateCard,
  TemplateName,
  TemplateDescription,
  TemplateTags,
  Tag,
  TemplatePreview,
  PreviewHeader,
  CloseButton,
  PreviewCode,
  EmptyState,
  EmptyText,
  CreateButton,
} from './styled';

// Hooks
export { useCustomInstructions } from './useCustomInstructions';
