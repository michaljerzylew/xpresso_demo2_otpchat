"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import type { AppBarAction, AppBarProperties } from "./app-bar";

export type RouteMinimalItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
};

export type RouteMinimalModel = {
  title: string;
  breadcrumb: readonly { id: string; label: string; href?: string }[];
  languageAction: AppBarAction;
  languageChoices: readonly RouteMinimalItem[];
  accountGroups: readonly { name: string; items: readonly RouteMinimalItem[] }[];
  profile: {
    name: string;
    email: string;
    role: string;
    avatarAlt: string;
  };
  avatar: {
    avifSrc: string;
    webpSrc: string;
    jpegSrc: string;
  };
};

function iconAction(item: RouteMinimalItem): AppBarAction {
  return { id: item.id, label: item.label, icon: item.icon, priority: 1, href: item.href, actionId: item.href ? undefined : item.id };
}

function Icon({ item, renderIcon }: { item: RouteMinimalItem; renderIcon?: AppBarProperties["renderActionIcon"] }) {
  return <span className="xp-route-minimal__icon" data-icon-key={item.icon} aria-hidden="true">{renderIcon?.(item.icon, iconAction(item)) ?? item.icon.slice(0, 1).toUpperCase()}</span>;
}

function Avatar({ model, large = false }: { model: RouteMinimalModel; large?: boolean }) {
  return (
    <span className={large ? "xp-route-minimal__avatar xp-route-minimal__avatar--large" : "xp-route-minimal__avatar"}>
      <picture>
        <source srcSet={model.avatar.avifSrc} type="image/avif" />
        <source srcSet={model.avatar.webpSrc} type="image/webp" />
        <img src={model.avatar.jpegSrc} alt={model.profile.avatarAlt} width={large ? 56 : 40} height={large ? 56 : 40} />
      </picture>
      <span className="xp-route-minimal__presence" aria-label="Available" />
    </span>
  );
}

