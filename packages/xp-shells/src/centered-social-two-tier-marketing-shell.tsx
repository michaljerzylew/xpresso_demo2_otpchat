"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { destinationsByPriority, type NavDestination, type NavIconRenderer, type NavModel, type NavUtility } from "./nav-model";

const centeredSocialForms: Readonly<Record<DeviceClass, "centered-social-tabs" | "centered-social-strip" | "centered-social-touch-two-rank" | "centered-social-two-rank">> = {
  M: "centered-social-tabs",
  TP: "centered-social-strip",
  TL: "centered-social-touch-two-rank",
  DS: "centered-social-two-rank",
  DW: "centered-social-two-rank",
};

export type CenteredSocialTwoTierMarketingShellProperties = {
  nav: NavModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
};

function renderedIcon(icon: string, id: string, label: string, href: string, renderIcon?: NavIconRenderer) {
  const item: NavDestination = { id, label, href, icon, priority: 1 };
  return renderIcon?.(icon, item) ?? icon.slice(0, 1).toUpperCase();
}

function Identity({ model }: { model: NavModel }) {
  const initials = model.identity.label.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <a className="xp-centered-social__identity" href={model.identity.href ?? "#xp-marketing-content"} aria-label={model.identity.label} data-xp-centered-social-identity="">
      <span aria-hidden="true">{initials || model.identity.shortLabel || "XP"}</span>
      <strong>{model.identity.label}</strong>
    </a>
  );
}

function SearchGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15.2 15.2 4.6 4.6" /></svg>;
}

function DestinationLink({ destination, activeId, renderIcon, tab = false }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return (
    <a className="xp-centered-social__destination" href={destination.href} data-nav-id={destination.id} data-xp-centered-social-tab={tab ? "" : undefined} aria-current={destination.id === activeId ? "page" : undefined}>
      <span className="xp-centered-social__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>
      <span>{destination.label}</span>
    </a>
  );
}

