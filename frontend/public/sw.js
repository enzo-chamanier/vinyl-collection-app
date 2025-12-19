
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
importScripts('/custom-sw.js');

if (workbox) {
    console.log('Workbox loaded manually');

    // Force immediate activation
    workbox.core.skipWaiting();
    workbox.core.clientsClaim();

    // Navigation (App Shell) - NetworkFirst with Fallback
    // 1. Try Network
    // 2. Try Cache for the specific page
    // 3. FAIL? -> Return /dashboard from cache (Offline Fallback)

    const navigationStrategy = new workbox.strategies.NetworkFirst({
        cacheName: 'app-shell',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
            })
        ]
    });

    workbox.routing.registerRoute(
        ({ request }) => request.mode === 'navigate',
        async (options) => {
            try {
                const response = await navigationStrategy.handle(options);
                if (!response) {
                    throw new Error('No response from NetworkFirst strategy');
                }
                return response;
            } catch (error) {
                console.log('[SW] Navigation failed. Falling back to /dashboard.');
                // Fallback to /dashboard if available in cache
                const fallback = await caches.match('/dashboard');
                if (fallback) {
                    return fallback;
                }
                // Last resort: try root
                return caches.match('/');
            }
        }
    );

    // Images - CacheFirst
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 60,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

    // JS/CSS - StaleWhileRevalidate
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    // Fonts
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'font',
        new workbox.strategies.CacheFirst({
            cacheName: 'fonts',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
                }),
            ],
        })
    );
} else {
    console.log('Workbox failed to load');
}
