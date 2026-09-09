"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
  type NavUtility,
} from "./nav-model";

export const insetRecipientsForms = {
  M: "inset-recipients-tabs",
  TP: "inset-recipients-portrait-tabs",
  TL: "inset-recipients-touch-rail",
  DS: "inset-recipients-panel",
  DW: "inset-recipients-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type InsetRecipient = {
  id: string;
  name: string;
  role: string;
  amount: string;
  status: string;
};

export type InsetRecipientsModel = {
  recipients: readonly InsetRecipient[];
  profile: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
  };
};

export type InsetRecipientsReachability = {
  id: string;
  kind: "destination" | "recipient" | "account-action";
  taps: 1 | 2;
  surface: "first-paint" | "complete-sheet" | "touch-popover" | "complete-panel";
};

export function insetRecipientsReachability(nav: NavModel, model: InsetRecipientsModel, deviceClass: DeviceClass): InsetRecipientsReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const touch = deviceClass === "TL";
  const destinations = destinationsByPriority(nav).flatMap((destination, index) => [
    { id: destination.id, kind: "destination" as const, taps: (compact && index >= 3 ? 2 : touch && destination.children?.length ? 2 : 1) as 1 | 2, surface: compact && index >= 3 ? "complete-sheet" as const : touch && destination.children?.length ? "touch-popover" as const : compact || touch ? "first-paint" as const : "complete-panel" as const },
    ...(destination.children ?? []).map((child) => ({ id: child.id, kind: "destination" as const, taps: 2 as const, surface: compact ? "complete-sheet" as const : touch ? "touch-popover" as const : "complete-panel" as const })),
  ]);
  return [
    ...destinations,
    ...model.recipients.map(({ id }) => ({ id, kind: "recipient" as const, taps: (touch ? 2 : 1) as 1 | 2, surface: touch ? "touch-popover" as const : compact ? "first-paint" as const : "complete-panel" as const })),
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "account-action" as const, taps: 2 as const, surface: touch || compact ? "touch-popover" as const : "complete-panel" as const })),
  ];
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-inset-recipients__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>;
}

function UtilityIcon({ utility, renderIcon }: { utility: NavUtility; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: utility.id, label: utility.label, href: utility.href ?? "#", icon: utility.icon, priority: 0 };
  return <span className="xp-inset-recipients__icon" data-icon-key={utility.icon} aria-hidden="true">{renderIcon?.(utility.icon, destination) ?? utility.label.slice(0, 1)}</span>;
}

function Brand({ nav }: { nav: NavModel }) {
  return (
    <a className="xp-inset-recipients__brand" href={nav.identity.href ?? "#xp-shell-content"} aria-label={nav.identity.label} data-xp-inset-recipients-identity="">
      <span aria-hidden="true">{nav.identity.mark ?? initials(nav.identity.label)}</span>
      <strong>{nav.identity.label}</strong>
    </a>
  );
}

function DestinationLink({ destination, activeId, renderIcon, surface }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "panel" | "popover";
}) {
  return (
    <a className="xp-inset-recipients__destination" href={destination.href} data-nav-id={destination.id} data-xp-inset-recipients-destination="" data-inset-recipients-surface={surface} aria-current={destination.id === activeId ? "page" : undefined}>
      <Icon destination={destination} renderIcon={renderIcon} />
      <span className="xp-inset-recipients__label">{destination.label}</span>
    </a>
  );
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-inset-recipients__child" href={child.href} data-nav-child-id={child.id} data-nav-parent-id={parentId}>{child.label}</a>;
}

function CompleteTree({ nav, activeId, renderIcon, surface, expanded = false }: {
  nav: NavModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "panel";
  expanded?: boolean;
}) {
  const byId = new Map(destinationsByPriority(nav).map((destination) => [destination.id, destination]));
  return (
    <nav className="xp-inset-recipients__tree" aria-label="Finance destinations" data-xp-inset-recipients-tree="" data-tree-surface={surface}>
      {nav.groups?.map((group) => (
        <section key={group.id} data-nav-group-id={group.id} data-nav-group-count={group.destinationIds.length}>
          <h2>{group.label}</h2>
          <div>{group.destinationIds.map((id) => {
            const destination = byId.get(id);
            if (!destination) return null;
            if (!destination.children?.length) return <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />;
            return (
              <details className="xp-inset-recipients__branch" key={id} open={expanded || destination.children.some((child) => child.id === activeId)} data-nav-branch-id={id}>
                <summary><span className="xp-inset-recipients__summary-link"><Icon destination={destination} renderIcon={renderIcon} /><a href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}>{destination.label}</a></span><span aria-hidden="true">⌄</span></summary>
                <div className="xp-inset-recipients__children">{destination.children.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div>
              </details>
            );
          })}</div>
        </section>
      ))}
    </nav>
  );
}

