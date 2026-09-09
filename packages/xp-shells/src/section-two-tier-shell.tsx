"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import type { NavDestination, NavIconRenderer, NavModel, NavUtility } from "./nav-model";

export type SectionTwoTierProfile = {
  name: string;
  email: string;
  role: string;
  avatarAlt: string;
};

export type SectionTwoTierModel = {
  profile: SectionTwoTierProfile;
  searchActionLabel: string;
};

export type SectionTwoTierReachability = {
  id: string;
  rank: "primary" | "context" | "utility" | "account" | "search";
  surface: "top-rank" | "context-rank" | "bottom-tabs" | "context-sheet" | "search-takeover";
};

function splitRanks(nav: NavModel) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  const [primaryGroup, contextGroup] = nav.groups ?? [];
  return {
    primaryGroup,
    contextGroup,
    primary: (primaryGroup?.destinationIds ?? []).map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)),
    context: (contextGroup?.destinationIds ?? []).map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)),
  };
}

export function sectionTwoTierReachability(nav: NavModel, deviceClass: DeviceClass): SectionTwoTierReachability[] {
  const { primary, context } = splitRanks(nav);
  const compact = deviceClass === "M";
  return [
    ...primary.map(({ id }) => ({ id, rank: "primary" as const, surface: compact ? "bottom-tabs" as const : "top-rank" as const })),
    ...context.map(({ id }) => ({ id, rank: "context" as const, surface: compact ? "context-sheet" as const : "context-rank" as const })),
    ...(nav.utility ?? []).map(({ id }) => ({ id, rank: "utility" as const, surface: "top-rank" as const })),
    { id: "account", rank: "account", surface: "top-rank" },
    { id: "search", rank: "search", surface: compact ? "search-takeover" : "context-rank" },
  ];
}

function Glyph({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-section-two-tier__glyph" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function DestinationLink({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return <a className="xp-section-two-tier__destination" href={destination.href} data-nav-id={destination.id} data-nav-rank={tab ? "primary" : undefined} data-xp-section-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}><Glyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></a>;
}

function Identity({ nav }: { nav: NavModel }) {
  return <a className="xp-section-two-tier__identity" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-section-identity=""><span>{nav.identity.shortLabel}</span><strong>{nav.identity.label}</strong></a>;
}

function Notification({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: utility.id, label: utility.label, href: utility.href ?? "#notices", icon: utility.icon, priority: 0 };
  return <a className="xp-section-two-tier__icon-control" href={utility.href ?? "#notices"} aria-label={`${utility.label}, ${utility.badge?.label ?? "no unread notices"}`} data-utility-id={utility.id} data-xp-section-notification=""><Glyph destination={destination} renderIcon={renderIcon} />{utility.badge ? <span className="xp-section-two-tier__badge" aria-label={`${utility.badge.label}: ${utility.badge.value}`} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}</a>;
}

function Account({ model, deviceClass }: { model: SectionTwoTierModel; deviceClass: DeviceClass }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The signed-in field profile remains a separate account surface on every class."><AdaptiveOverlay.Trigger className="xp-section-two-tier__account" aria-label={`Open account for ${model.profile.name}`} data-xp-section-account-trigger=""><span className="xp-section-two-tier__avatar" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><span className="xp-section-two-tier__account-copy"><strong>{model.profile.name}</strong><small>{model.profile.role}</small></span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-section-account-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><section className="xp-section-two-tier__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><span className="xp-section-two-tier__avatar xp-section-two-tier__avatar--large" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function SearchField({ nav, model, id }: { nav: NavModel; model: SectionTwoTierModel; id: string }) {
  if (!nav.search) return null;
  return <form className="xp-section-two-tier__search-form" role="search" data-xp-section-search-form="" onSubmit={(event) => event.preventDefault()}><label htmlFor={id}>{nav.search.label}</label><div><span aria-hidden="true">⌕</span><input id={id} type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" autoFocus={id === "xp-section-two-tier-search-m"} /><button type="submit" data-xp-section-search-action="">{model.searchActionLabel}</button></div></form>;
}

function CompactSearch({ nav, model }: { nav: NavModel; model: SectionTwoTierModel }) {
  return <div data-xp-section-search=""><AdaptiveOverlay intent="edit" presentation={{ M: "full-screen" }} why="Phone search takes over the viewport so the keyboard and field do not compete with the route tabs."><AdaptiveOverlay.Trigger className="xp-section-two-tier__icon-control" aria-label={`${nav.search?.label}: ${nav.search?.placeholder}`} data-xp-section-search-trigger=""><span aria-hidden="true">⌕</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-section-search-overlay=""><AdaptiveOverlay.Header title={nav.search?.label ?? "Search"} description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} model={model} id="xp-section-two-tier-search-m" /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-section-search-footer=""><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function ContextSheet({ nav, context, groupLabel, activeId, renderIcon }: { nav: NavModel; context: NavDestination[]; groupLabel: string; activeId: string; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="The five contextual checks keep their own named rank in a bounded phone sheet."><AdaptiveOverlay.Trigger className="xp-section-two-tier__more" data-xp-section-more-trigger="" aria-label={`Open ${groupLabel}`}><span aria-hidden="true">•••</span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-section-more-overlay=""><AdaptiveOverlay.Header title={groupLabel} description={`Choose a ${nav.identity.label} check.`} /><AdaptiveOverlay.Body data-xp-section-more-scroll="" data-xp-scroll=""><nav className="xp-section-two-tier__sheet-nav" aria-label={groupLabel}><section aria-labelledby="xp-section-context-title"><h2 id="xp-section-context-title">{groupLabel}</h2><ul>{context.map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} /></li>)}</ul></section></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-section-more-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function MobileNavigation({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const { primary, context, contextGroup } = splitRanks(nav);
  return <nav className="xp-section-two-tier__bottom-tabs" aria-label={primary.length ? "Primary areas" : "Navigation"} data-xp-section-primary-rank="" data-xp-section-bottom-tabs=""><ul>{primary.map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} tab /></li>)}<li><ContextSheet nav={nav} context={context} groupLabel={contextGroup?.label ?? "More areas"} activeId={activeId} renderIcon={renderIcon} /></li></ul></nav>;
}

function LargeNavigation({ nav, model, activeId, deviceClass, renderIcon }: { nav: NavModel; model: SectionTwoTierModel; activeId: string; deviceClass: Exclude<DeviceClass, "M">; renderIcon?: NavIconRenderer }) {
  const { primary, context, primaryGroup, contextGroup } = splitRanks(nav);
  return <div className="xp-section-two-tier__navigation">{deviceClass === "TP" ? <nav className="xp-section-two-tier__primary-rank" aria-label={primaryGroup?.label ?? "Primary areas"} data-xp-section-primary-rank=""><ul>{primary.map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} /></li>)}</ul></nav> : null}<div className="xp-section-two-tier__context-rank" data-xp-section-context-rank=""><nav aria-label={contextGroup?.label ?? "Contextual checks"}><ul>{context.map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} /></li>)}</ul></nav><div data-xp-section-search=""><SearchField nav={nav} model={model} id={`xp-section-two-tier-search-${deviceClass.toLowerCase()}`} /></div></div></div>;
}

