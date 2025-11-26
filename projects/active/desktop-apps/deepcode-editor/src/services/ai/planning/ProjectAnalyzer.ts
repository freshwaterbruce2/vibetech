/**
 * Project Analyzer Module
 *
 * Analyzes project structure and context before planning.
 * Implements "understand full project before making changes" pattern (like Cursor/Copilot).
 */
import { logger } from '../../../services/Logger';
import type { FileSystemService } from '../../FileSystemService';
import type { ProjectAnalysis } from './types';

/**
 * Analyzes the project BEFORE planning
 * This solves the "understand full project before making changes" requirement
 */
export async function analyzeProjectBeforePlanning(
    workspaceRoot: string,
    fileSystemService?: FileSystemService
): Promise<string> {
    logger.debug(`[ProjectAnalyzer] 📊 Analyzing project at: ${workspaceRoot}`);

    const analysis: string[] = [];
    analysis.push('=== PROJECT ANALYSIS ===\n');

    if (!fileSystemService) {
        analysis.push('Project analysis limited - no file system access.');
        analysis.push('=== END ANALYSIS ===\n');
        return analysis.join('\n');
    }

    try {
        // 1. Read package.json for dependencies and scripts
        await analyzePackageJson(workspaceRoot, fileSystemService, analysis);

        // 2. Read README for project context
        await analyzeReadme(workspaceRoot, fileSystemService, analysis);

        // 3. Scan workspace for ALL source files
        await scanSourceFiles(workspaceRoot, fileSystemService, analysis);

        // 4. Detect actual entry point file locations
        await detectEntryPoints(workspaceRoot, fileSystemService, analysis);

        // 5. Check for tests
        analyzeTestPatterns(analysis);

        analysis.push('=== END ANALYSIS ===\n');
        const result = analysis.join('\n');
        logger.debug('[ProjectAnalyzer] ✅ Project analysis complete');
        return result;

    } catch (error) {
        logger.error('[ProjectAnalyzer] Error during project analysis:', error);
        return 'Project analysis failed. Proceeding with minimal context.';
    }
}

/**
 * Analyzes package.json for project metadata
 */
