"use client";

import type { DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavAction, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

const invertedDualActionForms = {
  M: "inverted-bottom-tabs",
  TP: "inverted-portrait-strip",
  TL: "inverted-touch-rank",
  DS: "inverted-rank",
  DW: "inverted-bounded-rank",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type InvertedDualActionReachability = {
  id: string;
  kind: "destination" | "action";
  taps: 1;
  surface: "bottom-tabs" | "route-strip" | "command";
};

export function invertedDualActionReachability(nav: NavModel, deviceClass: DeviceClass): InvertedDualActionReachability[] {
  const destinationSurface: InvertedDualActionReachability["surface"] = deviceClass === "M" ? "bottom-tabs" : deviceClass === "TP" ? "route-strip" : "command";
  return [
    ...destinationsByPriority(nav).map(({ id }) => ({ id, kind: "destination" as const, taps: 1 as const, surface: destinationSurface })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, taps: 1 as const, surface: "command" as const })),
  ];
}

function Identity({ nav }: { nav: NavModel }) {
  const mark = nav.identity.label.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <a className="xp-inverted-dual__identity" href={nav.identity.href ?? "#xp-marketing-content"} aria-label={nav.identity.label} data-xp-inverted-dual-identity=""><span aria-hidden="true">{mark || "SR"}</span><strong>{nav.identity.label}</strong></a>;
}

function Destination({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return <a className="xp-inverted-dual__destination" href={destination.href} data-nav-id={destination.id} data-xp-inverted-dual-tab={tab ? "" : undefined} data-xp-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}><span className="xp-inverted-dual__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span><span>{destination.label}</span></a>;
}

function Action({ action }: { action: NavAction }) {
  return <a className={`xp-inverted-dual__action xp-inverted-dual__action--${action.kind}`} href={action.href ?? `#${action.actionId ?? action.id}`} data-action-id={action.id} data-action-kind={action.kind} data-xp-inverted-dual-action="">{action.label}</a>;
}

function Actions({ nav }: { nav: NavModel }) {
  return <div className="xp-inverted-dual__actions" data-xp-inverted-dual-actions="">{(nav.actions ?? []).map((action) => <Action key={action.id} action={action} />)}</div>;
}

function RouteRank({ nav, activeId, renderIcon, placement }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; placement: "bottom" | "strip" }) {
  return <nav className={`xp-inverted-dual__tabs xp-inverted-dual__tabs--${placement}`} aria-label={nav.groups?.[0]?.label ?? "Main routes"} data-xp-inverted-dual-route-rank="">{destinationsByPriority(nav).map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}</nav>;
}

function CompleteRank({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-inverted-dual__rank" aria-label={nav.groups?.[0]?.label ?? "Main routes"} data-xp-inverted-dual-command-rank=""><Identity nav={nav} /><div className="xp-inverted-dual__routes" data-xp-inverted-dual-route-rank="">{destinationsByPriority(nav).map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}</div><Actions nav={nav} /></nav>;
}

export function InvertedDualActionMarketingShell({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const destinations = destinationsByPriority(nav);
  const actions = nav.actions ?? [];
  const groupIds = nav.groups?.[0]?.destinationIds ?? [];
  const valid = nav.family === "marketing" && destinations.length === 4 && destinations.every(({ children, badge }) => !children?.length && !badge) && nav.groups?.length === 1 && groupIds.join("/") === destinations.map(({ id }) => id).join("/") && !nav.utility?.length && !nav.search && !nav.widgets?.length && actions.length === 2 && actions[0]?.id === "action-account-access" && actions[0]?.kind === "secondary" && actions[1]?.id === "action-evaluation" && actions[1]?.kind === "primary" && activeId === destinations[0]?.id;
  if (!valid) throw new Error("marketing.inverted-dual-action requires four direct grouped routes, deterministic first-route current state, and ordered secondary account/primary evaluation actions only.");
  const mobile = deviceClass === "M";
  const portrait = deviceClass === "TP";
  return <div className="xp-marketing-shell xp-inverted-dual" data-xp-shell="" data-xp-inverted-dual-action-shell="" data-xp-nav-renderer="" data-shell-family="marketing" data-shell-anatomy="marketing.inverted-dual-action" data-device-class={deviceClass} data-variant={invertedDualActionForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a><header className="xp-inverted-dual__top" data-xp-region="top">{mobile || portrait ? <><div className="xp-inverted-dual__microbar" data-xp-inverted-dual-command-rank=""><Identity nav={nav} /><Actions nav={nav} /></div>{portrait ? <RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} placement="strip" /> : null}</> : <CompleteRank nav={nav} activeId={activeId} renderIcon={renderIcon} />}</header><main className="xp-marketing-shell__content xp-inverted-dual__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-inverted-dual-work-surface="" data-xp-region="content">{children}</main><div className="xp-marketing-shell__bottom xp-inverted-dual__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>{mobile ? <RouteRank nav={nav} activeId={activeId} renderIcon={renderIcon} placement="bottom" /> : null}</div></div>;
}
