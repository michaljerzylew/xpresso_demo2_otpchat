"use client";

import { AdaptiveOverlay, PriorityOverflowBar, useDeviceClass, type DeviceClass } from "@xp/primitives";
import type { ReactNode } from "react";

export type BreadcrumbItem = {
  id: string;
  label: string;
  href?: string;
};

export type AppBarContext = {
  title: string;
  breadcrumb?: readonly BreadcrumbItem[];
  greeting?: string;
};

export type AppBarSearch = {
  label: string;
  placeholder: string;
  hotkey?: string;
};

export type AppBarAction = {
  id: string;
  label: string;
  icon: string;
  priority: number;
  badge?: string | number;
  href?: string;
  actionId?: string;
};

export type AppBarIdentity = {
  name: string;
  role?: string;
  avatarLabel?: string;
};

export type AppBarModel = {
  context: AppBarContext;
  search?: AppBarSearch;
  actions?: readonly AppBarAction[];
  identity?: AppBarIdentity;
  contextStrip?: readonly { id: string; label: string; value?: string }[];
};

export type AppBarProperties = {
  model: AppBarModel;
  deviceClass?: DeviceClass;
  renderActionIcon?: (icon: string, action: AppBarAction) => ReactNode;
  onAction?: (actionId: string) => void;
  onBack?: () => void;
};

export function partitionCompactAppBarActions(actions: readonly AppBarAction[], deviceClass: "M" | "TP") {
  const ordered = [...actions].sort((left, right) => left.priority - right.priority);
  const visibleCount = deviceClass === "M" ? (ordered.length > 1 ? 0 : 1) : 1;
  return { visible: ordered.slice(0, visibleCount), overflow: ordered.slice(visibleCount) } as const;
}

function Glyph({ value }: { value: string }) {
  if (value === "search") {
    return (
      <span className="xp-shell-glyph" data-icon-key={value} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4" />
        </svg>
      </span>
    );
  }
  return <span className="xp-shell-glyph" data-icon-key={value} aria-hidden="true">{value.slice(0, 1).toUpperCase()}</span>;
}

export function AppBarActionControl({ action, renderIcon, onAction }: {
  action: AppBarAction;
  renderIcon?: AppBarProperties["renderActionIcon"];
  onAction?: AppBarProperties["onAction"];
}) {
  const content = (
    <>
      {renderIcon?.(action.icon, action) ?? <Glyph value={action.icon} />}
      <span className="xp-app-bar__action-label">{action.label}</span>
      {action.badge !== undefined ? <span className="xp-shell-badge" aria-label={`${action.label}: ${action.badge}`}>{action.badge}</span> : null}
    </>
  );
  if (action.href) {
    return <a className="xp-app-bar__action" href={action.href} aria-label={action.label} data-action-id={action.id}>{content}</a>;
  }
  return (
    <button
      className="xp-app-bar__action"
      type="button"
      aria-label={action.label}
      data-action-id={action.id}
      onClick={() => onAction?.(action.actionId ?? action.id)}
    >
      {content}
    </button>
  );
}

export function AppBarSearchControl({ search, deviceClass, inline = deviceClass === "DW" }: {
  search: AppBarSearch;
  deviceClass: DeviceClass;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <label className="xp-app-bar__search-field">
        <span className="xp-visually-hidden">{search.label}</span>
        <input type="search" aria-label={search.label} placeholder={search.placeholder} enterKeyHint="search" />
        {search.hotkey ? <kbd>{search.hotkey}</kbd> : null}
      </label>
    );
  }
  return (
    <AdaptiveOverlay
      intent="edit"
      presentation={deviceClass === "TL" ? { TL: "popover" } : undefined}
      why={deviceClass === "TL" ? "Landscape tablet search stays anchored to the app bar." : undefined}
    >
      <AdaptiveOverlay.Trigger aria-label={`${search.label}: ${search.placeholder}`}>
        <Glyph value="search" />
        <span className="xp-app-bar__search-label">{deviceClass === "DS" ? search.placeholder : search.label}</span>
        {deviceClass === "DS" && search.hotkey ? <kbd>{search.hotkey}</kbd> : null}
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content>
        <AdaptiveOverlay.Header title={search.label} description={search.placeholder} />
        <AdaptiveOverlay.Body>
          <label className="xp-app-bar__overlay-search">
            <span>{search.label}</span>
            <input type="search" aria-label={search.label} placeholder={search.placeholder} enterKeyHint="search" autoFocus />
          </label>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer>
          <AdaptiveOverlay.Close>Close search</AdaptiveOverlay.Close>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

export function AppBarCompactActionMenu({ actions, renderActionIcon, onAction, deviceClass }: {
  actions: readonly AppBarAction[];
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: AppBarProperties["onAction"];
  deviceClass: DeviceClass;
}) {
  const { visible, overflow } = partitionCompactAppBarActions(actions, deviceClass as "M" | "TP");
  return (
    <div className="xp-app-bar__compact-actions" data-relocation-target="appbar-trailing">
      {visible.map((action) => <AppBarActionControl key={action.id} action={action} renderIcon={renderActionIcon} onAction={onAction} />)}
      {overflow.length ? (
        <AdaptiveOverlay
          intent="menu"
          presentation={deviceClass === "TP" ? { TP: "bottom-sheet" } : undefined}
          why={deviceClass === "TP" ? "Portrait tablet actions use the same reachable sheet grammar as tab navigation." : undefined}
        >
          <AdaptiveOverlay.Trigger aria-label="More actions"><span aria-hidden="true">•••</span></AdaptiveOverlay.Trigger>
          <AdaptiveOverlay.Content>
            <AdaptiveOverlay.Header title="More actions" description="Actions that do not fit the compact app bar." />
            <AdaptiveOverlay.Body>
              <ul className="xp-app-bar__overflow-actions">
                {overflow.map((action) => <li key={action.id}><AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} /></li>)}
              </ul>
            </AdaptiveOverlay.Body>
            <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close actions</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
          </AdaptiveOverlay.Content>
        </AdaptiveOverlay>
      ) : null}
    </div>
  );
}

