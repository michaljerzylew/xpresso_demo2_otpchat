export const bottomRegionYieldOrder = ["overlay", "consent", "sticky-action", "tab-bar"] as const;
export type BottomRegionOwner = (typeof bottomRegionYieldOrder)[number];

export const relocationTargets = [
  "sticky-bar",
  "appbar-context",
  "appbar-trailing",
  "tabbar-badge",
  "tabbar-more",
  "settings-projection",
  "footer-projection",
  "brand-pane",
  "context-pane",
  "inspector-pane",
  "dashboard-feed-card",
  "dashboard-kpi-chip",
  "greeting-band",
] as const;

export type RelocationTarget = (typeof relocationTargets)[number];

export const regionTokens = [
  "--xp-bottom-owner-height",
  "--xp-bottom-safe-area",
  "--xp-bottom-clearance",
  "--xp-fab-bottom-offset",
  "--xp-announce-height",
  "--xp-navigation-height",
  "--xp-chrome-top-height",
  "--xp-available-svh",
] as const;

export type BottomRegionRequest = {
  owner: BottomRegionOwner;
  active: boolean;
};

export function resolveBottomRegion(
  requests: readonly BottomRegionRequest[],
  options: { consentHasPresented?: boolean } = {},
): BottomRegionOwner | null {
  const active = new Set(requests.filter(({ active }) => active).map(({ owner }) => owner));
  if (options.consentHasPresented) active.delete("consent");
  return bottomRegionYieldOrder.find((owner) => active.has(owner)) ?? null;
}
