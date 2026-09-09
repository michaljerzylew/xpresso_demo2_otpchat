"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, partitionCompactAppBarActions, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type LiveOperationsProfile = { name: string; email: string; role: string; avatarAlt: string };
export type LiveOperationsStaff = { id: string; name: string; initials: string; role: string; tone: "slate" | "cobalt" | "plum" | "moss" };
export type LiveOperation = { eyebrow: string; headline: string; count: number; detail: string; actionId: string; actionLabel: string; staff: readonly LiveOperationsStaff[] };
export type LiveOperationsFooterLink = { id: string; label: string; href: string };
export type LiveOperationsFooterUtility = LiveOperationsFooterLink & { icon: string };
export type LiveOperationsModel = {
  profile: LiveOperationsProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  liveOperation: LiveOperation;
  footerLinks: readonly LiveOperationsFooterLink[];
  footerUtilities: readonly LiveOperationsFooterUtility[];
};

export type LiveOperationsReachability = { id: string; kind: "destination" | "app-action" | "live-action" | "footer-utility"; parentId?: string; surface: "navigation" | "compact-sheet" | "command-bar" | "live-operation" | "footer" };
export function liveOperationsReachability(nav: NavModel, appBar: AppBarModel, model: LiveOperationsModel, deviceClass: DeviceClass): LiveOperationsReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): LiveOperationsReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "compact-sheet" : "navigation" },
      ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "navigation" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: "command-bar" as const })),
    { id: model.liveOperation.actionId, kind: "live-action", surface: "live-operation" },
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ keyName, label, renderIcon }: { keyName: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: keyName, label, href: "#", icon: keyName, priority: 0 };
  return <span className="xp-shell-nav__icon" data-icon-key={keyName} aria-hidden="true">{renderIcon?.(keyName, destination) ?? keyName.slice(0, 1).toUpperCase()}</span>;
}

function Profile({ model, expanded = false }: { model: LiveOperationsModel; expanded?: boolean }) {
  return <section className="xp-live-operations__profile" data-xp-live-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture className="xp-live-operations__portrait"><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "48px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-live-profile-avatar="" /></picture>
    <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span>{expanded ? <a href={`mailto:${model.profile.email}`}>{model.profile.email}</a> : null}</div>
  </section>;
}

