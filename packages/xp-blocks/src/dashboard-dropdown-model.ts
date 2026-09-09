export const DASHBOARD_DROPDOWN_MENU_PRESETS = [
  "locale-radio",
  "account-actions",
  "wallet-actions",
  "context-actions",
  "account-switcher",
  "account-control",
  "account-compact",
  "presence-radio",
  "workspace-switcher",
  "people-multiselect",
  "action-list-long",
  "tag-picker",
  "assignee-picker",
  "column-picker",
  "project-switcher",
] as const;

export const DASHBOARD_DROPDOWN_POPOUT_PRESETS = [
  "app-launcher",
  "profile-insight",
  "editor-tools",
  "notification-centre",
  "favourites",
  "mini-cart",
  "member-invite",
  "access-sharing",
] as const;

export type DashboardDropdownMenuPreset = (typeof DASHBOARD_DROPDOWN_MENU_PRESETS)[number];
export type DashboardDropdownPopoutPreset = (typeof DASHBOARD_DROPDOWN_POPOUT_PRESETS)[number];
export type DashboardDropdownTone = "neutral" | "positive" | "warning" | "danger" | "info";

export type DashboardDropdownAction = {
  id: string;
  label: string;
  iconKey?: string;
  kind: "action" | "link" | "destructive" | "utility";
  href?: string;
  disabled?: boolean;
  shortcut?: string;
  description?: string;
};

export type DashboardDropdownChoice = {
  id: string;
  label: string;
  secondaryText?: string;
  iconKey?: string;
  mediaKey?: string;
  tone?: DashboardDropdownTone;
  disabled?: boolean;
};

export type DashboardDropdownLauncherDestination = DashboardDropdownChoice & {
  href?: string;
  action?: DashboardDropdownAction;
};

export type DashboardDropdownGroup = {
  id: string;
  label?: string;
  items: Array<DashboardDropdownAction | DashboardDropdownChoice>;
  separated?: boolean;
};

export type DashboardDropdownPerson = {
  id: string;
  displayName: string;
  secondaryText?: string;
  avatarKey: string;
  status?: { label: string; tone: DashboardDropdownTone };
  roleOptions?: Array<{ id: string; label: string }>;
};

export type DashboardDropdownMediaReference = {
  key: string;
  role: "avatar" | "mark" | "product-thumb";
  alt: string;
};

export type DashboardDropdownMediaAsset = {
  key: string;
  src: string;
  alt: string;
};

export type DashboardDropdownCommon = {
  sourceKey: string;
  trigger: { label: string; iconKey?: string; mediaKey?: string; valueText?: string };
  title?: string;
  description?: string;
  closeLabel: string;
  media?: DashboardDropdownMediaReference[];
  announcements: Record<string, string>;
  states: { loading?: boolean; error?: string; empty?: boolean; disabledReason?: string; permission?: "allowed" | "denied" };
};

export type DashboardDropdownMenuFixture = DashboardDropdownCommon & {
  surface: "menu";
  preset: DashboardDropdownMenuPreset;
  profile: "M1" | "M2" | "M3" | "M4";
  selection: "none" | "single" | "multiple";
  identity?: DashboardDropdownPerson;
  groups: DashboardDropdownGroup[];
  people?: DashboardDropdownPerson[];
  selectedIds?: string[];
  orderedIds?: string[];
  query?: { label: string; placeholder: string; emptyLabel: string };
  submenu?: { parentId: string; label: string; items: DashboardDropdownAction[] };
  actions?: DashboardDropdownAction[];
  summary?: { label: string; value?: string; description?: string };
  stress?: Record<string, Partial<DashboardDropdownMenuFixture>>;
};

export type DashboardDropdownProductLine = {
  id: string;
  merchantId?: string;
  merchantLabel?: string;
  merchantMarkKey?: string;
  productThumbKey: string;
  title: string;
  secondaryText?: string;
  price: string;
  comparisonPrice?: string;
  statusLabels?: string[];
  quantity?: { label: string; value: number; min: number; max: number };
  ratingLabel?: string;
  actions?: DashboardDropdownAction[];
};

export type DashboardDropdownNotificationRow = {
  id: string;
  person: DashboardDropdownPerson;
  message: string;
  timeLabel: string;
  categoryLabel: string;
  unread: boolean;
  kind: "plain" | "decision" | "resource";
  actions?: DashboardDropdownAction[];
  resourceLabel?: string;
};

export type DashboardDropdownPopoutExtension =
  | { kind: "launcher"; destinations: DashboardDropdownLauncherDestination[] }
  | { kind: "insight"; person: DashboardDropdownPerson; series: Array<{ id: string; label: string; value: number }>; periodLabel: string; summary: string; actions: DashboardDropdownAction[] }
  | { kind: "editor-tools"; typeLabel: string; typeChoices: DashboardDropdownChoice[]; toggles: Array<{ id: string; label: string; description?: string; checked: boolean; badge?: string }>; groups: DashboardDropdownGroup[] }
  | { kind: "notifications"; tabs: Array<{ id: string; label: string; rows: DashboardDropdownNotificationRow[] }>; activeTabId: string; settingsAction: DashboardDropdownAction }
  | { kind: "products"; products: DashboardDropdownProductLine[]; emptyLabel: string }
  | { kind: "cart"; lines: DashboardDropdownProductLine[]; summaryLabel: string }
  | { kind: "invite"; emailLabel: string; roleLabel: string; invitees: Array<{ id: string; email: string; roleId: string; actions?: DashboardDropdownAction[]; error?: string }>; roleOptions: Array<{ id: string; label: string }> }
  | { kind: "sharing"; queryLabel: string; queryPlaceholder?: string; members: DashboardDropdownPerson[]; overflowPeople: DashboardDropdownPerson[]; copyValue: string };

