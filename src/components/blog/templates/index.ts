export { default as createProgrammingTutorialTemplate } from './ProgrammingTutorialTemplate';
export { default as createToolReviewTemplate } from './ToolReviewTemplate';
export { default as createBusinessGuideTemplate } from './BusinessGuideTemplate';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultTags: string[];
  suggestedAffiliates: string[];
}

export const templateCategories: TemplateCategory[] = [
  {
    id: 'programming',
    name: 'Programming Tutorial',
    description: 'Step-by-step coding tutorials with practical examples',
    icon: 'Code',
    defaultTags: ['Tutorial', 'Programming', 'Development'],
    suggestedAffiliates: ['Vercel Pro', 'GitHub Copilot', 'React Course', 'Frontend Masters']
  },
  {
    id: 'tool-review',
    name: 'Tool Review',
    description: 'In-depth reviews of development tools and services',
    icon: 'Wrench',
    defaultTags: ['Review', 'Tools', 'Productivity'],
    suggestedAffiliates: ['Figma Professional', 'Frontend Masters', 'LG UltraWide Monitor']
  },
  {
    id: 'business',
    name: 'Business Guide',
    description: 'Career and business advice for developers',
    icon: 'TrendingUp',
    defaultTags: ['Business', 'Career', 'Strategy'],
    suggestedAffiliates: ['React Course', 'Frontend Masters', 'Vercel Pro']
  },
  {
    id: 'blank',
    name: 'Blank Post',
    description: 'Start from scratch with a clean slate',
    icon: 'FileText',
    defaultTags: [],
    suggestedAffiliates: []
  }
];