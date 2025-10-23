import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  constructor(workingDirectory: string = '/') {
    this.workingDirectory = workingDirectory;
  }

  /**
   * Execute a git command in the working directory
   */
  private async execGit(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git ${command}`, {
        cwd: this.workingDirectory,
        encoding: 'utf8',
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Git command failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.execGit('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize a new git repository
   */
  async init(): Promise<void> {
    await this.execGit('init');
  }

  /**
   * Get the current git status
   */
  async getStatus(): Promise<GitStatus> {
    const [branch, statusOutput, aheadBehind] = await Promise.all([
      this.execGit('rev-parse --abbrev-ref HEAD'),
      this.execGit('status --porcelain'),
      this.execGit('rev-list --left-right --count HEAD...@{u}').catch(() => '0\t0'),
    ]);

    const parts = aheadBehind.split('\t');
    const ahead = parts[0] ? parseInt(parts[0], 10) || 0 : 0;
    const behind = parts[1] ? parseInt(parts[1], 10) || 0 : 0;

    const files = statusOutput.split('\n').filter((line) => line.trim());
    const status: GitStatus = {
      branch,
      isClean: files.length === 0,
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      ahead,
      behind,
    };

    files.forEach((line) => {
      const [statusCode, ...filePathParts] = line.trim().split(' ');
      const filePath = filePathParts.join(' ');

      if (statusCode === 'M' || statusCode === 'MM') {
        status.modified.push(filePath);
      } else if (statusCode === 'A' || statusCode === 'AM') {
        status.added.push(filePath);
      } else if (statusCode === 'D') {
        status.deleted.push(filePath);
      } else if (statusCode === '??' || statusCode === '?') {
        status.untracked.push(filePath);
      }
    });

    return status;
  }

  /**
   * Stage files for commit
   */
  async add(files: string | string[]): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files];
    const quotedFiles = fileList.map((f) => `"${f}"`).join(' ');
    await this.execGit(`add ${quotedFiles}`);
  }

  /**
   * Stage all changes
   */
  async addAll(): Promise<void> {
    await this.execGit('add -A');
  }

  /**
   * Unstage files
   */
  async reset(files?: string | string[]): Promise<void> {
    if (!files) {
      await this.execGit('reset');
      return;
    }

    const fileList = Array.isArray(files) ? files : [files];
    const quotedFiles = fileList.map((f) => `"${f}"`).join(' ');
    await this.execGit(`reset ${quotedFiles}`);
  }

  /**
   * Commit staged changes
   */
  async commit(message: string): Promise<string> {
    const output = await this.execGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
    const match = output.match(/\[[\w-]+\s+(\w+)\]/)?.[1];
    return match || '';
  }

  /**
   * Get commit history
   */
  async getLog(limit: number = 50): Promise<GitCommit[]> {
    const format = '--pretty=format:%H|%an|%ad|%s --date=iso';
    const output = await this.execGit(`log ${format} -n ${limit}`);

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, author, date, message] = line.split('|');
        return {
          hash: hash || '',
          author: author || '',
          date: new Date(date || Date.now()),
          message: message || '',
        };
      });
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<GitBranch[]> {
    const output = await this.execGit('branch -a');
    const branches: GitBranch[] = [];

    output.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      const isCurrent = line.startsWith('*');
      const name = trimmed.replace(/^\*?\s+/, '');
      const isRemote = name.startsWith('remotes/');

      branches.push({
        name: isRemote ? name.replace('remotes/', '') : name,
        isCurrent,
        isRemote,
      });
    });

    return branches;
  }

  /**
   * Create a new branch
   */
  async createBranch(name: string): Promise<void> {
    await this.execGit(`checkout -b ${name}`);
  }

  /**
   * Switch to a different branch
   */
  async checkout(branch: string): Promise<void> {
    await this.execGit(`checkout ${branch}`);
  }

  /**
   * Pull changes from remote
   */
  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    const command = branch ? `pull ${remote} ${branch}` : `pull ${remote}`;
    await this.execGit(command);
  }

  /**
   * Push changes to remote
   */
  async push(remote: string = 'origin', branch?: string, force: boolean = false): Promise<void> {
    const forceFlag = force ? '--force' : '';
    const command = branch
      ? `push ${forceFlag} ${remote} ${branch}`.trim()
      : `push ${forceFlag} ${remote}`.trim();
    await this.execGit(command);
  }

  /**
   * Fetch updates from remote
   */
  async fetch(remote: string = 'origin'): Promise<void> {
    await this.execGit(`fetch ${remote}`);
  }

  /**
   * Get list of remotes
   */
  async getRemotes(): Promise<GitRemote[]> {
    const output = await this.execGit('remote -v');
    const remotes = new Map<string, string>();

    output.split('\n').forEach((line) => {
      const [name, url] = line.split('\t');
      if (name && url && url.includes('(fetch)')) {
        remotes.set(name, url.replace(' (fetch)', ''));
      }
    });

    return Array.from(remotes.entries()).map(([name, url]) => ({ name, url }));
  }

  /**
   * Add a remote
   */
  async addRemote(name: string, url: string): Promise<void> {
    await this.execGit(`remote add ${name} ${url}`);
  }

  /**
   * Get diff of changes
   */
  async getDiff(staged: boolean = false): Promise<string> {
    const command = staged ? 'diff --cached' : 'diff';
    return await this.execGit(command);
  }

  /**
   * Stash changes
   */
  async stash(message?: string): Promise<void> {
    const command = message ? `stash push -m "${message}"` : 'stash';
    await this.execGit(command);
  }

  /**
   * Apply stashed changes
   */
  async stashPop(): Promise<void> {
    await this.execGit('stash pop');
  }

  /**
   * List stashes
   */
  async getStashes(): Promise<string[]> {
    const output = await this.execGit('stash list');
    return output ? output.split('\n') : [];
  }

  /**
   * Clone a repository
   */
  static async clone(url: string, directory?: string): Promise<void> {
    const command = directory ? `git clone ${url} ${directory}` : `git clone ${url}`;
    await execAsync(command);
  }

  /**
   * Get file history
   */
  async getFileHistory(filePath: string, limit: number = 20): Promise<GitCommit[]> {
    const format = '--pretty=format:%H|%an|%ad|%s --date=iso';
    const output = await this.execGit(`log ${format} -n ${limit} -- "${filePath}"`);

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, author, date, message] = line.split('|');
        return {
          hash: hash || '',
          author: author || '',
          date: new Date(date || Date.now()),
          message: message || '',
        };
      });
  }

  /**
   * Show specific commit
   */
  async showCommit(hash: string): Promise<string> {
    return await this.execGit(`show ${hash}`);
  }

  /**
   * Discard changes to a file
   */
  async discardChanges(filePath: string): Promise<void> {
    await this.execGit(`checkout -- "${filePath}"`);
  }

  /**
   * Get current user config
   */
  async getConfig(key: string): Promise<string> {
    return await this.execGit(`config --get ${key}`);
  }

  /**
   * Set user config
   */
  async setConfig(key: string, value: string, global: boolean = false): Promise<void> {
    const globalFlag = global ? '--global' : '';
    await this.execGit(`config ${globalFlag} ${key} "${value}"`);
  }
}

// Singleton instance for the current workspace
let gitServiceInstance: GitService | null = null;

export function getGitService(workingDirectory?: string): GitService {
  if (!gitServiceInstance || workingDirectory) {
    gitServiceInstance = new GitService(workingDirectory);
  }
  return gitServiceInstance;
}

export default GitService;
