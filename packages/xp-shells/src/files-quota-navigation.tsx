"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { FormEvent, ReactNode } from "react";
import type { AppBarProperties } from "./app-bar";
import type { StorageQuota } from "./files-quota-shell";
import { destinationsByPriority, type NavBadge, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type FilesQuotaNavigationModel = { storageQuota: StorageQuota };

export const filesQuotaNavigationForms = {
  M: "files-quota-tabs",
  TP: "files-quota-portrait-tabs",
  TL: "files-quota-touch-rail",
  DS: "files-quota-panel",
  DW: "files-quota-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export function filesQuotaNavigationReachability(nav: NavModel, model: FilesQuotaNavigationModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const rail = deviceClass === "TL";
  return [
    ...destinationsByPriority(nav).flatMap((destination, index) => [
      { id: destination.id, kind: "destination" as const, taps: compact && index >= 4 ? 2 as const : rail && destination.children?.length ? 2 as const : 1 as const },
      ...(destination.children ?? []).map((child) => ({ id: child.id, kind: "destination" as const, parentId: destination.id, taps: 2 as const })),
    ]),
    { id: "file_search", kind: "search" as const, taps: rail || compact ? 2 as const : 1 as const },
    { id: model.storageQuota.actionId, kind: "quota-action" as const, taps: rail ? 2 as const : 1 as const },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-file-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function Badge({ badge }: { badge?: NavBadge }) {
  return badge ? <span className="xp-file-nav__badge" aria-label={`${badge.label}: ${badge.value}`} data-badge-label={badge.label} data-badge-value={badge.value}>{badge.value}</span> : null;
}

function Identity({ nav, compact = false }: { nav: NavModel; compact?: boolean }) {
  return <a className="xp-file-nav__identity" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-file-nav-identity="" data-compact={compact ? "true" : undefined}><span aria-hidden="true"><i /><i /><i /></span><strong>{nav.identity.label}</strong></a>;
}

function SearchForm({ nav, overlay = false }: { nav: NavModel; overlay?: boolean }) {
  if (!nav.search) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  return <form className="xp-file-nav__search" role="search" aria-label={nav.search.label} data-xp-file-nav-search="" data-search-presentation={overlay ? "overlay" : "inline"} onSubmit={submit}><label htmlFor={`xp-file-nav-search-${overlay ? "overlay" : "inline"}`}>{nav.search.label}</label><div><span aria-hidden="true">⌕</span><input id={`xp-file-nav-search-${overlay ? "overlay" : "inline"}`} type="search" placeholder={nav.search.placeholder} enterKeyHint="search" /><button type="submit">Search</button></div></form>;
}

function Quota({ model, presentation, onAction }: { model: FilesQuotaNavigationModel; presentation: "feed" | "pane" | "compact" | "card"; onAction?: AppBarProperties["onAction"] }) {
  const quota = model.storageQuota;
  return <section className="xp-file-nav__quota" data-xp-file-nav-quota="" data-quota-presentation={presentation} data-storage-used={quota.used} data-storage-total={quota.total} data-storage-unit={quota.unit}><span>{quota.eyebrow}</span><h2>{quota.headline}</h2><strong>{quota.used} / {quota.total} {quota.unit}</strong><progress value={quota.used} max={quota.total}>{quota.used} of {quota.total}</progress><p>{quota.detail}</p><button type="button" data-xp-file-nav-quota-action="" data-action-id={quota.actionId} onClick={() => onAction?.(quota.actionId)}>{quota.cta}</button></section>;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-file-nav__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId}><span>{child.label}</span><Badge badge={child.badge} /></a>;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; surface: "tab" | "sheet" | "rail" | "panel" }) {
  const current = destination.id === activeId;
  return <a className="xp-file-nav__destination" href={destination.href} data-nav-id={destination.id} data-current={current ? "true" : undefined} data-nav-surface={surface} aria-current={current ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-file-nav__label">{destination.label}</span><Badge badge={destination.badge} /></a>;
}

function PanelBranch({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  const current = destination.id === activeId;
  return <details className="xp-file-nav__branch" data-nav-branch-id={destination.id}><summary className="xp-file-nav__destination" data-nav-id={destination.id} data-current={current ? "true" : undefined} aria-current={current ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-file-nav__label">{destination.label}</span><Badge badge={destination.badge} /><span className="xp-file-nav__chevron" aria-hidden="true">⌄</span></summary><div className="xp-file-nav__children">{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></details>;
}

function GroupedTree({ nav, activeId, renderIcon, surface, expanded }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; surface: "sheet" | "panel"; expanded: boolean }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-file-nav__tree" aria-label="File archive destinations" data-xp-file-nav-tree="" data-tree-surface={surface}>{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id} aria-label={group.label || "Current view"}>{group.label ? <h2>{group.label}</h2> : null}<ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}>{destination.children?.length ? expanded ? <div className="xp-file-nav__branch" data-nav-branch-id={destination.id} data-branch-open="true"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /><div className="xp-file-nav__children">{destination.children.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></div> : <PanelBranch destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />}</li>)}</ul></section>)}</nav>;
}

function RailBranch({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Nested archive views remain labelled and touch-reachable beside the rail."><AdaptiveOverlay.Trigger className="xp-file-nav__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-file-nav-branch-trigger="" data-nav-surface="rail"><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-file-nav__label">{destination.label}</span><Badge badge={destination.badge} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-file-nav__branch-overlay" data-xp-file-nav-branch-overlay="" data-branch-id={destination.id} data-device-class="TL"><AdaptiveOverlay.Header title={destination.label} description={`${destination.children?.length ?? 0} related destinations`} /><AdaptiveOverlay.Body className="xp-file-nav__overlay-body"><div className="xp-file-nav__children">{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-file-nav__overlay-footer"><AdaptiveOverlay.Close className="xp-file-nav__overlay-close">Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function SearchOverlay({ nav, deviceClass }: { nav: NavModel; deviceClass: "M" | "TP" | "TL" }) {
  const presentation = deviceClass === "M" ? { M: "full-screen" as const } : deviceClass === "TP" ? { TP: "action-sheet" as const } : { TL: "popover" as const };
  return <AdaptiveOverlay intent="edit" presentation={presentation} why="A real focused search surface stays one action away without duplicating navigation."><AdaptiveOverlay.Trigger className="xp-file-nav__search-trigger" aria-label={`Search files: ${nav.search?.placeholder}`} data-xp-file-nav-search-trigger=""><span aria-hidden="true">⌕</span><strong>Search files</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-file-nav__search-overlay" data-xp-file-nav-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Search archive" description={nav.search?.placeholder} /><AdaptiveOverlay.Body className="xp-file-nav__overlay-body"><SearchForm nav={nav} overlay /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-file-nav__overlay-footer"><AdaptiveOverlay.Close className="xp-file-nav__overlay-close">Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function QuotaPane({ model, onAction }: { model: FilesQuotaNavigationModel; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The rail keeps exact quota and its capacity action in one anchored pane."><AdaptiveOverlay.Trigger className="xp-file-nav__quota-trigger" aria-label={`Archive space ${model.storageQuota.used} of ${model.storageQuota.total} ${model.storageQuota.unit}`} data-xp-file-nav-quota-trigger=""><span aria-hidden="true">◴</span><strong>{model.storageQuota.used} GB</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-file-nav__quota-overlay" data-xp-file-nav-quota-overlay="" data-device-class="TL"><AdaptiveOverlay.Header title={model.storageQuota.headline} description={model.storageQuota.detail} /><AdaptiveOverlay.Body className="xp-file-nav__overlay-body"><Quota model={model} presentation="pane" onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-file-nav__overlay-footer"><AdaptiveOverlay.Close className="xp-file-nav__overlay-close">Close archive space</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function MoreSheet({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The complete grouped archive graph remains reachable behind one labelled More tab."><AdaptiveOverlay.Trigger className="xp-file-nav__more-trigger" aria-label="More destinations" data-xp-file-nav-more-trigger=""><span aria-hidden="true">•••</span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-file-nav__more-overlay" data-xp-file-nav-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Archive navigation" description="Choose a file view or a related storage record." /><AdaptiveOverlay.Body className="xp-file-nav__more-body"><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-file-nav__overlay-footer"><AdaptiveOverlay.Close className="xp-file-nav__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTabs({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-file-nav__tabs" aria-label="Primary archive navigation" data-xp-file-nav-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<MoreSheet nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>;
}

function TouchRail({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: FilesQuotaNavigationModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <aside className="xp-file-nav__rail" data-xp-file-nav-rail=""><Identity nav={nav} compact /><SearchOverlay nav={nav} deviceClass="TL" /><nav aria-label="Archive rail">{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id} aria-label={group.label || "Current view"}>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => destination.children?.length ? <RailBranch key={destination.id} destination={destination} renderIcon={renderIcon} /> : <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="rail" />)}</section>)}</nav><QuotaPane model={model} onAction={onAction} /></aside>;
}

export function FilesQuotaNavigation({ nav, model, activeId, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; model: FilesQuotaNavigationModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-file-nav-shell" data-xp-shell="" data-xp-file-nav-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.files-quota" data-device-class={deviceClass} data-variant={filesQuotaNavigationForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <header className="xp-file-nav__command"><Identity nav={nav} /><SearchOverlay nav={nav} deviceClass={deviceClass} /></header> : null}<div className="xp-file-nav__body">{deviceClass === "TL" ? <TouchRail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /> : null}{deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-file-nav__panel" data-xp-file-nav-panel=""><Identity nav={nav} /><SearchForm nav={nav} /><GroupedTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" expanded={false} /><Quota model={model} presentation={deviceClass === "DS" ? "compact" : "card"} onAction={onAction} /></aside> : null}<main className="xp-file-nav__main" id="xp-shell-content" tabIndex={-1}><section className="xp-file-nav__work-surface">{compact ? <Quota model={model} presentation="feed" onAction={onAction} /> : deviceClass === "TL" ? <Quota model={model} presentation="compact" onAction={onAction} /> : null}{children}</section></main></div>{compact ? <CompactTabs nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}</div>;
}