function RecipientList({ model, layout }: { model: InsetRecipientsModel; layout: "card" | "pane" | "panel" }) {
  return (
    <section className="xp-inset-recipients__recipients" data-xp-inset-recipients-recipients="" data-recipient-layout={layout}>
      <div className="xp-inset-recipients__section-heading"><h2>Recipients</h2><span>{model.recipients.length} saved</span></div>
      <div className="xp-inset-recipients__recipient-list" data-xp-inset-recipients-recipient-scroll="">
        {model.recipients.map((recipient) => (
          <a key={recipient.id} className="xp-inset-recipients__recipient" href={`#recipient-${recipient.id}`} data-recipient-id={recipient.id} aria-label={`${recipient.name}, ${recipient.role}, ${recipient.amount}, ${recipient.status}`}>
            <span className="xp-inset-recipients__avatar" aria-hidden="true">{initials(recipient.name)}</span>
            <span className="xp-inset-recipients__recipient-copy"><strong>{recipient.name}</strong><small>{recipient.role}</small></span>
            <span className="xp-inset-recipients__recipient-meta"><strong>{recipient.amount}</strong><small>{recipient.status}</small></span>
          </a>
        ))}
      </div>
    </section>
  );
}

function AccountContent({ nav, model, renderIcon }: { nav: NavModel; model: InsetRecipientsModel; renderIcon?: NavIconRenderer }) {
  return (
    <div className="xp-inset-recipients__account-content" data-xp-inset-recipients-account-content="">
      <section className="xp-inset-recipients__profile" data-account-name={model.profile.name} data-account-role={model.profile.role} data-account-email={model.profile.email}>
        <span className="xp-inset-recipients__avatar xp-inset-recipients__avatar--account" role="img" aria-label={model.profile.avatarAlt}>{initials(model.profile.name)}</span>
        <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div>
      </section>
      <nav aria-label="Account actions" data-xp-inset-recipients-account-actions="">{nav.utility?.map((utility) => utility.href ? (
        <a key={utility.id} href={utility.href} data-utility-id={utility.id}><UtilityIcon utility={utility} renderIcon={renderIcon} /><span>{utility.label}</span></a>
      ) : (
        <button key={utility.id} type="button" data-utility-id={utility.id}><UtilityIcon utility={utility} renderIcon={renderIcon} /><span>{utility.label}</span></button>
      ))}</nav>
    </div>
  );
}

function AccountOverlay({ nav, model, deviceClass, renderIcon, mode }: { nav: NavModel; model: InsetRecipientsModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; mode: "tab" | "rail" | "panel" }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="One persistent account seat exposes the exact profile and five account jobs in a bounded native surface.">
      <AdaptiveOverlay.Trigger className={`xp-inset-recipients__account-trigger xp-inset-recipients__account-trigger--${mode}`} aria-label={`Open account for ${model.profile.name}`} data-xp-inset-recipients-account-trigger="">
        <span className="xp-inset-recipients__avatar" aria-hidden="true">{initials(model.profile.name)}</span><span className="xp-inset-recipients__account-label"><strong>{mode === "tab" ? "Account" : model.profile.name}</strong>{mode !== "tab" ? <small>{model.profile.role}</small> : null}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-inset-recipients__account-overlay" data-xp-inset-recipients-account-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="Account" description="Profile and preferences" />
        <AdaptiveOverlay.Body className="xp-inset-recipients__account-body"><AccountContent nav={nav} model={model} renderIcon={renderIcon} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-inset-recipients__overlay-footer" data-xp-inset-recipients-account-footer=""><AdaptiveOverlay.Close className="xp-inset-recipients__overlay-close">Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function MoreOverlay({ nav, activeId, deviceClass, renderIcon }: { nav: NavModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Three first-paint routes hand off to one complete expanded tree, keeping every parent and child within two taps.">
      <AdaptiveOverlay.Trigger className="xp-inset-recipients__more-trigger" aria-label="More destinations" data-xp-inset-recipients-more-trigger=""><span className="xp-inset-recipients__more-icon" aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-inset-recipients__more-overlay" data-xp-inset-recipients-more-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="All destinations" description="Main Menu" />
        <AdaptiveOverlay.Body className="xp-inset-recipients__more-body" data-xp-inset-recipients-more-body=""><CompleteTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="sheet" expanded /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-inset-recipients__overlay-footer" data-xp-inset-recipients-more-footer=""><AdaptiveOverlay.Close className="xp-inset-recipients__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactTabs({ nav, model, activeId, deviceClass, renderIcon }: { nav: NavModel; model: InsetRecipientsModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer }) {
  return <nav className="xp-inset-recipients__tabs" aria-label="Primary destinations" data-xp-inset-recipients-tab-rank="">{destinationsByPriority(nav).slice(0, 3).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}<AccountOverlay nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} mode="tab" /><MoreOverlay nav={nav} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /></nav>;
}

