import type { AIProvider } from './provider';
import { DeepSeekProvider } from './deepseek';
import { LocalHeuristicProvider } from './local-heuristic';

export * from './provider';
export { DeepSeekProvider } from './deepseek';
export { LocalHeuristicProvider } from './local-heuristic';

let aiProvider: AIProvider | null = null;

export function initializeAIProvider(apiKey?: string): AIProvider {
  if (apiKey) {
    aiProvider = new DeepSeekProvider(apiKey);
  } else {
    aiProvider = new LocalHeuristicProvider();
  }
  return aiProvider;
}

export function getAIProvider(): AIProvider {
  if (!aiProvider) {
    aiProvider = new LocalHeuristicProvider();
  }
  return aiProvider;
}