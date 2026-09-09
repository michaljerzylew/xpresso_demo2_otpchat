"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";
import {
  AppBarActionControl,
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

export type FilesQuotaProfile = {
  name: string;
  email: string;
  role: string;
  avatarAlt: string;
};

export type StorageQuota = {
  eyebrow: string;
  headline: string;
  used: number;
  total: number;
  unit: string;
  detail: string;
  cta: string;
  actionId: string;
};

export type FilesFooterItem = { id: string; label: string; href: string };
export type FilesFooterUtility = FilesFooterItem & { icon: string };

export type FilesQuotaModel = {
  profile: FilesQuotaProfile;
  avatarSrc: string;
  avatarSrcSet: string;
  storageQuota: StorageQuota;
  footerLinks: readonly FilesFooterItem[];
  footerUtilities: readonly FilesFooterUtility[];
};

export type FilesQuotaReachability = {
  id: string;
  kind: "destination" | "app-action" | "quota-action" | "footer-utility";
  parentId?: string;
  surface: "navigation" | "compact-sheet" | "command-bar" | "quota" | "footer";
};

export function filesQuotaReachability(nav: NavModel, appBar: AppBarModel, model: FilesQuotaModel, deviceClass: DeviceClass): FilesQuotaReachability[] {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return [
    ...destinationsByPriority(nav).flatMap((destination): FilesQuotaReachability[] => [
      { id: destination.id, kind: "destination", surface: compact ? "compact-sheet" : "navigation" },
      ...(destination.children ?? []).map(({ id }) => ({ id, parentId: destination.id, kind: "destination" as const, surface: compact ? "compact-sheet" as const : "navigation" as const })),
    ]),
    ...(appBar.actions ?? []).map(({ id }) => ({ id, kind: "app-action" as const, surface: "command-bar" as const })),
    { id: model.storageQuota.actionId, kind: "quota-action", surface: "quota" },
    ...model.footerUtilities.map(({ id }) => ({ id, kind: "footer-utility" as const, surface: "footer" as const })),
  ];
}

function SemanticIcon({ keyName, label, renderIcon }: { keyName: string; label: string; renderIcon?: NavIconRenderer }) {
  const destination: NavDestination = { id: keyName, label, href: "#", icon: keyName, priority: 0 };
  return <span className="xp-shell-nav__icon" data-icon-key={keyName} aria-hidden="true">{renderIcon?.(keyName, destination) ?? keyName.slice(0, 1).toUpperCase()}</span>;
}

function Profile({ model, compact = false }: { model: FilesQuotaModel; compact?: boolean }) {
  return (
    <section className="xp-files-quota__profile" data-xp-files-profile="" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
      <picture className="xp-files-quota__portrait">
        <source srcSet={model.avatarSrcSet} type="image/webp" />
        <img src={model.avatarSrc} srcSet={model.avatarSrcSet} sizes={compact ? "48px" : "40px"} width={160} height={160} alt={model.profile.avatarAlt} data-xp-files-avatar="" />
      </picture>
      <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span>{compact ? <a href={`mailto:${model.profile.email}`}>{model.profile.email}</a> : null}</div>
    </section>
  );
}

function SearchField({ nav }: { nav: NavModel }) {
  if (!nav.search) return null;
  return (
    <label className="xp-files-quota__search" data-xp-files-search="">
      <span>{nav.search.label}</span>
      <span className="xp-files-quota__search-control"><span aria-hidden="true">⌕</span><input type="search" aria-label={nav.search.label} placeholder={nav.search.placeholder} enterKeyHint="search" /></span>
    </label>
  );
}

function FileWidget({ nav, relocation }: { nav: NavModel; relocation: string }) {
  const widget = nav.widgets?.[0];
  if (!widget) return null;
  return <aside className="xp-files-quota__widget" data-xp-files-widget="" data-widget-id={widget.id} data-relocation-target={relocation}><span>{widget.label}</span><strong>{widget.value}</strong><small>{widget.detail}</small></aside>;
}

function Quota({ model, compact = false, onAction }: { model: FilesQuotaModel; compact?: boolean; onAction?: AppBarProperties["onAction"] }) {
  const quota = model.storageQuota;
  const progress = Math.min(100, Math.max(0, quota.used / quota.total * 100));
  return (
    <section className="xp-files-quota__quota" data-xp-storage-quota="" data-storage-used={quota.used} data-storage-total={quota.total} data-storage-unit={quota.unit} data-quota-presentation={compact ? "sheet" : "persistent"}>
      <span className="xp-files-quota__eyebrow">{quota.eyebrow}</span>
      <div><strong>{quota.headline}</strong><span><b>{quota.used}</b> / {quota.total} {quota.unit}</span></div>
      <progress max={quota.total} value={quota.used} aria-label={`${quota.headline}: ${quota.used} of ${quota.total} ${quota.unit}`} />
      <p>{quota.detail}</p>
      <button type="button" data-xp-storage-upgrade="" data-action-id={quota.actionId} onClick={() => onAction?.(quota.actionId)}>{quota.cta}</button>
      <span className="xp-visually-hidden">{Math.round(progress)} percent used</span>
    </section>
  );
}

function ChildLink({ child, parentId, activeId }: { child: NavChild; parentId: string; activeId: string }) {
  return <a className="xp-files-quota__child" href={child.href} data-nav-id={child.id} data-nav-parent-id={parentId} aria-current={child.id === activeId ? "page" : undefined}>{child.label}</a>;
}

function DestinationGlyph({ destination, renderIcon }: { destination: NavDestination; renderIcon?: NavIconRenderer }) {
  return <SemanticIcon keyName={destination.icon} label={destination.label} renderIcon={renderIcon} />;
}

function DestinationLink({ destination, activeId, renderIcon }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer }) {
  return <a className="xp-files-quota__destination" href={destination.href} data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined} aria-label={destination.label}><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span>{destination.badge ? <span className="xp-shell-badge" aria-label={`${destination.badge.label}: ${destination.badge.value}`}>{destination.badge.value}</span> : null}</a>;
}

