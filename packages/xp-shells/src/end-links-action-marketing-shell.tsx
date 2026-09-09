"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

const endLinksActionForms: Readonly<Record<DeviceClass, "action-sheet" | "tabs" | "top-bar">> = {
  M: "action-sheet",
  TP: "tabs",
  TL: "top-bar",
  DS: "top-bar",
  DW: "top-bar",
};

export type EndLinksActionMarketingShellProperties = {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
};

function Identity({ model }: { model: NavModel }) {
  const initials = model.identity.label.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <a
      className="xp-end-links__identity"
      href={model.identity.href ?? "#xp-marketing-content"}
      aria-label={model.identity.label}
      data-xp-end-links-identity=""
    >
      <span aria-hidden="true">{initials || model.identity.shortLabel || model.identity.label.slice(0, 2).toUpperCase()}</span>
      <strong>{model.identity.label}</strong>
    </a>
  );
}

function DestinationIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <span className="xp-end-links__destination-icon" data-icon-key={destination.icon} aria-hidden="true">
      {renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}
    </span>
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
      className="xp-end-links__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-end-links-tab={tab ? "" : undefined}
      data-xp-tab={tab ? "" : undefined}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <DestinationIcon destination={destination} renderIcon={renderIcon} />
      <span>{destination.label}</span>
    </a>
  );
}

function AccountAction({ model }: { model: NavModel }) {
  const action = model.actions?.[0];
  if (!action || model.actions?.length !== 1) {
    throw new Error("marketing.end-links-action requires exactly one account action.");
  }
  return (
    <a
      className="xp-end-links__account-action"
      href={action.href ?? `#${action.id}`}
      data-action-id={action.id}
      data-xp-end-links-account-action=""
    >
      {action.label}
    </a>
  );
}

function CompactSheet({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  const destinations = destinationsByPriority(model);
  return (
    <AdaptiveOverlay
      intent="menu"
      presentation={{ M: "action-sheet" }}
      why="The source mobile header amputates its end links, so a bounded action sheet restores the four routes while the account action stays explicit in the microbar."
    >
      <AdaptiveOverlay.Trigger
        className="xp-end-links__nav-trigger"
        aria-label="Open public navigation"
        data-xp-nav-renderer=""
        data-xp-end-links-overlay-trigger=""
      >
        <span aria-hidden="true"><i /><i /><i /></span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-end-links__overlay" data-xp-end-links-overlay="">
        <AdaptiveOverlay.Header title="Public navigation" description={`Choose a destination in ${model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-end-links__overlay-body" data-xp-end-links-overlay-scroll="">
          <nav className="xp-end-links__overlay-navigation" aria-label="Primary navigation" data-xp-end-links-navigation="">
            {destinations.map((destination) => (
              <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />
            ))}
          </nav>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-end-links__overlay-footer" data-xp-end-links-overlay-footer="">
          <AdaptiveOverlay.Close className="xp-end-links__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>
            Close navigation
          </AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function TabletNavigation({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <nav
      className="xp-end-links__tab-strip"
      aria-label="Primary navigation"
      data-xp-nav-renderer=""
      data-xp-end-links-navigation=""
      data-xp-end-links-tab-strip=""
      data-xp-region="navigation"
    >
      {destinationsByPriority(model).map((destination) => (
        <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />
      ))}
    </nav>
  );
}

function EndLinksRank({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <nav
      className="xp-end-links__rank"
      aria-label="Primary navigation"
      data-xp-nav-renderer=""
      data-xp-end-links-navigation=""
      data-xp-region="navigation"
    >
      <Identity model={model} />
      <div className="xp-end-links__cluster" data-xp-end-links-cluster="">
        {destinationsByPriority(model).map((destination) => (
          <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />
        ))}
      </div>
      <span className="xp-end-links__divider" aria-hidden="true" data-xp-end-links-divider="" />
      <AccountAction model={model} />
    </nav>
  );
}

export function EndLinksActionMarketingShell({
  nav,
  activeId,
  deviceClass,
  children,
  renderIcon,
  sourceSlug,
  sourcePreset,
}: EndLinksActionMarketingShellProperties) {
  const mobile = deviceClass === "M";
  const portraitTablet = deviceClass === "TP";
  return (
    <div
      className="xp-marketing-shell xp-end-links"
      data-xp-shell=""
      data-xp-end-links-shell=""
      data-shell-family="marketing"
      data-shell-anatomy="marketing.end-links-action"
      data-device-class={deviceClass}
      data-variant={endLinksActionForms[deviceClass]}
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-end-links__top" data-xp-region="top">
        {mobile ? (
          <div className="xp-end-links__microbar" data-xp-end-links-microbar="">
            <Identity model={nav} />
            <AccountAction model={nav} />
            <CompactSheet model={nav} activeId={activeId} renderIcon={renderIcon} />
          </div>
        ) : portraitTablet ? (
          <>
            <div className="xp-end-links__microbar" data-xp-end-links-microbar="">
              <Identity model={nav} />
              <AccountAction model={nav} />
            </div>
            <TabletNavigation model={nav} activeId={activeId} renderIcon={renderIcon} />
          </>
        ) : <EndLinksRank model={nav} activeId={activeId} renderIcon={renderIcon} />}
      </header>
      <main
        className="xp-marketing-shell__content xp-end-links__content xp-slot"
        id="xp-marketing-content"
        tabIndex={-1}
        data-xp-end-links-work-surface=""
        data-xp-region="content"
      >
        {children}
      </main>
      <div className="xp-marketing-shell__bottom xp-end-links__bottom" data-xp-region="bottom" data-bottom-owner="none" />
    </div>
  );
}