function BranchPopover({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="A labelled anchored branch keeps each parent direct and every child reachable without hover.">
      <AdaptiveOverlay.Trigger className="xp-inset-recipients__rail-trigger" aria-label={`Open ${destination.label}`} data-xp-inset-recipients-branch-trigger="" data-nav-trigger-id={destination.id}><Icon destination={destination} renderIcon={renderIcon} /></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-inset-recipients__branch-overlay" data-xp-inset-recipients-branch-overlay="" data-nav-popover-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`${destination.children?.length ?? 0} related destinations`} />
        <AdaptiveOverlay.Body className="xp-inset-recipients__branch-body"><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" /><div className="xp-inset-recipients__children">{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-inset-recipients__overlay-footer"><AdaptiveOverlay.Close className="xp-inset-recipients__overlay-close">Close branch</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function RecipientsOverlay({ model }: { model: InsetRecipientsModel }) {
  return (
    <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The six-recipient source relocates intact into one touch-anchored pane.">
      <AdaptiveOverlay.Trigger className="xp-inset-recipients__rail-trigger" aria-label="Open recipients" data-xp-inset-recipients-recipient-trigger=""><span className="xp-inset-recipients__recipient-glyph" aria-hidden="true">6</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-inset-recipients__recipients-overlay" data-xp-inset-recipients-recipient-overlay=""><AdaptiveOverlay.Header title="Recipients" description="Six saved payment contacts" /><AdaptiveOverlay.Body className="xp-inset-recipients__recipients-body"><RecipientList model={model} layout="pane" /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-inset-recipients__overlay-footer"><AdaptiveOverlay.Close className="xp-inset-recipients__overlay-close">Close recipients</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function TouchRail({ nav, model, activeId, renderIcon }: { nav: NavModel; model: InsetRecipientsModel; activeId: string; renderIcon?: NavIconRenderer }) {
  return <aside className="xp-inset-recipients__rail" data-xp-inset-recipients-rail=""><Brand nav={nav} /><nav aria-label="Finance destinations">{destinationsByPriority(nav).map((destination) => destination.children?.length ? <BranchPopover key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} /> : <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" />)}</nav><RecipientsOverlay model={model} /><AccountOverlay nav={nav} model={model} deviceClass="TL" renderIcon={renderIcon} mode="rail" /></aside>;
}

function validateInsetRecipients(nav: NavModel, model: InsetRecipientsModel, activeId: string) {
  const destinations = destinationsByPriority(nav);
  const ids = Array.from({ length: 8 }, (_, index) => `d${index + 1}`);
  const childCounts = destinations.filter(({ children }) => children?.length).map(({ children }) => children?.length).join("/");
  const valid = nav.family === "app" && destinations.map(({ id }) => id).join("/") === ids.join("/")
    && nav.groups?.length === 1 && nav.groups[0]?.destinationIds.join("/") === ids.join("/")
    && childCounts === "3/2/3/3/2/3/2"
    && destinations.reduce((sum, destination) => sum + (destination.children?.length ?? 0), 0) === 18
    && activeId === "d1" && model.recipients.length === 6
    && model.profile.name === "Iven Prent" && model.profile.role === "Finance Clerk"
    && nav.utility?.length === 5 && nav.utility.slice(0, 4).every(({ href }) => Boolean(href)) && !nav.utility[4]?.href
    && !nav.search && !nav.actions?.length && !nav.widgets?.length;
  if (!valid) throw new Error("NavModel/inset-recipients requires exact 8 routes, 7 branches with 3/2/3/3/2/3/2 children, current d1, six recipients, Iven account, five account jobs, and no extra jobs.");
}

export function InsetRecipientsNavigation({ nav, model, activeId, deviceClass, children, renderIcon, sourceSlug, sourcePreset }: {
  nav: NavModel;
  model: InsetRecipientsModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  validateInsetRecipients(nav, model, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-app-shell xp-inset-recipients-shell" data-xp-shell="" data-xp-inset-recipients-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.inset-recipients" data-device-class={deviceClass} data-variant={insetRecipientsForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {compact ? <header className="xp-inset-recipients__command"><Brand nav={nav} /><span>{nav.groups?.[0]?.label}</span></header> : null}
      <div className="xp-inset-recipients__body">
        {deviceClass === "TL" ? <TouchRail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} /> : null}
        {deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-inset-recipients__panel" data-xp-inset-recipients-panel=""><Brand nav={nav} /><CompleteTree nav={nav} activeId={activeId} renderIcon={renderIcon} surface="panel" /><RecipientList model={model} layout="panel" /><AccountOverlay nav={nav} model={model} deviceClass={deviceClass} renderIcon={renderIcon} mode="panel" /></aside> : null}
        <main className="xp-inset-recipients__main" id="xp-shell-content" tabIndex={-1}><section className="xp-inset-recipients__work-surface" data-xp-inset-recipients-work-surface="">{compact ? <RecipientList model={model} layout="card" /> : null}{children}</section></main>
      </div>
      {compact ? <CompactTabs nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} /> : null}
    </div>
  );
}
