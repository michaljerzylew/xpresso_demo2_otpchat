"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type ContextThreeTierProfile = { name: string; email: string; role: string; avatarAlt: string };
export type ContextThreeTierLink = { id: string; label: string; href: string };
export type ContextThreeTierUtility = ContextThreeTierLink & { icon: string };
export type ContextThreeTierBreadcrumb = { id: string; label: string; href?: string };
export type ContextThreeTierAction = { id: string; label: string; icon: string; href: string; priority: "primary" | "secondary" };
export type ContextThreeTierModel = {
  profile: ContextThreeTierProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  breadcrumb: readonly ContextThreeTierBreadcrumb[];
  contextActions: readonly ContextThreeTierAction[];
  footerLinks: readonly ContextThreeTierLink[];
  footerUtilities: readonly ContextThreeTierUtility[];
};

export type ContextThreeTierReachability = {
  id: string;
  kind: "destination" | "app-action" | "context-action" | "footer-link" | "footer-utility";
  surface: "brand-tier" | "destination-tier" | "compact-sheet" | "context-strip" | "footer";
};

export function contextThreeTierReachability(nav: NavModel, appBar: AppBarModel, model: ContextThreeTierModel, deviceClass: DeviceClass): ContextThreeTierReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "destination-tier" as const })),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: "brand-tier" as const })),
    ...model.contextActions.map(({ id }) => ({ id, kind: "context-action" as const, surface: "context-strip" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, kind: "footer-link" as const, surface: "footer" as const })),
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function IconByKey({ id, label, icon, renderIcon }: { id: string; label: string; icon: string; renderIcon?: NavIconRenderer }) {
  return <SemanticIcon destination={{ id, label, icon, href: `#${id}`, priority: 0 }} renderIcon={renderIcon} />;
}

