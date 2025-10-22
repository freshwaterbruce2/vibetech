// Browser-compatible GitService that uses IPC when in Electron
// or provides mock functionality when in browser

import '../types/electron.d';

export interface GitStatus {
  branch: string;
  isClean: boolean;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface GitRemote {
  name: string;
  url: string;
}

export class GitService {
  private workingDirectory: string;
  private isElectron: boolean;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
    // Check if running in Electron
    this.isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  async isGitRepository(): Promise<boolean> {
    if (this.isElectron) {
      // In Electron, check if .git directory exists
      try {
        if (window.electronAPI) {
          const gitPath = `${this.workingDirectory}/.git`;
          return await window.electronAPI.fs.exists(gitPath);
        }
      } catch {
        return false;
      }
    }
    // Browser mode - no git repository
    return false;
  }

  async getStatus(): Promise<GitStatus> {
    // Git operations are not available without a proper git implementation
    // Return mock data for now
    return {
      branch: 'main',
      isClean: true,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      ahead: 0,
      behind: 0,
    };
  }

  async getCommits(_limit: number = 50): Promise<GitCommit[]> {
    // Git operations are not available without a proper git implementation
    // Return mock data for now
    return [];
  }

  async getBranches(): Promise<GitBranch[]> {
    // Git operations are not available without a proper git implementation
    // Return mock data for now
    return [{ name: 'main', isCurrent: true, isRemote: false }];
  }

  async getRemotes(): Promise<GitRemote[]> {
    // Git operations are not available without a proper git implementation
    // Return mock data for now
    return [];
  }

  async init(): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async add(_files: string | string[]): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async addAll(): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async reset(_files?: string | string[]): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async commit(_message: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async push(_remote: string = 'origin', _branch?: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async pull(_remote: string = 'origin', _branch?: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async fetch(_remote: string = 'origin'): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async createBranch(_name: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async checkout(_branch: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async stash(_message?: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async stashPop(): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }

  async discardChanges(_filePath: string): Promise<void> {
    // Git operations are not available without a proper git implementation
    // No-op for now
  }
}
