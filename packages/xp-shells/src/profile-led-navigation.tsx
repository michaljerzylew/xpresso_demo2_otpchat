"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const profileLedForms = {
  M: "profile-led-tabs",
  TP: "profile-led-portrait-tabs",
  TL: "profile-led-touch-rail",
  DS: "profile-led-panel",
  DW: "profile-led-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type ProfileLedSocialUtility = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

export type ProfileLedModel = {
  identity: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
    socialUtilities: readonly ProfileLedSocialUtility[];
  };
  portrait: {
    avifSrc: string;
    webpSrc: string;
    jpegSrc: string;
  };
  footerLinks: readonly { id: string; label: string; href: string }[];
};

export type ProfileLedReachability = {
  id: string;
  taps: 1 | 2;
  surface: "first-paint-tab" | "account-sheet" | "complete-more-sheet" | "touch-rail" | "complete-panel";
};

export function profileLedReachability(nav: NavModel, model: ProfileLedModel, deviceClass: DeviceClass): ProfileLedReachability[] {
  const destinations = destinationsByPriority(nav);
  if (deviceClass === "M" || deviceClass === "TP") {
    return [
      ...destinations.map(({ id }, index) => ({ id, taps: (index < 3 ? 1 : 2) as 1 | 2, surface: index < 3 ? "first-paint-tab" as const : "complete-more-sheet" as const })),
      ...model.identity.socialUtilities.map(({ id }) => ({ id, taps: 2 as const, surface: "account-sheet" as const })),
      ...model.footerLinks.map(({ id }) => ({ id, taps: 2 as const, surface: "complete-more-sheet" as const })),
    ];
  }
  if (deviceClass === "TL") {
    return [
      ...destinations.map(({ id }, index) => ({ id, taps: index < 5 ? 1 as const : 2 as const, surface: "touch-rail" as const })),
      ...model.identity.socialUtilities.map(({ id }) => ({ id, taps: 2 as const, surface: "account-sheet" as const })),
      ...model.footerLinks.map(({ id }) => ({ id, taps: 2 as const, surface: "touch-rail" as const })),
    ];
  }
  return [
    ...destinations.map(({ id }) => ({ id, taps: 1 as const, surface: "complete-panel" as const })),
    ...model.identity.socialUtilities.map(({ id }) => ({ id, taps: 1 as const, surface: "complete-panel" as const })),
    ...model.footerLinks.map(({ id }) => ({ id, taps: 1 as const, surface: "complete-panel" as const })),
  ];
}

function Icon({ icon, label, renderIcon }: { icon: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: `icon-${icon}`, label, href: "#", icon, priority: 0 };
  return <span className="xp-profile-led__icon" data-icon-key={icon} aria-hidden="true">{renderIcon?.(icon, destination) ?? label.slice(0, 1)}</span>;
}

function Portrait({ model, size }: { model: ProfileLedModel; size: "compact" | "touch" | "panel" }) {
  return (
    <picture className="xp-profile-led__portrait" data-avatar-size={size}>
      <source srcSet={model.portrait.avifSrc} type="image/avif" />
      <source srcSet={model.portrait.webpSrc} type="image/webp" />
      <img src={model.portrait.jpegSrc} width={256} height={256} alt={model.identity.avatarAlt} data-xp-profile-led-avatar="" />
    </picture>
  );
}

function Identity({ model, size = "panel" }: { model: ProfileLedModel; size?: "touch" | "panel" }) {
  return (
    <section className="xp-profile-led__identity" data-xp-profile-led-identity="" data-account-name={model.identity.name} data-account-email={model.identity.email} data-account-role={model.identity.role}>
      <Portrait model={model} size={size} />
      <div>
        <strong>{model.identity.name}</strong>
        <a href={`mailto:${model.identity.email}`}>{model.identity.email}</a>
        <span>{model.identity.role}</span>
      </div>
    </section>
  );
}

