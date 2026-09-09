import type { ConfiguratorState } from "./config";

export const previewFlag = "xp-preview";
export const previewStateEvent = "xp-preview-state";

type PreviewWindow = Window & { __xpPreviewState?: ConfiguratorState };

/**
 * A configurator preview is a picture of the app, not a second copy of it. Five live frames in
 * the keyboard path would trap a keyboard user, so a framed preview seals its own body: inert
 * removes it from the focus order, from pointer events and from the accessibility tree.
 */
export function sealPreviewDocument(): boolean {
  if (new URLSearchParams(window.location.search).get(previewFlag) !== "1") return false;
  document.documentElement.dataset.xpPreview = "1";
  document.body.inert = true;
  return true;
}

/**
 * The host publishes its state into each preview document, so a framed panel renders the live
 * configuration rather than the one it happened to boot with. CSS alone would leave the frame's
 * own sliders, ramps and readouts showing stale numbers.
 */
export function publishPreviewState(state: ConfiguratorState, target: Document): void {
  const view = target.defaultView as PreviewWindow | null;
  if (!view) return;
  view.__xpPreviewState = state;
  view.dispatchEvent(new Event(previewStateEvent));
}

export function readPreviewState(): ConfiguratorState | null {
  return typeof window === "undefined" ? null : (window as PreviewWindow).__xpPreviewState ?? null;
}

export function subscribePreviewState(listener: () => void): () => void {
  window.addEventListener(previewStateEvent, listener);
  return () => window.removeEventListener(previewStateEvent, listener);
}
