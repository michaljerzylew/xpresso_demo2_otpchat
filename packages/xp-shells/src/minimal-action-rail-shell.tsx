"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type MinimalActionRailProfile = { name: string; email: string; role: string; avatarAlt: string };
export type MinimalActionRailLink = { id: string; label: string; href: string };
export type MinimalActionRailPriorityAction = MinimalActionRailLink & { icon: string };
export type MinimalActionRailModel = {
  profile: MinimalActionRailProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  priorityAction: MinimalActionRailPriorityAction;
  footerLinks: readonly MinimalActionRailLink[];
};

export function minimalActionRailReachability(nav: NavModel, appBar: AppBarModel, model: MinimalActionRailModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "minimal-rail" as const })),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: "command-bar" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    { id: model.priorityAction.id, kind: "priority-action" as const, surface: compact ? "compact-command" as const : "minimal-rail" as const },
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function PriorityIcon({ model, renderIcon }: { model: MinimalActionRailModel; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { ...model.priorityAction, priority: 0 };
  return <Icon destination={destination} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: MinimalActionRailModel; expanded?: boolean }) {
  return <section className="xp-minimal-rail__profile" data-xp-minimal-rail-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-minimal-rail-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function SearchField({ nav, actionId }: { nav: NavModel; actionId?: string }) {
  if (!nav.search) return null;
  return <label className="xp-minimal-rail__search" data-xp-minimal-rail-search=""><span>{nav.search.label}</span><span><span aria-hidden="true">⌕</span><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" /><button type="button" aria-label="Search routes" data-action-id={actionId}>Search</button></span></label>;
}

function Navigation({ nav, activeId, renderIcon, compact = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; compact?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-minimal-rail__navigation" aria-label="Territory navigation" data-xp-minimal-rail-navigation="" data-rail-presentation={compact ? "sheet" : "minimal"} data-xp-scroll="">
    {(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-minimal-rail-group-${group.id}`}><h2 id={`xp-minimal-rail-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label} title={compact ? undefined : destination.label}><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a></li>)}</ul></section>)}
  </nav>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore all twelve grouped rail destinations in one bounded touch surface."><AdaptiveOverlay.Trigger className="xp-minimal-rail__control" aria-label="Open territory navigation" data-xp-minimal-rail-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-minimal-rail-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={nav.identity.label} description="Choose a territory destination." /><AdaptiveOverlay.Body data-xp-minimal-rail-overlay-scroll="" data-xp-scroll=""><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} compact /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-minimal-rail-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactSearch({ nav, deviceClass, actionId }: { nav: NavModel; deviceClass: "M" | "TP"; actionId?: string }) {
  return <AdaptiveOverlay intent="edit" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Search remains a complete focused touch surface."><AdaptiveOverlay.Trigger className="xp-minimal-rail__control" aria-label="Open route search" data-action-id={actionId} data-xp-minimal-rail-search-trigger="">⌕</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-minimal-rail-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Search routes" description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactActions({ actions, deviceClass, renderActionIcon, onAction }: { actions: NonNullable<AppBarModel["actions"]>; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The remaining command actions stay reachable with a persistent close control."><AdaptiveOverlay.Trigger className="xp-minimal-rail__control" aria-label="More actions">•••</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-minimal-rail-actions-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Field actions" description="Language, network, and alert controls." /><AdaptiveOverlay.Body data-xp-minimal-rail-actions-scroll="" data-xp-scroll=""><ul>{actions.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-minimal-rail-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function ProfileOverlay({ model, deviceClass }: { model: MinimalActionRailModel; deviceClass: DeviceClass }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The operator identity stays separate from navigation and application actions."><AdaptiveOverlay.Trigger className="xp-minimal-rail__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-minimal-rail-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-minimal-rail-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CommandBar({ nav, appBar, model, deviceClass, activeId, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: MinimalActionRailModel; deviceClass: DeviceClass; activeId: string; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const sorted = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  const searchAction = sorted.find(({ icon }) => icon === "search");
  const otherActions = sorted.filter(({ id }) => id !== searchAction?.id);
  return <header className="xp-minimal-rail__command" data-xp-region="top" data-xp-minimal-rail-command=""><div className="xp-minimal-rail__command-row">{compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : <SearchField nav={nav} actionId={searchAction?.actionId ?? searchAction?.id} />}<div className="xp-minimal-rail__identity"><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></div>{compact ? <CompactSearch nav={nav} deviceClass={deviceClass} actionId={searchAction?.actionId ?? searchAction?.id} /> : null}{compact ? <CompactActions actions={otherActions} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-minimal-rail__actions">{otherActions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}<ProfileOverlay model={model} deviceClass={deviceClass} /></div>{compact ? <a className="xp-minimal-rail__compact-priority" href={model.priorityAction.href} data-action-id={model.priorityAction.id} data-xp-minimal-rail-priority-action=""><PriorityIcon model={model} renderIcon={renderIcon} /><span>{model.priorityAction.label}</span></a> : null}</header>;
}

function Rail({ nav, model, activeId, renderIcon }: { nav: NavModel; model: MinimalActionRailModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <aside className="xp-minimal-rail__rail" data-xp-nav-renderer="" data-xp-region="navigation"><strong className="xp-minimal-rail__mark" aria-label={nav.identity.label}>{nav.identity.shortLabel}</strong><Navigation nav={nav} activeId={activeId} renderIcon={renderIcon} /><a className="xp-minimal-rail__rail-priority" href={model.priorityAction.href} data-action-id={model.priorityAction.id} data-xp-minimal-rail-priority-action="" aria-label={model.priorityAction.label} title={model.priorityAction.label}><PriorityIcon model={model} renderIcon={renderIcon} /><span>{model.priorityAction.label}</span></a></aside>;
}

function WorkSurface({ nav, appBar, children, onAction }: { nav: NavModel; appBar: AppBarModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-minimal-rail__work-surface" data-xp-minimal-rail-work-surface=""><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div className="xp-minimal-rail__work-content">{children}</div></section>;
}

function Footer({ model }: { model: MinimalActionRailModel }) {
  return <footer className="xp-minimal-rail__footer" data-xp-minimal-rail-footer="" data-xp-region="bottom"><nav aria-label="Field resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav></footer>;
}

export function MinimalActionRailShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: MinimalActionRailModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-minimal-action-rail-shell" data-xp-shell="" data-xp-minimal-action-rail-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="minimal-rail" data-shell-anatomy="app.rail.minimal-action" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><div className="xp-minimal-rail__body">{compact ? null : <Rail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} />}<div className="xp-minimal-rail__stage"><CommandBar nav={nav} appBar={appBar} model={model} deviceClass={deviceClass} activeId={activeId} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /><main id="xp-shell-content" tabIndex={-1} className="xp-minimal-rail__main xp-slot" data-xp-region="content"><WorkSurface nav={nav} appBar={appBar} onAction={onAction}>{children}</WorkSurface></main></div></div><Footer model={model} /></div>;
}
