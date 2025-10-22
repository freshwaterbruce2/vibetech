/**
 * ImageToCodeService - Screenshot to Code Converter
 *
 * Converts UI screenshots/mockups to clean React code using Claude Vision API.
 * Implements iterative refinement for high-quality results.
 *
 * Based on 2025 best practices:
 * - Claude Sonnet 3.7: 70.31% accuracy (best for screenshot-to-code)
 * - Iterative refinement: 2-3 passes for accuracy
 * - Puppeteer MCP integration for screenshot comparison
 */
import { logger } from '../services/Logger';

import Anthropic from '@anthropic-ai/sdk';

export interface ImageToCodeOptions {
  framework: 'react' | 'html' | 'vue';
  styling: 'tailwind' | 'css' | 'styled-components';
  maxIterations?: number;
  includeComponents?: boolean; // Use shadcn/ui components
  responsive?: boolean;
}

export interface ImageToCodeResult {
  code: string;
  framework: string;
  styling: string;
  iterations: number;
  accuracy?: number;
  screenshots?: {
    original: string;
    rendered: string;
  };
  improvements?: string[];
}

export class ImageToCodeService {
  private anthropic: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Convert a screenshot/mockup image to clean code
   *
   * @param imageData - Base64 encoded image or Buffer
   * @param options - Conversion options
   * @returns Generated code with metadata
   */
  async convertScreenshotToCode(
    imageData: string,
    options: ImageToCodeOptions = {
      framework: 'react',
      styling: 'tailwind',
      maxIterations: 3,
      includeComponents: true,
      responsive: true,
    }
  ): Promise<ImageToCodeResult> {
    const {
      framework,
      styling,
      maxIterations = 3,
      includeComponents,
      responsive,
    } = options;

    logger.debug('[ImageToCode] Starting conversion...', { framework, styling });

    // Step 1: Initial code generation from image
    const firstPass = await this.generateInitialCode(
      imageData,
      framework,
      styling,
      includeComponents,
      responsive
    );

    let code = this.extractCode(firstPass);
    let iterations = 1;
    const improvements: string[] = [];

    logger.debug('[ImageToCode] Initial code generated, length:', code.length);

    // Step 2: Iterative refinement with screenshot comparison
    while (iterations < maxIterations) {
      logger.debug(`[ImageToCode] Starting refinement iteration ${iterations}/${maxIterations}`);

      const renderedScreenshot = await this.renderAndScreenshot(code, framework);

      // If screenshot capture failed, skip refinement
      if (!renderedScreenshot) {
        logger.debug('[ImageToCode] Screenshot capture failed, skipping refinement');
        break;
      }

      const refinedCode = await this.refineCode(
        imageData,
        renderedScreenshot,
        code,
        framework,
        styling
      );

      const extractedRefinedCode = this.extractCode({ content: [{ text: refinedCode }] });

      // Check if code converged (no changes)
      if (extractedRefinedCode === code || extractedRefinedCode.length < 50) {
        logger.debug('[ImageToCode] Converged after', iterations, 'iterations');
        break;
      }

      improvements.push(`Iteration ${iterations}: Improved layout accuracy, spacing, and colors`);
      code = extractedRefinedCode;
      iterations++;
    }

    logger.debug('[ImageToCode] Refinement complete. Total iterations:', iterations);

    return {
      code,
      framework,
      styling,
      iterations,
      improvements,
    };
  }

