"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const groupedBadgesForms = {
  M: "grouped-badges-tabs",
  TP: "grouped-badges-portrait-tabs",
  TL: "grouped-badges-touch-rail",
  DS: "grouped-badges-panel",
  DW: "grouped-badges-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type GroupedBadgesReachability = {
  id: string;
  taps: 1 | 2;
  surface: "first-paint-tab" | "complete-more-sheet" | "touch-label-popover" | "complete-panel";
};

export function groupedBadgesReachability(nav: NavModel, deviceClass: DeviceClass): GroupedBadgesReachability[] {
  const destinations = destinationsByPriority(nav);
  if (deviceClass === "M" || deviceClass === "TP") {
    return destinations.map(({ id }, index) => ({
      id,
      taps: index < 4 ? 1 : 2,
      surface: index < 4 ? "first-paint-tab" : "complete-more-sheet",
    }));
  }
  if (deviceClass === "TL") {
    return destinations.map(({ id }) => ({ id, taps: 2, surface: "touch-label-popover" }));
  }
  return destinations.map(({ id }) => ({ id, taps: 1, surface: "complete-panel" }));
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <span className="xp-grouped-badges__icon" data-icon-key={destination.icon} aria-hidden="true">
      {renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Badge({ destination }: { destination: NavDestination }) {
  if (!destination.badge) return null;
  return (
    <span
      className="xp-grouped-badges__badge"
      aria-label={`${destination.badge.label}: ${destination.badge.value}`}
      data-badge-value={destination.badge.value}
      data-badge-label={destination.badge.label}
    >
      {destination.badge.value}
    </span>
  );
}

function DestinationLink({ destination, activeId, renderIcon, surface }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "panel" | "popover";
}) {
  return (
    <a
      className="xp-grouped-badges__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-grouped-badges-destination=""
      data-xp-grouped-badges-surface={surface}
      data-xp-tab={surface === "tab" ? "" : undefined}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <Icon destination={destination} renderIcon={renderIcon} />
      <span className="xp-grouped-badges__label">{destination.label}</span>
      <Badge destination={destination} />
    </a>
  );
}

function GroupedList({ nav, activeId, renderIcon, surface }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "panel";
}) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return (
    <div className="xp-grouped-badges__groups" data-xp-grouped-badges-groups="">
      {nav.groups?.map((group) => (
        <section
          className="xp-grouped-badges__group"
          key={group.id}
          data-nav-group-id={group.id}
          data-nav-group-label={group.label}
          data-nav-group-count={group.destinationIds.length}
        >
          {group.label ? <h2>{group.label}</h2> : null}
          <div className="xp-grouped-badges__group-items">
            {group.destinationIds.map((id) => {
              const destination = byId.get(id);
              return destination ? <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /> : null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function MoreSheet({ nav, activeId, deviceClass, renderIcon }: {
  nav: NavModel;
  activeId: string;
  deviceClass: "M" | "TP";
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay
      intent="menu"
      presentation={{ M: "action-sheet", TP: "action-sheet" }}
      why="Compact navigation keeps four first-paint tabs while the complete grouped graph remains reachable in one bounded sheet."
    >
      <AdaptiveOverlay.Trigger
        className="xp-grouped-badges__more-trigger"
        aria-label="More destinations"
        data-xp-grouped-badges-more-trigger=""
      >
        <span className="xp-grouped-badges__more-icon" aria-hidden="true"><i /><i /><i /></span>
        <span>More</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content
        className="xp-grouped-badges__more-overlay"
        data-xp-grouped-badges-more-overlay=""
        data-device-class={deviceClass}
      >
        <AdaptiveOverlay.Header title="All destinations" description="Current, data, and tool destinations." />
        <AdaptiveOverlay.Body className="xp-grouped-badges__more-body" data-xp-grouped-badges-more-body="">
          <GroupedList nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" />
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-grouped-badges__overlay-footer" data-xp-grouped-badges-more-footer="">
          <AdaptiveOverlay.Close className="xp-grouped-badges__overlay-close">Close destinations</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactTabs({ nav, activeId, deviceClass, renderIcon }: {
  nav: NavModel;
  activeId: string;
  deviceClass: "M" | "TP";
  renderIcon?: NavIconRenderer;
}) {
  return (
    <nav className="xp-grouped-badges__tabs" aria-label="Primary destinations" data-xp-grouped-badges-tab-rank="">
      {destinationsByPriority(nav).slice(0, 4).map((destination) => (
        <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />
      ))}
      <MoreSheet nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} />
    </nav>
  );
}

function RailDestination({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay
      intent="inspect"
      presentation={{ TL: "popover" }}
      why="Landscape tablet icons expose an anchored touch label and destination link without relying on hover."
    >
      <AdaptiveOverlay.Trigger
        className="xp-grouped-badges__rail-trigger"
        aria-label={`Open ${destination.label}`}
        aria-current={destination.id === activeId ? "page" : undefined}
        data-nav-trigger-id={destination.id}
        data-xp-grouped-badges-rail-trigger=""
      >
        <Icon destination={destination} renderIcon={renderIcon} />
        <Badge destination={destination} />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-grouped-badges__rail-overlay" data-xp-grouped-badges-rail-overlay="" data-nav-popover-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={destination.badge?.label} />
        <AdaptiveOverlay.Body className="xp-grouped-badges__rail-body">
          <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" />
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-grouped-badges__rail-footer">
          <AdaptiveOverlay.Close>Close label</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function TouchRail({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return (
    <nav className="xp-grouped-badges__rail" aria-label="Grouped destinations" data-xp-grouped-badges-rail="">
      {nav.groups?.map((group) => (
        <section className="xp-grouped-badges__rail-group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
          {group.label ? <h2 className="xp-visually-hidden">{group.label}</h2> : null}
          {group.destinationIds.map((id) => {
            const destination = byId.get(id);
            return destination ? <RailDestination key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} /> : null;
          })}
        </section>
      ))}
    </nav>
  );
}

function validateGroupedBadges(nav: NavModel, activeId: string) {
  const destinations = destinationsByPriority(nav);
  const expectedIds = ["dest-focus", "dest-results", "dest-readers", "dest-reactions", "dest-topics", "dest-market", "dest-boosts", "dest-tone", "dest-partners", "dest-active", "dest-plan", "dest-files", "dest-setup", "dest-team"];
  const expectedGroupIds = ["group-current", "group-data", "group-tools"];
  const groupOrder = nav.groups?.flatMap(({ destinationIds }) => destinationIds) ?? [];
  const valid = nav.family === "app"
    && destinations.map(({ id }) => id).join("/") === expectedIds.join("/")
    && destinations.every(({ children, href, icon }) => !children?.length && href?.startsWith("#") && Boolean(icon))
    && nav.groups?.map(({ id }) => id).join("/") === expectedGroupIds.join("/")
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "1/8/5"
    && groupOrder.join("/") === expectedIds.join("/")
    && nav.groups?.map(({ label }) => label).join("/") === "/Data/Tools"
    && destinations.filter(({ badge }) => badge).map(({ id }) => id).join("/") === "dest-focus/dest-topics"
    && destinations[0]?.badge?.value === 5
    && destinations[0]?.badge?.label === "Five summary items need your attention"
    && destinations[4]?.badge?.value === 3
    && destinations[4]?.badge?.label === "Three topic trends changed recently"
    && activeId === "dest-focus"
    && !nav.search
    && !nav.actions?.length
    && !nav.utility?.length
    && !nav.widgets?.length;
  if (!valid) throw new Error("NavModel/grouped-badges requires 14 direct destinations in exact 1/8/5 groups, Focus current, badges 5 and 3, and no search, actions, utilities, or widgets.");
}

export function GroupedBadgesNavigation({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  validateGroupedBadges(nav, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div
      className="xp-app-shell xp-grouped-badges-shell"
      data-xp-shell=""
      data-xp-grouped-badges-shell=""
      data-xp-nav-renderer=""
      data-shell-family="app"
      data-shell-anatomy="nav-model.grouped-badges"
      data-device-class={deviceClass}
      data-variant={groupedBadgesForms[deviceClass]}
      data-skin="plain"
      data-nav-placement="side"
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      <div className="xp-grouped-badges__body">
        {deviceClass === "TL" ? <TouchRail nav={nav} activeId={activeId} renderIcon={renderIcon} /> : null}
        {deviceClass === "DS" || deviceClass === "DW" ? (
          <nav className="xp-grouped-badges__panel" aria-label="Grouped destinations" data-xp-grouped-badges-panel="">
            <GroupedList nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" />
          </nav>
        ) : null}
        <main className="xp-grouped-badges__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content">
          <section className="xp-grouped-badges__work-surface" data-xp-grouped-badges-work-surface="">{children}</section>
        </main>
      </div>
      {compact ? (
        <div className="xp-grouped-badges__bottom" data-xp-region="bottom" data-bottom-owner="tab-bar">
          <CompactTabs nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} />
        </div>
      ) : null}
    </div>
  );
}
