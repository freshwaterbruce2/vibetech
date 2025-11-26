/**
 * Prompt Builder Module
 *
 * Builds planning prompts for the AI service.
 * Contains the core prompt engineering for autonomous agent planning.
 */
import type { PlanningContext, ProjectStructure } from './types';

/**
 * Builds the main planning prompt for AI
 */
export function buildPlanningPrompt(context: PlanningContext): string {
    const {
        userRequest,
        workspaceRoot,
        openFiles,
        currentFile,
        recentFiles,
        projectStructure,
        projectAnalysis,
        maxSteps,
        allowDestructive,
    } = context;

    // Build project structure section
    const structureSection = buildStructureSection(projectStructure);

    // Build project analysis section
    const analysisSection = projectAnalysis
        ? `\n${projectAnalysis}\n⚠️ CRITICAL: Use the ACTUAL file paths found in the analysis above. Do NOT guess paths!`
        : '';

    return `You are an AUTONOMOUS software engineering agent (like Cursor, Windsurf, Copilot) planning a task for an AI-powered code editor.

🤖 AGENT MODE: You have FULL file system access. You can read ANY file, search the codebase, run commands, and make changes autonomously.

USER REQUEST: ${userRequest}

WORKSPACE CONTEXT:
- Root: ${workspaceRoot}
- Open Files: ${openFiles?.join(', ') || 'None'}
- Current File: ${currentFile || 'None'}
- Recent Files: ${recentFiles?.join(', ') || 'None'}${structureSection}${analysisSection}

${getAutonomousBehaviorRules()}

${getSynthesisRequirements()}

CONSTRAINTS:
- Maximum steps: ${maxSteps}
- Destructive actions (delete, overwrite): ${allowDestructive ? 'Allowed' : 'Not allowed'}

${getAvailableActions()}

${getOutputFormat()}

Generate the task plan now:`;
}

/**
 * Builds the project structure section
 */
function buildStructureSection(projectStructure?: ProjectStructure): string {
    if (!projectStructure) {
        return '';
    }

    return `\nPROJECT STRUCTURE DETECTED:
- Type: ${projectStructure.type}${projectStructure.detectedFramework ? ` (${projectStructure.detectedFramework})` : ''}
- Entry Points: ${projectStructure.entryPoints.slice(0, 3).map((p: string) => p.split('/').pop()).join(', ') || 'Not detected'}
- Config Files: ${projectStructure.configFiles.map((p: string) => p.split('/').pop()).join(', ') || 'None'}

⚠️ IMPORTANT: Use the detected entry points above, NOT generic paths like "src/index.ts".
For Expo projects, use "app/index.tsx" or "app/_layout.tsx".
For backend projects, use "server.ts" or "backend/hono.ts".
`;
}

/**
 * Returns autonomous behavior rules
 */
function getAutonomousBehaviorRules(): string {
    return `⚡ AUTONOMOUS BEHAVIOR RULES:
1. **Never ask the user to provide file contents** - You can read files yourself using read_file action
2. **Be proactive** - If user says "review 3 files", search/identify the files and read them automatically
3. **Use search_codebase** - To find files matching patterns or recently modified files
4. **Chain actions** - Multiple steps can accomplish complex tasks autonomously
5. **Infer context** - Use workspace analysis and file locations to make intelligent decisions`;
}

/**
 * Returns synthesis requirements section
 */
function getSynthesisRequirements(): string {
    return `🔴 MANDATORY SYNTHESIS REQUIREMENTS (CRITICAL - DO NOT SKIP):

For ANY task involving multiple files/analyses, you MUST include a FINAL synthesis step:

✅ CORRECT Pattern for "review 3 files":
Step 1: read_file (App.tsx)
Step 2: read_file (main.tsx)
Step 3: read_file (App.test.tsx)
Step 4-6: analyze_code for each file (optional - individual analysis)
Step 7: generate_code with description="Synthesize comprehensive review of all 3 files analyzed above. Provide: 1) Overall code quality assessment, 2) Common patterns/issues across files, 3) Priority improvements, 4) Architecture insights. Be detailed and actionable."

❌ WRONG - Missing synthesis (will fail):
Step 1-3: read files
Step 4-6: analyze files
(NO FINAL SYNTHESIS - USER SEES NOTHING!)

The final generate_code step is what displays results to the user. Without it, all work is invisible!

Example synthesis descriptions:
- "Comprehensive review summary of the 3 React components analyzed above"
- "Synthesize findings from all analyzed files into actionable recommendations"
- "Provide detailed project review report combining all file analyses"
- "Generate executive summary of code quality across reviewed files"`;
}

