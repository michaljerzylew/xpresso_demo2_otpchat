"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavAction,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
  type NavUtility,
} from "./nav-model";

const centeredCommerceForms = {
  M: "commerce-bottom-tabs",
  TP: "commerce-portrait-strip",
  TL: "commerce-touch-rank",
  DS: "commerce-three-zone",
  DW: "commerce-bounded-three-zone",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type CenteredCommerceReachability = {
  id: string;
  kind: "destination" | "action" | "cart";
  taps: 1 | 2;
  surface: "bottom-tabs" | "more-sheet" | "route-strip" | "command";
};

export function centeredCommerceReachability(nav: NavModel, deviceClass: DeviceClass): CenteredCommerceReachability[] {
  const destinations = destinationsByPriority(nav);
  if (deviceClass === "M") {
    return [
      ...destinations.slice(0, 3).map(({ id }) => ({ id, kind: "destination" as const, taps: 1 as const, surface: "bottom-tabs" as const })),
      ...destinations.slice(3).map(({ id }) => ({ id, kind: "destination" as const, taps: 2 as const, surface: "more-sheet" as const })),
      ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "cart" as const, taps: 1 as const, surface: "bottom-tabs" as const })),
      ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, taps: 2 as const, surface: "more-sheet" as const })),
    ];
  }
  const routeSurface = deviceClass === "TP" ? "route-strip" as const : "command" as const;
  return [
    ...destinations.map(({ id }) => ({ id, kind: "destination" as const, taps: 1 as const, surface: routeSurface })),
    ...(nav.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, taps: 1 as const, surface: "command" as const })),
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "cart" as const, taps: 1 as const, surface: "command" as const })),
  ];
}

function renderedUtilityIcon(utility: NavUtility, renderIcon?: NavIconRenderer) {
  const destination: NavDestination = {
    id: utility.id,
    label: utility.label,
    href: utility.href ?? `#${utility.id}`,
    icon: utility.icon,
    priority: 1,
  };
  return renderIcon?.(utility.icon, destination) ?? utility.icon.slice(0, 1).toUpperCase();
}

function Identity({ nav }: { nav: NavModel }) {
  const mark = nav.identity.label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <a className="xp-centered-commerce__identity" href={nav.identity.href ?? "#xp-marketing-content"} aria-label={nav.identity.label} data-xp-centered-commerce-identity="">
      <span aria-hidden="true">{mark || "EA"}</span>
      <strong>{nav.identity.label}</strong>
    </a>
  );
}

