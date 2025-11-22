/**
 * Event Name Constants
 * Centralized event identifiers for CustomEvents and window.addEventListener
 */

export const APP_EVENTS = {
  // API Key Management
  API_KEY_UPDATED: 'apiKeyUpdated',
  API_KEY_REMOVED: 'apiKeyRemoved',

  // AI Model Events
  MODEL_CHANGED: 'modelChanged',
  MODEL_LOADING: 'modelLoading',
  MODEL_LOADED: 'modelLoaded',
  MODEL_ERROR: 'modelError',

  // Workspace Events
  WORKSPACE_OPENED: 'workspaceOpened',
  WORKSPACE_CLOSED: 'workspaceClosed',
  WORKSPACE_INDEXED: 'workspaceIndexed',

  // File Events
  FILE_OPENED: 'fileOpened',
  FILE_SAVED: 'fileSaved',
  FILE_CLOSED: 'fileClosed',
  FILE_CHANGED: 'fileChanged',

  // Editor Events
  EDITOR_READY: 'editorReady',
  EDITOR_FOCUS: 'editorFocus',
  EDITOR_BLUR: 'editorBlur',

  // AI Completion Events
  COMPLETION_REQUESTED: 'completionRequested',
  COMPLETION_RECEIVED: 'completionReceived',
  COMPLETION_ACCEPTED: 'completionAccepted',
  COMPLETION_REJECTED: 'completionRejected',

  // Settings Events
  SETTINGS_CHANGED: 'settingsChanged',
  THEME_CHANGED: 'themeChanged',

  // Error Events
  ERROR_OCCURRED: 'errorOccurred',
  ERROR_RECOVERED: 'errorRecovered',
} as const;

export type AppEventName = typeof APP_EVENTS[keyof typeof APP_EVENTS];

/**
 * Type-safe event dispatcher
 */
export function dispatchAppEvent(eventName: AppEventName, detail?: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
      })
    );
  }
}

/**
 * Type-safe event listener
 */
export function addAppEventListener(
  eventName: AppEventName,
  handler: (event: CustomEvent) => void
): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener(eventName, handler as EventListener);

    // Return cleanup function
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
    };
  }

  // Return no-op cleanup for SSR
  return () => {};
}
