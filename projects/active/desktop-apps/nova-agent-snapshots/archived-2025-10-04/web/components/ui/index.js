/**
 * VibeTech UI Components - Modern 2025 Design System
 * Complete component library with your actual brand colors
 */

// Import all components
import { VibeTechButton } from './button.js';
import { VibeTechCard } from './card.js';
import { VibeTechInput } from './input.js';
import { VibeTechToast } from './toast.js';

// Utility functions
import { cn, createNeonGlow, formatMessage, animateElement, generateId, debounce, isInViewport, vibetech } from '../../lib/utils.js';

// Export all components
export {
  VibeTechButton,
  VibeTechCard,
  VibeTechInput,
  VibeTechToast,
  // Utilities
  cn,
  createNeonGlow,
  formatMessage,
  animateElement,
  generateId,
  debounce,
  isInViewport,
  vibetech
};

// Make components globally available
window.VibeTechUI = {
  Button: VibeTechButton,
  Card: VibeTechCard,
  Input: VibeTechInput,
  Toast: VibeTechToast,
  utils: {
    cn,
    createNeonGlow,
    formatMessage,
    animateElement,
    generateId,
    debounce,
    isInViewport,
    vibetech
  }
};

// Quick component creation helpers
window.VT = {
  // Button helpers
  button: (text, options = {}) => VibeTechButton.create(text, options),
  primaryButton: (text, options = {}) => VibeTechButton.create(text, { ...options, variant: 'primary' }),
  secondaryButton: (text, options = {}) => VibeTechButton.create(text, { ...options, variant: 'secondary' }),
  ghostButton: (text, options = {}) => VibeTechButton.create(text, { ...options, variant: 'ghost' }),

  // Card helpers
  card: (options = {}) => VibeTechCard.create(options),
  statusCard: (title, status, label, options = {}) => VibeTechCard.createStatusCard(title, status, label, options),
  metricCard: (title, value, subtitle, options = {}) => VibeTechCard.createMetricCard(title, value, subtitle, options),

  // Input helpers
  input: (options = {}) => VibeTechInput.create(options),
  textarea: (options = {}) => VibeTechInput.createTextarea(options),
  passwordInput: (options = {}) => VibeTechInput.createPassword(options),
  emailInput: (options = {}) => VibeTechInput.createEmail(options),

  // Toast helpers
  toast: (message, options = {}) => VibeTechToast.show(message, options),
  success: (message, options = {}) => VibeTechToast.success(message, options),
  error: (message, options = {}) => VibeTechToast.error(message, options),
  warning: (message, options = {}) => VibeTechToast.warning(message, options),
  loading: (message, options = {}) => VibeTechToast.loading(message, options),

  // Utility helpers
  animate: (element, animation) => animateElement(element, animation),
  neonGlow: (color) => createNeonGlow(color),
  formatText: (text) => formatMessage(text)
};

console.log('🎨 VibeTech UI Components loaded with your actual brand colors!');
console.log('Available components:', Object.keys(window.VibeTechUI));
console.log('Quick helpers available via window.VT');

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVibeTechUI);
} else {
  initializeVibeTechUI();
}

function initializeVibeTechUI() {
  // Add global styles for animations
  const style = document.createElement('style');
  style.textContent = `
    .animate-slide-up {
      animation: vtSlideUp 0.3s ease-out forwards;
    }

    .animate-fade-in {
      animation: vtFadeIn 0.5s ease-in-out forwards;
    }

    .animate-glow-pulse {
      animation: vtGlowPulse 2s ease-in-out infinite;
    }

    @keyframes vtSlideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes vtFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes vtGlowPulse {
      0%, 100% {
        box-shadow: 0 0 20px var(--vt-cyan);
      }
      50% {
        box-shadow: 0 0 40px var(--vt-cyan), 0 0 60px var(--vt-cyan);
      }
    }

    .loading-spinner {
      display: inline-block;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-dots span {
      animation: vtLoadingDot 1.4s infinite both;
    }

    .loading-dots span:nth-child(1) { animation-delay: 0s; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes vtLoadingDot {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Glass morphism utilities */
    .glass {
      background: rgba(26, 26, 31, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(51, 51, 56, 0.5);
    }

    .glass-strong {
      background: rgba(26, 26, 31, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(51, 51, 56, 0.8);
    }

    /* Gradient text utilities */
    .gradient-vibetech-text {
      background: linear-gradient(135deg, #9333EA 0%, #00D4D4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Neon glow utilities */
    .shadow-glow {
      box-shadow: 0 0 20px rgba(0, 212, 212, 0.4);
    }

    .shadow-glow-sm {
      box-shadow: 0 0 10px rgba(0, 212, 212, 0.3);
    }

    .shadow-glow-lg {
      box-shadow: 0 0 30px rgba(0, 212, 212, 0.5);
    }
  `;

  document.head.appendChild(style);

  // Initialize any existing components
  initializeExistingComponents();
}

function initializeExistingComponents() {
  // Auto-convert buttons with VT attributes
  document.querySelectorAll('button[data-vt-button]').forEach(btn => {
    const variant = btn.dataset.vtVariant || 'primary';
    const size = btn.dataset.vtSize || 'default';
    const text = btn.textContent;

    const vtButton = VibeTechButton.create(text, {
      variant,
      size,
      onClick: () => btn.click()
    });

    btn.parentNode.replaceChild(vtButton.element, btn);
  });

  // Auto-animate elements
  document.querySelectorAll('[data-vt-animate]').forEach(el => {
    const animation = el.dataset.vtAnimate || 'slide-up';
    animateElement(el, animation);
  });
}

export default window.VibeTechUI;