function SocialUtilities({ model, renderIcon, labelled = false }: { model: ProfileLedModel; renderIcon?: NavIconRenderer; labelled?: boolean }) {
  return (
    <nav className="xp-profile-led__social" aria-label="Profile connections" data-xp-profile-led-social="">
      {model.identity.socialUtilities.map((utility) => (
        <a key={utility.id} href={utility.href} data-social-id={utility.id} aria-label={utility.label}>
          <Icon icon={utility.icon} label={utility.label} renderIcon={renderIcon} />
          <span className={labelled ? undefined : "xp-visually-hidden"}>{utility.label}</span>
        </a>
      ))}
    </nav>
  );
}

function Badge({ destination }: { destination: NavDestination }) {
  return destination.badge ? <span className="xp-profile-led__badge" data-badge-value={destination.badge.value} aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null;
}

function DestinationLink({ destination, activeId, renderIcon, surface }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; surface: "tab" | "sheet" | "rail" | "panel" }) {
  return (
    <a className="xp-profile-led__destination" href={destination.href} data-nav-id={destination.id} data-xp-profile-led-destination="" data-profile-surface={surface} aria-current={destination.id === activeId ? "page" : undefined}>
      <Icon icon={destination.icon} label={destination.label} renderIcon={renderIcon} />
      <span className="xp-profile-led__label">{destination.label}</span>
      <Badge destination={destination} />
    </a>
  );
}

function GroupedDestinations({ nav, activeId, renderIcon, surface }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; surface: "sheet" | "panel" }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <div className="xp-profile-led__groups" data-xp-profile-led-groups="">{nav.groups?.map((group) => (
    <section key={group.id} className="xp-profile-led__group" data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
      {group.label ? <h2>{group.label}</h2> : null}
      <div>{group.destinationIds.map((id) => { const destination = byId.get(id); return destination ? <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} /> : null; })}</div>
    </section>
  ))}</div>;
}

function BrandFooter({ model }: { model: ProfileLedModel }) {
  return <footer className="xp-profile-led__brand" data-xp-profile-led-brand="">{model.footerLinks.map((link) => <a key={link.id} href={link.href} data-footer-link-id={link.id}><span aria-hidden="true">TL</span><strong>{link.label}</strong></a>)}</footer>;
}

function AccountOverlay({ model, renderIcon, deviceClass, triggerMode }: { model: ProfileLedModel; renderIcon?: NavIconRenderer; deviceClass: DeviceClass; triggerMode: "tab" | "rail" }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover" }} why="The source profile becomes a labelled Account destination on compact devices and a touch-anchored portrait on landscape tablet.">
      <AdaptiveOverlay.Trigger className={`xp-profile-led__account-trigger xp-profile-led__account-trigger--${triggerMode}`} aria-label={`Open account for ${model.identity.name}`} data-xp-profile-led-account-trigger="">
        <Portrait model={model} size={triggerMode === "rail" ? "touch" : "compact"} />
        <span>Account</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-profile-led__account-overlay" data-xp-profile-led-account-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="Account" description="Profile and connections" />
        <AdaptiveOverlay.Body className="xp-profile-led__account-body">
          <Identity model={model} size="touch" />
          <SocialUtilities model={model} renderIcon={renderIcon} labelled />
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-profile-led__overlay-footer"><AdaptiveOverlay.Close className="xp-profile-led__overlay-close">Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function MoreOverlay({ nav, model, activeId, renderIcon, deviceClass, triggerMode }: { nav: NavModel; model: ProfileLedModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: DeviceClass; triggerMode: "tab" | "rail" }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover" }} why="A complete grouped graph preserves every source destination within two taps without a hidden navigation twin.">
      <AdaptiveOverlay.Trigger className={`xp-profile-led__more-trigger xp-profile-led__more-trigger--${triggerMode}`} aria-label="More destinations" data-xp-profile-led-more-trigger="">
        <span className="xp-profile-led__more-icon" aria-hidden="true"><i /><i /><i /></span><span>More</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-profile-led__more-overlay" data-xp-profile-led-more-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="All destinations" description="Signals and operations" />
        <AdaptiveOverlay.Body className="xp-profile-led__more-body" data-xp-profile-led-more-body=""><GroupedDestinations nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" /><BrandFooter model={model} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-profile-led__overlay-footer" data-xp-profile-led-more-footer=""><AdaptiveOverlay.Close className="xp-profile-led__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactTabs({ nav, model, activeId, renderIcon, deviceClass }: { nav: NavModel; model: ProfileLedModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: "M" | "TP" }) {
  return <nav className="xp-profile-led__tabs" aria-label="Primary navigation" data-xp-profile-led-tab-rank="">{destinationsByPriority(nav).slice(0, 3).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<AccountOverlay model={model} renderIcon={renderIcon} deviceClass={deviceClass} triggerMode="tab" /><MoreOverlay nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} triggerMode="tab" /></nav>;
}

