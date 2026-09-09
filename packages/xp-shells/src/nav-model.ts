import type { ReactNode } from "react";
import type { DeviceClass } from "@xp/primitives";
import type { RelocationTarget } from "./regions";

export type NavFamily = "app" | "marketing" | "two-tier";
export type NavIconKey = string;

export type NavBadge = {
  label: string;
  value: string | number;
};

export type NavChild = {
  id: string;
  label: string;
  href: string;
  icon?: NavIconKey;
  description?: string;
  badge?: NavBadge;
};

export type NavDestination = {
  id: string;
  label: string;
  href?: string;
  icon: NavIconKey;
  priority: number;
  badge?: NavBadge;
  children?: readonly NavChild[];
};

export type NavGroup = {
  id: string;
  label: string;
  destinationIds: readonly string[];
};

export type NavUtility = {
  id: string;
  label: string;
  icon: NavIconKey;
  href?: string;
  actionId?: string;
  badge?: NavBadge;
};

export type NavAction = {
  id: string;
  label: string;
  kind: "primary" | "secondary";
  href?: string;
  actionId?: string;
};

export type NavSearch = {
  label: string;
  placeholder: string;
  scope?: string;
  href?: string;
};

export type NavIdentity = {
  label: string;
  shortLabel?: string;
  href?: string;
  mark?: string;
};

export type NavWidget = {
  id: string;
  kind: "stat" | "quota" | "list" | "promo";
  label: string;
  value?: string;
  detail?: string;
  targetDestinationId: string;
  relocation: Readonly<Record<DeviceClass, RelocationTarget>>;
};

export type NavModel = {
  family: NavFamily;
  identity: NavIdentity;
  destinations: readonly NavDestination[];
  groups?: readonly NavGroup[];
  utility?: readonly NavUtility[];
  actions?: readonly NavAction[];
  search?: NavSearch;
  widgets?: readonly NavWidget[];
};

export type NavIconRenderer = (icon: NavIconKey, destination: NavDestination) => ReactNode;

export type ShellFixtureDestination = {
  id: string;
  label: string;
  href?: string;
  icon?: NavIconKey;
  badge?: NavBadge;
  children?: readonly NavChild[];
};

export type ShellFixtureUtilityItem = {
  id: string;
  label: string;
  icon?: NavIconKey;
  href?: string;
  badge?: NavBadge;
};

export type ShellFixtureUtilityGroup = {
  name: string;
  items: readonly ShellFixtureUtilityItem[];
};

export type ShellFixtureCommercePanels = {
  saved: {
    label: string;
    finalActionLabel: string;
    rows: readonly {
      id: string;
      title: string;
      subtitle: string;
      price: string;
      oldPrice: string;
      mediaAlt: string;
      mediaAssetId?: string;
      mediaSrc?: string;
      removeActionLabel: string;
    }[];
  };
  basket: {
    label: string;
    declaredCount: number;
    openFullActionLabel: string;
    rows: readonly {
      id: string;
      sellerName: string;
      sellerAlt: string;
      sellerAssetId?: string;
      sellerSrc?: string;
      deliveryLabel: string;
      discountLabel: string;
      productName: string;
      productAlt: string;
      productAssetId?: string;
      productSrc?: string;
      oldPrice: string;
      currentPrice: string;
      color: string;
      size: string;
      rating: string;
      quantity: number;
      moveActionLabel: string;
      removeActionLabel: string;
    }[];
    finalActions: readonly {
      id: string;
      label: string;
      kind: "primary" | "secondary";
    }[];
  };
};

export type ShellFixture = {
  productName: string;
  workspaceName: string;
  screenTitle: string;
  greeting: string;
  searchPlaceholder: string;
  searchActionLabel?: string;
  activeDestinationId?: string;
  primaryAction?: string;
  secondaryAction?: string;
  actions?: readonly NavAction[];
  appBarActions?: readonly {
    id: string;
    label: string;
    icon: string;
    kind?: "icon";
  }[];
  commercePanels?: ShellFixtureCommercePanels;
  metrics?: readonly {
    id: string;
    label: string;
    value: string | number;
    detail?: string;
  }[];
  railDestinations?: readonly ShellFixtureDestination[];
  progress?: {
    id: string;
    label: string;
    value: number;
    total: number;
    detail: string;
    status: string;
  };
  pageCards?: readonly {
    id: string;
    label: string;
    href: string;
    icon: string;
  }[];
  operationLinks?: readonly {
    id: string;
    label: string;
    href: string;
    icon: string;
  }[];
  footerLinks?: readonly {
    id: string;
    label: string;
    href: string;
  }[];
  breadcrumb?: readonly {
    id: string;
    label: string;
    href?: string;
  }[];
  recipients?: readonly {
    id: string;
    name: string;
    role: string;
    amount: string;
    status: string;
  }[];
  operationCards?: readonly {
    id: string;
    label: string;
    value: string;
    detail: string;
  }[];
  workspaceOptions?: readonly {
    id: string;
    label: string;
    context: string;
  }[];
  trial?: {
    planName: string;
    daysRemaining: number;
    used: number;
    total: number;
    detail: string;
    cta: string;
    addWorkspaceLabel: string;
  };
  learningPromotion?: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: string;
    actionId: string;
    mediaAlt: string;
  };
  analyticsUpsell?: {
    eyebrow: string;
    headline: string;
    body: string;
    cta: string;
    actionId: string;
  };
  identityProfile?: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
    socialUtilities: readonly {
      id: string;
      label: string;
      icon: string;
      href: string;
    }[];
  };
  accountProfile?: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
    avatarAssetId?: string;
    avatarSrc?: string;
  };
  priorityAction?: {
    id: string;
    label: string;
    icon?: string;
    href: string;
  };
  contextStrip?: {
    breadcrumb: readonly {
      id: string;
      label: string;
      href?: string;
    }[];
    actions: readonly {
      id: string;
      label: string;
      icon: string;
      href: string;
      priority: "primary" | "secondary";
    }[];
  };
  storageQuota?: {
    eyebrow: string;
    headline: string;
    used: number;
    total: number;
    unit: string;
    detail: string;
    cta: string;
    actionId: string;
  };
  liveOperation?: {
    eyebrow: string;
    headline: string;
    count: number;
    detail: string;
    actionId: string;
    actionLabel: string;
    staff: readonly {
      id: string;
      name: string;
      initials: string;
      role: string;
      tone: string;
    }[];
  };
  footerSocialUtilities?: readonly {
    id: string;
    label: string;
    icon: string;
    href: string;
  }[];
  interactionRequirements?: Readonly<Record<string, readonly DeviceClass[]>>;
  destinations?: readonly ShellFixtureDestination[];
  destinationGroups?: readonly NavGroup[];
  utilityGroups?: readonly ShellFixtureUtilityGroup[];
  widget?: {
    label: string;
    value: string;
    detail: string;
  };
  emptyHeading: string;
  emptyBody: string;
};

