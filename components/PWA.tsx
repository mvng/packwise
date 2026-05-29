'use client';

import { useEffect } from 'react';

export function PWA() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);

            // Check if Background Sync is supported and register a sync
            // This sync will flush the queue when the app comes back online
            // if the service worker hasn't already done it.
            if ('sync' in registration) {
              navigator.serviceWorker.ready.then((reg) => {
                 try {
                     // @ts-expect-error sync is not standard yet
                     reg.sync.register('sync-api-requests');
                 } catch(err) {
                     console.log('Background sync registration failed on client load');
                 }
              });
            }
          })
          .catch((registrationError) => {
            console.log('SW registration failed:', registrationError);
          });
      });
    }
  }, []);

  return null;
}
