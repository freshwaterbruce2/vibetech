/**
 * VibeTech Button Component - Modern 2025 Design
 */

import { cn } from '../../lib/utils.js';

export class VibeTechButton {
  constructor(options = {}) {
    this.variant = options.variant || 'primary';
    this.size = options.size || 'default';
    this.disabled = options.disabled || false;
    this.loading = options.loading || false;
    this.onClick = options.onClick || (() => {});
    this.children = options.children || '';
    this.className = options.className || '';
    this.neonGlow = options.neonGlow !== false; // Default to true

    this.element = this.createElement();
  }

  createElement() {
    const button = document.createElement('button');
    button.innerHTML = this.getContent();
    button.className = this.getClasses();
    button.disabled = this.disabled || this.loading;

    // Add click handler
    button.addEventListener('click', (e) => {
      if (!this.disabled && !this.loading) {
        this.onClick(e);
      }
    });

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      if (this.neonGlow && !this.disabled) {
        button.style.boxShadow = '0 0 20px var(--vt-cyan), 0 0 40px var(--vt-cyan)';
        button.style.transform = 'scale(1.05)';
      }
    });

    button.addEventListener('mouseleave', () => {
      button.style.boxShadow = '';
      button.style.transform = '';
    });

    return button;
  }

  getClasses() {
    const baseClasses = cn(
      // Base button styles
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-vibetech-cyan/50 focus:ring-offset-2 focus:ring-offset-background',
      'disabled:pointer-events-none disabled:opacity-50',
      'relative overflow-hidden',

      // Size variants
      {
        'h-8 px-3 text-sm': this.size === 'sm',
        'h-10 px-4 py-2': this.size === 'default',
        'h-12 px-6 text-lg': this.size === 'lg'
      },

      // Variant styles
      this.getVariantClasses(),

      // Custom classes
      this.className
    );

    return baseClasses;
  }

  getVariantClasses() {
    const variants = {
      primary: cn(
        'bg-gradient-to-r from-vibetech-purple to-vibetech-cyan',
        'text-black font-semibold',
        'hover:from-vibetech-purple/90 hover:to-vibetech-cyan/90',
        'shadow-lg hover:shadow-xl',
        this.neonGlow ? 'shadow-glow' : ''
      ),
      secondary: cn(
        'glass border border-vibetech-cyan/30',
        'text-white hover:text-vibetech-cyan',
        'hover:border-vibetech-cyan/60 hover:bg-vibetech-cyan/10'
      ),
      ghost: cn(
        'text-vibetech-cyan hover:text-white',
        'hover:bg-vibetech-cyan/10'
      ),
      outline: cn(
        'border-2 border-vibetech-cyan text-vibetech-cyan',
        'hover:bg-vibetech-cyan hover:text-black',
        'transition-all duration-300'
      ),
      danger: cn(
        'bg-gradient-to-r from-red-500 to-red-600',
        'text-white hover:from-red-600 hover:to-red-700',
        'shadow-lg hover:shadow-xl'
      ),
      success: cn(
        'bg-gradient-to-r from-green-500 to-emerald-500',
        'text-black hover:from-green-600 hover:to-emerald-600',
        'shadow-lg hover:shadow-xl'
      )
    };

    return variants[this.variant] || variants.primary;
  }

  getContent() {
    if (this.loading) {
      return `
        <div class="flex items-center space-x-2">
          <div class="loading-spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      `;
    }

    return this.children;
  }

  // Update methods
  setLoading(loading) {
    this.loading = loading;
    this.element.disabled = this.disabled || loading;
    this.element.innerHTML = this.getContent();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.element.disabled = disabled || this.loading;
  }

  setText(text) {
    this.children = text;
    if (!this.loading) {
      this.element.innerHTML = this.getContent();
    }
  }

  // Static helper method to create button quickly
  static create(text, options = {}) {
    return new VibeTechButton({
      ...options,
      children: text
    });
  }
}

// Export for use in HTML
window.VibeTechButton = VibeTechButton;