"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  AppBarActionControl,
  AppBarSearchControl,
  type AppBarModel,
  type AppBarProperties,
  type BreadcrumbItem,
} from "./app-bar";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
  type ShellFixtureCommercePanels,
  type ShellFixtureUtilityGroup,
} from "./nav-model";

export type CommerceMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
};

export type CommerceFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type CommercePageBandModel = {
  title: string;
  subtitle: string;
  breadcrumb: readonly BreadcrumbItem[];
  metrics: readonly CommerceMetric[];
  footerLinks?: readonly CommerceFooterLink[];
};

export type CommerceContextModel = {
  panels: ShellFixtureCommercePanels;
  profile: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
    avatarAssetId?: string;
    avatarSrc?: string;
  };
  accountGroups: readonly ShellFixtureUtilityGroup[];
};

export type CommerceReachability = {
  id: string;
  kind: "destination" | "action";
  parentId?: string;
  surface: "commerce-drawer" | "commerce-top-nav" | "commerce-popover" | "commerce-actions";
};

export function commerceReachability(model: NavModel, appBar: AppBarModel, deviceClass: DeviceClass): CommerceReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(model).flatMap((destination): CommerceReachability[] => {
      const surface = compact
        ? "commerce-drawer" as const
        : destination.children?.length ? "commerce-popover" as const : "commerce-top-nav" as const;
      return [
        { id: destination.id, kind: "destination", surface },
        ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, parentId: destination.id, surface })),
      ];
    }),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "commerce-actions" as const })),
  ];
}

function CommerceDestinationIcon({ destination, renderIcon }: {
  destination: NavDestination;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <span className="xp-shell-nav__icon" aria-hidden="true" data-icon-key={destination.icon}>
      {renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}
    </span>
  );
}

function CommerceDestinationLink({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <a
      className="xp-commerce-nav__destination"
      href={destination.href}
      data-nav-id={destination.id}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <CommerceDestinationIcon destination={destination} renderIcon={renderIcon} />
      <span>{destination.label}</span>
    </a>
  );
}

function CommerceChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return (
    <a href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>
      <strong>{child.label}</strong>
      {child.description ? <small>{child.description}</small> : null}
    </a>
  );
}

