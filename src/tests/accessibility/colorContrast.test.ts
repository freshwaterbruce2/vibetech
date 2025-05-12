
/**
 * Color contrast accessibility test
 * Uses WebAIM algorithm to check if text+background color combinations meet WCAG standards
 */

// Utility to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  const bigint = parseInt(hex, 16);
  
  // If parsing fails, return null
  if (isNaN(bigint)) return null;
  
  // Extract RGB components
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
}

// Calculate relative luminance (per WCAG)
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate contrast ratio using WebAIM algorithm
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1; // Return 1 (no contrast) if invalid colors
  
  const luminance1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const luminance2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Color contrast tests', () => {
  // Define our colors from the new tokens
  const colors = {
    cyan: '#00F0FF',       // --c-cyan
    purple: '#8A00C4',     // --c-purple
    darkBg: '#0B0B17',     // --bg-start
    white: '#FFFFFF',      // For text
  };
  
  const contrastThreshold = 4.5; // WCAG AA standard for normal text
  
  test('Cyan on dark background has sufficient contrast', () => {
    const ratio = getContrastRatio(colors.cyan, colors.darkBg);
    expect(ratio).toBeGreaterThanOrEqual(contrastThreshold);
  });
  
  test('Purple on dark background has sufficient contrast', () => {
    const ratio = getContrastRatio(colors.purple, colors.darkBg);
    expect(ratio).toBeGreaterThanOrEqual(contrastThreshold);
  });
  
  test('Dark background on cyan has sufficient contrast', () => {
    const ratio = getContrastRatio(colors.darkBg, colors.cyan);
    expect(ratio).toBeGreaterThanOrEqual(contrastThreshold);
  });
  
  test('Dark background on purple has sufficient contrast', () => {
    const ratio = getContrastRatio(colors.darkBg, colors.purple);
    expect(ratio).toBeGreaterThanOrEqual(contrastThreshold);
  });
  
  test('White on dark background has sufficient contrast', () => {
    const ratio = getContrastRatio(colors.white, colors.darkBg);
    expect(ratio).toBeGreaterThanOrEqual(contrastThreshold);
  });
});

// Export for possible reuse in other tests
export { getContrastRatio };
