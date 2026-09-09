import { setThemePreference } from "@xp/theme";
import { applyConfiguration } from "./apply";
import { readHash, readStorage } from "./codec";
import { sealPreviewDocument } from "./preview";

/**
 * Runs once, before the first render, from `src/main.tsx`.
 *
 * The persistence boundary: a saved configuration is the whole app's, not the configurator
 * route's, so it is restored here and every route boots with it. A shared link still wins over
 * stored state, exactly as it does inside the panel. Colour mode is the exception in both
 * directions, because the theme runtime owns that preference for the whole app. A preview
 * document takes its configuration from the host that frames it, so it seals itself and applies
 * only what it can read on its own until the host publishes.
 */
export function startConfiguration(): boolean {
  const preview = sealPreviewDocument();
  const shared = readHash(window.location.hash);
  const state = shared ?? readStorage(window.localStorage);
  if (!state) return preview;
  applyConfiguration(state, document, { host: !preview });
  // Colour mode is the one field this configuration does not own. It lives in the theme
  // runtime's `xp-theme-mode`, which Settings and the header menu also write, so restoring a
  // stored configuration must not push a stale copy over a newer choice. A shared link is an
  // explicit instruction, so it may set it.
  if (shared && !preview) setThemePreference(shared.mode);
  return preview;
}