async function analyzePackageJson(
    workspaceRoot: string,
    fileSystemService: FileSystemService,
    analysis: string[]
): Promise<void> {
    try {
        const packageJsonPath = `${workspaceRoot}/package.json`;
        const packageJson = await fileSystemService.readFile(packageJsonPath);
        const pkg = JSON.parse(packageJson);

        analysis.push('**Package Info:**');
        analysis.push(`- Name: ${pkg.name || 'Unknown'}`);
        analysis.push(`- Version: ${pkg.version || 'Unknown'}`);

        if (pkg.scripts) {
            analysis.push(`- Available Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
        }

        if (pkg.dependencies || pkg.devDependencies) {
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            const frameworks = detectFrameworks(allDeps);

            if (frameworks.length > 0) {
                analysis.push(`- Frameworks Detected: ${frameworks.join(', ')}`);
            }
        }
        analysis.push('');
    } catch {
        logger.debug('[ProjectAnalyzer] No package.json found or error reading it');
    }
}

/**
 * Detects frameworks from dependencies
 */
function detectFrameworks(deps: Record<string, string>): string[] {
    const frameworks: string[] = [];

    if (deps['react']) { frameworks.push('React'); }
    if (deps['react-native']) { frameworks.push('React Native'); }
    if (deps['expo']) { frameworks.push('Expo'); }
    if (deps['vue']) { frameworks.push('Vue'); }
    if (deps['next']) { frameworks.push('Next.js'); }
    if (deps['@tauri-apps/api']) { frameworks.push('Tauri'); }
    if (deps['electron']) { frameworks.push('Electron'); }
    if (deps['svelte']) { frameworks.push('Svelte'); }
    if (deps['angular']) { frameworks.push('Angular'); }

    return frameworks;
}

/**
 * Analyzes README.md for project description
 */
async function analyzeReadme(
    workspaceRoot: string,
    fileSystemService: FileSystemService,
    analysis: string[]
): Promise<void> {
    try {
        const readmePath = `${workspaceRoot}/README.md`;
        const readme = await fileSystemService.readFile(readmePath);
        const firstLines = readme.split('\n').slice(0, 10).join('\n');
        analysis.push('**Project Description (from README):**');
        analysis.push(firstLines);
        analysis.push('');
    } catch {
        logger.debug('[ProjectAnalyzer] No README.md found');
    }
}

/**
 * Scans workspace for source files
 */
async function scanSourceFiles(
    workspaceRoot: string,
    fileSystemService: FileSystemService,
    analysis: string[]
): Promise<void> {
    try {
        const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.rs'];
        const allFiles: string[] = [];

        // Scan common directories
        const scanDirs = ['src', 'app', 'lib', 'components', 'pages', 'api'];

        for (const dir of scanDirs) {
            try {
                const dirPath = `${workspaceRoot}/${dir}`;
                const files = await fileSystemService.listDirectory(dirPath);

                for (const file of files) {
                    if (sourceExtensions.some(ext => file.name.endsWith(ext))) {
                        allFiles.push(`${dir}/${file.name}`);
                    }
                }
            } catch {
                // Directory doesn't exist, continue
            }
        }

        // Also check root level
        try {
            const rootFiles = await fileSystemService.listDirectory(workspaceRoot);
            for (const file of rootFiles) {
                if (sourceExtensions.some(ext => file.name.endsWith(ext))) {
                    allFiles.push(file.name);
                }
            }
        } catch {
            // Ignore errors
        }

        if (allFiles.length > 0) {
            analysis.push('**All Source Files in Project:**');
            const displayFiles = allFiles.slice(0, 20);
            displayFiles.forEach(f => analysis.push(`  - ${f}`));
            if (allFiles.length > 20) {
                analysis.push(`  ... and ${allFiles.length - 20} more files`);
            }
            analysis.push('');
            analysis.push(`💡 **When user says "review 3 files", pick the 3 most relevant from this list**\n`);
        }
    } catch (error) {
        logger.debug('[ProjectAnalyzer] Error scanning workspace files:', error);
    }
}

/**
 * Detects entry point files
 */
async function detectEntryPoints(
    workspaceRoot: string,
    fileSystemService: FileSystemService,
    analysis: string[]
): Promise<void> {
    try {
        const commonPaths = [
            'src/App.tsx', 'src/App.ts', 'src/App.jsx', 'src/App.js',
            'app/index.tsx', 'app/_layout.tsx',
            'src/index.tsx', 'src/index.ts', 'src/index.js',
            'src/main.tsx', 'src/main.ts',
            'index.js', 'index.ts',
        ];

        const foundFiles: string[] = [];
        for (const path of commonPaths) {
            try {
                await fileSystemService.getFileStats(`${workspaceRoot}/${path}`);
                foundFiles.push(path);
            } catch {
                // File doesn't exist, continue
            }
        }

        if (foundFiles.length > 0) {
            analysis.push('**Entry Points Found:**');
            foundFiles.forEach(f => analysis.push(`  - ${f}`));
            analysis.push('');
        }
    } catch (error) {
        logger.debug('[ProjectAnalyzer] Error detecting file locations:', error);
    }
}

/**
 * Adds test pattern information
 */
function analyzeTestPatterns(analysis: string[]): void {
    const testPatterns = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '__tests__/**'];
    analysis.push('**Testing:**');
    analysis.push(`- Test patterns to look for: ${testPatterns.join(', ')}`);
    analysis.push('');
}

/**
 * Gets structured project analysis
 */
export async function getStructuredProjectAnalysis(
    workspaceRoot: string,
    fileSystemService?: FileSystemService
): Promise<ProjectAnalysis> {
    const raw = await analyzeProjectBeforePlanning(workspaceRoot, fileSystemService);

    return {
        raw,
        // Additional structured data can be added here
    };
}
