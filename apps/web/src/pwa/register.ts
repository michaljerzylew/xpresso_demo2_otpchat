import { registerSW } from "virtual:pwa-register";

let started = false;

/**
 * Registers the worker once per document. `registerType: "autoUpdate"` installs and
 * activates a new worker on its own; supplying `onNeedReload` suppresses the plugin's
 * automatic `location.reload()` so the reader decides when the page changes under them.
 */
export function startServiceWorker(onUpdate: () => void, onOfflineReady?: () => void): void {
  if (started) return;
  started = true;
  registerSW({
    immediate: true,
    onNeedReload: onUpdate,
    onOfflineReady,
    onRegisterError: error => console.error("Service worker registration failed", error),
  });
}
