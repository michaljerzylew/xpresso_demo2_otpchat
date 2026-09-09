"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const railMinimalActionForms = {
  M: "rail-minimal-action-tabs",
  TP: "rail-minimal-action-portrait-tabs",
  TL: "rail-minimal-action-touch-rail",
  DS: "rail-minimal-action-compact-rail",
  DW: "rail-minimal-action-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type RailMinimalActionModel = {
  priorityAction: {
    id: string;
    label: string;
    icon: string;
    href: string;
  };
};

export type RailMinimalActionReachability = {
  id: string;
  taps: 1 | 2;
  surface: "first-paint-tab" | "complete-more-sheet" | "touch-label-popover" | "compact-rail" | "wide-panel" | "priority-action";
};

export function railMinimalActionReachability(nav: NavModel, model: RailMinimalActionModel, deviceClass: DeviceClass): RailMinimalActionReachability[] {
  const destinations = destinationsByPriority(nav);
  const routes = destinations.map(({ id }, index) => {
    if (deviceClass === "M" || deviceClass === "TP") return { id, taps: (index < 4 ? 1 : 2) as 1 | 2, surface: index < 4 ? "first-paint-tab" as const : "complete-more-sheet" as const };
    if (deviceClass === "TL") return { id, taps: 2 as const, surface: "touch-label-popover" as const };
    if (deviceClass === "DS") return { id, taps: 1 as const, surface: "compact-rail" as const };
    return { id, taps: 1 as const, surface: "wide-panel" as const };
  });
  return [...routes, { id: model.priorityAction.id, taps: 1, surface: "priority-action" }];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-rail-action__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function ActionIcon({ model, renderIcon }: { model: RailMinimalActionModel; renderIcon?: NavIconRenderer }) {
  return <Icon destination={{ ...model.priorityAction, priority: 0 }} renderIcon={renderIcon} />;
}

function IdentityMark({ nav }: { nav: NavModel }) {
  return <span className="xp-rail-action__identity" role="img" aria-label={nav.identity.label} data-xp-rail-action-identity=""><span aria-hidden="true"><i /><i /></span></span>;
}

function DestinationLink({ destination, activeId, renderIcon, surface, tooltip = false }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "rail" | "panel" | "popover";
  tooltip?: boolean;
}) {
  return <a className="xp-rail-action__destination" href={destination.href} data-nav-id={destination.id} data-xp-rail-action-destination="" data-rail-action-surface={surface} data-xp-tab={surface === "tab" ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined} aria-label={surface === "rail" ? destination.label : undefined}>
    <Icon destination={destination} renderIcon={renderIcon} />
    <span className={surface === "rail" ? "xp-visually-hidden" : "xp-rail-action__label"}>{destination.label}</span>
    {tooltip ? <span className="xp-rail-action__tooltip" role="tooltip">{destination.label}</span> : null}
  </a>;
}

function GroupedList({ nav, activeId, renderIcon, surface }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; surface: "sheet" | "panel" }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <div className="xp-rail-action__groups" data-xp-rail-action-groups="">{nav.groups?.map((group) => <section className="xp-rail-action__group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
    <h2>{group.label}</h2>
    <div>{group.destinationIds.map((id) => { const destination = byId.get(id); return destination ? <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /> : null; })}</div>
  </section>)}</div>;
}

function PriorityAction({ model, renderIcon, surface }: { model: RailMinimalActionModel; renderIcon?: NavIconRenderer; surface: "command" | "rail" | "panel" }) {
  return <a className="xp-rail-action__priority" href={model.priorityAction.href} data-action-id={model.priorityAction.id} data-xp-rail-action-priority="" data-priority-surface={surface} aria-label={model.priorityAction.label}>
    <ActionIcon model={model} renderIcon={renderIcon} />
    <span>{model.priorityAction.label}</span>
  </a>;
}

function MoreSheet({ nav, activeId, renderIcon, deviceClass }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes preserve four first-paint routes while the complete 3+5+4 source graph remains reachable in one bounded sheet.">
    <AdaptiveOverlay.Trigger className="xp-rail-action__more-trigger" aria-label="More destinations" data-xp-rail-action-more-trigger=""><span className="xp-rail-action__more-icon" aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-rail-action__more-overlay" data-xp-rail-action-more-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title="All destinations" description="Trip organization, bookings, and account management" />
      <AdaptiveOverlay.Body className="xp-rail-action__more-body" data-xp-rail-action-more-body=""><GroupedList nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" /></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer className="xp-rail-action__overlay-footer" data-xp-rail-action-more-footer=""><AdaptiveOverlay.Close className="xp-rail-action__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function CompactTabs({ nav, activeId, renderIcon, deviceClass }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: "M" | "TP" }) {
  return <nav className="xp-rail-action__tabs" aria-label="Primary destinations" data-xp-rail-action-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<MoreSheet nav={nav} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /></nav>;
}

