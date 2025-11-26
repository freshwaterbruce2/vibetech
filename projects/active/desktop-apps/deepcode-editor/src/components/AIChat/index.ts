/**
 * AIChat Module
 * Modular AI chat interface with chat, agent, and composer modes
 */
export { default as AIChat, default } from './AIChat';
export type { AIChatProps, ChatMode, ModeInfo, MessageItemProps, MemoizedStepCardProps } from './types';
export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH } from './types';
export { useChatState, MODE_INFO } from './useChatState';
export { MemoizedStepCard, getStepIcon } from './StepCard';
export { MessageItem, TypingMessage, formatTime, copyToClipboard } from './MessageItem';