function CommerceBranchMenu({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay intent="menu">
      <AdaptiveOverlay.Trigger
        className="xp-commerce-nav__destination xp-commerce-nav__branch"
        aria-label={`Open ${destination.label} categories`}
        aria-current={destination.id === activeId ? "page" : undefined}
        data-nav-id={destination.id}
        data-xp-commerce-branch-trigger=""
      >
        <CommerceDestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        <span aria-hidden="true">⌄</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-commerce-branch-overlay="" data-branch-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`Browse ${destination.label}.`} />
        <AdaptiveOverlay.Body>
          <ul className="xp-commerce-nav__children">
            {destination.children?.map((child) => <li key={child.id}><CommerceChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}
          </ul>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommerceDrawerGroups({ model, activeId, renderIcon }: {
  model: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  const destinations = destinationsByPriority(model);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const groupedIds = new Set((model.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [
    ...(model.groups ?? []).map((group) => ({
      id: group.id,
      label: group.label,
      destinations: group.destinationIds.map((id) => byId.get(id)).filter((value): value is NavDestination => Boolean(value)),
    })),
    { id: "ungrouped", label: "Catalog", destinations: destinations.filter(({ id }) => !groupedIds.has(id)) },
  ].filter(({ destinations: members }) => members.length);
  return (
    <div className="xp-commerce-nav__drawer-groups">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`xp-commerce-drawer-${group.id}`}>
          <h2 id={`xp-commerce-drawer-${group.id}`}>{group.label}</h2>
          <ul>
            {group.destinations.map((destination) => (
              <li key={destination.id} data-xp-commerce-row="" data-commerce-row-id={destination.id}>
                {destination.children?.length ? (
                  <details open={destination.children.some(({ id }) => id === activeId)} data-nav-id={destination.id} data-xp-commerce-disclosure="">
                    <summary aria-current={destination.id === activeId ? "page" : undefined}>
                      <CommerceDestinationIcon destination={destination} renderIcon={renderIcon} />
                      <span>{destination.label}</span>
                      <span aria-hidden="true">⌄</span>
                    </summary>
                    <ul>{destination.children.map((child) => <li key={child.id}><CommerceChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul>
                  </details>
                ) : <CommerceDestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function CommerceTopNavigation({ model, appBar, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: {
  model: NavModel;
  appBar: AppBarModel;
  activeId: string;
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: (actionId: string) => void;
}) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const destinations = destinationsByPriority(model);
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  return (
    <header
      className="xp-commerce-nav"
      data-xp-commerce-nav=""
      data-xp-nav-renderer=""
      data-xp-region="top"
      data-device-class={deviceClass}
      data-variant={compact ? "commerce-compact" : "commerce-top"}
    >
      {compact ? (
        <nav aria-label="Commerce navigation" data-xp-region="navigation">
          <AdaptiveOverlay
            intent="menu"
            presentation={{ M: "action-sheet", TP: "action-sheet" }}
            why="Long commerce navigation keeps a scrolling body and persistent close footer reachable."
          >
            <AdaptiveOverlay.Trigger className="xp-commerce-nav__menu-trigger" aria-label="Open commerce navigation" data-xp-commerce-overlay-trigger="">
              <span aria-hidden="true">☰</span>
            </AdaptiveOverlay.Trigger>
            <AdaptiveOverlay.Content data-xp-commerce-overlay="">
              <AdaptiveOverlay.Header title="Browse" description={`All destinations for ${model.identity.label}.`} />
              <AdaptiveOverlay.Body>
                {appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline /> : null}
                <CommerceDrawerGroups model={model} activeId={activeId} renderIcon={renderIcon} />
                {model.utility?.length ? (
                  <section className="xp-commerce-nav__utility" aria-labelledby="xp-commerce-utility-title">
                    <h2 id="xp-commerce-utility-title">Account and support</h2>
                    <ul>{model.utility.map((utility) => <li key={utility.id}>{utility.href
                      ? <a href={utility.href}>{utility.label}</a>
                      : <button type="button" onClick={() => onAction?.(utility.actionId ?? utility.id)}>{utility.label}</button>}</li>)}</ul>
                  </section>
                ) : null}
              </AdaptiveOverlay.Body>
              <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
            </AdaptiveOverlay.Content>
          </AdaptiveOverlay>
        </nav>
      ) : null}
      <a className="xp-commerce-nav__identity" href={model.identity.href ?? "#xp-shell-content"} aria-label={model.identity.label}>
        <span aria-hidden="true">{model.identity.shortLabel ?? model.identity.mark ?? model.identity.label.slice(0, 2).toUpperCase()}</span>
        <strong>{model.identity.label}</strong>
      </a>
      {!compact ? (
        <nav className="xp-commerce-nav__destinations" aria-label="Commerce destinations" data-xp-commerce-destinations="" data-xp-region="navigation">
          {destinations.map((destination) => destination.children?.length
            ? <CommerceBranchMenu key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />
            : <CommerceDestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} />)}
        </nav>
      ) : null}
      {!compact && appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={false} /> : null}
      <div className="xp-commerce-nav__actions" aria-label="Commerce actions">
        {actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}
      </div>
    </header>
  );
}

export function CommercePageBand({ model, deviceClass }: { model: CommercePageBandModel; deviceClass: DeviceClass }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <section className="xp-commerce-band" aria-labelledby="xp-commerce-band-title" data-xp-commerce-band="" data-band-presentation={compact ? "compact" : "full"}>
      <nav aria-label="Breadcrumb" data-xp-page-band-breadcrumb="">
        <ol>{model.breadcrumb.map((item) => <li key={item.id}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>)}</ol>
      </nav>
      <div className="xp-commerce-band__heading">
        <span className="xp-commerce-band__mark" aria-hidden="true">◔</span>
        <div><h1 id="xp-commerce-band-title" data-xp-page-band-title="">{model.title}</h1><p>{model.subtitle}</p></div>
      </div>
      <dl className="xp-commerce-band__metrics" data-xp-kpi-collection="" data-kpi-presentation={compact ? "compact-row" : "full-band"}>
        {model.metrics.map((metric) => (
          <div key={metric.id} data-xp-kpi="" data-xp-kpi-id={metric.id} aria-label={`${metric.label}: ${metric.value}${metric.detail ? `. ${metric.detail}` : ""}`}>
            <dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.detail ? <small>{metric.detail}</small> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CommerceFooter({ links }: { links: readonly CommerceFooterLink[] }): ReactNode {
  if (!links.length) return null;
  return (
    <footer className="xp-commerce-footer" data-xp-commerce-footer="">
      <nav aria-label="Commerce resources"><ul>{links.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav>
    </footer>
  );
}

function CommerceContextControlIcon({ action, renderActionIcon }: {
  action: NonNullable<AppBarModel["actions"]>[number];
  renderActionIcon?: AppBarProperties["renderActionIcon"];
}) {
  return <span className="xp-commerce-context__control-icon" aria-hidden="true">{renderActionIcon?.(action.icon, action) ?? action.icon.slice(0, 1).toUpperCase()}</span>;
}

function CommerceContextMediaSeat({ id, label, kind, assetId, src }: { id: string; label: string; kind: "portrait" | "product" | "seller"; assetId?: string; src?: string }) {
  return <span className={`xp-commerce-context__media-seat xp-commerce-context__media-seat--${kind}`} role="img" aria-label={label} data-media-seat-id={id} data-media-asset-id={assetId} data-media-resolved={src ? "true" : "false"}>{src ? <img src={src} alt="" loading="eager" /> : kind === "portrait" ? "NR" : kind === "seller" ? "OG" : ""}</span>;
}

function CommerceContextSaved({ action, model, deviceClass, renderActionIcon, onAction }: {
  action: NonNullable<AppBarModel["actions"]>[number];
  model: CommerceContextModel;
  deviceClass: DeviceClass;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: (actionId: string) => void;
}) {
  return (
    <AdaptiveOverlay intent="menu" presentation={deviceClass === "M" || deviceClass === "TP" ? { M: "action-sheet", TP: "action-sheet" } : undefined} why="Saved workwear stays scrollable above a persistent compact close footer.">
      <AdaptiveOverlay.Trigger className="xp-commerce-context__control" aria-label={action.label} data-xp-saved-trigger="">
        <CommerceContextControlIcon action={action} renderActionIcon={renderActionIcon} />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-context__panel xp-commerce-context__panel--saved" data-xp-saved-overlay="">
        <AdaptiveOverlay.Header title={model.panels.saved.label} description={`${model.panels.saved.rows.length} saved workwear items.`} />
        <AdaptiveOverlay.Body>
          <ul className="xp-commerce-context__saved-list">
            {model.panels.saved.rows.map((row) => (
              <li key={row.id} data-saved-row-id={row.id}>
                <CommerceContextMediaSeat id={`media-${row.id}`} label={row.mediaAlt} kind="product" assetId={row.mediaAssetId} src={row.mediaSrc} />
                <div className="xp-commerce-context__item-copy"><strong>{row.title}</strong><small>{row.subtitle}</small><span><b>{row.price}</b> <s>{row.oldPrice}</s></span></div>
                <button type="button" aria-label={`${row.removeActionLabel}: ${row.title}`} data-saved-row-action="remove" onClick={() => onAction?.(`${row.id}-remove`)}>×</button>
              </li>
            ))}
          </ul>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer>
          <button type="button" className="xp-commerce-context__panel-action" onClick={() => onAction?.("open-saved-list")}>{model.panels.saved.finalActionLabel}</button>
          <AdaptiveOverlay.Close>Close saved uniforms</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommerceContextBasket({ action, model, deviceClass, renderActionIcon, onAction }: {
  action: NonNullable<AppBarModel["actions"]>[number];
  model: CommerceContextModel;
  deviceClass: DeviceClass;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: (actionId: string) => void;
}) {
  const basket = model.panels.basket;
  return (
    <AdaptiveOverlay intent="menu" presentation={deviceClass === "M" || deviceClass === "TP" ? { M: "action-sheet", TP: "action-sheet" } : undefined} why="Basket rows need a bounded compact sheet with persistent final actions and close.">
      <AdaptiveOverlay.Trigger className="xp-commerce-context__control" aria-label={action.label} data-xp-basket-trigger="">
        <CommerceContextControlIcon action={action} renderActionIcon={renderActionIcon} />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-context__panel xp-commerce-context__panel--basket" data-xp-basket-overlay="" data-basket-count={basket.declaredCount}>
        <AdaptiveOverlay.Header title={`${basket.label} (${basket.declaredCount})`} description={`${basket.rows.length} supplier rows shown.`} />
        <AdaptiveOverlay.Body>
          <button type="button" className="xp-commerce-context__full-list" onClick={() => onAction?.("open-full-basket")}>{basket.openFullActionLabel}</button>
          <ul className="xp-commerce-context__basket-list">
            {basket.rows.map((row) => (
              <li key={row.id} data-basket-row-id={row.id}>
                <header><CommerceContextMediaSeat id={`media-${row.id}-seller`} label={row.sellerAlt} kind="seller" assetId={row.sellerAssetId} src={row.sellerSrc} /><strong>{row.sellerName}</strong><span>{row.deliveryLabel}</span><span>{row.discountLabel}</span></header>
                <div className="xp-commerce-context__basket-product">
                  <CommerceContextMediaSeat id={`media-${row.id}-product`} label={row.productAlt} kind="product" assetId={row.productAssetId} src={row.productSrc} />
                  <div className="xp-commerce-context__item-copy"><strong>{row.productName}</strong><span><s>{row.oldPrice}</s> <b>{row.currentPrice}</b></span><small>{row.color} · {row.size} · ★ {row.rating}</small>
                    <label><span>Quantity</span><select defaultValue={String(row.quantity)} aria-label={`Quantity for ${row.productName}`}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
                  </div>
                  <div className="xp-commerce-context__row-actions"><button type="button" aria-label={`${row.moveActionLabel}: ${row.productName}`} data-basket-row-action="saved" onClick={() => onAction?.(`${row.id}-saved`)}>♡</button><button type="button" aria-label={`${row.removeActionLabel}: ${row.productName}`} data-basket-row-action="remove" onClick={() => onAction?.(`${row.id}-remove`)}>×</button></div>
                </div>
              </li>
            ))}
          </ul>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer>
          <div className="xp-commerce-context__basket-actions">{basket.finalActions.map((item) => <button key={item.id} type="button" data-basket-final-action-id={item.id} data-action-kind={item.kind} onClick={() => onAction?.(item.id)}>{item.label}</button>)}</div>
          <AdaptiveOverlay.Close>Close fabric basket</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommerceContextAccount({ action, model, deviceClass, renderActionIcon, onAction }: {
  action: NonNullable<AppBarModel["actions"]>[number];
  model: CommerceContextModel;
  deviceClass: DeviceClass;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: (actionId: string) => void;
}) {
  const profile = model.profile;
  return (
    <AdaptiveOverlay intent="menu" presentation={deviceClass === "M" || deviceClass === "TP" ? { M: "action-sheet", TP: "action-sheet" } : undefined} why="Account groups stay scrollable above a persistent compact close footer.">
      <AdaptiveOverlay.Trigger className="xp-commerce-context__control xp-commerce-context__account-trigger" aria-label={`Open account menu for ${profile.name}, ${profile.role}`} data-xp-account-trigger="">
        <CommerceContextMediaSeat id="media-account-nina" label={profile.avatarAlt} kind="portrait" assetId={profile.avatarAssetId} src={profile.avatarSrc} />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-context__panel xp-commerce-context__panel--account" data-xp-commerce-account-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={profile.name} description={profile.role} />
        <AdaptiveOverlay.Body>
          <div className="xp-commerce-context__profile"><CommerceContextMediaSeat id="media-account-nina" label={profile.avatarAlt} kind="portrait" assetId={profile.avatarAssetId} src={profile.avatarSrc} /><div><strong data-profile-name={profile.name} data-profile-email={profile.email} data-profile-role={profile.role}>{profile.name}</strong><span>{profile.email}</span><small>{profile.role}</small></div><i aria-label="Online" /></div>
          <nav aria-label="Account commands">{model.accountGroups.map((group) => <section key={group.name} data-account-group={group.name}><h3>{group.name}</h3>{group.items.map((item) => item.href ? <a key={item.id} href={item.href} data-account-command-id={item.id}>{item.label}</a> : <button key={item.id} type="button" data-account-command-id={item.id} onClick={() => onAction?.(item.id)}>{item.label}</button>)}</section>)}</nav>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommerceContextRoot({ destination, placement, deviceClass, renderIcon }: {
  destination: NavDestination;
  placement: "bottom" | "strip" | "inline";
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
}) {
  const content = <><CommerceDestinationIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></>;
  if (!destination.children?.length) return <a className="xp-commerce-context__destination" href={destination.href} data-destination-id={destination.id}>{content}</a>;
  return (
    <AdaptiveOverlay intent="menu" presentation={deviceClass === "M" || deviceClass === "TP" ? { M: "action-sheet", TP: "action-sheet" } : undefined} why="Grouped commerce destinations open directly in a bounded compact sheet.">
      <AdaptiveOverlay.Trigger className="xp-commerce-context__destination" aria-label={`Open ${destination.label}`} data-parent-trigger-id={destination.id}>{content}<span className="xp-commerce-context__chevron" aria-hidden="true">⌄</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-commerce-context__branch-panel" data-xp-commerce-context-branch="" data-branch-id={destination.id} data-placement={placement} data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label.toLowerCase()} destination.`} />
        <AdaptiveOverlay.Body><ul>{destination.children.map((child) => <li key={child.id}><a href={child.href} data-child-id={child.id} data-parent-id={destination.id}>{child.label}</a></li>)}</ul></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommerceContextRank({ nav, placement, deviceClass, renderIcon }: {
  nav: NavModel;
  placement: "bottom" | "strip" | "inline";
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
}) {
  return <nav className={`xp-commerce-context__rank xp-commerce-context__rank--${placement}`} aria-label="Commerce destinations" data-xp-commerce-context-rank={placement}>{destinationsByPriority(nav).map((destination) => <CommerceContextRoot key={destination.id} destination={destination} placement={placement} deviceClass={deviceClass} renderIcon={renderIcon} />)}</nav>;
}

export function CommerceContextShell({ nav, appBar, pageBand, model, deviceClass, renderIcon, renderActionIcon, onAction, children, sourceSlug, sourcePreset }: {
  nav: NavModel;
  appBar: AppBarModel;
  pageBand: CommercePageBandModel;
  model: CommerceContextModel;
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: (actionId: string) => void;
  children: ReactNode;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  const [saved, basket, account] = actions;
  return (
    <div className="xp-commerce-context" data-xp-shell="" data-xp-nav-renderer="" data-xp-commerce-context-renderer="" data-shell-family="app" data-shell-anatomy="appbar.commerce-context" data-source-slug={sourceSlug} data-source-preset={sourcePreset} data-device-class={deviceClass} data-variant={`${deviceClass.toLowerCase()}-commerce-context`}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      <header className="xp-commerce-context__bar" data-xp-region="top" data-xp-commerce-command="">
        <a className="xp-commerce-context__identity" href={nav.identity.href ?? "#xp-shell-content"} aria-label={`${nav.identity.label} home`} data-xp-product-home=""><span aria-hidden="true">OG</span><strong>{nav.identity.label}</strong></a>
        {!compact ? <CommerceContextRank nav={nav} placement="inline" deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
        <div className="xp-commerce-context__controls" aria-label="Commerce controls">
          <CommerceContextSaved action={saved} model={model} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} />
          <CommerceContextBasket action={basket} model={model} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} />
          <CommerceContextAccount action={account} model={model} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} />
        </div>
      </header>
      {deviceClass === "TP" ? <CommerceContextRank nav={nav} placement="strip" deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
      <CommercePageBand model={pageBand} deviceClass={deviceClass} />
      <main className="xp-commerce-context__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><div className="xp-commerce-context__surface">{children}</div></main>
      {deviceClass === "M" ? <CommerceContextRank nav={nav} placement="bottom" deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    </div>
  );
}