function TouchDestination({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="Every touch-rail icon exposes its unchanged label and destination link without relying on hover.">
    <AdaptiveOverlay.Trigger className="xp-rail-action__rail-trigger" aria-label={`Open ${destination.label}`} aria-current={destination.id === activeId ? "page" : undefined} data-nav-trigger-id={destination.id} data-xp-rail-action-rail-trigger=""><Icon destination={destination} renderIcon={renderIcon} /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-rail-action__label-overlay" data-xp-rail-action-label-overlay="" data-nav-popover-id={destination.id} data-device-class="TL">
      <AdaptiveOverlay.Header title={destination.label} description="Travel destination" />
      <AdaptiveOverlay.Body className="xp-rail-action__label-body"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" /></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer className="xp-rail-action__label-footer"><AdaptiveOverlay.Close>Close label</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function GroupedRail({ nav, activeId, renderIcon, deviceClass }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: "TL" | "DS" }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-rail-action__rail-groups" aria-label="Grouped travel destinations" data-xp-rail-action-rail-groups="">{nav.groups?.map((group) => <section className="xp-rail-action__rail-group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
    <h2 className="xp-visually-hidden">{group.label}</h2>
    <div>{group.destinationIds.map((id) => { const destination = byId.get(id); if (!destination) return null; return deviceClass === "TL" ? <TouchDestination key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="rail" tooltip />; })}</div>
  </section>)}</nav>;
}

function CompactCommand({ nav, model, renderIcon }: { nav: NavModel; model: RailMinimalActionModel; renderIcon?: NavIconRenderer }) {
  return <header className="xp-rail-action__command" data-xp-rail-action-command="" data-xp-region="top"><IdentityMark nav={nav} /><PriorityAction model={model} renderIcon={renderIcon} surface="command" /></header>;
}

function Rail({ nav, model, activeId, renderIcon, deviceClass }: { nav: NavModel; model: RailMinimalActionModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: "TL" | "DS" }) {
  return <aside className="xp-rail-action__rail" data-xp-rail-action-rail="" data-xp-region="navigation"><IdentityMark nav={nav} /><GroupedRail nav={nav} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /><PriorityAction model={model} renderIcon={renderIcon} surface="rail" /></aside>;
}

function WidePanel({ nav, model, activeId, renderIcon }: { nav: NavModel; model: RailMinimalActionModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <aside className="xp-rail-action__panel" data-xp-rail-action-panel="" data-xp-region="navigation"><div className="xp-rail-action__panel-identity"><IdentityMark nav={nav} /><strong>{nav.identity.label}</strong></div><nav aria-label="Grouped travel destinations"><GroupedList nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" /></nav><PriorityAction model={model} renderIcon={renderIcon} surface="panel" /></aside>;
}

function validateRailMinimalAction(nav: NavModel, model: RailMinimalActionModel, activeId: string) {
  const expectedIds = ["overview", "planner", "saved-places", "stays", "flights", "ground-transit", "car-hire", "sea-routes", "offers", "profiles", "preferences", "wallet"];
  const destinations = destinationsByPriority(nav);
  const valid = nav.family === "app" && destinations.map(({ id }) => id).join("/") === expectedIds.join("/")
    && destinations.every(({ href, icon, badge, children }) => href?.startsWith("#") && Boolean(icon) && !badge && !children?.length)
    && nav.groups?.map(({ id }) => id).join("/") === "group-planning/group-bookings/group-account"
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "3/5/4"
    && nav.groups?.flatMap(({ destinationIds }) => [...destinationIds]).join("/") === expectedIds.join("/")
    && activeId === "overview" && model.priorityAction.id === "action-add-reservation" && model.priorityAction.label === "Add reservation"
    && model.priorityAction.icon === "plus" && model.priorityAction.href === "#add-reservation"
    && !nav.search && !nav.actions?.length && !nav.utility?.length && !nav.widgets?.length;
  if (!valid) throw new Error("Rail-minimal-action navigation requires exact 12 direct routes in 3/5/4 groups, Overview current, one Add reservation action, and no badge, child, search, utility, action, or widget extras.");
}

export function RailMinimalActionNavigation({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; model: RailMinimalActionModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  validateRailMinimalAction(nav, model, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-rail-minimal-action-shell" data-xp-shell="" data-xp-rail-minimal-action-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.rail-minimal-action" data-device-class={deviceClass} data-variant={railMinimalActionForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
    <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
    {compact ? <CompactCommand nav={nav} model={model} renderIcon={renderIcon} /> : null}
    <div className="xp-rail-action__body">{deviceClass === "TL" || deviceClass === "DS" ? <Rail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /> : null}{deviceClass === "DW" ? <WidePanel nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} /> : null}<main id="xp-shell-content" tabIndex={-1} className="xp-rail-action__main xp-slot" data-xp-region="content"><section className="xp-rail-action__work-surface" data-xp-rail-action-work-surface="">{children}</section></main></div>
    {compact ? <div className="xp-rail-action__bottom" data-xp-region="bottom"><CompactTabs nav={nav} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /></div> : null}
  </div>;
}
