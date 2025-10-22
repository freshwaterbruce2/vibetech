/**
 * VibeTech Toast Component - Modern Notification System
 */

import { cn, generateId } from '../../lib/utils.js';

export class VibeTechToast {
  constructor(options = {}) {
    this.message = options.message || '';
    this.type = options.type || 'info';
    this.duration = options.duration || 4000;
    this.position = options.position || 'top-right';
    this.showIcon = options.showIcon !== false;
    this.showClose = options.showClose !== false;
    this.onClose = options.onClose || (() => {});
    this.className = options.className || '';
    this.id = generateId('toast');

    this.element = null;
    this.container = this.getOrCreateContainer();
    this.timeoutId = null;

    this.show();
  }

  getOrCreateContainer() {
    let container = document.querySelector('.vibetech-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'vibetech-toast-container fixed z-50 pointer-events-none';
      container.style.cssText = this.getContainerPosition();
      document.body.appendChild(container);
    }
    return container;
  }

  getContainerPosition() {
    const positions = {
      'top-right': 'top: 1rem; right: 1rem;',
      'top-left': 'top: 1rem; left: 1rem;',
      'bottom-right': 'bottom: 1rem; right: 1rem;',
      'bottom-left': 'bottom: 1rem; left: 1rem;',
      'top-center': 'top: 1rem; left: 50%; transform: translateX(-50%);',
      'bottom-center': 'bottom: 1rem; left: 50%; transform: translateX(-50%);'
    };

    return positions[this.position] || positions['top-right'];
  }

  createElement() {
    const toast = document.createElement('div');
    toast.id = this.id;
    toast.className = this.getClasses();
    toast.innerHTML = this.getHTML();

    // Add event listeners
    if (this.showClose) {
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }
    }

    // Auto-hide timer
    if (this.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, this.duration);
    }

    return toast;
  }

  getClasses() {
    const baseClasses = cn(
      // Base toast styles
      'glass rounded-lg p-4 mb-3 min-w-[300px] max-w-[400px]',
      'pointer-events-auto transform transition-all duration-300',
      'shadow-lg border backdrop-blur-md',

      // Animation classes
      'animate-slide-up',

      // Type-specific styles
      this.getTypeClasses(),

      // Custom classes
      this.className
    );

    return baseClasses;
  }

  getTypeClasses() {
    const types = {
      info: 'border-vibetech-cyan/30 bg-vibetech-dark/90',
      success: 'border-green-500/30 bg-green-900/20',
      error: 'border-red-500/30 bg-red-900/20',
      warning: 'border-yellow-500/30 bg-yellow-900/20',
      loading: 'border-vibetech-purple/30 bg-vibetech-purple/10'
    };

    return types[this.type] || types.info;
  }

  getHTML() {
    const icon = this.getIcon();

    return `
      <div class="flex items-start space-x-3">
        ${this.showIcon ? `<div class="flex-shrink-0">${icon}</div>` : ''}

        <div class="flex-1 min-w-0">
          <div class="text-white text-sm leading-relaxed">${this.message}</div>
        </div>

        ${this.showClose ? `
          <button class="toast-close flex-shrink-0 ml-2 text-gray-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        ` : ''}
      </div>

      ${this.type === 'loading' ? `
        <div class="mt-2">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      ` : ''}
    `;
  }

  getIcon() {
    const icons = {
      info: `
        <div class="w-5 h-5 rounded-full bg-vibetech-cyan flex items-center justify-center">
          <svg class="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `,
      success: `
        <div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `,
      error: `
        <div class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `,
      warning: `
        <div class="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
          <svg class="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `,
      loading: `
        <div class="w-5 h-5 rounded-full bg-vibetech-purple flex items-center justify-center">
          <div class="loading-spinner w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      `
    };

    return icons[this.type] || icons.info;
  }

  show() {
    this.element = this.createElement();

    // Add with animation
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(-10px)';
    this.container.appendChild(this.element);

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.style.opacity = '1';
      this.element.style.transform = 'translateY(0)';
    });
  }

  hide() {
    if (!this.element) return;

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Animate out
    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(-10px)';

    // Remove after animation
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.onClose();
    }, 300);
  }

  // Update methods
  updateMessage(message) {
    this.message = message;
    if (this.element) {
      const messageEl = this.element.querySelector('.text-white');
      if (messageEl) {
        messageEl.innerHTML = message;
      }
    }
  }

  // Static factory methods
  static show(message, options = {}) {
    return new VibeTechToast({ ...options, message });
  }

  static info(message, options = {}) {
    return new VibeTechToast({ ...options, message, type: 'info' });
  }

  static success(message, options = {}) {
    return new VibeTechToast({ ...options, message, type: 'success' });
  }

  static error(message, options = {}) {
    return new VibeTechToast({ ...options, message, type: 'error', duration: 6000 });
  }

  static warning(message, options = {}) {
    return new VibeTechToast({ ...options, message, type: 'warning' });
  }

  static loading(message = 'Loading...', options = {}) {
    return new VibeTechToast({ ...options, message, type: 'loading', duration: 0 });
  }

  // Clear all toasts
  static clearAll() {
    const container = document.querySelector('.vibetech-toast-container');
    if (container) {
      container.innerHTML = '';
    }
  }
}

// Export for use in HTML
window.VibeTechToast = VibeTechToast;