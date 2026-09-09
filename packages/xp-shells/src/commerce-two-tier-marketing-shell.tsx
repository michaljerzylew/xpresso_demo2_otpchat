"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel, type NavUtility } from "./nav-model";

const commerceForms: Readonly<Record<DeviceClass, "commerce-tabs" | "commerce-strip" | "commerce-rank" | "commerce-two-rank">> = {
  M: "commerce-tabs",
  TP: "commerce-strip",
  TL: "commerce-rank",
  DS: "commerce-two-rank",
  DW: "commerce-two-rank",
};

export type CommerceTwoTierMarketingShellProperties = {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
};

function iconNode(icon: string, id: string, label: string, href: string, renderIcon?: NavIconRenderer) {
  const destination: NavDestination = { id, label, href, icon, priority: 1 };
  return renderIcon?.(icon, destination) ?? icon.slice(0, 1).toUpperCase();
}

function Identity({ model }: { model: NavModel }) {
  const initials = model.identity.label.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <a className="xp-commerce-nav__identity" href={model.identity.href ?? "#xp-marketing-content"} aria-label={model.identity.label} data-xp-commerce-identity="">
      <span aria-hidden="true">{initials || model.identity.shortLabel || "XP"}</span>
      <strong>{model.identity.label}</strong>
    </a>
  );
}

function SearchGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15.2 15.2 4.6 4.6" /></svg>;
}

