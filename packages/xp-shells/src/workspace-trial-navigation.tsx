"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import type { AppBarProperties } from "./app-bar";
import { destinationsByPriority, type NavChild, type NavDestination, type NavIconRenderer, type NavModel } from "./nav-model";
import type { WorkspaceOption, WorkspaceTrialQuota } from "./workspace-trial-shell";

export type WorkspaceTrialNavigationModel = {
  workspaceOptions: readonly WorkspaceOption[];
  trial: WorkspaceTrialQuota;
};

export const workspaceTrialNavigationForms: Readonly<Record<DeviceClass, string>> = {
  M: "workspace-trial-tabs",
  TP: "workspace-trial-portrait-tabs",
  TL: "workspace-trial-touch-rail",
  DS: "workspace-trial-panel",
  DW: "workspace-trial-wide-panel",
};

export function workspaceTrialNavigationReachability(nav: NavModel, model: WorkspaceTrialNavigationModel, deviceClass: DeviceClass) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const rail = deviceClass === "TL";
  return [
    ...destinationsByPriority(nav).flatMap((destination) => [
      { id: destination.id, kind: "destination" as const, taps: compact ? 2 : 1, surface: compact ? "complete-more-sheet" : rail ? "touch-rail" : "complete-panel" },
      ...(destination.children ?? []).map((child) => ({ id: child.id, kind: "destination" as const, parentId: destination.id, taps: 2 as const, surface: compact ? "complete-more-sheet" : rail ? "branch-popover" : "branch-disclosure" })),
    ]),
    ...model.workspaceOptions.map((workspace) => ({ id: workspace.id, kind: "workspace" as const, taps: 2 as const, surface: compact ? "more-header" : "workspace-popover" })),
    { id: "trial_upgrade", kind: "action" as const, taps: rail ? 2 : 1, surface: rail ? "trial-pane" : "trial-card" },
    { id: "add_workspace", kind: "action" as const, taps: compact || rail ? 2 : 1, surface: compact ? "more-header" : rail ? "workspace-popover" : "complete-panel" },
  ];
}