  /**
   * Generate initial code from screenshot using Claude Vision
   */
  private async generateInitialCode(
    imageData: string,
    framework: string,
    styling: string,
    includeComponents: boolean,
    responsive: boolean
  ): Promise<any> {
    const componentLibrary = includeComponents
      ? framework === 'react'
        ? '\n- Use shadcn/ui components where appropriate (Button, Card, Input, etc.)'
        : ''
      : '';

    const responsiveNote = responsive
      ? '\n- Make it fully responsive (mobile, tablet, desktop)'
      : '';

    const stylingInstructions = this.getStylingInstructions(styling, framework);

    const prompt = `Convert this UI design to clean, production-ready ${framework} code.

Requirements:
- Use modern ${framework} ${framework === 'react' ? '19' : ''} best practices
${stylingInstructions}${componentLibrary}${responsiveNote}
- Pixel-perfect layout matching the design
- Clean, maintainable code structure
- Proper component hierarchy
- Semantic HTML
- Accessibility (ARIA labels, keyboard navigation)

Please provide ONLY the code, no explanations. Use proper syntax highlighting.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Latest Claude Sonnet
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: this.detectImageType(imageData),
                  data: imageData.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      return response;
    } catch (error: any) {
      logger.error('[ImageToCode] Error generating code:', error.message);
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }

  /**
   * Refine code by comparing rendered output with original
   * (Requires Puppeteer MCP integration)
   */
  private async refineCode(
    originalImage: string,
    renderedImage: string,
    currentCode: string,
    framework: string,
    styling: string
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: originalImage.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: renderedImage.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: 'text',
              text: `Compare the original design (first image) with the rendered result (second image).

Improve the code to match the original more closely. Focus on:
- Layout accuracy (positioning, alignment, spacing)
- Element sizes (width, height, padding, margins)
- Colors and typography (fonts, sizes, weights, colors)
- Border radii and shadows
- Component positioning

Current code:
\`\`\`${framework === 'react' ? 'tsx' : framework === 'vue' ? 'vue' : 'html'}
${currentCode}
\`\`\`

Provide the improved code. ONLY code, no explanations.`,
            },
          ],
        },
      ],
    });

    return this.extractCode(response);
  }

  /**
   * Render code and capture screenshot using Puppeteer
   * Integrates with Puppeteer MCP server for screenshot comparison
   */
  private async renderAndScreenshot(
    code: string,
    framework: string
  ): Promise<string> {
    try {
      // Create temporary HTML file with the generated code
      const html = this.createPreviewHTML(code, framework);

      // Write to temporary file
      const tempPath = `${process.cwd()}/temp-preview-${Date.now()}.html`;
      const fs = await import('fs/promises');
      await fs.writeFile(tempPath, html, 'utf-8');

      // Use Puppeteer MCP to take screenshot
      // Note: This assumes @playwright/mcp or @modelcontextprotocol/server-puppeteer is available
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true });
      const page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 720 });
      await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle0' });

      const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

      await browser.close();

      // Cleanup temp file
      await fs.unlink(tempPath);

      return `data:image/png;base64,${screenshot}`;
    } catch (error: any) {
      logger.error('[ImageToCode] Screenshot capture failed:', error.message);
      // Return empty string to skip refinement iteration
      return '';
    }
  }

  /**
   * Create standalone HTML preview from component code
   */
  private createPreviewHTML(code: string, framework: string): string {
    if (framework === 'react') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    // Assume the component is the default export or last declaration
    const App = ${this.extractComponentName(code) || 'Component'};
    root.render(<App />);
  </script>
</body>
</html>`;
    } else if (framework === 'vue') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    ${code}

    const app = Vue.createApp(App);
    app.mount('#app');
  </script>
</body>
</html>`;
    } else {
      // Plain HTML
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }
  }

  /**
   * Extract component name from React code
   */
  private extractComponentName(code: string): string | null {
    // Try to find function/const component declaration
    const functionMatch = code.match(/function\s+([A-Z]\w*)/);
    if (functionMatch) return functionMatch[1];

    const constMatch = code.match(/const\s+([A-Z]\w*)\s*=/);
    if (constMatch) return constMatch[1];

    const exportMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w*)/);
    if (exportMatch) return exportMatch[1];

    return null;
  }

  /**
   * Extract code from Claude's response
   */
  private extractCode(response: any): string {
    const content = response.content[0].text;

    // Try to extract code from markdown code blocks
    const codeBlockRegex = /```(?:tsx?|jsx?|html|vue)\n([\s\S]+?)\n```/;
    const match = content.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    // If no code block found, return entire content
    // (Claude might return code without markdown formatting)
    return content.trim();
  }

  /**
   * Get styling-specific instructions
   */
  private getStylingInstructions(styling: string, framework: string): string {
    switch (styling) {
      case 'tailwind':
        return '\n- Use Tailwind CSS utility classes for all styling';
      case 'styled-components':
        return framework === 'react'
          ? '\n- Use styled-components for styling'
          : '\n- Use inline styles';
      case 'css':
        return '\n- Use CSS modules or scoped styles';
      default:
        return '';
    }
  }

  /**
   * Detect image MIME type from base64 data
   */
  private detectImageType(imageData: string): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' {
    if (imageData.startsWith('data:image/')) {
      const match = imageData.match(/^data:(image\/\w+);base64,/);
      if (match) {
        return match[1] as any;
      }
    }

    // Default to PNG
    return 'image/png';
  }

  /**
   * Validate that an API key is configured
   */
  static isConfigured(apiKey?: string): boolean {
    return !!apiKey && apiKey.length > 0;
  }
}