function Destination({ destination, renderIcon, tab = false }: { destination: NavDestination; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return (
    <a className="xp-centered-commerce__destination" href={destination.href} data-nav-id={destination.id} data-xp-centered-commerce-tab={tab ? "" : undefined} data-xp-tab={tab ? "" : undefined}>
      <span className="xp-centered-commerce__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>
      <span>{destination.label}</span>
    </a>
  );
}

function Action({ action }: { action: NavAction }) {
  return <a className={`xp-centered-commerce__action xp-centered-commerce__action--${action.kind}`} href={action.href ?? `#${action.actionId ?? action.id}`} data-action-id={action.id} data-action-kind={action.kind} data-xp-centered-commerce-action="">{action.label}</a>;
}

function Actions({ nav }: { nav: NavModel }) {
  return <div className="xp-centered-commerce__actions" data-xp-centered-commerce-actions="">{(nav.actions ?? []).map((action) => <Action key={action.id} action={action} />)}</div>;
}

function Cart({ utility, renderIcon, tab = false }: { utility: NavUtility; renderIcon?: NavIconRenderer; tab?: boolean }) {
  return (
    <a className="xp-centered-commerce__cart" href={utility.href ?? `#${utility.id}`} data-utility-id={utility.id} data-xp-centered-commerce-cart="" data-xp-centered-commerce-tab={tab ? "" : undefined} data-xp-tab={tab ? "" : undefined}>
      <span className="xp-centered-commerce__icon" data-icon-key={utility.icon} aria-hidden="true">{renderedUtilityIcon(utility, renderIcon)}</span>
      <span>{utility.label}</span>
      {utility.badge ? <span className="xp-centered-commerce__badge" aria-label={utility.badge.label} data-xp-centered-commerce-badge="">{utility.badge.value}</span> : null}
    </a>
  );
}

function More({ nav, destination, renderIcon }: { nav: NavModel; destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet" }} why="Phone keeps the final catalog route and both account actions in one bounded labelled sheet.">
      <AdaptiveOverlay.Trigger className="xp-centered-commerce__more-trigger" aria-label="Open more navigation" data-xp-centered-commerce-more-trigger="">
        <span aria-hidden="true"><i /><i /><i /></span>
        <strong>More</strong>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-centered-commerce__more-overlay" data-xp-centered-commerce-more-overlay="">
        <AdaptiveOverlay.Header title="More navigation" description={`Additional catalog and account routes for ${nav.identity.label}.`} />
        <AdaptiveOverlay.Body className="xp-centered-commerce__more-body" data-xp-centered-commerce-more-body="">
          <section aria-labelledby="xp-centered-commerce-extra-route">
            <h2 id="xp-centered-commerce-extra-route">Catalog route</h2>
            <Destination destination={destination} renderIcon={renderIcon} />
          </section>
          <section aria-labelledby="xp-centered-commerce-account-routes">
            <h2 id="xp-centered-commerce-account-routes">Account access</h2>
            <Actions nav={nav} />
          </section>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-centered-commerce__more-footer" data-xp-centered-commerce-more-footer="">
          <AdaptiveOverlay.Close className="xp-centered-commerce__more-close" style={{ minInlineSize: 44, minBlockSize: 44 }}>Close navigation</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function RouteStrip({ nav, renderIcon }: { nav: NavModel; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-centered-commerce__route-strip" aria-label={nav.groups?.[0]?.label ?? "Main navigation"} data-xp-centered-commerce-route-rank="">{destinationsByPriority(nav).map((destination) => <Destination key={destination.id} destination={destination} renderIcon={renderIcon} tab />)}</nav>;
}

function CompleteRank({ nav, cart, renderIcon }: { nav: NavModel; cart: NavUtility; renderIcon?: NavIconRenderer }) {
  return (
    <nav className="xp-centered-commerce__rank" aria-label={nav.groups?.[0]?.label ?? "Main navigation"} data-xp-centered-commerce-command-rank="">
      <div className="xp-centered-commerce__leading" data-xp-centered-commerce-leading="">{destinationsByPriority(nav).map((destination) => <Destination key={destination.id} destination={destination} renderIcon={renderIcon} />)}</div>
      <Identity nav={nav} />
      <div className="xp-centered-commerce__trailing" data-xp-centered-commerce-trailing=""><Actions nav={nav} /><Cart utility={cart} renderIcon={renderIcon} /></div>
    </nav>
  );
}

export function CenteredCommerceMarketingShell({ nav, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: { nav: NavModel; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; sourceSlug?: string; sourcePreset?: string }) {
  const destinations = destinationsByPriority(nav);
  const groupIds = nav.groups?.[0]?.destinationIds ?? [];
  const actions = nav.actions ?? [];
  const utility = nav.utility ?? [];
  const cart = utility[0];
  const expectedDestinationIds = ["route-catalog", "route-orders", "route-terms", "route-specs"];
  const valid = nav.family === "marketing"
    && destinations.length === 4
    && destinations.map(({ id }) => id).join("/") === expectedDestinationIds.join("/")
    && destinations.every(({ children, badge, href, icon }) => !children?.length && !badge && href?.startsWith("#") && Boolean(icon))
    && nav.groups?.length === 1
    && groupIds.join("/") === expectedDestinationIds.join("/")
    && actions.length === 2
    && actions[0]?.id === "action-access"
    && actions[0]?.kind === "secondary"
    && actions[1]?.id === "action-create"
    && actions[1]?.kind === "primary"
    && utility.length === 1
    && cart?.id === "util-order-bag"
    && cart.icon === "shopping-bag"
    && cart.href === "#order-bag"
    && cart.badge?.value === 3
    && cart.badge.label === "three items in order bag"
    && !nav.search
    && !nav.widgets?.length;
  if (!valid || !cart) throw new Error("marketing.centered-commerce requires four direct grouped routes, two ordered account actions, and one last-position badged Order Bag utility only.");

  const mobile = deviceClass === "M";
  const portrait = deviceClass === "TP";
  return (
    <div className="xp-marketing-shell xp-centered-commerce" data-xp-shell="" data-xp-centered-commerce-shell="" data-xp-nav-renderer="" data-shell-family="marketing" data-shell-anatomy="marketing.centered-commerce" data-device-class={deviceClass} data-variant={centeredCommerceForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-marketing-content">Skip to content</a>
      <header className="xp-centered-commerce__top" data-xp-region="top">
        {mobile ? <div className="xp-centered-commerce__microbar" data-xp-centered-commerce-command-rank=""><Identity nav={nav} /></div>
          : portrait ? <><div className="xp-centered-commerce__microbar" data-xp-centered-commerce-command-rank=""><Identity nav={nav} /><div className="xp-centered-commerce__trailing"><Actions nav={nav} /><Cart utility={cart} renderIcon={renderIcon} /></div></div><RouteStrip nav={nav} renderIcon={renderIcon} /></>
            : <CompleteRank nav={nav} cart={cart} renderIcon={renderIcon} />}
      </header>
      <main className="xp-marketing-shell__content xp-centered-commerce__content xp-slot" id="xp-marketing-content" tabIndex={-1} data-xp-centered-commerce-work-surface="" data-xp-region="content">{children}</main>
      <div className="xp-marketing-shell__bottom xp-centered-commerce__bottom" data-xp-region="bottom" data-bottom-owner={mobile ? "tab-bar" : "none"}>
        {mobile ? <nav className="xp-centered-commerce__bottom-tabs" aria-label={nav.groups?.[0]?.label ?? "Main navigation"} data-xp-centered-commerce-bottom-rank="">{destinations.slice(0, 3).map((destination) => <Destination key={destination.id} destination={destination} renderIcon={renderIcon} tab />)}<Cart utility={cart} renderIcon={renderIcon} tab /><More nav={nav} destination={destinations[3]} renderIcon={renderIcon} /></nav> : null}
      </div>
    </div>
  );
}
