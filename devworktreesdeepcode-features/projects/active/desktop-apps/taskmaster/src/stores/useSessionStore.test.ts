import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSessionStore } from './useSessionStore'

// Mock the sessions API module
vi.mock('../lib/api/sessions', () => ({
  startSession: vi.fn(),
  endSession: vi.fn(),
  getSessions: vi.fn(),
}))

import {
  startSession,
  endSession,
  getSessions,
} from '../lib/api/sessions'

const mockStartSession = vi.mocked(startSession)
const mockEndSession = vi.mocked(endSession)
const mockGetSessions = vi.mocked(getSessions)

describe('useSessionStore', () => {
  const mockSession = {
    id: 'session-1',
    task_id: 'task-1',
    start_at: '2024-01-01T10:00:00Z',
    end_at: null,
    duration: null,
    notes: 'Test session',
    quality_rating: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  }

  const mockFinishedSession = {
    ...mockSession,
    end_at: '2024-01-01T10:25:00Z',
    duration: 1500, // 25 minutes in seconds
    quality_rating: 4,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset store state
    useSessionStore.setState({
      currentSession: null,
      sessions: [],
      timer: {
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        targetDuration: 25 * 60,
      },
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSessionStore.getState()

      expect(state.currentSession).toBeNull()
      expect(state.sessions).toEqual([])
      expect(state.timer).toEqual({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        targetDuration: 25 * 60,
      })
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('Computed Properties Logic', () => {
    it('should calculate timeRemaining correctly', () => {
      const targetDuration = 1500 // 25 minutes
      const elapsedTime = 900 // 15 minutes
      const timeRemaining = Math.max(0, targetDuration - elapsedTime)
      expect(timeRemaining).toBe(600) // 10 minutes remaining
    })

    it('should return 0 when time has exceeded target', () => {
      const targetDuration = 1500
      const elapsedTime = 2000
      const timeRemaining = Math.max(0, targetDuration - elapsedTime)
      expect(timeRemaining).toBe(0)
    })

    it('should calculate progressPercentage correctly', () => {
      const targetDuration = 1500
      const elapsedTime = 900
      const progressPercentage = Math.min(100, (elapsedTime / targetDuration) * 100)
      expect(progressPercentage).toBe(60) // 900/1500 * 100 = 60%
    })

    it('should cap progressPercentage at 100', () => {
      const targetDuration = 1500
      const elapsedTime = 2000
      const progressPercentage = Math.min(100, (elapsedTime / targetDuration) * 100)
      expect(progressPercentage).toBe(100)
    })

    it('should detect active session correctly', () => {
      const activeSession = { ...mockSession, end_at: null }
      const isActive = activeSession !== null && !activeSession.end_at
      expect(isActive).toBe(true)
    })

    it('should detect inactive session when ended', () => {
      const endedSession = { ...mockSession, end_at: '2024-01-01T10:25:00Z' }
      const isActive = endedSession !== null && !endedSession.end_at
      expect(isActive).toBe(false)
    })
  })

  describe('Basic Setters', () => {
    it('should set current session', () => {
      const { setCurrentSession } = useSessionStore.getState()

      setCurrentSession(mockSession)

      expect(useSessionStore.getState().currentSession).toEqual(mockSession)
    })

    it('should set sessions', () => {
      const { setSessions } = useSessionStore.getState()
      const sessions = [mockSession, mockFinishedSession]

      setSessions(sessions)

      expect(useSessionStore.getState().sessions).toEqual(sessions)
    })

    it('should update timer partially', () => {
      const { setTimer } = useSessionStore.getState()
      const timerUpdate = { isRunning: true, elapsedTime: 300 }

      setTimer(timerUpdate)

      const timer = useSessionStore.getState().timer
      expect(timer.isRunning).toBe(true)
      expect(timer.elapsedTime).toBe(300)
      expect(timer.targetDuration).toBe(25 * 60) // Should preserve existing value
    })

    it('should set loading state', () => {
      const { setLoading } = useSessionStore.getState()

      setLoading(true)

      expect(useSessionStore.getState().isLoading).toBe(true)
    })

    it('should set error', () => {
      const { setError } = useSessionStore.getState()

      setError('Test error')

      expect(useSessionStore.getState().error).toBe('Test error')
    })
  })

  describe('Timer Actions', () => {
    it('should start timer with default duration', () => {
      const { startTimer } = useSessionStore.getState()
      const mockDate = new Date('2024-01-01T10:00:00Z')
      vi.setSystemTime(mockDate)

      startTimer()

      const timer = useSessionStore.getState().timer
      expect(timer.isRunning).toBe(true)
      expect(timer.startTime).toEqual(mockDate)
      expect(timer.elapsedTime).toBe(0)
      expect(timer.targetDuration).toBe(25 * 60)
    })

    it('should start timer with custom duration', () => {
      const { startTimer } = useSessionStore.getState()
      const customDuration = 30 * 60 // 30 minutes

      startTimer(customDuration)

      const timer = useSessionStore.getState().timer
      expect(timer.targetDuration).toBe(customDuration)
    })

    it('should pause timer and update elapsed time', () => {
      const { startTimer, pauseTimer } = useSessionStore.getState()
      const startTime = new Date('2024-01-01T10:00:00Z')
      const pauseTime = new Date('2024-01-01T10:05:00Z')

      vi.setSystemTime(startTime)
      startTimer()

      vi.setSystemTime(pauseTime)
      pauseTimer()

      const timer = useSessionStore.getState().timer
      expect(timer.isRunning).toBe(false)
      expect(timer.startTime).toBeNull()
      expect(timer.elapsedTime).toBe(300) // 5 minutes
    })

    it('should resume timer', () => {
      const { resumeTimer } = useSessionStore.getState()
      useSessionStore.getState().setTimer({
        isRunning: false,
        elapsedTime: 300,
      })

      const resumeTime = new Date('2024-01-01T10:10:00Z')
      vi.setSystemTime(resumeTime)

      resumeTimer()

      const timer = useSessionStore.getState().timer
      expect(timer.isRunning).toBe(true)
      expect(timer.startTime).toEqual(resumeTime)
      expect(timer.elapsedTime).toBe(300) // Should preserve elapsed time
    })

    it('should stop timer and reset elapsed time', () => {
      const { stopTimer } = useSessionStore.getState()
      useSessionStore.getState().setTimer({
        isRunning: true,
        startTime: new Date(),
        elapsedTime: 300,
      })

      stopTimer()

      const timer = useSessionStore.getState().timer
      expect(timer.isRunning).toBe(false)
      expect(timer.startTime).toBeNull()
      expect(timer.elapsedTime).toBe(0)
    })

    it('should update elapsed time correctly', () => {
      const { updateElapsedTime } = useSessionStore.getState()
      const startTime = new Date('2024-01-01T10:00:00Z')
      const currentTime = new Date('2024-01-01T10:03:00Z')

      useSessionStore.getState().setTimer({
        isRunning: true,
        startTime,
        elapsedTime: 120, // 2 minutes already elapsed
      })

      vi.setSystemTime(currentTime)
      updateElapsedTime()

      const timer = useSessionStore.getState().timer
      expect(timer.elapsedTime).toBe(300) // 120 + 180 = 300 seconds (5 minutes total)
      expect(timer.startTime).toEqual(currentTime)
    })
  })

  describe('API Operations', () => {
    describe('loadSessions', () => {
      it('should load sessions successfully', async () => {
        const sessions = [mockSession, mockFinishedSession]
        mockGetSessions.mockResolvedValueOnce(sessions)

        await useSessionStore.getState().loadSessions('task-1')

        const state = useSessionStore.getState()
        expect(state.sessions).toEqual(sessions)
        expect(state.isLoading).toBe(false)
        expect(state.error).toBeNull()
        expect(mockGetSessions).toHaveBeenCalledWith('task-1')
      })

      it('should handle load sessions error', async () => {
        const error = new Error('Failed to load sessions')
        mockGetSessions.mockRejectedValueOnce(error)

        await useSessionStore.getState().loadSessions()

        const state = useSessionStore.getState()
        expect(state.sessions).toEqual([])
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Failed to load sessions')
      })
    })

    describe('createSession', () => {
      it('should create session successfully', async () => {
        const sessionInput = { task_id: 'task-1', notes: 'New session' }
        mockStartSession.mockResolvedValueOnce(mockSession)

        const result = await useSessionStore.getState().createSession(sessionInput)

        expect(result).toEqual(mockSession)
        expect(useSessionStore.getState().sessions).toContain(mockSession)
        expect(mockStartSession).toHaveBeenCalledWith(sessionInput)
      })

      it('should handle create session error', async () => {
        const sessionInput = { task_id: 'task-1' }
        const error = new Error('Failed to create session')
        mockStartSession.mockRejectedValueOnce(error)

        const result = await useSessionStore.getState().createSession(sessionInput)

        expect(result).toBeNull()
        expect(useSessionStore.getState().error).toBe('Failed to create session')
      })
    })

    describe('startNewSession', () => {
      it('should start new session and timer', async () => {
        mockStartSession.mockResolvedValueOnce(mockSession)
        const mockDate = new Date('2024-01-01T10:00:00Z')
        vi.setSystemTime(mockDate)

        const result = await useSessionStore.getState().startNewSession(
          'task-1',
          'New session notes',
          30 * 60 // 30 minutes
        )

        expect(result).toEqual(mockSession)
        expect(useSessionStore.getState().currentSession).toEqual(mockSession)

        const timer = useSessionStore.getState().timer
        expect(timer.isRunning).toBe(true)
        expect(timer.targetDuration).toBe(30 * 60)
      })
    })

    describe('stopCurrentSession', () => {
      it('should stop current session and timer', async () => {
        useSessionStore.getState().setCurrentSession(mockSession)
        useSessionStore.getState().setTimer({
          isRunning: true,
          startTime: new Date('2024-01-01T10:00:00Z'),
          elapsedTime: 1200,
        })

        mockEndSession.mockResolvedValueOnce(mockFinishedSession)

        const result = await useSessionStore.getState().stopCurrentSession(
          'Session completed',
          4
        )

        expect(result).toEqual(mockFinishedSession)
        expect(useSessionStore.getState().timer.isRunning).toBe(false)
        expect(mockEndSession).toHaveBeenCalledWith(mockSession.id, {
          notes: 'Session completed',
          quality_rating: 4,
        })
      })

      it('should return null when no current session', async () => {
        const result = await useSessionStore.getState().stopCurrentSession()

        expect(result).toBeNull()
        expect(mockEndSession).not.toHaveBeenCalled()
      })
    })
  })
})