function TouchRail({ nav, model, activeId, renderIcon }: { nav: NavModel; model: ProfileLedModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <aside className="xp-profile-led__rail" data-xp-profile-led-rail=""><AccountOverlay model={model} renderIcon={renderIcon} deviceClass="TL" triggerMode="rail" /><nav aria-label="Priority destinations">{destinationsByPriority(nav).slice(0, 5).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="rail" />)}</nav><MoreOverlay nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} deviceClass="TL" triggerMode="rail" /></aside>;
}

function validateProfileLed(nav: NavModel, model: ProfileLedModel, activeId: string) {
  const expectedIds = ["dest-summary", "dest-outcomes", "dest-readers", "dest-reactions", "dest-trends", "dest-peers", "dest-promotions", "dest-mood", "dest-partners", "dest-live", "dest-agenda", "dest-delivery", "dest-preferences", "dest-access"];
  const expectedGroups = ["group-current", "group-signals", "group-operations"];
  const destinations = destinationsByPriority(nav);
  const valid = nav.family === "app" && destinations.map(({ id }) => id).join("/") === expectedIds.join("/")
    && destinations.every(({ href, icon, children }) => href?.startsWith("#") && Boolean(icon) && !children?.length)
    && nav.groups?.map(({ id }) => id).join("/") === expectedGroups.join("/")
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "1/8/5"
    && nav.groups?.flatMap(({ destinationIds }) => [...destinationIds]).join("/") === expectedIds.join("/")
    && nav.groups?.map(({ label }) => label).join("/") === "/Signals/Operations"
    && destinations.filter(({ badge }) => badge).map(({ id, badge }) => `${id}:${badge?.value}`).join("/") === "dest-summary:5/dest-trends:3"
    && activeId === "dest-summary" && model.identity.name === "Tessar Drell" && model.identity.email === "tessar.drell@trelar.example"
    && model.identity.role === "Lead Analyst" && model.identity.socialUtilities.length === 4
    && model.footerLinks.length === 1 && model.footerLinks[0]?.label === nav.identity.label
    && !nav.search && !nav.actions?.length && !nav.utility?.length && !nav.widgets?.length;
  if (!valid) throw new Error("Profile-led navigation requires exact Tessar identity, 14 direct routes in 1/8/5 groups, Summary current, badges 5/3, four social utilities, one matching brand footer, and no extra shell jobs.");
}

export function ProfileLedNavigation({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; model: ProfileLedModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  validateProfileLed(nav, model, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-profile-led-shell" data-xp-shell="" data-xp-profile-led-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.profile-led" data-device-class={deviceClass} data-variant={profileLedForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
    <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
    <div className="xp-profile-led__body">
      {deviceClass === "TL" ? <TouchRail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} /> : null}
      {deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-profile-led__panel" data-xp-profile-led-panel=""><Identity model={model} /><SocialUtilities model={model} renderIcon={renderIcon} /><nav aria-label="Workspace destinations"><GroupedDestinations nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" /></nav><BrandFooter model={model} /></aside> : null}
      <main className="xp-profile-led__main" id="xp-shell-content" tabIndex={-1}><section className="xp-profile-led__work-surface" data-xp-profile-led-work-surface="">{children}</section></main>
    </div>
    {compact ? <CompactTabs nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /> : null}
  </div>;
}
