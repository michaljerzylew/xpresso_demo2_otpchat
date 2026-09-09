"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type DualTierOperationsMetric = { id: string; label: string; value: number };
export type DualTierOperationsProgress = { id: string; label: string; value: number; total: number; detail: string; status: string };
export type DualTierOperationsLink = { id: string; label: string; href: string; icon: string };
export type DualTierOperationsModel = {
  metrics: readonly DualTierOperationsMetric[];
  progress: DualTierOperationsProgress;
  pageCards: readonly DualTierOperationsLink[];
  operationLinks: readonly DualTierOperationsLink[];
};

export const dualTierOperationsForms = {
  M: "dual-operations-tabs",
  TP: "dual-operations-portrait-tabs",
  TL: "dual-operations-touch-rail",
  DS: "dual-operations-consolidated-panel",
  DW: "dual-operations-rail-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export function dualTierOperationsReachability(nav: NavModel, model: DualTierOperationsModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).map((destination, index) => ({ id: destination.id, kind: "destination" as const, taps: compact && index >= 4 ? 2 as const : 1 as const })),
    ...model.pageCards.map((item) => ({ id: item.id, kind: "page-card" as const, taps: 1 as const })),
    ...model.operationLinks.map((item) => ({ id: item.id, kind: "operation" as const, taps: compact || deviceClass === "TL" ? 2 as const : 1 as const })),
  ];
}

function Icon({ icon, label, renderIcon }: { icon: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: `icon-${icon}`, label, href: "#", icon, priority: 0 };
  return <span className="xp-dual-ops__icon" data-icon-key={icon} aria-hidden="true">{renderIcon?.(icon, destination) ?? label.slice(0, 1)}</span>;
}

function Identity({ nav, compact = false }: { nav: NavModel; compact?: boolean }) {
  return <a className="xp-dual-ops__identity" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-dual-ops-identity="" data-compact={compact ? "true" : undefined}><span aria-hidden="true"><i /><i /></span><strong>{compact ? nav.identity.shortLabel ?? nav.identity.label.slice(0, 2) : nav.identity.label}</strong></a>;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; surface: "tab" | "sheet" | "rail" | "panel" }) {
  const current = destination.id === activeId;
  return <a className="xp-dual-ops__destination" href={destination.href} data-nav-id={destination.id} data-current={current ? "true" : undefined} data-nav-surface={surface} aria-current={current ? "page" : undefined}><Icon icon={destination.icon} label={destination.label} renderIcon={renderIcon} /><span>{destination.label}</span></a>;
}

function Metrics({ model, compact = false }: { model: DualTierOperationsModel; compact?: boolean }) {
  return <section className="xp-dual-ops__metrics" aria-label="Routing metrics" data-xp-dual-ops-metrics="" data-compact={compact ? "true" : undefined}>{model.metrics.map((metric) => <article key={metric.id} data-metric-id={metric.id} data-metric-value={metric.value}><strong>{metric.value >= 1000 ? `${(metric.value / 1000).toFixed(1).replace(/\.0$/, "")}k` : metric.value}</strong><span>{metric.label}</span></article>)}</section>;
}

function Progress({ model, compact = false }: { model: DualTierOperationsModel; compact?: boolean }) {
  const progress = model.progress;
  return <section className="xp-dual-ops__progress" data-xp-dual-ops-progress="" data-progress-id={progress.id} data-progress-value={progress.value} data-progress-total={progress.total} data-compact={compact ? "true" : undefined}><div><span>{progress.label}</span><strong>{Math.round((progress.value / progress.total) * 100)}%</strong></div><progress value={progress.value} max={progress.total}>{progress.detail}</progress><p>{progress.detail}</p></section>;
}

function PageGrid({ model, renderIcon, compact = false }: { model: DualTierOperationsModel; renderIcon?: NavIconRenderer; compact?: boolean }) {
  return <nav className="xp-dual-ops__page-grid" aria-label="Routing pages" data-xp-dual-ops-page-grid="" data-compact={compact ? "true" : undefined}>{model.pageCards.map((card) => <a key={card.id} href={card.href} data-page-card-id={card.id}><Icon icon={card.icon} label={card.label} renderIcon={renderIcon} /><span>{card.label}</span><i aria-hidden="true">↗</i></a>)}</nav>;
}

