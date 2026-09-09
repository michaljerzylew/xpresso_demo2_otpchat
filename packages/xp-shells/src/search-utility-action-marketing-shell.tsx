"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavAction,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
  type NavUtility,
} from "./nav-model";

const searchUtilityActionForms = {
  M: "search-utility-bottom-tabs",
  TP: "search-utility-portrait-strip",
  TL: "search-utility-touch-two-rank",
  DS: "search-utility-complete-rank",
  DW: "search-utility-bounded-rank",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type SearchUtilityActionReachability = {
  id: string;
  kind: "destination" | "search" | "utility" | "action";
  taps: 1 | 2;
  surface: "bottom-tabs" | "route-strip" | "command" | "search-takeover" | "utility-sheet";
};

export function searchUtilityActionReachability(nav: NavModel, deviceClass: DeviceClass): SearchUtilityActionReachability[] {
  const compactUtilities = deviceClass === "M" || deviceClass === "TP";
  const routeSurface = deviceClass === "M" ? "bottom-tabs" as const : deviceClass === "TP" ? "route-strip" as const : "command" as const;
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "destination" as const, taps: 1 as const, surface: routeSurface })),
    ...(nav.search ? [{ id: "search", kind: "search" as const, taps: deviceClass === "M" ? 2 as const : 1 as const, surface: deviceClass === "M" ? "search-takeover" as const : "command" as const }] : []),
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "utility" as const, taps: compactUtilities ? 2 as const : 1 as const, surface: compactUtilities ? "utility-sheet" as const : "command" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, taps: 1 as const, surface: "command" as const })),
  ];
}

function SearchGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15.2 15.2 4.6 4.6" /></svg>;
}

function renderedUtilityIcon(utility: NavUtility, renderIcon?: NavIconRenderer) {
  const destination: NavDestination = { id: utility.id, label: utility.label, href: utility.href ?? `#${utility.id}`, icon: utility.icon, priority: 1 };
  return renderIcon?.(utility.icon, destination) ?? utility.icon.slice(0, 1).toUpperCase();
}

function Identity({ nav }: { nav: NavModel }) {
  const mark = nav.identity.label.slice(0, 1).toUpperCase();
  return <a className="xp-search-utility__identity" href={nav.identity.href ?? "#xp-marketing-content"} aria-label={nav.identity.label} data-xp-search-utility-identity=""><span aria-hidden="true">{mark || "P"}</span><strong>{nav.identity.label}</strong></a>;
}

function Destination({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return <a className="xp-search-utility__destination" href={destination.href} data-nav-id={destination.id} data-xp-search-utility-tab={tab ? "" : undefined} data-xp-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}><span className="xp-search-utility__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span><span>{destination.label}</span></a>;
}

