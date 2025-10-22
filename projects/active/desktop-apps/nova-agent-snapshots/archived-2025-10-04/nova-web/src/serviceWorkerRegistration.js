// Service Worker Registration for NOVA AI Assistant PWA
// This file handles the registration and lifecycle of the service worker

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            '[SW] This web app is being served cache-first by a service worker. ' +
            'To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW] New content is available and will be used when all tabs are closed.');
              
              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
              
              // Show update notification
              showUpdateNotification();
            } else {
              console.log('[SW] Content is cached for offline use.');
              
              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
              
              // Show installation success notification
              showInstallNotification();
            }
          }
        });
      });
      
      // Register for background sync
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        registration.sync.register('nova-sync').catch(() => {
          console.log('[SW] Background sync not supported');
        });
      }
      
      // Register for periodic background sync
      if ('periodicSync' in window.ServiceWorkerRegistration.prototype) {
        registration.periodicSync.register('nova-background-sync', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        }).catch(() => {
          console.log('[SW] Periodic background sync not supported');
        });
      }
    })
    .catch((error) => {
      console.error('[SW] Service Worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Service Worker unregistration failed:', error);
      });
  }
}

// Notification functions
function showUpdateNotification() {
  // Check if notifications are supported and granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('NOVA Update Available', {
      body: 'A new version of NOVA is available. Restart the app to update.',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'nova-update',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'later',
          title: 'Later'
        }
      ]
    });
  } else {
    // Fallback to console or custom UI notification
    console.log('[SW] Update available - please restart the app');
  }
}

function showInstallNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('NOVA Installed', {
      body: 'NOVA AI Assistant is now available offline!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'nova-install'
    });
  }
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    return Notification.requestPermission().then((permission) => {
      console.log('[SW] Notification permission:', permission);
      return permission;
    });
  }
  return Promise.resolve(Notification.permission);
}

// Install prompt handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[SW] Before install prompt fired');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button or banner
  showInstallBanner();
});

function showInstallBanner() {
  // Create custom install banner
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div>
        <div style="font-weight: 600; margin-bottom: 5px;">Install NOVA</div>
        <div style="font-size: 14px; opacity: 0.9;">Get the full app experience</div>
      </div>
      <div>
        <button id="install-button" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 10px;
        ">Install</button>
        <button id="dismiss-button" style="
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          opacity: 0.7;
        ">×</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Handle install button click
  document.getElementById('install-button').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[SW] User choice:', outcome);
      deferredPrompt = null;
      banner.remove();
    }
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-button').addEventListener('click', () => {
    banner.remove();
  });
}

// Handle successful installation
window.addEventListener('appinstalled', (evt) => {
  console.log('[SW] NOVA has been installed');
  deferredPrompt = null;
  
  // Remove install banner if it exists
  const banner = document.getElementById('install-banner');
  if (banner) {
    banner.remove();
  }
});

// Communication with service worker
export function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Listen for messages from service worker
navigator.serviceWorker?.addEventListener('message', (event) => {
  console.log('[SW] Message from service worker:', event.data);
  
  if (event.data && event.data.type === 'VERSION_INFO') {
    console.log('[SW] Service Worker version:', event.data.version);
  }
});

// Skip waiting and reload on service worker update
export function skipWaitingAndReload() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        registration.waiting.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            window.location.reload();
          }
        });
      }
    });
  }
}