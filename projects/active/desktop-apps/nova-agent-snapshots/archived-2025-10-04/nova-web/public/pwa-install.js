// PWA Installation and Enhancement Script for NOVA AI Assistant
// This script provides enhanced PWA installation experience

(function() {
    'use strict';

    // PWA Installation Manager
    class PWAInstallManager {
        constructor() {
            this.deferredPrompt = null;
            this.isInstalled = false;
            this.init();
        }

        init() {
            this.checkIfInstalled();
            this.setupEventListeners();
            this.setupUpdateCheck();
        }

        checkIfInstalled() {
            // Check if app is running in standalone mode
            this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              window.navigator.standalone === true;
            
            if (this.isInstalled) {
                console.log('[PWA] NOVA is running as installed PWA');
                document.body.classList.add('pwa-installed');
            }
        }

        setupEventListeners() {
            // Before install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                console.log('[PWA] Before install prompt fired');
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallButton();
            });

            // App installed
            window.addEventListener('appinstalled', () => {
                console.log('[PWA] NOVA has been installed');
                this.deferredPrompt = null;
                this.isInstalled = true;
                this.hideInstallButton();
                this.showInstallSuccessMessage();
            });

            // Display mode change
            window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
                this.isInstalled = e.matches;
                if (this.isInstalled) {
                    document.body.classList.add('pwa-installed');
                } else {
                    document.body.classList.remove('pwa-installed');
                }
            });
        }

        setupUpdateCheck() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('[PWA] New service worker activated');
                    this.showUpdateMessage();
                });
            }
        }

        async installApp() {
            if (!this.deferredPrompt) {
                console.log('[PWA] No install prompt available');
                return;
            }

            const result = await this.deferredPrompt.prompt();
            console.log('[PWA] Install prompt result:', result.outcome);
            
            this.deferredPrompt = null;
            
            if (result.outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
            } else {
                console.log('[PWA] User dismissed the install prompt');
            }
        }

        showInstallButton() {
            // Create install button if it doesn't exist
            if (document.getElementById('pwa-install-button')) return;

            const installButton = document.createElement('button');
            installButton.id = 'pwa-install-button';
            installButton.innerHTML = '📱 Install NOVA';
            installButton.className = 'pwa-install-btn';
            installButton.onclick = () => this.installApp();

            // Style the button
            const style = document.createElement('style');
            style.textContent = `
                .pwa-install-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
                    z-index: 10000;
                    transition: transform 0.2s, box-shadow 0.2s;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .pwa-install-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                .pwa-installed .pwa-install-btn {
                    display: none;
                }
                .pwa-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 10001;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(installButton);
        }

        hideInstallButton() {
            const button = document.getElementById('pwa-install-button');
            if (button) {
                button.remove();
            }
        }

        showInstallSuccessMessage() {
            this.showNotification('🎉 NOVA Installed!', 'NOVA AI Assistant is now available offline and can be launched from your home screen.');
        }

        showUpdateMessage() {
            this.showNotification('🔄 NOVA Updated!', 'A new version of NOVA has been installed. Refresh to see the latest features.');
        }

        showNotification(title, message) {
            const notification = document.createElement('div');
            notification.className = 'pwa-notification';
            notification.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 5px;">${title}</div>
                <div style="font-size: 14px; opacity: 0.9;">${message}</div>
            `;

            document.body.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }

    // PWA Feature Detection and Enhancement
    class PWAFeatureManager {
        constructor() {
            this.init();
        }

        init() {
            this.detectFeatures();
            this.enhanceUI();
            this.setupShortcuts();
        }

        detectFeatures() {
            const features = {
                serviceWorker: 'serviceWorker' in navigator,
                notifications: 'Notification' in window,
                backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
                periodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
                webShare: 'share' in navigator,
                fullscreen: 'requestFullscreen' in document.documentElement,
                installPrompt: 'BeforeInstallPromptEvent' in window
            };

            console.log('[PWA] Available features:', features);
            
            // Store in global object for app to use
            window.NOVA_PWA_FEATURES = features;
        }

        enhanceUI() {
            // Add PWA-specific CSS classes
            document.body.classList.add('pwa-enhanced');
            
            // Handle display mode changes
            if (window.matchMedia('(display-mode: standalone)').matches) {
                document.body.classList.add('display-standalone');
            }
            
            if (window.matchMedia('(display-mode: minimal-ui)').matches) {
                document.body.classList.add('display-minimal-ui');
            }
        }

        setupShortcuts() {
            // Handle app shortcuts from manifest
            if ('getInstalledRelatedApps' in navigator) {
                navigator.getInstalledRelatedApps().then(apps => {
                    console.log('[PWA] Related apps:', apps);
                }).catch(err => {
                    console.log('[PWA] No related apps found');
                });
            }
        }
    }

    // Performance Monitoring for PWA
    class PWAPerformanceMonitor {
        constructor() {
            this.metrics = {};
            this.init();
        }

        init() {
            this.measureLoadTime();
            this.measureCacheEffectiveness();
            this.setupPerformanceObserver();
        }

        measureLoadTime() {
            if ('performance' in window) {
                window.addEventListener('load', () => {
                    const timing = performance.getEntriesByType('navigation')[0];
                    this.metrics.loadTime = timing.loadEventEnd - timing.loadEventStart;
                    this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
                    this.metrics.firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime;
                    this.metrics.firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
                    
                    console.log('[PWA] Performance metrics:', this.metrics);
                });
            }
        }

        measureCacheEffectiveness() {
            if ('performance' in window) {
                const resources = performance.getEntriesByType('resource');
                let cacheHits = 0;
                let networkRequests = 0;

                resources.forEach(resource => {
                    if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
                        cacheHits++;
                    } else {
                        networkRequests++;
                    }
                });

                this.metrics.cacheHitRatio = cacheHits / (cacheHits + networkRequests);
                console.log('[PWA] Cache effectiveness:', this.metrics.cacheHitRatio);
            }
        }

        setupPerformanceObserver() {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'largest-contentful-paint') {
                            this.metrics.largestContentfulPaint = entry.startTime;
                        }
                        if (entry.entryType === 'first-input') {
                            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                        }
                        if (entry.entryType === 'layout-shift') {
                            this.metrics.cumulativeLayoutShift = (this.metrics.cumulativeLayoutShift || 0) + entry.value;
                        }
                    }
                });

                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            }
        }

        getMetrics() {
            return this.metrics;
        }
    }

    // Initialize PWA enhancements when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePWA);
    } else {
        initializePWA();
    }

    function initializePWA() {
        console.log('[PWA] Initializing NOVA PWA enhancements');
        
        window.NOVA_PWA_INSTALL = new PWAInstallManager();
        window.NOVA_PWA_FEATURES = new PWAFeatureManager();
        window.NOVA_PWA_PERFORMANCE = new PWAPerformanceMonitor();
        
        console.log('[PWA] NOVA PWA enhancements ready');
    }

})();