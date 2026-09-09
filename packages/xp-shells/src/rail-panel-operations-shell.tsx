"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type RailPanelOperationsProfile = { name: string; email: string; role: string; avatarAlt: string };
export type RailPanelOperationsMetric = { id: string; label: string; value: number };
export type RailPanelOperationsProgress = { id: string; label: string; value: number; total: number; detail: string; status: string };
export type RailPanelOperationsDestination = { id: string; label: string; href: string; icon: string };
export type RailPanelOperationsFooterLink = { id: string; label: string; href: string };
export type RailPanelOperationsModel = {
  profile: RailPanelOperationsProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  metrics: readonly RailPanelOperationsMetric[];
  progress: RailPanelOperationsProgress;
  pageCards: readonly RailPanelOperationsDestination[];
  operationLinks: readonly RailPanelOperationsDestination[];
  footerLinks: readonly RailPanelOperationsFooterLink[];
};

export function railPanelOperationsReachability(nav: NavModel, appBar: AppBarModel, model: RailPanelOperationsModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "rail-destination" as const, surface: compact ? "navigation-sheet" as const : "rail" as const })),
    ...model.pageCards.map(({ id }) => ({ id, kind: "panel-destination" as const, surface: compact ? "operations-sheet" as const : "operations-panel" as const })),
    ...model.operationLinks.map(({ id }) => ({ id, kind: "panel-destination" as const, surface: compact ? "operations-sheet" as const : "operations-panel" as const })),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: compact ? "actions-sheet" as const : "command-bar" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
  ];
}

function Icon({ iconKey, label, renderIcon }: { iconKey: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: iconKey, label, href: "#", icon: iconKey, priority: 0 };
  return <span className="xp-shell-nav__icon" data-icon-key={iconKey} aria-hidden="true">{renderIcon?.(iconKey, destination) ?? label.slice(0, 1)}</span>;
}

