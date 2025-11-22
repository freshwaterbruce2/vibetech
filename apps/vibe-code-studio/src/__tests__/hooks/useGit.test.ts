import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGit } from '@/hooks/useGit'
import { GitService } from '@/services/GitService'

// Mock GitService
vi.mock('@/services/GitService', () => ({
  GitService: vi.fn().mockImplementation(() => ({
    isGitRepository: vi.fn(),
    getStatus: vi.fn(),
    getLog: vi.fn(),
    getBranches: vi.fn(),
    getRemotes: vi.fn(),
    init: vi.fn(),
    add: vi.fn(),
    addAll: vi.fn(),
    reset: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    createBranch: vi.fn(),
    checkout: vi.fn(),
    stash: vi.fn(),
    stashPop: vi.fn(),
    discardChanges: vi.fn()
  }))
}))

describe('useGit', () => {
  let mockGitService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGitService = new GitService()
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useGit('/test/repo'))
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isGitRepo).toBe(false)
    expect(result.current.status).toBe(null)
  })

  it('checks if directory is a git repository on mount', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.getStatus.mockResolvedValue({
      branch: 'main',
      isClean: true,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      ahead: 0,
      behind: 0
    })
    mockGitService.getLog.mockResolvedValue([])
    mockGitService.getBranches.mockResolvedValue([])
    mockGitService.getRemotes.mockResolvedValue([])

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isGitRepo).toBe(true)
    expect(mockGitService.isGitRepository).toHaveBeenCalled()
  })

  it('handles non-git repository', async () => {
    mockGitService.isGitRepository.mockResolvedValue(false)

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isGitRepo).toBe(false)
    expect(result.current.status).toBe(null)
    expect(mockGitService.getStatus).not.toHaveBeenCalled()
  })

  it('refreshes git data', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.getStatus.mockResolvedValue({
      branch: 'main',
      isClean: false,
      modified: ['file1.ts'],
      added: ['file2.ts'],
      deleted: [],
      untracked: ['file3.ts'],
      ahead: 1,
      behind: 0
    })
    mockGitService.getLog.mockResolvedValue([
      {
        hash: 'abc123',
        author: 'Test User',
        date: new Date(),
        message: 'Test commit'
      }
    ])
    mockGitService.getBranches.mockResolvedValue([
      { name: 'main', isCurrent: true, isRemote: false },
      { name: 'feature', isCurrent: false, isRemote: false }
    ])
    mockGitService.getRemotes.mockResolvedValue([
      { name: 'origin', url: 'https://github.com/test/repo.git' }
    ])

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.status).toEqual({
      branch: 'main',
      isClean: false,
      modified: ['file1.ts'],
      added: ['file2.ts'],
      deleted: [],
      untracked: ['file3.ts'],
      ahead: 1,
      behind: 0
    })
    expect(result.current.commits).toHaveLength(1)
    expect(result.current.branches).toHaveLength(2)
    expect(result.current.remotes).toHaveLength(1)
  })

  it('initializes git repository', async () => {
    mockGitService.isGitRepository.mockResolvedValue(false)
    mockGitService.init.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.init()
    })

    expect(mockGitService.init).toHaveBeenCalled()
  })

  it('stages files', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.add.mockResolvedValue(undefined)
    mockGitService.getStatus.mockResolvedValue({
      branch: 'main',
      isClean: true,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      ahead: 0,
      behind: 0
    })

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.add('test.ts')
    })

    expect(mockGitService.add).toHaveBeenCalledWith('test.ts')
    expect(mockGitService.getStatus).toHaveBeenCalledTimes(2) // Initial + after add
  })

  it('commits changes', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.commit.mockResolvedValue('abc123')
    mockGitService.getStatus.mockResolvedValue({
      branch: 'main',
      isClean: true,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      ahead: 0,
      behind: 0
    })
    mockGitService.getLog.mockResolvedValue([])

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.commit('Test commit message')
    })

    expect(mockGitService.commit).toHaveBeenCalledWith('Test commit message')
    expect(mockGitService.getStatus).toHaveBeenCalled()
    expect(mockGitService.getLog).toHaveBeenCalled()
  })

  it('handles errors gracefully', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.getStatus.mockRejectedValue(new Error('Git error'))

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Git error')
  })

  it('creates and checks out branches', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.createBranch.mockResolvedValue(undefined)
    mockGitService.checkout.mockResolvedValue(undefined)
    mockGitService.getBranches.mockResolvedValue([])

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createBranch('feature/new')
    })

    expect(mockGitService.createBranch).toHaveBeenCalledWith('feature/new')

    await act(async () => {
      await result.current.checkout('main')
    })

    expect(mockGitService.checkout).toHaveBeenCalledWith('main')
  })

  it('performs push and pull operations', async () => {
    mockGitService.isGitRepository.mockResolvedValue(true)
    mockGitService.push.mockResolvedValue(undefined)
    mockGitService.pull.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGit('/test/repo'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.push('origin', 'main')
    })

    expect(mockGitService.push).toHaveBeenCalledWith('origin', 'main')

    await act(async () => {
      await result.current.pull('origin', 'main')
    })

    expect(mockGitService.pull).toHaveBeenCalledWith('origin', 'main')
  })
})