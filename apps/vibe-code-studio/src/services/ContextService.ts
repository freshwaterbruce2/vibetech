import { EditorFile, WorkspaceContext } from '../types'

export interface CodeContext {
  currentFile?: EditorFile
  openFiles: EditorFile[]
  recentFiles: EditorFile[]
  relatedFiles: Array<{
    path: string
    content: string
    relevance: number
    reason: string
  }>
  workspaceContext?: WorkspaceContext
  selectedCode?: {
    code: string
    startLine: number
    endLine: number
  }
}

export class ContextService {
  private recentFiles: EditorFile[] = []
  private maxRecentFiles = 10
  private contextCache = new Map<string, CodeContext>()

  addRecentFile(file: EditorFile) {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter(f => f.path !== file.path)
    
    // Add to beginning
    this.recentFiles.unshift(file)
    
    // Keep within limit
    if (this.recentFiles.length > this.maxRecentFiles) {
      this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles)
    }
  }

  getRecentFiles(): EditorFile[] {
    return [...this.recentFiles]
  }

  buildCodeContext(
    currentFile: EditorFile | null,
    openFiles: EditorFile[],
    workspaceContext?: WorkspaceContext,
    getFileContext?: (file: EditorFile) => any[]
  ): CodeContext {
    const context: CodeContext = {
      openFiles: [...openFiles],
      recentFiles: this.getRecentFiles(),
      relatedFiles: []
    }

    if (currentFile) {
      context.currentFile = currentFile
      
      // Get related files using workspace service
      if (getFileContext) {
        const relatedFiles = getFileContext(currentFile)
        context.relatedFiles = relatedFiles.slice(0, 5) // Limit to top 5
      }
    }

    if (workspaceContext) {
      context.workspaceContext = workspaceContext
    }

    return context
  }

  summarizeContext(context: CodeContext): string {
    const parts: string[] = []

    // Current file summary
    if (context.currentFile) {
      parts.push(`Current file: ${context.currentFile.name} (${context.currentFile.language})`)
      
      if (context.selectedCode) {
        parts.push(`Selected code: Lines ${context.selectedCode.startLine}-${context.selectedCode.endLine}`)
      }
    }

    // Workspace summary
    if (context.workspaceContext) {
      const ws = context.workspaceContext
      parts.push(`Workspace: ${ws.totalFiles} files, Languages: ${ws.languages.join(', ')}`)
    }

    // Open files
    if (context.openFiles.length > 1) {
      const otherFiles = context.openFiles
        .filter(f => f.path !== context.currentFile?.path)
        .map(f => f.name)
        .join(', ')
      parts.push(`Open files: ${otherFiles}`)
    }

    // Related files
    if (context.relatedFiles.length > 0) {
      const related = context.relatedFiles
        .map(f => `${f.path} (${f.reason})`)
        .join(', ')
      parts.push(`Related: ${related}`)
    }

    return parts.join('\n')
  }

  getContextWindow(context: CodeContext, maxTokens: number = 4000): string {
    // This is a simplified token estimation
    // In production, use a proper tokenizer
    const estimateTokens = (text: string) => Math.ceil(text.length / 4)
    
    let contextWindow = ''
    let tokensUsed = 0

    // Add current file context
    if (context.currentFile && context.currentFile.content) {
      const fileContext = this.extractRelevantCode(
        context.currentFile.content,
        context.selectedCode
      )
      const tokens = estimateTokens(fileContext)
      
      if (tokensUsed + tokens < maxTokens) {
        contextWindow += `\n=== Current File: ${context.currentFile.name} ===\n${fileContext}\n`
        tokensUsed += tokens
      }
    }

    // Add related files
    for (const relatedFile of context.relatedFiles) {
      const preview = relatedFile.content.substring(0, 500)
      const tokens = estimateTokens(preview)
      
      if (tokensUsed + tokens < maxTokens) {
        contextWindow += `\n=== Related: ${relatedFile.path} (${relatedFile.reason}) ===\n${preview}...\n`
        tokensUsed += tokens
      } else {
        break
      }
    }

    // Add workspace summary
    if (context.workspaceContext) {
      const summary = `\n=== Workspace Summary ===\n${context.workspaceContext.summary}\n`
      const tokens = estimateTokens(summary)
      
      if (tokensUsed + tokens < maxTokens) {
        contextWindow += summary
        tokensUsed += tokens
      }
    }

    return contextWindow
  }

  private extractRelevantCode(
    content: string,
    selectedCode?: { code: string; startLine: number; endLine: number }
  ): string {
    if (selectedCode) {
      // Return selected code with some context
      const lines = content.split('\n')
      const startLine = Math.max(0, selectedCode.startLine - 10)
      const endLine = Math.min(lines.length, selectedCode.endLine + 10)
      
      return lines.slice(startLine, endLine).join('\n')
    }

    // If no selection, return a reasonable preview
    const lines = content.split('\n')
    const maxLines = 100

    if (lines.length <= maxLines) {
      return content
    }

    // Try to include important parts (imports, class definitions, etc.)
    const importLines = lines.filter(line => 
      line.match(/^import|^from|^export|^class|^interface|^function|^const/)
    )

    if (importLines.length > 0) {
      return importLines.slice(0, maxLines).join('\n')
    }

    // Fallback to first N lines
    return lines.slice(0, maxLines).join('\n')
  }

  clearCache() {
    this.contextCache.clear()
  }
}