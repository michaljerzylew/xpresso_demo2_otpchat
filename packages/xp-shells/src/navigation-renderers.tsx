"use client";

import { AdaptiveOverlay, PriorityOverflowBar, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  AppBarActionControl,
  AppBarSearchControl,
  type AppBarModel,
  type AppBarProperties,
} from "./app-bar";
import { UtilityMeta, isLegacyUtilityMeta, type UtilityMetaModel } from "./utility-meta";
import {
  destinationsByPriority,
  type NavDestination,
  type NavAction,
  type NavIconRenderer,
  type NavModel,
  type NavUtility,
} from "./nav-model";

export const appShellForms: Readonly<Record<DeviceClass, "tab-bar" | "nav-rail" | "drawer-side" | "pane">> = {
  M: "tab-bar",
  TP: "tab-bar",
  TL: "nav-rail",
  DS: "drawer-side",
  DW: "pane",
};

export const marketingShellForms: Readonly<Record<DeviceClass, "tab-bar" | "tabs" | "top-bar" | "mega-panel">> = {
  M: "tab-bar",
  TP: "tabs",
  TL: "top-bar",
  DS: "top-bar",
  DW: "mega-panel",
};

export type NavDensity = "expanded" | "compact";

export function nextNavDensity(density: NavDensity): NavDensity {
  return density === "expanded" ? "compact" : "expanded";
}

export function formatCompactBadgeValue(value: string | number): string {
  const numeric = typeof value === "number"
    ? value
    : /^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value.trim())
      ? Number(value.replaceAll(",", ""))
      : Number.NaN;
  if (!Number.isFinite(numeric) || Math.abs(numeric) < 1000) return String(value);
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(numeric);
}

export type NavigationReachabilitySurface =
  | "first-paint-tab"
  | "more-link"
  | "more-disclosure"
  | "rail-link"
  | "rail-popover"
  | "panel-link"
  | "panel-disclosure";

export type NavigationReachability = {
  id: string;
  parentId?: string;
  surface: NavigationReachabilitySurface;
};

export type TopCommandReachability = {
  id: string;
  kind: "destination" | "action";
  parentId?: string;
  surface: "navigation-overlay" | "destination-rank" | "destination-popover" | "command-rank";
};

export function topCommandReachability(model: NavModel, appBar: AppBarModel, deviceClass: DeviceClass): TopCommandReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const destinations = destinationsByPriority(model).flatMap((destination): TopCommandReachability[] => {
    const surface = compact
      ? "navigation-overlay" as const
      : destination.children?.length ? "destination-popover" as const : "destination-rank" as const;
    return [
      { id: destination.id, kind: "destination", surface },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, parentId: destination.id, surface })),
    ];
  });
  return [
    ...destinations,
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "command-rank" as const })),
    ...(model.actions ?? []).map(({ id, kind }) => ({
      id,
      kind: "action" as const,
      surface: compact && kind !== "primary" ? "navigation-overlay" as const : "destination-rank" as const,
    })),
  ];
}

export function compactFirstPaintDestinations(model: NavModel, count = 4): NavDestination[] {
  return destinationsByPriority(model).filter((destination) => !destination.children?.length).slice(0, count);
}

function wideNavigationPartition(model: NavModel) {
  const destinations = destinationsByPriority(model);
  const railIds = new Set(compactFirstPaintDestinations(model, 3).map(({ id }) => id));
  return {
    rail: destinations.filter(({ id }) => railIds.has(id)),
    panel: destinations.filter(({ id }) => !railIds.has(id)),
  };
}

