"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import { AppBarActionControl, AppBarSearchControl, type AppBarModel, type AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";

export type WorkspaceOption = { id: string; label: string; context: string };
export type WorkspaceTrialQuota = {
  planName: string;
  daysRemaining: number;
  used: number;
  total: number;
  detail: string;
  cta: string;
  addWorkspaceLabel: string;
};
export type WorkspaceTrialFooterLink = { id: string; label: string; href: string };
export type WorkspaceTrialModel = {
  workspaceOptions: readonly WorkspaceOption[];
  trial: WorkspaceTrialQuota;
  footerLinks: readonly WorkspaceTrialFooterLink[];
};
export type WorkspaceTrialReachability = {
  id: string;
  kind: "destination" | "action" | "workspace";
  parentId?: string;
  surface: "action-sheet" | "side-navigation" | "command-bar" | "workspace-switcher";
};

export function workspaceTrialReachability(nav: NavModel, appBar: AppBarModel, model: WorkspaceTrialModel, deviceClass: DeviceClass): WorkspaceTrialReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): WorkspaceTrialReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "action-sheet" : "side-navigation" },
      ...(destination.children ?? []).map(({ id }) => ({ id, kind: "destination" as const, parentId: destination.id, surface: compact ? "action-sheet" as const : "side-navigation" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "action" as const, surface: "command-bar" as const })),
    ...model.workspaceOptions.map(({ id }) => ({ id, kind: "workspace" as const, surface: compact ? "action-sheet" as const : "workspace-switcher" as const })),
  ];
}

function NavIcon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-shell-nav__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>;
}

function ChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return <a className="xp-workspace-trial__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a>;
}

