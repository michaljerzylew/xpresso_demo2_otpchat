"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel, type NavUtility } from "./nav-model";

const signedInMarketingForms = {
  M: "signed-in-tabs",
  TP: "signed-in-portrait-strip",
  TL: "signed-in-touch-rank",
  DS: "signed-in-rank",
  DW: "signed-in-bounded-rank",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type SignedInMarketingModel = {
  profile: { name: string; email: string; role: string; avatarAlt: string };
};

export type SignedInMarketingReachability = {
  id: string;
  kind: "destination" | "notification" | "account";
  taps: 1 | 2;
  surface: "command" | "bottom-tabs" | "route-strip" | "more-sheet" | "account-overlay";
};

export function signedInMarketingReachability(nav: NavModel, deviceClass: DeviceClass): SignedInMarketingReachability[] {
  return [
    ...destinationsByPriority(nav).map(({ id }, index) => ({
      id,
      kind: "destination" as const,
      taps: deviceClass === "M" && index === 3 ? 2 as const : 1 as const,
      surface: deviceClass === "M" ? index === 3 ? "more-sheet" as const : "bottom-tabs" as const : deviceClass === "TP" ? "route-strip" as const : "command" as const,
    })),
    { id: "util-notices", kind: "notification", taps: 1, surface: "command" },
    { id: "account", kind: "account", taps: 2, surface: "account-overlay" },
  ];
}

function Identity({ nav }: { nav: NavModel }) {
  return <a className="xp-signed-in-marketing__identity" href={nav.identity.href ?? "#xp-marketing-content"} aria-label={nav.identity.label} data-xp-signed-in-identity=""><span aria-hidden="true">RM</span><strong>{nav.identity.label}</strong></a>;
}

function Destination({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return <a className="xp-signed-in-marketing__destination" href={destination.href} data-nav-id={destination.id} data-xp-signed-in-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}><span className="xp-signed-in-marketing__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span><span>{destination.label}</span></a>;
}

function Notification({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  const href = utility.href ?? `#${utility.actionId ?? utility.id}`;
  const iconModel: NavDestination = { id: utility.id, label: utility.label, href, icon: utility.icon, priority: 1 };
  return <a className="xp-signed-in-marketing__notification" href={href} aria-label={`${utility.label}, ${utility.badge?.label}: ${utility.badge?.value}`} data-xp-signed-in-notification="" data-utility-id={utility.id}><span className="xp-signed-in-marketing__icon" data-icon-key={utility.icon} aria-hidden="true">{renderIcon?.(utility.icon, iconModel) ?? utility.icon.slice(0, 1).toUpperCase()}</span><span className="xp-signed-in-marketing__notification-label">{utility.label}</span>{utility.badge ? <span className="xp-signed-in-marketing__badge" aria-label={`${utility.badge.label}: ${utility.badge.value}`} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}</a>;
}

function Account({ model, deviceClass }: { model: SignedInMarketingModel; deviceClass: DeviceClass }) {
  const initials = model.profile.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The signed-in archive profile stays reachable without becoming a second navigation model."><AdaptiveOverlay.Trigger className="xp-signed-in-marketing__account" aria-label={`Open account for ${model.profile.name}`} data-xp-signed-in-account-trigger=""><span className="xp-signed-in-marketing__avatar" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><span className="xp-signed-in-marketing__account-copy"><strong>{model.profile.name}</strong><small>{model.profile.role}</small></span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-signed-in-account-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><section className="xp-signed-in-marketing__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><span className="xp-signed-in-marketing__avatar xp-signed-in-marketing__avatar--large" role="img" aria-label={model.profile.avatarAlt}>{initials}</span><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function More({ nav, destination, activeId, renderIcon }: { nav: NavModel; destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  const rankLabel = nav.groups?.[0]?.label ?? "Archive Navigation";
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="The fourth archive route occupies one bounded phone sheet without duplicating the three first-paint tabs."><AdaptiveOverlay.Trigger className="xp-signed-in-marketing__more" aria-label="Open more archive navigation" data-xp-signed-in-more-trigger=""><span aria-hidden="true">•••</span><strong>More</strong></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-signed-in-more-overlay=""><AdaptiveOverlay.Header title="More navigation" description={`One additional route from ${nav.identity.label}.`} /><AdaptiveOverlay.Body data-xp-signed-in-more-scroll="" data-xp-scroll=""><nav aria-label={rankLabel}><h2>{rankLabel}</h2><Destination destination={destination} activeId={activeId} renderIcon={renderIcon} /></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-signed-in-more-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CommandUtilities({ nav, model, deviceClass, renderIcon }: { nav: NavModel; model: SignedInMarketingModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer }) {
  const utility = nav.utility?.[0];
  if (!utility) return null;
  return <div className="xp-signed-in-marketing__utilities"><Notification utility={utility} renderIcon={renderIcon} /><Account model={model} deviceClass={deviceClass} /></div>;
}

export function SignedInMarketingShell({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; model: SignedInMarketingModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const destinations = destinationsByPriority(nav);
  if (nav.family !== "marketing" || destinations.length !== 4 || destinations.some(({ children }) => children?.length) || nav.utility?.length !== 1 || nav.utility[0]?.id !== "util-notices" || nav.utility[0]?.badge?.value !== 2 || nav.actions?.length || nav.search) throw new Error("marketing.signed-in requires four direct routes, one notices badge 2, no actions, and no search.");
  const mobile = deviceClass === "M";
  const portrait = deviceClass === "TP";
  return <div className="xp-marketing-shell xp-signed-in-marketing" data-xp-shell="" data-xp-signed-in-marketing-shell="" data-xp-nav-renderer="" data-shell-family="marketing" data-shell-anatomy="marketing.signed-in" data-device-class={deviceClass} data-variant={signedInMarketingForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a><header className="xp-signed-in-marketing__top" data-xp-region="top">{mobile || portrait ? <><div className="xp-signed-in-marketing__microbar" data-xp-signed-in-command-rank=""><Identity nav={nav} /><CommandUtilities nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} /></div>{portrait ? <nav className="xp-signed-in-marketing__strip" aria-label={nav.groups?.[0]?.label ?? "Archive Navigation"} data-xp-signed-in-route-rank="">{destinations.map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}</nav> : null}</> : <nav className="xp-signed-in-marketing__rank" aria-label={nav.groups?.[0]?.label ?? "Archive Navigation"} data-xp-signed-in-command-rank=""><Identity nav={nav} /><div className="xp-signed-in-marketing__routes" data-xp-signed-in-route-rank="">{destinations.map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}</div><CommandUtilities nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>}</header><main className="xp-marketing-shell__content xp-signed-in-marketing__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-signed-in-work-surface="" data-xp-region="content">{children}</main><div className="xp-marketing-shell__bottom xp-signed-in-marketing__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>{mobile ? <nav className="xp-signed-in-marketing__bottom-tabs" aria-label={nav.groups?.[0]?.label ?? "Archive Navigation"} data-xp-signed-in-route-rank="">{destinations.slice(0, 3).map((destination) => <Destination key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}<More nav={nav} destination={destinations[3]} activeId={activeId} renderIcon={renderIcon} /></nav> : null}</div></div>;
}
