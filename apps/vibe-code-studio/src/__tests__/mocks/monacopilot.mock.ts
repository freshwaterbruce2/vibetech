/**
 * Monacopilot Mock for Tests
 * Provides minimal mock for inline completion registration
 */

export interface CompletionRegistration {
  deregister: () => void;
}

export const registerCompletion = (): CompletionRegistration => {
  return {
    deregister: () => {},
  };
};
