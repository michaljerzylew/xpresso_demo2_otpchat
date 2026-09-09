import { applyTheme, compileTheme } from "@xp/theme";
import { fontStylesheets, themeSpec, type ConfiguratorState } from "./config";
import { contentMaxWidth, rootAttributes } from "./export";
import { publishPreviewState } from "./preview";

/**
 * Layout is expressed as root attributes and one custom property rather than React state,
 * because the preview frames are separate documents the panel writes into directly.
 */
export function applyLayout(state: ConfiguratorState, target: Document): void {
  const root = target.documentElement;
  for (const [name, value] of Object.entries(rootAttributes(state))) root.setAttribute(name, value);
  root.style.setProperty("--xp-content-max", contentMaxWidth[state.layout.content]);
}

/** Webfonts arrive only when a state actually names one, and never twice per document. */
export function loadWebfonts(state: ConfiguratorState, target: Document): void {
  for (const href of fontStylesheets(state)) {
    if (target.querySelector(`link[data-xp-webfont][href="${href}"]`)) continue;
    const link = target.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.xpWebfont = "";
    target.head.append(link);
  }
}

function injectTheme(state: ConfiguratorState, target: Document): void {
  let style = target.querySelector<HTMLStyleElement>("style#xp-theme");
  if (!style) {
    style = target.createElement("style");
    style.id = "xp-theme";
    target.head.append(style);
  }
  style.textContent = compileTheme(themeSpec(state));
}

/**
 * The live app goes through `applyTheme`; preview documents get the same compiled CSS
 * written into their own head, which is the only channel that crosses a frame boundary.
 */
export function applyConfiguration(state: ConfiguratorState, target: Document, options: { host?: boolean } = {}): void {
  if (options.host) {
    applyTheme(themeSpec(state));
    // Colour mode is deliberately not written here. `xp-theme-mode` is the theme runtime's
    // preference, shared with the Settings control and the header menu, and restoring a stored
    // configuration must never overwrite a newer explicit choice made somewhere else.
    // `useConfigurator` writes it when the operator changes it in the panel, and `boot.ts`
    // writes it only for a shared link, which is an explicit instruction.
  } else {
    injectTheme(state, target);
    // Mode travels on the root attributes. A frame that was still loading when the host
    // changed mode never receives the storage event, so the host writes the resolved value
    // in directly instead of leaving one frame in the old mode.
    const host = document.documentElement.dataset;
    target.documentElement.dataset.themePreference = host.themePreference ?? state.mode;
    if (host.theme) target.documentElement.dataset.theme = host.theme;
    // CSS is only half of it: the framed panel renders its own controls, so it needs the state.
    publishPreviewState(state, target);
  }
  loadWebfonts(state, target);
  applyLayout(state, target);
}
