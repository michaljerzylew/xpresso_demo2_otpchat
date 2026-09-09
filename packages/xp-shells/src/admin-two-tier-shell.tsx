"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import type { AppBarProperties } from "./app-bar";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
  type NavUtility,
} from "./nav-model";

export type AdminTwoTierWorkspaceOption = { id: string; label: string; context: string };
export type AdminTwoTierModel = {
  profile: { name: string; email: string; role: string; avatarAlt: string };
  workspaceOptions: readonly AdminTwoTierWorkspaceOption[];
  searchActionLabel: string;
};

export type AdminTwoTierReachability = {
  id: string;
  kind: "group" | "child" | "search" | "notice" | "account-command" | "workspace";
  parentId?: string;
  taps: 1 | 2;
  surface: "command" | "group-pane" | "more-sheet" | "account-surface" | "switcher-surface";
};

export function adminTwoTierReachability(nav: NavModel, model: AdminTwoTierModel, deviceClass: DeviceClass): AdminTwoTierReachability[] {
  const destinations = destinationsByPriority(nav);
  const compact = deviceClass === "M";
  return [
    ...destinations.flatMap((destination, index): AdminTwoTierReachability[] => [
      { id: destination.id, kind: "group", taps: compact && index > 2 ? 2 : 1, surface: compact && index > 2 ? "more-sheet" : "command" },
      ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, kind: "child" as const, taps: 2 as const, surface: compact && index > 2 ? "more-sheet" as const : "group-pane" as const })),
    ]),
    { id: "search", kind: "search", taps: deviceClass === "M" || deviceClass === "TP" ? 2 : 1, surface: "command" },
    { id: nav.utility?.[0]?.id ?? "notice", kind: "notice", taps: 1, surface: "command" },
    ...(nav.utility ?? []).slice(1).map(({ id }) => ({ id, kind: "account-command" as const, taps: 2 as const, surface: "account-surface" as const })),
    ...model.workspaceOptions.map(({ id }) => ({ id, kind: "workspace" as const, taps: 2 as const, surface: "switcher-surface" as const })),
  ];
}

function Icon({ icon, label, renderIcon }: { icon: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: icon, label, href: `#${icon}`, icon, priority: 0 };
  return <span className="xp-admin-two-tier__icon" data-icon-key={icon} aria-hidden="true">{renderIcon?.(icon, destination) ?? label.slice(0, 1)}</span>;
}

function Identity({ nav }: { nav: NavModel }) {
  const mark = nav.identity.shortLabel ?? nav.identity.label.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <a className="xp-admin-two-tier__identity" href="#xp-shell-content" aria-label={nav.identity.label} data-xp-admin-two-tier-identity=""><span aria-hidden="true">{mark}</span><strong>{nav.identity.label}</strong></a>;
}

function SearchForm({ nav, model, id, overlay = false, renderIcon }: { nav: NavModel; model: AdminTwoTierModel; id: string; overlay?: boolean; renderIcon?: NavIconRenderer }) {
  if (!nav.search) return null;
  return <form className="xp-admin-two-tier__search-form" role="search" data-xp-admin-two-tier-search-form="" onSubmit={(event) => event.preventDefault()}><label htmlFor={id}>{model.searchActionLabel}</label><div><Icon icon="search" label={model.searchActionLabel} renderIcon={renderIcon} /><input id={id} type="search" aria-label={model.searchActionLabel} placeholder={nav.search.placeholder} enterKeyHint="search" autoFocus={overlay} /><button type="submit" aria-label={model.searchActionLabel} data-xp-admin-two-tier-search-action=""><Icon icon="search" label={model.searchActionLabel} renderIcon={renderIcon} /></button></div></form>;
}

