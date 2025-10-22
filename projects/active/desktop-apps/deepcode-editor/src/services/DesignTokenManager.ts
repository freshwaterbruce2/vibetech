/**
 * DesignTokenManager - Manage design tokens and themes
 *
 * Features:
 * - Color palettes
 * - Typography scales
 * - Spacing system
 * - Border radii
 * - Shadows
 * - Export to CSS/Tailwind/JS
 */

export interface ColorToken {
  name: string;
  value: string;
  description?: string;
}

export interface TypographyToken {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing?: string;
}

export interface SpacingToken {
  name: string;
  value: string;
}

export interface ShadowToken {
  name: string;
  value: string;
}

export interface BorderRadiusToken {
  name: string;
  value: string;
}

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  shadows: ShadowToken[];
  borderRadius: BorderRadiusToken[];
}

export type ExportFormat = 'css' | 'tailwind' | 'javascript' | 'typescript' | 'scss';

export class DesignTokenManager {
  private tokens: DesignTokens;

  constructor(tokens?: DesignTokens) {
    this.tokens = tokens || this.getDefaultTokens();
  }

  /**
   * Get default design tokens (shadcn/ui-inspired)
   */
  private getDefaultTokens(): DesignTokens {
    return {
      colors: [
        { name: 'primary', value: '#3b82f6', description: 'Primary brand color' },
        { name: 'primary-foreground', value: '#ffffff', description: 'Text on primary' },
        { name: 'secondary', value: '#64748b', description: 'Secondary accent' },
        { name: 'secondary-foreground', value: '#ffffff', description: 'Text on secondary' },
        { name: 'background', value: '#ffffff', description: 'Page background' },
        { name: 'foreground', value: '#0f172a', description: 'Main text color' },
        { name: 'muted', value: '#f1f5f9', description: 'Muted backgrounds' },
        { name: 'muted-foreground', value: '#64748b', description: 'Muted text' },
        { name: 'accent', value: '#f1f5f9', description: 'Accent backgrounds' },
        { name: 'accent-foreground', value: '#0f172a', description: 'Accent text' },
        { name: 'destructive', value: '#ef4444', description: 'Destructive actions' },
        { name: 'destructive-foreground', value: '#ffffff', description: 'Text on destructive' },
        { name: 'border', value: '#e2e8f0', description: 'Border color' },
        { name: 'input', value: '#e2e8f0', description: 'Input border' },
        { name: 'ring', value: '#3b82f6', description: 'Focus ring' },
      ],
      typography: [
        { name: 'xs', fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' },
        { name: 'sm', fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
        { name: 'base', fontSize: '1rem', lineHeight: '1.5rem', fontWeight: '400' },
        { name: 'lg', fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: '400' },
        { name: 'xl', fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '500' },
        { name: '2xl', fontSize: '1.5rem', lineHeight: '2rem', fontWeight: '600' },
        { name: '3xl', fontSize: '1.875rem', lineHeight: '2.25rem', fontWeight: '700' },
        { name: '4xl', fontSize: '2.25rem', lineHeight: '2.5rem', fontWeight: '700' },
      ],
      spacing: [
        { name: '0', value: '0px' },
        { name: '1', value: '0.25rem' },
        { name: '2', value: '0.5rem' },
        { name: '3', value: '0.75rem' },
        { name: '4', value: '1rem' },
        { name: '5', value: '1.25rem' },
        { name: '6', value: '1.5rem' },
        { name: '8', value: '2rem' },
        { name: '10', value: '2.5rem' },
        { name: '12', value: '3rem' },
        { name: '16', value: '4rem' },
        { name: '20', value: '5rem' },
      ],
      shadows: [
        { name: 'sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
        { name: 'base', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
        { name: 'md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
        { name: 'lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
        { name: 'xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
      ],
      borderRadius: [
        { name: 'none', value: '0px' },
        { name: 'sm', value: '0.125rem' },
        { name: 'base', value: '0.25rem' },
        { name: 'md', value: '0.375rem' },
        { name: 'lg', value: '0.5rem' },
        { name: 'xl', value: '0.75rem' },
        { name: '2xl', value: '1rem' },
        { name: 'full', value: '9999px' },
      ],
    };
  }

  getTokens(): DesignTokens {
    return this.tokens;
  }

  updateTokens(tokens: Partial<DesignTokens>): void {
    this.tokens = { ...this.tokens, ...tokens };
  }

  addColor(token: ColorToken): void {
    this.tokens.colors.push(token);
  }

  updateColor(name: string, updates: Partial<ColorToken>): void {
    const index = this.tokens.colors.findIndex((t) => t.name === name);
    if (index !== -1) {
      this.tokens.colors[index] = { ...this.tokens.colors[index], ...updates };
    }
  }

  deleteColor(name: string): void {
    this.tokens.colors = this.tokens.colors.filter((t) => t.name !== name);
  }

  export(format: ExportFormat): string {
    switch (format) {
      case 'css':
        return this.exportToCSS();
      case 'tailwind':
        return this.exportToTailwind();
      case 'javascript':
        return this.exportToJavaScript();
      case 'typescript':
        return this.exportToTypeScript();
      case 'scss':
        return this.exportToSCSS();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCSS(): string {
    let css = ':root {\n';
    css += '  /* Colors */\n';
    this.tokens.colors.forEach((token) => {
      css += `  --${token.name}: ${token.value};${token.description ? ` /* ${token.description} */` : ''}\n`;
    });
    css += '\n  /* Typography */\n';
    this.tokens.typography.forEach((token) => {
      css += `  --text-${token.name}: ${token.fontSize};\n`;
      css += `  --text-${token.name}-line-height: ${token.lineHeight};\n`;
      css += `  --text-${token.name}-font-weight: ${token.fontWeight};\n`;
    });
    css += '\n  /* Spacing */\n';
    this.tokens.spacing.forEach((token) => {
      css += `  --space-${token.name}: ${token.value};\n`;
    });
    css += '\n  /* Shadows */\n';
    this.tokens.shadows.forEach((token) => {
      css += `  --shadow-${token.name}: ${token.value};\n`;
    });
    css += '\n  /* Border Radius */\n';
    this.tokens.borderRadius.forEach((token) => {
      css += `  --radius-${token.name}: ${token.value};\n`;
    });
    css += '}\n';
    return css;
  }

  private exportToTailwind(): string {
    const config: any = {
      theme: {
        extend: {
          colors: {},
          fontSize: {},
          spacing: {},
          boxShadow: {},
          borderRadius: {},
        },
      },
    };
    this.tokens.colors.forEach((token) => {
      config.theme.extend.colors[token.name] = token.value;
    });
    this.tokens.typography.forEach((token) => {
      config.theme.extend.fontSize[token.name] = [
        token.fontSize,
        { lineHeight: token.lineHeight, fontWeight: token.fontWeight },
      ];
    });
    this.tokens.spacing.forEach((token) => {
      config.theme.extend.spacing[token.name] = token.value;
    });
    this.tokens.shadows.forEach((token) => {
      config.theme.extend.boxShadow[token.name] = token.value;
    });
    this.tokens.borderRadius.forEach((token) => {
      config.theme.extend.borderRadius[token.name] = token.value;
    });
    return `module.exports = ${JSON.stringify(config, null, 2)}`;
  }

  private exportToJavaScript(): string {
    return `export const designTokens = ${JSON.stringify(this.tokens, null, 2)};`;
  }

  private exportToTypeScript(): string {
    let ts = 'export interface DesignTokens {\n';
    ts += '  colors: Record<string, string>;\n';
    ts += '  typography: Record<string, { fontSize: string; lineHeight: string; fontWeight: string }>;\n';
    ts += '  spacing: Record<string, string>;\n';
    ts += '  shadows: Record<string, string>;\n';
    ts += '  borderRadius: Record<string, string>;\n';
    ts += '}\n\n';
    ts += 'export const designTokens: DesignTokens = {\n';
    ts += '  colors: {\n';
    this.tokens.colors.forEach((token, i) => {
      ts += `    '${token.name}': '${token.value}'${i < this.tokens.colors.length - 1 ? ',' : ''}\n`;
    });
    ts += '  },\n';
    ts += '  typography: {\n';
    this.tokens.typography.forEach((token, i) => {
      ts += `    '${token.name}': { fontSize: '${token.fontSize}', lineHeight: '${token.lineHeight}', fontWeight: '${token.fontWeight}' }${i < this.tokens.typography.length - 1 ? ',' : ''}\n`;
    });
    ts += '  },\n';
    ts += '  spacing: {\n';
    this.tokens.spacing.forEach((token, i) => {
      ts += `    '${token.name}': '${token.value}'${i < this.tokens.spacing.length - 1 ? ',' : ''}\n`;
    });
    ts += '  },\n';
    ts += '  shadows: {\n';
    this.tokens.shadows.forEach((token, i) => {
      ts += `    '${token.name}': '${token.value}'${i < this.tokens.shadows.length - 1 ? ',' : ''}\n`;
    });
    ts += '  },\n';
    ts += '  borderRadius: {\n';
    this.tokens.borderRadius.forEach((token, i) => {
      ts += `    '${token.name}': '${token.value}'${i < this.tokens.borderRadius.length - 1 ? ',' : ''}\n`;
    });
    ts += '  },\n';
    ts += '};\n';
    return ts;
  }

  private exportToSCSS(): string {
    let scss = '// Colors\n';
    this.tokens.colors.forEach((token) => {
      scss += `$${token.name}: ${token.value};${token.description ? ` // ${token.description}` : ''}\n`;
    });
    scss += '\n// Typography\n';
    this.tokens.typography.forEach((token) => {
      scss += `$text-${token.name}: ${token.fontSize};\n`;
      scss += `$text-${token.name}-line-height: ${token.lineHeight};\n`;
      scss += `$text-${token.name}-font-weight: ${token.fontWeight};\n`;
    });
    scss += '\n// Spacing\n';
    this.tokens.spacing.forEach((token) => {
      scss += `$space-${token.name}: ${token.value};\n`;
    });
    scss += '\n// Shadows\n';
    this.tokens.shadows.forEach((token) => {
      scss += `$shadow-${token.name}: ${token.value};\n`;
    });
    scss += '\n// Border Radius\n';
    this.tokens.borderRadius.forEach((token) => {
      scss += `$radius-${token.name}: ${token.value};\n`;
    });
    return scss;
  }

  static fromJSON(json: string): DesignTokenManager {
    const tokens = JSON.parse(json) as DesignTokens;
    return new DesignTokenManager(tokens);
  }

  saveToLocalStorage(key: string = 'design-tokens'): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(this.tokens));
    }
  }

  static loadFromLocalStorage(key: string = 'design-tokens'): DesignTokenManager | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        return DesignTokenManager.fromJSON(stored);
      }
    }
    return null;
  }
}

export default DesignTokenManager;
