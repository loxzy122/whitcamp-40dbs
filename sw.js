const serviceWorkerContent = `
const CACHE_NAME = 'bible-studies-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/40 Days Bible Studies .html', // Your main HTML file
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  // Add any other assets you want to cache
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache failed:', err);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return a fallback page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Sync any pending progress updates when back online
  return Promise.resolve();
}
`;

// 4. Add this JavaScript code to your existing script (after DOMContentLoaded):
function initializePWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Show update notification
                  showUpdateNotification();
                }
              }
            });
          });
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }

  // Handle install prompt
  let deferredPrompt;
  const installButton = createInstallButton();

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;

    // Show install button
    if (installButton) {
      installButton.style.display = 'block';
    }
  });

  // Handle successful installation
  window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed successfully');
    if (installButton) {
      installButton.style.display = 'none';
    }

    // Show success message
    showInstallSuccessMessage();

    // Track installation (optional analytics)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        'event_category': 'engagement',
        'event_label': 'Bible Studies PWA'
      });
    }
  });

  // Create install button
  function createInstallButton() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      return null; // Already installed
    }

    const button = document.createElement('button');
    button.id = 'install-button';
    button.className = 'fixed bottom-4 right-4 bg-bible-blue text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 z-50 flex items-center space-x-2';
    button.style.display = 'none';
    button.innerHTML = `
      <i class="fas fa-download"></i>
      <span>Install App</span>
    `;

    button.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(\`User response to the install prompt: \${outcome}\`);
        deferredPrompt = null;
        button.style.display = 'none';
      }
    });

    document.body.appendChild(button);
    return button;
  }

  // Show update notification
  function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3';
    notification.innerHTML = \`
      <i class="fas fa-sync-alt"></i>
      <span>App updated! Refresh to see changes.</span>
      <button id="refresh-button" class="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100">
        Refresh
      </button>
    \`;

    document.body.appendChild(notification);

    document.getElementById('refresh-button').addEventListener('click', () => {
      window.location.reload();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  // Show installation success message
  function showInstallSuccessMessage() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3';
    notification.innerHTML = \`
      <i class="fas fa-check-circle"></i>
      <span>App installed successfully! 🎉</span>
    \`;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Handle standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
    document.body.classList.add('standalone-mode');

    // Add some standalone-specific styling
    const standaloneStyle = document.createElement('style');
    standaloneStyle.textContent = \`
      .standalone-mode {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .standalone-mode header {
        padding-top: calc(1rem + env(safe-area-inset-top));
      }
    \`;
    document.head.appendChild(standaloneStyle);
  }

  // Add shortcuts handling
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('today') === 'true') {
    // Focus on today's study or current progress
    focusOnTodaysStudy();
  } else if (urlParams.get('search') === 'true') {
    // Focus on search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
    }
  }

  function focusOnTodaysStudy() {
    // Get today's date and calculate which day of study it should be
    // This is a simple example - you might want more sophisticated logic
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const studyDay = ((dayOfYear - 1) % 40) + 1; // Cycle through 40 days

    const todayCard = document.querySelector(\`[data-day="\${studyDay}"]\`) ||
                     document.querySelector('.study-card:first-child');

    if (todayCard) {
      todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      todayCard.classList.add('ring-2', 'ring-bible-gold');

      setTimeout(() => {
        todayCard.classList.remove('ring-2', 'ring-bible-gold');
      }, 3000);
    }
  }
}

// Add this to your existing DOMContentLoaded event listener:
// initializePWA();

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializePWA, manifestContent, serviceWorkerContent };
}
