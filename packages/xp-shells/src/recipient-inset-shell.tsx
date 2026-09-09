"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  AppBarActionControl,
  AppBarSearchControl,
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

export type RecipientInsetRecipient = {
  id: string;
  name: string;
  role: string;
  amount: string;
  status: string;
};

export type RecipientOperationCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type RecipientInsetFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type RecipientInsetModel = {
  recipients: readonly RecipientInsetRecipient[];
  operationCards: readonly RecipientOperationCard[];
  footerLinks: readonly RecipientInsetFooterLink[];
};

export type RecipientInsetReachability = {
  id: string;
  kind: "destination" | "action" | "recipient";
  parentId?: string;
  surface: "compact-overlay" | "inset-navigation" | "app-bar" | "recipient-roster";
};

export function recipientInsetReachability(
  nav: NavModel,
  appBar: AppBarModel,
  model: RecipientInsetModel,
  deviceClass: DeviceClass,
): RecipientInsetReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): RecipientInsetReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "compact-overlay" : "inset-navigation" },
      ...(destination.children ?? []).map((child) => ({
        id: child.id,
        kind: "destination" as const,
        parentId: destination.id,
        surface: compact ? "compact-overlay" as const : "inset-navigation" as const,
      })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "app-bar" as const })),
    ...model.recipients.map(({ id }) => ({
      id,
      kind: "recipient" as const,
      surface: compact ? "compact-overlay" as const : "recipient-roster" as const,
    })),
  ];
}

function DestinationIcon({ destination, renderIcon }: {
  destination: NavDestination;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <span className="xp-shell-nav__icon" aria-hidden="true" data-icon-key={destination.icon}>
      {renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return (
    <a
      className="xp-recipient-inset__child"
      href={child.href}
      data-nav-id={child.id}
      data-nav-parent-id={parentId}
      aria-current={child.id === activeId ? "page" : undefined}
    >
      {child.label}
    </a>
  );
}

function DestinationLink({ destination, activeId, renderIcon }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
}) {
  return (
    <a
      className="xp-recipient-inset__destination"
      href={destination.href}
      data-nav-id={destination.id}
      aria-current={destination.id === activeId ? "page" : undefined}
      aria-label={destination.label}
    >
      <DestinationIcon destination={destination} renderIcon={renderIcon} />
      <span>{destination.label}</span>
    </a>
  );
}

function DestinationBranch({ destination, activeId, renderIcon, rail }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  rail: boolean;
}) {
  if (rail) {
    return (
      <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Landscape tablet branches open beside the compact rail without widening it.">
        <AdaptiveOverlay.Trigger
          className="xp-recipient-inset__destination"
          aria-label={`Open ${destination.label}`}
          aria-current={destination.id === activeId ? "page" : undefined}
          data-nav-id={destination.id}
          data-xp-inset-branch-trigger=""
        >
          <DestinationIcon destination={destination} renderIcon={renderIcon} />
          <span>{destination.label}</span>
        </AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content data-xp-inset-branch-overlay="" data-branch-id={destination.id}>
          <AdaptiveOverlay.Header title={destination.label} description={`Open a ${destination.label} view.`} />
          <AdaptiveOverlay.Body>
            <ul className="xp-recipient-inset__children">
              {destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}
            </ul>
          </AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    );
  }
  return (
    <details className="xp-recipient-inset__branch" open={destination.children?.some(({ id }) => id === activeId)} data-xp-nav-branch="">
      <summary
        className="xp-recipient-inset__destination"
        data-nav-id={destination.id}
        aria-current={destination.id === activeId ? "page" : undefined}
      >
        <DestinationIcon destination={destination} renderIcon={renderIcon} />
        <span>{destination.label}</span>
        <span className="xp-recipient-inset__branch-indicator" aria-hidden="true">⌄</span>
      </summary>
      <ul className="xp-recipient-inset__children">
        {destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}
      </ul>
    </details>
  );
}