export type DashboardDropdownPopoutFixture = DashboardDropdownCommon & {
  surface: "popout";
  preset: DashboardDropdownPopoutPreset;
  profile: "P1" | "P2" | "P3" | "P4" | "P5";
  title: string;
  extension: DashboardDropdownPopoutExtension;
  footerActions?: DashboardDropdownAction[];
  dirty?: boolean;
  stress?: Record<string, Partial<DashboardDropdownPopoutFixture>>;
};

export type DashboardDropdownFixture = DashboardDropdownMenuFixture | DashboardDropdownPopoutFixture;
export type ResolvedDashboardDropdownFixture = DashboardDropdownFixture & { resolvedMedia: DashboardDropdownMediaAsset[] };

const menuCounts: Partial<Record<DashboardDropdownMenuPreset, { groups?: number; people?: number; items?: number; selected?: number; ordered?: number }>> = {
  "locale-radio": { items: 5, selected: 1 },
  "account-actions": { groups: 2, items: 6 },
  "wallet-actions": { items: 3 },
  "account-switcher": { people: 2, items: 4, selected: 1 },
  "account-control": { items: 9, selected: 1 },
  "account-compact": { items: 7, selected: 1 },
  "presence-radio": { items: 5, selected: 1 },
  "workspace-switcher": { items: 4, selected: 1 },
  "people-multiselect": { people: 5, selected: 1 },
  "action-list-long": { items: 10 },
  "tag-picker": { items: 7, selected: 2 },
  "assignee-picker": { people: 3, selected: 2 },
  "column-picker": { items: 4, selected: 2, ordered: 4 },
  "project-switcher": { items: 5, selected: 1, ordered: 5 },
};

