"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import type { AppBarAction, AppBarModel, AppBarProperties } from "./app-bar";
import type { NavModel, NavUtility } from "./nav-model";

export type BrandedCommandActionsModel = {
  profile: { name: string; email: string; role: string; avatarAlt: string };
  searchActionLabel: string;
};

export type BrandedCommandActionsReachability = {
  id: string;
  kind: "search" | "utility" | "account";
  taps: 1 | 2;
  surface: "command" | "search-overlay" | "account-overlay";
};

export function brandedCommandActionsReachability(nav: NavModel, deviceClass: DeviceClass): BrandedCommandActionsReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    { id: "search", kind: "search", taps: compact ? 2 : 1, surface: compact ? "search-overlay" : "command" },
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "utility" as const, taps: 1 as const, surface: "command" as const })),
    { id: "account", kind: "account", taps: 2, surface: "account-overlay" },
  ];
}

function Glyph({ icon, label, renderActionIcon }: { icon: string; label: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const action: AppBarAction = { id: icon, label, icon, priority: 1 };
  return <span className="xp-branded-command__glyph" data-icon-key={icon} aria-hidden="true">{renderActionIcon?.(icon, action) ?? label.slice(0, 1)}</span>;
}

function SearchField({ appBar, model, id, overlay, renderActionIcon }: { appBar: AppBarModel; model: BrandedCommandActionsModel; id: string; overlay?: boolean; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  return <form className="xp-branded-command__search-form" role="search" data-xp-branded-command-search-form="" onSubmit={(event) => event.preventDefault()}><label htmlFor={id}>{appBar.search.label}</label><div><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /><input id={id} type="search" aria-label={appBar.search.label} placeholder={appBar.search.placeholder} enterKeyHint="search" autoFocus={overlay} /><button type="submit" aria-label={model.searchActionLabel} data-xp-branded-command-search-action=""><Glyph icon="search" label={model.searchActionLabel} renderActionIcon={renderActionIcon} /></button></div></form>;
}

function Search({ appBar, model, deviceClass, renderActionIcon }: { appBar: AppBarModel; model: BrandedCommandActionsModel; deviceClass: DeviceClass; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  if (deviceClass !== "M" && deviceClass !== "TP") return <div className="xp-branded-command__search" data-xp-branded-command-search=""><SearchField appBar={appBar} model={model} id={`xp-branded-command-search-${deviceClass.toLowerCase()}`} renderActionIcon={renderActionIcon} /></div>;
  return <div className="xp-branded-command__search" data-xp-branded-command-search=""><AdaptiveOverlay intent="edit" presentation={{ M: "full-screen", TP: "full-screen" }} why="Compact classes use a bounded search takeover so the command rank never reclassifies or hides utilities."><AdaptiveOverlay.Trigger className="xp-branded-command__control" aria-label={`${appBar.search.label}: ${appBar.search.placeholder}`} data-xp-branded-command-search-trigger=""><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-branded-command-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={appBar.search.label} description={appBar.search.placeholder} /><AdaptiveOverlay.Body><SearchField appBar={appBar} model={model} id={`xp-branded-command-search-overlay-${deviceClass.toLowerCase()}`} overlay renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-branded-command-search-footer=""><AdaptiveOverlay.Close>Close field search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function Utility({ utility, renderActionIcon }: { utility: NavUtility; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const badgeDescription = utility.badge ? `, ${utility.badge.label}: ${utility.badge.value}` : "";
  return <a className="xp-branded-command__control" href={utility.href ?? `#${utility.id}`} aria-label={`${utility.label}${badgeDescription}`} data-xp-branded-command-utility="" data-utility-id={utility.id}><Glyph icon={utility.icon} label={utility.label} renderActionIcon={renderActionIcon} /><span className="xp-branded-command__utility-label">{utility.label}</span>{utility.badge ? <span className="xp-branded-command__badge" aria-label={`${utility.badge.label}: ${utility.badge.value}`} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}</a>;
}

function Account({ model, deviceClass }: { model: BrandedCommandActionsModel; deviceClass: DeviceClass }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The signed-in account remains a separate command utility with a bounded detail surface."><AdaptiveOverlay.Trigger className="xp-branded-command__account" aria-label={`Open account for ${model.profile.name}`} data-xp-branded-command-account-trigger=""><span className="xp-branded-command__avatar" role="img" aria-label={model.profile.avatarAlt}>{initials}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-branded-command-account-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><section className="xp-branded-command__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><span className="xp-branded-command__avatar xp-branded-command__avatar--large" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

export function BrandedCommandActionsShell({ nav, appBar, model, deviceClass, children, renderActionIcon, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: BrandedCommandActionsModel; deviceClass: DeviceClass; children: ReactNode; renderActionIcon?: AppBarProperties["renderActionIcon"]; sourceSlug?: string; sourcePreset?: string }) {
  const form = { M: "compact-branded-command", TP: "portrait-branded-command", TL: "touch-centered-command", DS: "centered-command", DW: "bounded-centered-command" }[deviceClass];
  return <div className="xp-app-shell xp-branded-command-shell" data-xp-shell="" data-xp-branded-command-shell="" data-xp-branded-command-renderer="" data-shell-family="app" data-device-class={deviceClass} data-variant={form} data-shell-anatomy="appbar.branded-command-actions" data-skin="plain" data-nav-placement="none" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><header className="xp-branded-command__command" data-xp-region="top" data-xp-command-rank=""><a className="xp-branded-command__brand" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-branded-command-brand=""><span className="xp-branded-command__mark" aria-hidden="true">F</span><strong>{nav.identity.label}</strong></a><Search appBar={appBar} model={model} deviceClass={deviceClass} renderActionIcon={renderActionIcon} /><div className="xp-branded-command__trailing"><nav className="xp-branded-command__utilities" aria-label="Command utilities">{(nav.utility ?? []).map((utility) => <Utility key={utility.id} utility={utility} renderActionIcon={renderActionIcon} />)}</nav><Account model={model} deviceClass={deviceClass} /></div></header><main className="xp-branded-command__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-branded-command__work-surface" data-xp-branded-command-work-surface="">{children}</section></main></div>;
}
