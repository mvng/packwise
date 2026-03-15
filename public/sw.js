const CACHE_NAME = 'packwise-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(OFFLINE_URL);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })()
  );
  self.clients.claim();
});

// IndexedDB Helper for Request Queueing
const DB_VERSION = 1;
const DB_NAME = 'packwise-sync-db';
const STORE_NAME = 'request-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function enqueueRequest(request) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Clone request to store it
  const clonedRequest = request.clone();

  // Convert body to array buffer to store
  const headers = {};
  for (const [key, value] of clonedRequest.headers.entries()) {
    headers[key] = value;
  }

  let body = null;
  if (clonedRequest.method !== 'GET' && clonedRequest.method !== 'HEAD') {
      try {
          body = await clonedRequest.arrayBuffer();
      } catch(e) {
          // Body might have already been read or empty
      }
  }

  const serializedRequest = {
    url: clonedRequest.url,
    method: clonedRequest.method,
    headers: headers,
    body: body,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    const req = store.add(serializedRequest);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function flushQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const getAllReq = store.getAll();

  return new Promise((resolve, reject) => {
    getAllReq.onsuccess = async () => {
      const requests = getAllReq.result;
      if (requests.length === 0) return resolve();

      const txDelete = db.transaction(STORE_NAME, 'readwrite');
      const storeDelete = txDelete.objectStore(STORE_NAME);

      for (const reqData of requests) {
        try {
          const fetchOptions = {
            method: reqData.method,
            headers: reqData.headers,
          };
          if (reqData.body) {
            fetchOptions.body = reqData.body;
          }

          await fetch(reqData.url, fetchOptions);
          // Only delete if successful
          storeDelete.delete(reqData.id);
        } catch (error) {
          console.error('Background sync failed for request', reqData.url, error);
        }
      }
      resolve();
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-api-requests') {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (error) {
          // Only queue API requests or Supabase endpoints
          if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
             await enqueueRequest(event.request);
             if ('sync' in self.registration) {
                 try {
                     await self.registration.sync.register('sync-api-requests');
                 } catch(err) {
                     console.log('Sync registration failed, fallback will happen when app loads');
                 }
             }
             return new Response(JSON.stringify({ queued: true, message: 'Offline. Action queued.' }), {
                 headers: { 'Content-Type': 'application/json' },
                 status: 202
             });
          }
          throw error;
        }
      })()
    );
    return;
  }

  // Handle GET requests: Cache First for static, Network First for API/Navigation
  const isApi = event.request.url.includes('/api/') || event.request.url.includes('supabase.co');

  if (isApi || event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
             // Cache the preload response
             const cache = await caches.open(CACHE_NAME);
             cache.put(event.request, preloadResponse.clone());
             return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);

          if (cachedResponse) {
              return cachedResponse;
          }

          if (event.request.mode === 'navigate') {
              const offlineResponse = await cache.match(OFFLINE_URL);
              if (offlineResponse) return offlineResponse;
          }

          throw error;
        }
      })()
    );
  } else {
    // Cache First for static assets
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          throw error;
        }
      })()
    );
  }
});
