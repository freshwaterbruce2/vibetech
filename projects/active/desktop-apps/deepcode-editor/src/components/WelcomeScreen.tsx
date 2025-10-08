import React from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Cpu,
  FileText,
  FolderOpen,
  Github,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { WorkspaceContext } from '../types';

interface WelcomeScreenProps {
  onOpenFolder: (folderPath: string) => void;
  onCreateFile: (fileName: string) => void;
  workspaceContext: WorkspaceContext | null;
  isIndexing: boolean;
  indexingProgress: number;
}

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.5); }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${vibeTheme.gradients.background};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const Header = styled.div`
  text-align: center;
  padding: ${vibeTheme.spacing['3xl']} ${vibeTheme.spacing.lg} ${vibeTheme.spacing['2xl']};
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: ${vibeTheme.typography.fontSize['5xl']};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  background: ${vibeTheme.gradients.primary};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 ${vibeTheme.spacing.md} 0;
  font-family: ${vibeTheme.typography.fontFamily.primary};

  &::after {
    content: '';
    display: block;
    width: 100px;
    height: 4px;
    background: ${vibeTheme.gradients.border};
    margin: ${vibeTheme.spacing.lg} auto;
    border-radius: ${vibeTheme.borderRadius.full};
  }
`;

const Subtitle = styled.p`
  font-size: ${vibeTheme.typography.fontSize.xl};
  color: ${vibeTheme.colors.textSecondary};
  margin: 0 auto;
  max-width: 600px;
  line-height: 1.6;
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const MainContent = styled.div`
  flex: 1;
  padding: 0 ${vibeTheme.spacing.lg} ${vibeTheme.spacing['3xl']};
  position: relative;
  z-index: 1;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${vibeTheme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto ${vibeTheme.spacing['3xl']};
`;

const FeatureCard = styled(motion.div)<{ $variant?: 'primary' | 'secondary' }>`
  background: ${(props) =>
    props.$variant === 'primary'
      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)'
      : 'rgba(26, 26, 46, 0.7)'};
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: ${vibeTheme.borderRadius.large};
  padding: ${vibeTheme.spacing.xl};
  cursor: pointer;
  position: relative;
  backdrop-filter: blur(20px);
  transition: all ${vibeTheme.animation.duration.normal} ${vibeTheme.animation.easing.default};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    background: ${(props) =>
      props.$variant === 'primary' ? vibeTheme.gradients.border : 'rgba(139, 92, 246, 0.2)'};
    border-radius: ${vibeTheme.borderRadius.large};
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${vibeTheme.shadows.large}, ${vibeTheme.shadows.glow};

    &::before {
      background: ${vibeTheme.gradients.primary};
      animation: ${glow} 2s ease-in-out infinite;
    }
  }
`;

const IconWrapper = styled.div<{ $variant?: 'primary' | 'secondary' }>`
  width: 60px;
  height: 60px;
  border-radius: ${vibeTheme.borderRadius.medium};
  background: ${(props) =>
    props.$variant === 'primary' ? vibeTheme.gradients.primary : vibeTheme.gradients.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${vibeTheme.spacing.md};
  animation: ${float} 3s ease-in-out infinite;

  svg {
    width: 28px;
    height: 28px;
    color: ${vibeTheme.colors.text};
  }
`;

const FeatureTitle = styled.h3`
  font-size: ${vibeTheme.typography.fontSize['2xl']};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};
  margin: 0 0 ${vibeTheme.spacing.sm} 0;
`;

const FeatureDescription = styled.p`
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.base};
  line-height: 1.6;
  margin: 0;
`;

const QuickStartSection = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
`;

const QuickStartTitle = styled.h2`
  font-size: ${vibeTheme.typography.fontSize['3xl']};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
  margin: 0 0 ${vibeTheme.spacing.xl} 0;
  position: relative;

  &::before {
    content: '⚡';
    position: absolute;
    left: -60px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 2rem;
    animation: ${float} 2s ease-in-out infinite;
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${vibeTheme.spacing.md};
  justify-content: center;
  margin-top: ${vibeTheme.spacing.xl};
`;