function OperationLinks({ model, renderIcon }: { model: DualTierOperationsModel; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-dual-ops__links" aria-label="Operational controls" data-xp-dual-ops-links="">{model.operationLinks.map((link) => <a key={link.id} href={link.href} data-operation-link-id={link.id}><Icon icon={link.icon} label={link.label} renderIcon={renderIcon} /><span>{link.label}</span><i aria-hidden="true">→</i></a>)}</nav>;
}

function Overview({ model, renderIcon, compact = false, includeLinks = true }: { model: DualTierOperationsModel; renderIcon?: NavIconRenderer; compact?: boolean; includeLinks?: boolean }) {
  return <div className="xp-dual-ops__overview" data-xp-dual-ops-overview=""><Metrics model={model} compact={compact} /><Progress model={model} compact={compact} /><PageGrid model={model} renderIcon={renderIcon} compact={compact} />{includeLinks ? <section className="xp-dual-ops__link-section"><h2>Operations</h2><OperationLinks model={model} renderIcon={renderIcon} /></section> : null}</div>;
}

function CompactMore({ nav, model, activeId, deviceClass, renderIcon }: { nav: NavModel; model: DualTierOperationsModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="All rail destinations and secondary operational controls remain complete behind one labelled compact tab."><AdaptiveOverlay.Trigger className="xp-dual-ops__more-trigger" aria-label="More routing destinations" data-xp-dual-ops-more-trigger=""><span aria-hidden="true">•••</span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-dual-ops__more-overlay" data-xp-dual-ops-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Routing controls" description="Choose a destination or an operational control." /><AdaptiveOverlay.Body className="xp-dual-ops__more-body"><nav aria-label="All routing destinations" data-xp-dual-ops-more-destinations="">{destinationsByPriority(nav).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="sheet" />)}</nav><section className="xp-dual-ops__more-controls"><h2>Operational controls</h2><OperationLinks model={model} renderIcon={renderIcon} /></section><div className="xp-dual-ops__scroll-tail" aria-hidden="true" /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-dual-ops__overlay-footer"><AdaptiveOverlay.Close className="xp-dual-ops__overlay-close">Close routing controls</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTabs({ nav, model, activeId, deviceClass, renderIcon }: { nav: NavModel; model: DualTierOperationsModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-dual-ops__tabs" aria-label="Primary routing navigation" data-xp-dual-ops-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<CompactMore nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>;
}

function OperationsPane({ model, renderIcon }: { model: DualTierOperationsModel; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "side-drawer" }} why="A persistent summary stays beside the touch rail while the complete operations board opens in one bounded pane."><AdaptiveOverlay.Trigger className="xp-dual-ops__pane-trigger" data-xp-dual-ops-pane-trigger=""><span aria-hidden="true">▦</span><strong>Open operations</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-dual-ops__pane-overlay" data-xp-dual-ops-pane-overlay="" data-device-class="TL"><AdaptiveOverlay.Header title="Routing operations" description="Current throughput, target progress and operational controls." /><AdaptiveOverlay.Body className="xp-dual-ops__pane-body"><Overview model={model} renderIcon={renderIcon} /><div className="xp-dual-ops__scroll-tail" aria-hidden="true" /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-dual-ops__overlay-footer"><AdaptiveOverlay.Close className="xp-dual-ops__overlay-close">Close operations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function Rail({ nav, activeId, renderIcon, labeled = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; labeled?: boolean }) {
  return <aside className="xp-dual-ops__rail" data-xp-dual-ops-rail="" data-labeled={labeled ? "true" : undefined}><Identity nav={nav} compact={!labeled} /><nav aria-label="Routing rail">{destinationsByPriority(nav).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={labeled ? "panel" : "rail"} />)}</nav></aside>;
}

export function DualTierOperationsNavigation({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; model: DualTierOperationsModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-dual-ops" data-xp-shell="" data-xp-dual-ops-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.dual-tier-operations" data-device-class={deviceClass} data-variant={dualTierOperationsForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <header className="xp-dual-ops__command"><Identity nav={nav} /><span>Central dispatch</span></header> : null}<div className="xp-dual-ops__body">{deviceClass === "TL" || deviceClass === "DW" ? <Rail nav={nav} activeId={activeId} renderIcon={renderIcon} /> : null}{deviceClass === "TL" ? <aside className="xp-dual-ops__summary" data-xp-dual-ops-summary=""><span className="xp-dual-ops__eyebrow">Network pulse</span><Metrics model={model} compact /><Progress model={model} compact /><OperationsPane model={model} renderIcon={renderIcon} /></aside> : null}{deviceClass === "DS" ? <aside className="xp-dual-ops__panel xp-dual-ops__panel--consolidated" data-xp-dual-ops-panel=""><Rail nav={nav} activeId={activeId} renderIcon={renderIcon} labeled /><Overview model={model} renderIcon={renderIcon} /></aside> : null}{deviceClass === "DW" ? <aside className="xp-dual-ops__panel" data-xp-dual-ops-panel=""><header><span className="xp-dual-ops__eyebrow">{nav.identity.label}</span><strong>Operations board</strong></header><Overview model={model} renderIcon={renderIcon} /></aside> : null}<main className="xp-dual-ops__main" id="xp-shell-content" tabIndex={-1}><section className="xp-dual-ops__work-surface">{compact ? <Overview model={model} renderIcon={renderIcon} compact includeLinks={false} /> : null}{children}</section></main></div>{compact ? <CompactTabs nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}</div>;
}
