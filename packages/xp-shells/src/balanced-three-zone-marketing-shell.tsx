"use client";

import type { DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

const balancedThreeZoneForms: Readonly<Record<DeviceClass, "bottom-tabs" | "tablet-strip" | "balanced-touch-rank" | "balanced-rank">> = {
  M: "bottom-tabs",
  TP: "tablet-strip",
  TL: "balanced-touch-rank",
  DS: "balanced-rank",
  DW: "balanced-rank",
};

export type BalancedThreeZoneMarketingShellProperties = {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
};

function Identity({ model }: { model: NavModel }) {
  const initials = model.identity.label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <a
      className="xp-balanced-three-zone__identity"
      href={model.identity.href ?? "#xp-marketing-content"}
      aria-label={model.identity.label}
      data-xp-balanced-three-zone-identity=""
    >
      <span aria-hidden="true">{initials || model.identity.shortLabel || "XP"}</span>
      <strong>{model.identity.label}</strong>
    </a>
  );
}

function AccountAction({ model }: { model: NavModel }) {
  const action = model.actions?.[0];
  if (!action || model.actions?.length !== 1) {
    throw new Error("marketing.three-zone requires exactly one account action.");
  }
  return (
    <a
      className="xp-balanced-three-zone__account-action"
      href={action.href ?? `#${action.id}`}
      data-action-id={action.id}
      data-xp-balanced-three-zone-account-action=""
    >
      {action.label}
    </a>
  );
}

function DestinationLink({ destination, activeId, renderIcon, tab = false }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  tab?: boolean;
}) {
  return (
    <a
      className="xp-balanced-three-zone__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-balanced-three-zone-tab={tab ? "" : undefined}
      data-xp-tab={tab ? "" : undefined}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <span className="xp-balanced-three-zone__destination-icon" data-icon-key={destination.icon} aria-hidden="true">
        {renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}
      </span>
      <span>{destination.label}</span>
    </a>
  );
}

function CompactNavigation({ model, activeId, deviceClass, renderIcon }: {
  model: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <nav
      className={`xp-balanced-three-zone__tabs xp-balanced-three-zone__tabs--${deviceClass.toLowerCase()}`}
      aria-label="Public access"
      data-xp-nav-renderer=""
      data-xp-balanced-three-zone-navigation=""
      data-xp-balanced-three-zone-tab-strip=""
      data-xp-region="navigation"
    >
      {destinationsByPriority(model).map((destination) => (
        <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />
      ))}
    </nav>
  );
}

function BalancedRank({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <nav
      className="xp-balanced-three-zone__rank"
      aria-label="Public access"
      data-xp-nav-renderer=""
      data-xp-balanced-three-zone-navigation=""
      data-xp-region="navigation"
    >
      <div className="xp-balanced-three-zone__leading" data-xp-balanced-three-zone-leading="">
        <Identity model={model} />
      </div>
      <div className="xp-balanced-three-zone__center" data-xp-balanced-three-zone-center="">
        {destinationsByPriority(model).map((destination) => (
          <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />
        ))}
      </div>
      <div className="xp-balanced-three-zone__trailing" data-xp-balanced-three-zone-trailing="">
        <AccountAction model={model} />
      </div>
    </nav>
  );
}

export function BalancedThreeZoneMarketingShell({
  nav,
  activeId,
  deviceClass,
  children,
  renderIcon,
  sourceSlug,
  sourcePreset,
}: BalancedThreeZoneMarketingShellProperties) {
  const destinations = destinationsByPriority(nav);
  if (nav.family !== "marketing" || destinations.length !== 4 || nav.actions?.length !== 1 || nav.utility?.length || nav.search) {
    throw new Error("marketing.three-zone requires four routes, one account action, and no search or utilities.");
  }
  const mobile = deviceClass === "M";
  const portraitTablet = deviceClass === "TP";
  return (
    <div
      className="xp-marketing-shell xp-balanced-three-zone"
      data-xp-shell=""
      data-xp-balanced-three-zone-shell=""
      data-shell-family="marketing"
      data-shell-anatomy="marketing.three-zone"
      data-device-class={deviceClass}
      data-variant={balancedThreeZoneForms[deviceClass]}
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-balanced-three-zone__top" data-xp-region="top">
        {mobile || portraitTablet ? (
          <>
            <div className="xp-balanced-three-zone__microbar" data-xp-balanced-three-zone-microbar="">
              <Identity model={nav} />
              <AccountAction model={nav} />
            </div>
            {portraitTablet ? <CompactNavigation model={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
          </>
        ) : <BalancedRank model={nav} activeId={activeId} renderIcon={renderIcon} />}
      </header>
      <main
        className="xp-marketing-shell__content xp-balanced-three-zone__content xp-slot"
        id="xp-marketing-content"
        tabIndex={-1}
        data-xp-balanced-three-zone-work-surface=""
        data-xp-region="content"
      >
        {children}
      </main>
      <div
        className="xp-marketing-shell__bottom xp-balanced-three-zone__bottom"
        data-xp-region="bottom"
        data-bottom-owner={mobile ? "tab-bar" : "none"}
      >
        {mobile ? <CompactNavigation model={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
      </div>
    </div>
  );
}
