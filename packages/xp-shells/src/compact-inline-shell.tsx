"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type CompactInlineProfile = { name: string; email: string; role: string; avatarAlt: string };
export type CompactInlineUtility = { id: string; label: string; icon: string; href: string };
export type CompactInlineModel = {
  profile: CompactInlineProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  footerUtilities: readonly CompactInlineUtility[];
};

export type CompactInlineReachability = {
  id: string;
  kind: "destination" | "app-action" | "route-action" | "footer-utility";
  surface: "compact-sheet" | "compact-rank" | "work-surface" | "footer";
};

export function compactInlineReachability(nav: NavModel, appBar: AppBarModel, model: CompactInlineModel, deviceClass: DeviceClass): CompactInlineReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination) => [
      { id: destination.id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "compact-rank" as const },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "compact-rank" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: compact ? "compact-sheet" as const : "compact-rank" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function UtilityIcon({ utility, renderIcon }: { utility: CompactInlineUtility; renderIcon?: NavIconRenderer }) {
  return <SemanticIcon destination={{ id: utility.id, label: utility.label, href: utility.href, icon: utility.icon, priority: 0 }} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: CompactInlineModel; expanded?: boolean }) {
  return <section className="xp-compact-inline__profile" data-xp-compact-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "36px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-compact-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : <strong>{model.profile.name}</strong>}
  </section>;
}

function ChildLinks({ destination, activeId }: { destination: NavDestination; activeId: string }) {
  return <ul className="xp-compact-inline__children">{destination.children?.map((child) => <li key={child.id}><a href={child.href} data-nav-id={child.id} data-parent-nav-id={destination.id} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a></li>)}</ul>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore the complete inline destination tree in one bounded touch-native sheet.">
    <AdaptiveOverlay.Trigger className="xp-compact-inline__control" aria-label="Open navigation" data-xp-compact-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-compact-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title={nav.identity.label} description="Choose a register destination." />
      <AdaptiveOverlay.Body data-xp-compact-overlay-scroll="" data-xp-scroll="">
        <nav className="xp-compact-inline__sheet-navigation" aria-label="Register destinations">
          {(nav.groups ?? [{ id: "primary", label: "Destinations", destinationIds: destinations.map(({ id }) => id) }]).map((group) => <section key={group.id} aria-labelledby={`xp-compact-group-${group.id}`}><h2 id={`xp-compact-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((destination): destination is NavDestination => Boolean(destination)).map((destination) => <li key={destination.id}>{destination.children?.length ? <details data-xp-nav-branch=""><summary data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></summary><ChildLinks destination={destination} activeId={activeId} /></details> : <a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></section>)}
        </nav>
      </AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer data-xp-compact-overlay-footer="" data-compact-sheet-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BranchMenu({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu">
    <AdaptiveOverlay.Trigger className="xp-compact-inline__destination" aria-label={`Open ${destination.label} destinations`} data-nav-id={destination.id} data-xp-compact-branch-trigger="" data-xp-nav-branch="" aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span aria-hidden="true">⌄</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-compact-branch-overlay="" data-branch-id={destination.id}><AdaptiveOverlay.Header title={destination.label} description={`Choose a route in ${destination.label}.`} /><AdaptiveOverlay.Body><ChildLinks destination={destination} activeId={activeId} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function InlineNavigation({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-compact-inline__navigation" aria-label="Primary" data-xp-compact-navigation="" data-xp-nav-renderer=""><ul>{destinationsByPriority(nav).map((destination) => <li key={destination.id}>{destination.children?.length ? <BranchMenu destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <a className="xp-compact-inline__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></nav>;
}

function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The four account utilities remain reachable without competing with the compact identity row.">
    <AdaptiveOverlay.Trigger className="xp-compact-inline__control" aria-label="More actions">•••</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-compact-actions-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Account utilities" description="Language, activity, notifications, and account commands." /><AdaptiveOverlay.Body data-xp-compact-actions-scroll="" data-xp-scroll=""><ul>{[...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority).map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-compact-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function ProfileOverlay({ model, compact }: { model: CompactInlineModel; compact: boolean }) {
  return <AdaptiveOverlay intent="inspect" presentation={compact ? { M: "action-sheet", TP: "action-sheet" } : undefined} why="The Talin identity chip opens complete profile metadata without duplicating account actions.">
    <AdaptiveOverlay.Trigger className="xp-compact-inline__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-compact-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-compact-profile-overlay=""><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function CompactRank({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: CompactInlineModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <header className="xp-compact-inline__rank" data-xp-compact-rank="" data-xp-region="top">
    {compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    <a className="xp-compact-inline__identity" href="#xp-shell-content" aria-label={nav.identity.label}><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a>
    {!compact ? <InlineNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} /> : <span className="xp-compact-inline__workspace">{nav.identity.label}</span>}
    {!compact ? <div className="xp-compact-inline__actions">{[...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority).map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div> : <CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} />}
    <ProfileOverlay model={model} compact={compact} />
  </header>;
}

function WorkSurface({ nav, appBar, children, onAction }: { nav: NavModel; appBar: AppBarModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-compact-inline__work-surface" data-xp-compact-work-surface=""><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div className="xp-compact-inline__work-content">{children}</div></section>;
}

function Footer({ model, renderIcon }: { model: CompactInlineModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-compact-inline__footer" data-xp-compact-footer="" data-xp-region="bottom"><nav aria-label="Register utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} aria-label={utility.label} title={utility.label} data-xp-footer-utility-id={utility.id}><UtilityIcon utility={utility} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>;
}

export function CompactInlineShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: CompactInlineModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  return <div className="xp-app-shell xp-compact-inline-shell" data-xp-shell="" data-xp-compact-inline-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="compact-inline" data-shell-anatomy="app.top.compact" data-skin="plain" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><CompactRank nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /><main id="xp-shell-content" tabIndex={-1} className="xp-compact-inline__main xp-slot" data-xp-region="content"><WorkSurface nav={nav} appBar={appBar} onAction={onAction}>{children}</WorkSurface></main><Footer model={model} renderIcon={renderIcon} /></div>;
}
