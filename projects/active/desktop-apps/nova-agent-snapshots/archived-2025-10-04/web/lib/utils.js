/**
 * VibeTech NOVA - Modern utility functions for UI components
 */

/**
 * Merge class names with support for conditional classes
 * @param {...string} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Create VibeTech neon glow effect
 * @param {string} color - Color for glow effect ('cyan' | 'purple' | 'green' | 'red')
 * @returns {string}
 */
export function createNeonGlow(color = 'cyan') {
  const colors = {
    cyan: '#00D4D4',
    purple: '#9333EA',
    green: '#00FF94',
    red: '#FF0055'
  };

  const glowColor = colors[color] || colors.cyan;
  return `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 40px ${glowColor}`;
}

/**
 * Format message content with VibeTech styling
 * @param {string} content
 * @returns {string}
 */
export function formatMessage(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="gradient-vibetech-text">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-vibetech-cyan">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-vibetech-dark px-2 py-1 rounded border border-vibetech-cyan/30 text-vibetech-cyan font-mono">$1</code>')
    .replace(/\n/g, '<br>');
}

/**
 * Animate element with VibeTech effects
 * @param {HTMLElement} element
 * @param {string} animation
 */
export function animateElement(element, animation = 'slide-up') {
  if (!element) return;

  element.classList.remove('slide-up', 'fade-in', 'glow-pulse');
  element.classList.add(animation);
}

/**
 * Generate unique ID for components
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'vt') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for performance
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * VibeTech color palette
 */
export const vibetech = {
  colors: {
    black: '#0A0A0F',
    dark: '#1A1A1F',
    tertiary: '#2A2A2F',
    cyan: {
      50: '#E5FFFE',
      100: '#CCFFFE',
      500: '#00D4D4',
      600: '#00B8B8',
      900: '#006464'
    },
    purple: {
      50: '#F3E8FF',
      500: '#9333EA',
      600: '#7C3AED',
      900: '#4C1D95'
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg, #9333EA 0%, #00D4D4 100%)',
    card: 'linear-gradient(145deg, rgba(26, 26, 31, 0.6) 0%, rgba(42, 42, 47, 0.4) 100%)'
  }
};