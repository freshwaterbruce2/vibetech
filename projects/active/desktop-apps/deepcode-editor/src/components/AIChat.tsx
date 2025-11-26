/**
 * AIChat Component
 * Re-exports the modularized AIChat component for backward compatibility
 * 
 * The component has been modularized into:
 * - AIChat/types.ts: Type definitions and constants
 * - AIChat/styled.ts: Styled components
 * - AIChat/useChatState.ts: State management hook  
 * - AIChat/StepCard.tsx: Agent step visualization
 * - AIChat/MessageItem.tsx: Message rendering
 * - AIChat/AIChat.tsx: Main component facade
 */
export { default, AIChat } from './AIChat/index';
export type { AIChatProps, ChatMode } from './AIChat/index';
