"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  AppBarActionControl,
  AppBarSearchControl,
  partitionCompactAppBarActions,
  type AppBarModel,
  type AppBarProperties,
} from "./app-bar";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export type AccountSocialUtility = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

export type AccountIdentity = {
  name: string;
  email: string;
  role: string;
  avatarAlt: string;
  socialUtilities: readonly AccountSocialUtility[];
};

export type AccountFooterLink = { id: string; label: string; href: string };

export type AccountIdentityModel = {
  identity: AccountIdentity;
  avatarSrc: string;
  avatarSrcSet: string;
  footerLinks: readonly AccountFooterLink[];
};

export type AccountLedReachability = {
  id: string;
  kind: "destination" | "social-utility" | "action";
  parentId?: string;
  surface: "compact-sheet" | "account-navigation" | "social-utilities" | "app-bar";
};

export function accountLedReachability(
  nav: NavModel,
  appBar: AppBarModel,
  model: AccountIdentityModel,
  deviceClass: DeviceClass,
): AccountLedReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): AccountLedReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "compact-sheet" : "account-navigation" },
      ...(destination.children ?? []).map(({ id }) => ({
        id,
        kind: "destination" as const,
        parentId: destination.id,
        surface: compact ? "compact-sheet" as const : "account-navigation" as const,
      })),
    ]),
    ...model.identity.socialUtilities.map(({ id }) => ({ id, kind: "social-utility" as const, surface: "social-utilities" as const })),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "app-bar" as const })),
  ];
}

function DestinationIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>;
}

function UtilityIcon({ utility, renderIcon }: { utility: AccountSocialUtility; renderIcon?: NavIconRenderer }) {
  const semanticDestination: NavDestination = { id: utility.id, label: utility.label, href: utility.href, icon: utility.icon, priority: 0 };
  return <span className="xp-shell-nav__icon" data-icon-key={utility.icon} aria-hidden="true">{renderIcon?.(utility.icon, semanticDestination) ?? utility.icon.slice(0, 1).toUpperCase()}</span>;
}

function AccountPortrait({ model, size = "full" }: { model: AccountIdentityModel; size?: "full" | "rail" }) {
  return (
    <picture className="xp-account-led__portrait" data-avatar-size={size}>
      <source srcSet={model.avatarSrcSet} type="image/webp" />
      <img
        src={model.avatarSrc}
        srcSet={model.avatarSrcSet}
        sizes={size === "rail" ? "48px" : "80px"}
        width={160}
        height={160}
        alt={model.identity.avatarAlt}
        data-xp-account-avatar=""
      />
    </picture>
  );
}

function IdentityDetails({ model, showPortrait = true }: { model: AccountIdentityModel; showPortrait?: boolean }) {
  return (
    <section className="xp-account-led__identity" data-xp-account-identity="" data-account-name={model.identity.name} data-account-email={model.identity.email} data-account-role={model.identity.role} aria-label={`Account identity for ${model.identity.name}`}>
      {showPortrait ? <AccountPortrait model={model} /> : null}
      <div>
        <strong>{model.identity.name}</strong>
        <a href={`mailto:${model.identity.email}`}>{model.identity.email}</a>
        <span>{model.identity.role}</span>
      </div>
    </section>
  );
}