function Search({ nav, model, deviceClass, renderIcon }: { nav: NavModel; model: AdminTwoTierModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer }) {
  if (!nav.search) return null;
  if (deviceClass !== "M" && deviceClass !== "TP") return <div className="xp-admin-two-tier__search" data-xp-admin-two-tier-search=""><SearchForm nav={nav} model={model} id={`xp-admin-two-tier-search-${deviceClass.toLowerCase()}`} renderIcon={renderIcon} /></div>;
  return <div className="xp-admin-two-tier__search" data-xp-admin-two-tier-search=""><AdaptiveOverlay intent="edit" presentation={{ M: "full-screen", TP: "action-sheet" }} why="Compact admin search expands into one focused surface without displacing command ownership."><AdaptiveOverlay.Trigger className="xp-admin-two-tier__control" aria-label={`${model.searchActionLabel}: ${nav.search.placeholder}`} data-xp-admin-two-tier-search-trigger=""><Icon icon="search" label={model.searchActionLabel} renderIcon={renderIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-admin-two-tier__search-overlay" data-xp-admin-two-tier-search-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.searchActionLabel} description={nav.search.placeholder} /><AdaptiveOverlay.Body><SearchForm nav={nav} model={model} id="xp-admin-two-tier-search-overlay" overlay renderIcon={renderIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-admin-two-tier__overlay-footer" data-xp-admin-two-tier-search-footer=""><AdaptiveOverlay.Close>Close hub search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function Notice({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  return <a className="xp-admin-two-tier__control xp-admin-two-tier__notice" href={utility.href ?? `#${utility.id}`} aria-label={`${utility.label}, ${utility.badge?.label}: ${utility.badge?.value}`} data-utility-id={utility.id} data-xp-admin-two-tier-notice=""><Icon icon={utility.icon} label={utility.label} renderIcon={renderIcon} />{utility.badge ? <span className="xp-admin-two-tier__badge" aria-label={utility.badge.label} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}</a>;
}

function Account({ nav, model, deviceClass, renderIcon }: { nav: NavModel; model: AdminTwoTierModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const commands = (nav.utility ?? []).slice(1);
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Seven account commands remain grouped behind the signed-in identity without becoming global navigation."><AdaptiveOverlay.Trigger className="xp-admin-two-tier__account" aria-label={`Open account for ${model.profile.name}`} data-xp-admin-two-tier-account-trigger=""><span className="xp-admin-two-tier__avatar" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><span className="xp-admin-two-tier__account-copy"><strong>{model.profile.name}</strong><small>{model.profile.role}</small></span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-admin-two-tier__account-overlay" data-xp-admin-two-tier-account-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body className="xp-admin-two-tier__overlay-body" data-xp-admin-two-tier-account-body=""><section className="xp-admin-two-tier__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><span className="xp-admin-two-tier__avatar xp-admin-two-tier__avatar--large" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section><nav aria-label="Account commands"><ul className="xp-admin-two-tier__command-list">{commands.map((command) => <li key={command.id}><a href={command.href ?? `#${command.id}`} data-account-command-id={command.id}><Icon icon={command.icon} label={command.label} renderIcon={renderIcon} /><span>{command.label}</span></a></li>)}</ul></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-admin-two-tier__overlay-footer" data-xp-admin-two-tier-account-footer=""><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function WorkspaceSwitcher({ model, deviceClass, onAction }: { model: AdminTwoTierModel; deviceClass: DeviceClass; onAction?: AppBarProperties["onAction"] }) {
  const current = model.workspaceOptions[0];
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The workspace switcher remains a distinct second-rank job in every screen class."><AdaptiveOverlay.Trigger className="xp-admin-two-tier__switcher" aria-label={`Switch operational space from ${current?.label}`} data-xp-admin-two-tier-switcher-trigger=""><span aria-hidden="true">{current?.label.slice(0, 2).toUpperCase()}</span><span><strong>{current?.label}</strong><small>{current?.context}</small></span><b aria-hidden="true">⌄</b></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-admin-two-tier__switcher-overlay" data-xp-admin-two-tier-switcher-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={current?.label ?? "Operational spaces"} description="Choose an operational space or reference view." /><AdaptiveOverlay.Body className="xp-admin-two-tier__overlay-body"><ul className="xp-admin-two-tier__workspace-list">{model.workspaceOptions.map((option, index) => <li key={option.id}><button type="button" data-workspace-option-id={option.id} aria-pressed={index === 0} onClick={() => onAction?.(option.id)}><strong>{option.label}</strong><small>{option.context}</small></button></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-admin-two-tier__overlay-footer" data-xp-admin-two-tier-switcher-footer=""><AdaptiveOverlay.Close>Close space switcher</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId}><span>{child.label}</span></a>;
}

function GroupTrigger({ destination, deviceClass, renderIcon, tab = false }: { destination: NavDestination; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Each admin group opens one bounded pane containing its exact authored child routes."><AdaptiveOverlay.Trigger className={`xp-admin-two-tier__group-trigger${tab ? " xp-admin-two-tier__group-trigger--tab" : ""}`} aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-group-id={destination.id} data-xp-admin-two-tier-group-trigger=""><Icon icon={destination.icon} label={destination.label} renderIcon={renderIcon} /><span>{destination.label}</span><b aria-hidden="true">⌄</b></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-admin-two-tier__group-overlay" data-xp-admin-two-tier-group-overlay="" data-group-id={destination.id} data-device-class={deviceClass}><AdaptiveOverlay.Header title={destination.label} description={`Choose a route in ${destination.label}.`} /><AdaptiveOverlay.Body className="xp-admin-two-tier__overlay-body" data-xp-admin-two-tier-group-body=""><nav aria-label={`${destination.label} routes`}><ul className="xp-admin-two-tier__child-list">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} /></li>)}</ul></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-admin-two-tier__overlay-footer" data-xp-admin-two-tier-group-footer=""><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function More({ destinations, deviceClass, renderIcon }: { destinations: readonly NavDestination[]; deviceClass: "M"; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="Phone restores groups four and five as expanded titled sections without duplicating the first three tabs."><AdaptiveOverlay.Trigger className="xp-admin-two-tier__more-trigger" aria-label="Open more hub groups" data-xp-admin-two-tier-more-trigger=""><span aria-hidden="true"><i /><i /><i /></span><strong>More</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-admin-two-tier__more-overlay" data-xp-admin-two-tier-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="More hub groups" description="Additional operational routes." /><AdaptiveOverlay.Body className="xp-admin-two-tier__overlay-body xp-admin-two-tier__more-body" data-xp-admin-two-tier-more-body="">{destinations.map((destination) => <section key={destination.id} data-xp-admin-two-tier-more-section={destination.id}><h2><a href={destination.href} data-nav-id={destination.id} data-group-id={destination.id}><Icon icon={destination.icon} label={destination.label} renderIcon={renderIcon} /><span>{destination.label}</span></a></h2><ul className="xp-admin-two-tier__child-list">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} /></li>)}</ul></section>)}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-admin-two-tier__overlay-footer" data-xp-admin-two-tier-more-footer=""><AdaptiveOverlay.Close>Close more groups</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

export function AdminTwoTierShell({ nav, model, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; model: AdminTwoTierModel; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const destinations = destinationsByPriority(nav);
  const utilities = nav.utility ?? [];
  const notice = utilities[0];
  const expectedIds = ["dest-activity", "dest-stock", "dest-display", "dest-fulfillment", "dest-links"];
  const expectedChildren = [5, 4, 4, 5, 4];
  const expectedCommands = ["cmd-personal-details", "cmd-system-prefs", "cmd-payment-records", "cmd-access-control", "cmd-interface-options", "cmd-invite-colleague", "cmd-end-session"];
  const valid = nav.family === "two-tier"
    && destinations.map(({ id }) => id).join("/") === expectedIds.join("/")
    && destinations.every((destination, index) => destination.children?.length === expectedChildren[index] && destination.href?.startsWith("#") && Boolean(destination.icon))
    && new Set(destinations.flatMap(({ children }) => (children ?? []).map(({ id }) => id))).size === 22
    && nav.groups?.length === 1
    && nav.groups[0]?.destinationIds.join("/") === expectedIds.join("/")
    && utilities.length === 8
    && notice?.id === "util-notices" && notice.icon === "bell" && notice.href === "#notices" && notice.badge?.value === 8 && notice.badge.label === "eight unread notices"
    && utilities.slice(1).map(({ id }) => id).join("/") === expectedCommands.join("/")
    && model.workspaceOptions.length === 4
    && model.workspaceOptions.map(({ id }) => id).join("/") === "ws-current/ws-summary/ws-access/ws-help"
    && !nav.actions?.length && !nav.widgets?.length && Boolean(nav.search);
  if (!valid || !notice) throw new Error("app.top.admin-two-tier requires five grouped destinations with 22 children, notice badge 8, seven account commands, real search, and four workspace options.");

  const form = { M: "admin-compact-tabs", TP: "admin-portrait-ladder", TL: "admin-touch-two-tier", DS: "admin-two-tier", DW: "admin-bounded-two-tier" }[deviceClass];
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-admin-two-tier-shell" data-xp-shell="" data-xp-admin-two-tier-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="app.top.admin-two-tier" data-nav-model="two-tier-switcher" data-device-class={deviceClass} data-variant={form} data-skin="plain" data-nav-placement="top" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a><header className="xp-admin-two-tier__command" data-xp-admin-two-tier-command-rank="" data-xp-region="top"><Identity nav={nav} /><Search nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} /><div className="xp-admin-two-tier__command-end"><Notice utility={notice} renderIcon={renderIcon} /><Account nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} /></div></header>{deviceClass === "M" ? <div className="xp-admin-two-tier__switcher-rank" data-xp-admin-two-tier-switcher-rank=""><WorkspaceSwitcher model={model} deviceClass={deviceClass} onAction={onAction} /></div> : deviceClass === "TP" ? <><div className="xp-admin-two-tier__switcher-rank" data-xp-admin-two-tier-switcher-rank=""><WorkspaceSwitcher model={model} deviceClass={deviceClass} onAction={onAction} /></div><nav className="xp-admin-two-tier__snap-rank" aria-label={nav.groups?.[0]?.label} data-xp-admin-two-tier-group-rank="">{destinations.map((destination) => <GroupTrigger key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} tab />)}</nav></> : <nav className="xp-admin-two-tier__lower-rank" aria-label={nav.groups?.[0]?.label} data-xp-admin-two-tier-group-rank="" data-xp-admin-two-tier-switcher-rank=""><div className="xp-admin-two-tier__groups">{destinations.map((destination) => <GroupTrigger key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} />)}</div><WorkspaceSwitcher model={model} deviceClass={deviceClass} onAction={onAction} /></nav>}<main className="xp-admin-two-tier__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-admin-two-tier__work-surface" data-xp-admin-two-tier-work-surface="">{children}</section></main>{deviceClass === "M" ? <nav className="xp-admin-two-tier__bottom-tabs" aria-label={nav.groups?.[0]?.label} data-xp-admin-two-tier-bottom-rank="">{destinations.slice(0, 3).map((destination) => <GroupTrigger key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} tab />)}<More destinations={destinations.slice(3)} deviceClass="M" renderIcon={renderIcon} /></nav> : null}</div>;
}