function DestinationBranch({ destination, activeId, renderIcon, rail }: { destination: NavDestination; activeId: string; renderIcon?: NavIconRenderer; rail: boolean }) {
  if (rail) return (
    <AdaptiveOverlay intent="menu" presentation={{ TL: "popover" }} why="The landscape tablet rail keeps nested file views in a touch-safe anchored menu.">
      <AdaptiveOverlay.Trigger className="xp-files-quota__destination" aria-label={`Open ${destination.label}`} data-nav-id={destination.id} data-xp-files-branch-trigger=""><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-files-branch-overlay="" data-branch-id={destination.id}>
        <AdaptiveOverlay.Header title={destination.label} description={`Choose a ${destination.label} view.`} />
        <AdaptiveOverlay.Body><ul className="xp-files-quota__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
  return (
    <details className="xp-files-quota__branch" data-xp-nav-branch="" open={destination.children?.some(({ id }) => id === activeId)}>
      <summary className="xp-files-quota__destination" data-nav-id={destination.id} aria-current={destination.id === activeId ? "page" : undefined}><DestinationGlyph destination={destination} renderIcon={renderIcon} /><span>{destination.label}</span><span className="xp-files-quota__chevron" aria-hidden="true">⌄</span></summary>
      <ul className="xp-files-quota__children">{destination.children?.map((child) => <li key={child.id}><ChildLink child={child} parentId={destination.id} activeId={activeId} /></li>)}</ul>
    </details>
  );
}

function FileNavigation({ nav, activeId, renderIcon, rail = false }: { nav: NavModel; activeId: string; renderIcon?: NavIconRenderer; rail?: boolean }) {
  const destinations = destinationsByPriority(nav);
  const byId = new Map(destinations.map((destination) => [destination.id, destination]));
  const grouped = new Set((nav.groups ?? []).flatMap(({ destinationIds }) => [...destinationIds]));
  const groups = [...(nav.groups ?? []).map((group) => ({ ...group, items: group.destinationIds.map((id) => byId.get(id)).filter((item): item is NavDestination => Boolean(item)) })), { id: "other", label: "More", destinationIds: [], items: destinations.filter(({ id }) => !grouped.has(id)) }].filter(({ items }) => items.length);
  return (
    <nav className="xp-files-quota__navigation" aria-label="File workspace navigation" data-xp-files-navigation="" data-nav-presentation={rail ? "rail" : "panel"} data-xp-scroll="">
      {groups.map((group) => <section key={group.id} aria-labelledby={`xp-files-group-${group.id}`}><h2 id={`xp-files-group-${group.id}`}>{group.label}</h2><ul>{group.items.map((destination) => <li key={destination.id}>{destination.children?.length ? <DestinationBranch destination={destination} activeId={activeId} renderIcon={renderIcon} rail={rail} /> : <DestinationLink destination={destination} activeId={activeId} renderIcon={renderIcon} />}</li>)}</ul></section>)}
    </nav>
  );
}

function FullSidebar({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: FilesQuotaModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return <><div className="xp-files-quota__brand"><strong>{nav.identity.label}</strong><span>{nav.identity.shortLabel}</span></div><SearchField nav={nav} /><FileWidget nav={nav} relocation="navigation-panel" /><FileNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} /><Quota model={model} onAction={onAction} /></>;
}

function RailSidebar({ nav, model, activeId, renderIcon, onAction }: { nav: NavModel; model: FilesQuotaModel; activeId: string; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return (
    <>
      <strong className="xp-files-quota__rail-mark" aria-label={nav.identity.label}>{nav.identity.shortLabel}</strong>
      <AdaptiveOverlay intent="edit" presentation={{ TL: "popover" }} why="File search remains discoverable without widening the landscape tablet rail."><AdaptiveOverlay.Trigger className="xp-files-quota__rail-control" aria-label={`Search: ${nav.search?.placeholder ?? "files"}`} data-xp-files-search-trigger="">⌕</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-files-search-overlay=""><AdaptiveOverlay.Header title="Search files" description={nav.search?.placeholder} /><AdaptiveOverlay.Body><SearchField nav={nav} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>
      <FileNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} rail />
      <div className="xp-files-quota__rail-tools">
        <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="Storage remains visible and actionable beside the compact rail."><AdaptiveOverlay.Trigger className="xp-files-quota__rail-control" aria-label={`Storage ${model.storageQuota.used} of ${model.storageQuota.total} ${model.storageQuota.unit}`} data-xp-files-quota-trigger="">◴</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-files-quota-overlay=""><AdaptiveOverlay.Header title={model.storageQuota.headline} description={model.storageQuota.detail} /><AdaptiveOverlay.Body><Quota model={model} compact onAction={onAction} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close storage</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>
        <AdaptiveOverlay intent="inspect" presentation={{ TL: "popover" }} why="The operator profile stays one touch away from the rail."><AdaptiveOverlay.Trigger className="xp-files-quota__rail-profile" aria-label={`Open account for ${model.profile.name}`} data-xp-files-profile-trigger=""><Profile model={model} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-files-profile-overlay=""><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>
      </div>
    </>
  );
}

function CompactNavigation({ nav, model, activeId, deviceClass, renderIcon, onAction }: { nav: NavModel; model: FilesQuotaModel; activeId: string; deviceClass: "M" | "TP"; renderIcon?: NavIconRenderer; onAction?: AppBarProperties["onAction"] }) {
  return (
    <AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="Compact classes restore file search, every route, operator context, indexing status, and storage controls in one bounded surface.">
      <AdaptiveOverlay.Trigger className="xp-files-quota__overlay-trigger" aria-label="Open file navigation" data-xp-files-overlay-trigger="" data-xp-nav-renderer="">☰</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content data-xp-files-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={nav.identity.label} description="Search, navigate, and manage workspace storage." />
        <AdaptiveOverlay.Body data-xp-files-overlay-scroll="" data-xp-scroll=""><Profile model={model} compact /><SearchField nav={nav} /><FileWidget nav={nav} relocation="dashboard-feed-card" /><FileNavigation nav={nav} activeId={activeId} renderIcon={renderIcon} /><Quota model={model} compact onAction={onAction} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer data-xp-files-overlay-footer=""><AdaptiveOverlay.Close>Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function CompactActions({ appBar, deviceClass, renderActionIcon, onAction }: { appBar: AppBarModel; deviceClass: "M" | "TP"; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  const { visible, overflow } = partitionCompactAppBarActions(actions, deviceClass);
  return <div className="xp-files-quota__compact-actions">{visible.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}<AdaptiveOverlay intent="menu" presentation={{ M: "action-sheet", TP: "action-sheet" }} why="A bounded action sheet preserves every file command with a persistent close control."><AdaptiveOverlay.Trigger aria-label="More actions">•••</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-files-actions-overlay=""><AdaptiveOverlay.Header title="More actions" description="File workspace commands." /><AdaptiveOverlay.Body data-xp-files-actions-scroll="" data-xp-scroll=""><ul>{overflow.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}</ul></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-files-actions-footer=""><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function CommandBar({ nav, appBar, model, activeId, deviceClass, renderIcon, renderActionIcon, onAction }: { nav: NavModel; appBar: AppBarModel; model: FilesQuotaModel; activeId: string; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(appBar.actions ?? [])].sort((a, b) => a.priority - b.priority);
  return <header className="xp-files-quota__command" data-xp-region="top">{compact ? <CompactNavigation nav={nav} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} onAction={onAction} /> : <div className="xp-files-quota__route"><span>{nav.identity.label}</span><strong>{appBar.context.title}</strong></div>}<span className="xp-files-quota__connection">{appBar.context.greeting}</span>{compact ? <CompactActions appBar={appBar} deviceClass={deviceClass} renderActionIcon={renderActionIcon} onAction={onAction} /> : <div className="xp-files-quota__actions">{actions.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}<Profile model={model} /></div>}</header>;
}

function Footer({ model, renderIcon }: { model: FilesQuotaModel; renderIcon?: NavIconRenderer }) {
  return <footer className="xp-files-quota__footer" data-xp-files-footer="" data-xp-region="bottom"><nav aria-label="File resources"><ul>{model.footerLinks.map((link) => <li key={link.id}><a href={link.href} data-xp-footer-link-id={link.id}>{link.label}</a></li>)}</ul></nav><nav aria-label="File utilities"><ul>{model.footerUtilities.map((utility) => <li key={utility.id}><a href={utility.href} data-xp-footer-utility-id={utility.id} aria-label={utility.label} title={utility.label}><SemanticIcon keyName={utility.icon} label={utility.label} renderIcon={renderIcon} /></a></li>)}</ul></nav></footer>;
}

export function FilesQuotaShell({ nav, appBar, model, activeId, deviceClass, children, renderIcon, renderActionIcon, onAction, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: FilesQuotaModel; activeId: string; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-app-shell xp-files-quota-shell" data-xp-shell="" data-xp-files-quota-shell="" data-shell-family="app" data-device-class={deviceClass} data-variant="files-quota" data-shell-anatomy="app.side.files-quota" data-skin="plain" data-nav-placement="side" data-source-slug={sourceSlug} data-source-preset={sourcePreset}><a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>{compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<div className="xp-files-quota__body">{!compact ? <aside className="xp-files-quota__sidebar" data-xp-nav-renderer="" data-xp-region="navigation">{deviceClass === "TL" ? <RailSidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} /> : <FullSidebar nav={nav} model={model} activeId={activeId} renderIcon={renderIcon} onAction={onAction} />}</aside> : null}<div className="xp-files-quota__stage">{!compact ? <CommandBar nav={nav} appBar={appBar} model={model} activeId={activeId} deviceClass={deviceClass} renderIcon={renderIcon} renderActionIcon={renderActionIcon} onAction={onAction} /> : null}<main className="xp-files-quota__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-files-quota__surface" data-xp-files-work-surface="">{children}</section></main></div></div><Footer model={model} renderIcon={renderIcon} /></div>;
}
