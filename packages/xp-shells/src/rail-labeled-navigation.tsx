"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const railLabeledForms = {
  M: "rail-labeled-tabs",
  TP: "rail-labeled-portrait-tabs",
  TL: "rail-labeled-touch-rail",
  DS: "rail-labeled-compact-rail",
  DW: "rail-labeled-wide-rail",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type RailLabeledReachability = {
  id: string;
  taps: 1 | 2;
  surface: "first-paint-tab" | "complete-more-sheet" | "labeled-rail";
};

export function railLabeledReachability(nav: NavModel, deviceClass: DeviceClass): RailLabeledReachability[] {
  return destinationsByPriority(nav).map(({ id }, index) => {
    if (deviceClass === "M" || deviceClass === "TP") {
      return {
        id,
        taps: index < 4 ? 1 : 2,
        surface: index < 4 ? "first-paint-tab" : "complete-more-sheet",
      };
    }
    return { id, taps: 1, surface: "labeled-rail" };
  });
}

function IdentityMark({ nav }: { nav: NavModel }) {
  return (
    <span className="xp-rail-labeled__identity" role="img" aria-label={nav.identity.label} data-xp-rail-labeled-identity="">
      <span aria-hidden="true"><i /><i /><i /></span>
    </span>
  );
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-rail-labeled__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "rail";
}) {
  return (
    <a
      className="xp-rail-labeled__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-rail-labeled-destination=""
      data-rail-labeled-surface={surface}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <Icon destination={destination} renderIcon={renderIcon} />
      <span className="xp-rail-labeled__label">{destination.label}</span>
    </a>
  );
}

function Standalone({ destination, activeId, renderIcon, surface }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "rail";
}) {
  return (
    <div className="xp-rail-labeled__standalone" data-xp-rail-labeled-standalone="" data-nav-standalone-id={destination.id}>
      <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />
    </div>
  );
}

function Groups({ nav, activeId, renderIcon, surface }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "rail";
}) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return (
    <div className="xp-rail-labeled__groups" data-xp-rail-labeled-groups="">
      {nav.groups?.map((group) => (
        <section className="xp-rail-labeled__group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
          <h2 className={surface === "rail" ? "xp-visually-hidden" : undefined}>{group.label}</h2>
          <div>
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

function MoreSheet({ nav, activeId, renderIcon, deviceClass }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  deviceClass: "M" | "TP";
}) {
  const standalone = destinationsByPriority(nav)[0];
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes keep four labelled first-paint routes while the exact standalone rank and all three groups remain reachable in one bounded sheet.">
      <AdaptiveOverlay.Trigger className="xp-rail-labeled__more-trigger" aria-label="More destinations" data-xp-rail-labeled-more-trigger="">
        <span className="xp-rail-labeled__more-icon" aria-hidden="true"><i /><i /><i /></span>
        <span>More</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-rail-labeled__more-overlay" data-xp-rail-labeled-more-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="All desk areas" description="Dealing, intelligence, and workspace destinations" />
        <AdaptiveOverlay.Body className="xp-rail-labeled__more-body" data-xp-rail-labeled-more-body="">
          <nav aria-label="All desk destinations">
            <Standalone destination={standalone} activeId={activeId} renderIcon={renderIcon} surface="sheet" />
            <Groups nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" />
          </nav>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-rail-labeled__overlay-footer" data-xp-rail-labeled-more-footer="">
          <AdaptiveOverlay.Close className="xp-rail-labeled__overlay-close">Close destinations</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactHeader({ nav }: { nav: NavModel }) {
  return <header className="xp-rail-labeled__command" data-xp-rail-labeled-command="" data-xp-region="top"><IdentityMark nav={nav} /></header>;
}

function CompactTabs({ nav, activeId, renderIcon, deviceClass }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  deviceClass: "M" | "TP";
}) {
  return (
    <nav className="xp-rail-labeled__tabs" aria-label="Primary desk destinations" data-xp-rail-labeled-tab-rank="">
      {destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}
      <MoreSheet nav={nav} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} />
    </nav>
  );
}

function LabeledRail({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const standalone = destinationsByPriority(nav)[0];
  return (
    <aside className="xp-rail-labeled__rail" data-xp-rail-labeled-rail="" data-xp-region="navigation">
      <IdentityMark nav={nav} />
      <nav aria-label="Grouped desk destinations">
        <Standalone destination={standalone} activeId={activeId} renderIcon={renderIcon} surface="rail" />
        <Groups nav={nav} activeId={activeId} renderIcon={renderIcon} surface="rail" />
      </nav>
    </aside>
  );
}

function validateRailLabeled(nav: NavModel, activeId: string) {
  const expectedIds = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9"];
  const destinations = destinationsByPriority(nav);
  const groupedIds = nav.groups?.flatMap(({ destinationIds }) => [...destinationIds]) ?? [];
  const valid = nav.family === "app"
    && destinations.map(({ id }) => id).join("/") === expectedIds.join("/")
    && destinations.every(({ href, icon, badge, children }) => href?.startsWith("#") && Boolean(icon) && !badge && !children?.length)
    && nav.groups?.map(({ id }) => id).join("/") === "g1/g2/g3"
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "3/3/2"
    && groupedIds.join("/") === expectedIds.slice(1).join("/")
    && activeId === "d1"
    && !nav.search && !nav.actions?.length && !nav.utility?.length && !nav.widgets?.length;
  if (!valid) throw new Error("Rail-labeled navigation requires standalone d1 current, exact direct routes d1-d9, groups g1/g2/g3 sized 3/3/2 covering d2-d9, and no badge, child, search, action, utility, or widget extras.");
}

export function RailLabeledNavigation({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  validateRailLabeled(nav, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-app-shell xp-rail-labeled-shell" data-xp-shell="" data-xp-rail-labeled-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.rail-labeled" data-device-class={deviceClass} data-variant={railLabeledForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {compact ? <CompactHeader nav={nav} /> : null}
      <div className="xp-rail-labeled__body">
        {!compact ? <LabeledRail nav={nav} activeId={activeId} renderIcon={renderIcon} /> : null}
        <main id="xp-shell-content" tabIndex={-1} className="xp-rail-labeled__main xp-slot" data-xp-region="content">
          <section className="xp-rail-labeled__work-surface" data-xp-rail-labeled-work-surface="">{children}</section>
        </main>
      </div>
      {compact ? <div className="xp-rail-labeled__bottom" data-xp-region="bottom"><CompactTabs nav={nav} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /></div> : null}
    </div>
  );
}
