import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

interface GetProjectStatusArgs {
  project_path?: string;
}

export async function getProjectStatus(args: GetProjectStatusArgs) {
  try {
    const projectPath = args.project_path || 'C:\\dev';
    const results: string[] = [`📁 **Project Status**: ${projectPath}\n`];

    // Get git status
    try {
      const { stdout: gitStatus } = await execAsync('git status --short', {
        cwd: projectPath,
        timeout: 5000,
      });

      if (gitStatus.trim()) {
        results.push('🔄 **Modified Files**:');
        const lines = gitStatus.trim().split('\n').slice(0, 10);
        lines.forEach((line) => results.push(`  ${line}`));
        if (gitStatus.split('\n').length > 10) {
          results.push(`  ... and ${gitStatus.split('\n').length - 10} more files`);
        }
        results.push('');
      } else {
        results.push('✅ **Working Tree**: Clean\n');
      }
    } catch (error) {
      results.push('⚠️ **Git Status**: Not a git repository or error\n');
    }

    // Get current branch
    try {
      const { stdout: branch } = await execAsync('git branch --show-current', {
        cwd: projectPath,
        timeout: 5000,
      });
      results.push(`🌿 **Branch**: ${branch.trim()}\n`);
    } catch {
      // Ignore
    }

    // Get recent commits
    try {
      const { stdout: commits } = await execAsync('git log --oneline -5', {
        cwd: projectPath,
        timeout: 5000,
      });
      results.push('📝 **Recent Commits**:');
      commits
        .trim()
        .split('\n')
        .forEach((line) => results.push(`  ${line}`));
    } catch {
      // Ignore
    }

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting project status: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getActiveProject() {
  try {
    // Try to detect from git modified files
    const { stdout: modifiedFiles } = await execAsync('git status --short', {
      cwd: 'C:\\dev',
      timeout: 5000,
    });

    if (modifiedFiles.trim()) {
      const firstFile = modifiedFiles.trim().split('\n')[0];
      const match = firstFile.match(/projects\/([\w-]+)/);
      if (match) {
        return {
          content: [
            {
              type: 'text',
              text: `🎯 **Active Project**: ${match[1]}\n\nDetected from modified files in git.`,
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: '🤷 **Active Project**: Could not auto-detect. No recent changes found.',
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error detecting active project: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

export async function listAllProjects() {
  try {
    const results: string[] = ['📂 **All Projects**:\n'];

    const projectDirs = [
      'C:\\dev\\projects\\active\\web-apps',
      'C:\\dev\\projects\\active\\desktop-apps',
      'C:\\dev\\projects\\active\\mobile-apps',
      'C:\\dev\\projects\\crypto-enhanced',
    ];

    for (const dir of projectDirs) {
      if (existsSync(dir)) {
        const category = dir.split('\\').slice(-1)[0];
        results.push(`\n**${category.toUpperCase()}**:`);

        const projects = await readdir(dir, { withFileTypes: true });
        const dirs = projects.filter((p) => p.isDirectory()).slice(0, 10);

        for (const project of dirs) {
          const projectPath = `${dir}\\${project.name}`;

          // Check if it's a git repo
          const isGit = existsSync(`${projectPath}\\.git`);

          // Check for package.json
          const hasPackageJson = existsSync(`${projectPath}\\package.json`);

          const tags: string[] = [];
          if (isGit) tags.push('git');
          if (hasPackageJson) tags.push('npm');

          const tagsStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
          results.push(`  - ${project.name}${tagsStr}`);
        }
      }
    }

    // Add crypto-enhanced separately
    results.push('\n**TRADING**:');
    results.push('  - crypto-enhanced [git, python]');

    return {
      content: [
        {
          type: 'text',
          text: results.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error listing projects: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
