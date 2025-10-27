/**
 * ContextParser - Parse @file, @folder references from user messages (Cursor-style)
 */
import { logger } from '../../services/Logger';
import { FileSystemService } from '../FileSystemService';

export interface ParsedContext {
  message: string; // Original message
  fileReferences: string[]; // @file paths
  folderReferences: string[]; // @folder paths
  referencedContent: Map<string, string>; // path -> content
}

export class ContextParser {
  constructor(private fsService: FileSystemService) {}

  /**
   * Parse message for @file and @folder references
   */
  async parseMessage(message: string, workspaceRoot?: string): Promise<ParsedContext> {
    const fileReferences: string[] = [];
    const folderReferences: string[] = [];
    const referencedContent = new Map<string, string>();

    // Match @file(path) or @file path patterns
    const filePattern = /@file\s*\(([^)]+)\)|@file\s+(\S+)/g;
    let match;

    while ((match = filePattern.exec(message)) !== null) {
      const filePath = match[1] || match[2];
      if (filePath) {
        fileReferences.push(filePath.trim());
      }
    }

    // Match @folder(path) or @folder path patterns
    const folderPattern = /@folder\s*\(([^)]+)\)|@folder\s+(\S+)/g;
    while ((match = folderPattern.exec(message)) !== null) {
      const folderPath = match[1] || match[2];
      if (folderPath) {
        folderReferences.push(folderPath.trim());
      }
    }

    // Load referenced file contents
    for (const filePath of fileReferences) {
      try {
        const fullPath = workspaceRoot ? `${workspaceRoot}/${filePath}` : filePath;
        const content = await this.fsService.readFile(fullPath);
        referencedContent.set(filePath, content);
      } catch (error) {
        logger.warn(`Failed to load @file ${filePath}:`, error);
        referencedContent.set(filePath, `[Error: Could not read file ${filePath}]`);
      }
    }

    // Load folder contents (list files)
    for (const folderPath of folderReferences) {
      try {
        const fullPath = workspaceRoot ? `${workspaceRoot}/${folderPath}` : folderPath;
        const entries = await this.fsService.listDirectory(fullPath);
        const fileList = entries
          .filter(e => e.type === 'file')
          .map(e => `- ${e.name}`)
          .join('\n');
        referencedContent.set(folderPath, `Files in ${folderPath}:\n${fileList}`);
      } catch (error) {
        logger.warn(`Failed to load @folder ${folderPath}:`, error);
        referencedContent.set(folderPath, `[Error: Could not read folder ${folderPath}]`);
      }
    }

    return {
      message,
      fileReferences,
      folderReferences,
      referencedContent,
    };
  }

  /**
   * Build enhanced prompt with referenced files
   */
  buildEnhancedPrompt(parsed: ParsedContext): string {
    let prompt = parsed.message;

    // Add referenced files to prompt
    if (parsed.referencedContent.size > 0) {
      prompt += '\n\n---\n\n';
      for (const [path, content] of parsed.referencedContent.entries()) {
        prompt += `Referenced: ${path}\n\`\`\`\n${content.substring(0, 10000)}\n\`\`\`\n\n`;
      }
    }

    return prompt;
  }
}
