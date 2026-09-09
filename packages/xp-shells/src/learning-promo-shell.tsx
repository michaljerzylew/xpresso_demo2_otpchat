"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, AppBarCompactActionMenu, AppBarSearchControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type LearningPromotion = {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  actionId: string;
  mediaAlt: string;
  mediaSrc: string;
  mediaSrcSet: string;
};
export type LearningPromoFooterLink = { id: string; label: string; href: string };
export type LearningPromoModel = { promotion: LearningPromotion; footerLinks: readonly LearningPromoFooterLink[] };
export type LearningPromoReachability = { id: string; kind: "destination" | "action" | "promotion"; parentId?: string; surface: "compact-sheet" | "inset-navigation" | "command-bar" | "promotion-card" };

export function learningPromoReachability(nav: NavModel, appBar: AppBarModel, model: LearningPromoModel, deviceClass: DeviceClass): LearningPromoReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): LearningPromoReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "compact-sheet" : "inset-navigation" },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, parentId: destination.id, surface: compact ? "compact-sheet" as const : "inset-navigation" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "command-bar" as const })),
    { id: model.promotion.actionId, kind: "promotion", surface: compact ? "compact-sheet" : "promotion-card" },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>;
}
function ChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return <a className="xp-learning-promo__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a>;
}
function DestinationLink({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <a className="xp-learning-promo__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span>{destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}</a>;
}
function Branch({ destination, activeId, renderIcon, rail }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; rail: boolean }) {
  if (rail) return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Landscape tablet child routes stay reachable beside the learning rail."><AdaptiveOverlay.Trigger className="xp-learning-promo__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-learning-branch-trigger=""><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-learning-branch-overlay="" data-branch-id={destination.id}><AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} view.`} /><AdaptiveOverlay.Body><ul className="xp-learning-promo__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
  return <details className="xp-learning-promo__branch" open={destination.children?.some(({ id }) => id === activeId)} data-xp-nav-branch=""><summary className="xp-learning-promo__destination" data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span className="xp-learning-promo__chevron" aria-hidden="true">⌄</span></summary><ul className="xp-learning-promo__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></details>;
}
function Navigation({ nav, activeId, renderIcon, rail = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const grouped = new Set((nav.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [...(nav.groups ?? []).map((group) => ({ id: group.id, label: group.label, items: group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)) })), { id: "other", label: "More", items: destinations.filter(({ id }) => !grouped.has(id)) }].filter(({ items }) => items.length);
  return <div className="xp-learning-promo__groups" data-nav-presentation={rail ? "rail" : "panel"} data-xp-learning-nav-scroll="">{groups.map((group) => <section key={group.id} aria-labelledby={`xp-learning-group-${group.id}`}><h2 id={`xp-learning-group-${group.id}`}>{group.label}</h2><ul>{group.items.map((destination) => <li key={destination.id}>{destination.children?.length ? <Branch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul></section>)}</div>;
}
function Utility({ nav, onAction }: { nav: NavModel; onAction?: AppBarProperties["onAction"] }) {
  if (!nav.utility?.length) return null;
  return <section className="xp-learning-promo__utility" aria-labelledby="xp-learning-utility" data-xp-learning-utility=""><h2 id="xp-learning-utility">System</h2><ul>{nav.utility.map((item) => <li key={item.id}><button type="button" onClick={() => onAction?.(item.actionId ?? item.id)}>{item.label}</button></li>)}</ul></section>;
}
function Promotion({ promotion, compact = false, onAction }: { promotion: LearningPromotion; compact?: boolean; onAction?: AppBarProperties["onAction"] }) {
  return <aside className="xp-learning-promo__card" data-xp-learning-promotion="" data-promo-presentation={compact ? "compact" : "card"} aria-labelledby="xp-learning-promo-title"><img src={promotion.mediaSrc} srcSet={promotion.mediaSrcSet} sizes={compact ? "144px" : "288px"} width={640} height={640} alt={promotion.mediaAlt} data-xp-learning-promo-media="" /><div><span>{promotion.eyebrow}</span><h2 id="xp-learning-promo-title">{promotion.headline}</h2><p>{promotion.body}</p><button type="button" data-xp-learning-promo-cta="" data-xp-learning-promo-action="" data-action-id={promotion.actionId} onClick={() => onAction?.(promotion.actionId)}>{promotion.cta}</button></div></aside>;
}
function SidebarContents({ nav, model, activeId, renderIcon, onAction, rail = false }: { nav: NavModel; model: LearningPromoModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; rail?: boolean }) {
  return <><a className="xp-learning-promo__brand" href="#xp-shell-content"><span aria-hidden="true">{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} rail={rail} /><Utility nav={nav} onAction={onAction} /><Promotion promotion={model.promotion} compact={rail} onAction={onAction} /></>;
}
function CompactOverlay({ nav, model, activeId, deviceClass, renderIcon, onAction }: { nav: NavModel; model: LearningPromoModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The full education navigation, utilities, and media promotion share one scroll-safe sheet with a persistent close action."><AdaptiveOverlay.Trigger className="xp-learning-promo__overlay-trigger" aria-label="Open study navigation" data-xp-learning-overlay-trigger="" data-xp-nav-renderer=""><span aria-hidden="true">◧</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-learning-overlay=""><AdaptiveOverlay.Header title={nav.identity.label} description="Study navigation and mobile companion." /><AdaptiveOverlay.Body><nav className="xp-learning-promo__overlay-nav" aria-label="Study navigation" data-xp-region="navigation"><SidebarContents nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}
function CommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: LearningPromoModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  return <header className="xp-learning-promo__command" data-xp-region="top">{compact ? <CompactOverlay nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} /> : <span className="xp-learning-promo__context">{appBar.context.title}</span>}{appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={!compact && deviceClass !== "TL"} /> : null}{compact ? <AppBarCompactActionMenu actions={actions} renderActionIcon={renderActionIcon} onAction={onAction} deviceClass={deviceClass} /> : <div className="xp-learning-promo__actions" aria-label="Study actions">{actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}</header>;
}
export function LearningPromoShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: LearningPromoModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-learning-promo-shell" data-xp-shell="" data-xp-learning-promo-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="learning-inset" data-shell-anatomy="app.inset.learning-promo" data-skin="inset" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<div className="xp-learning-promo__body">{!compact ? <aside className="xp-learning-promo__sidebar" data-xp-nav-renderer="" data-xp-region="navigation"><SidebarContents nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} rail={deviceClass === "TL"} /></aside> : null}<div className="xp-learning-promo__stage">{!compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<main className="xp-learning-promo__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-learning-promo__surface" data-xp-learning-main-surface="" data-xp-learning-work-surface="">{children}</section></main></div></div><footer className="xp-learning-promo__footer" data-xp-region="bottom"><nav aria-label="Learning resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav></footer></div>;
}