function Utility({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  return <a className="xp-search-utility__utility" href={utility.href ?? `#${utility.actionId ?? utility.id}`} aria-label={utility.label} data-utility-id={utility.id}><span className="xp-search-utility__icon" data-icon-key={utility.icon} aria-hidden="true">{renderedUtilityIcon(utility, renderIcon)}</span><span>{utility.label}</span></a>;
}

function Action({ action }: { action: NavAction }) {
  return <a className="xp-search-utility__action" href={action.href ?? `#${action.actionId ?? action.id}`} data-action-id={action.id} data-action-kind={action.kind} data-xp-search-utility-action="">{action.label}</a>;
}

function SearchForm({ nav, overlay = false }: { nav: NavModel; overlay?: boolean }) {
  if (!nav.search) return null;
  return <form className="xp-search-utility__search-form" role="search" data-xp-search-utility-search-form="" onSubmit={(event) => event.preventDefault()}><label><span>{nav.search.label}</span><div><SearchGlyph /><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" autoFocus={overlay} /><button type="submit" aria-label={nav.search.label} data-xp-search-utility-search-action=""><SearchGlyph /></button></div></label></form>;
}

function SearchTakeover({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return <AdaptiveOverlay intent="edit" presentation={{ M: "full-screen" }} why="Phone search becomes one focused full-screen task while keeping all four route tabs stable."><AdaptiveOverlay.Trigger className="xp-search-utility__search-trigger" aria-label={`${nav.search.label}: ${nav.search.placeholder}`} data-xp-search-utility-search-trigger=""><SearchGlyph /><span>Search</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-utility__search-overlay" data-xp-search-utility-search-overlay=""><AdaptiveOverlay.Header title={nav.search.label} description={nav.search.placeholder} /><AdaptiveOverlay.Body className="xp-search-utility__search-body"><SearchForm nav={nav} overlay /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-utility__overlay-footer" data-xp-search-utility-search-footer=""><AdaptiveOverlay.Close className="xp-search-utility__overlay-close">Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function UtilitySheet({ nav, utilities, deviceClass, renderIcon }: { nav: NavModel; utilities: readonly NavUtility[]; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes keep the three public channels in one labelled bounded surface without hiding routes behind a menu."><AdaptiveOverlay.Trigger className="xp-search-utility__utility-trigger" aria-label="Open Public channels" data-xp-search-utility-utility-trigger=""><span aria-hidden="true">•••</span><strong><span className="xp-search-utility__utility-trigger-full">Public channels</span><span className="xp-search-utility__utility-trigger-short">Channels</span></strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-utility__utility-overlay" data-xp-search-utility-utility-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Public channels" description={`Direct public resources for ${nav.identity.label}.`} /><AdaptiveOverlay.Body className="xp-search-utility__utility-body">{utilities.map((utility) => <Utility key={utility.id} utility={utility} renderIcon={renderIcon} />)}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-utility__overlay-footer" data-xp-search-utility-utility-footer=""><AdaptiveOverlay.Close className="xp-search-utility__overlay-close">Close channels</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function RouteRank({ nav, activeId, renderIcon, strip = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; strip?: boolean }) {
  return <nav className={strip ? "xp-search-utility__route-strip" : "xp-search-utility__route-rank"} aria-label={nav.groups?.[0]?.label ?? "Main routes"} data-xp-search-utility-route-rank="">{destinationsByPriority(nav).map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab={strip} />)}</nav>;
}

function UtilityRank({ utilities, renderIcon }: { utilities: readonly NavUtility[]; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-search-utility__utility-rank" aria-label="Public channels" data-xp-search-utility-utility-rank="">{utilities.map((utility) => <Utility key={utility.id} utility={utility} renderIcon={renderIcon} />)}</nav>;
}

export function SearchUtilityActionMarketingShell({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const destinations = destinationsByPriority(nav);
  const utilities = nav.utility ?? [];
  const actions = nav.actions ?? [];
  const expectedDestinationIds = ["route-index", "route-console", "route-rates", "route-guide"];
  const expectedUtilityIds = ["util-code", "util-community", "util-email"];
  const valid = nav.family === "marketing"
    && destinations.map(({ id }) => id).join("/") === expectedDestinationIds.join("/")
    && destinations.every(({ children, badge, href, icon }) => !children?.length && !badge && href?.startsWith("#") && Boolean(icon))
    && nav.groups?.length === 1
    && nav.groups[0]?.destinationIds.join("/") === expectedDestinationIds.join("/")
    && utilities.map(({ id }) => id).join("/") === expectedUtilityIds.join("/")
    && utilities.every(({ badge, href, icon }) => !badge && href?.startsWith("#") && Boolean(icon))
    && actions.length === 1
    && actions[0]?.id === "action-begin"
    && actions[0]?.kind === "primary"
    && actions[0]?.href === "#begin"
    && Boolean(nav.search?.label && nav.search.placeholder)
    && !nav.widgets?.length
    && activeId === destinations[0]?.id;
  if (!valid) throw new Error("marketing.search-utility-action requires four direct routes, real search, three ordered public utilities, one primary acquisition action, and deterministic first-route current state.");
  const action = actions[0]!;
  const mobile = deviceClass === "M";
  const portrait = deviceClass === "TP";
  const touchLandscape = deviceClass === "TL";
  return <div className="xp-marketing-shell xp-search-utility" data-xp-shell="" data-xp-search-utility-shell="" data-xp-nav-renderer="" data-shell-family="marketing" data-shell-anatomy="marketing.search-utility-action" data-device-class={deviceClass} data-variant={searchUtilityActionForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a><header className="xp-search-utility__top" data-xp-region="top">{mobile ? <div className="xp-search-utility__microbar" data-xp-search-utility-command-rank=""><Identity nav={nav} /><SearchTakeover nav={nav} /><UtilitySheet nav={nav} utilities={utilities} deviceClass="M" renderIcon={renderIcon} /><Action action={action} /></div> : portrait ? <><div className="xp-search-utility__command" data-xp-search-utility-command-rank=""><Identity nav={nav} /><SearchForm nav={nav} /><UtilitySheet nav={nav} utilities={utilities} deviceClass="TP" renderIcon={renderIcon} /><Action action={action} /></div><RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} strip /></> : touchLandscape ? <><div className="xp-search-utility__command" data-xp-search-utility-command-rank=""><Identity nav={nav} /><SearchForm nav={nav} /><UtilityRank utilities={utilities} renderIcon={renderIcon} /><Action action={action} /></div><RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} /></> : <div className="xp-search-utility__complete" data-xp-search-utility-command-rank=""><Identity nav={nav} /><div className="xp-search-utility__soft" data-xp-search-utility-soft-container=""><RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} /><SearchForm nav={nav} /><UtilityRank utilities={utilities} renderIcon={renderIcon} /></div><Action action={action} /></div>}</header><main className="xp-marketing-shell__content xp-search-utility__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-search-utility-work-surface="" data-xp-region="content">{children}</main><div className="xp-marketing-shell__bottom xp-search-utility__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>{mobile ? <RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} strip /> : null}</div></div>;
}