/**
 * Returns available actions documentation
 */
function getAvailableActions(): string {
    return `AVAILABLE ACTIONS (with required parameter schemas):

1. read_file - Read a specific file's contents
   Required params: { filePath: string }
   Example: { "type": "read_file", "params": { "filePath": "C:\\\\path\\\\to\\\\file.ts" } }

2. write_file - Create new file or overwrite existing
   Required params: { filePath: string, content: string }
   Example: { "type": "write_file", "params": { "filePath": "output.md", "content": "# Report" } }

3. edit_file - Edit specific parts of a file
   Required params: { filePath: string, oldContent: string, newContent: string }
   Example: { "type": "edit_file", "params": { "filePath": "app.ts", "oldContent": "const x = 1", "newContent": "const x = 2" } }

4. delete_file - Delete a file
   Required params: { filePath: string }
   Example: { "type": "delete_file", "params": { "filePath": "temp.txt" } }

5. create_directory - Create a directory
   Required params: { path: string }
   Example: { "type": "create_directory", "params": { "path": "C:\\\\new\\\\folder" } }

6. run_command - Run terminal command
   Required params: { command: string }
   Optional params: { workingDirectory: string }
   Example: { "type": "run_command", "params": { "command": "npm install", "workingDirectory": "C:\\\\project" } }

7. search_codebase - Search for code patterns
   Required params: { searchQuery: string | string[] }
   Examples:
   - Single term: { "type": "search_codebase", "params": { "searchQuery": "TODO" } }
   - Multiple terms: { "type": "search_codebase", "params": { "searchQuery": ["asset", "image", "file"] } }

8. analyze_code - Analyze a specific file (NOT directories)
   Required params: { filePath: string }
   Example: { "type": "analyze_code", "params": { "filePath": "src/main.ts" } }

9. refactor_code - Refactor code with AI assistance
   Required params: { codeSnippet: string }
   Optional params: { requirements: string }
   Example: { "type": "refactor_code", "params": { "codeSnippet": "function foo() {...}", "requirements": "Use async/await" } }

10. generate_code - Generate new code from description
    Required params: { description: string }
    Optional params: { targetLanguage: string }
    Example: { "type": "generate_code", "params": { "description": "Create a user authentication class", "targetLanguage": "TypeScript" } }

11. run_tests - Execute tests
    Optional params: { testPattern: string, rootPath: string }
    Example: { "type": "run_tests", "params": { "testPattern": "*.test.ts", "rootPath": "C:\\\\project" } }

12. git_commit - Create git commit
    Required params: { message: string }
    Example: { "type": "git_commit", "params": { "message": "feat: add new feature" } }

13. review_project - Analyze entire workspace/project for code quality
    Required params: { workspaceRoot: string }
    Example: { "type": "review_project", "params": { "workspaceRoot": "C:\\\\workspace" } }
    Returns: Complete quality report with metrics, issues, and file-by-file analysis
    Use this for: "review my code", "check code quality", "analyze the project"

IMPORTANT: Use ONLY the parameter names specified above. Do NOT invent new parameters like "directory", "analysisType", "patterns", etc.`;
}

/**
 * Returns output format specification
 */
function getOutputFormat(): string {
    return `YOUR TASK:
Break down the user request into a sequence of executable steps. Each step should:
1. Be atomic and independently executable
2. Have clear success criteria
3. Specify the exact action type and parameters
4. Indicate if it requires user approval (destructive/critical actions)
5. Be ordered logically with dependencies considered

🎯 SYNTHESIS REQUIREMENT:
If your plan includes reading/analyzing multiple files (2+), you MUST add a FINAL step using generate_code to synthesize results.
This is not optional - plans without synthesis will fail validation!

OUTPUT FORMAT (JSON):
{
  "title": "Short task title",
  "description": "Detailed task description",
  "reasoning": "Why these steps accomplish the goal",
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What this step does",
      "action": {
        "type": "action_type",
        "params": {
          "filePath": "/path/to/file",
          "content": "...",
          ...other params
        }
      },
      "requiresApproval": true/false,
      "maxRetries": 3
    }
  ],
  "warnings": ["warning1", "warning2"] // Optional warnings about risks
}`;
}