function Icon({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <span className="xp-workspace-navigation__icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.icon.slice(0, 1).toUpperCase()}</span>;
}

function Badge({ badge }: { badge?: { label: string; value: string | number } }) {
  return badge ? <span className="xp-workspace-navigation__badge" aria-label={`${badge.label}: ${badge.value}`}>{badge.value}</span> : null;
}

function ChildLink({ child, parentId }: { child: NavChild; parentId: string }) {
  return <a className="xp-workspace-navigation__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId}><span>{child.label}</span><Badge badge={child.badge} /></a>;
}

function DestinationLink({ destination, activeId, renderIcon, className = "" }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; className?: string }) {
  return <a className={`xp-workspace-navigation__destination ${className}`.trim()} href={destination.href} data-nav-id={destination.id} data-current={destination.id === activeId} aria-current={destination.id === activeId ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span className="xp-workspace-navigation__label">{destination.label}</span><Badge badge={destination.badge} /></a>;
}

function WorkspaceMark({ option, index }: { option: WorkspaceOption; index: number }) {
  return <span className="xp-workspace-navigation__workspace-mark" data-tone={index + 1} aria-hidden="true">{option.label.slice(0, 2).toUpperCase()}</span>;
}

function WorkspaceList({ model, activeWorkspaceId, onSelect, onAction, includeAdd = true }: { model: WorkspaceTrialNavigationModel; activeWorkspaceId: string; onSelect: (id: string) => void; onAction?: AppBarProperties["onAction"]; includeAdd?: boolean }) {
  return <div className="xp-workspace-navigation__workspace-list" data-xp-workspace-options=""><span className="xp-workspace-navigation__section-label">Workspaces</span><ul>{model.workspaceOptions.map((option, index) => <li key={option.id}><button type="button" data-xp-workspace-option-id={option.id} aria-pressed={option.id === activeWorkspaceId} onClick={() => { onSelect(option.id); onAction?.(option.id); }}><WorkspaceMark option={option} index={index} /><span><strong>{option.label}</strong><small>{option.context}</small></span></button></li>)}</ul>{includeAdd ? <button className="xp-workspace-navigation__add" type="button" data-action-id="add_workspace" data-xp-add-workspace="" onClick={() => onAction?.("add_workspace")}>{model.trial.addWorkspaceLabel}<span aria-hidden="true">＋</span></button> : null}</div>;
}

function WorkspaceSwitcher({ model, activeWorkspaceId, deviceClass, onSelect, onAction }: { model: WorkspaceTrialNavigationModel; activeWorkspaceId: string; deviceClass: DeviceClass; onSelect: (id: string) => void; onAction?: AppBarProperties["onAction"] }) {
  const index = Math.max(0, model.workspaceOptions.findIndex(({ id }) => id === activeWorkspaceId));
  const current = model.workspaceOptions[index] ?? model.workspaceOptions[0];
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="All four workspace choices remain a bounded two-tap switcher on every screen class."><AdaptiveOverlay.Trigger className="xp-workspace-navigation__switcher" aria-label={`Switch workspace from ${current?.label}`} data-xp-workspace-switcher-trigger=""><WorkspaceMark option={current} index={index} /><span><strong>{current?.label}</strong><small>{current?.context}</small></span><b aria-hidden="true">⌄</b></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-workspace-navigation__workspace-overlay" data-xp-workspace-switcher-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Workspaces" description="Choose a rental workspace or start a separate room." /><AdaptiveOverlay.Body className="xp-workspace-navigation__overlay-body"><WorkspaceList model={model} activeWorkspaceId={activeWorkspaceId} onSelect={onSelect} onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-workspace-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-workspace-navigation__overlay-close">Close workspace switcher</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function TrialCard({ trial, presentation, onAction }: { trial: WorkspaceTrialQuota; presentation: "card" | "compact" | "pane"; onAction?: AppBarProperties["onAction"] }) {
  return <section className="xp-workspace-navigation__trial" data-xp-trial-quota="" data-trial-used={trial.used} data-trial-total={trial.total} data-trial-days={trial.daysRemaining} data-quota-presentation={presentation} aria-label={`${trial.planName}. ${trial.detail}`}><div><span>Trial status</span><strong>{trial.planName}</strong><b>{trial.daysRemaining} days left</b></div><p>{trial.detail}</p><progress value={trial.used} max={trial.total}>{trial.used} of {trial.total}</progress><button type="button" data-action-id="trial_upgrade" data-xp-trial-upgrade="" onClick={() => onAction?.("trial_upgrade")}>{trial.cta}</button></section>;
}

function TrialPane({ model, deviceClass, onAction }: { model: WorkspaceTrialNavigationModel; deviceClass: "TL"; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The persistent trial chip opens the complete quota record without crowding the touch rail."><AdaptiveOverlay.Trigger className="xp-workspace-navigation__trial-trigger" aria-label="Open trial status" data-xp-trial-trigger=""><span>{model.trial.daysRemaining}</span><small>Trial days</small></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-workspace-navigation__trial-overlay" data-xp-trial-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={model.trial.planName} description={`${model.trial.daysRemaining} days remain in this evaluation.`} /><AdaptiveOverlay.Body className="xp-workspace-navigation__overlay-body"><TrialCard trial={model.trial} presentation="pane" onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-workspace-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-workspace-navigation__overlay-close">Close trial status</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function RailBranch({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="Child destinations remain labelled and reachable beside the touch-native rail."><AdaptiveOverlay.Trigger className="xp-workspace-navigation__rail-trigger" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-workspace-branch-trigger=""><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><Badge badge={destination.badge} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-workspace-navigation__branch-overlay" data-xp-workspace-branch-overlay="" data-branch-id={destination.id} data-device-class="TL"><AdaptiveOverlay.Header title={destination.label} description={`${destination.children?.length ?? 0} related destinations`} /><AdaptiveOverlay.Body className="xp-workspace-navigation__overlay-body"><ul className="xp-workspace-navigation__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-workspace-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-workspace-navigation__overlay-close">Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTree({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-workspace-navigation__complete-tree" aria-label="Complete workspace navigation" data-xp-workspace-navigation="">{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id}>{group.label ? <h2>{group.label}</h2> : null}<ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}><DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />{destination.children?.length ? <ul className="xp-workspace-navigation__children" data-branch-id={destination.id}>{destination.children.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} /></li>)}</ul> : null}</li>)}</ul></section>)}</nav>;
}

function PanelTree({ nav, activeId, renderIcon }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer }) {
  const byId = new Map(nav.destinations.map((destination) => [destination.id, destination]));
  return <nav className="xp-workspace-navigation__complete-tree" aria-label="Workspace navigation" data-xp-workspace-navigation="">{(nav.groups ?? []).map((group) => <section key={group.id} data-nav-group-id={group.id}>{group.label ? <h2>{group.label}</h2> : null}<ul>{group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)).map((destination) => <li key={destination.id}>{destination.children?.length ? <details data-xp-workspace-branch=""><summary data-nav-id={destination.id} data-current={destination.id === activeId} aria-current={destination.id === activeId ? "page" : undefined}><Icon destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><Badge badge={destination.badge} /><b aria-hidden="true">⌄</b></summary><ul className="xp-workspace-navigation__children" data-branch-id={destination.id}>{destination.children.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} /></li>)}</ul></details> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul></section>)}</nav>;
}

function CompactMore({ nav, model, activeId, deviceClass, activeWorkspaceId, onSelect, renderIcon, onAction }: { nav: NavModel; model: WorkspaceTrialNavigationModel; activeId: string; deviceClass: "M" | "TP"; activeWorkspaceId: string; onSelect: (id: string) => void; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="The complete grouped graph and workspace header stay reachable behind one labelled More control."><AdaptiveOverlay.Trigger className="xp-workspace-navigation__more-trigger" aria-label="More destinations" data-xp-workspace-more-trigger=""><span aria-hidden="true"><i /><i /><i /></span><span>More</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-workspace-navigation__more-overlay" data-xp-workspace-more-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Workspace navigation" description="Switch workspace or choose a destination." /><AdaptiveOverlay.Body className="xp-workspace-navigation__more-body"><WorkspaceList model={model} activeWorkspaceId={activeWorkspaceId} onSelect={onSelect} onAction={onAction} /><CompactTree nav={nav} activeId={activeId} renderIcon={renderIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-workspace-navigation__overlay-footer"><AdaptiveOverlay.Close className="xp-workspace-navigation__overlay-close">Close destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function CompactTabs({ nav, model, activeId, deviceClass, activeWorkspaceId, onSelect, renderIcon, onAction }: { nav: NavModel; model: WorkspaceTrialNavigationModel; activeId: string; deviceClass: "M" | "TP"; activeWorkspaceId: string; onSelect: (id: string) => void; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return <nav className="xp-workspace-navigation__tabs" aria-label="Primary workspace navigation" data-xp-workspace-tab-rank="">{destinationsByPriority(nav).slice(0, 4).map((destination) => <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} className="xp-workspace-navigation__tab" />)}<CompactMore nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} activeWorkspaceId={activeWorkspaceId} onSelect={onSelect} renderIcon={renderIcon} onAction={onAction} /></nav>;
}

export function WorkspaceTrialNavigation({ nav, model, activeId, deviceClass, children, renderIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; model: WorkspaceTrialNavigationModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(model.workspaceOptions[0]?.id ?? "");
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-workspace-navigation-shell" data-xp-shell="" data-xp-workspace-navigation-shell="" data-xp-nav-renderer="" data-shell-family="app" data-shell-anatomy="nav-model.workspace-trial" data-device-class={deviceClass} data-variant={workspaceTrialNavigationForms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <header className="xp-workspace-navigation__command"><span className="xp-workspace-navigation__command-mark" aria-hidden="true">DS</span><span><strong>Dovrin Shift</strong><small>Operations hub</small></span></header> : null}<div className="xp-workspace-navigation__body">{deviceClass === "TL" ? <aside className="xp-workspace-navigation__rail" data-xp-workspace-rail=""><WorkspaceSwitcher model={model} activeWorkspaceId={activeWorkspaceId} deviceClass={deviceClass} onSelect={setActiveWorkspaceId} onAction={onAction} /><nav aria-label="Workspace rail">{destinationsByPriority(nav).map((destination) => destination.children?.length ? <RailBranch key={destination.id} destination={destination} renderIcon={renderIcon} /> : <DestinationLink key={destination.id} destination={destination} activeId={activeId} renderIcon={renderIcon} className="xp-workspace-navigation__rail-trigger" />)}</nav><TrialPane model={model} deviceClass={deviceClass} onAction={onAction} /></aside> : null}{deviceClass === "DS" || deviceClass === "DW" ? <aside className="xp-workspace-navigation__panel" data-xp-workspace-panel=""><WorkspaceSwitcher model={model} activeWorkspaceId={activeWorkspaceId} deviceClass={deviceClass} onSelect={setActiveWorkspaceId} onAction={onAction} /><PanelTree nav={nav} activeId={activeId} renderIcon={renderIcon} /><TrialCard trial={model.trial} presentation={deviceClass === "DS" ? "compact" : "card"} onAction={onAction} /><button className="xp-workspace-navigation__add" type="button" data-action-id="add_workspace" data-xp-add-workspace="" onClick={() => onAction?.("add_workspace")}>{model.trial.addWorkspaceLabel}<span aria-hidden="true">＋</span></button></aside> : null}<main className="xp-workspace-navigation__main" id="xp-shell-content" tabIndex={-1}><section className="xp-workspace-navigation__work-surface">{compact ? <TrialCard trial={model.trial} presentation="card" onAction={onAction} /> : null}{children}</section></main></div>{compact ? <CompactTabs nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} activeWorkspaceId={activeWorkspaceId} onSelect={setActiveWorkspaceId} renderIcon={renderIcon} onAction={onAction} /> : null}</div>;
}