function SocialUtilities({ model, renderIcon, compact = false }: { model: AccountIdentityModel; renderIcon?: NavIconRenderer; compact?: boolean }) {
  return (
    <nav className="xp-account-led__social" aria-label="Operator intelligence utilities" data-utility-presentation={compact ? "rail" : "panel"}>
      <ul>
        {model.identity.socialUtilities.map((utility) => (
          <li key={utility.id}>
            <a href={utility.href} data-xp-social-utility-id={utility.id} aria-label={utility.label} title={utility.label}>
              <UtilityIcon utility={utility} renderIcon={renderIcon} />
              <span>{utility.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ChildRoute({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return <a className="xp-account-led__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a>;
}

function DestinationLink({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return (
    <a className="xp-account-led__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}>
      <DestinationIcon destination={destination} renderIcon={renderIcon} />
      <span>{destination.label}</span>
      {destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}
    </a>
  );
}

function DestinationBranch({ destination, activeId, renderIcon, rail }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; rail: boolean }) {
  if (rail) {
    return (
      <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Landscape tablet account branches open beside the semantic icon rail.">
        <AdaptiveOverlay.Trigger className="xp-account-led__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-account-branch-trigger="">
          <DestinationIcon destination={destination} renderIcon={renderIcon} />
          <span>{destination.label}</span>
          {destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}
        </AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content data-xp-account-branch-overlay="" data-branch-id={destination.id}>
          <AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} view.`} />
          <AdaptiveOverlay.Body>
            <ul className="xp-account-led__children">{destination.children?.map((child) => <li key={child.id}><ChildRoute child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul>
          </AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    );
  }
  return (
    <details className="xp-account-led__branch" open={destination.children?.some(({ id }) => id === activeId)} data-xp-nav-branch="">
      <summary className="xp-account-led__destination" data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}>
        <DestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        {destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}
        <span className="xp-account-led__chevron" aria-hidden="true">⌄</span>
      </summary>
      <ul className="xp-account-led__children">{destination.children?.map((child) => <li key={child.id}><ChildRoute child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul>
    </details>
  );
}

function AccountNavigation({ nav, activeId, renderIcon, rail = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const grouped = new Set((nav.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [
    ...(nav.groups ?? []).map((group) => ({ id: group.id, label: group.label, items: group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)) })),
    { id: "other", label: "More", items: destinations.filter(({ id }) => !grouped.has(id)) },
  ].filter(({ items }) => items.length);
  return (
    <nav className="xp-account-led__navigation" aria-label="Console navigation" data-xp-account-navigation="" data-nav-presentation={rail ? "rail" : "panel"} data-xp-scroll="">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`xp-account-group-${group.id}`}>
          <h2 id={`xp-account-group-${group.id}`}>{group.label}</h2>
          <ul>{group.items.map((destination) => <li key={destination.id}>{destination.children?.length ? <DestinationBranch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul>
        </section>
      ))}
    </nav>
  );
}

function RailIdentity({ model }: { model: AccountIdentityModel }) {
  return (
    <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="Landscape tablet keeps full operator identity one touch away from the compact rail.">
      <AdaptiveOverlay.Trigger className="xp-account-led__identity-trigger" aria-label={`Open account identity for ${model.identity.name}`} data-xp-account-identity-trigger="" data-xp-account-identity="" data-account-name={model.identity.name} data-account-email={model.identity.email} data-account-role={model.identity.role}>
        <AccountPortrait model={model} size="rail" />
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-account-identity-overlay="">
        <AdaptiveOverlay.Header title={model.identity.name} description={model.identity.role} />
        <AdaptiveOverlay.Body><a href={`mailto:${model.identity.email}`}>{model.identity.email}</a></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account identity</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function Sidebar({ nav, model, activeId, renderIcon, rail = false }: { nav: NavModel; model: AccountIdentityModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  return rail ? (
    <>
      <RailIdentity model={model} />
      <SocialUtilities model={model} renderIcon={renderIcon} compact />
      <AccountNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} rail />
    </>
  ) : (
    <>
      <IdentityDetails model={model} />
      <SocialUtilities model={model} renderIcon={renderIcon} />
      <AccountNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} />
    </>
  );
}

function CompactNavigation({ nav, model, activeId, renderIcon, deviceClass }: { nav: NavModel; model: AccountIdentityModel; activeId: string; renderIcon?: NavIconRenderer; deviceClass: DeviceClass }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact account identity and every console route share one bounded scroll-safe action sheet.">
      <AdaptiveOverlay.Trigger className="xp-account-led__overlay-trigger" aria-label="Open account navigation" data-xp-account-overlay-trigger="" data-xp-nav-renderer=""><span aria-hidden="true">◧</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-account-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={nav.identity.label} description="Operator identity, intelligence utilities, and console routes." />
        <AdaptiveOverlay.Body data-xp-account-overlay-scroll="" data-xp-scroll=""><Sidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer data-xp-account-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactActions({ actions, deviceClass, renderActionIcon, onAction }: { actions: NonNullable<AppBarModel["actions"]>; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const { visible, overflow } = partitionCompactAppBarActions(actions, deviceClass);
  return (
    <div className="xp-account-led__compact-actions">
      {visible.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}
      <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="All account command actions stay reachable through a bounded More actions sheet.">
        <AdaptiveOverlay.Trigger aria-label="More actions"><span aria-hidden="true">•••</span></AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content data-xp-account-actions-overlay="">
          <AdaptiveOverlay.Header title="More actions" description="Console actions that do not fit the compact command bar." />
          <AdaptiveOverlay.Body data-xp-account-actions-scroll="" data-xp-scroll=""><ul>{overflow.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer data-xp-account-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    </div>
  );
}

function AccountCommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: AccountIdentityModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  return (
    <header className="xp-account-led__command" data-xp-region="top">
      {compact ? <CompactNavigation nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} deviceClass={deviceClass} /> : <strong className="xp-account-led__context">{appBar.context.title}</strong>}
      {appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={!compact && deviceClass !== "TL"} /> : null}
      {compact ? <CompactActions actions={actions} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-account-led__actions">{actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div>}
    </header>
  );
}

export function AccountLedShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: AccountIdentityModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-app-shell xp-account-led-shell" data-xp-shell="" data-xp-account-led-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="account-led" data-shell-anatomy="app.side.account-led" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {compact ? <AccountCommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}
      <div className="xp-account-led__body">
        {!compact ? <aside className="xp-account-led__sidebar" data-xp-nav-renderer="" data-xp-region="navigation"><Sidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} rail={deviceClass === "TL"} /></aside> : null}
        <div className="xp-account-led__stage">
          {!compact ? <AccountCommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}
          <main className="xp-account-led__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-account-led__surface" data-xp-account-work-surface="">{children}</section></main>
        </div>
      </div>
      <footer className="xp-account-led__footer" data-xp-account-footer="" data-xp-region="bottom"><nav aria-label="Console resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav></footer>
    </div>
  );
}