function Context({ context, compact, onBack }: { context: AppBarContext; compact: boolean; onBack?: () => void }) {
  const breadcrumb = context.breadcrumb ?? [];
  const breadcrumbItem = (item: BreadcrumbItem) => item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>;
  return (
    <div className="xp-app-bar__context" data-relocation-target="appbar-context">
      {compact ? (
        <>
          <button className="xp-app-bar__back" type="button" aria-label={`Back from ${context.title}`} onClick={onBack}>
            <span aria-hidden="true">←</span>
          </button>
          <span className="xp-app-bar__title">{context.title}</span>
          {breadcrumb.length ? (
            <ol className="xp-visually-hidden" aria-label="Breadcrumb">
              {breadcrumb.map((item) => <li key={item.id}>{breadcrumbItem(item)}</li>)}
            </ol>
          ) : null}
        </>
      ) : breadcrumb.length ? (
        <nav aria-label="Breadcrumb">
          <ol className="xp-app-bar__breadcrumb">
            {breadcrumb.map((item) => <li key={item.id}>{breadcrumbItem(item)}</li>)}
          </ol>
        </nav>
      ) : <span className="xp-app-bar__title">{context.title}</span>}
    </div>
  );
}

export function AppBar({ model, deviceClass: explicitClass, renderActionIcon, onAction, onBack }: AppBarProperties) {
  const detectedClass = useDeviceClass();
  const deviceClass = explicitClass ?? detectedClass;
  const compact = deviceClass === "M" || deviceClass === "TP";
  const actions = [...(model.actions ?? [])].sort((left, right) => left.priority - right.priority);
  const overflowItems = actions.map((action) => ({
    id: action.id,
    label: action.label,
    priority: action.priority,
    content: <AppBarActionControl action={action} renderIcon={renderActionIcon} onAction={onAction} />,
    onSelect: () => {
      if (action.href) globalThis.location?.assign(action.href);
      else onAction?.(action.actionId ?? action.id);
    },
  }));

  return (
    <header className="xp-app-bar" data-xp-app-bar data-xp-region="top" data-device-class={deviceClass} data-variant={compact ? "compact-title" : "top-bar"}>
      <div className="xp-app-bar__primary">
        <Context context={model.context} compact={compact} onBack={onBack} />
        {model.search ? <AppBarSearchControl search={model.search} deviceClass={deviceClass} /> : null}
        {compact && actions.length ? (
          <AppBarCompactActionMenu actions={actions} renderActionIcon={renderActionIcon} onAction={onAction} deviceClass={deviceClass} />
        ) : overflowItems.length ? (
          <div className="xp-app-bar__actions" data-relocation-target="appbar-trailing">
            <PriorityOverflowBar items={overflowItems} overflowLabel="More actions" closeLabel="Close actions" label="Page actions" />
          </div>
        ) : null}
        {model.identity ? (
          <button className="xp-app-bar__identity" type="button" aria-label={`Open account menu for ${model.identity.name}`}>
            <span className="xp-app-bar__avatar" aria-hidden="true">{model.identity.name.slice(0, 1).toUpperCase()}</span>
            <span className="xp-app-bar__identity-copy"><strong>{model.identity.name}</strong>{model.identity.role ? <small>{model.identity.role}</small> : null}</span>
          </button>
        ) : null}
      </div>
      {model.contextStrip?.length && (deviceClass === "DS" || deviceClass === "DW") ? (
        <ul className="xp-app-bar__context-strip" aria-label="Page context">
          {model.contextStrip.map((item) => <li key={item.id}><span>{item.label}</span>{item.value ? <strong>{item.value}</strong> : null}</li>)}
        </ul>
      ) : null}
    </header>
  );
}
