"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import type { AnalyticsUpsell } from "./analytics-upsell-shell";
import type { AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavBadge, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type AnalyticsUpsellNavigationModel = { upsell: AnalyticsUpsell };

export const analyticsUpsellNavigationForms = {
  M: "analytics-upsell-tabs",
  TP: "analytics-upsell-portrait-tabs",
  TL: "analytics-upsell-touch-rail",
  DS: "analytics-upsell-panel",
  DW: "analytics-upsell-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export function analyticsUpsellNavigationReachability(nav: NavModel, model: AnalyticsUpsellNavigationModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const touchRail = deviceClass === "TL";
  return [
    ...destinationsByPriority(nav).flatMap((destination, index) => [
      { id: destination.id, kind: "destination" as const, taps: compact && index >= 4 ? 2 as const : touchRail && destination.children?.length ? 2 as const : 1 as const, surface: compact && index >= 4 ? "complete-more-sheet" : compact ? "first-paint-tab" : touchRail ? "touch-rail" : "complete-panel" },
      ...(destination.children ?? []).map((child) => ({ id: child.id, kind: "destination" as const, parentId: destination.id, taps: 2 as const, surface: compact ? "complete-more-sheet" : touchRail ? "branch-popover" : "branch-disclosure" })),
    ]),
    { id: model.upsell.actionId, kind: "upsell-action" as const, taps: touchRail ? 2 as const : 1 as const, surface: touchRail ? "upsell-pane" : "upsell-card" },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-analytics-navigation__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function Badge({ badge }: { badge?: NavBadge }) {
  return badge ? <span className="xp-analytics-navigation__badge" aria-label={`${badge.label}: ${badge.value}`} data-badge-label={badge.label} data-badge-value={badge.value}>{badge.value}</span> : null;
}

function Identity({ nav, compact = false }: { nav: NavModel; compact?: boolean }) {
  return <a className="xp-analytics-navigation__identity" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-analytics-navigation-identity="" data-compact={compact ? "true" : undefined}><span aria-hidden="true"><i /><i /><i /><i /></span><strong>{nav.identity.label}</strong></a>;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-analytics-navigation__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId}><span>{child.label}</span><Badge badge={child.badge} /></a>;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; surface: "tab" | "sheet" | "rail" | "panel" }) {
  const current = destination.id === activeId;
  return <a className="xp-analytics-navigation__destination" href={destination.href} data-nav-id={destination.id} data-current={current ? "true" : undefined} data-nav-surface={surface} aria-current={current ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-analytics-navigation__label">{destination.label}</span><Badge badge={destination.badge} /></a>;
}

function GroupedTree({ nav, activeId, renderIcon, surface, expanded }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; surface: "sheet" | "panel"; expanded: boolean }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-analytics-navigation__tree" aria-label="Analytics destinations" data-xp-analytics-navigation-tree="" data-tree-surface={surface}>{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} aria-label={group.label || "Current view"}>{group.label ? <h2>{group.label}</h2> : null}<ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}>{destination.children?.length ? expanded ? <div className="xp-analytics-navigation__branch" data-nav-branch-id={destination.id} data-branch-open="true"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /><div className="xp-analytics-navigation__children">{destination.children.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></div> : <PanelBranch destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />}</li>)}</ul></section>)}</nav>;
}

function PanelBranch({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  const [open, setOpen] = useState(false);
  const childId = `xp-analytics-navigation-${destination.id}-children`;
  return <div className="xp-analytics-navigation__branch" data-nav-branch-id={destination.id} data-branch-open={open ? "true" : "false"}><div className="xp-analytics-navigation__branch-row"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="panel" /><button type="button" aria-label={`${open ? "Hide" : "Show"} ${destination.label} destinations`} aria-expanded={open} aria-controls={childId} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">⌄</span></button></div>{open ? <div className="xp-analytics-navigation__children" id={childId}>{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div> : null}</div>;
}

function RailBranch({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Analytics branch children stay labelled and touch-reachable beside the pinned rail."><AdaptiveOverlay.Trigger className="xp-analytics-navigation__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-analytics-navigation-branch-trigger="" data-nav-surface="rail"><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-analytics-navigation__label">{destination.label}</span><Badge badge={destination.badge} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-analytics-navigation__branch-overlay" data-xp-analytics-navigation-branch-overlay="" data-branch-id={destination.id} data-device-class="TL"><AdaptiveOverlay.Header title={destination.label} description={`${destination.children?.length ?? 0} related destinations`} /><AdaptiveOverlay.Body className="xp-analytics-navigation__overlay-body"><div className="xp-analytics-navigation__children">{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-analytics-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-analytics-navigation__overlay-close">Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function UpsellCard({ model, presentation, onAction }: { model: AnalyticsUpsell; presentation: "feed" | "pane" | "compact" | "card"; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-analytics-navigation__upsell" data-xp-analytics-navigation-upsell="" data-upsell-presentation={presentation} aria-labelledby={`xp-analytics-navigation-upsell-${presentation}`}><span>{model.eyebrow}</span><h2 id={`xp-analytics-navigation-upsell-${presentation}`}>{model.headline}</h2><p>{model.body}</p><button type="button" data-action-id={model.actionId} data-xp-analytics-navigation-upsell-action="" onClick={() => onAction?.(model.actionId)}>{model.cta}</button></section>;
}

function UpsellPane({ model, onAction }: { model: AnalyticsUpsell; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The compact rail keeps the complete historical-data offer behind one persistent labelled chip."><AdaptiveOverlay.Trigger className="xp-analytics-navigation__upsell-trigger" aria-label="Open historical data options" data-xp-analytics-navigation-upsell-trigger=""><span aria-hidden="true">↺</span><strong>History</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-analytics-navigation__upsell-overlay" data-xp-analytics-navigation-upsell-overlay="" data-device-class="TL"><AdaptiveOverlay.Header title={model.headline} description={model.eyebrow} /><AdaptiveOverlay.Body className="xp-analytics-navigation__overlay-body"><UpsellCard model={model} presentation="pane" onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-analytics-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-analytics-navigation__overlay-close">Close history options</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function MoreSheet({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The complete analytics graph remains grouped and reachable behind one labelled More tab."><AdaptiveOverlay.Trigger className="xp-analytics-navigation__more-trigger" aria-label="More destinations" data-xp-analytics-navigation-more-trigger=""><span aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-analytics-navigation__more-overlay" data-xp-analytics-navigation-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Analytics navigation" description="Choose a current metric or a related report." /><AdaptiveOverlay.Body className="xp-analytics-navigation__more-body"><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-analytics-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-analytics-navigation__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTabs({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-analytics-navigation__tabs" aria-label="Primary analytics navigation" data-xp-analytics-navigation-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<MoreSheet nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>;
}

function TouchRail({ nav, activeId, model, renderIcon, onAction }: { nav: NavModel; activeId: string; model: AnalyticsUpsellNavigationModel; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <aside className="xp-analytics-navigation__rail" data-xp-analytics-navigation-rail=""><Identity nav={nav} compact /><nav aria-label="Analytics rail">{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} aria-label={group.label || "Current view"}>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => destination.children?.length ? <RailBranch key={destination.id} destination={destination} renderIcon={renderIcon} /> : <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="rail" />)}</section>)}</nav><UpsellPane model={model.upsell} onAction={onAction} /></aside>;
}

export function AnalyticsUpsellNavigation({ nav, model, activeId, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; model: AnalyticsUpsellNavigationModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-analytics-navigation-shell" data-xp-shell="" data-xp-analytics-navigation-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.analytics-upsell" data-device-class={deviceClass} data-variant={analyticsUpsellNavigationForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <header className="xp-analytics-navigation__command"><Identity nav={nav} /></header> : null}<div className="xp-analytics-navigation__body">{deviceClass === "TL" ? <TouchRail nav={nav} activeId={activeId} model={model} renderIcon={renderIcon} onAction={onAction} /> : null}{deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-analytics-navigation__panel" data-xp-analytics-navigation-panel=""><Identity nav={nav} /><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" expanded={false} /><UpsellCard model={model.upsell} presentation={deviceClass === "DS" ? "compact" : "card"} onAction={onAction} /></aside> : null}<main className="xp-analytics-navigation__main" id="xp-shell-content" tabIndex={-1}><section className="xp-analytics-navigation__work-surface">{compact ? <UpsellCard model={model.upsell} presentation="feed" onAction={onAction} /> : null}{children}</section></main></div>{compact ? <CompactTabs nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}</div>;
}
