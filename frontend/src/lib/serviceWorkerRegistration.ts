/**
 * Service Worker Registration
 * Call registerServiceWorker() to enable offline support
 */

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("[SW] Service Workers not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      }
    );

    console.log("[SW] Registered successfully:", registration.scope);

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker === null) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("[SW] New version available - prompt user to refresh");
          // You can dispatch a custom event or show a toast notification here
          window.dispatchEvent(new Event("sw-update-available"));
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("[SW] Registration failed:", error);
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log("[SW] Unregistered");
    }
  } catch (error) {
    console.error("[SW] Unregistration failed:", error);
  }
}

/**
 * Check if offline and get cached data
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Force check for service worker updates
 */
export async function checkForServiceWorkerUpdate() {
  if (!navigator.serviceWorker.controller) {
    console.log("[SW] No active service worker");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log("[SW] Checked for updates");
  } catch (error) {
    console.error("[SW] Update check failed:", error);
  }
}