function Profile({ model, expanded = false }: { model: RailPanelOperationsModel; expanded?: boolean }) {
  return <section className="xp-operations-panel__profile" data-xp-operations-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-operations-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function SearchField({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return <label className="xp-operations-panel__search" data-xp-operations-search=""><span>{nav.search.label}</span><span className="xp-operations-panel__search-control"><span aria-hidden="true">⌕</span><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" /></span></label>;
}

function RailNavigation({ nav, activeId, renderIcon, sheet = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; sheet?: boolean }) {
  return <nav className="xp-operations-panel__rail-navigation" aria-label="Routing operations" data-xp-operations-rail-navigation="" data-rail-presentation={sheet ? "sheet" : "rail"} data-xp-scroll=""><ul>{destinationsByPriority(nav).map((destination) => <li key={destination.id}><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label} title={sheet ? undefined : destination.label}><Icon iconKey={destination.icon} label={destination.label} renderIcon={renderIcon} /><span>{destination.label}</span></a></li>)}</ul></nav>;
}

function MetricBand({ model }: { model: RailPanelOperationsModel }) {
  return <div className="xp-operations-panel__metrics" aria-label="Transfer metrics">{model.metrics.map((metric) => <section key={metric.id} data-xp-operations-metric-id={metric.id} data-metric-value={metric.value}><span>{metric.label}</span><strong>{new Intl.NumberFormat("en-US").format(metric.value)}</strong></section>)}</div>;
}

function Progress({ model }: { model: RailPanelOperationsModel }) {
  const progress = model.progress;
  return <section className="xp-operations-panel__progress" data-xp-operations-progress="" data-progress-id={progress.id} data-progress-value={progress.value} data-progress-total={progress.total} data-progress-status={progress.status}><div><span>{progress.label}</span><strong>{progress.value}%</strong></div><progress value={progress.value} max={progress.total}>{progress.value} of {progress.total}</progress><p>{progress.detail}</p></section>;
}

function PanelDestination({ item, kind, renderIcon }: { item: RailPanelOperationsDestination; kind: "card" | "link"; renderIcon?: NavIconRenderer }) {
  return <a className={kind === "card" ? "xp-operations-panel__card" : "xp-operations-panel__link"} href={item.href} data-xp-operations-page-card-id={kind === "card" ? item.id : undefined} data-xp-operations-link-id={kind === "link" ? item.id : undefined}><Icon iconKey={item.icon} label={item.label} renderIcon={renderIcon} /><span>{item.label}</span></a>;
}

function OperationsPanel({ nav, model, renderIcon, compact = false }: { nav: NavModel; model: RailPanelOperationsModel; renderIcon?: NavIconRenderer; compact?: boolean }) {
  return <section className="xp-operations-panel__panel" data-xp-operations-panel="" data-panel-presentation={compact ? "overlay" : "persistent"} data-xp-scroll=""><header><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></header><MetricBand model={model} /><Progress model={model} /><section className="xp-operations-panel__cards" aria-labelledby="xp-operations-pages"><h2 id="xp-operations-pages">Operations</h2><div>{model.pageCards.map((item) => <PanelDestination key={item.id} item={item} kind="card" renderIcon={renderIcon} />)}</div></section><section className="xp-operations-panel__links" aria-labelledby="xp-operations-controls"><h2 id="xp-operations-controls">Control settings</h2><ul>{model.operationLinks.map((item) => <li key={item.id}><PanelDestination item={item} kind="link" renderIcon={renderIcon} /></li>)}</ul></section></section>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore all seven high-level rail destinations in a bounded touch-native surface."><AdaptiveOverlay.Trigger className="xp-operations-panel__control" aria-label="Open routing navigation" data-xp-operations-navigation-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-operations-navigation-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={nav.identity.label} description="Choose a routing workspace." /><AdaptiveOverlay.Body data-xp-operations-navigation-scroll="" data-xp-scroll=""><RailNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} sheet /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-operations-navigation-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactPanel({ nav, model, deviceClass, renderIcon }: { nav: NavModel; model: RailPanelOperationsModel; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The metrics, progress and twelve panel destinations stay one touch away in a complete scroll-safe operations sheet."><AdaptiveOverlay.Trigger className="xp-operations-panel__control" aria-label="Open operations panel" data-xp-operations-panel-trigger="">▦</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-operations-panel-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Operations panel" description="Metrics, capacity and operational destinations." /><AdaptiveOverlay.Body data-xp-operations-panel-scroll="" data-xp-scroll=""><OperationsPanel nav={nav} model={model} renderIcon={renderIcon} compact /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-operations-panel-footer=""><AdaptiveOverlay.Close>Close operations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function SearchOverlay({ nav, deviceClass }: { nav: NavModel; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="edit" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact routing search remains a labelled focused surface."><AdaptiveOverlay.Trigger className="xp-operations-panel__control" aria-label="Open route search" data-xp-operations-search-trigger="">⌕</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-operations-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Search operations" description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function ActionsOverlay({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="All three command actions remain reachable without cramming the compact command bar."><AdaptiveOverlay.Trigger className="xp-operations-panel__control" aria-label="More actions">•••</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-operations-actions-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Command actions" description="Language, health and alert controls." /><AdaptiveOverlay.Body data-xp-operations-actions-scroll="" data-xp-scroll=""><ul>{actions.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-operations-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function ProfileOverlay({ model, deviceClass }: { model: RailPanelOperationsModel; deviceClass: DeviceClass }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The operator profile remains separate from rail navigation and command actions."><AdaptiveOverlay.Trigger className="xp-operations-panel__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-operations-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-operations-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: RailPanelOperationsModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <header className="xp-operations-panel__command" data-xp-region="top" data-xp-operations-command="">{compact ? <><CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /><CompactPanel nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} /></> : <SearchField nav={nav} />}<div className="xp-operations-panel__command-context"><span>{appBar.context.greeting}</span><strong>{appBar.context.title}</strong></div>{compact ? <><SearchOverlay nav={nav} deviceClass={deviceClass} /><ActionsOverlay appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /></> : <div className="xp-operations-panel__actions">{[...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority).map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}<ProfileOverlay model={model} deviceClass={deviceClass} /></header>;
}

function Rail({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <aside className="xp-operations-panel__rail" data-xp-nav-renderer="" data-xp-region="navigation"><strong className="xp-operations-panel__mark" aria-label={nav.identity.label}>{nav.identity.shortLabel}</strong><RailNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} /></aside>;
}

function WorkSurface({ nav, appBar, children, onAction }: { nav: NavModel; appBar: AppBarModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-operations-panel__work-surface" data-xp-operations-work-surface=""><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div className="xp-operations-panel__work-content">{children}</div></section>;
}

function Footer({ model }: { model: RailPanelOperationsModel }) {
  return <footer className="xp-operations-panel__footer" data-xp-operations-footer="" data-xp-region="bottom"><nav aria-label="Routing resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav></footer>;
}

export function RailPanelOperationsShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: RailPanelOperationsModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-operations-panel-shell" data-xp-shell="" data-xp-rail-panel-operations-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="rail-panel-operations" data-shell-anatomy="app.rail-panel.operations" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<div className="xp-operations-panel__body">{compact ? null : <><Rail nav={nav} activeId={activeId} renderIcon={renderIcon} /><aside className="xp-operations-panel__persistent-panel" data-xp-region="navigation"><OperationsPanel nav={nav} model={model} renderIcon={renderIcon} /></aside></>}<div className="xp-operations-panel__stage">{compact ? null : <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} />}<main id="xp-shell-content" tabIndex={-1} className="xp-operations-panel__main xp-slot" data-xp-region="content"><WorkSurface nav={nav} appBar={appBar} onAction={onAction}>{children}</WorkSurface></main></div></div><Footer model={model} /></div>;
}
