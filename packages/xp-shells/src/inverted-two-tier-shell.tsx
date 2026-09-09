"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type InvertedTwoTierProfile = { name: string; email: string; role: string; avatarAlt: string };
export type InvertedTwoTierLink = { id: string; label: string; href: string };
export type InvertedTwoTierUtility = InvertedTwoTierLink & { icon: string };
export type InvertedTwoTierModel = {
  profile: InvertedTwoTierProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  priorityAction: { id: string; label: string; href: string };
  footerLinks: readonly InvertedTwoTierLink[];
  footerUtilities: readonly InvertedTwoTierUtility[];
};

export type InvertedTwoTierReachability = {
  id: string;
  kind: "destination" | "app-action" | "priority-action" | "route-action" | "footer-link" | "footer-utility";
  surface: "brand-tier" | "destination-tier" | "compact-sheet" | "work-surface" | "footer";
};

export function invertedTwoTierReachability(nav: NavModel, appBar: AppBarModel, model: InvertedTwoTierModel, deviceClass: DeviceClass): InvertedTwoTierReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination) => [
      { id: destination.id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "destination-tier" as const },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "destination-tier" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: compact ? "compact-sheet" as const : "brand-tier" as const })),
    { id: model.priorityAction.id, kind: "priority-action" as const, surface: "destination-tier" as const },
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function UtilityIcon({ utility, renderIcon }: { utility: InvertedTwoTierUtility; renderIcon?: NavIconRenderer }) {
  return <SemanticIcon destination={{ id: utility.id, label: utility.label, href: utility.href, icon: utility.icon, priority: 0 }} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: InvertedTwoTierModel; expanded?: boolean }) {
  return <section className="xp-inverted-two-tier__profile" data-xp-inverted-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-inverted-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function Search({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return <form className="xp-inverted-two-tier__search" role="search" data-xp-inverted-search="" onSubmit={(event) => event.preventDefault()}>
    <label htmlFor="xp-inverted-two-tier-search">{nav.search.label}</label>
    <div><span aria-hidden="true">⌕</span><input id="xp-inverted-two-tier-search" type="search" placeholder={nav.search.placeholder} enterKeyHint="search" /><button type="submit" aria-label="Search assignments" data-xp-search-action="">Search</button></div>
  </form>;
}

function ChildLinks({ destination, activeId }: { destination: NavDestination; activeId: string }) {
  return <ul className="xp-inverted-two-tier__children">{destination.children?.map((child) => <li key={child.id}><a href={child.href} data-nav-id={child.id} data-parent-nav-id={destination.id} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a></li>)}</ul>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore the complete destination tree in a bounded sheet while the priority action remains on the white tier.">
    <AdaptiveOverlay.Trigger className="xp-inverted-two-tier__menu-trigger" aria-label="Open assignment navigation" data-xp-inverted-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-inverted-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title={nav.identity.label} description="Choose an assignment destination." />
      <AdaptiveOverlay.Body data-xp-inverted-overlay-scroll="" data-xp-scroll="">
        <nav className="xp-inverted-two-tier__sheet-navigation" aria-label="Assignment destinations" data-xp-inverted-navigation="">
          {(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-inverted-group-${group.id}`}><h2 id={`xp-inverted-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((destination): destination is NavDestination => Boolean(destination)).map((destination) => <li key={destination.id}>{destination.children?.length ? <details data-xp-nav-branch=""><summary data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></summary><ChildLinks destination={destination} activeId={activeId} /></details> : <a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></section>)}
        </nav>
      </AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer data-xp-inverted-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BranchMenu({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu">
    <AdaptiveOverlay.Trigger className="xp-inverted-two-tier__destination" aria-label={`Open ${destination.label} destinations`} data-nav-id={destination.id} data-xp-inverted-branch-trigger="" data-xp-nav-branch="" aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span aria-hidden="true">⌄</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-inverted-branch-overlay="" data-branch-id={destination.id}><AdaptiveOverlay.Header title={destination.label} description={`Choose a route in ${destination.label}.`} /><AdaptiveOverlay.Body><ChildLinks destination={destination} activeId={activeId} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function DestinationTier({ nav, model, activeId, compact, renderIcon }: { nav: NavModel; model: InvertedTwoTierModel; activeId: string; compact: boolean; renderIcon?: NavIconRenderer }) {
  return <div className="xp-inverted-two-tier__destination-tier" data-xp-inverted-destination-tier="" data-xp-destination-rank="" data-xp-region="navigation">
    {!compact ? <nav aria-label="Primary" data-xp-inverted-navigation="" data-xp-nav-renderer=""><ul>{destinationsByPriority(nav).map((destination) => <li key={destination.id}>{destination.children?.length ? <BranchMenu destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <a className="xp-inverted-two-tier__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></nav> : <span className="xp-inverted-two-tier__compact-context">Assignment routing</span>}
    <a className="xp-inverted-two-tier__priority-action" href={model.priorityAction.href} data-xp-priority-action="" data-action-id={model.priorityAction.id}>{model.priorityAction.label}</a>
  </div>;
}

function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="All four account actions remain reachable in a bounded sheet with a persistent close control.">
    <AdaptiveOverlay.Trigger className="xp-inverted-two-tier__compact-control" aria-label="More actions">•••</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-inverted-actions-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Account actions" description="Search, region, activity, and alert controls." /><AdaptiveOverlay.Body data-xp-inverted-actions-scroll="" data-xp-scroll=""><ul>{[...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority).map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-inverted-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function ProfileControl({ model, deviceClass }: { model: InvertedTwoTierModel; deviceClass: DeviceClass }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The separate operator account remains inspectable without duplicating destination navigation.">
    <AdaptiveOverlay.Trigger className="xp-inverted-two-tier__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-inverted-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-inverted-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BrandTier({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: InvertedTwoTierModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <header className="xp-inverted-two-tier__brand-tier" data-xp-inverted-brand-tier="" data-xp-command-rank="" data-xp-region="top">
    {compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    <a className="xp-inverted-two-tier__identity" href="#xp-shell-content" aria-label={nav.identity.label}><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a>
    <Search nav={nav} />
    {compact ? <CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-inverted-two-tier__app-actions">{[...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority).map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}
    <ProfileControl model={model} deviceClass={deviceClass} />
  </header>;
}

function WorkSurface({ appBar, nav, children, onAction }: { appBar: AppBarModel; nav: NavModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-inverted-two-tier__work-surface" data-xp-inverted-work-surface=""><nav aria-label="Breadcrumb"><ol>{(appBar.context.breadcrumb ?? []).map((item) => <li key={item.id}><a href={item.href} data-xp-breadcrumb-id={item.id}>{item.label}</a></li>)}</ol></nav><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div>{children}</div></section>;
}

function Footer({ model, renderIcon }: { model: InvertedTwoTierModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-inverted-two-tier__footer" data-xp-inverted-footer="" data-xp-region="bottom"><nav aria-label="Placement resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="Placement utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} aria-label={utility.label} title={utility.label} data-xp-footer-utility-id={utility.id}><UtilityIcon utility={utility} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>;
}

export function InvertedTwoTierShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: InvertedTwoTierModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-inverted-two-tier-shell" data-xp-shell="" data-xp-inverted-two-tier-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="contrast-two-tier" data-shell-anatomy="app.top.inverted-two-tier" data-skin="canvas" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><BrandTier nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /><DestinationTier nav={nav} model={model} activeId={activeId} compact={compact} renderIcon={renderIcon} /><main id="xp-shell-content" tabIndex={-1} className="xp-inverted-two-tier__main xp-slot" data-xp-region="content"><WorkSurface appBar={appBar} nav={nav} onAction={onAction}>{children}</WorkSurface></main><Footer model={model} renderIcon={renderIcon} /></div>;
}