function Profile({ model, expanded = false }: { model: ContextThreeTierModel; expanded?: boolean }) {
  return <section className="xp-context-three-tier__profile" data-xp-context-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
    <picture><source srcSet={model.avatarSrcSet} type="image/webp" /><img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={expanded ? "56px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-context-avatar="" /></picture>
    {expanded ? <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div> : null}
  </section>;
}

function ProfileControl({ model, deviceClass }: { model: ContextThreeTierModel; deviceClass: DeviceClass }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The operator profile remains a separate account surface in every class.">
    <AdaptiveOverlay.Trigger className="xp-context-three-tier__profile-trigger" aria-label={`Open profile for ${model.profile.name}`} data-xp-context-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-context-profile-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><Profile model={model} expanded /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close profile</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function CompactNavigation({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes relocate all six service destinations into one bounded, touch-native navigation sheet.">
    <AdaptiveOverlay.Trigger className="xp-context-three-tier__menu-trigger" aria-label="Open service navigation" data-xp-context-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-context-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title={nav.identity.label} description="Choose a service destination." />
      <AdaptiveOverlay.Body data-xp-context-overlay-scroll="" data-xp-scroll="">
        <nav className="xp-context-three-tier__sheet-navigation" aria-label="Service destinations" data-xp-context-navigation="">
          {(nav.groups ?? []).map((group) => <section key={group.id} aria-labelledby={`xp-context-group-${group.id}`}><h2 id={`xp-context-group-${group.id}`}>{group.label}</h2><ul>{group.destinationIds.map((id) => byId.get(id)).filter((destination): destination is NavDestination => Boolean(destination)).map((destination) => <li key={destination.id}><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a></li>)}</ul></section>)}
        </nav>
      </AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer data-xp-context-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function SearchForm({ nav, actionId, compact = false }: { nav: NavModel; actionId: string; compact?: boolean }) {
  if (!nav.search) return null;
  const id = compact ? "xp-context-compact-search" : "xp-context-search";
  return <form className="xp-context-three-tier__search" role="search" data-xp-context-search="" onSubmit={(event) => event.preventDefault()}>
    <label htmlFor={id}>{nav.search.label}</label>
    <div><span aria-hidden="true">⌕</span><input id={id} type="search" placeholder={nav.search.placeholder} enterKeyHint="search" /><button type="submit" data-action-id={compact ? undefined : actionId} aria-label="Search records">Search</button></div>
  </form>;
}

function CompactSearch({ nav, actionId, deviceClass }: { nav: NavModel; actionId: string; deviceClass: "M" | "TP" }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact search is a focused touch surface while remaining an explicit first-rank action.">
    <AdaptiveOverlay.Trigger className="xp-context-three-tier__compact-control" aria-label="Search records" data-action-id={actionId} data-xp-context-search-trigger="">⌕</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-context-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Find record" description="Search units or service requests." /><AdaptiveOverlay.Body><SearchForm nav={nav} actionId={actionId} compact /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function CompactActions({ actions, deviceClass, renderActionIcon, onAction }: { actions: NonNullable<AppBarModel["actions"]>; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The remaining account actions use a bounded overflow with a persistent close control.">
    <AdaptiveOverlay.Trigger className="xp-context-three-tier__compact-control" aria-label="More actions">•••</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content data-xp-context-actions-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Account actions" description="Region, system health, and notice controls." /><AdaptiveOverlay.Body data-xp-context-actions-scroll="" data-xp-scroll=""><ul>{actions.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-context-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function BrandTier({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: ContextThreeTierModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const orderedActions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  const searchAction = orderedActions.find(({ icon }) => icon === "search") ?? orderedActions[0];
  const otherActions = orderedActions.filter(({ id }) => id !== searchAction?.id);
  return <header className="xp-context-three-tier__brand-tier" data-xp-context-brand-tier="" data-xp-command-rank="" data-xp-region="top">
    {compact ? <CompactNavigation nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    <a className="xp-context-three-tier__identity" href="#xp-shell-content" aria-label={nav.identity.label}><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a>
    {compact && searchAction ? <CompactSearch nav={nav} actionId={searchAction.id} deviceClass={deviceClass} /> : searchAction ? <SearchForm nav={nav} actionId={searchAction.id} /> : null}
    {compact ? <CompactActions actions={otherActions} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-context-three-tier__app-actions">{otherActions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}
    <ProfileControl model={model} deviceClass={deviceClass} />
  </header>;
}

function DestinationTier({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <div className="xp-context-three-tier__destination-tier" data-xp-context-destination-tier="" data-xp-destination-rank="" data-xp-region="navigation"><nav aria-label="Service destinations" data-xp-context-navigation="" data-xp-nav-renderer=""><ul>{destinationsByPriority(nav).map((destination) => <li key={destination.id}><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><SemanticIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a></li>)}</ul></nav></div>;
}

function ContextStrip({ model, renderIcon }: { model: ContextThreeTierModel; renderIcon?: NavIconRenderer }) {
  return <section className="xp-context-three-tier__context-strip" data-xp-context-strip="" data-xp-context-rank="">
    <nav aria-label="Request breadcrumb"><ol>{model.breadcrumb.map((item, index) => <li key={item.id}>{item.href ? <a href={item.href} data-xp-context-breadcrumb-id={item.id}>{item.label}</a> : <span data-xp-context-breadcrumb-id={item.id} aria-current={index === model.breadcrumb.length - 1 ? "page" : undefined}>{item.label}</span>}</li>)}</ol></nav>
    <div className="xp-context-three-tier__context-actions">{model.contextActions.map((action) => <a key={action.id} href={action.href} data-xp-context-action-id={action.id} data-action-id={action.id} data-action-kind={action.priority}><IconByKey id={action.id} label={action.label} icon={action.icon} renderIcon={renderIcon} /><span>{action.label}</span></a>)}</div>
  </section>;
}

function WorkSurface({ appBar, children }: { appBar: AppBarModel; children: ReactNode }) {
  return <section className="xp-context-three-tier__work-surface" data-xp-context-work-surface=""><header><span>{appBar.context.greeting}</span><h1>{appBar.context.title}</h1></header><div>{children}</div></section>;
}

function Footer({ model, renderIcon }: { model: ContextThreeTierModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-context-three-tier__footer" data-xp-context-footer="" data-xp-region="bottom"><nav aria-label="Equipment resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="Depot utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} aria-label={utility.label} title={utility.label} data-xp-footer-utility-id={utility.id}><IconByKey id={utility.id} label={utility.label} icon={utility.icon} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>;
}

export function ContextThreeTierShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: ContextThreeTierModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-context-three-tier-shell" data-xp-shell="" data-xp-context-three-tier-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="context-three-tier" data-shell-anatomy="app.top.context-three-tier" data-skin="plain" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><BrandTier nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} />{compact ? null : <DestinationTier nav={nav} activeId={activeId} renderIcon={renderIcon} />}<ContextStrip model={model} renderIcon={renderIcon} /><main id="xp-shell-content" tabIndex={-1} className="xp-context-three-tier__main xp-slot" data-xp-region="content"><WorkSurface appBar={appBar}>{children}</WorkSurface></main><Footer model={model} renderIcon={renderIcon} /></div>;
}