export function navigationReachability(model: NavModel, deviceClass: DeviceClass): NavigationReachability[] {
  const destinations = destinationsByPriority(model);
  if (deviceClass === "M" || deviceClass === "TP") {
    const tabIds = new Set(compactFirstPaintDestinations(model).map(({ id }) => id));
    return destinations.flatMap((destination): NavigationReachability[] => {
      if (tabIds.has(destination.id)) return [{ id: destination.id, surface: "first-paint-tab" as const }];
      const surface = destination.children?.length ? "more-disclosure" as const : "more-link" as const;
      return [
        { id: destination.id, surface },
        ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, surface })),
      ];
    });
  }
  if (deviceClass === "TL") {
    return destinations.flatMap((destination): NavigationReachability[] => {
      const surface = destination.children?.length ? "rail-popover" as const : "rail-link" as const;
      return [
        { id: destination.id, surface },
        ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, surface })),
      ];
    });
  }
  const railIds = deviceClass === "DW" ? new Set(wideNavigationPartition(model).rail.map(({ id }) => id)) : new Set<string>();
  return destinations.flatMap((destination): NavigationReachability[] => {
    const surface = railIds.has(destination.id)
      ? "rail-link" as const
      : destination.children?.length ? "panel-disclosure" as const : "panel-link" as const;
    return [
      { id: destination.id, surface },
      ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, surface })),
    ];
  });
}

type NavigationProperties = {
  model: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
  utilityMeta?: UtilityMetaModel;
  onUtilityAction?: (actionId: string) => void;
  navCollapsible?: boolean;
  navDensity?: NavDensity;
  onNavDensityChange?: (density: NavDensity) => void;
};

function DestinationIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <span className="xp-shell-nav__icon" aria-hidden="true" data-icon-key={destination.icon}>
      {renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}
    </span>
  );
}

function DestinationBadge({ destination, compact = false }: { destination: NavDestination; compact?: boolean }) {
  if (!destination.badge) return null;
  const badgeValue = compact ? formatCompactBadgeValue(destination.badge.value) : String(destination.badge.value);
  return (
    <span
      className="xp-shell-badge"
      aria-label={`${destination.badge.label}: ${destination.badge.value}`}
      data-badge-value={destination.badge.value}
      data-badge-display={badgeValue}
      data-badge-compact={compact ? "true" : "false"}
    >
      {badgeValue}
    </span>
  );
}

function DestinationLink({ destination, activeId, renderIcon, compact = false }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  compact?: boolean;
}) {
  return (
    <a
      className="xp-shell-nav__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-tab={compact ? "" : undefined}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <DestinationIcon destination={destination} renderIcon={renderIcon} />
      <span>{destination.label}</span>
      <DestinationBadge destination={destination} compact={compact} />
    </a>
  );
}

function ChildDestinationLink({ child, parentId, activeId }: {
  child: NonNullable<NavDestination["children"]>[number];
  parentId: string;
  activeId: string;
}) {
  return (
    <a
      className="xp-shell-nav__child"
      href={child.href}
      data-nav-id={child.id}
      data-nav-parent-id={parentId}
      aria-current={child.id === activeId ? "page" : undefined}
    >
      <span>{child.label}</span>
      {child.description ? <small>{child.description}</small> : null}
    </a>
  );
}

function DisclosureDestination({ destination, activeId, renderIcon, presentation }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  presentation: "more-disclosure" | "panel-disclosure";
}) {
  return (
    <details
      className="xp-shell-nav__branch"
      open={destination.children?.some(({ id }) => id === activeId)}
      data-nav-id={destination.id}
      data-xp-nav-branch=""
      data-branch-presentation={presentation}
    >
      <summary
        className="xp-shell-nav__destination xp-shell-nav__branch-trigger"
        data-xp-branch-trigger=""
        aria-current={destination.id === activeId ? "page" : undefined}
      >
        <DestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        <DestinationBadge destination={destination} />
        <span className="xp-shell-nav__branch-indicator" aria-hidden="true">⌄</span>
      </summary>
      <ul className="xp-shell-nav__children">
        {destination.children?.map((child) => (
          <li key={child.id}><ChildDestinationLink child={child} parentId={destination.id} activeId={activeId} /></li>
        ))}
      </ul>
    </details>
  );
}

