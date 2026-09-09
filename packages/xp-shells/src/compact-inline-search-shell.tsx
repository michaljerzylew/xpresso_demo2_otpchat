"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import type { AppBarAction, AppBarModel, AppBarProperties } from "./app-bar";
import type { NavModel, NavUtility } from "./nav-model";

export type CompactInlineSearchModel = {
  profile: { name: string; email: string; role: string; avatarAlt: string };
  searchActionLabel: string;
};

export type CompactInlineSearchReachability = {
  id: string;
  kind: "search" | "utility" | "account";
  taps: 1 | 2;
  surface: "command" | "search-overlay" | "account-overlay";
};

export function compactInlineSearchReachability(nav: NavModel, deviceClass: DeviceClass): CompactInlineSearchReachability[] {
  return [
    { id: "search", kind: "search", taps: deviceClass === "M" ? 2 : 1, surface: deviceClass === "M" ? "search-overlay" : "command" },
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "utility" as const, taps: 1 as const, surface: "command" as const })),
    { id: "account", kind: "account", taps: 2, surface: "account-overlay" },
  ];
}

function Glyph({ icon, label, renderActionIcon }: { icon: string; label: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const action: AppBarAction = { id: icon, label, icon, priority: 1 };
  return <span className="xp-compact-search__glyph" data-icon-key={icon} aria-hidden="true">{renderActionIcon?.(icon, action) ?? label.slice(0, 1)}</span>;
}

function SearchField({ appBar, model, id, overlay, renderActionIcon }: { appBar: AppBarModel; model: CompactInlineSearchModel; id: string; overlay?: boolean; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  return <form className="xp-compact-search__search-form" role="search" data-xp-compact-search-form="" onSubmit={(event) => event.preventDefault()}><label htmlFor={id}>{appBar.search.label}</label><div><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /><input id={id} type="search" aria-label={appBar.search.label} placeholder={appBar.search.placeholder} enterKeyHint="search" autoFocus={overlay} /><button type="submit" aria-label={model.searchActionLabel} data-xp-compact-search-action=""><Glyph icon="search" label={model.searchActionLabel} renderActionIcon={renderActionIcon} /></button></div></form>;
}

function Search({ appBar, model, deviceClass, renderActionIcon }: { appBar: AppBarModel; model: CompactInlineSearchModel; deviceClass: DeviceClass; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  if (deviceClass !== "M") return <div className="xp-compact-search__search" data-xp-compact-search=""><SearchField appBar={appBar} model={model} id={`xp-compact-search-${deviceClass.toLowerCase()}`} renderActionIcon={renderActionIcon} /></div>;
  return <div className="xp-compact-search__search" data-xp-compact-search=""><AdaptiveOverlay intent="edit" presentation={{ M: "full-screen" }} why="The phone keeps every source utility visible while search expands into one focused, bounded takeover."><AdaptiveOverlay.Trigger className="xp-compact-search__control" aria-label={`${appBar.search.label}: ${appBar.search.placeholder}`} data-xp-compact-search-trigger=""><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-compact-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={appBar.search.label} description={appBar.search.placeholder} /><AdaptiveOverlay.Body><SearchField appBar={appBar} model={model} id="xp-compact-search-overlay" overlay renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-compact-search-footer=""><AdaptiveOverlay.Close>Close registry search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function Utility({ utility, renderActionIcon }: { utility: NavUtility; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const badgeDescription = utility.badge ? `, ${utility.badge.label}: ${utility.badge.value}` : "";
  return <a className="xp-compact-search__control" href={utility.href ?? `#${utility.id}`} aria-label={`${utility.label}${badgeDescription}`} data-xp-compact-search-utility="" data-utility-id={utility.id}><Glyph icon={utility.icon} label={utility.label} renderActionIcon={renderActionIcon} /><span className="xp-compact-search__utility-label">{utility.label}</span>{utility.badge ? <span className="xp-compact-search__badge" aria-label={`${utility.badge.label}: ${utility.badge.value}`} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}</a>;
}

function Account({ model, deviceClass }: { model: CompactInlineSearchModel; deviceClass: DeviceClass }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The separate signed-in account stays reachable without becoming a fourth utility declaration."><AdaptiveOverlay.Trigger className="xp-compact-search__account" aria-label={`Open account for ${model.profile.name}`} data-xp-compact-search-account-trigger=""><span className="xp-compact-search__avatar" role="img" aria-label={model.profile.avatarAlt}>{initials}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-compact-search-account-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><section className="xp-compact-search__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><span className="xp-compact-search__avatar xp-compact-search__avatar--large" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

export function CompactInlineSearchShell({ nav, appBar, model, deviceClass, children, renderActionIcon, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: CompactInlineSearchModel; deviceClass: DeviceClass; children: ReactNode; renderActionIcon?: AppBarProperties["renderActionIcon"]; sourceSlug?: string; sourcePreset?: string }) {
  const utilities = nav.utility ?? [];
  if (nav.destinations.length || nav.actions?.length || utilities.length !== 3 || utilities.map(({ id }) => id).join("/") !== "util-notices/util-messages/util-calendar" || utilities[0]?.badge?.value !== 2 || utilities[1]?.badge?.value !== 4 || utilities[2]?.badge || !appBar.search) throw new Error("appbar.compact-inline-search requires zero destinations/actions, real search, and ordered notices 2/messages 4/calendar utilities.");
  const form = { M: "compact-search-takeover", TP: "portrait-inline-search", TL: "touch-inline-search", DS: "adjacent-inline-search", DW: "bounded-adjacent-search" }[deviceClass];
  return <div className="xp-app-shell xp-compact-search-shell" data-xp-shell="" data-xp-compact-inline-search-shell="" data-xp-compact-inline-search-renderer="" data-xp-nav-renderer="" data-shell-family="app" data-device-class={deviceClass} data-variant={form} data-shell-anatomy="appbar.compact-inline-search" data-skin="plain" data-nav-placement="none" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><header className="xp-compact-search__command" data-xp-region="top" data-xp-command-rank=""><a className="xp-compact-search__brand" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-compact-search-brand=""><span className="xp-compact-search__mark" aria-hidden="true">R</span><strong>{nav.identity.label}</strong></a><Search appBar={appBar} model={model} deviceClass={deviceClass} renderActionIcon={renderActionIcon} /><div className="xp-compact-search__trailing"><nav className="xp-compact-search__utilities" aria-label="Account commands">{utilities.map((utility) => <Utility key={utility.id} utility={utility} renderActionIcon={renderActionIcon} />)}</nav><Account model={model} deviceClass={deviceClass} /></div></header><main className="xp-compact-search__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-compact-search__work-surface" data-xp-compact-search-work-surface="">{children}</section></main></div>;
}
