export type ShellSourceCategory = "application-shell" | "navbar-component" | "dashboard-sidebar" | "dashboard-header";
export type ShellSharedModule = "app-shell" | "marketing-shell" | "nav-model" | "app-bar";

export type ShellSourcePreset = {
  slug: `${ShellSourceCategory}-${string}`;
  category: ShellSourceCategory;
  module: ShellSharedModule;
  preset: string;
  config: Readonly<Record<string, string | boolean | number>>;
};

const applicationShellPresets = [
  ["application-shell-01", "grouped-side", { skin: "plain", navPlacement: "side", badges: true, collapsible: true }],
  ["application-shell-02", "nested-side", { skin: "plain", navPlacement: "side", disclosures: true }],
  ["application-shell-03", "command-two-rank", { skin: "plain", navPlacement: "top", tiers: 2 }],
  ["application-shell-04", "commerce-kpi", { skin: "canvas", navPlacement: "top", commerce: true, pageBand: true }],
  ["application-shell-05", "recipient-inset", { skin: "inset", navPlacement: "side", widget: "list" }],
  ["application-shell-06", "workspace-side", { skin: "plain", navPlacement: "side", switcher: true, widget: "promo" }],
  ["application-shell-07", "learning-inset", { skin: "inset", navPlacement: "side", mediaSlot: true }],
  ["application-shell-08", "analytics-inset", { skin: "inset", navPlacement: "side", compactAction: true }],
  ["application-shell-09", "identity-side", { skin: "plain", navPlacement: "side", identityPanel: true }],
  ["application-shell-10", "files-quota", { skin: "plain", navPlacement: "side", scopedSearch: true, widget: "quota" }],
  ["application-shell-11", "live-operations", { skin: "plain", navPlacement: "side", widget: "stat", relocation: "badge-chip" }],
  ["application-shell-12", "labeled-rail", { skin: "plain", navPlacement: "side", density: "rail", railPreferred: true }],
  ["application-shell-13", "brand-two-tier", { skin: "canvas", navPlacement: "top", tiers: 2 }],
  ["application-shell-14", "contrast-two-tier", { skin: "canvas", navPlacement: "top", tiers: 2, primaryAction: true }],
  ["application-shell-15", "context-three-tier", { skin: "plain", navPlacement: "top", tiers: 3, contextStrip: true }],
  ["application-shell-16", "minimal-rail", { skin: "plain", navPlacement: "side", density: "rail", compactAction: true }],
  ["application-shell-17", "compact-top", { skin: "plain", navPlacement: "top", tiers: 1 }],
  ["application-shell-18", "logistics-dual-tier", { skin: "canvas", navPlacement: "side", density: "dual", widget: "stat" }],
] as const;

const navbarPresets = [
  ["navbar-component-01", "centered-split", { family: "marketing", identity: "centered", search: true, split: 2 }],
  ["navbar-component-02", "end-links-action", { family: "marketing", identity: "leading", actions: 1 }],
  ["navbar-component-03", "commerce-two-tier", { family: "two-tier", utility: true, commerce: true }],
  ["navbar-component-04", "centered-social-two-tier", { family: "two-tier", identity: "centered", search: true, utility: true }],
  ["navbar-component-05", "balanced-three-zone", { family: "marketing", identity: "leading", actions: 1 }],
  ["navbar-component-06", "app-two-tier", { family: "app", signedIn: true, contextTabs: true }],
  ["navbar-component-07", "greeting-command", { family: "app", greeting: true, search: true, greetingRelocation: true }],
  ["navbar-component-08", "branded-command-actions", { family: "app", branded: true, search: true, actionDensity: "high" }],
  ["navbar-component-09", "signed-in-marketing", { family: "marketing", signedIn: true, badge: true }],
  ["navbar-component-10", "compact-inline-search", { family: "app", search: true, actionDensity: "high" }],
  ["navbar-component-11", "inverted-dual-action", { family: "marketing", skin: "canvas", actions: 2 }],
  ["navbar-component-12", "centered-commerce", { family: "marketing", identity: "centered", commerce: true }],
  ["navbar-component-13", "admin-two-tier", { family: "app", navModel: "two-tier-switcher", search: true, signedIn: true }],
  ["navbar-component-14", "search-utility-action", { family: "marketing", search: true, utility: true, actions: 1 }],
] as const;