function PanelToggleIcon() {
  return (
    <svg className="xp-route-minimal__panel-icon" data-xp-panel-toggle-icon="" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.75 4.75v14.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m6.25 10 1.5 2-1.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Breadcrumb({ model, compact, onBack }: { model: RouteMinimalModel; compact: boolean; onBack?: () => void }) {
  const parent = model.breadcrumb.at(-2);
  return (
    <div className="xp-route-minimal__route" data-xp-route-context="">
      {compact ? (
        <>
          <button className="xp-route-minimal__shell-control" type="button" aria-label={`Back to ${parent?.label ?? "previous route"}`} onClick={onBack} data-xp-shell-navigation="">
            <span aria-hidden="true">←</span>
          </button>
          <strong className="xp-route-minimal__leaf" data-xp-route-leaf="">{model.title}</strong>
          <nav className="xp-visually-hidden" aria-label="Breadcrumb" data-xp-full-breadcrumb="">
            <ol>{model.breadcrumb.map((item, index) => <li key={item.id}>{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current={index === model.breadcrumb.length - 1 ? "page" : undefined}>{item.label}</span>}</li>)}</ol>
          </nav>
        </>
      ) : (
        <>
          <button className="xp-route-minimal__shell-control" type="button" aria-label="Open workspace navigation" onClick={onBack} data-xp-shell-navigation="">
            <PanelToggleIcon />
          </button>
          <span className="xp-route-minimal__divider" aria-hidden="true" />
          <nav aria-label="Breadcrumb" data-xp-full-breadcrumb="">
            <ol className="xp-route-minimal__breadcrumb">
              {model.breadcrumb.map((item, index) => (
                <li key={item.id} data-breadcrumb-id={item.id}>
                  {item.href ? <a href={item.href}>{item.label}</a> : <span aria-current={index === model.breadcrumb.length - 1 ? "page" : undefined}>{item.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        </>
      )}
    </div>
  );
}

function LanguageMenu({ model, deviceClass, renderIcon, onAction }: { model: RouteMinimalModel; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [selectedId, setSelectedId] = useState(model.languageChoices[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const item: RouteMinimalItem = { id: model.languageAction.id, label: model.languageAction.label, icon: model.languageAction.icon };
  return (
    <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="pick" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Compact classes need a bounded locale sheet while larger classes preserve the anchored source menu.">
      <AdaptiveOverlay.Trigger className="xp-route-minimal__utility" aria-label={model.languageAction.label} data-xp-language-trigger=""><Icon item={item} renderIcon={renderIcon} /></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-route-minimal__overlay xp-route-minimal__language-overlay" data-xp-language-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title="Language choices" description="Choose the interface language." />
        <AdaptiveOverlay.Body className="xp-route-minimal__overlay-body" data-xp-language-body="">
          <div className="xp-route-minimal__menu" role="menu" aria-label="Language choices">
            {model.languageChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="menuitemradio"
                aria-checked={choice.id === selectedId}
                data-language-choice-id={choice.id}
                onClick={() => {
                  setSelectedId(choice.id);
                  onAction?.(choice.id);
                  setOpen(false);
                }}
              >
                <Icon item={choice} renderIcon={renderIcon} />
                <span>{choice.label}</span>
                <span className="xp-route-minimal__radio" aria-hidden="true">{choice.id === selectedId ? "●" : "○"}</span>
              </button>
            ))}
          </div>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-route-minimal__overlay-footer" data-xp-language-footer=""><AdaptiveOverlay.Close className="xp-route-minimal__overlay-close">Close languages</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function AccountMenu({ model, deviceClass, renderIcon, onAction }: { model: RouteMinimalModel; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [open, setOpen] = useState(false);
  return (
    <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Compact account commands need a bounded sheet while larger classes preserve an anchored identity menu.">
      <AdaptiveOverlay.Trigger className="xp-route-minimal__account" aria-label={`Open account menu for ${model.profile.name}`} data-xp-account-trigger=""><Avatar model={model} /></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-route-minimal__overlay xp-route-minimal__account-overlay" data-xp-account-overlay="" data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} />
        <AdaptiveOverlay.Body className="xp-route-minimal__overlay-body" data-xp-account-body="">
          <section className="xp-route-minimal__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}>
            <Avatar model={model} large />
            <div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><span data-profile-email-text="">{model.profile.email}</span></div>
          </section>
          <nav aria-label="Account commands">
            {model.accountGroups.map((group) => (
              <section className="xp-route-minimal__account-group" key={group.name} data-account-group={group.name}>
                <h3>{group.name}</h3>
                <ul>{group.items.map((command) => (
                  <li key={command.id}>
                    {command.href ? (
                      <a href={command.href} data-account-command-id={command.id} onClick={() => setOpen(false)}><Icon item={command} renderIcon={renderIcon} /><span>{command.label}</span></a>
                    ) : (
                      <button type="button" data-account-command-id={command.id} data-destructive={command.id.includes("sign-out") ? "true" : undefined} onClick={() => { onAction?.(command.id); setOpen(false); }}><Icon item={command} renderIcon={renderIcon} /><span>{command.label}</span></button>
                    )}
                  </li>
                ))}</ul>
              </section>
            ))}
          </nav>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-route-minimal__overlay-footer" data-xp-account-footer=""><AdaptiveOverlay.Close className="xp-route-minimal__overlay-close">Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

const forms: Record<DeviceClass, string> = { M: "compact-header", TP: "portrait-header", TL: "touch-header", DS: "desktop-header", DW: "wide-header" };

export function RouteMinimalAppBar({ model, deviceClass, children, renderActionIcon, onAction, onBack, sourceSlug, sourcePreset }: {
  model: RouteMinimalModel;
  deviceClass: DeviceClass;
  children: ReactNode;
  renderActionIcon?: AppBarProperties["renderActionIcon"];
  onAction?: AppBarProperties["onAction"];
  onBack?: () => void;
  sourceSlug?: string;
  sourcePreset?: string;
}) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <div className="xp-route-minimal" data-xp-shell="" data-shell-anatomy="appbar.route-minimal" data-shell-family="app" data-device-class={deviceClass} data-variant={forms[deviceClass]} data-source-slug={sourceSlug} data-source-preset={sourcePreset} data-xp-route-minimal-renderer="" data-xp-nav-renderer="">
      <header className="xp-route-minimal__bar" data-xp-region="top" data-xp-route-minimal-bar="">
        <Breadcrumb model={model} compact={compact} onBack={onBack} />
        <div className="xp-route-minimal__actions" aria-label="Header controls">
          <LanguageMenu model={model} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} />
          <AccountMenu model={model} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} />
        </div>
      </header>
      <main className="xp-route-minimal__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-route-minimal__surface">{children}</section></main>
    </div>
  );
}