function SearchField({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return <label className="xp-live-operations__search" data-xp-live-search=""><span>{nav.search.label}</span><span className="xp-live-operations__search-control"><span aria-hidden="true">⌕</span><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" /></span></label>;
}

function StaffCluster({ staff, detailed = false }: { staff: readonly LiveOperationsStaff[]; detailed?: boolean }) {
  return <ul className="xp-live-operations__staff" aria-label="Staff on current workload">{staff.map((person) => <li key={person.id} data-xp-live-staff-id={person.id} data-staff-name={person.name} data-staff-role={person.role} data-staff-tone={person.tone}><span className="xp-live-operations__initials" data-tone={person.tone} aria-hidden="true">{person.initials}</span>{detailed ? <span><strong>{person.name}</strong><small>{person.role}</small></span> : <span className="xp-visually-hidden">{person.name}, {person.role}</span>}</li>)}</ul>;
}

function LiveOperationPanel({ model, compact = false, detailed = false, onAction }: { model: LiveOperationsModel; compact?: boolean; detailed?: boolean; onAction?: AppBarProperties["onAction"] }) {
  const operation = model.liveOperation;
  return <section className="xp-live-operations__operation" data-xp-live-operation="" data-live-count={operation.count} data-live-presentation={compact ? "overlay" : "persistent"}>
    <span className="xp-live-operations__eyebrow">{operation.eyebrow}</span>
    <div className="xp-live-operations__count"><strong>{operation.count}</strong><span>{operation.headline}</span></div>
    <p>{operation.detail}</p>
    <StaffCluster staff={operation.staff} detailed={detailed} />
    <button type="button" data-xp-live-rebalance="" data-action-id={operation.actionId} onClick={() => onAction?.(operation.actionId)}>{operation.actionLabel}</button>
  </section>;
}

function ChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return <a className="xp-live-operations__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a>;
}
function DestinationGlyph({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) { return <SemanticIcon keyName={destination.icon} label={destination.label} renderIcon={renderIcon} />; }
function DestinationLink({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <a className="xp-live-operations__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span>{destination.badge ? <span className="xp-shell-badge" data-badge-value={destination.badge.value} aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}</a>;
}
function DestinationBranch({ destination, activeId, renderIcon, rail }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; rail: boolean }) {
  if (rail) return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="The compact operational rail opens branch children in an anchored touch-safe menu."><AdaptiveOverlay.Trigger className="xp-live-operations__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-live-branch-trigger=""><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-branch-overlay="" data-branch-id={destination.id}><AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} view.`} /><AdaptiveOverlay.Body><ul className="xp-live-operations__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
  return <details className="xp-live-operations__branch" data-xp-nav-branch="" open={destination.children?.some(({ id }) => id === activeId)}><summary className="xp-live-operations__destination" data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span className="xp-live-operations__chevron" aria-hidden="true">⌄</span></summary><ul className="xp-live-operations__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></details>;
}

function Navigation({ nav, activeId, renderIcon, rail = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-live-operations__navigation" aria-label="Live operations navigation" data-xp-live-navigation="" data-nav-presentation={rail ? "rail" : "panel"} data-xp-scroll="">{(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-live-group-${group.id}`}><h2 id={`xp-live-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}>{destination.children?.length ? <DestinationBranch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul></section>)}</nav>;
}

function CompactNavigation({ nav, model, activeId, deviceClass, renderIcon }: { nav: NavModel; model: LiveOperationsModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore profile, search, all operational routes, and branch children in a bounded sheet."><AdaptiveOverlay.Trigger className="xp-live-operations__overlay-trigger" aria-label="Open live operations navigation" data-xp-live-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={nav.identity.label} description="Search and navigate the active shift." /><AdaptiveOverlay.Body data-xp-live-overlay-scroll="" data-xp-scroll=""><Profile model={model} expanded /><SearchField nav={nav} /><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-live-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}
function CompactLiveOperation({ model, deviceClass, onAction }: { model: LiveOperationsModel; deviceClass: "M" | "TP"; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The live workload and assigned staff stay one touch away without competing with route navigation."><AdaptiveOverlay.Trigger className="xp-live-operations__live-trigger" aria-label={`Open live workload: ${model.liveOperation.count} units`} data-xp-live-operation-trigger=""><span aria-hidden="true">{model.liveOperation.count}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-operation-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.liveOperation.headline} description={model.liveOperation.detail} /><AdaptiveOverlay.Body data-xp-live-operation-scroll="" data-xp-scroll=""><LiveOperationPanel model={model} compact detailed onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-live-operation-footer=""><AdaptiveOverlay.Close>Close workload</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}
function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  const { visible, overflow } = partitionCompactAppBarActions(actions, deviceClass);
  return <div className="xp-live-operations__compact-actions">{visible.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}<AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="A bounded command sheet preserves every operational action with a fixed close control."><AdaptiveOverlay.Trigger aria-label="More actions">•••</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-actions-overlay=""><AdaptiveOverlay.Header title="More actions" description="Shift commands." /><AdaptiveOverlay.Body data-xp-live-actions-scroll="" data-xp-scroll=""><ul>{overflow.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-live-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function RailSidebar({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: LiveOperationsModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return <><strong className="xp-live-operations__rail-mark" aria-label={nav.identity.label}>{nav.identity.shortLabel}</strong><AdaptiveOverlay intent="edit" presentation={{ TL: "popover" }} why="Search remains discoverable without widening the operational rail."><AdaptiveOverlay.Trigger className="xp-live-operations__rail-control" aria-label={`Search: ${nav.search?.placeholder ?? "operations"}`} data-xp-live-search-trigger="">⌕</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-search-overlay=""><AdaptiveOverlay.Header title="Search operations" description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} rail /><div className="xp-live-operations__rail-tools"><AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The workload chip expands to the live count, named staff, and rebalance action."><AdaptiveOverlay.Trigger className="xp-live-operations__rail-live" aria-label={`Open live workload: ${model.liveOperation.count} units`} data-xp-live-operation-trigger="">{model.liveOperation.count}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-operation-overlay=""><AdaptiveOverlay.Header title={model.liveOperation.headline} description={model.liveOperation.detail} /><AdaptiveOverlay.Body><LiveOperationPanel model={model} compact detailed onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close workload</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay><AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The shift director profile remains reachable from the rail."><AdaptiveOverlay.Trigger className="xp-live-operations__rail-profile" aria-label={`Open account for ${model.profile.name}`} data-xp-live-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-live-profile-overlay=""><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div></>;
}
function FullSidebar({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: LiveOperationsModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) { return <><div className="xp-live-operations__brand"><strong>{nav.identity.label}</strong><span>{nav.identity.shortLabel}</span></div><SearchField nav={nav} /><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} /><LiveOperationPanel model={model} onAction={onAction} /></>; }

function CommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: LiveOperationsModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  return <header className="xp-live-operations__command" data-xp-region="top">{compact ? <CompactNavigation nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : <div className="xp-live-operations__route"><span>{nav.identity.label}</span><strong>{appBar.context.title}</strong></div>}<span className="xp-live-operations__status">{appBar.context.greeting}</span>{compact ? <><CompactLiveOperation model={model} deviceClass={deviceClass} onAction={onAction} /><CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /></> : <div className="xp-live-operations__actions">{actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}<Profile model={model} /></div>}</header>;
}
function Footer({ model, renderIcon }: { model: LiveOperationsModel; renderIcon?: NavIconRenderer }) { return <footer className="xp-live-operations__footer" data-xp-live-footer="" data-xp-region="bottom"><nav aria-label="Operations resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="Station utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} data-xp-footer-utility-id={utility.id} aria-label={utility.label} title={utility.label}><SemanticIcon keyName={utility.icon} label={utility.label} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>; }

export function LiveOperationsShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: LiveOperationsModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-live-operations-shell" data-xp-shell="" data-xp-live-operations-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="live-operations" data-shell-anatomy="app.side.live-operations" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<div className="xp-live-operations__body">{!compact ? <aside className="xp-live-operations__sidebar" data-xp-nav-renderer="" data-xp-region="navigation">{deviceClass === "TL" ? <RailSidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /> : <FullSidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} />}</aside> : null}<div className="xp-live-operations__stage">{!compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<main className="xp-live-operations__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-live-operations__surface" data-xp-live-work-surface="">{children}</section></main></div></div><Footer model={model} renderIcon={renderIcon} /></div>;
}
