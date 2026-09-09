"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, partitionCompactAppBarActions, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type LabeledRailProfile = { name: string; email: string; role: string; avatarAlt: string };
export type LabeledRailBreadcrumbItem = { id: string; label: string; href?: string };
export type LabeledRailFooterLink = { id: string; label: string; href: string };
export type LabeledRailFooterUtility = LabeledRailFooterLink & { icon: string };
export type LabeledRailModel = {
  profile: LabeledRailProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  breadcrumb: readonly LabeledRailBreadcrumbItem[];
  footerLinks: readonly LabeledRailFooterLink[];
  footerUtilities: readonly LabeledRailFooterUtility[];
};

export type LabeledRailReachability = {
  id: string;
  kind: "destination" | "app-action" | "route-action" | "breadcrumb" | "footer-link" | "footer-utility";
  surface: "rail" | "compact-sheet" | "command-bar" | "work-surface" | "footer";
};

export function labeledRailReachability(nav: NavModel, appBar: AppBarModel, model: LabeledRailModel, deviceClass: DeviceClass): LabeledRailReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "rail" as const })),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: "command-bar" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    ...model.breadcrumb.map(({ id }) => ({ id, kind: "breadcrumb" as const, surface: "footer" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function UtilityIcon({ icon, label, renderIcon }: { icon: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: icon, label, href: "#", icon, priority: 0 };
  return <SemanticIcon destination={destination} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: LabeledRailModel; expanded?: boolean }) {
  return <section className="xp-labeled-rail__profile" data-xp-labeled-rail-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture className="xp-labeled-rail__portrait"><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-labeled-rail-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function SearchField({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return <label className="xp-labeled-rail__search" data-xp-labeled-rail-search=""><span>{nav.search.label}</span><span><span aria-hidden="true">⌕</span><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" /></span></label>;
}

function Navigation({ nav, activeId, renderIcon, compact = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; compact?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-labeled-rail__navigation" aria-label="Order operations" data-xp-labeled-rail-navigation="" data-rail-presentation={compact ? "sheet" : "labeled"} data-xp-scroll="">
    {(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-labeled-rail-group-${group.id}`}><h2 id={`xp-labeled-rail-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a></li>)}</ul></section>)}
  </nav>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore every rail destination in one bounded touch-native navigation sheet."><AdaptiveOverlay.Trigger className="xp-labeled-rail__command-control" aria-label="Open order navigation" data-xp-labeled-rail-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-labeled-rail-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={nav.identity.label} description="Choose an order-operations destination." /><AdaptiveOverlay.Body data-xp-labeled-rail-overlay-scroll="" data-xp-scroll=""><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} compact /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-labeled-rail-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactSearch({ nav, deviceClass }: { nav: NavModel; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="edit" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Search becomes a focused touch surface without competing with the compact command bar."><AdaptiveOverlay.Trigger className="xp-labeled-rail__command-control" aria-label="Open order search" data-xp-labeled-rail-search-trigger="">⌕</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-labeled-rail-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Search orders" description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  const { visible, overflow } = partitionCompactAppBarActions(actions, deviceClass);
  return <div className="xp-labeled-rail__compact-actions">{visible.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}<AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Every command remains reachable in a bounded action sheet with a persistent close control."><AdaptiveOverlay.Trigger className="xp-labeled-rail__command-control" aria-label="More actions">•••</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-labeled-rail-actions-overlay=""><AdaptiveOverlay.Header title="Order actions" description="Desk-level account and status commands." /><AdaptiveOverlay.Body data-xp-labeled-rail-actions-scroll="" data-xp-scroll=""><ul>{overflow.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-labeled-rail-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function CompactProfile({ model, deviceClass }: { model: LabeledRailModel; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The account identity remains separate from navigation and commands on touch classes."><AdaptiveOverlay.Trigger className="xp-labeled-rail__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-labeled-rail-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-labeled-rail-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CommandBar({ nav, appBar, model, deviceClass, activeId, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: LabeledRailModel; deviceClass: DeviceClass; activeId: string; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <header className="xp-labeled-rail__command" data-xp-region="top">{compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : <SearchField nav={nav} />}<div className="xp-labeled-rail__command-context"><span>{appBar.context.greeting}</span><strong>{appBar.context.title}</strong></div>{compact ? <CompactSearch nav={nav} deviceClass={deviceClass} /> : null}{compact ? <CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-labeled-rail__actions">{[...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority).map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}{compact ? <CompactProfile model={model} deviceClass={deviceClass} /> : <Profile model={model} expanded />}</header>;
}

function WorkSurface({ nav, appBar, children, onAction }: { nav: NavModel; appBar: AppBarModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-labeled-rail__work-surface" data-xp-labeled-rail-work-surface=""><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-xp-route-action={action.id} data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div className="xp-labeled-rail__work-content">{children}</div></section>;
}

function Footer({ model, renderIcon }: { model: LabeledRailModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-labeled-rail__footer" data-xp-labeled-rail-footer="" data-xp-region="bottom"><nav aria-label="Trading resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="Desk utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} data-xp-footer-utility-id={utility.id} aria-label={utility.label} title={utility.label}><UtilityIcon icon={utility.icon} label={utility.label} renderIcon={renderIcon} /></a></li>)}</ul></nav><nav className="xp-labeled-rail__breadcrumb" aria-label="Breadcrumb"><ol>{model.breadcrumb.map((item, index) => <li key={item.id} data-xp-breadcrumb-id={item.id}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current={index === model.breadcrumb.length - 1 ? "page" : undefined}>{item.label}</span>}</li>)}</ol></nav></footer>;
}

export function LabeledRailShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: LabeledRailModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-labeled-rail-shell" data-xp-shell="" data-xp-labeled-rail-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="labeled-rail" data-shell-anatomy="app.rail.labeled" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><div className="xp-labeled-rail__body">{!compact ? <aside className="xp-labeled-rail__rail" data-xp-nav-renderer="" data-xp-region="navigation"><strong className="xp-labeled-rail__mark" aria-label={nav.identity.label}>{nav.identity.shortLabel}</strong><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} /></aside> : null}<div className="xp-labeled-rail__stage"><CommandBar nav={nav} appBar={appBar} model={model} deviceClass={deviceClass} activeId={activeId} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /><main id="xp-shell-content" tabIndex={-1} className="xp-labeled-rail__main xp-slot" data-xp-region="content"><WorkSurface nav={nav} appBar={appBar} onAction={onAction}>{children}</WorkSurface></main></div></div><Footer model={model} renderIcon={renderIcon} /></div>;
}
