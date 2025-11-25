import React from 'react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { MessagePart, parseMessageSafely, validateMessageContent } from '../utils/messageFormatter';

const MessageContainer = styled.div<{ role: 'user' | 'assistant' }>`
  background: ${(props) =>
    props.role === 'user'
      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)'
      : 'rgba(26, 26, 46, 0.8)'};
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: 1px solid
    ${(props) => (props.role === 'user' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)')};
  backdrop-filter: blur(10px);
  box-shadow: ${vibeTheme.shadows.small};
`;

const CodeBlock = styled.pre`
  background: ${vibeTheme.colors.primary};
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.small};
  padding: ${vibeTheme.spacing.md};
  overflow-x: auto;
  margin: ${vibeTheme.spacing.sm} 0;
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.xs};
  box-shadow: ${vibeTheme.shadows.small};
  max-width: 100%;

  code {
    background: none;
    padding: 0;
    color: ${vibeTheme.colors.text};
    font-family: inherit;
  }
`;

const InlineCode = styled.code`
  background: rgba(139, 92, 246, 0.2);
  padding: 2px ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.cyan};
`;

const BoldText = styled.strong`
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
`;

const ItalicText = styled.em`
  font-style: italic;
  color: ${vibeTheme.colors.textSecondary};
`;

const HeaderText = styled.h3`
  color: ${vibeTheme.colors.cyan};
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  margin: ${vibeTheme.spacing.sm} 0;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: ${vibeTheme.colors.error};
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.xs};
`;

interface SecureMessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

const SecureMessageContent: React.FC<SecureMessageContentProps> = ({ content, role }) => {
  // Validate content first
  if (!validateMessageContent(content)) {
    return (
      <MessageContainer role= { role } >
      <ErrorMessage>
          ⚠️ Message blocked: potentially unsafe content detected
  </ErrorMessage>
  </MessageContainer>
    );
  }

// Parse content into safe parts
const messageParts = parseMessageSafely(content);

const renderPart = (part: MessagePart, index: number): React.ReactNode => {
  switch (part.type) {
    case 'codeblock':
      return (
        <CodeBlock key= { index } >
        <code className={ `language-${part.language}` }>
          { part.content }
          </code>
          </CodeBlock>
        );
      
      case 'code':
return (
  <InlineCode key= { index } >
  { part.content }
  </InlineCode>
        );
      
      case 'bold':
return (
  <BoldText key= { index } >
  { part.content }
  </BoldText>
        );
      
      case 'italic':
return (
  <ItalicText key= { index } >
  { part.content }
  </ItalicText>
        );
      
      case 'header':
return (
  <HeaderText key= { index } >
  { part.content }
  </HeaderText>
        );
      
      case 'text':
      default:
// Split by line breaks and render each line
return part.content.split('\n').map((line, lineIndex) => (
  <React.Fragment key= {`${index}-${lineIndex}`}>
{ line }
            { lineIndex<part.content.split('\n').length - 1 && <br /> }
  </React.Fragment>
));
    }
  };

return (
  <MessageContainer role= { role } >
  { messageParts.map((part, index) => renderPart(part, index)) as any }
  </MessageContainer>
  );
};

export default SecureMessageContent;