const dashboardSidebarPresets = [
  ["dashboard-sidebar-01", "grouped-badges", { groups: true, badges: true, skin: "plain", navPlacement: "side" }],
  ["dashboard-sidebar-02", "profile-led", { groups: true, identity: "profile" }],
  ["dashboard-sidebar-03", "rail-minimal-action", { density: "rail", compactAction: true }],
  ["dashboard-sidebar-04", "rail-labeled", { density: "rail", labels: "compact" }],
  ["dashboard-sidebar-05", "operations-live", { groups: true, widget: "live-operation", relocation: "badge-chip" }],
  ["dashboard-sidebar-06", "inset-recipients", { groups: true, widget: "list", relocation: "card" }],
  ["dashboard-sidebar-07", "learning-promo", { groups: true, widget: "promo", relocation: "card" }],
  ["dashboard-sidebar-08", "workspace-trial", { switcher: true, widget: "quota", relocation: "card" }],
  ["dashboard-sidebar-09", "analytics-upsell", { groups: true, widget: "promo", relocation: "card" }],
  ["dashboard-sidebar-10", "files-quota", { scopedSearch: true, widget: "quota", relocation: "card" }],
  ["dashboard-sidebar-11", "dual-tier-operations", { density: "dual", widget: "stat", relocation: "chip" }],
] as const;

const dashboardHeaderPresets = [
  ["dashboard-header-01", "route-minimal", { context: "breadcrumb", actions: 1, menus: "locale-account" }],
  ["dashboard-header-02", "search-dense-actions", { search: true, actions: 4, menus: "locale-account" }],
  ["dashboard-header-03", "canvas-centered-search", { search: true, actions: 4, skin: "canvas", geometry: "physical-center" }],
  ["dashboard-header-04", "search-identity-detail", { search: true, actions: 3, identity: "expanded" }],
  ["dashboard-header-05", "branded-command", { context: "brand", search: true, actions: 3, identity: "expanded" }],
  ["dashboard-header-06", "greeting-command", { context: "greeting", search: true, boxedShellControl: true, greetingRelocation: true, actions: 3, menus: "locale-account" }],
  ["dashboard-header-07", "utility-identity", { navModel: "app-inline", actions: 3, identity: "expanded", menus: "locale-account" }],
  ["dashboard-header-08", "utility-identity-groups", { navModel: "app-groups", actions: 3, identity: "compact", children: true, menus: "locale-account" }],
  ["dashboard-header-09", "fullwidth-command", { navModel: "top-placed", context: "brand", search: true, actions: 3, identity: "compact", sidebar: false }],
  ["dashboard-header-10", "product-actions", { navModel: "top-groups", context: "brand", navDelegated: true, actions: 3, identity: "compact", children: true, sidebar: false }],
  ["dashboard-header-11", "balanced-actions", { navModel: "top-centered", context: "brand", navDelegated: true, centered: true, actions: 3, identity: "compact", children: true, sidebar: false }],
  ["dashboard-header-12", "search-persistent", { navModel: "top-icons", context: "brand", navDelegated: true, tiers: 2, search: true, actions: 3, identity: "compact", children: true, sidebar: false }],
  ["dashboard-header-13", "inverted-search", { navModel: "top-action", context: "brand", navDelegated: true, tiers: 2, search: true, searchProvider: true, actions: 3, primaryAction: 1, identity: "compact", children: true, skin: "inverted", sidebar: false }],
  ["dashboard-header-14", "brand-search", { navModel: "top-icons", context: "brand", navDelegated: true, tiers: 2, search: true, searchPersistent: true, actions: 3, identity: "compact", children: true, skin: "brand", sidebar: false }],
  ["dashboard-header-15", "context-strip-controls", { navModel: "top-groups", context: "breadcrumb", contextStrip: true, pageActions: 4, actions: 3, identity: "expanded", children: true, sidebar: false, skin: "canvas" }],
  ["dashboard-header-16", "context-strip-actions", { navModel: "top-icons", context: "breadcrumb", search: true, contextStrip: true, pageActions: 2, actions: 3, identity: "expanded", tiers: 3, sidebar: false }],
  ["dashboard-header-17", "commerce-context", { navModel: "commerce", context: "breadcrumb", commerce: true, contextStrip: true, kpiBand: true, panels: true, tiers: 3 }],
  ["dashboard-header-18", "canvas-greeting", { context: "greeting", search: true, skin: "canvas", greetingRelocation: true }],
] as const;

function mapPresets(
  category: ShellSourceCategory,
  module: ShellSharedModule,
  rows: readonly (readonly [string, string, Readonly<Record<string, string | boolean | number>>])[],
): ShellSourcePreset[] {
  return rows.map(([slug, preset, config]) => ({
    slug: slug as ShellSourcePreset["slug"],
    category,
    module,
    preset,
    config,
  }));
}

export const shellSourcePresets: readonly ShellSourcePreset[] = [
  ...mapPresets("application-shell", "app-shell", applicationShellPresets),
  ...mapPresets("navbar-component", "nav-model", navbarPresets),
  ...mapPresets("dashboard-sidebar", "nav-model", dashboardSidebarPresets),
  ...mapPresets("dashboard-header", "app-bar", dashboardHeaderPresets),
];

export const shellSourcePresetBySlug: ReadonlyMap<string, ShellSourcePreset> = new Map(
  shellSourcePresets.map((preset) => [preset.slug, preset]),
);
