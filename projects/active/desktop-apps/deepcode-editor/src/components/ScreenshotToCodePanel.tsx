/**
 * ScreenshotToCodePanel - UI for converting screenshots to code
 *
 * Features:
 * - Drag & drop or paste images
 * - Framework selection (React/HTML/Vue)
 * - Styling preference (Tailwind/CSS/Styled Components)
 * - Real-time code preview
 * - Copy to clipboard
 * - Insert into editor
 */
import React, { useCallback, useRef,useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Settings,
  Upload,
} from 'lucide-react';
import styled from 'styled-components';

import { ImageToCodeOptions, ImageToCodeResult,ImageToCodeService } from '../services/ImageToCodeService';
import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';

const PanelContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.secondary};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
`;

const UploadZone = styled.div<{ isDragging: boolean }>`
  border: 2px dashed ${props => props.isDragging ? vibeTheme.colors.cyan : vibeTheme.colors.border};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: ${props => props.isDragging ? `${vibeTheme.colors.cyan}10` : vibeTheme.colors.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.cyan}05;
  }
`;

const UploadIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;

  svg {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const UploadText = styled.p`
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;
  margin-bottom: 8px;
`;

const UploadHint = styled.p`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;

const OptionsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
  }
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ImagePreview = styled.div`
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${vibeTheme.colors.border};

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const CodePreview = styled.div`
  position: relative;
  background: ${vibeTheme.colors.primary};
  border: 1px solid ${vibeTheme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const CodeTitle = styled.span`
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  padding: 6px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${vibeTheme.colors.cyan}20;
    color: ${vibeTheme.colors.cyan};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CodeContent = styled.pre`
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: ${vibeTheme.colors.textPrimary};
  max-height: 400px;

  code {
    font-family: inherit;
  }
`;

const GenerateButton = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, ${vibeTheme.colors.cyan}, ${vibeTheme.colors.purple});
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'info' | 'success' | 'error' }>`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => {
    switch (props.type) {
      case 'success': return `${vibeTheme.colors.success}20`;
      case 'error': return `${vibeTheme.colors.danger}20`;
      default: return `${vibeTheme.colors.info}20`;
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return vibeTheme.colors.success;
      case 'error': return vibeTheme.colors.danger;
      default: return vibeTheme.colors.info;
    }
  }};
  font-size: 14px;
`;

interface ScreenshotToCodePanelProps {
  apiKey: string;
  onInsertCode?: (code: string) => void;
}

export const ScreenshotToCodePanel: React.FC<ScreenshotToCodePanelProps> = ({
  apiKey,
  onInsertCode,
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [options, setOptions] = useState<ImageToCodeOptions>({
    framework: 'react',
    styling: 'tailwind',
    maxIterations: 3,
    includeComponents: true,
    responsive: true,
  });
  const [result, setResult] = useState<ImageToCodeResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef(new ImageToCodeService(apiKey));

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) {return;}

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
        }
        break;
      }
    }
  }, [handleFileSelect]);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleGenerate = async () => {
    if (!imageData) {return;}

    setIsGenerating(true);
    setError(null);

    try {
      const generatedResult = await serviceRef.current.convertScreenshotToCode(
        imageData,
        options
      );
      setResult(generatedResult);
    } catch (err: any) {
      setError(err.message || 'Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) {return;}

    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  const handleInsert = () => {
    if (!result) {return;}
    onInsertCode?.(result.code);
  };

  return (
    <PanelContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Header>
        <Title>
          <ImageIcon size={20} />
          Screenshot to Code
        </Title>
      </Header>

      <Content>
        {!imageData ? (
          <UploadZone
            isDragging={isDragging}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadIcon>
              <Upload size={48} />
            </UploadIcon>
            <UploadText>Drop an image here or click to browse</UploadText>
            <UploadHint>
              Supports PNG, JPG, WebP • Paste from clipboard (Ctrl+V)
            </UploadHint>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {handleFileSelect(file);}
              }}
            />
          </UploadZone>
        ) : (
          <>
            <PreviewSection>
              <ImagePreview>
                <img src={imageData} alt="Screenshot" />
              </ImagePreview>
              <IconButton onClick={() => setImageData(null)}>
                <RefreshCw size={16} /> Change Image
              </IconButton>
            </PreviewSection>

            <OptionsSection>
              <OptionGroup>
                <Label>Framework</Label>
                <Select
                  value={options.framework}
                  onChange={(e) => setOptions({ ...options, framework: e.target.value as any })}
                >
                  <option value="react">React</option>
                  <option value="html">HTML</option>
                  <option value="vue">Vue</option>
                </Select>
              </OptionGroup>

              <OptionGroup>
                <Label>Styling</Label>
                <Select
                  value={options.styling}
                  onChange={(e) => setOptions({ ...options, styling: e.target.value as any })}
                >
                  <option value="tailwind">Tailwind CSS</option>
                  <option value="css">CSS</option>
                  {options.framework === 'react' && (
                    <option value="styled-components">Styled Components</option>
                  )}
                </Select>
              </OptionGroup>
            </OptionsSection>

            <OptionsSection>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={options.includeComponents}
                  onChange={(e) => setOptions({ ...options, includeComponents: e.target.checked })}
                />
                Use component library (shadcn/ui)
              </Checkbox>

              <Checkbox>
                <input
                  type="checkbox"
                  checked={options.responsive}
                  onChange={(e) => setOptions({ ...options, responsive: e.target.checked })}
                />
                Make responsive
              </Checkbox>
            </OptionsSection>

            <GenerateButton
              onClick={handleGenerate}
              disabled={isGenerating}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code2 size={18} />
                  Generate Code
                </>
              )}
            </GenerateButton>
          </>
        )}

        {error && (
          <StatusMessage type="error">
            {error}
          </StatusMessage>
        )}

        {result && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StatusMessage type="success">
                Code generated successfully! ({result.iterations} iteration{result.iterations > 1 ? 's' : ''})
              </StatusMessage>

              <CodePreview>
                <CodeHeader>
                  <CodeTitle>
                    <FileCode size={16} style={{ display: 'inline', marginRight: 8 }} />
                    {result.framework.toUpperCase()} Component
                  </CodeTitle>
                  <CodeActions>
                    <IconButton onClick={handleCopy} title="Copy to clipboard">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                    {onInsertCode && (
                      <IconButton onClick={handleInsert} title="Insert into editor">
                        <Download size={16} />
                      </IconButton>
                    )}
                  </CodeActions>
                </CodeHeader>
                <CodeContent>
                  <code>{result.code}</code>
                </CodeContent>
              </CodePreview>
            </motion.div>
          </AnimatePresence>
        )}
      </Content>
    </PanelContainer>
  );
};

export default ScreenshotToCodePanel;
