"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import type { LiveOperation } from "./live-operations-shell";
import {
  destinationsByPriority,
  type NavChild,
  type NavDestination,
  type NavIconRenderer,
  type NavModel,
} from "./nav-model";

export const operationsLiveForms = {
  M: "operations-live-tabs",
  TP: "operations-live-portrait-tabs",
  TL: "operations-live-touch-rail",
  DS: "operations-live-panel",
  DW: "operations-live-wide-panel",
} as const satisfies Readonly<Record<DeviceClass, string>>;

export type OperationsLiveModel = { liveOperation: LiveOperation };

export type OperationsLiveReachability = {
  id: string;
  kind: "destination" | "live-action";
  taps: 1 | 2;
  surface: "first-paint-tab" | "complete-more-sheet" | "touch-popover" | "complete-panel" | "live-operation";
};

export function operationsLiveReachability(nav: NavModel, model: OperationsLiveModel, deviceClass: DeviceClass): OperationsLiveReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const rail = deviceClass === "TL";
  const destinations = destinationsByPriority(nav);
  return [
    ...destinations.flatMap((destination, index): OperationsLiveReachability[] => [
      {
        id: destination.id,
        kind: "destination",
        taps: compact && index >= 4 ? 2 : rail ? 2 : 1,
        surface: compact && index >= 4 ? "complete-more-sheet" : compact ? "first-paint-tab" : rail ? "touch-popover" : "complete-panel",
      },
      ...(destination.children ?? []).map(({ id }) => ({
        id,
        kind: "destination" as const,
        taps: 2 as const,
        surface: compact ? "complete-more-sheet" as const : rail ? "touch-popover" as const : "complete-panel" as const,
      })),
    ]),
    { id: model.liveOperation.actionId, kind: "live-action", taps: deviceClass === "DS" || deviceClass === "DW" ? 1 : 2, surface: "live-operation" },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return (
    <span className="xp-operations-live__icon" data-icon-key={destination.icon} aria-hidden="true">
      {renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Brand({ nav }: { nav: NavModel }) {
  return (
    <div className="xp-operations-live__brand" data-xp-operations-live-identity="" aria-label={nav.identity.label}>
      <span className="xp-operations-live__mark" aria-hidden="true"><i /><i /><i /></span>
      <strong>{nav.identity.label}</strong>
    </div>
  );
}

function SourceBadge({ destination }: { destination: NavDestination }) {
  if (!destination.badge) return null;
  return (
    <span
      className="xp-operations-live__source-badge"
      data-xp-operations-live-source-badge=""
      data-badge-value={destination.badge.value}
      data-badge-label={destination.badge.label}
      aria-label={`${destination.badge.label}: ${destination.badge.value}`}
    >
      {destination.badge.value}
    </span>
  );
}

function LiveCount({ model }: { model: OperationsLiveModel }) {
  return <span className="xp-operations-live__live-count" data-xp-operations-live-count="" data-live-count={model.liveOperation.count}>{model.liveOperation.count}</span>;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-operations-live__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId}>{child.label}</a>;
}

function DestinationLink({ destination, activeId, renderIcon, surface, model }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "tab" | "sheet" | "panel" | "popover";
  model?: OperationsLiveModel;
}) {
  return (
    <a
      className="xp-operations-live__destination"
      href={destination.href}
      data-nav-id={destination.id}
      data-xp-operations-live-destination=""
      data-xp-operations-live-surface={surface}
      aria-current={destination.id === activeId ? "page" : undefined}
    >
      <Icon destination={destination} renderIcon={renderIcon} />
      <span className="xp-operations-live__label">{destination.label}</span>
      <SourceBadge destination={destination} />
      {model && destination.id === "dest-7" ? <LiveCount model={model} /> : null}
    </a>
  );
}

function BranchDestination({ destination, activeId, renderIcon, surface, defaultOpen }: {
  destination: NavDestination;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "panel";
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const childId = `xp-operations-live-children-${surface}-${destination.id}`;
  return (
    <div className="xp-operations-live__branch" data-xp-operations-live-branch="" data-branch-id={destination.id} data-branch-open={open ? "true" : "false"}>
      <div className="xp-operations-live__branch-row">
        <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} />
        <button
          type="button"
          className="xp-operations-live__branch-toggle"
          aria-label={`${open ? "Hide" : "Show"} ${destination.label} destinations`}
          aria-expanded={open}
          aria-controls={childId}
          data-xp-operations-live-branch-trigger=""
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">⌄</span>
        </button>
      </div>
      {open ? <div className="xp-operations-live__children" id={childId}>{destination.children?.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div> : null}
    </div>
  );
}

function GroupedNavigation({ nav, model, activeId, renderIcon, surface }: {
  nav: NavModel;
  model: OperationsLiveModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  surface: "sheet" | "panel";
}) {
  const byId = new Map(destinationsByPriority(nav).map((destination) => [destination.id, destination]));
  return (
    <nav className="xp-operations-live__navigation" aria-label="Operations destinations" data-xp-operations-live-navigation="" data-navigation-surface={surface}>
      {nav.groups?.map((group) => (
        <section className="xp-operations-live__group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>
          {group.label ? <h2>{group.label}</h2> : null}
          <div className="xp-operations-live__group-items">
            {group.destinationIds.map((id) => {
              const destination = byId.get(id);
              if (!destination) return null;
              return destination.children?.length
                ? <BranchDestination key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} defaultOpen={surface === "sheet"} />
                : <DestinationLink key={id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface={surface} model={surface === "sheet" ? model : undefined} />;
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function StaffCluster({ model, detailed = false }: { model: OperationsLiveModel; detailed?: boolean }) {
  return (
    <ul className="xp-operations-live__staff" aria-label="Staff assigned to live service">
      {model.liveOperation.staff.map((person) => (
        <li key={person.id} data-xp-operations-live-staff-id={person.id} data-staff-name={person.name} data-staff-role={person.role} data-staff-tone={person.tone}>
          <span className="xp-operations-live__initials" data-tone={person.tone} aria-hidden="true">{person.initials}</span>
          {detailed ? <span className="xp-operations-live__staff-copy"><strong>{person.name}</strong><small>{person.role}</small></span> : <span className="xp-visually-hidden">{person.name}, {person.role}</span>}
        </li>
      ))}
    </ul>
  );
}

function OperationPanel({ model, detailed = false, onAction }: { model: OperationsLiveModel; detailed?: boolean; onAction?: (actionId: string) => void }) {
  const operation = model.liveOperation;
  return (
    <section className="xp-operations-live__operation" data-xp-operations-live-operation="" data-live-count={operation.count}>
      <span className="xp-operations-live__eyebrow">{operation.eyebrow}</span>
      <div className="xp-operations-live__metric"><strong>{operation.count}</strong><span>{operation.headline}</span></div>
      <p>{operation.detail}</p>
      <StaffCluster model={model} detailed={detailed} />
      <button type="button" className="xp-operations-live__action" data-xp-operations-live-action="" data-action-id={operation.actionId} onClick={() => onAction?.(operation.actionId)}>{operation.actionLabel}</button>
    </section>
  );
}

function LiveOverlay({ model, deviceClass, trigger, onAction, popover = false }: {
  model: OperationsLiveModel;
  deviceClass: DeviceClass;
  trigger: ReactNode;
  onAction?: (actionId: string) => void;
  popover?: boolean;
}) {
  return (
    <AdaptiveOverlay
      intent="inspect"
      presentation={popover ? { TL: "popover" } : { M: "action-sheet", TP: "action-sheet" }}
      why="The single live-operation source relocates into a bounded compact sheet or touch-anchored tablet popover."
    >
      <AdaptiveOverlay.Trigger className="xp-operations-live__live-trigger" aria-label={`Open live service, ${model.liveOperation.count} orders`} data-xp-operations-live-live-trigger="">{trigger}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-operations-live__live-overlay" data-xp-operations-live-live-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={model.liveOperation.headline} description={model.liveOperation.detail} />
        <AdaptiveOverlay.Body className="xp-operations-live__live-body" data-xp-operations-live-live-body=""><OperationPanel model={model} detailed onAction={onAction} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-operations-live__overlay-footer" data-xp-operations-live-live-footer=""><AdaptiveOverlay.Close className="xp-operations-live__overlay-close">Close live service</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function MoreSheet({ nav, model, activeId, deviceClass, renderIcon }: {
  nav: NavModel;
  model: OperationsLiveModel;
  activeId: string;
  deviceClass: "M" | "TP";
  renderIcon?: NavIconRenderer;
}) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Four first-paint tabs hand off to one complete grouped graph with both branch children already reachable within two taps.">
      <AdaptiveOverlay.Trigger className="xp-operations-live__more-trigger" aria-label="More destinations" data-xp-operations-live-more-trigger=""><span className="xp-operations-live__more-icon" aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-operations-live__more-overlay" data-xp-operations-live-more-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="All destinations" description="Service and operations desk" />
        <AdaptiveOverlay.Body className="xp-operations-live__more-body" data-xp-operations-live-more-body=""><GroupedNavigation nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} surface="sheet" /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-operations-live__overlay-footer" data-xp-operations-live-more-footer=""><AdaptiveOverlay.Close className="xp-operations-live__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactChrome({ nav, model, activeId, deviceClass, renderIcon, onAction }: {
  nav: NavModel;
  model: OperationsLiveModel;
  activeId: string;
  deviceClass: "M" | "TP";
  renderIcon?: NavIconRenderer;
  onAction?: (actionId: string) => void;
}) {
  return (
    <>
      <header className="xp-operations-live__command" data-xp-operations-live-command=""><Brand nav={nav} /><LiveOverlay model={model} deviceClass={deviceClass} onAction={onAction} trigger={<><LiveCount model={model} /><span>Live</span></>} /></header>
      <nav className="xp-operations-live__tabs" aria-label="Primary destinations" data-xp-operations-live-tab-rank="">
        {destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} surface="tab" />)}
        <MoreSheet nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} />
      </nav>
    </>
  );
}

function RailDestination({ destination, model, activeId, renderIcon, onAction }: {
  destination: NavDestination;
  model: OperationsLiveModel;
  activeId: string;
  renderIcon?: NavIconRenderer;
  onAction?: (actionId: string) => void;
}) {
  const live = destination.id === "dest-7";
  return (
    <AdaptiveOverlay intent={live ? "inspect" : "menu"} presentation={{ TL: "popover" }} why="The touch rail exposes labels and branch children in anchored popovers without hover-only discovery.">
      <AdaptiveOverlay.Trigger className="xp-operations-live__rail-trigger" aria-label={`Open ${destination.label}`} aria-current={destination.id === activeId ? "page" : undefined} data-nav-trigger-id={destination.id} data-xp-operations-live-rail-trigger="">
        <Icon destination={destination} renderIcon={renderIcon} /><SourceBadge destination={destination} />{live ? <LiveCount model={model} /> : null}
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-operations-live__rail-overlay" data-xp-operations-live-rail-overlay="" data-nav-popover-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={live ? undefined : destination.children?.length ? "Choose a destination" : "Open destination"} />
        <AdaptiveOverlay.Body className="xp-operations-live__rail-body">
          <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} surface="popover" />
          {destination.children?.length ? <div className="xp-operations-live__children">{destination.children.map((child) => <ChildLink key={child.id} child={child} parentId={destination.id} />)}</div> : null}
          {live ? <OperationPanel model={model} detailed onAction={onAction} /> : null}
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-operations-live__overlay-footer"><AdaptiveOverlay.Close className="xp-operations-live__overlay-close">Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function TouchRail({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: OperationsLiveModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: (actionId: string) => void }) {
  const byId = new Map(destinationsByPriority(nav).map((destination) => [destination.id, destination]));
  return (
    <aside className="xp-operations-live__rail" data-xp-operations-live-rail="">
      <Brand nav={nav} />
      <nav aria-label="Operations destinations">
        {nav.groups?.map((group) => <section className="xp-operations-live__rail-group" key={group.id} data-nav-group-id={group.id} data-nav-group-label={group.label} data-nav-group-count={group.destinationIds.length}>{group.label ? <h2 className="xp-visually-hidden">{group.label}</h2> : null}{group.destinationIds.map((id) => { const destination = byId.get(id); return destination ? <RailDestination key={id} destination={destination} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /> : null; })}</section>)}
      </nav>
    </aside>
  );
}

function validateOperationsLive(nav: NavModel, model: OperationsLiveModel, activeId: string) {
  const destinations = destinationsByPriority(nav);
  const ids = Array.from({ length: 13 }, (_, index) => `dest-${index + 1}`);
  const children = destinations.filter(({ children }) => children?.length);
  const valid = nav.family === "app"
    && destinations.map(({ id }) => id).join("/") === ids.join("/")
    && nav.groups?.map(({ id }) => id).join("/") === "group-service/group-admin"
    && nav.groups?.map(({ destinationIds }) => destinationIds.length).join("/") === "8/5"
    && nav.groups?.flatMap(({ destinationIds }) => destinationIds).join("/") === ids.join("/")
    && children.map(({ id }) => id).join("/") === "dest-6/dest-10"
    && children.map(({ children: branchChildren }) => branchChildren?.length).join("/") === "2/2"
    && destinations.filter(({ badge }) => badge).map(({ id }) => id).join("/") === "dest-4"
    && destinations[3]?.badge?.value === 2
    && activeId === "dest-1"
    && model.liveOperation.count === 234
    && model.liveOperation.staff.length === 4
    && model.liveOperation.actionId === "action-live-ops"
    && !nav.search
    && !nav.actions?.length
    && !nav.utility?.length
    && !nav.widgets?.length;
  if (!valid) throw new Error("NavModel/operations-live requires exact 13 routes in 8/5 groups, 2/2 branch children, source badge 2, current d1, live count 234, four staff, one live action, and no extra jobs.");
}

export function OperationsLiveNavigation({ nav, model, activeId, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: {
  nav: NavModel;
  model: OperationsLiveModel;
  activeId: string;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderIcon?: NavIconRenderer;
  onAction?: (actionId: string) => void;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  validateOperationsLive(nav, model, activeId);
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-app-shell xp-operations-live-shell" data-xp-shell="" data-xp-operations-live-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.operations-live" data-device-class={deviceClass} data-variant={operationsLiveForms[deviceClass]} data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {compact ? <CompactChrome nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} /> : null}
      <div className="xp-operations-live__body">
        {deviceClass === "TL" ? <TouchRail nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /> : null}
        {deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-operations-live__panel" data-xp-operations-live-panel=""><Brand nav={nav} /><GroupedNavigation nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} surface="panel" /><OperationPanel model={model} detailed={deviceClass === "DW"} onAction={onAction} /></aside> : null}
        <main className="xp-operations-live__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-operations-live__work-surface" data-xp-operations-live-work-surface="">{children}</section></main>
      </div>
    </div>
  );
}