function DestinationTree({ nav, activeId, renderIcon, rail = false }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  rail?: boolean;
}) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const grouped = new Set((nav.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [
    ...(nav.groups ?? []).map((group) => ({
      id: group.id,
      label: group.label,
      destinations: group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)),
    })),
    { id: "other", label: "More", destinations: destinations.filter(({ id }) => !grouped.has(id)) },
  ].filter(({ destinations: items }) => items.length);
  return (
    <div className="xp-recipient-inset__groups" data-nav-presentation={rail ? "compact-rail" : "inset-panel"}>
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`xp-recipient-group-${group.id}`}>
          <h2 id={`xp-recipient-group-${group.id}`}>{group.label}</h2>
          <ul>
            {group.destinations.map((destination) => (
              <li key={destination.id}>
                {destination.children?.length
                  ? <DestinationBranch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} />
                  : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RecipientRoster({ recipients, compact, onAction }: {
  recipients: readonly RecipientInsetRecipient[];
  compact: boolean;
  onAction?: AppBarProperties["onAction"];
}) {
  return (
    <section className="xp-recipient-inset__recipients" aria-labelledby="xp-recipient-roster-title" data-xp-recipients="" data-xp-recipient-scroll-container="" data-roster-presentation={compact ? "compact" : "full"}>
      <h2 id="xp-recipient-roster-title">Recipients</h2>
      <ul>
        {recipients.map((recipient) => (
          <li key={recipient.id}>
            <button
              type="button"
              data-xp-recipient-id={recipient.id}
              data-recipient-status={recipient.status}
              onClick={() => onAction?.(recipient.id)}
              aria-label={`${recipient.name}, ${recipient.role}, ${recipient.amount}, ${recipient.status}`}
            >
              <span className="xp-recipient-inset__avatar" aria-hidden="true">{recipient.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <span><strong>{recipient.name}</strong><small>{recipient.role}</small></span>
              <span className="xp-recipient-inset__amount">{recipient.amount}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UtilityLinks({ nav, onAction }: { nav: NavModel; onAction?: AppBarProperties["onAction"] }) {
  if (!nav.utility?.length) return null;
  return (
    <section className="xp-recipient-inset__utility" aria-labelledby="xp-recipient-utility-title">
      <h2 id="xp-recipient-utility-title">Support</h2>
      <ul>{nav.utility.map((item) => <li key={item.id}>{item.href
        ? <a href={item.href}>{item.label}</a>
        : <button type="button" onClick={() => onAction?.(item.actionId ?? item.id)}>{item.label}</button>}</li>)}</ul>
    </section>
  );
}

function UserFooter({ appBar }: { appBar: AppBarModel }) {
  const identity = appBar.identity ?? { name: appBar.context.title, role: appBar.context.greeting };
  return (
    <button className="xp-recipient-inset__user" type="button" data-xp-user-footer="" data-xp-recipient-user-footer="" aria-label={`Open account menu for ${identity.name}`}>
      <span className="xp-recipient-inset__avatar" aria-hidden="true">{identity.name.slice(0, 1).toUpperCase()}</span>
      <span><strong>{identity.name}</strong>{identity.role ? <small>{identity.role}</small> : null}</span>
      <span aria-hidden="true">›</span>
    </button>
  );
}

function InsetContents({ nav, appBar, model, activeId, deviceClass, renderIcon, onAction, overlay = false }: {
  nav: NavModel;
  appBar: AppBarModel;
  model: RecipientInsetModel;
  activeId: string;
  deviceClass: DeviceClass;
  renderIcon?: NavIconRenderer;
  onAction?: AppBarProperties["onAction"];
  overlay?: boolean;
}) {
  const rail = deviceClass === "TL" && !overlay;
  return (
    <>
      <a className="xp-recipient-inset__brand" href={nav.identity.href ?? "#xp-shell-content"} aria-label={nav.identity.label}>
        <span aria-hidden="true">{nav.identity.shortLabel ?? nav.identity.label.slice(0, 2).toUpperCase()}</span>
        <strong>{nav.identity.label}</strong>
      </a>
      <DestinationTree nav={nav} activeId={activeId} renderIcon={renderIcon} rail={rail} />
      <RecipientRoster recipients={model.recipients} compact={rail || overlay} onAction={onAction} />
      <UtilityLinks nav={nav} onAction={onAction} />
      <UserFooter appBar={appBar} />
    </>
  );
}

function CompactNavigationOverlay({ nav, appBar, model, activeId, deviceClass, renderIcon, onAction }: {
  nav: NavModel;
  appBar: AppBarModel;
  model: RecipientInsetModel;
  activeId: string;
  deviceClass: "M" | "TP";
  renderIcon?: NavIconRenderer;
  onAction?: AppBarProperties["onAction"];
}) {
  return (
    <AdaptiveOverlay
      intent="menu"
      presentation={{ M: "action-sheet", TP: "action-sheet" }}
      why="The complete destination tree, recipient roster, and user footer need one scrolling body with a persistent close action."
    >
      <AdaptiveOverlay.Trigger className="xp-recipient-inset__overlay-trigger" aria-label="Open workspace navigation and recipients" data-xp-recipient-overlay-trigger="" data-xp-nav-renderer="">
        <span aria-hidden="true">☰</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-recipient-overlay="">
        <AdaptiveOverlay.Header title={nav.identity.label} description="Navigation, recipients, and account." />
        <AdaptiveOverlay.Body>
          <nav className="xp-recipient-inset__overlay-nav" aria-label="Workspace navigation" data-xp-inset-nav="" data-xp-region="navigation">
            <InsetContents nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} overlay />
          </nav>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

export function RecipientInsetShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: {
  nav: NavModel;
  appBar: AppBarModel;
  model: RecipientInsetModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: AppBarProperties["onAction"];
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((left, right) => left.priority - right.priority);
  return (
    <div
      className="xp-app-shell xp-recipient-shell"
      data-xp-shell=""
      data-xp-recipient-inset=""
      data-shell-family="app"
      data-device-class={deviceClass}
      data-variant="recipient-inset"
      data-shell-anatomy="app.inset.recipients-stats"
      data-skin="inset"
      data-nav-placement="side"
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      <header className="xp-recipient-inset__app-bar" data-xp-region="top">
        {compact ? <CompactNavigationOverlay nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} /> : null}
        <div className="xp-recipient-inset__heading">
          <strong>{appBar.context.greeting ?? appBar.context.title}</strong>
          <span>{appBar.context.title}</span>
        </div>
        {appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={!compact && deviceClass !== "TL"} /> : null}
        <div className="xp-recipient-inset__app-actions" aria-label="Workspace actions">
          {actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}
        </div>
      </header>
      <div className="xp-recipient-inset__body">
        {!compact ? (
          <aside className="xp-recipient-inset__sidebar" data-xp-inset-nav="" data-xp-nav-renderer="" data-xp-region="navigation">
            <InsetContents nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} />
          </aside>
        ) : null}
        <main className="xp-recipient-inset__content xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content">
          <dl className="xp-recipient-inset__cards" aria-label="Transfer operations" data-card-presentation={compact ? "compact-row" : "operational-grid"}>
            {model.operationCards.map((card) => (
              <div key={card.id} data-xp-operation-card="" data-xp-card-id={card.id} data-xp-operation-card-id={card.id} aria-label={`${card.label}: ${card.value}. ${card.detail}`}>
                <dt>{card.label}</dt><dd>{card.value}</dd><small>{card.detail}</small>
              </div>
            ))}
          </dl>
          <section className="xp-recipient-inset__work-surface" data-xp-main-work-surface="" data-xp-recipient-work-surface="">
            {children}
          </section>
        </main>
      </div>
      <footer className="xp-recipient-inset__footer" data-xp-region="bottom">
        <nav aria-label="Workspace resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav>
      </footer>
    </div>
  );
}