function SocialLink({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  const href = utility.href ?? `#${utility.actionId ?? utility.id}`;
  return (
    <a className="xp-centered-social__utility" href={href} data-utility-id={utility.id}>
      <span className="xp-centered-social__icon" data-icon-key={utility.icon} aria-hidden="true">{renderedIcon(utility.icon, utility.id, utility.label, href, renderIcon)}</span>
      <span>{utility.label}</span>
    </a>
  );
}

function SearchOverlay({ model, deviceClass }: { model: NavModel; deviceClass: DeviceClass }) {
  if (!model.search) return null;
  return (
    <AdaptiveOverlay intent="edit" presentation={{ M: "full-screen", TP: "action-sheet" }} why="Compact centered-social search needs a real focused field without collapsing either navigation rank.">
      <AdaptiveOverlay.Trigger className="xp-centered-social__search-trigger" aria-label={`${model.search.label}: ${model.search.placeholder}`} data-xp-centered-social-search-trigger="">
        <SearchGlyph /><span>{deviceClass === "M" ? "Search" : model.search.label}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-centered-social__search-overlay" data-xp-centered-social-search-overlay="">
        <AdaptiveOverlay.Header title={model.search.label} description={`Search within ${model.search.scope ?? model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-centered-social__search-body">
          <label className="xp-centered-social__search-field"><span>{model.search.label}</span><input type="search" aria-label={model.search.label} placeholder={model.search.placeholder} enterKeyHint="search" autoFocus data-xp-centered-social-search-input="" /></label>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-centered-social__overlay-footer" data-xp-centered-social-search-footer=""><AdaptiveOverlay.Close className="xp-centered-social__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function InlineSearch({ model }: { model: NavModel }) {
  if (!model.search) return null;
  return (
    <label className="xp-centered-social__inline-search" data-xp-centered-social-inline-search="">
      <span>{model.search.label}</span><div><SearchGlyph /><input type="search" aria-label={model.search.label} placeholder={model.search.placeholder} enterKeyHint="search" data-xp-centered-social-search-input="" /></div>
    </label>
  );
}

function SocialOverlay({ model, utilities, renderIcon }: { model: NavModel; utilities: readonly NavUtility[]; renderIcon?: NavIconRenderer }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ TP: "action-sheet" }} why="Portrait tablet keeps the social rank in one bounded named surface while primary routes stay in the snap strip.">
      <AdaptiveOverlay.Trigger className="xp-centered-social__social-trigger" aria-label="Open Public Channels" data-xp-centered-social-social-trigger=""><span aria-hidden="true">•••</span><strong>Public Channels</strong></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-centered-social__social-overlay" data-xp-centered-social-social-overlay="">
        <AdaptiveOverlay.Header title="Public Channels" description={`Public notes from ${model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-centered-social__overlay-list">{utilities.map((utility) => <SocialLink key={utility.id} utility={utility} renderIcon={renderIcon} />)}</AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-centered-social__overlay-footer" data-xp-centered-social-social-footer=""><AdaptiveOverlay.Close className="xp-centered-social__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close channels</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function MoreOverlay({ model, destinations, utilities, activeId, renderIcon }: { model: NavModel; destinations: readonly NavDestination[]; utilities: readonly NavUtility[]; activeId: string; renderIcon?: NavIconRenderer }) {
  const primaryLabel = model.groups?.[0]?.label ?? "Primary Areas";
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="Phone keeps the remaining primary routes and the complete social rank in separate thumb-reachable sections.">
      <AdaptiveOverlay.Trigger className="xp-centered-social__more-trigger" aria-label="Open more navigation" data-xp-centered-social-more-trigger=""><span aria-hidden="true"><i /><i /><i /></span><strong>More</strong></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-centered-social__more-overlay" data-xp-centered-social-more-overlay="">
        <AdaptiveOverlay.Header title="More navigation" description={`Additional routes and public notes from ${model.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-centered-social__more-body">
          <section aria-labelledby="xp-centered-social-primary-rank"><h2 id="xp-centered-social-primary-rank">{primaryLabel}</h2>{destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}</section>
          <section aria-labelledby="xp-centered-social-public-rank"><h2 id="xp-centered-social-public-rank">Public Channels</h2>{utilities.map((utility) => <SocialLink key={utility.id} utility={utility} renderIcon={renderIcon} />)}</section>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-centered-social__overlay-footer" data-xp-centered-social-more-footer=""><AdaptiveOverlay.Close className="xp-centered-social__overlay-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function SocialRank({ utilities, renderIcon }: { utilities: readonly NavUtility[]; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-centered-social__social-rank" aria-label="Public Channels" data-xp-centered-social-utility-rank="">{utilities.map((utility) => <SocialLink key={utility.id} utility={utility} renderIcon={renderIcon} />)}</nav>;
}

function PrimaryRank({ destinations, activeId, renderIcon, strip = false }: { destinations: readonly NavDestination[]; activeId: string; renderIcon?: NavIconRenderer; strip?: boolean }) {
  return <nav className={strip ? "xp-centered-social__primary-strip" : "xp-centered-social__primary-rank"} aria-label="Primary Areas" data-xp-centered-social-primary-rank="" data-xp-scroll={strip ? "horizontal" : undefined}>{destinations.map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab={strip} />)}</nav>;
}

export function CenteredSocialTwoTierMarketingShell({ nav, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: CenteredSocialTwoTierMarketingShellProperties) {
  const destinations = destinationsByPriority(nav);
  const utilities = nav.utility ?? [];
  if (nav.family !== "two-tier" || destinations.length !== 6 || utilities.length !== 3 || nav.actions?.length || !nav.search) throw new Error("two-tier.centered-social requires six primary routes, three social utilities, search, and no actions.");
  const mobile = deviceClass === "M";
  const portraitTablet = deviceClass === "TP";
  return (
    <div className="xp-marketing-shell xp-centered-social" data-xp-shell="" data-xp-centered-social-shell="" data-shell-family="two-tier" data-shell-anatomy="marketing.two-tier.centered-social" data-device-class={deviceClass} data-variant={centeredSocialForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-centered-social__top" data-xp-region="top">
        <div data-xp-nav-renderer="" data-xp-centered-social-navigation="">
          {mobile ? <div className="xp-centered-social__microbar"><Identity model={nav} /><SearchOverlay model={nav} deviceClass={deviceClass} /></div>
            : portraitTablet ? <><div className="xp-centered-social__upper-rank"><SocialOverlay model={nav} utilities={utilities} renderIcon={renderIcon} /><Identity model={nav} /><SearchOverlay model={nav} deviceClass={deviceClass} /></div><PrimaryRank destinations={destinations} activeId={activeId} renderIcon={renderIcon} strip /></>
              : <><div className="xp-centered-social__upper-rank"><SocialRank utilities={utilities} renderIcon={renderIcon} /><Identity model={nav} /><InlineSearch model={nav} /></div><PrimaryRank destinations={destinations} activeId={activeId} renderIcon={renderIcon} /></>}
        </div>
      </header>
      <main className="xp-marketing-shell__content xp-centered-social__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-centered-social-work-surface="" data-xp-region="content">{children}</main>
      <div className="xp-marketing-shell__bottom xp-centered-social__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>{mobile ? <nav className="xp-centered-social__bottom-tabs" aria-label="Primary Areas" data-xp-centered-social-primary-rank="">{destinations.slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} tab />)}<MoreOverlay model={nav} destinations={destinations.slice(4)} utilities={utilities} activeId={activeId} renderIcon={renderIcon} /></nav> : null}</div>
    </div>
  );
}
