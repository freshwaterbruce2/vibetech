import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Layers,
  Code,
  Zap,
} from 'lucide-react';
import styled from 'styled-components';

import { DeepCodeRules, CodeTemplate } from '../types/customInstructions';
import { vibeTheme } from '../styles/theme';

interface CustomInstructionsPanelProps {
  workspaceRoot: string;
  currentRules?: DeepCodeRules;
  templates?: Map<string, DeepCodeRules['templates']>;
  onSaveRules: (rules: DeepCodeRules) => Promise<void>;
  onLoadRules: () => Promise<DeepCodeRules | null>;
  onExportRules: (rules: DeepCodeRules) => void;
  onImportRules: (file: File) => Promise<void>;
}

export const CustomInstructionsPanel: React.FC<CustomInstructionsPanelProps> = ({
  workspaceRoot,
  currentRules,
  templates,
  onSaveRules,
  onLoadRules,
  onExportRules,
  onImportRules,
}) => {
  const [rules, setRules] = useState<DeepCodeRules | null>(currentRules || null);
  const [activeTab, setActiveTab] = useState<'global' | 'patterns' | 'templates' | 'ai'>('global');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (currentRules) {
      setRules(currentRules);
    } else {
      loadRules();
    }
  }, [currentRules]);

  const loadRules = async () => {
    const loaded = await onLoadRules();
    if (loaded) {
      setRules(loaded);
    }
  };

  const handleSave = async () => {
    if (rules) {
      await onSaveRules(rules);
      setIsEditing(false);
    }
  };

  const handleExport = () => {
    if (rules) {
      onExportRules(rules);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImportRules(file);
      await loadRules();
    }
  };

  const renderGlobalTab = () => (
    <TabContent>
      <Section>
        <SectionTitle>
          <Code size={16} />
          Style Preferences
        </SectionTitle>
        <Grid>
          <Field>
            <Label>Indentation</Label>
            <Select
              value={rules?.global?.style?.indentation || 'spaces'}
              onChange={(e) =>
                updateNestedValue('global.style.indentation', e.target.value)
              }
            >
              <option value="spaces">Spaces</option>
              <option value="tabs">Tabs</option>
            </Select>
          </Field>

          <Field>
            <Label>Indent Size</Label>
            <Input
              type="number"
              min="1"
              max="8"
              value={rules?.global?.style?.indentSize || 2}
              onChange={(e) =>
                updateNestedValue('global.style.indentSize', parseInt(e.target.value))
              }
            />
          </Field>

          <Field>
            <Label>Quotes</Label>
            <Select
              value={rules?.global?.style?.quotes || 'single'}
              onChange={(e) => updateNestedValue('global.style.quotes', e.target.value)}
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
            </Select>
          </Field>

          <Field>
            <Label>Semicolons</Label>
            <Checkbox
              type="checkbox"
              checked={rules?.global?.style?.semicolons ?? true}
              onChange={(e) =>
                updateNestedValue('global.style.semicolons', e.target.checked)
              }
            />
          </Field>

          <Field>
            <Label>Line Length</Label>
            <Input
              type="number"
              min="40"
              max="200"
              value={rules?.global?.style?.lineLength || 100}
              onChange={(e) =>
                updateNestedValue('global.style.lineLength', parseInt(e.target.value))
              }
            />
          </Field>
        </Grid>
      </Section>

      <Section>
        <SectionTitle>Naming Conventions</SectionTitle>
        <Grid>
          <Field>
            <Label>Variables</Label>
            <Select
              value={rules?.global?.style?.naming?.variables || 'camelCase'}
              onChange={(e) =>
                updateNestedValue('global.style.naming.variables', e.target.value)
              }
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
            </Select>
          </Field>

          <Field>
            <Label>Functions</Label>
            <Select
              value={rules?.global?.style?.naming?.functions || 'camelCase'}
              onChange={(e) =>
                updateNestedValue('global.style.naming.functions', e.target.value)
              }
            >
              <option value="camelCase">camelCase</option>
              <option value="snake_case">snake_case</option>
              <option value="PascalCase">PascalCase</option>
            </Select>
          </Field>

          <Field>
            <Label>Classes</Label>
            <Select
              value={rules?.global?.style?.naming?.classes || 'PascalCase'}
              onChange={(e) =>
                updateNestedValue('global.style.naming.classes', e.target.value)
              }
            >
              <option value="PascalCase">PascalCase</option>
              <option value="snake_case">snake_case</option>
            </Select>
          </Field>

          <Field>
            <Label>Constants</Label>
            <Select
              value={rules?.global?.style?.naming?.constants || 'SCREAMING_SNAKE_CASE'}
              onChange={(e) =>
                updateNestedValue('global.style.naming.constants', e.target.value)
              }
            >
              <option value="SCREAMING_SNAKE_CASE">SCREAMING_SNAKE_CASE</option>
              <option value="camelCase">camelCase</option>
            </Select>
          </Field>
        </Grid>
      </Section>
    </TabContent>
  );

  const renderTemplatesTab = () => (
    <TabContent>
      <Section>
        <SectionTitle>
          <BookOpen size={16} />
          Code Templates ({templates?.size || 0} sources)
        </SectionTitle>

        {templates && (
          <TemplateList>
            {Array.from(templates.entries()).map(([source, sourceTemplates]) => (
              <TemplateSource key={source}>
                <SourceName>{source}</SourceName>
                {sourceTemplates &&
                  Object.entries(sourceTemplates).map(([name, template]) => (
                    <TemplateCard
                      key={name}
                      onClick={() => setSelectedTemplate(name)}
                      $selected={selectedTemplate === name}
                    >
                      <TemplateName>{template.name}</TemplateName>
                      {template.description && (
                        <TemplateDescription>{template.description}</TemplateDescription>
                      )}
                      <TemplateTags>
                        {template.trigger && <Tag>Trigger: {template.trigger}</Tag>}
                        {template.language && <Tag>{template.language}</Tag>}
                        {template.tags?.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </TemplateTags>
                    </TemplateCard>
                  ))}
              </TemplateSource>
            ))}
          </TemplateList>
        )}

        {selectedTemplate && templates && (
          <TemplatePreview>
            <PreviewHeader>
              <h3>Template Preview</h3>
              <CloseButton onClick={() => setSelectedTemplate(null)}>×</CloseButton>
            </PreviewHeader>
            {Array.from(templates.values())
              .flatMap((t) => (t ? Object.entries(t) : []))
              .filter(([name]) => name === selectedTemplate)
              .map(([, template]) => (
                <PreviewCode key={selectedTemplate}>{template.code}</PreviewCode>
              ))}
          </TemplatePreview>
        )}
      </Section>
    </TabContent>
  );

  const renderAITab = () => (
    <TabContent>
      <Section>
        <SectionTitle>
          <Zap size={16} />
          AI Configuration
        </SectionTitle>
        <Grid>
          <Field>
            <Label>Model</Label>
            <Select
              value={rules?.aiConfig?.model || 'auto'}
              onChange={(e) => updateNestedValue('aiConfig.model', e.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="deepseek">DeepSeek</option>
              <option value="haiku">Claude Haiku</option>
              <option value="sonnet">Claude Sonnet</option>
            </Select>
          </Field>

          <Field>
            <Label>Temperature</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={rules?.aiConfig?.temperature || 0.7}
              onChange={(e) =>
                updateNestedValue('aiConfig.temperature', parseFloat(e.target.value))
              }
            />
          </Field>

          <Field>
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min="100"
              max="8000"
              step="100"
              value={rules?.aiConfig?.maxTokens || 2000}
              onChange={(e) =>
                updateNestedValue('aiConfig.maxTokens', parseInt(e.target.value))
              }
            />
          </Field>

          <Field>
            <Label>Completion Style</Label>
            <Select
              value={rules?.aiConfig?.completionStyle || 'balanced'}
              onChange={(e) =>
                updateNestedValue('aiConfig.completionStyle', e.target.value)
              }
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="verbose">Verbose</option>
            </Select>
          </Field>

          <Field>
            <Label>Include Comments</Label>
            <Checkbox
              type="checkbox"
              checked={rules?.aiConfig?.includeComments ?? true}
              onChange={(e) =>
                updateNestedValue('aiConfig.includeComments', e.target.checked)
              }
            />
          </Field>

          <Field>
            <Label>Include Types</Label>
            <Checkbox
              type="checkbox"
              checked={rules?.aiConfig?.includeTypes ?? true}
              onChange={(e) =>
                updateNestedValue('aiConfig.includeTypes', e.target.checked)
              }
            />
          </Field>
        </Grid>

        <Field>
          <Label>System Prompt</Label>
          <TextArea
            rows={4}
            value={rules?.aiConfig?.systemPrompt || ''}
            onChange={(e) => updateNestedValue('aiConfig.systemPrompt', e.target.value)}
            placeholder="Enter system-level instructions for the AI..."
          />
        </Field>
      </Section>
    </TabContent>
  );

  const updateNestedValue = (path: string, value: any) => {
    if (!rules) return;

    const parts = path.split('.');
    const newRules = { ...rules };
    let current: any = newRules;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    setRules(newRules);
  };

  if (!rules) {
    return (
      <Container>
        <EmptyState>
          <FileCode size={48} />
          <EmptyText>No .deepcoderules file found</EmptyText>
          <CreateButton onClick={() => setRules({ version: '1.0' })}>
            Create New
          </CreateButton>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          <FileCode size={20} />
          Custom Instructions
        </Title>
        <Actions>
          <input
            type="file"
            accept=".yaml,.yml,.json"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="import-rules"
          />
          <IconButton onClick={() => document.getElementById('import-rules')?.click()}>
            <Upload size={16} />
          </IconButton>
          <IconButton onClick={handleExport}>
            <Download size={16} />
          </IconButton>
          <SaveButton onClick={handleSave}>
            <CheckCircle2 size={16} />
            Save Rules
          </SaveButton>
        </Actions>
      </Header>

      <Info>
        <InfoIcon>
          <Layers size={14} />
        </InfoIcon>
        <InfoText>
          Custom rules apply to all AI completions in this workspace. Create
          .deepcoderules files at different levels for rule inheritance.
        </InfoText>
      </Info>

      <Tabs>
        <Tab onClick={() => setActiveTab('global')} $active={activeTab === 'global'}>
          Global Rules
        </Tab>
        <Tab onClick={() => setActiveTab('templates')} $active={activeTab === 'templates'}>
          Templates ({Object.keys(rules.templates || {}).length})
        </Tab>
        <Tab onClick={() => setActiveTab('ai')} $active={activeTab === 'ai'}>
          AI Config
        </Tab>
      </Tabs>

      <AnimatePresence mode="wait">
        {activeTab === 'global' && renderGlobalTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'ai' && renderAITab()}
      </AnimatePresence>
    </Container>
  );
};

// Styled components
const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 900px;
  margin: 16px auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 18px;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled.button`
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: ${vibeTheme.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const Info = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
`;

const InfoIcon = styled.div`
  color: #60a5fa;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 13px;
  line-height: 1.5;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${(props) =>
    props.$active ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? '#8b5cf6' : 'transparent')};
  color: ${vibeTheme.colors.text};
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }
`;

const TabContent = styled(motion.div)``;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 13px;
  font-weight: 600;
`;

const Input = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const Select = styled.select`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const TextArea = styled.textarea`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TemplateSource = styled.div``;

const SourceName = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

const TemplateCard = styled.div<{ $selected: boolean }>`
  background: ${(props) =>
    props.$selected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)'};
  border: 1px solid
    ${(props) =>
      props.$selected ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.2)'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
  }
`;

const TemplateName = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TemplateDescription = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  margin-bottom: 8px;
`;

const TemplateTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Tag = styled.div`
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`;

const TemplatePreview = styled.div`
  margin-top: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 16px;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    color: ${vibeTheme.colors.text};
    font-size: 14px;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 24px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const PreviewCode = styled.pre`
  background: rgba(0, 0, 0, 0.5);
  color: ${vibeTheme.colors.text};
  padding: 12px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${vibeTheme.colors.textSecondary};
`;

const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 16px;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
`;
