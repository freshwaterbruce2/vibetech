import { useCallback, useEffect, useState } from 'react';

import {
  GitBranch,
  GitCommit,
  GitRemote,
  GitService,
  GitStatus,
} from '../services/GitServiceBrowser';

interface UseGitReturn {
  // State
  isGitRepo: boolean;
  status: GitStatus | null;
  commits: GitCommit[];
  branches: GitBranch[];
  remotes: GitRemote[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  init: () => Promise<void>;
  add: (files: string | string[]) => Promise<void>;
  addAll: () => Promise<void>;
  reset: (files?: string | string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: (remote?: string, branch?: string) => Promise<void>;
  pull: (remote?: string, branch?: string) => Promise<void>;
  fetch: (remote?: string) => Promise<void>;
  createBranch: (name: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  stash: (message?: string) => Promise<void>;
  stashPop: () => Promise<void>;
  discardChanges: (filePath: string) => Promise<void>;
}

export function useGit(workingDirectory?: string): UseGitReturn {
  const [gitService] = useState(() => new GitService(workingDirectory || '/'));
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [remotes, setRemotes] = useState<GitRemote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if directory is a git repository
  const checkGitRepo = useCallback(async () => {
    try {
      const isRepo = await gitService.isGitRepository();
      setIsGitRepo(isRepo);
      return isRepo;
    } catch (err) {
      console.error('Error checking git repository:', err);
      return false;
    }
  }, [gitService]);

  // Refresh git status
  const refreshStatus = useCallback(async () => {
    if (!isGitRepo) {
      return;
    }

    try {
      const newStatus = await gitService.getStatus();
      setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error refreshing git status:', err);
    }
  }, [gitService, isGitRepo]);

  // Refresh commits
  const refreshCommits = useCallback(async () => {
    if (!isGitRepo) {
      return;
    }

    try {
      const newCommits = await gitService.getCommits(20);
      setCommits(newCommits);
    } catch (err) {
      console.error('Error refreshing commits:', err);
    }
  }, [gitService, isGitRepo]);

  // Refresh branches
  const refreshBranches = useCallback(async () => {
    if (!isGitRepo) {
      return;
    }

    try {
      const newBranches = await gitService.getBranches();
      setBranches(newBranches);
    } catch (err) {
      console.error('Error refreshing branches:', err);
    }
  }, [gitService, isGitRepo]);

  // Refresh remotes
  const refreshRemotes = useCallback(async () => {
    if (!isGitRepo) {
      return;
    }

    try {
      const newRemotes = await gitService.getRemotes();
      setRemotes(newRemotes);
    } catch (err) {
      console.error('Error refreshing remotes:', err);
    }
  }, [gitService, isGitRepo]);

  // Refresh all git data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isRepo = await checkGitRepo();
      if (isRepo) {
        await Promise.all([refreshStatus(), refreshCommits(), refreshBranches(), refreshRemotes()]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [checkGitRepo, refreshStatus, refreshCommits, refreshBranches, refreshRemotes]);

  // Initialize git repository
  const init = useCallback(async () => {
    try {
      await gitService.init();
      setIsGitRepo(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [gitService, refresh]);

  // Stage files
  const add = useCallback(
    async (files: string | string[]) => {
      try {
        await gitService.add(files);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Stage all changes
  const addAll = useCallback(async () => {
    try {
      await gitService.addAll();
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [gitService, refreshStatus]);

  // Unstage files
  const reset = useCallback(
    async (files?: string | string[]) => {
      try {
        await gitService.reset(files);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Commit changes
  const commit = useCallback(
    async (message: string) => {
      try {
        await gitService.commit(message);
        await Promise.all([refreshStatus(), refreshCommits()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus, refreshCommits]
  );

  // Push changes
  const push = useCallback(
    async (remote: string = 'origin', branch?: string) => {
      try {
        await gitService.push(remote, branch);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Pull changes
  const pull = useCallback(
    async (remote: string = 'origin', branch?: string) => {
      try {
        await gitService.pull(remote, branch);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refresh]
  );

  // Fetch updates
  const fetch = useCallback(
    async (remote: string = 'origin') => {
      try {
        await gitService.fetch(remote);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Create branch
  const createBranch = useCallback(
    async (name: string) => {
      try {
        await gitService.createBranch(name);
        await refreshBranches();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshBranches]
  );

  // Checkout branch
  const checkout = useCallback(
    async (branch: string) => {
      try {
        await gitService.checkout(branch);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refresh]
  );

  // Stash changes
  const stash = useCallback(
    async (message?: string) => {
      try {
        await gitService.stash(message);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Pop stash
  const stashPop = useCallback(async () => {
    try {
      await gitService.stashPop();
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [gitService, refreshStatus]);

  // Discard changes
  const discardChanges = useCallback(
    async (filePath: string) => {
      try {
        await gitService.discardChanges(filePath);
        await refreshStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [gitService, refreshStatus]
  );

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh on file system changes (optional)
  useEffect(() => {
    if (!isGitRepo) {
      return;
    }

    // Refresh status every 5 seconds
    const interval = setInterval(refreshStatus, 5000);

    return () => clearInterval(interval);
  }, [isGitRepo, refreshStatus]);

  return {
    // State
    isGitRepo,
    status,
    commits,
    branches,
    remotes,
    isLoading,
    error,

    // Actions
    refresh,
    init,
    add,
    addAll,
    reset,
    commit,
    push,
    pull,
    fetch,
    createBranch,
    checkout,
    stash,
    stashPop,
    discardChanges,
  };
}

export default useGit;