function RailBranchMenu({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay intent="menu">
      <AdaptiveOverlay.Trigger
        className="xp-shell-nav__destination xp-shell-nav__branch-trigger"
        aria-label={`Open ${destination.label} navigation`}
        aria-current={destination.id === activeId ? "page" : undefined}
        data-nav-id={destination.id}
        data-xp-nav-branch=""
        data-xp-branch-trigger=""
        data-branch-presentation="rail-popover"
      >
        <DestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        <DestinationBadge destination={destination} compact />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-branch-content="" data-branch-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} destination.`} />
        <AdaptiveOverlay.Body>
          <ul className="xp-shell-nav__children xp-shell-nav__children--popover">
            {destination.children?.map((child) => (
              <li key={child.id}><ChildDestinationLink child={child} parentId={destination.id} activeId={activeId} /></li>
            ))}
          </ul>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label} navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function UtilityControl({ utility, onAction }: { utility: NavUtility; onAction?: (actionId: string) => void }) {
  if (utility.href) return <a href={utility.href} data-nav-id={utility.id}>{utility.label}</a>;
  return <button type="button" data-nav-id={utility.id} onClick={() => onAction?.(utility.actionId ?? utility.id)}>{utility.label}</button>;
}

function GroupedDestinationList({ model, destinations, activeId, renderIcon, branchPresentation = "panel-disclosure" }: {
  model: NavModel;
  destinations: readonly NavDestination[];
  activeId: string;
  renderIcon?: NavIconRenderer;
  branchPresentation?: "more-disclosure" | "panel-disclosure";
}) {
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const groupedIds = new Set((model.groups ?? []).flatMap((group) => [...group.destinationIds]));
  const ungrouped = destinations.filter((destination) => !groupedIds.has(destination.id));
  return (
    <div className="xp-shell-nav__groups">
      {(model.groups ?? []).map((group) => {
        const members = group.destinationIds.map((id) => byId.get(id)).filter((value): value is NavDestination => Boolean(value));
        if (!members.length) return null;
        return (
          <section className="xp-shell-nav__group" key={group.id} aria-labelledby={`xp-nav-group-${group.id}`}>
            <h2 id={`xp-nav-group-${group.id}`}>{group.label}</h2>
            <ul>{members.map((destination) => <li key={destination.id}>{destination.children?.length
              ? <DisclosureDestination destination={destination} activeId={activeId} renderIcon={renderIcon} presentation={branchPresentation} />
              : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul>
          </section>
        );
      })}
      {ungrouped.length ? <ul>{ungrouped.map((destination) => <li key={destination.id}>{destination.children?.length
        ? <DisclosureDestination destination={destination} activeId={activeId} renderIcon={renderIcon} presentation={branchPresentation} />
        : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul> : null}
    </div>
  );
}

function TopCommandAction({ action, onAction }: { action: NavAction; onAction?: (actionId: string) => void }) {
  if (action.href) {
    return (
      <a
        className={`xp-shell-action xp-shell-action--${action.kind}`}
        href={action.href}
        data-action-id={action.id}
        data-xp-command-cta={action.kind === "primary" ? "" : undefined}
      >
        {action.label}
      </a>
    );
  }
  return (
    <button
      className={`xp-shell-action xp-shell-action--${action.kind}`}
      type="button"
      data-action-id={action.id}
      data-xp-command-cta={action.kind === "primary" ? "" : undefined}
      onClick={() => onAction?.(action.actionId ?? action.id)}
    >
      {action.label}
    </button>
  );
}

function TopCommandRouteMeta({ appBar, utilityMeta, deviceClass }: {
  appBar: AppBarModel;
  utilityMeta?: UtilityMetaModel;
  deviceClass: DeviceClass;
}) {
  const breadcrumb = appBar.context.breadcrumb ?? [];
  return (
    <div className="xp-top-command__route-meta" data-xp-route-meta="">
      {breadcrumb.length ? (
        <nav aria-label="Current route">
          <ol>
            {breadcrumb.map((item) => <li key={item.id}><a href={item.href}>{item.label}</a></li>)}
          </ol>
        </nav>
      ) : <strong>{appBar.context.title}</strong>}
      {utilityMeta ? <UtilityMeta model={utilityMeta} deviceClass={deviceClass} compact /> : null}
    </div>
  );
}

function TopCommandOverlayMeta({ appBar, utilityMeta }: {
  appBar: AppBarModel;
  utilityMeta?: UtilityMetaModel;
}) {
  const currentRoute = appBar.context.breadcrumb?.at(-1)?.label ?? appBar.context.title;
  return (
    <section className="xp-top-command__overlay-meta" data-xp-route-meta="" aria-labelledby="xp-top-command-route-title">
      <h2 id="xp-top-command-route-title">Current route</h2>
      <strong>{currentRoute}</strong>
      {utilityMeta && isLegacyUtilityMeta(utilityMeta) && utilityMeta.items.length ? (
        <dl>{utilityMeta.items.map((item) => <div key={item.id}><dt>{item.label}</dt>{item.value ? <dd>{item.value}</dd> : null}</div>)}</dl>
      ) : null}
      {utilityMeta && isLegacyUtilityMeta(utilityMeta) && utilityMeta.status ? <p data-tone={utilityMeta.status.tone ?? "neutral"}>{utilityMeta.status.label}</p> : null}
    </section>
  );
}

function TopRankBranchMenu({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay intent="menu">
      <AdaptiveOverlay.Trigger
        className="xp-shell-nav__destination xp-top-command__branch-trigger"
        aria-label={`Open ${destination.label} destinations`}
        aria-current={destination.id === activeId ? "page" : undefined}
        data-nav-id={destination.id}
        data-xp-nav-branch=""
        data-xp-branch-trigger=""
        data-branch-presentation="destination-popover"
      >
        <DestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        <span className="xp-shell-nav__branch-indicator" aria-hidden="true">⌄</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-branch-content="" data-branch-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`Choose a destination in ${destination.label}.`} />
        <AdaptiveOverlay.Body>
          <ul className="xp-shell-nav__children xp-shell-nav__children--popover">
            {destination.children?.map((child) => (
              <li key={child.id}><ChildDestinationLink child={child} parentId={destination.id} activeId={activeId} /></li>
            ))}
          </ul>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function TopCommandDestinationGroups({ model, activeId, renderIcon }: Pick<NavigationProperties, "model" | "activeId" | "renderIcon">) {
  const destinations = destinationsByPriority(model);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const groupedIds = new Set((model.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [
    ...(model.groups ?? []).map((group) => ({
      id: group.id,
      label: group.label,
      destinations: group.destinationIds.map((id) => byId.get(id)).filter((value): value is NavDestination => Boolean(value)),
    })),
    { id: "ungrouped", label: "Workspace", destinations: destinations.filter(({ id }) => !groupedIds.has(id)) },
  ].filter(({ destinations: members }) => members.length);
  return (
    <div className="xp-top-command__destination-groups">
      {groups.map((group) => (
        <section key={group.id} className="xp-top-command__destination-group" aria-labelledby={`xp-top-command-group-${group.id}`}>
          <h2 id={`xp-top-command-group-${group.id}`}>{group.label}</h2>
          <div>
            {group.destinations.map((destination) => destination.children?.length
              ? <TopRankBranchMenu key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />
              : <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export type TopCommandNavigationProperties = Pick<
  NavigationProperties,
  "model" | "activeId" | "deviceClass" | "renderIcon" | "utilityMeta" | "onUtilityAction"
> & {
  appBar: AppBarModel;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
};

export function TopCommandNavigation({
  model,
  activeId,
  deviceClass,
  renderIcon,
  utilityMeta,
  onUtilityAction,
  appBar,
  renderActionIcon,
}: TopCommandNavigationProperties) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const destinations = destinationsByPriority(model);
  const appBarActions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  const compactPrimaryActions = compact ? (model.actions ?? []).filter(({ kind }) => kind === "primary") : [];
  const overlayActions = compact ? (model.actions ?? []).filter(({ kind }) => kind !== "primary") : [];
  return (
    <header
      className="xp-top-command"
      data-xp-nav-renderer=""
      data-xp-region="top"
      data-device-class={deviceClass}
      data-variant="command-two-rank"
    >
      <div className="xp-top-command__command-rank" data-xp-command-rank="">
        {compact ? (
          <nav className="xp-top-command__compact-navigation" aria-label="Full navigation" data-xp-region="navigation">
            <AdaptiveOverlay
              intent="menu"
              presentation={{ M: "action-sheet", TP: "action-sheet" }}
              why="Compact command navigation keeps the complete tree and actions in one stable drawer."
            >
              <AdaptiveOverlay.Trigger className="xp-top-command__nav-trigger" aria-label="Open navigation" data-xp-nav-overlay-trigger="">
                <span aria-hidden="true">☰</span>
              </AdaptiveOverlay.Trigger>
              <AdaptiveOverlay.Content data-xp-top-nav-overlay="">
                <AdaptiveOverlay.Header title="Navigation" description={`All destinations and commands for ${model.identity.label}.`} />
                <AdaptiveOverlay.Body>
                  <GroupedDestinationList model={model} destinations={destinations} activeId={activeId} renderIcon={renderIcon} branchPresentation="more-disclosure" />
                  {model.utility?.length ? (
                    <section className="xp-shell-nav__utility" aria-labelledby="xp-top-command-utility-title">
                      <h2 id="xp-top-command-utility-title">Utility</h2>
                      <ul>{model.utility.map((utility) => <li key={utility.id}><UtilityControl utility={utility} onAction={onUtilityAction} /></li>)}</ul>
                    </section>
                  ) : null}
                  {overlayActions.length ? (
                    <section className="xp-top-command__overlay-actions" aria-labelledby="xp-top-command-actions-title">
                      <h2 id="xp-top-command-actions-title">More commands</h2>
                      <div>{overlayActions.map((action) => <TopCommandAction key={action.id} action={action} onAction={onUtilityAction} />)}</div>
                    </section>
                  ) : null}
                  <TopCommandOverlayMeta appBar={appBar} utilityMeta={utilityMeta} />
                </AdaptiveOverlay.Body>
                <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
              </AdaptiveOverlay.Content>
            </AdaptiveOverlay>
          </nav>
        ) : null}
        <a className="xp-top-command__identity" href={model.identity.href ?? "#xp-shell-content"} aria-label={model.identity.label}>
          <span aria-hidden="true">{model.identity.shortLabel ?? model.identity.mark ?? model.identity.label.slice(0, 2).toUpperCase()}</span>
          <strong>{model.identity.label}</strong>
        </a>
        {appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={!compact} /> : null}
        <div className="xp-top-command__app-actions" aria-label="Workspace actions">
          {appBarActions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onUtilityAction} />)}
        </div>
      </div>
      {compact ? (
        <div className="xp-top-command__compact-route" data-xp-compact-route="">
          <div>
            <strong>{appBar.context.title}</strong>
            {appBar.context.greeting ? <span>{appBar.context.greeting}</span> : null}
          </div>
          {compactPrimaryActions.map((action) => <TopCommandAction key={action.id} action={action} onAction={onUtilityAction} />)}
        </div>
      ) : (
        <nav className="xp-top-command__destination-rank" aria-label="Primary" data-xp-destination-rank="" data-xp-region="navigation">
          <TopCommandDestinationGroups model={model} activeId={activeId} renderIcon={renderIcon} />
          <div className="xp-top-command__rank-actions">
            {model.actions?.map((action) => <TopCommandAction key={action.id} action={action} onAction={onUtilityAction} />)}
          </div>
          <TopCommandRouteMeta appBar={appBar} utilityMeta={utilityMeta} deviceClass={deviceClass} />
        </nav>
      )}
    </header>
  );
}

function MoreNavigation({ model, destinations, activeId, deviceClass, renderIcon, utilityMeta, onUtilityAction, label = "More" }: NavigationProperties & {
  destinations: readonly NavDestination[];
  label?: string;
}) {
  const forceSheet = deviceClass === "M"
    ? { M: "action-sheet" as const }
    : deviceClass === "TP"
      ? { TP: "action-sheet" as const }
      : undefined;
  return (
    <AdaptiveOverlay
      intent="menu"
      presentation={forceSheet}
      why={forceSheet ? "Long navigation keeps its close action visible while its body scrolls." : undefined}
    >
      <AdaptiveOverlay.Trigger className="xp-shell-nav__more" aria-label="More">
        <span className="xp-shell-nav__more-glyph" aria-hidden="true">•••</span>
        <span>{label}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content>
        <AdaptiveOverlay.Header title="More" description="All remaining destinations and account actions." />
        <AdaptiveOverlay.Body>
          {destinations.length ? <GroupedDestinationList model={model} destinations={destinations} activeId={activeId} renderIcon={renderIcon} branchPresentation="more-disclosure" /> : null}
          {model.utility?.length ? (
            <section className="xp-shell-nav__utility" aria-labelledby="xp-nav-utility-title">
              <h2 id="xp-nav-utility-title">Utility</h2>
              <ul>{model.utility.map((utility) => <li key={utility.id}><UtilityControl utility={utility} onAction={onUtilityAction} /></li>)}</ul>
            </section>
          ) : null}
          {model.actions?.length ? (
            <section className="xp-shell-nav__utility" aria-labelledby="xp-nav-actions-title">
              <h2 id="xp-nav-actions-title">Actions</h2>
              <ul>{model.actions.map((action) => <li key={action.id}>{action.href ? <a className={`xp-shell-action xp-shell-action--${action.kind}`} href={action.href}>{action.label}</a> : <button className={`xp-shell-action xp-shell-action--${action.kind}`} type="button" onClick={() => onUtilityAction?.(action.actionId ?? action.id)}>{action.label}</button>}</li>)}</ul>
            </section>
          ) : null}
          {utilityMeta ? <UtilityMeta model={utilityMeta} deviceClass={deviceClass} compact /> : null}
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactTabBar(properties: NavigationProperties) {
  const destinations = destinationsByPriority(properties.model);
  const primary = compactFirstPaintDestinations(properties.model);
  const primaryIds = new Set(primary.map(({ id }) => id));
  const overflow = destinations.filter(({ id }) => !primaryIds.has(id));
  return (
    <nav className="xp-shell-nav xp-shell-nav--tabs" aria-label="Primary" data-xp-nav-renderer="" data-xp-region="navigation" data-variant="tab-bar">
      <div className="xp-shell-nav__tabs" data-xp-region="bottom">
        {primary.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} compact />)}
        <MoreNavigation {...properties} destinations={overflow} />
      </div>
    </nav>
  );
}

export function MarketingMicroBar({ model, onUtilityAction }: Pick<NavigationProperties, "model" | "onUtilityAction">) {
  return (
    <div className="xp-marketing-nav__micro-bar">
      <a className="xp-shell-nav__panel-identity" href={model.identity.href ?? "#content"}>{model.identity.label}</a>
      {model.search ? <a className="xp-marketing-nav__search" href={model.search.href ?? "#search"} aria-label={`${model.search.label}: ${model.search.placeholder}`}>Search</a> : null}
      {model.actions?.slice(0, 1).map((action) => action.href ? <a className={`xp-shell-action xp-shell-action--${action.kind}`} key={action.id} href={action.href}>{action.label}</a> : <button className={`xp-shell-action xp-shell-action--${action.kind}`} key={action.id} type="button" onClick={() => onUtilityAction?.(action.actionId ?? action.id)}>{action.label}</button>)}
    </div>
  );
}

function RailNavigation(properties: NavigationProperties) {
  const destinations = destinationsByPriority(properties.model);
  return (
    <nav className="xp-shell-nav xp-shell-nav--rail" aria-label="Primary" data-xp-nav-renderer="" data-xp-region="navigation" data-variant="nav-rail">
      <a className="xp-shell-nav__identity" href={properties.model.identity.href ?? "#content"} aria-label={properties.model.identity.label}>
        <span aria-hidden="true">{properties.model.identity.shortLabel ?? properties.model.identity.mark ?? properties.model.identity.label.slice(0, 2).toUpperCase()}</span>
      </a>
      <div className="xp-shell-nav__rail-items">
        {destinations.map((destination) => destination.children?.length
          ? <RailBranchMenu key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} />
          : <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} compact />)}
      </div>
      <MoreNavigation {...properties} destinations={[]} label="More" />
    </nav>
  );
}

function DensityToggle({ density, onChange }: { density: NavDensity; onChange: (density: NavDensity) => void }) {
  const expanded = density === "expanded";
  const label = expanded ? "Collapse navigation" : "Expand navigation";
  return (
    <button
      className="xp-shell-nav__density-toggle"
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls="xp-shell-primary-navigation"
      data-xp-nav-density-toggle=""
      data-state={density}
      onClick={() => onChange(nextNavDensity(density))}
    >
      <span aria-hidden="true">{expanded ? "‹" : "›"}</span>
    </button>
  );
}

function PanelNavigation(properties: NavigationProperties & { wide?: boolean }) {
  const destinations = destinationsByPriority(properties.model);
  const density = properties.navDensity ?? "expanded";
  const compactPanel = properties.navCollapsible && density === "compact";
  const widePartition = wideNavigationPartition(properties.model);
  const railDestinations = properties.wide ? widePartition.rail : [];
  const panelDestinations = properties.wide ? widePartition.panel : destinations;
  return (
    <nav
      id="xp-shell-primary-navigation"
      className="xp-shell-nav xp-shell-nav--panel"
      aria-label="Primary"
      data-xp-nav-renderer=""
      data-xp-region="navigation"
      data-variant={properties.wide ? "pane" : "drawer-side"}
      data-nav-density={density}
      data-nav-collapsible={properties.navCollapsible ? "true" : "false"}
    >
      <div className="xp-shell-nav__panel-header">
        <a className="xp-shell-nav__panel-identity" href={properties.model.identity.href ?? "#content"} aria-label={properties.model.identity.label}>
          <span className="xp-shell-nav__identity-mark" aria-hidden="true">{properties.model.identity.shortLabel ?? properties.model.identity.mark ?? properties.model.identity.label.slice(0, 2).toUpperCase()}</span>
          <span className="xp-shell-nav__identity-copy">{properties.model.identity.label}</span>
        </a>
        {properties.navCollapsible && properties.onNavDensityChange ? <DensityToggle density={density} onChange={properties.onNavDensityChange} /> : null}
      </div>
      {compactPanel ? (
        <>
          <div className="xp-shell-nav__mini-rail">{destinations.map((destination) => destination.children?.length
            ? <RailBranchMenu key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} />
            : <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} compact />)}</div>
          {properties.model.utility?.length || properties.model.actions?.length ? <div className="xp-shell-nav__panel-more"><MoreNavigation {...properties} destinations={[]} label="More" /></div> : null}
        </>
      ) : (
        <>
          {properties.wide ? <div className="xp-shell-nav__mini-rail">{railDestinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} compact />)}</div> : null}
          <GroupedDestinationList model={properties.model} destinations={panelDestinations} activeId={properties.activeId} renderIcon={properties.renderIcon} />
          {properties.model.utility?.length || properties.model.actions?.length ? <div className="xp-shell-nav__panel-more"><MoreNavigation {...properties} destinations={[]} label="More" /></div> : null}
          {properties.utilityMeta ? <UtilityMeta model={properties.utilityMeta} deviceClass={properties.deviceClass} /> : null}
        </>
      )}
    </nav>
  );
}

function MarketingTabs(properties: NavigationProperties) {
  const destinations = destinationsByPriority(properties.model);
  return (
    <nav className="xp-shell-nav xp-marketing-nav xp-marketing-nav--tabs" aria-label="Primary" data-xp-nav-renderer="" data-xp-region="navigation" data-variant="tabs">
      <MarketingMicroBar model={properties.model} onUtilityAction={properties.onUtilityAction} />
      <div className="xp-marketing-nav__tabs-row">
        <div className="xp-marketing-nav__tab-strip" data-xp-scroll>
          {destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} compact />)}
        </div>
        <MoreNavigation {...properties} destinations={[]} />
      </div>
    </nav>
  );
}

function TopBarNavigation(properties: NavigationProperties & { mega?: boolean }) {
  const destinations = destinationsByPriority(properties.model);
  const items = destinations.map((destination) => ({
    id: destination.id,
    label: destination.label,
    priority: destination.priority,
    content: <DestinationLink destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} />,
    onSelect: () => { if (destination.href) globalThis.location?.assign(destination.href); },
  }));
  return (
    <nav className="xp-shell-nav xp-marketing-nav xp-marketing-nav--top" aria-label="Primary" data-xp-nav-renderer="" data-xp-region="navigation" data-variant={properties.mega ? "mega-panel" : "top-bar"}>
      <a className="xp-shell-nav__panel-identity" href={properties.model.identity.href ?? "#content"}>{properties.model.identity.label}</a>
      {properties.mega ? (
        <div className="xp-marketing-nav__mega-items">
          {destinations.map((destination) => destination.children?.length ? (
            <details key={destination.id} data-nav-id={destination.id}>
              <summary aria-current={destination.id === properties.activeId ? "page" : undefined}>
                <DestinationIcon destination={destination} renderIcon={properties.renderIcon} />{destination.label}
              </summary>
              <ul>{destination.children.map((child) => <li key={child.id}><a href={child.href} data-nav-id={child.id}><strong>{child.label}</strong>{child.description ? <small>{child.description}</small> : null}</a></li>)}</ul>
            </details>
          ) : <DestinationLink key={destination.id} destination={destination} activeId={properties.activeId} renderIcon={properties.renderIcon} />)}
        </div>
      ) : <PriorityOverflowBar items={items} overflowLabel="More" closeLabel="Close navigation" label="Primary navigation" />}
      {properties.model.search ? <a className="xp-marketing-nav__search" href={properties.model.search.href ?? "#search"} aria-label={`${properties.model.search.label}: ${properties.model.search.placeholder}`}>Search</a> : null}
      {properties.model.actions?.map((action) => action.href ? <a className={`xp-shell-action xp-shell-action--${action.kind}`} key={action.id} href={action.href}>{action.label}</a> : <button className={`xp-shell-action xp-shell-action--${action.kind}`} key={action.id} type="button" onClick={() => properties.onUtilityAction?.(action.actionId ?? action.id)}>{action.label}</button>)}
    </nav>
  );
}

export function AppNavigation(properties: NavigationProperties): ReactNode {
  switch (properties.deviceClass) {
    case "M":
    case "TP": return <CompactTabBar {...properties} />;
    case "TL": return <RailNavigation {...properties} />;
    case "DS": return <PanelNavigation {...properties} />;
    case "DW": return <PanelNavigation {...properties} wide />;
  }
}

export function MarketingNavigation(properties: NavigationProperties): ReactNode {
  switch (properties.deviceClass) {
    case "M": return <CompactTabBar {...properties} />;
    case "TP": return <MarketingTabs {...properties} />;
    case "TL":
    case "DS": return <TopBarNavigation {...properties} />;
    case "DW": return <TopBarNavigation {...properties} mega />;
  }
}