const ensureUnique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label} IDs.`);
};

const requireText = (sourceKey: string, label: string, value: unknown) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};

const allMenuItems = (fixture: DashboardDropdownMenuFixture) => fixture.groups.flatMap((group) => group.items);

export function resolveDashboardDropdownFixture(
  fixture: DashboardDropdownFixture,
  mediaAssets: DashboardDropdownMediaAsset[] = [],
): ResolvedDashboardDropdownFixture {
  if (!/^dashboard-dropdown-(0[1-9]|1\d|2[0-3])$/.test(fixture.sourceKey)) throw new Error(`Invalid dashboard dropdown source key: ${fixture.sourceKey}`);
  requireText(fixture.sourceKey, "trigger label", fixture.trigger?.label);
  requireText(fixture.sourceKey, "close label", fixture.closeLabel);
  if (fixture.surface === "menu" && !DASHBOARD_DROPDOWN_MENU_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an unknown Menu preset.`);
  if (fixture.surface === "popout" && !DASHBOARD_DROPDOWN_POPOUT_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an unknown Popout preset.`);

  const referencedIds = new Set<string>();
  if (fixture.surface === "menu") {
    const items = allMenuItems(fixture);
    const people = fixture.people ?? [];
    ensureUnique(fixture.groups.map((group) => group.id), "group", fixture.sourceKey);
    ensureUnique(items.map((item) => item.id), "item", fixture.sourceKey);
    ensureUnique(people.map((person) => person.id), "person", fixture.sourceKey);
    ensureUnique(fixture.actions?.map((action) => action.id) ?? [], "action", fixture.sourceKey);
    items.forEach((item) => referencedIds.add(item.id));
    people.forEach((person) => referencedIds.add(person.id));
    const expected = menuCounts[fixture.preset];
    const actual = { groups: fixture.groups.length, people: people.length, items: items.length, selected: fixture.selectedIds?.length ?? 0, ordered: fixture.orderedIds?.length ?? 0 };
    for (const [key, count] of Object.entries(expected ?? {})) {
      if (actual[key as keyof typeof actual] !== count) throw new Error(`${fixture.sourceKey} requires ${count} ${key}, got ${actual[key as keyof typeof actual]}.`);
    }
    if (fixture.selection === "single" && (fixture.selectedIds?.length ?? 0) > 1) throw new Error(`${fixture.sourceKey} single-select Menu has multiple selected IDs.`);
    for (const id of [...(fixture.selectedIds ?? []), ...(fixture.orderedIds ?? [])]) if (!referencedIds.has(id)) throw new Error(`${fixture.sourceKey} references unknown item ${id}.`);
    if (fixture.preset === "context-actions" && (fixture.groups.map((group) => group.items.length).join("/") !== "2/3/1" || fixture.submenu?.items.length !== 2)) throw new Error(`${fixture.sourceKey} requires groups 2/3/1 and a two-item submenu.`);
    if (fixture.preset === "account-switcher" && (fixture.actions?.length !== 1 || fixture.actions[0]?.kind !== "destructive")) throw new Error(`${fixture.sourceKey} requires one separated global destructive action.`);
    if (fixture.preset === "people-multiselect" && fixture.query) throw new Error(`${fixture.sourceKey} must not invent search.`);
    if (["tag-picker", "assignee-picker"].includes(fixture.preset) && !fixture.query) throw new Error(`${fixture.sourceKey} requires a query model.`);
    if (fixture.orderedIds?.length) for (const key of ["moved", "reorder", "moveUp", "moveDown"]) requireText(fixture.sourceKey, `${key} announcement`, fixture.announcements[key]);
  } else {
    requireText(fixture.sourceKey, "title", fixture.title);
    const extension = fixture.extension;
    const exact = {
      launcher: extension.kind === "launcher" ? extension.destinations.length : undefined,
      insight: extension.kind === "insight" ? extension.series.length : undefined,
      notifications: extension.kind === "notifications" ? extension.tabs.map((tab) => tab.rows.length).join("/") : undefined,
      products: extension.kind === "products" ? extension.products.length : undefined,
      cart: extension.kind === "cart" ? extension.lines.length : undefined,
      invite: extension.kind === "invite" ? `${extension.invitees.length}/${extension.roleOptions.length}` : undefined,
      sharing: extension.kind === "sharing" ? `${extension.members.length}/${extension.overflowPeople.length}` : undefined,
    };
    if (fixture.preset === "app-launcher" && exact.launcher !== 9) throw new Error(`${fixture.sourceKey} requires nine launcher destinations.`);
    if (extension.kind === "launcher" && extension.destinations.some((destination) => !destination.href && !destination.action)) throw new Error(`${fixture.sourceKey} requires a destination href or action for every launcher item.`);
    if (fixture.preset === "profile-insight" && exact.insight !== 8) throw new Error(`${fixture.sourceKey} requires eight chart points.`);
    if (extension.kind === "editor-tools") requireText(fixture.sourceKey, "typography group label", extension.typeLabel);
    if (fixture.preset === "notification-centre" && exact.notifications !== "4/4") throw new Error(`${fixture.sourceKey} requires two four-row notification tabs.`);
    if (fixture.preset === "notification-centre") for (const key of ["dismiss", "unreadCount", "emptyTitle", "emptyDescription", "emptyActionLabel"]) requireText(fixture.sourceKey, `${key} announcement`, fixture.announcements[key]);
    if (fixture.preset === "favourites" && exact.products !== 3) throw new Error(`${fixture.sourceKey} requires three favourite products.`);
    if (extension.kind === "products" && extension.products.some((product) => product.actions?.length !== 1)) throw new Error(`${fixture.sourceKey} requires one remove action per favourite product.`);
    if (fixture.preset === "mini-cart" && (exact.cart !== 3 || fixture.footerActions?.length !== 2)) throw new Error(`${fixture.sourceKey} requires three cart lines and two footer actions.`);
    if (fixture.preset === "mini-cart") requireText(fixture.sourceKey, "cart empty-state announcement", fixture.announcements.empty);
    if (extension.kind === "cart" && extension.lines.some((line) => line.actions?.length !== 2)) throw new Error(`${fixture.sourceKey} requires save and remove actions for every cart line.`);
    if (extension.kind === "cart" && extension.lines.some((line) => !line.quantity?.label)) throw new Error(`${fixture.sourceKey} requires a quantity label for every cart line.`);
    if (fixture.preset === "member-invite" && exact.invite !== "2/3") throw new Error(`${fixture.sourceKey} requires two invitees and three roles.`);
    if (extension.kind === "invite") {
      requireText(fixture.sourceKey, "invite email label", extension.emailLabel);
      requireText(fixture.sourceKey, "invite role label", extension.roleLabel);
    }
    if (extension.kind === "invite" && extension.invitees.some((invitee) => invitee.actions?.length !== 1)) throw new Error(`${fixture.sourceKey} requires one remove action per invitee.`);
    if (fixture.preset === "access-sharing" && exact.sharing !== "4/2") throw new Error(`${fixture.sourceKey} requires four visible and two overflow people.`);
    if (extension.kind === "sharing") requireText(fixture.sourceKey, "role control label", fixture.announcements.roleLabel);
    if (["member-invite", "access-sharing"].includes(fixture.preset)) for (const key of ["discardTitle", "discardDescription", "keepEditing", "discard"]) requireText(fixture.sourceKey, `${key} announcement`, fixture.announcements[key]);
  }

  const resolvedMedia = (fixture.media ?? []).map((reference) => {
    const asset = mediaAssets.find((candidate) => candidate.key === reference.key);
    if (!asset || !asset.src.startsWith("/") || asset.src.startsWith("//")) throw new Error(`${fixture.sourceKey} cannot resolve local media ${reference.key}.`);
    return asset;
  });
  return { ...fixture, resolvedMedia };
}
