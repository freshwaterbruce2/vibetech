/**
 * Secure message formatting utility to prevent XSS attacks
 * Replaces dangerouslySetInnerHTML with safe HTML parsing
 */

// Simple HTML entities encoding to prevent XSS
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Safe markdown-like formatting that doesn't allow arbitrary HTML
export function formatMessageSafely(content: string): string {
  // First escape all HTML
  let formatted = escapeHtml(content);

  // Apply safe formatting patterns
  // Code blocks with language specification
  formatted = formatted.replace(
    /```(\w+)?\n([\s\S]*?)\n```/g, 
    '<pre class="code-block"><code class="language-$1">$2</code></pre>'
  );

  // Inline code
  formatted = formatted.replace(
    /`([^`]+)`/g, 
    '<code class="inline-code">$1</code>'
  );

  // Bold text
  formatted = formatted.replace(
    /\*\*(.*?)\*\*/g, 
    '<strong>$1</strong>'
  );

  // Italic text
  formatted = formatted.replace(
    /\*(.*?)\*/g, 
    '<em>$1</em>'
  );

  // Headers (only allow h3-h6 for safety)
  formatted = formatted.replace(
    /^### (.*$)/gm, 
    '<h3>$1</h3>'
  );
  formatted = formatted.replace(
    /^#### (.*$)/gm, 
    '<h4>$1</h4>'
  );

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// Parse content into safe React elements
export interface MessagePart {
  type: 'text' | 'code' | 'codeblock' | 'bold' | 'italic' | 'header';
  content: string;
  language?: string;
}

export function parseMessageSafely(content: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const _remaining = content;
  
  // Process code blocks first
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let match;
  let lastIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push(...parseInlineElements(textBefore));
      }
    }

    // Add code block
    parts.push({
      type: 'codeblock',
      content: match[2],
      language: match[1] || 'text'
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push(...parseInlineElements(remainingText));
    }
  }

  return parts;
}

function parseInlineElements(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const _remaining = text;

  // Split by inline code first
  const codeRegex = /`([^`]+)`/g;
  let match;
  let lastIndex = 0;

  while ((match = codeRegex.exec(text)) !== null) {
    // Add text before inline code
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      parts.push(...parseTextFormatting(textBefore));
    }

    // Add inline code
    parts.push({
      type: 'code',
      content: match[1]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(...parseTextFormatting(remainingText));
  }

  return parts;
}

function parseTextFormatting(text: string): MessagePart[] {
  const parts: MessagePart[] = [];

  // Handle bold and italic formatting
  const _boldRegex = /\*\*(.*?)\*\*/g;
  const _italicRegex = /\*(.*?)\*/g;
  
  // For simplicity, just return as text for now
  // In a full implementation, you'd parse these recursively
  if (text.trim()) {
    parts.push({
      type: 'text',
      content: text
    });
  }

  return parts;
}

// Validate that content doesn't contain malicious patterns
export function validateMessageContent(content: string): boolean {
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /onmouseover=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /data:text\/html/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}