function DestinationLink({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return (
    <a className="xp-workspace-trial__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}>
      <NavIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span>
      {destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}
    </a>
  );
}

function DestinationBranch({ destination, activeId, renderIcon, rail }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; rail: boolean }) {
  if (rail) return (
    <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Landscape tablet child routes stay reachable beside the compact rail.">
      <AdaptiveOverlay.Trigger className="xp-workspace-trial__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-workspace-branch-trigger="">
        <NavIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span>
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-workspace-branch-overlay="" data-branch-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} view.`} />
        <AdaptiveOverlay.Body><ul className="xp-workspace-trial__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
  return (
    <details className="xp-workspace-trial__branch" open={destination.children?.some(({ id }) => id === activeId)} data-xp-nav-branch="">
      <summary className="xp-workspace-trial__destination" data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}>
        <NavIcon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span className="xp-workspace-trial__chevron" aria-hidden="true">⌄</span>
      </summary>
      <ul className="xp-workspace-trial__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul>
    </details>
  );
}

function NavigationTree({ nav, activeId, renderIcon, rail = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const grouped = new Set((nav.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [
    ...(nav.groups ?? []).map((group) => ({ id: group.id, label: group.label, items: group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)) })),
    { id: "other", label: "More", items: destinations.filter(({ id }) => !grouped.has(id)) },
  ].filter(({ items }) => items.length);
  return <div className="xp-workspace-trial__groups" data-xp-workspace-navigation="" data-nav-presentation={rail ? "rail" : "panel"}>{groups.map((group) => (
    <section key={group.id} aria-labelledby={`xp-workspace-group-${group.id}`}><h2 id={`xp-workspace-group-${group.id}`}>{group.label}</h2><ul>{group.items.map((destination) => <li key={destination.id}>{destination.children?.length
      ? <DestinationBranch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} />
      : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul></section>
  ))}</div>;
}

function WorkspaceSwitcher({ model, compact = false, onAction }: { model: WorkspaceTrialModel; compact?: boolean; onAction?: AppBarProperties["onAction"] }) {
  const current = model.workspaceOptions[0];
  return (
    <details className="xp-workspace-trial__switcher" data-xp-workspace-switcher="" data-switcher-presentation={compact ? "compact" : "full"}>
      <summary><span aria-hidden="true">{current?.label.slice(0, 2).toUpperCase()}</span><span><strong>{current?.label}</strong><small>{current?.context}</small></span><span aria-hidden="true">⌄</span></summary>
      <ul>{model.workspaceOptions.map((workspace) => <li key={workspace.id}><button type="button" data-xp-workspace-option-id={workspace.id} onClick={() => onAction?.(workspace.id)}><strong>{workspace.label}</strong><small>{workspace.context}</small></button></li>)}</ul>
    </details>
  );
}

function TrialQuota({ trial, compact = false, onAction }: { trial: WorkspaceTrialQuota; compact?: boolean; onAction?: AppBarProperties["onAction"] }) {
  return (
    <section className="xp-workspace-trial__quota" data-xp-trial-quota="" data-trial-used={trial.used} data-trial-total={trial.total} data-quota-presentation={compact ? "compact" : "card"} aria-label={`${trial.planName}: ${trial.detail} ${trial.daysRemaining} days remaining.`}>
      <div><strong>{trial.planName}</strong><span>{trial.daysRemaining} days left</span></div>
      <p>{trial.detail}</p>
      <progress value={trial.used} max={trial.total}>{trial.used} of {trial.total}</progress>
      <button type="button" data-xp-trial-upgrade="" onClick={() => onAction?.("trial_upgrade")}>{trial.cta}</button>
    </section>
  );
}

function AddWorkspace({ label, onAction }: { label: string; onAction?: AppBarProperties["onAction"] }) {
  return <button className="xp-workspace-trial__add" type="button" data-xp-add-workspace="" onClick={() => onAction?.("add_workspace")}>{label}<span aria-hidden="true">＋</span></button>;
}

function Utility({ nav, onAction }: { nav: NavModel; onAction?: AppBarProperties["onAction"] }) {
  if (!nav.utility?.length) return null;
  return <section className="xp-workspace-trial__utility" aria-labelledby="xp-workspace-utility"><h2 id="xp-workspace-utility">System</h2><ul>{nav.utility.map((item) => <li key={item.id}><button type="button" onClick={() => onAction?.(item.actionId ?? item.id)}>{item.label}</button></li>)}</ul></section>;
}

function SidebarContents({ nav, model, activeId, renderIcon, onAction, rail = false }: { nav: NavModel; model: WorkspaceTrialModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; rail?: boolean }) {
  return <><WorkspaceSwitcher model={model} compact={rail} onAction={onAction} /><NavigationTree nav={nav} activeId={activeId} renderIcon={renderIcon} rail={rail} /><Utility nav={nav} onAction={onAction} /><TrialQuota trial={model.trial} compact={rail} onAction={onAction} /><AddWorkspace label={model.trial.addWorkspaceLabel} onAction={onAction} /></>;
}

function CompactOverlay({ nav, model, activeId, deviceClass, renderIcon, onAction }: { nav: NavModel; model: WorkspaceTrialModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The complete workspace, navigation, and trial workflow need one scroll-safe sheet with a persistent close action.">
      <AdaptiveOverlay.Trigger className="xp-workspace-trial__overlay-trigger" aria-label="Open workspace navigation" data-xp-workspace-overlay-trigger="" data-xp-nav-renderer=""><span aria-hidden="true">◧</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-workspace-overlay=""><AdaptiveOverlay.Header title="Workspace" description="Switch workspace, navigate, or manage the trial." /><AdaptiveOverlay.Body><nav className="xp-workspace-trial__overlay-nav" aria-label="Workspace navigation" data-xp-region="navigation"><SidebarContents nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /></nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: WorkspaceTrialModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  return <header className="xp-workspace-trial__command" data-xp-region="top">{compact ? <CompactOverlay nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} /> : <span className="xp-workspace-trial__context">{appBar.context.title}</span>}{appBar.search ? <AppBarSearchControl search={appBar.search} deviceClass={deviceClass} inline={!compact && deviceClass !== "TL"} /> : null}<div className="xp-workspace-trial__actions" aria-label="Workspace actions">{actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}</div></header>;
}

export function WorkspaceTrialShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: WorkspaceTrialModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-app-shell xp-workspace-trial-shell" data-xp-shell="" data-xp-workspace-trial-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="workspace-side" data-shell-anatomy="app.side.workspace-trial" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}>
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      {compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}
      <div className="xp-workspace-trial__body">{!compact ? <aside className="xp-workspace-trial__sidebar" data-xp-nav-renderer="" data-xp-region="navigation"><SidebarContents nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} rail={deviceClass === "TL"} /></aside> : null}<div className="xp-workspace-trial__stage">{!compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<main className="xp-workspace-trial__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-workspace-trial__surface" data-xp-workspace-main-surface="">{children}</section></main></div></div>
      <footer className="xp-workspace-trial__footer" data-xp-region="bottom"><nav aria-label="Workspace resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav></footer>
    </div>
  );
}
