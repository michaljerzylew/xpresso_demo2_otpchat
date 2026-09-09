"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type BrandTwoTierProfile = { name: string; email: string; role: string; avatarAlt: string };
export type BrandTwoTierLink = { id: string; label: string; href: string };
export type BrandTwoTierUtility = BrandTwoTierLink & { icon: string };
export type BrandTwoTierModel = {
  profile: BrandTwoTierProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  searchActionLabel: string;
  footerLinks: readonly BrandTwoTierLink[];
  footerUtilities: readonly BrandTwoTierUtility[];
};

export type BrandTwoTierReachability = {
  id: string;
  kind: "destination" | "app-action" | "route-action" | "footer-link" | "footer-utility";
  surface: "brand-tier" | "destination-tier" | "compact-sheet" | "work-surface" | "footer";
};

export function brandTwoTierReachability(nav: NavModel, appBar: AppBarModel, model: BrandTwoTierModel, deviceClass: DeviceClass): BrandTwoTierReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination) => [
      { id: destination.id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "destination-tier" as const },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "destination-tier" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: compact ? "compact-sheet" as const : "brand-tier" as const })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "route-action" as const, surface: "work-surface" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function UtilityIcon({ utility, renderIcon }: { utility: BrandTwoTierUtility; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: utility.id, label: utility.label, href: utility.href, icon: utility.icon, priority: 0 };
  return <SemanticIcon destination={destination} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: BrandTwoTierModel; expanded?: boolean }) {
  return <section className="xp-brand-two-tier__profile" data-xp-brand-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-brand-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function Search({ nav, model }: { nav: NavModel; model: BrandTwoTierModel }) {
  if (!nav.search) return null;
  return <form className="xp-brand-two-tier__search" role="search" data-xp-brand-search="" onSubmit={(event) => event.preventDefault()}>
    <label htmlFor="xp-brand-two-tier-search">{nav.search.label}</label>
    <div><input id="xp-brand-two-tier-search" type="search" placeholder={nav.search.placeholder} enterKeyHint="search" /><button type="submit" aria-label={model.searchActionLabel} data-xp-search-action="">⌕<span>{model.searchActionLabel}</span></button></div>
  </form>;
}

function ChildLinks({ destination, activeId }: { destination: NavDestination; activeId: string }) {
  return <ul className="xp-brand-two-tier__children">{destination.children?.map((child) => <li key={child.id}><a href={child.href} data-nav-id={child.id} data-parent-nav-id={destination.id} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a></li>)}</ul>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore the complete two-tier destination tree in one bounded touch-native sheet.">
    <AdaptiveOverlay.Trigger className="xp-brand-two-tier__compact-control" aria-label="Open program navigation" data-xp-brand-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-brand-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title={nav.identity.label} description="Choose a program destination." />
      <AdaptiveOverlay.Body data-xp-brand-overlay-scroll="" data-xp-scroll="">
        <nav className="xp-brand-two-tier__sheet-navigation" aria-label="Program destinations">
          {(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-brand-group-${group.id}`}><h2 id={`xp-brand-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((destination): destination is NavDestination => Boolean(destination)).map((destination) => <li key={destination.id}>{destination.children?.length ? <details data-xp-nav-branch=""><summary data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></summary><ChildLinks destination={destination} activeId={activeId} /></details> : <a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></section>)}
        </nav>
      </AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer data-xp-brand-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BranchMenu({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu">
    <AdaptiveOverlay.Trigger className="xp-brand-two-tier__destination" aria-label={`Open ${destination.label} destinations`} data-nav-id={destination.id} data-xp-brand-branch-trigger="" data-xp-nav-branch="" aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span aria-hidden="true">⌄</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-brand-branch-overlay="" data-branch-id={destination.id}>
      <AdaptiveOverlay.Header title={destination.label} description={`Choose a route in ${destination.label}.`} />
      <AdaptiveOverlay.Body><ChildLinks destination={destination} activeId={activeId} /></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function DestinationTier({ nav, model, activeId, renderIcon, compact }: { nav: NavModel; model: BrandTwoTierModel; activeId: string; renderIcon?: NavIconRenderer; compact: boolean }) {
  const destinations = destinationsByPriority(nav);
  return <div className="xp-brand-two-tier__destination-tier" data-xp-destination-search-tier="" data-xp-destination-rank="" data-xp-region="navigation">
    {!compact ? <nav aria-label="Primary" data-xp-brand-navigation="" data-xp-nav-renderer=""><ul>{destinations.map((destination) => <li key={destination.id}>{destination.children?.length ? <BranchMenu destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <a className="xp-brand-two-tier__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>}</li>)}</ul></nav> : null}
    <Search nav={nav} model={model} />
  </div>;
}

function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="All account commands remain reachable in one bounded action sheet with a persistent close control.">
    <AdaptiveOverlay.Trigger className="xp-brand-two-tier__compact-control" aria-label="More actions">•••</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-brand-actions-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title="Account actions" description="Program, notice, and facilitator commands." />
      <AdaptiveOverlay.Body data-xp-brand-actions-scroll="" data-xp-scroll=""><ul>{actions.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer data-xp-brand-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function CompactProfile({ model, deviceClass }: { model: BrandTwoTierModel; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The account profile remains independently inspectable without duplicating navigation.">
    <AdaptiveOverlay.Trigger className="xp-brand-two-tier__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-brand-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-brand-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BrandTier({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: BrandTwoTierModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <header className="xp-brand-two-tier__brand-tier" data-xp-brand-tier="" data-xp-command-rank="" data-xp-region="top">
    {compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    <a className="xp-brand-two-tier__identity" href="#xp-shell-content" aria-label={nav.identity.label}><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a>
    {compact ? <CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-brand-two-tier__app-actions">{[...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority).map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}
    {compact ? <CompactProfile model={model} deviceClass={deviceClass} /> : <Profile model={model} expanded />}
  </header>;
}

function WorkSurface({ nav, appBar, children, onAction }: { nav: NavModel; appBar: AppBarModel; children: ReactNode; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-brand-two-tier__work-surface" data-xp-brand-work-surface=""><header><div><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></div><div>{(nav.actions ?? []).map((action) => <button key={action.id} type="button" data-action-id={action.actionId ?? action.id} data-action-kind={action.kind} onClick={() => onAction?.(action.actionId ?? action.id)}>{action.label}</button>)}</div></header><div>{children}</div></section>;
}

function Footer({ model, renderIcon }: { model: BrandTwoTierModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-brand-two-tier__footer" data-xp-brand-footer="" data-xp-region="bottom"><nav aria-label="Program resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="Program utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} aria-label={utility.label} title={utility.label} data-xp-footer-utility-id={utility.id}><UtilityIcon utility={utility} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>;
}

export function BrandTwoTierShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: BrandTwoTierModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-brand-two-tier-shell" data-xp-shell="" data-xp-brand-two-tier-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="brand-two-tier" data-shell-anatomy="app.top.brand-two-tier" data-skin="canvas" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><BrandTier nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /><DestinationTier nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} compact={compact} /><main id="xp-shell-content" tabIndex={-1} className="xp-brand-two-tier__main xp-slot" data-xp-region="content"><WorkSurface nav={nav} appBar={appBar} onAction={onAction}>{children}</WorkSurface></main><Footer model={model} renderIcon={renderIcon} /></div>;
}
