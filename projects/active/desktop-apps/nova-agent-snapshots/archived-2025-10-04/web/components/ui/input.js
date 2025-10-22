/**
 * VibeTech Input Component - Modern 2025 Design with Neon Effects
 */

import { cn, generateId } from '../../lib/utils.js';

export class VibeTechInput {
  constructor(options = {}) {
    this.type = options.type || 'text';
    this.placeholder = options.placeholder || '';
    this.value = options.value || '';
    this.disabled = options.disabled || false;
    this.required = options.required || false;
    this.size = options.size || 'default';
    this.variant = options.variant || 'default';
    this.label = options.label || '';
    this.error = options.error || '';
    this.success = options.success || false;
    this.icon = options.icon || '';
    this.onInput = options.onInput || (() => {});
    this.onChange = options.onChange || (() => {});
    this.onFocus = options.onFocus || (() => {});
    this.onBlur = options.onBlur || (() => {});
    this.className = options.className || '';
    this.id = options.id || generateId('input');

    this.element = this.createElement();
  }

  createElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'vibetech-input-wrapper';
    wrapper.innerHTML = this.getHTML();

    // Get references to input and elements
    this.inputElement = wrapper.querySelector('input, textarea');
    this.labelElement = wrapper.querySelector('.vibetech-input-label');
    this.errorElement = wrapper.querySelector('.vibetech-input-error');

    this.bindEvents();
    return wrapper;
  }

  getHTML() {
    const inputClasses = this.getInputClasses();
    const wrapperClasses = this.getWrapperClasses();

    return `
      ${this.label ? `<label class="vibetech-input-label block text-sm font-medium text-gray-300 mb-2" for="${this.id}">${this.label}</label>` : ''}

      <div class="${wrapperClasses}">
        ${this.icon ? `<div class="vibetech-input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">${this.icon}</div>` : ''}

        ${this.type === 'textarea' ?
          `<textarea
            id="${this.id}"
            placeholder="${this.placeholder}"
            class="${inputClasses}"
            ${this.disabled ? 'disabled' : ''}
            ${this.required ? 'required' : ''}
          >${this.value}</textarea>` :
          `<input
            type="${this.type}"
            id="${this.id}"
            value="${this.value}"
            placeholder="${this.placeholder}"
            class="${inputClasses}"
            ${this.disabled ? 'disabled' : ''}
            ${this.required ? 'required' : ''}
          />`
        }
      </div>

      ${this.error ? `<p class="vibetech-input-error mt-2 text-sm text-red-400">${this.error}</p>` : ''}
      ${this.success && !this.error ? `<p class="vibetech-input-success mt-2 text-sm text-green-400">✓ Looks good!</p>` : ''}
    `;
  }

  getWrapperClasses() {
    return cn(
      'relative',
      this.icon ? 'pl-10' : ''
    );
  }

  getInputClasses() {
    const baseClasses = cn(
      // Base input styles
      'w-full rounded-lg border backdrop-blur-sm transition-all duration-200',
      'text-white placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-vibetech-black',

      // Size variants
      {
        'px-3 py-2 text-sm': this.size === 'sm',
        'px-4 py-3': this.size === 'default',
        'px-5 py-4 text-lg': this.size === 'lg'
      },

      // Textarea specific
      this.type === 'textarea' ? 'min-h-[100px] resize-none' : 'h-auto',

      // Icon padding
      this.icon ? 'pl-10' : '',

      // Variant styles
      this.getVariantClasses(),

      // State styles
      this.disabled ? 'opacity-50 cursor-not-allowed' : '',

      // Custom classes
      this.className
    );

    return baseClasses;
  }

  getVariantClasses() {
    if (this.error) {
      return cn(
        'bg-red-900/20 border-red-500/50',
        'focus:border-red-400 focus:ring-red-400/50'
      );
    }

    if (this.success) {
      return cn(
        'bg-green-900/20 border-green-500/50',
        'focus:border-green-400 focus:ring-green-400/50'
      );
    }

    const variants = {
      default: cn(
        'glass border-gray-600',
        'focus:border-vibetech-cyan focus:ring-vibetech-cyan/50',
        'hover:border-gray-500'
      ),
      neon: cn(
        'glass border-vibetech-cyan/30',
        'focus:border-vibetech-cyan focus:ring-vibetech-cyan/50 focus:shadow-glow',
        'hover:border-vibetech-cyan/50 hover:shadow-glow-sm'
      ),
      minimal: cn(
        'bg-transparent border-gray-700',
        'focus:border-vibetech-purple focus:ring-vibetech-purple/50',
        'hover:border-gray-600'
      )
    };

    return variants[this.variant] || variants.default;
  }

  bindEvents() {
    if (!this.inputElement) return;

    // Input event
    this.inputElement.addEventListener('input', (e) => {
      this.value = e.target.value;
      this.onInput(e.target.value, e);
    });

    // Change event
    this.inputElement.addEventListener('change', (e) => {
      this.onChange(e.target.value, e);
    });

    // Focus event
    this.inputElement.addEventListener('focus', (e) => {
      if (this.variant === 'neon' || this.variant === 'default') {
        e.target.style.boxShadow = '0 0 0 2px var(--vt-cyan)';
      }
      this.onFocus(e);
    });

    // Blur event
    this.inputElement.addEventListener('blur', (e) => {
      e.target.style.boxShadow = '';
      this.onBlur(e);
    });

    // Auto-resize for textarea
    if (this.type === 'textarea') {
      this.inputElement.addEventListener('input', () => {
        this.inputElement.style.height = 'auto';
        this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 300) + 'px';
      });
    }
  }

  // Public methods
  getValue() {
    return this.inputElement ? this.inputElement.value : this.value;
  }

  setValue(value) {
    this.value = value;
    if (this.inputElement) {
      this.inputElement.value = value;
    }
  }

  setError(error) {
    this.error = error;
    this.success = false;
    this.updateErrorDisplay();
    this.updateInputClasses();
  }

  setSuccess(success = true) {
    this.success = success;
    if (success) this.error = '';
    this.updateErrorDisplay();
    this.updateInputClasses();
  }

  clearError() {
    this.error = '';
    this.updateErrorDisplay();
    this.updateInputClasses();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.inputElement) {
      this.inputElement.disabled = disabled;
    }
  }

  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  blur() {
    if (this.inputElement) {
      this.inputElement.blur();
    }
  }

  // Private methods
  updateErrorDisplay() {
    if (this.errorElement) {
      if (this.error) {
        this.errorElement.textContent = this.error;
        this.errorElement.className = 'vibetech-input-error mt-2 text-sm text-red-400';
      } else if (this.success) {
        this.errorElement.textContent = '✓ Looks good!';
        this.errorElement.className = 'vibetech-input-success mt-2 text-sm text-green-400';
      } else {
        this.errorElement.textContent = '';
        this.errorElement.className = 'hidden';
      }
    }
  }

  updateInputClasses() {
    if (this.inputElement) {
      this.inputElement.className = this.getInputClasses();
    }
  }

  // Static factory methods
  static create(options = {}) {
    return new VibeTechInput(options);
  }

  static createTextarea(options = {}) {
    return new VibeTechInput({
      ...options,
      type: 'textarea'
    });
  }

  static createPassword(options = {}) {
    return new VibeTechInput({
      ...options,
      type: 'password'
    });
  }

  static createEmail(options = {}) {
    return new VibeTechInput({
      ...options,
      type: 'email'
    });
  }
}

// Export for use in HTML
window.VibeTechInput = VibeTechInput;