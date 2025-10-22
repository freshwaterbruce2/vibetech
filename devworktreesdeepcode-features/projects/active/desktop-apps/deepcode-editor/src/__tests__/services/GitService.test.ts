import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitService } from '@/services/GitService';
import { exec } from 'child_process';

type ExecCallback = (
  error: Error | null,
  result: { stdout: string; stderr: string } | null
) => void;
type ExecOptions = { cwd: string };

// Mock child_process
vi.mock('child_process', async () => {
  return {
    exec: vi.fn(),
  };
});

vi.mock('util', async () => {
  return {
    promisify: vi.fn((fn) => {
      // Return a function that converts callback-style to promise-style
      return (...args: unknown[]) => {
        return new Promise((resolve, reject) => {
          fn(...args, (err: unknown, result: unknown) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      };
    }),
  };
});

describe('GitService', () => {
  let gitService: GitService;
  let mockExec: any;

  beforeEach(() => {
    gitService = new GitService('/test/repo');
    mockExec = vi.mocked(exec);
    mockExec.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitRepository', () => {
    it('returns true when directory is a git repository', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '.git', stderr: '' });
      });

      const result = await gitService.isGitRepository();
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        'git rev-parse --git-dir',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });

    it('returns false when directory is not a git repository', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(new Error('Not a git repository'), null);
      });

      const result = await gitService.isGitRepository();
      expect(result).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('parses git status correctly', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        if (cmd.includes('rev-parse --abbrev-ref HEAD')) {
          callback(null, { stdout: 'main\n', stderr: '' });
        } else if (cmd.includes('status --porcelain')) {
          callback(null, {
            stdout: 'M  src/app.ts\nA  new-file.ts\nD  deleted.ts\n?? untracked.ts\n',
            stderr: '',
          });
        } else if (cmd.includes('rev-list')) {
          callback(null, { stdout: '3\t2\n', stderr: '' });
        }
      });

      const status = await gitService.getStatus();

      expect(status.branch).toBe('main');
      expect(status.isClean).toBe(false);
      expect(status.modified).toContain('src/app.ts');
      expect(status.added).toContain('new-file.ts');
      expect(status.deleted).toContain('deleted.ts');
      expect(status.untracked).toContain('untracked.ts');
      expect(status.ahead).toBe(3);
      expect(status.behind).toBe(2);
    });

    it('handles clean repository', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        if (cmd.includes('rev-parse --abbrev-ref HEAD')) {
          callback(null, { stdout: 'main\n', stderr: '' });
        } else if (cmd.includes('status --porcelain')) {
          callback(null, { stdout: '', stderr: '' });
        } else if (cmd.includes('rev-list')) {
          callback(null, { stdout: '0\t0\n', stderr: '' });
        }
      });

      const status = await gitService.getStatus();

      expect(status.isClean).toBe(true);
      expect(status.modified).toHaveLength(0);
      expect(status.added).toHaveLength(0);
      expect(status.deleted).toHaveLength(0);
      expect(status.untracked).toHaveLength(0);
    });
  });

  describe('add', () => {
    it('stages a single file', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      await gitService.add('test.ts');

      expect(mockExec).toHaveBeenCalledWith(
        'git add "test.ts"',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });

    it('stages multiple files', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      await gitService.add(['file1.ts', 'file2.ts']);

      expect(mockExec).toHaveBeenCalledWith(
        'git add "file1.ts" "file2.ts"',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });
  });

  describe('commit', () => {
    it('creates a commit with message', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '[main abc123] Test commit', stderr: '' });
      });

      const hash = await gitService.commit('Test commit');

      expect(hash).toBe('abc123');
      expect(mockExec).toHaveBeenCalledWith(
        'git commit -m "Test commit"',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });

    it('escapes quotes in commit message', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '[main def456] Fixed "bug"', stderr: '' });
      });

      await gitService.commit('Fixed "bug"');

      expect(mockExec).toHaveBeenCalledWith(
        'git commit -m "Fixed \\"bug\\""',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });
  });

  describe('getBranches', () => {
    it('parses branch list correctly', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, {
          stdout: '* main\n  feature/new-ui\n  remotes/origin/main\n  remotes/origin/develop\n',
          stderr: '',
        });
      });

      const branches = await gitService.getBranches();

      expect(branches).toHaveLength(4);
      expect(branches[0]).toEqual({ name: 'main', isCurrent: true, isRemote: false });
      expect(branches[1]).toEqual({ name: 'feature/new-ui', isCurrent: false, isRemote: false });
      expect(branches[2]).toEqual({ name: 'origin/main', isCurrent: false, isRemote: true });
      expect(branches[3]).toEqual({ name: 'origin/develop', isCurrent: false, isRemote: true });
    });
  });

  describe('getLog', () => {
    it('parses commit history correctly', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, {
          stdout:
            'abc123|John Doe|2024-01-15 10:00:00 +0000|Initial commit\ndef456|Jane Smith|2024-01-16 11:30:00 +0000|Add feature',
          stderr: '',
        });
      });

      const commits = await gitService.getLog(2);

      expect(commits).toHaveLength(2);
      expect(commits[0]).toEqual({
        hash: 'abc123',
        author: 'John Doe',
        date: new Date('2024-01-15 10:00:00 +0000'),
        message: 'Initial commit',
      });
      expect(commits[1]).toEqual({
        hash: 'def456',
        author: 'Jane Smith',
        date: new Date('2024-01-16 11:30:00 +0000'),
        message: 'Add feature',
      });
    });

    it('returns empty array for no commits', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const commits = await gitService.getLog();
      expect(commits).toEqual([]);
    });
  });

  describe('push', () => {
    it('pushes to default remote', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      await gitService.push();

      expect(mockExec).toHaveBeenCalledWith(
        'git push origin',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });

    it('pushes to specific branch with force', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      await gitService.push('upstream', 'feature', true);

      expect(mockExec).toHaveBeenCalledWith(
        'git push --force upstream feature',
        expect.objectContaining({ cwd: '/test/repo' }),
        expect.any(Function) as unknown
      );
    });
  });

  describe('error handling', () => {
    it('throws error with descriptive message', async () => {
      mockExec.mockImplementation((cmd: string, options: ExecOptions, callback: ExecCallback) => {
        callback(new Error('Permission denied'), null);
      });

      await expect(gitService.init()).rejects.toThrow('Git command failed: Permission denied');
    });
  });
});
