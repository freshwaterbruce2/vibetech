import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type {
  Session,
  CreateSessionInput,
  EndSessionInput,
} from '../lib/api/sessions';
import {
  startSession,
  endSession,
  getSessions
} from '../lib/api/sessions';

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  targetDuration: number; // in seconds (e.g., 25 * 60 for 25 minutes)
}

interface SessionState {
  // State
  currentSession: Session | null;
  sessions: Session[];
  timer: TimerState;
  isLoading: boolean;
  error: string | null;

  // Computed getters
  timeRemaining: number; // in seconds
  progressPercentage: number; // 0-100
  isSessionActive: boolean;

  // Actions
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  setTimer: (timer: Partial<TimerState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Timer actions
  startTimer: (targetDuration?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  updateElapsedTime: () => void;

  // API operations
  loadSessions: (taskId?: string) => Promise<void>;
  createSession: (input: CreateSessionInput) => Promise<Session | null>;
  finishSession: (sessionId: string, input: EndSessionInput) => Promise<Session | null>;
  startNewSession: (taskId?: string, notes?: string, targetDuration?: number) => Promise<Session | null>;
  stopCurrentSession: (notes?: string, qualityRating?: number) => Promise<Session | null>;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        currentSession: null,
        sessions: [],
        timer: {
          isRunning: false,
          startTime: null,
          elapsedTime: 0,
          targetDuration: 25 * 60, // Default 25 minutes
        },
        isLoading: false,
        error: null,

        // Computed getters
        get timeRemaining() {
          const { timer } = get();
          return Math.max(0, timer.targetDuration - timer.elapsedTime);
        },

        get progressPercentage() {
          const { timer } = get();
          if (timer.targetDuration === 0) return 0;
          return Math.min(100, (timer.elapsedTime / timer.targetDuration) * 100);
        },

        get isSessionActive() {
          const { currentSession } = get();
          return currentSession !== null && !currentSession.end_at;
        },

        // Basic setters
        setCurrentSession: (currentSession) =>
          set({ currentSession }, false, 'setCurrentSession'),

        setSessions: (sessions) =>
          set({ sessions }, false, 'setSessions'),

        setTimer: (timerUpdate) =>
          set(
            (state) => ({
              timer: { ...state.timer, ...timerUpdate }
            }),
            false,
            'setTimer'
          ),

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'setLoading'),

        setError: (error) =>
          set({ error }, false, 'setError'),

        // Timer actions
        startTimer: (targetDuration) => {
          const { setTimer } = get();
          setTimer({
            isRunning: true,
            startTime: new Date(),
            elapsedTime: 0,
            targetDuration: targetDuration || get().timer.targetDuration
          });
        },

        pauseTimer: () => {
          const { timer, setTimer, updateElapsedTime } = get();
          if (timer.isRunning) {
            updateElapsedTime();
            setTimer({
              isRunning: false,
              startTime: null
            });
          }
        },

        resumeTimer: () => {
          const { timer, setTimer } = get();
          if (!timer.isRunning) {
            setTimer({
              isRunning: true,
              startTime: new Date()
            });
          }
        },

        stopTimer: () => {
          const { setTimer } = get();
          setTimer({
            isRunning: false,
            startTime: null,
            elapsedTime: 0
          });
        },

        updateElapsedTime: () => {
          const { timer, setTimer } = get();
          if (timer.isRunning && timer.startTime) {
            const now = new Date();
            const additionalTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
            setTimer({
              elapsedTime: timer.elapsedTime + additionalTime,
              startTime: now
            });
          }
        },

        // API operations
        loadSessions: async (taskId) => {
          const { setLoading, setError, setSessions } = get();

          try {
            setLoading(true);
            setError(null);
            const sessions = await getSessions(taskId);
            setSessions(sessions);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to load sessions';
            setError(errorMsg);
            console.error('Failed to load sessions:', error);
          } finally {
            setLoading(false);
          }
        },

        createSession: async (input: CreateSessionInput) => {
          const { setError, sessions, setSessions } = get();

          try {
            setError(null);
            const newSession = await startSession(input);
            setSessions([newSession, ...sessions]);
            return newSession;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create session';
            setError(errorMsg);
            console.error('Failed to create session:', error);
            return null;
          }
        },

        finishSession: async (sessionId: string, input: EndSessionInput) => {
          const { setError, sessions, setSessions, currentSession, setCurrentSession } = get();

          try {
            setError(null);
            const finishedSession = await endSession(sessionId, input);

            // Update sessions array
            const updatedSessions = sessions.map(session =>
              session.id === sessionId ? finishedSession : session
            );
            setSessions(updatedSessions);

            // Clear current session if it was the finished one
            if (currentSession && currentSession.id === sessionId) {
              setCurrentSession(null);
            }

            return finishedSession;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to finish session';
            setError(errorMsg);
            console.error('Failed to finish session:', error);
            return null;
          }
        },

        startNewSession: async (taskId, notes, targetDuration) => {
          const { createSession, setCurrentSession, startTimer } = get();

          try {
            const sessionInput: CreateSessionInput = {
              task_id: taskId,
              notes
            };

            const newSession = await createSession(sessionInput);
            if (newSession) {
              setCurrentSession(newSession);
              startTimer(targetDuration);
            }
            return newSession;
          } catch (error) {
            console.error('Failed to start new session:', error);
            return null;
          }
        },

        stopCurrentSession: async (notes, qualityRating) => {
          const { currentSession, finishSession, stopTimer, updateElapsedTime } = get();

          if (!currentSession) {
            return null;
          }

          try {
            // Update elapsed time one final time
            updateElapsedTime();

            const endInput: EndSessionInput = {
              notes,
              quality_rating: qualityRating
            };

            const finishedSession = await finishSession(currentSession.id, endInput);
            stopTimer();
            return finishedSession;
          } catch (error) {
            console.error('Failed to stop current session:', error);
            return null;
          }
        },
      })
    ),
    {
      name: 'session-store',
    }
  )
);

// Auto-update timer every second when running
let timerInterval: NodeJS.Timeout | null = null;

useSessionStore.subscribe(
  (state) => state.timer.isRunning,
  (isRunning) => {
    if (isRunning) {
      timerInterval = setInterval(() => {
        useSessionStore.getState().updateElapsedTime();
      }, 1000);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  }
);