import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  FolderOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { WorkspaceContext } from '../types';

interface WelcomeScreenProps {
  onOpenFolder: (folderPath: string) => void;
  onCreateFile: (fileName: string) => void;
  onOpenAIChat?: () => void;
  onShowSettings?: () => void;
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
  font-weight: ${vibeTheme.typography.fontWeight.extrabold};
  background: ${vibeTheme.gradients.primary};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 ${vibeTheme.spacing[3]} 0;
  font-family: ${vibeTheme.typography.fontFamily.primary};
  letter-spacing: ${vibeTheme.typography.letterSpacing.tight};
  line-height: ${vibeTheme.typography.lineHeight.tight};
  text-shadow: 0 0 40px rgba(139, 92, 246, 0.3);

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 3px;
    background: ${vibeTheme.gradients.primary};
    margin: ${vibeTheme.spacing[6]} auto;
    border-radius: ${vibeTheme.borderRadius.full};
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${vibeTheme.spacing.lg};
  max-width: 1100px;
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
  padding: ${vibeTheme.spacing.lg};
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
  width: 48px;
  height: 48px;
  border-radius: ${vibeTheme.borderRadius.medium};
  background: ${(props) =>
    props.$variant === 'primary' ? vibeTheme.gradients.primary : vibeTheme.gradients.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${vibeTheme.spacing.sm};
  animation: ${float} 3s ease-in-out infinite;

  svg {
    width: 24px;
    height: 24px;
    color: ${vibeTheme.colors.text};
  }
`;

const FeatureTitle = styled.h3`
  font-size: ${vibeTheme.typography.fontSize.xl};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};
  margin: 0 0 ${vibeTheme.spacing.xs} 0;
`;

const FeatureDescription = styled.p`
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
  line-height: 1.5;
  margin: 0;
`;

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
  margin: ${vibeTheme.spacing.xl} auto 0;
  max-width: 300px;

  p {
    font-size: ${vibeTheme.typography.fontSize.sm};
    color: ${vibeTheme.colors.textSecondary};
    margin: 0;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
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
  onOpenAIChat,
  onShowSettings,
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
        <Title>Vibe Code Studio</Title>
        <Subtitle>
          Next-Generation AI-Powered Development Experience
          <br />
          Where innovation meets elegant design
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

          <FeatureCard
            onClick={onOpenAIChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconWrapper>
              <MessageSquare />
            </IconWrapper>
            <FeatureTitle>AI Assistant</FeatureTitle>
            <FeatureDescription>
              Chat with AI to get help with coding, debugging, and explanations
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard
            onClick={onShowSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <IconWrapper $variant="primary">
              <Sparkles />
            </IconWrapper>
            <FeatureTitle>Smart Features</FeatureTitle>
            <FeatureDescription>
              Configure AI models and settings to enable intelligent code features
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>

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
      </MainContent>
    </Container>
  );
};

export default WelcomeScreen;
