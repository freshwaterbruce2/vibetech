import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitPanel } from '@/components/GitPanel';

// Mock the useGit hook
vi.mock('@/hooks/useGit', () => ({
  useGit: vi.fn(() => ({
    isGitRepo: true,
    status: {
      branch: 'main',
      isClean: false,
      modified: ['src/app.ts', 'src/index.ts'],
      added: [],
      deleted: [],
      untracked: ['new-file.ts'],
      ahead: 2,
      behind: 1,
    },
    branches: [
      { name: 'main', isCurrent: true, isRemote: false },
      { name: 'feature/test', isCurrent: false, isRemote: false },
      { name: 'origin/main', isCurrent: false, isRemote: true },
    ],
    commits: [],
    remotes: [{ name: 'origin', url: 'https://github.com/test/repo.git' }],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    init: vi.fn(),
    add: vi.fn(),
    reset: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    createBranch: vi.fn(),
    checkout: vi.fn(),
    stash: vi.fn(),
    stashPop: vi.fn(),
    discardChanges: vi.fn(),
  })),
}));

import { useGit } from '@/hooks/useGit';

// Helper to create a complete UseGitReturn mock
const createMockGitReturn = (
  overrides?: Partial<ReturnType<typeof useGit>>
): ReturnType<typeof useGit> => ({
  isGitRepo: false,
  status: null,
  commits: [],
  branches: [],
  remotes: [],
  isLoading: false,
  error: null,
  refresh: vi.fn(),
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
  discardChanges: vi.fn(),
  ...overrides,
});

describe('GitPanel', () => {
  const mockUseGit = vi.mocked(useGit);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders git panel with status', () => {
    render(<GitPanel />);

    expect(screen.getByText('Source Control')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseGit.mockReturnValue(
      createMockGitReturn({
        isLoading: true,
      })
    );

    render(<GitPanel />);

    // Check for loading state - RefreshCw icon should be spinning
    const refreshIcon = screen.getByRole('img', { hidden: true });
    expect(refreshIcon).toBeInTheDocument();
  });

  it('shows not a git repository state', () => {
    mockUseGit.mockReturnValue(
      createMockGitReturn({
        isGitRepo: false,
      })
    );

    render(<GitPanel />);

    expect(screen.getByText('Not a Git repository')).toBeInTheDocument();
    expect(screen.getByText('Initialize Git Repository')).toBeInTheDocument();
  });

  it('initializes git repository when button clicked', async () => {
    const mockInit = vi.fn();
    mockUseGit.mockReturnValue(
      createMockGitReturn({
        isGitRepo: false,
        init: mockInit,
      })
    );

    render(<GitPanel />);

    const initButton = screen.getByText('Initialize Git Repository');
    fireEvent.click(initButton);

    expect(mockInit).toHaveBeenCalled();
  });

  it('displays modified files', () => {
    render(<GitPanel />);

    expect(screen.getByText('Changes')).toBeInTheDocument();
    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
  });

  it('displays untracked files', () => {
    render(<GitPanel />);

    expect(screen.getByText('Untracked Files')).toBeInTheDocument();
    expect(screen.getByText('new-file.ts')).toBeInTheDocument();
  });

  it('stages file when plus button clicked', async () => {
    const mockAdd = vi.fn();
    mockUseGit.mockReturnValueOnce(
      createMockGitReturn({
        isGitRepo: true,
        status: {
          branch: 'main',
          isClean: false,
          modified: ['src/app.ts'],
          added: [],
          deleted: [],
          untracked: [],
          ahead: 0,
          behind: 0,
        },
        branches: [{ name: 'main', isCurrent: true, isRemote: false }],
        add: mockAdd,
      })
    );

    render(<GitPanel />);

    const stageButtons = screen.getAllByTitle('Stage');
    fireEvent.click(stageButtons[0]);

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith('src/app.ts');
    });
  });

  it('discards changes when X button clicked with confirmation', async () => {
    const mockDiscardChanges = vi.fn();
    window.confirm = vi.fn(() => true);

    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      discardChanges: mockDiscardChanges,
    });

    render(<GitPanel />);

    const discardButtons = screen.getAllByTitle('Discard');
    fireEvent.click(discardButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Discard changes to src/app.ts?');
    await waitFor(() => {
      expect(mockDiscardChanges).toHaveBeenCalledWith('src/app.ts');
    });
  });

  it('does not discard changes when confirmation cancelled', async () => {
    const mockDiscardChanges = vi.fn();
    window.confirm = vi.fn(() => false);

    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      discardChanges: mockDiscardChanges,
    });

    render(<GitPanel />);

    const discardButtons = screen.getAllByTitle('Discard');
    fireEvent.click(discardButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDiscardChanges).not.toHaveBeenCalled();
  });

  it('commits changes with message', async () => {
    const mockCommit = vi.fn();
    mockUseGit.mockReturnValue(
      createMockGitReturn({
        isGitRepo: true,
        status: {
          branch: 'main',
          isClean: false,
          modified: [],
          added: ['staged-file.ts'],
          deleted: [],
          untracked: [],
          ahead: 0,
          behind: 0,
        },
        commit: mockCommit,
      })
    );

    render(<GitPanel />);

    const commitInput = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(commitInput, { target: { value: 'Test commit' } });

    const commitButton = screen.getByText('Commit');
    fireEvent.click(commitButton);

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith('Test commit');
    });
  });

  it('disables commit button when no message or no staged files', () => {
    render(<GitPanel />);

    const commitButton = screen.getByText('Commit');
    expect(commitButton).toBeDisabled();
  });

  it('shows push and pull buttons', () => {
    render(<GitPanel />);

    expect(screen.getByTitle('Pull')).toBeInTheDocument();
    expect(screen.getByTitle('Push')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh')).toBeInTheDocument();
  });

  it('calls push when push button clicked', async () => {
    const mockPush = vi.fn();
    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      push: mockPush,
    });

    render(<GitPanel />);

    const pushButton = screen.getByTitle('Push');
    fireEvent.click(pushButton);

    expect(mockPush).toHaveBeenCalled();
  });

  it('calls pull when pull button clicked', async () => {
    const mockPull = vi.fn();
    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      pull: mockPull,
    });

    render(<GitPanel />);

    const pullButton = screen.getByTitle('Pull');
    fireEvent.click(pullButton);

    expect(mockPull).toHaveBeenCalled();
  });

  it('shows error message when error occurs', () => {
    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      error: 'Failed to connect to remote repository',
    });

    render(<GitPanel />);

    expect(screen.getByText('Failed to connect to remote repository')).toBeInTheDocument();
  });

  it('shows clean repository state', () => {
    mockUseGit.mockReturnValue({
      ...mockUseGit(),
      status: {
        branch: 'main',
        isClean: true,
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
        ahead: 0,
        behind: 0,
      },
    });

    render(<GitPanel />);

    expect(screen.getByText('No changes to commit')).toBeInTheDocument();
  });

  it('commits on Enter+Cmd/Ctrl keypress', async () => {
    const mockCommit = vi.fn();
    mockUseGit.mockReturnValue(
      createMockGitReturn({
        isGitRepo: true,
        status: {
          branch: 'main',
          isClean: false,
          modified: [],
          added: ['staged-file.ts'],
          deleted: [],
          untracked: [],
          ahead: 0,
          behind: 0,
        },
        commit: mockCommit,
      })
    );

    render(<GitPanel />);

    const commitInput = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(commitInput, { target: { value: 'Test commit' } });
    fireEvent.keyDown(commitInput, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith('Test commit');
    });
  });
});
