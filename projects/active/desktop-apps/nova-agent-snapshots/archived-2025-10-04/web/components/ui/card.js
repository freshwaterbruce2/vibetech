/**
 * VibeTech Card Component - Modern Glass Morphism Design
 */

import { cn, generateId } from '../../lib/utils.js';

export class VibeTechCard {
  constructor(options = {}) {
    this.variant = options.variant || 'default';
    this.size = options.size || 'default';
    this.neonBorder = options.neonBorder || false;
    this.hover = options.hover !== false; // Default to true
    this.className = options.className || '';
    this.id = options.id || generateId('card');

    this.element = this.createElement();
  }

  createElement() {
    const card = document.createElement('div');
    card.className = this.getClasses();
    card.id = this.id;

    // Add hover effects
    if (this.hover) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        if (this.neonBorder) {
          card.style.boxShadow = '0 0 20px var(--vt-cyan), 0 8px 32px rgba(0, 212, 212, 0.2)';
        } else {
          card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    }

    return card;
  }

  getClasses() {
    const baseClasses = cn(
      // Base card styles
      'rounded-xl transition-all duration-300',
      'border backdrop-blur-md',

      // Size variants
      {
        'p-3': this.size === 'sm',
        'p-6': this.size === 'default',
        'p-8': this.size === 'lg'
      },

      // Variant styles
      this.getVariantClasses(),

      // Neon border
      this.neonBorder ? 'border-vibetech-cyan shadow-glow' : '',

      // Custom classes
      this.className
    );

    return baseClasses;
  }

  getVariantClasses() {
    const variants = {
      default: cn(
        'glass border-vibetech-cyan/20',
        this.hover ? 'hover:border-vibetech-cyan/40' : ''
      ),
      solid: cn(
        'bg-vibetech-dark border-gray-700',
        this.hover ? 'hover:border-vibetech-cyan/50' : ''
      ),
      transparent: cn(
        'bg-transparent border-vibetech-cyan/10',
        this.hover ? 'hover:bg-vibetech-dark/20 hover:border-vibetech-cyan/30' : ''
      ),
      gradient: cn(
        'bg-gradient-to-br from-vibetech-dark via-vibetech-tertiary to-vibetech-dark',
        'border-vibetech-purple/30',
        this.hover ? 'hover:border-vibetech-purple/60' : ''
      ),
      error: cn(
        'bg-red-900/20 border-red-500/30',
        this.hover ? 'hover:border-red-500/60' : ''
      ),
      success: cn(
        'bg-green-900/20 border-green-500/30',
        this.hover ? 'hover:border-green-500/60' : ''
      ),
      warning: cn(
        'bg-yellow-900/20 border-yellow-500/30',
        this.hover ? 'hover:border-yellow-500/60' : ''
      )
    };

    return variants[this.variant] || variants.default;
  }

  // Content management methods
  setContent(html) {
    this.element.innerHTML = html;
    return this;
  }

  addContent(html) {
    this.element.insertAdjacentHTML('beforeend', html);
    return this;
  }

  // Header, body, footer methods
  addHeader(title, subtitle = '') {
    const headerHtml = `
      <div class="card-header ${this.size === 'sm' ? 'pb-2' : 'pb-4'}">
        <h3 class="text-lg font-semibold gradient-vibetech-text">${title}</h3>
        ${subtitle ? `<p class="text-sm text-gray-400 mt-1">${subtitle}</p>` : ''}
      </div>
    `;
    this.addContent(headerHtml);
    return this;
  }

  addBody(content) {
    const bodyHtml = `
      <div class="card-body">
        ${content}
      </div>
    `;
    this.addContent(bodyHtml);
    return this;
  }

  addFooter(content) {
    const footerHtml = `
      <div class="card-footer pt-4 border-t border-gray-700 mt-4">
        ${content}
      </div>
    `;
    this.addContent(footerHtml);
    return this;
  }

  // Status indicator
  addStatusIndicator(status, label) {
    const colors = {
      online: 'green-400',
      offline: 'red-400',
      loading: 'yellow-400',
      success: 'green-400',
      error: 'red-400',
      warning: 'yellow-400'
    };

    const color = colors[status] || 'gray-400';
    const indicatorHtml = `
      <div class="flex items-center space-x-2 ${this.size === 'sm' ? 'text-xs' : 'text-sm'}">
        <div class="w-2 h-2 bg-${color} rounded-full ${status === 'loading' ? 'animate-pulse' : ''}"></div>
        <span class="text-${color}">${label}</span>
      </div>
    `;

    this.addContent(indicatorHtml);
    return this;
  }

  // Animation methods
  animate(animation = 'slide-up') {
    this.element.classList.add(animation);
    return this;
  }

  // Static factory methods
  static create(options = {}) {
    return new VibeTechCard(options);
  }

  static createStatusCard(title, status, label, options = {}) {
    const card = new VibeTechCard({
      ...options,
      size: 'sm',
      className: 'text-center'
    });

    card.addHeader(title);
    card.addStatusIndicator(status, label);

    return card;
  }

  static createMetricCard(title, value, subtitle = '', options = {}) {
    const card = new VibeTechCard({
      ...options,
      className: 'text-center'
    });

    const contentHtml = `
      <h3 class="text-sm font-medium text-gray-400 mb-2">${title}</h3>
      <div class="text-2xl font-bold gradient-vibetech-text mb-1">${value}</div>
      ${subtitle ? `<p class="text-xs text-gray-500">${subtitle}</p>` : ''}
    `;

    card.setContent(contentHtml);
    return card;
  }
}

// Export for use in HTML
window.VibeTechCard = VibeTechCard;