export function defineShellFixture<const T extends ShellFixture>(fixture: T): T {
  if (fixture.activeDestinationId && !(fixture.destinations ?? fixture.railDestinations ?? []).some(({ id }) => id === fixture.activeDestinationId)) {
    throw new Error(`Active destination ${fixture.activeDestinationId} is missing from fixture destinations.`);
  }
  return fixture;
}

export function navModelFromFixture(fixture: ShellFixture, family: NavFamily = "app"): NavModel {
  const fixtureDestinations = fixture.destinations ?? fixture.railDestinations ?? [];
  const destinationIds = fixtureDestinations.map(({ id }) => id);
  const widgetTarget = destinationIds[0] ?? "overview";
  return {
    family,
    identity: { label: fixture.productName, shortLabel: fixture.productName.slice(0, 2).toUpperCase() },
    destinations: fixtureDestinations.map((destination, index) => ({
      id: destination.id,
      label: destination.label,
      href: destination.href ?? (destination.children?.length ? undefined : `#${destination.id}`),
      icon: destination.icon ?? destination.id,
      priority: index + 1,
      badge: destination.badge,
      children: destination.children,
    })),
    groups: fixture.destinationGroups ?? [{ id: "workspace", label: fixture.workspaceName, destinationIds }],
    utility: (fixture.utilityGroups ?? []).flatMap((group) => group.items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon ?? item.id,
      href: item.href,
      actionId: item.href ? undefined : item.id,
      badge: item.badge,
    }))),
    actions: fixture.actions ?? [
      ...(fixture.primaryAction ? [{ id: "primary", label: fixture.primaryAction, kind: "primary" as const, actionId: "primary" }] : []),
      ...(fixture.secondaryAction ? [{ id: "secondary", label: fixture.secondaryAction, kind: "secondary" as const, actionId: "secondary" }] : []),
    ],
    search: fixture.searchPlaceholder?.trim() ? { label: "Search workspace", placeholder: fixture.searchPlaceholder, scope: fixture.workspaceName } : undefined,
    widgets: fixture.widget ? [{
      id: "fixture-status",
      kind: "stat",
      label: fixture.widget.label,
      value: fixture.widget.value,
      detail: fixture.widget.detail,
      targetDestinationId: widgetTarget,
      relocation: {
        M: "dashboard-kpi-chip",
        TP: "dashboard-feed-card",
        TL: "tabbar-badge",
        DS: "dashboard-feed-card",
        DW: "inspector-pane",
      },
    }] : [],
  };
}

export function validateNavModel(model: NavModel): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const destinationIds = new Set(model.destinations.map(({ id }) => id));
  for (const destination of model.destinations) {
    if (ids.has(destination.id)) errors.push(`Duplicate destination id: ${destination.id}`);
    ids.add(destination.id);
    if (!destination.icon.trim()) errors.push(`Destination ${destination.id} has no semantic icon key.`);
    if (!destination.children?.length && !destination.href?.trim()) errors.push(`Leaf destination ${destination.id} has no href.`);
    for (const child of destination.children ?? []) {
      if (ids.has(child.id)) errors.push(`Duplicate navigation id: ${child.id}`);
      ids.add(child.id);
      if (!child.href.trim()) errors.push(`Child destination ${child.id} has no href.`);
    }
  }
  for (const group of model.groups ?? []) {
    for (const id of group.destinationIds) {
      if (!destinationIds.has(id)) errors.push(`Group ${group.id} references unknown destination ${id}.`);
    }
  }
  for (const widget of model.widgets ?? []) {
    if (!destinationIds.has(widget.targetDestinationId)) {
      errors.push(`Widget ${widget.id} references unknown destination ${widget.targetDestinationId}.`);
    }
  }
  return errors;
}

export function destinationsByPriority(model: NavModel): NavDestination[] {
  return [...model.destinations].sort((left, right) => left.priority - right.priority);
}