function CommandPrimary({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const { primary, primaryGroup } = splitRanks(nav);
  return <nav className="xp-section-two-tier__primary-rank xp-section-two-tier__primary-rank--command" aria-label={primaryGroup?.label ?? "Primary areas"} data-xp-section-primary-rank=""><ul>{primary.map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} /></li>)}</ul></nav>;
}

function WorkSurface({ children }: { children: ReactNode }) {
  return <main id="xp-shell-content" tabIndex={-1} className="xp-section-two-tier__main xp-slot" data-xp-region="content"><section className="xp-section-two-tier__work-surface" data-xp-section-work-surface="">{children}</section></main>;
}

export function SectionTwoTierShell({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; model: SectionTwoTierModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const notification = nav.utility?.[0];
  const form = { M: "section-tabs", TP: "section-ladder", TL: "section-touch-two-tier", DS: "section-two-tier", DW: "section-two-tier" }[deviceClass];
  const primaryInCommand = deviceClass === "TL" || deviceClass === "DS" || deviceClass === "DW";
  return <div className="xp-app-shell xp-section-two-tier-shell" data-xp-shell="" data-xp-section-two-tier-shell="" data-xp-nav-renderer="" data-shell-family="app" data-device-class={deviceClass} data-variant={form} data-shell-anatomy="app.top.section-two-tier" data-skin="plain" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><header className="xp-section-two-tier__command" data-xp-command-rank="" data-xp-region="top"><Identity nav={nav} />{primaryInCommand ? <CommandPrimary nav={nav} activeId={activeId} renderIcon={renderIcon} /> : null}{deviceClass === "M" ? <CompactSearch nav={nav} model={model} /> : null}{notification ? <Notification utility={notification} renderIcon={renderIcon} /> : null}<Account model={model} deviceClass={deviceClass} /></header>{deviceClass === "M" ? <MobileNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} /> : <LargeNavigation nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} />}<WorkSurface>{children}</WorkSurface></div>;
}