function SearchOverlay({ model, deviceClass }: { model: NavModel; deviceClass: DeviceClass }) {
  if (!model.search) return null;
  return (
    <AdaptiveOverlay
      intent="edit"
      presentation={{ M: "full-screen", TP: "action-sheet" }}
      why="Phone and portrait tablet commerce search needs a focused takeover rather than a dead icon."
    >
      <AdaptiveOverlay.Trigger className="xp-commerce-nav__search-trigger" aria-label={`${model.search.label}: ${model.search.placeholder}`} data-xp-commerce-search-trigger="">
        <SearchGlyph /><span>{deviceClass === "M" ? "Search" : model.search.label}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-nav__search-overlay" data-xp-commerce-search-overlay="">
        <AdaptiveOverlay.Header title={model.search.label} description={`Search within ${model.search.scope ?? model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-commerce-nav__search-body">
          <label className="xp-commerce-nav__search-field">
            <span>{model.search.label}</span>
            <input type="search" aria-label={model.search.label} placeholder={model.search.placeholder} enterKeyHint="search" autoFocus data-xp-commerce-search-input="" />
          </label>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-commerce-nav__overlay-footer" data-xp-commerce-search-footer="">
          <AdaptiveOverlay.Close className="xp-commerce-nav__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close search</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function InlineSearch({ model }: { model: NavModel }) {
  if (!model.search) return null;
  return (
    <label className="xp-commerce-nav__inline-search" data-xp-commerce-inline-search="">
      <SearchGlyph />
      <span>{model.search.label}</span>
      <input type="search" aria-label={model.search.label} placeholder={model.search.placeholder} enterKeyHint="search" data-xp-commerce-search-input="" />
    </label>
  );
}

function DestinationLink({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return (
    <a className="xp-commerce-nav__destination" href={destination.href} data-nav-id={destination.id} data-xp-commerce-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}>
      <span className="xp-commerce-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>
      <span>{destination.label}</span>
    </a>
  );
}

function UtilityLink({ utility, renderIcon, basket = false }: { utility: NavUtility; renderIcon?: NavIconRenderer; basket?: boolean }) {
  const href = utility.href ?? `#${utility.actionId ?? utility.id}`;
  return (
    <a className={`xp-commerce-nav__utility${basket ? " xp-commerce-nav__utility--basket" : ""}`} href={href} data-utility-id={utility.id} data-xp-commerce-account={basket ? undefined : utility.icon === "user" ? "" : undefined} data-xp-commerce-basket={basket ? "" : undefined}>
      <span className="xp-commerce-nav__icon" data-icon-key={utility.icon} aria-hidden="true">{iconNode(utility.icon, utility.id, utility.label, href, renderIcon)}</span>
      <span>{utility.label}</span>
      {utility.badge ? <span className="xp-commerce-nav__badge" aria-label={utility.badge.label} data-xp-commerce-badge="">{utility.badge.value}</span> : null}
    </a>
  );
}

function UtilityOverlay({ model, utilities, renderIcon, deviceClass }: { model: NavModel; utilities: readonly NavUtility[]; renderIcon?: NavIconRenderer; deviceClass: DeviceClass }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ TP: "action-sheet", TL: "popover" }} why="Informational commerce routes keep a named rank without crowding the touch header.">
      <AdaptiveOverlay.Trigger className="xp-commerce-nav__info-trigger" aria-label="Open informational links" data-xp-commerce-info-trigger="">
        <span aria-hidden="true">i</span><strong>{deviceClass === "TL" ? "Info" : "Information"}</strong>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-nav__info-overlay" data-xp-commerce-info-overlay="">
        <AdaptiveOverlay.Header title="Informational Links" description={`Guides and notes from ${model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-commerce-nav__overlay-list">
          {utilities.map((utility) => <UtilityLink key={utility.id} utility={utility} renderIcon={renderIcon} />)}
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-commerce-nav__overlay-footer" data-xp-commerce-info-footer="">
          <AdaptiveOverlay.Close className="xp-commerce-nav__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close information</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function MoreOverlay({ model, destination, information, basket, activeId, renderIcon }: { model: NavModel; destination: NavDestination; information: readonly NavUtility[]; basket: NavUtility; activeId: string; renderIcon?: NavIconRenderer }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="The final shopping route and informational rank need a bounded thumb-reachable sheet on phone.">
      <AdaptiveOverlay.Trigger className="xp-commerce-nav__more-trigger" aria-label="Open more navigation" data-xp-commerce-more-trigger="">
        <span aria-hidden="true"><i /><i /><i /></span><strong>More</strong>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-nav__more-overlay" data-xp-commerce-more-overlay="">
        <AdaptiveOverlay.Header title="More navigation" description={`Additional routes for ${model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-commerce-nav__more-body">
          <section aria-labelledby="xp-commerce-shopping-rank"><h2 id="xp-commerce-shopping-rank">Catalog Navigation</h2><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} /></section>
          <section aria-labelledby="xp-commerce-information-rank"><h2 id="xp-commerce-information-rank">Informational Links</h2>{information.map((utility) => <UtilityLink key={utility.id} utility={utility} renderIcon={renderIcon} />)}</section>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-commerce-nav__overlay-footer" data-xp-commerce-more-footer="">
          <UtilityLink utility={basket} renderIcon={renderIcon} basket />
          <AdaptiveOverlay.Close className="xp-commerce-nav__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close navigation</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

export function CommerceTwoTierMarketingShell({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: CommerceTwoTierMarketingShellProperties) {
  const destinations = destinationsByPriority(nav);
  const utility = nav.utility ?? [];
  const information = utility.slice(0, 3);
  const account = utility.find((item) => item.icon === "user") ?? utility[3];
  const basket = utility.find((item) => item.badge) ?? utility[4];
  if (nav.family !== "two-tier" || destinations.length !== 4 || information.length !== 3 || !account || !basket?.badge || nav.actions?.length) throw new Error("two-tier.commerce requires four primary routes, three information links, account, badged basket, and no actions.");

  const mobile = deviceClass === "M";
  const portraitTablet = deviceClass === "TP";
  const landscapeTablet = deviceClass === "TL";
  return (
    <div className="xp-marketing-shell xp-commerce-two-tier" data-xp-shell="" data-xp-commerce-two-tier-shell="" data-shell-family="two-tier" data-shell-anatomy="marketing.two-tier.commerce" data-device-class={deviceClass} data-variant={commerceForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-commerce-nav__top" data-xp-region="top">
        <div data-xp-nav-renderer="" data-xp-commerce-navigation="">
          {mobile ? (
            <div className="xp-commerce-nav__microbar" data-xp-commerce-microbar=""><Identity model={nav} /><SearchOverlay model={nav} deviceClass={deviceClass} /><UtilityLink utility={account} renderIcon={renderIcon} /></div>
          ) : portraitTablet ? (
            <><div className="xp-commerce-nav__microbar" data-xp-commerce-microbar=""><Identity model={nav} /><SearchOverlay model={nav} deviceClass={deviceClass} /><UtilityLink utility={account} renderIcon={renderIcon} /><UtilityLink utility={basket} renderIcon={renderIcon} basket /><UtilityOverlay model={nav} utilities={information} renderIcon={renderIcon} deviceClass={deviceClass} /></div><nav className="xp-commerce-nav__primary-strip" aria-label="Catalog Navigation" data-xp-commerce-primary-rank="">{destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}</nav></>
          ) : landscapeTablet ? (
            <nav className="xp-commerce-nav__consolidated" aria-label="Catalog Navigation" data-xp-commerce-primary-rank=""><Identity model={nav} />{destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}<InlineSearch model={nav} /><UtilityLink utility={account} renderIcon={renderIcon} /><UtilityLink utility={basket} renderIcon={renderIcon} basket /><UtilityOverlay model={nav} utilities={information} renderIcon={renderIcon} deviceClass={deviceClass} /></nav>
          ) : (
            <><div className="xp-commerce-nav__utility-rank" data-xp-commerce-utility-rank=""><nav aria-label="Informational Links">{information.map((item) => <UtilityLink key={item.id} utility={item} renderIcon={renderIcon} />)}</nav><div><InlineSearch model={nav} /><UtilityLink utility={account} renderIcon={renderIcon} /><UtilityLink utility={basket} renderIcon={renderIcon} basket /></div></div><nav className="xp-commerce-nav__primary-rank" aria-label="Catalog Navigation" data-xp-commerce-primary-rank=""><Identity model={nav} /><div>{destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}</div></nav></>
          )}
        </div>
      </header>
      <main className="xp-marketing-shell__content xp-commerce-nav__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-commerce-work-surface="" data-xp-region="content">{children}</main>
      <div className="xp-marketing-shell__bottom xp-commerce-nav__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>
        {mobile ? <nav className="xp-commerce-nav__bottom-tabs" aria-label="Catalog Navigation" data-xp-commerce-primary-rank="">{destinations.slice(0, 3).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}<UtilityLink utility={basket} renderIcon={renderIcon} basket /><MoreOverlay model={nav} destination={destinations[3]} information={information} basket={basket} activeId={activeId} renderIcon={renderIcon} /></nav> : null}
      </div>
    </div>
  );
}
