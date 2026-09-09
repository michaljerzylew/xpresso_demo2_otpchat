"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

const centeredSplitForms: Readonly<Record<DeviceClass, "tab-bar" | "tabs" | "top-bar" | "mega-panel">> = {
  M: "tab-bar",
  TP: "tabs",
  TL: "top-bar",
  DS: "top-bar",
  DW: "mega-panel",
};

export type CenteredSplitMarketingShellProperties = {
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
      className="xp-centered-split__identity"
      href={model.identity.href ?? "#xp-marketing-content"}
      aria-label={model.identity.label}
      data-xp-centered-identity=""
    >
      <span aria-hidden="true">{initials || model.identity.shortLabel || model.identity.label.slice(0, 2).toUpperCase()}</span>
      <strong>{model.identity.label}</strong>
    </a>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="m15.2 15.2 4.6 4.6" />
    </svg>
  );
}

function SearchControl({ model }: { model: NavModel }) {
  if (!model.search) return null;
  const search = model.search;
  return (
    <AdaptiveOverlay
      intent="edit"
      presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "dialog", DW: "dialog" }}
      why="Catalog search stays bounded and labelled without displacing the centered navigation rank."
    >
      <AdaptiveOverlay.Trigger
        className="xp-centered-split__search-trigger"
        aria-label={`${search.label}: ${search.placeholder}`}
        data-xp-centered-search-trigger=""
      >
        <SearchGlyph />
        <span>{search.label}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-centered-split__search-overlay" data-xp-centered-search-overlay="">
        <AdaptiveOverlay.Header title={search.label} description={`Search within ${search.scope ?? model.identity.label}.`} />
        <AdaptiveOverlay.Body>
          <label className="xp-centered-split__search-field">
            <span>{search.label}</span>
            <input
              type="search"
              aria-label={search.label}
              placeholder={search.placeholder}
              enterKeyHint="search"
              autoFocus
              data-xp-centered-search-input=""
            />
          </label>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-centered-split__search-footer" data-xp-centered-search-footer="">
          <AdaptiveOverlay.Close
            className="xp-centered-split__search-close"
            style={{ minInlineSize: 44, minBlockSize: 44 }}
          >
            Close search
          </AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function DestinationIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <span className="xp-centered-split__destination-icon" data-icon-key={destination.icon} aria-hidden="true">
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
      className="xp-centered-split__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-centered-tab={tab ? "" : undefined}
      data-xp-tab={tab ? "" : undefined}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <DestinationIcon destination={destination} renderIcon={renderIcon} />
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
  const destinations = destinationsByPriority(model);
  return (
    <nav
      className={`xp-centered-split__tabs xp-centered-split__tabs--${deviceClass.toLowerCase()}`}
      aria-label="Primary navigation"
      data-xp-nav-renderer=""
      data-xp-centered-split-navigation=""
      data-xp-centered-tab-strip=""
      data-xp-region="navigation"
    >
      {destinations.map((destination) => (
        <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />
      ))}
    </nav>
  );
}

function CenteredRank({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  const destinations = destinationsByPriority(model);
  const leading = destinations.slice(0, 2);
  const trailing = destinations.slice(2, 4);
  return (
    <nav
      className="xp-centered-split__rank"
      aria-label="Primary navigation"
      data-xp-nav-renderer=""
      data-xp-centered-split-navigation=""
      data-xp-region="navigation"
    >
      <div className="xp-centered-split__side xp-centered-split__side--leading" data-xp-centered-leading="">
        {leading.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}
      </div>
      <Identity model={model} />
      <div className="xp-centered-split__side xp-centered-split__side--trailing" data-xp-centered-trailing="">
        {trailing.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}
      </div>
      <SearchControl model={model} />
    </nav>
  );
}

export function CenteredSplitMarketingShell({
  nav,
  activeId,
  deviceClass,
  children,
  renderIcon,
  sourceSlug,
  sourcePreset,
}: CenteredSplitMarketingShellProperties) {
  const mobile = deviceClass === "M";
  const portraitTablet = deviceClass === "TP";
  return (
    <div
      className="xp-marketing-shell xp-centered-split"
      data-xp-shell=""
      data-xp-centered-split-shell=""
      data-shell-family="marketing"
      data-shell-anatomy="marketing.centered-split"
      data-device-class={deviceClass}
      data-variant={centeredSplitForms[deviceClass]}
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-centered-split__top" data-xp-region="top">
        {mobile || portraitTablet ? (
          <>
            <div className="xp-centered-split__microbar" data-xp-centered-microbar="">
              <Identity model={nav} />
              <SearchControl model={nav} />
            </div>
            {portraitTablet ? <CompactNavigation model={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
          </>
        ) : <CenteredRank model={nav} activeId={activeId} renderIcon={renderIcon} />}
      </header>
      <main
        className="xp-marketing-shell__content xp-centered-split__content xp-slot"
        id="xp-marketing-content"
        tabIndex={-1}
        data-xp-centered-work-surface=""
        data-xp-region="content"
      >
        {children}
      </main>
      <div className="xp-marketing-shell__bottom xp-centered-split__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>
        {mobile ? <CompactNavigation model={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
      </div>
    </div>
  );
}
