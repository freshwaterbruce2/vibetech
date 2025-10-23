import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import WelcomeScreen from './WelcomeScreen';
import TypingIndicator from './TypingIndicator';

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.surface};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (max-width: 768px) {
    padding: 16px 12px;
    gap: 12px;
  }
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  
  @media (max-width: 768px) {
    max-width: 85%;
  }
  
  .bubble {
    background: ${props => props.isUser ? props.theme.primary : props.theme.background};
    color: ${props => props.isUser ? 'white' : props.theme.text};
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-${props => props.isUser ? 'right' : 'left'}-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: ${props => props.isUser ? 'none' : `1px solid ${props.theme.border}`};
  }
  
  .timestamp {
    font-size: 12px;
    color: ${props => props.theme.textSecondary};
    margin-top: 4px;
    text-align: ${props => props.isUser ? 'right' : 'left'};
  }
`;

const InputContainer = styled.form`
  display: flex;
  padding: 20px;
  gap: 12px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surface};
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 16px 12px;
    gap: 8px;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 24px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.primary};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 16px; /* Prevent zoom on iOS */
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
  }
`;

const VoiceButton = styled(Button)<{ isListening: boolean }>`
  background: ${props => props.isListening ? '#ff4444' : props.theme.primary};
  padding: 12px;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  isLoading?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isListening, onToggleVoice, isLoading = false }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0) {
    return (
      <ChatContainer>
        <WelcomeScreen onSuggestionClick={onSendMessage} />
        <InputContainer onSubmit={handleSubmit}>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask NOVA anything..."
            disabled={isListening}
          />
          <VoiceButton
            type="button"
            onClick={onToggleVoice}
            isListening={isListening}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            )}
          </VoiceButton>
          <Button type="submit" disabled={!input.trim() || isListening}>
            Send
          </Button>
        </InputContainer>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((message) => (
          <MessageBubble key={message.id} isUser={message.role === 'user'}>
            <div className="bubble">
              {message.role === 'user' ? (
                message.content
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
            <div className="timestamp">{formatTime(message.timestamp)}</div>
          </MessageBubble>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer onSubmit={handleSubmit}>
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask NOVA anything..."
          disabled={isListening}
        />
        <VoiceButton
          type="button"
          onClick={onToggleVoice}
          isListening={isListening}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          )}
        </VoiceButton>
        <Button type="submit" disabled={!input.trim() || isListening}>
          Send
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;