const ActionButton = styled(motion.button)<{ $variant?: 'primary' | 'secondary' }>`
  background: ${(props) =>
    props.$variant === 'primary' ? vibeTheme.gradients.primary : 'transparent'};
  border: 2px solid
    ${(props) => (props.$variant === 'primary' ? 'transparent' : vibeTheme.colors.cyan)};
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.md} ${vibeTheme.spacing.xl};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  transition: all ${vibeTheme.animation.duration.normal} ${vibeTheme.animation.easing.default};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${vibeTheme.shadows.medium};

    &::before {
      left: 100%;
    }
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
  margin-top: ${vibeTheme.spacing.xl};

  .progress-bar {
    width: 200px;
    height: 6px;
    background: rgba(139, 92, 246, 0.2);
    border-radius: ${vibeTheme.borderRadius.full};
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: ${vibeTheme.gradients.primary};
      border-radius: ${vibeTheme.borderRadius.full};
      transition: width 0.3s ease;
    }
  }
`;

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenFolder,
  onCreateFile,
  isIndexing,
  indexingProgress,
}) => {
  const handleOpenFolder = async () => {
    // Use Electron's folder picker if available
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.showOpenDialog({
          properties: ['openDirectory'],
        });
        if (!result.canceled && result.filePaths.length > 0 && result.filePaths[0]) {
          onOpenFolder(result.filePaths[0]);
        }
      } catch (error) {
        console.error('Error opening folder:', error);
        // Fallback to browser file API if available
        if ('showDirectoryPicker' in window) {
          try {
            const dirHandle = await (window as Window & { showDirectoryPicker: () => Promise<{ name: string }> }).showDirectoryPicker();
            onOpenFolder(dirHandle.name);
          } catch (err) {
            console.error('Browser folder picker error:', err);
          }
        }
      }
    } else if ('showDirectoryPicker' in window) {
      // Use browser's File System Access API
      try {
        const dirHandle = await (window as Window & { showDirectoryPicker: () => Promise<{ name: string }> }).showDirectoryPicker();
        onOpenFolder(dirHandle.name);
      } catch (error) {
        console.error('Browser folder picker error:', error);
      }
    } else {
      // Last resort: prompt for folder path
      const folderPath = prompt('Enter folder path:');
      if (folderPath) {
        onOpenFolder(folderPath);
      }
    }
  };

  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      onCreateFile(fileName);
    }
  };

  return (
    <Container>
      <Header>
        <Title>DeepCode Studio 🚀</Title>
        <Subtitle>
          Next-Level AI-Powered Development Experience
          <br />
          Built with the power of DeepSeek AI and Vibe Tech design
        </Subtitle>
      </Header>

      <MainContent>
        <FeatureGrid>
          <FeatureCard
            $variant="primary"
            onClick={handleOpenFolder}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconWrapper $variant="primary">
              <FolderOpen />
            </IconWrapper>
            <FeatureTitle>Open Project</FeatureTitle>
            <FeatureDescription>
              Open an existing project and let AI understand your codebase for intelligent
              assistance
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard
            $variant="secondary"
            onClick={handleCreateFile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconWrapper $variant="secondary">
              <FileText />
            </IconWrapper>
            <FeatureTitle>New File</FeatureTitle>
            <FeatureDescription>
              Create a new file and start coding with AI-powered completions and suggestions
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <IconWrapper>
              <MessageSquare />
            </IconWrapper>
            <FeatureTitle>AI Assistant</FeatureTitle>
            <FeatureDescription>
              Chat with DeepSeek AI to get help with coding, debugging, and explanations
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <IconWrapper $variant="primary">
              <Sparkles />
            </IconWrapper>
            <FeatureTitle>Smart Features</FeatureTitle>
            <FeatureDescription>
              Experience intelligent code completion, refactoring, and generation powered by AI
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>

        <QuickStartSection>
          <QuickStartTitle>Quick Start</QuickStartTitle>

          {isIndexing && (
            <LoadingIndicator>
              <p style={{ color: vibeTheme.colors.textSecondary }}>
                Indexing workspace... {Math.round(indexingProgress)}%
              </p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${indexingProgress}%` }} />
              </div>
            </LoadingIndicator>
          )}

          <QuickActions>
            <ActionButton
              $variant="primary"
              onClick={() => onCreateFile('Component.tsx')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code />
              React Component
            </ActionButton>

            <ActionButton
              onClick={() => onCreateFile('script.py')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Cpu />
              Python Script
            </ActionButton>

            <ActionButton
              onClick={() => onCreateFile('api.ts')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap />
              API Endpoint
            </ActionButton>

            <ActionButton
              onClick={handleOpenFolder}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github />
              Clone Repo
            </ActionButton>
          </QuickActions>
        </QuickStartSection>
      </MainContent>
    </Container>
  );
};

export default WelcomeScreen;
