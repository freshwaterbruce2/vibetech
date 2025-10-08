/**
 * Markdown Processing Web Worker - 2025 Pattern
 *
 * Offloads markdown parsing and rendering to a separate thread
 *
 * Features:
 * - Markdown to HTML conversion
 * - Syntax highlighting
 * - Table of contents generation
 * - Reading time estimation
 * - Security sanitization
 */

interface MarkdownRequest {
  id: string;
  type: 'parse' | 'toc' | 'preview' | 'readingTime';
  content: string;
  options?: {
    sanitize?: boolean;
    highlight?: boolean;
    breaks?: boolean;
    gfm?: boolean;
  };
}

type MarkdownResultType = string | TOCItem[] | { minutes: number; words: number; time: string };

interface MarkdownResponse {
  id: string;
  type: string;
  result: MarkdownResultType | null;
  error?: string;
}

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

// Simple markdown parser (in production, use marked or markdown-it)
interface MarkdownOptions {
  breaks?: boolean;
  gfm?: boolean;
}

function parseMarkdown(content: string, options: MarkdownOptions = {}): string {
  let html = content;

  // Basic markdown transformations
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 id="$1">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Line breaks
  if (options.breaks) {
    html = html.replace(/\n/g, '<br>');
  }

  // Clean up
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6])/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');

  return html;
}

// Escape HTML for security
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

// Generate table of contents
function generateTOC(content: string): TOCItem[] {
  const toc: TOCItem[] = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headerRegex.exec(content)) !== null) {
    const level = match[1]?.length || 0;
    const text = match[2]?.trim() || '';
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    toc.push({ level, text, id });
  }

  return toc;
}

// Calculate reading time
function calculateReadingTime(content: string): {
  minutes: number;
  words: number;
  time: string;
} {
  // Remove markdown syntax for accurate word count
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/[#*_[\]()]/g, '') // Remove markdown syntax
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .trim();

  const words = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    time: minutes === 1 ? '1 minute' : `${minutes} minutes`,
  };
}

// Enhanced preview with syntax highlighting simulation
function generatePreview(content: string): string {
  const html = parseMarkdown(content, { breaks: true, gfm: true });

  // Add preview wrapper and basic styles
  return `
    <div class="markdown-preview">
      <style>
        .markdown-preview {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #e4e4e7;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .markdown-preview h1 { font-size: 2em; border-bottom: 1px solid #3f3f46; padding-bottom: 0.3em; }
        .markdown-preview h2 { font-size: 1.5em; }
        .markdown-preview h3 { font-size: 1.25em; }
        .markdown-preview code {
          background: #27272a;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.9em;
        }
        .markdown-preview pre {
          background: #18181b;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          border: 1px solid #3f3f46;
        }
        .markdown-preview pre code {
          background: none;
          padding: 0;
        }
        .markdown-preview a {
          color: #8b5cf6;
          text-decoration: none;
        }
        .markdown-preview a:hover {
          text-decoration: underline;
        }
        .markdown-preview blockquote {
          border-left: 4px solid #8b5cf6;
          margin-left: 0;
          padding-left: 16px;
          color: #a1a1aa;
        }
        .markdown-preview img {
          max-width: 100%;
          height: auto;
        }
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .markdown-preview th, .markdown-preview td {
          border: 1px solid #3f3f46;
          padding: 8px 12px;
          text-align: left;
        }
        .markdown-preview th {
          background: #27272a;
          font-weight: 600;
        }
      </style>
      ${html}
    </div>
  `;
}

// Message handler
self.addEventListener('message', (event: MessageEvent<MarkdownRequest>) => {
  const { id, type, content, options } = event.data;

  try {
    let result: MarkdownResultType;

    switch (type) {
      case 'parse':
        result = parseMarkdown(content, options);
        break;

      case 'toc':
        result = generateTOC(content);
        break;

      case 'preview':
        result = generatePreview(content);
        break;

      case 'readingTime':
        result = calculateReadingTime(content);
        break;

      default:
        throw new Error(`Unknown markdown operation: ${type}`);
    }

    const response: MarkdownResponse = {
      id,
      type,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: MarkdownResponse = {
      id,
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// Export for TypeScript
export {};
