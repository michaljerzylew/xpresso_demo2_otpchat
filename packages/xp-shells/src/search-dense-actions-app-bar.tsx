"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { AppBarAction, AppBarContext, AppBarProperties } from "./app-bar";
import type { NavIconRenderer, NavModel } from "./nav-model";

export type SearchDenseAction = {
  id: string;
  label: string;
  icon: string;
  badge?: { label: string; value: number };
};

export type SearchDenseMenuItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
};

export type SearchDenseSearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  icon?: string;
  initials?: string;
  email?: string;
  availability?: string;
  participantInitials?: readonly string[];
  overflowCount?: number;
  rowMoreActionLabel?: string;
};

export type SearchDenseSearchGroup = {
  kind: "route" | "work-context" | "person";
  label: string;
  items: readonly SearchDenseSearchResult[];
};

export type SearchDenseActionsModel = {
  appearance?: "standard" | "canvas-centered" | "identity-detail" | "branded-command" | "fullwidth-command" | "utility-identity" | "utility-identity-groups" | "product-actions" | "balanced-actions" | "search-persistent" | "inverted-search" | "brand-search" | "context-strip-controls" | "context-strip-actions";
  brand?: { label: string; shortLabel: string; href?: string; symbolSrc?: string };
  search: { label: string; placeholder: string; actionLabel?: string };
  searchGroups?: readonly SearchDenseSearchGroup[];
  utilities: readonly SearchDenseAction[];
  languageChoices: readonly SearchDenseMenuItem[];
  accountGroups: readonly { name: string; items: readonly SearchDenseMenuItem[] }[];
  profile: { name: string; email: string; role: string; avatarAlt: string };
  avatar?: { avifSrc: string; webpSrc: string; jpegSrc: string };
  identityPresentation?: "expanded" | "compact";
};

export type UtilityIdentityModel = Omit<SearchDenseActionsModel, "appearance" | "search"> & {
  groupedNavigation?: boolean;
  productActions?: boolean;
  balancedActions?: boolean;
  persistentSearch?: { label: string; placeholder: string; actionLabel: string };
  invertedSearch?: { label: string; placeholder: string; actionLabel: string };
  brandSearch?: { label: string; placeholder: string; actionLabel: string };
  contextStripControls?: boolean;
  contextStripActions?: boolean;
  serviceSearch?: { label: string; placeholder: string; actionLabel: string };
  primaryAction?: { id: string; label: string; actionId: string };
};

function usesThreeUtilities(model: SearchDenseActionsModel) {
  return model.appearance === "identity-detail" || model.appearance === "branded-command" || model.appearance === "fullwidth-command" || model.appearance === "utility-identity" || model.appearance === "utility-identity-groups" || model.appearance === "product-actions" || model.appearance === "balanced-actions" || model.appearance === "search-persistent" || model.appearance === "inverted-search" || model.appearance === "brand-search" || model.appearance === "context-strip-controls" || model.appearance === "context-strip-actions";
}

function actionShape(item: SearchDenseAction | SearchDenseMenuItem): AppBarAction {
  const href = "href" in item ? item.href : undefined;
  return { id: item.id, label: item.label, icon: item.icon, priority: 1, actionId: href ? undefined : item.id, href };
}

function Icon({ item, renderIcon }: { item: SearchDenseAction | SearchDenseMenuItem; renderIcon?: AppBarProperties["renderActionIcon"] }) {
  return <span className="xp-search-dense__icon" data-icon-key={item.icon} aria-hidden="true">{renderIcon?.(item.icon, actionShape(item)) ?? item.icon.slice(0, 1).toUpperCase()}</span>;
}

function PanelToggleIcon() {
  return <svg className="xp-search-dense__panel-icon" data-xp-panel-toggle-icon="" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" /><path d="M8.75 4.75v14.5M6.25 10l1.5 2-1.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BrandIdentity({ model, compactSummary = false }: { model: SearchDenseActionsModel; compactSummary?: boolean }) {
  if (!model.brand) return null;
  const className = `xp-search-dense__brand${compactSummary ? " xp-search-dense__brand--summary" : ""}`;
  const mark = <><span className={`xp-search-dense__brand-mark${model.brand.symbolSrc ? " xp-search-dense__brand-mark--asset" : ""}`} data-xp-product-mark="" aria-hidden="true">{model.brand.symbolSrc ? <img src={model.brand.symbolSrc} alt="" /> : Array.from(model.brand.shortLabel).map((character, index) => <span key={`${character}-${index}`}>{character}</span>)}</span><strong className="xp-search-dense__brand-wordmark" data-xp-product-wordmark="" aria-hidden="true">{model.brand.label}</strong></>;
  if (model.brand.href && !compactSummary) return <a className={className} href={model.brand.href} aria-label={`${model.brand.label} home`} data-xp-product-brand="" data-xp-product-home="">{mark}</a>;
  return <span className={className} role="img" aria-label={`${model.brand.label} product identity`} data-xp-product-brand={compactSummary ? undefined : ""} data-xp-compact-brand-summary={compactSummary ? "" : undefined}>{mark}</span>;
}

function Avatar({ model, large = false }: { model: SearchDenseActionsModel; large?: boolean }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`xp-search-dense__avatar${large ? " xp-search-dense__avatar--large" : ""}`}>{model.avatar ? <picture><source srcSet={model.avatar.avifSrc} type="image/avif" /><source srcSet={model.avatar.webpSrc} type="image/webp" /><img src={model.avatar.jpegSrc} alt={model.profile.avatarAlt} width={large ? 56 : 40} height={large ? 56 : 40} /></picture> : <span className="xp-search-dense__avatar-fallback" role="img" aria-label={model.profile.avatarAlt} data-xp-avatar-fallback="">{initials}</span>}</span>;
}

function SearchResultGroups({ model, renderIcon }: { model: SearchDenseActionsModel; renderIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!model.searchGroups?.length) return null;
  return <div className="xp-search-dense__result-groups" data-xp-search-results="">{model.searchGroups.map((group) => <section key={group.kind} data-search-group-kind={group.kind} data-search-group-count={group.items.length}><h3>{group.label}</h3><ul>{group.items.map((item) => <li key={item.id} data-search-result-id={item.id} data-result-kind={group.kind}>{group.kind === "person" ? <span className="xp-search-dense__result-avatar" aria-hidden="true">{item.initials}</span> : <Icon item={{ id: item.id, label: item.label, icon: item.icon ?? (group.kind === "route" ? "file-text" : "briefcase") }} renderIcon={renderIcon} />}<a href={item.href}><strong>{item.label}</strong><span>{item.email ?? item.detail}</span></a>{group.kind === "work-context" ? <span className="xp-search-dense__participants" aria-label={`${item.participantInitials?.length ?? 0} visible participants and ${item.overflowCount ?? 0} more`}>{item.participantInitials?.map((initials, index) => <span key={`${item.id}-${index}`} aria-hidden="true">{initials}</span>)}<b>+{item.overflowCount}</b></span> : null}{group.kind === "person" ? <><span className="xp-search-dense__availability">{item.availability}</span><button type="button" aria-label={item.rowMoreActionLabel}>•••</button></> : null}</li>)}</ul></section>)}</div>;
}

function SearchControl({ model, deviceClass, renderIcon, onAction }: { model: SearchDenseActionsModel; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const suppressInlineOpen = useRef(false);
  const submit = (event: FormEvent) => { event.preventDefault(); onAction?.(`search:${query.trim()}`); };
  const fullwidthCommand = model.appearance === "fullwidth-command";
  const invertedSearch = model.appearance === "inverted-search";
  if (deviceClass === "DW" && fullwidthCommand) {
    const closeInline = () => { suppressInlineOpen.current = true; setOpen(false); input.current?.focus(); };
    return <div className="xp-search-dense__inline-command" data-xp-search-inline-command="" onKeyDown={(event) => { if (event.key === "Escape") closeInline(); }}>
      <form className="xp-search-dense__inline-search" role="search" onSubmit={submit} data-xp-search-inline=""><label className="xp-visually-hidden" htmlFor={`dense-search-${deviceClass}`}>{model.search.label}</label><Icon item={{ id: "search-inline", label: model.search.label, icon: "search" }} renderIcon={renderIcon} /><input ref={input} id={`dense-search-${deviceClass}`} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { if (suppressInlineOpen.current) suppressInlineOpen.current = false; else setOpen(true); }} placeholder={model.search.placeholder} role="combobox" aria-expanded={open} aria-controls={`dense-search-results-${deviceClass}`} aria-autocomplete="list" /><button type="submit" aria-label={`Submit ${model.search.label.toLowerCase()}`} data-xp-search-submit=""><span aria-hidden="true">↵</span></button></form>
      {open ? <div className="xp-search-dense__inline-results" id={`dense-search-results-${deviceClass}`} role="region" aria-label="Search suggestions" data-xp-search-inline-results=""><SearchResultGroups model={model} renderIcon={renderIcon} /><button className="xp-search-dense__inline-results-close" type="button" onClick={closeInline}>Close suggestions</button></div> : null}
    </div>;
  }
  if (!invertedSearch && (deviceClass === "DW" || (deviceClass === "DS" && !fullwidthCommand))) {
    return <form className="xp-search-dense__inline-search" role="search" onSubmit={submit} data-xp-search-inline=""><label className="xp-visually-hidden" htmlFor={`dense-search-${deviceClass}`}>{model.search.label}</label><Icon item={{ id: "search-inline", label: model.search.label, icon: "search" }} renderIcon={renderIcon} /><input ref={input} id={`dense-search-${deviceClass}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={model.search.placeholder} /><button type="submit" aria-label={`Submit ${model.search.label.toLowerCase()}`} data-xp-search-submit=""><span aria-hidden="true">↵</span></button></form>;
  }
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "full-screen", TP: fullwidthCommand || invertedSearch ? "full-screen" : "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Compact dense headers need a search takeover; larger classes keep the source-aligned search surface.">
    <AdaptiveOverlay.Trigger className="xp-search-dense__search-trigger" aria-label={model.search.label} data-xp-search-trigger=""><Icon item={{ id: "search", label: model.search.label, icon: "search" }} renderIcon={renderIcon} /><span className="xp-search-dense__search-label">{model.search.placeholder}</span>{fullwidthCommand && deviceClass === "DS" ? <kbd className="xp-search-dense__shortcut" data-xp-search-shortcut="">⌘K</kbd> : null}</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-search-dense__overlay xp-search-dense__search-overlay" data-xp-search-overlay="" data-device-class={deviceClass} data-appearance={model.appearance ?? "standard"}>
      <AdaptiveOverlay.Header title={model.search.label} description="Search the active workspace." />
      <AdaptiveOverlay.Body className="xp-search-dense__overlay-body xp-search-dense__search-body" data-xp-search-body=""><form role="search" onSubmit={submit}><label htmlFor={`dense-search-${deviceClass}`}>{model.search.label}</label><div className="xp-search-dense__search-field"><Icon item={{ id: "search-field", label: model.search.label, icon: "search" }} renderIcon={renderIcon} /><input ref={input} autoFocus id={`dense-search-${deviceClass}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={model.search.placeholder} /><button type="submit" data-xp-search-submit="">Search</button></div></form><SearchResultGroups model={model} renderIcon={renderIcon} /></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer className="xp-search-dense__overlay-footer" data-xp-search-footer=""><AdaptiveOverlay.Close className="xp-search-dense__overlay-close">Close search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function LanguageRows({ model, renderIcon, onAction, close }: { model: SearchDenseActionsModel; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; close?: () => void }) {
  const [selected, setSelected] = useState(model.languageChoices[0]?.id ?? "");
  return <div className="xp-search-dense__menu" role="menu" aria-label="Interface languages" data-xp-language-choices="">{model.languageChoices.map((item) => <button key={item.id} type="button" role="menuitemradio" aria-checked={selected === item.id} data-language-choice-id={item.id} onClick={() => { setSelected(item.id); onAction?.(item.id); close?.(); }}><Icon item={item} renderIcon={renderIcon} /><span>{item.label}</span><span aria-hidden="true">{selected === item.id ? "●" : "○"}</span></button>)}</div>;
}

function LanguageMenu({ model, item, deviceClass, renderIcon, onAction }: { model: SearchDenseActionsModel; item: SearchDenseAction; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [open, setOpen] = useState(false);
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="pick" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Locale selection is bounded on compact screens and anchored beside the source utility on larger screens."><AdaptiveOverlay.Trigger className="xp-search-dense__utility" aria-label={item.label} data-utility-id={item.id} data-xp-language-trigger=""><Icon item={item} renderIcon={renderIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-dense__overlay xp-search-dense__language-overlay" data-xp-language-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title="Interface language" description="Choose one of five available languages." /><AdaptiveOverlay.Body className="xp-search-dense__overlay-body"><LanguageRows model={model} renderIcon={renderIcon} onAction={onAction} close={() => setOpen(false)} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-dense__overlay-footer"><AdaptiveOverlay.Close className="xp-search-dense__overlay-close">Close languages</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function NoticeMenu({ model, item, deviceClass, renderIcon }: { model: SearchDenseActionsModel; item: SearchDenseAction; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"] }) {
  const [open, setOpen] = useState(false);
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Unread status remains reachable without inventing application-owned notification records."><AdaptiveOverlay.Trigger className="xp-search-dense__utility" aria-label={item.label} data-utility-id={item.id} data-xp-notice-trigger=""><Icon item={item} renderIcon={renderIcon} /><span className="xp-search-dense__badge" aria-label={item.badge?.label}>{item.badge?.value}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-dense__overlay xp-search-dense__notice-overlay" data-xp-notice-overlay="" data-device-class={deviceClass} data-appearance={model.appearance ?? "standard"}><AdaptiveOverlay.Header title={item.label} description={item.badge?.label ?? "Unread notifications"} /><AdaptiveOverlay.Body className="xp-search-dense__overlay-body"><p className="xp-search-dense__empty">Open the notification center to review all items. No application-owned rows are represented in this shell fixture.</p></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-dense__overlay-footer"><AdaptiveOverlay.Close className="xp-search-dense__overlay-close">Close notices</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function AccountMenu({ model, deviceClass, compact, relocateUtilities = compact, renderIcon, onAction }: { model: SearchDenseActionsModel; deviceClass: DeviceClass; compact: boolean; relocateUtilities?: boolean; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [open, setOpen] = useState(false);
  const threeUtility = usesThreeUtilities(model);
  const share = threeUtility ? null : model.utilities[0]!;
  const language = model.utilities[threeUtility ? 0 : 1]!;
  const activity = model.utilities[threeUtility ? 1 : 2]!;
  const expandedIdentity = !compact && (deviceClass === "DS" || deviceClass === "DW") && threeUtility && model.identityPresentation !== "compact";
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Compact classes consolidate secondary dense actions with the account while larger classes preserve a dedicated account popover."><AdaptiveOverlay.Trigger className="xp-search-dense__account" aria-label={`Open account menu for ${model.profile.name}, ${model.profile.role}`} data-xp-account-trigger=""><Avatar model={model} />{expandedIdentity ? <span className="xp-search-dense__identity-detail" data-xp-inline-identity=""><strong data-xp-inline-identity-name="">{model.profile.name}</strong><span data-xp-inline-identity-role="">{model.profile.role}</span></span> : null}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-dense__overlay xp-search-dense__account-overlay" data-xp-account-overlay="" data-device-class={deviceClass} data-appearance={model.appearance ?? "standard"}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body className="xp-search-dense__overlay-body" data-xp-account-body="">{compact && model.appearance === "branded-command" ? <BrandIdentity model={model} compactSummary /> : null}<section className="xp-search-dense__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><Avatar model={model} large /><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><span data-profile-email-text="">{model.profile.email}</span></div></section>{relocateUtilities ? <section className="xp-search-dense__compact-utilities" aria-label="Header utilities"><h3>Workspace tools</h3>{share ? <button type="button" data-utility-id={share.id} onClick={() => onAction?.(share.id)}><Icon item={share} renderIcon={renderIcon} /><span>{share.label}</span></button> : null}<div className="xp-search-dense__language-group" data-utility-id={language.id}><h3><Icon item={language} renderIcon={renderIcon} />{language.label}</h3><LanguageRows model={model} renderIcon={renderIcon} onAction={onAction} /></div><button type="button" data-utility-id={activity.id} onClick={() => onAction?.(activity.id)}><Icon item={activity} renderIcon={renderIcon} /><span>{activity.label}</span></button></section> : null}<nav aria-label="Account commands">{model.accountGroups.map((group) => <section className="xp-search-dense__account-group" key={group.name} data-account-group={group.name}><h3>{group.name}</h3><ul>{group.items.map((item) => <li key={item.id}>{item.href ? <a href={item.href} data-account-command-id={item.id}><Icon item={item} renderIcon={renderIcon} /><span>{item.label}</span></a> : <button type="button" data-account-command-id={item.id} onClick={() => onAction?.(item.id)}><Icon item={item} renderIcon={renderIcon} /><span>{item.label}</span></button>}</li>)}</ul></section>)}</nav></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-dense__overlay-footer"><AdaptiveOverlay.Close className="xp-search-dense__overlay-close">Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function DirectUtility({ item, renderIcon, onAction }: { item: SearchDenseAction; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  return <button className="xp-search-dense__utility" type="button" aria-label={item.label} data-utility-id={item.id} onClick={() => onAction?.(item.id)}><Icon item={item} renderIcon={renderIcon} /></button>;
}

function MoreMenu({ model, deviceClass, labelled = false, renderIcon, onAction }: { model: SearchDenseActionsModel; deviceClass: DeviceClass; labelled?: boolean; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [open, setOpen] = useState(false);
  const threeUtility = usesThreeUtilities(model);
  const language = model.utilities[threeUtility ? 0 : 1]!;
  const activity = model.utilities[threeUtility ? 1 : 2]!;
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Tablet landscape retains utility rank while moving two lower-priority jobs to one labelled overflow."><AdaptiveOverlay.Trigger className="xp-search-dense__utility xp-search-dense__more" aria-label="More header tools" data-xp-more-trigger=""><span aria-hidden="true">•••</span>{labelled ? <span>Tools</span> : null}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-search-dense__overlay xp-search-dense__more-overlay" data-xp-more-overlay="" data-device-class={deviceClass} data-appearance={model.appearance ?? "standard"}><AdaptiveOverlay.Header title="Header tools" description="Language and recent activity." /><AdaptiveOverlay.Body className="xp-search-dense__overlay-body"><section className="xp-search-dense__compact-utilities"><div className="xp-search-dense__language-group" data-utility-id={language.id}><h3><Icon item={language} renderIcon={renderIcon} />{language.label}</h3><LanguageRows model={model} renderIcon={renderIcon} onAction={onAction} close={() => setOpen(false)} /></div><button type="button" data-utility-id={activity.id} onClick={() => { onAction?.(activity.id); setOpen(false); }}><Icon item={activity} renderIcon={renderIcon} /><span>{activity.label}</span></button></section></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-search-dense__overlay-footer"><AdaptiveOverlay.Close className="xp-search-dense__overlay-close">Close tools</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

const forms: Record<DeviceClass, string> = { M: "compact-command", TP: "portrait-command", TL: "touch-priority", DS: "desktop-source", DW: "wide-source" };

export function SearchDenseActionsAppBar({ model, deviceClass, children, renderActionIcon, onAction, onBack, sourceSlug, sourcePreset }: { model: SearchDenseActionsModel; deviceClass: DeviceClass; children: ReactNode; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; onBack?: () => void; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const touchLandscape = deviceClass === "TL";
  const identityDetail = model.appearance === "identity-detail";
  const brandedCommand = model.appearance === "branded-command";
  const fullwidthCommand = model.appearance === "fullwidth-command";
  const threeUtility = identityDetail || brandedCommand || fullwidthCommand;
  const canvasCentered = model.appearance === "canvas-centered";
  const language = model.utilities[threeUtility ? 0 : 1]!;
  const activity = model.utilities[threeUtility ? 1 : 2]!;
  const notice = model.utilities[threeUtility ? 2 : 3]!;
  const form = fullwidthCommand ? ({ M: "compact-fullwidth-command", TP: "portrait-fullwidth-command", TL: "touch-fullwidth-command", DS: "desktop-fullwidth-command", DW: "wide-fullwidth-command" } as const)[deviceClass] : forms[deviceClass];
  return <div className={`xp-search-dense${canvasCentered ? " xp-search-dense--canvas-centered" : ""}${identityDetail ? " xp-search-dense--identity-detail" : ""}${brandedCommand ? " xp-search-dense--branded-command" : ""}${fullwidthCommand ? " xp-search-dense--fullwidth-command" : ""}`} data-xp-shell="" data-shell-anatomy={canvasCentered ? "appbar.canvas-centered-search" : identityDetail ? "appbar.search-identity-detail" : brandedCommand ? "appbar.branded-command" : fullwidthCommand ? "appbar.fullwidth-command" : "appbar.search-dense-actions"} data-shell-family="app" data-device-class={deviceClass} data-variant={form} data-source-slug={sourceSlug} data-source-preset={sourcePreset} data-xp-search-dense-renderer="" data-xp-nav-renderer=""><header className="xp-search-dense__bar" data-xp-region="top" data-xp-search-dense-bar="">{fullwidthCommand ? <BrandIdentity model={model} /> : <><button className="xp-search-dense__shell-control" type="button" aria-label="Open workspace navigation" onClick={onBack} data-xp-shell-navigation=""><PanelToggleIcon /></button><span className="xp-search-dense__divider" aria-hidden="true" />{brandedCommand ? <BrandIdentity model={model} /> : null}</>}<div className="xp-search-dense__search"><SearchControl model={model} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /></div><div className="xp-search-dense__actions" aria-label="Header controls">{!threeUtility && !compact ? <DirectUtility item={model.utilities[0]!} renderIcon={renderActionIcon} onAction={onAction} /> : null}{!compact && (!touchLandscape || fullwidthCommand) ? <LanguageMenu model={model} item={language} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /> : null}{!compact && (!touchLandscape || fullwidthCommand) ? <DirectUtility item={activity} renderIcon={renderActionIcon} onAction={onAction} /> : null}{touchLandscape && !fullwidthCommand ? <MoreMenu model={model} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /> : null}<NoticeMenu model={model} item={notice} deviceClass={deviceClass} renderIcon={renderActionIcon} /><AccountMenu model={model} deviceClass={deviceClass} compact={compact} renderIcon={renderActionIcon} onAction={onAction} /></div></header><main className="xp-search-dense__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-search-dense__surface">{children}</section></main></div>;
}

function DestinationRank({ nav, renderIcon, placement }: { nav: NavModel; renderIcon?: NavIconRenderer; placement: "inline" | "rail" | "bottom" }) {
  return <nav className={`xp-utility-identity__destinations xp-utility-identity__destinations--${placement}`} aria-label="Workspace destinations" data-xp-destination-rank={placement}>{nav.destinations.map((destination) => destination.href ? <a key={destination.id} href={destination.href} data-destination-id={destination.id}><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><span>{destination.label}</span></a> : null)}</nav>;
}

function GroupLinks({ destination, descriptions = false, renderIcon }: { destination: NavModel["destinations"][number]; descriptions?: boolean; renderIcon?: NavIconRenderer }) {
  return <ul className={`xp-utility-identity__group-links${descriptions ? " xp-utility-identity__group-links--described" : ""}`} data-parent-id={destination.id}>{destination.children?.map((child) => <li key={child.id}><a href={child.href} data-child-id={child.id} data-parent-id={destination.id}>{child.icon ? <span className="xp-utility-identity__child-icon" data-child-icon-id={child.id} data-icon-key={child.icon} aria-hidden="true">{renderIcon?.(child.icon, destination) ?? child.label.slice(0, 1)}</span> : null}<strong>{child.label}</strong>{descriptions && child.description ? <span data-child-description-id={child.id}>{child.description}</span> : null}</a></li>)}</ul>;
}

function GroupDisclosure({ destination, deviceClass, renderIcon, placement, appearance }: { destination: NavModel["destinations"][number]; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; placement: "bottom" | "strip" | "rail" | "inline"; appearance?: "product-actions" | "balanced-actions" | "search-persistent" | "inverted-search" | "brand-search" | "context-strip-controls" | "context-strip-actions" }) {
  const [open, setOpen] = useState(false);
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Disclosure-only parents remain labelled controls while their leaf routes live in one anchored, bounded child surface.">
    <AdaptiveOverlay.Trigger className="xp-utility-identity__group-trigger" data-parent-trigger-id={destination.id} data-group-placement={placement}><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><span>{destination.label}</span><span aria-hidden="true">⌄</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-utility-identity__group-overlay" data-xp-group-overlay="" data-parent-overlay-id={destination.id} data-device-class={deviceClass} data-appearance={appearance}>
      <AdaptiveOverlay.Header title={destination.label} description={`${destination.children?.length ?? 0} related destinations`} />
      <AdaptiveOverlay.Body className="xp-utility-identity__group-body"><GroupLinks destination={destination} descriptions={appearance === "balanced-actions"} renderIcon={renderIcon} /></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer className="xp-utility-identity__group-footer"><AdaptiveOverlay.Close className="xp-utility-identity__group-close">Close {destination.label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function GroupedDestinationRank({ nav, deviceClass, renderIcon, placement, appearance }: { nav: NavModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; placement: "bottom" | "strip" | "rail" | "inline"; appearance?: "product-actions" | "balanced-actions" | "search-persistent" | "inverted-search" | "brand-search" | "context-strip-controls" | "context-strip-actions" }) {
  const compactMore = appearance === "search-persistent" && placement === "bottom";
  return <nav className={`xp-utility-identity__groups xp-utility-identity__groups--${placement}`} aria-label="Workspace destination groups" data-xp-group-rank={placement}>{nav.destinations.map((destination) => destination.children?.length ? <GroupDisclosure key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} placement={placement} appearance={appearance} /> : destination.href ? <a key={destination.id} className="xp-utility-identity__group-trigger xp-utility-identity__root-link" href={destination.href} aria-label={compactMore ? `More: ${destination.label}` : undefined} data-destination-id={destination.id} data-group-placement={placement} data-xp-more-root={compactMore ? "" : undefined}><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><span>{compactMore ? "More" : destination.label}</span></a> : null)}</nav>;
}

function InvertedCompactRank({ nav, deviceClass, renderIcon }: { nav: NavModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer }) {
  const [open, setOpen] = useState(false);
  const visible = nav.destinations.slice(0, 4);
  const final = nav.destinations[4]!;
  return <nav className="xp-utility-identity__groups xp-utility-identity__groups--bottom xp-utility-identity__groups--inverted-compact" aria-label="Workspace destination groups" data-xp-group-rank="bottom">
    {visible.map((destination) => destination.children?.length ? <GroupDisclosure key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="inverted-search" /> : destination.href ? <a key={destination.id} className="xp-utility-identity__group-trigger xp-utility-identity__root-link" href={destination.href} data-destination-id={destination.id} data-group-placement="bottom"><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><span>{destination.label}</span></a> : null)}
    <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet" }} why="The phone rank preserves four source roots and gives the fifth direct route one labelled two-tap More seat.">
      <AdaptiveOverlay.Trigger className="xp-utility-identity__group-trigger xp-utility-identity__more-root" aria-label={`More: ${final.label}`} data-xp-more-root-trigger=""><span className="xp-utility-identity__destination-icon" data-icon-key={final.icon} aria-hidden="true">{renderIcon?.(final.icon, final) ?? final.label.slice(0, 1)}</span><span>More</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-utility-identity__group-overlay xp-utility-identity__more-root-overlay" data-xp-more-root-overlay="" data-device-class={deviceClass} data-appearance="inverted-search"><AdaptiveOverlay.Header title="More destinations" description="One additional staffing route" /><AdaptiveOverlay.Body className="xp-utility-identity__group-body"><a className="xp-utility-identity__more-root-link" href={final.href} data-destination-id={final.id}><span className="xp-utility-identity__destination-icon" data-icon-key={final.icon} aria-hidden="true">{renderIcon?.(final.icon, final) ?? final.label.slice(0, 1)}</span><strong>{final.label}</strong></a></AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-utility-identity__group-footer"><AdaptiveOverlay.Close className="xp-utility-identity__group-close">Close more destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </nav>;
}

function BrandSearchCompactRank({ nav, deviceClass, renderIcon, appearance = "brand-search" }: { nav: NavModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; appearance?: "brand-search" | "context-strip-actions" }) {
  const [open, setOpen] = useState(false);
  const visible = nav.destinations.slice(0, 4);
  const remaining = nav.destinations.slice(4);
  return <nav className="xp-utility-identity__groups xp-utility-identity__groups--bottom xp-utility-identity__groups--brand-compact" aria-label="Workspace destination groups" data-xp-group-rank="bottom">
    {visible.map((destination) => destination.children?.length ? <GroupDisclosure key={destination.id} destination={destination} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="brand-search" /> : destination.href ? <a key={destination.id} className="xp-utility-identity__group-trigger xp-utility-identity__root-link" href={destination.href} data-destination-id={destination.id} data-group-placement="bottom"><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><span>{destination.label}</span></a> : null)}
    <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "action-sheet" }} why="The phone rank keeps four source roots first paint while the final two direct routes remain one labelled tap away.">
      <AdaptiveOverlay.Trigger className="xp-utility-identity__group-trigger xp-utility-identity__more-root" aria-label={`More: ${remaining.map(({ label }) => label).join(" and ")}`} data-xp-more-root-trigger=""><span aria-hidden="true">•••</span><span>More</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-utility-identity__group-overlay xp-utility-identity__more-root-overlay" data-xp-more-root-overlay="" data-device-class={deviceClass} data-appearance={appearance}><AdaptiveOverlay.Header title="More destinations" description="Two additional service routes" /><AdaptiveOverlay.Body className="xp-utility-identity__group-body">{remaining.map((destination) => <a key={destination.id} className="xp-utility-identity__more-root-link" href={destination.href} data-destination-id={destination.id}><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span><strong>{destination.label}</strong></a>)}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer className="xp-utility-identity__group-footer"><AdaptiveOverlay.Close className="xp-utility-identity__group-close">Close more destinations</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </nav>;
}

function PrimaryTierAction({ action, onAction }: { action: NonNullable<UtilityIdentityModel["primaryAction"]>; onAction?: AppBarProperties["onAction"] }) {
  return <button className="xp-utility-identity__primary-action" type="button" data-xp-primary-action="" data-action-id={action.actionId} onClick={() => onAction?.(action.actionId)}>{action.label}</button>;
}

function PageContextControls({ context, actions, deviceClass, onAction, linked = false, renderIcon }: { context: AppBarContext; actions: NonNullable<NavModel["actions"]>; deviceClass: DeviceClass; onAction?: AppBarProperties["onAction"]; linked?: boolean; renderIcon?: AppBarProperties["renderActionIcon"] }) {
  const [selectedActionId, setSelectedActionId] = useState<string>();
  const compact = deviceClass === "M" || deviceClass === "TP";
  const breadcrumb = context.breadcrumb ?? [];
  const current = breadcrumb.at(-1);
  const breadcrumbItems = breadcrumb.map((item, index) => <li key={item.id}>{item.href ? <a href={item.href}>{index === 0 && !compact ? <><span aria-hidden="true">⌂</span><span className="xp-visually-hidden">{item.label}</span></> : item.label}</a> : <span aria-current="page">{item.label}</span>}</li>);
  return <section className="xp-utility-identity__context-tier" aria-label={linked ? "Page context and actions" : "Page context and reporting period"} data-xp-context-strip-controls="" data-device-class={deviceClass}>
    <div className="xp-utility-identity__page-context" data-xp-page-context="">
      {compact ? <><strong data-xp-context-current="">{current?.label ?? context.title}</strong><ol className="xp-visually-hidden" aria-label="Breadcrumb" data-xp-breadcrumb="">{breadcrumbItems}</ol></> : <nav aria-label="Breadcrumb"><ol data-xp-breadcrumb="">{breadcrumbItems}</ol></nav>}
    </div>
    <div className="xp-utility-identity__temporal-controls" role={linked ? undefined : "radiogroup"} aria-label={linked ? "Page actions" : "Reporting period"} data-xp-temporal-controls="" data-xp-context-actions={linked ? "" : undefined}>
      {actions.map((action) => linked && action.href ? <a key={action.id} href={action.href} className={`xp-utility-identity__context-action xp-utility-identity__context-action--${action.kind}`} data-page-action-id={action.id} data-action-id={action.id}><span>{action.label}</span>{renderIcon?.(action.kind === "primary" ? "calendar-plus" : "package-search", { ...action, icon: action.kind === "primary" ? "calendar-plus" : "package-search", priority: 1 })}</a> : <button key={action.id} type="button" role="radio" aria-checked={selectedActionId === action.id} data-page-action-id={action.actionId ?? action.id} data-action-id={action.actionId ?? action.id} onClick={() => { setSelectedActionId(action.id); onAction?.(action.actionId ?? action.id); }}>{action.label}</button>)}
    </div>
  </section>;
}

function PersistentSearch({ model, deviceClass, renderIcon, onAction }: { model: SearchDenseActionsModel; deviceClass: DeviceClass; renderIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"] }) {
  const [query, setQuery] = useState("");
  const search = model.search;
  const actionLabel = search.actionLabel ?? `Submit ${search.label.toLowerCase()}`;
  const submit = (event: FormEvent) => { event.preventDefault(); onAction?.(`search:${query.trim()}`); };
  return <form className="xp-utility-identity__persistent-search" role="search" onSubmit={submit} data-xp-persistent-search=""><label className="xp-visually-hidden" htmlFor={`persistent-search-${deviceClass}`}>{search.label}</label><span className="xp-utility-identity__persistent-search-icon" aria-hidden="true"><Icon item={{ id: "persistent-search", label: search.label, icon: "search" }} renderIcon={renderIcon} /></span><input id={`persistent-search-${deviceClass}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={search.placeholder} data-xp-persistent-search-input="" /><button type="submit" aria-label={actionLabel} data-xp-persistent-search-submit=""><Icon item={{ id: "persistent-search-submit", label: actionLabel, icon: "search" }} renderIcon={renderIcon} /></button></form>;
}

function GroupedNavigationSheet({ nav, deviceClass, renderIcon, onBack }: { nav: NavModel; deviceClass: DeviceClass; renderIcon?: NavIconRenderer; onBack?: () => void }) {
  const [open, setOpen] = useState(false);
  return <AdaptiveOverlay open={open} onOpenChange={setOpen} intent="inspect" presentation={{ M: "full-screen", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="Compact classes restore all three amputated source groups in one expanded sheet so every leaf stays within two taps.">
    <AdaptiveOverlay.Trigger className="xp-search-dense__shell-control" aria-label="Open workspace navigation" data-xp-shell-navigation="" onClick={onBack}><PanelToggleIcon /></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-utility-identity__navigation-overlay" data-xp-group-navigation-overlay="" data-device-class={deviceClass}>
      <AdaptiveOverlay.Header title="Workspace navigation" description="Choose a destination from all three lab groups." />
      <AdaptiveOverlay.Body className="xp-utility-identity__navigation-body" data-xp-group-navigation-body=""><nav aria-label="All workspace destinations">{nav.destinations.map((destination) => <section className="xp-utility-identity__sheet-group" key={destination.id} data-sheet-parent-id={destination.id}><h3><span className="xp-utility-identity__destination-icon" data-icon-key={destination.icon} aria-hidden="true">{renderIcon?.(destination.icon, destination) ?? destination.label.slice(0, 1)}</span>{destination.label}</h3><GroupLinks destination={destination} /></section>)}</nav></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer className="xp-utility-identity__group-footer" data-xp-group-navigation-footer=""><AdaptiveOverlay.Close className="xp-utility-identity__group-close">Close navigation</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

const utilityIdentityForms: Record<DeviceClass, string> = { M: "compact-tabs", TP: "portrait-tabs", TL: "touch-rail", DS: "desktop-inline", DW: "wide-inline" };

export function UtilityIdentityAppBar({ nav, model, context, deviceClass, children, renderIcon, renderActionIcon, onAction, onBack, sourceSlug, sourcePreset }: { nav: NavModel; model: UtilityIdentityModel; context: AppBarContext; deviceClass: DeviceClass; children: ReactNode; renderIcon?: NavIconRenderer; renderActionIcon?: AppBarProperties["renderActionIcon"]; onAction?: AppBarProperties["onAction"]; onBack?: () => void; sourceSlug?: string; sourcePreset?: string }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const expandedInline = deviceClass === "DS" || deviceClass === "DW";
  const grouped = model.groupedNavigation === true;
  const productActions = model.productActions === true;
  const balancedActions = model.balancedActions === true;
  const persistentSearch = model.persistentSearch;
  const searchPersistent = Boolean(persistentSearch);
  const invertedCommandSearch = model.invertedSearch;
  const invertedSearch = Boolean(invertedCommandSearch);
  const brandPersistentSearch = model.brandSearch;
  const brandSearch = Boolean(brandPersistentSearch);
  const contextStripControls = model.contextStripControls === true;
  const contextStripActions = model.contextStripActions === true;
  const actionAppearance = contextStripActions ? "context-strip-actions" : contextStripControls ? "context-strip-controls" : brandSearch ? "brand-search" : invertedSearch ? "inverted-search" : searchPersistent ? "search-persistent" : balancedActions ? "balanced-actions" : productActions ? "product-actions" : undefined;
  const sharedModel: SearchDenseActionsModel = { ...model, appearance: contextStripActions ? "context-strip-actions" : contextStripControls ? "context-strip-controls" : brandSearch ? "brand-search" : invertedSearch ? "inverted-search" : searchPersistent ? "search-persistent" : balancedActions ? "balanced-actions" : productActions ? "product-actions" : grouped ? "utility-identity-groups" : "utility-identity", search: model.serviceSearch ?? (brandPersistentSearch ? { label: brandPersistentSearch.label, placeholder: brandPersistentSearch.placeholder, actionLabel: brandPersistentSearch.actionLabel } : invertedCommandSearch ? { label: invertedCommandSearch.label, placeholder: invertedCommandSearch.placeholder, actionLabel: invertedCommandSearch.actionLabel } : persistentSearch ? { label: persistentSearch.label, placeholder: persistentSearch.placeholder, actionLabel: persistentSearch.actionLabel } : { label: "", placeholder: "" }) };
  const language = model.utilities[0]!;
  const activity = model.utilities[1]!;
  const notice = model.utilities[2]!;
  const form = contextStripActions ? ({ M: "compact-context-actions", TP: "portrait-context-actions", TL: "touch-context-actions", DS: "desktop-context-actions", DW: "wide-context-actions" } as const)[deviceClass] : contextStripControls ? ({ M: "compact-context-controls", TP: "portrait-context-controls", TL: "touch-context-controls", DS: "desktop-context-controls", DW: "wide-context-controls" } as const)[deviceClass] : brandSearch ? ({ M: "compact-brand-search", TP: "portrait-brand-search", TL: "touch-brand-search", DS: "desktop-brand-search", DW: "wide-brand-search" } as const)[deviceClass] : invertedSearch ? ({ M: "compact-inverted-action", TP: "portrait-inverted-action", TL: "touch-inverted-action", DS: "desktop-inverted-action", DW: "wide-inverted-action" } as const)[deviceClass] : searchPersistent ? ({ M: "compact-search-persistent", TP: "portrait-search-persistent", TL: "touch-search-persistent", DS: "desktop-search-persistent", DW: "wide-search-persistent" } as const)[deviceClass] : balancedActions ? ({ M: "compact-balanced-tabs", TP: "portrait-balanced-strip", TL: "touch-balanced-actions", DS: "desktop-balanced-actions", DW: "wide-balanced-actions" } as const)[deviceClass] : productActions ? ({ M: "compact-product-tabs", TP: "portrait-product-tabs", TL: "touch-product-rail", DS: "desktop-product-actions", DW: "wide-product-actions" } as const)[deviceClass] : grouped ? ({ M: "compact-group-sheet", TP: "portrait-group-sheet", TL: "touch-group-rail", DS: "desktop-group-dropdowns", DW: "wide-group-dropdowns" } as const)[deviceClass] : utilityIdentityForms[deviceClass];
  const inlineRank = brandSearch || invertedSearch || searchPersistent || contextStripActions ? false : contextStripControls ? expandedInline : balancedActions ? deviceClass === "TL" || deviceClass === "DS" || deviceClass === "DW" : expandedInline;
  return <div className={`xp-search-dense xp-utility-identity${grouped || productActions || balancedActions || searchPersistent || invertedSearch || brandSearch || contextStripControls || contextStripActions ? " xp-utility-identity--groups" : ""}${productActions ? " xp-utility-identity--product-actions" : ""}${balancedActions ? " xp-utility-identity--balanced-actions" : ""}${searchPersistent ? " xp-utility-identity--search-persistent" : ""}${invertedSearch ? " xp-utility-identity--inverted-search" : ""}${brandSearch ? " xp-utility-identity--brand-search" : ""}${contextStripControls ? " xp-utility-identity--context-strip-controls" : ""}${contextStripActions ? " xp-utility-identity--context-strip-actions" : ""}`} data-xp-shell="" data-shell-anatomy={contextStripActions ? "appbar.context-strip-actions" : contextStripControls ? "appbar.context-strip-controls" : brandSearch ? "appbar.brand-search" : invertedSearch ? "appbar.inverted-search" : searchPersistent ? "appbar.search-persistent" : balancedActions ? "appbar.balanced-actions" : productActions ? "appbar.product-actions" : "appbar.utility-identity"} data-shell-family="app" data-device-class={deviceClass} data-variant={form} data-source-slug={sourceSlug} data-source-preset={sourcePreset} data-xp-utility-identity-renderer="" data-xp-product-actions-renderer={productActions ? "" : undefined} data-xp-balanced-actions-renderer={balancedActions ? "" : undefined} data-xp-search-persistent-renderer={searchPersistent ? "" : undefined} data-xp-inverted-search-renderer={invertedSearch ? "" : undefined} data-xp-brand-search-renderer={brandSearch ? "" : undefined} data-xp-context-strip-controls-renderer={contextStripControls ? "" : undefined} data-xp-context-strip-actions-renderer={contextStripActions ? "" : undefined} data-xp-nav-renderer="">
    <header className="xp-search-dense__bar xp-utility-identity__bar" data-xp-region="top" data-xp-utility-identity-bar="">
      {productActions || balancedActions || searchPersistent || invertedSearch || brandSearch || contextStripControls || contextStripActions ? <BrandIdentity model={sharedModel} /> : compact && grouped ? <GroupedNavigationSheet nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} onBack={onBack} /> : <button className="xp-search-dense__shell-control" type="button" aria-label="Open workspace navigation" onClick={onBack} data-xp-shell-navigation=""><PanelToggleIcon /></button>}
      {!productActions && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch && !contextStripControls && !contextStripActions ? <span className="xp-search-dense__divider" aria-hidden="true" /> : null}
      {compact && !productActions && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch && !contextStripControls && !contextStripActions ? <strong className="xp-utility-identity__route-context" data-xp-route-context="">{nav.destinations[0]?.label}</strong> : null}
      {inlineRank ? grouped || productActions || balancedActions || contextStripControls ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="inline" appearance={actionAppearance} /> : <DestinationRank nav={nav} renderIcon={renderIcon} placement="inline" /> : null}
      {invertedSearch ? <div className="xp-utility-identity__command-search" data-xp-inverted-command-search=""><SearchControl model={sharedModel} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /></div> : null}
      {contextStripActions ? <div className="xp-utility-identity__command-search" data-xp-service-search=""><SearchControl model={sharedModel} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /></div> : null}
      <div className="xp-search-dense__actions" aria-label="Header controls">
        {!compact && !(balancedActions && deviceClass === "TL") ? <LanguageMenu model={sharedModel} item={language} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /> : null}
        {!compact && !(balancedActions && deviceClass === "TL") ? <DirectUtility item={activity} renderIcon={renderActionIcon} onAction={onAction} /> : null}
        {balancedActions && deviceClass === "TL" ? <MoreMenu model={sharedModel} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /> : null}
        {(brandSearch || contextStripControls) && compact ? <MoreMenu model={sharedModel} deviceClass={deviceClass} labelled renderIcon={renderActionIcon} onAction={onAction} /> : null}
        <NoticeMenu model={sharedModel} item={notice} deviceClass={deviceClass} renderIcon={renderActionIcon} />
        <AccountMenu model={sharedModel} deviceClass={deviceClass} compact={compact} relocateUtilities={compact && !brandSearch && !contextStripControls} renderIcon={renderActionIcon} onAction={onAction} />
      </div>
    </header>
    {contextStripControls ? <PageContextControls context={context} actions={nav.actions ?? []} deviceClass={deviceClass} onAction={onAction} /> : null}
    {contextStripActions ? <><div className="xp-utility-identity__service-rank" data-xp-service-route-rank="">{deviceClass !== "M" && deviceClass !== "TP" && deviceClass !== "TL" ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="inline" appearance="context-strip-actions" /> : null}</div><PageContextControls context={context} actions={nav.actions ?? []} deviceClass={deviceClass} onAction={onAction} linked renderIcon={renderActionIcon} /></> : null}
    {invertedSearch ? <div className="xp-utility-identity__action-tier" data-xp-action-tier="">{deviceClass !== "M" && deviceClass !== "TP" ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="inline" appearance="inverted-search" /> : null}<PrimaryTierAction action={model.primaryAction!} onAction={onAction} /></div> : null}
    {brandSearch ? <div className="xp-utility-identity__brand-search-tier" data-xp-brand-search-tier="">{deviceClass !== "M" && deviceClass !== "TP" ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="inline" appearance="brand-search" /> : null}<PersistentSearch model={sharedModel} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /></div> : null}
    {searchPersistent ? <div className="xp-utility-identity__persistent-tier" data-xp-persistent-tier="">{deviceClass !== "M" && deviceClass !== "TP" ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="inline" appearance="search-persistent" /> : null}<PersistentSearch model={sharedModel} deviceClass={deviceClass} renderIcon={renderActionIcon} onAction={onAction} /></div> : null}
    {deviceClass === "TL" && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch ? grouped || productActions || contextStripControls || contextStripActions ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="rail" appearance={actionAppearance} /> : <DestinationRank nav={nav} renderIcon={renderIcon} placement="rail" /> : null}
    {deviceClass === "TP" && contextStripActions ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="context-strip-actions" /> : null}
    {deviceClass === "TP" && contextStripControls ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="context-strip-controls" /> : null}
    {deviceClass === "TP" && invertedSearch ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="inverted-search" /> : null}
    {deviceClass === "TP" && brandSearch ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="brand-search" /> : null}
    {deviceClass === "TP" && searchPersistent ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="search-persistent" /> : null}
    {deviceClass === "TP" && balancedActions ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="strip" appearance="balanced-actions" /> : null}
    <main className="xp-search-dense__main xp-utility-identity__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-search-dense__surface">{children}</section></main>
    {deviceClass === "M" && contextStripActions ? <BrandSearchCompactRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} appearance="context-strip-actions" /> : deviceClass === "M" && contextStripControls ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="context-strip-controls" /> : deviceClass === "M" && brandSearch ? <BrandSearchCompactRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} /> : deviceClass === "M" && invertedSearch ? <InvertedCompactRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} /> : deviceClass === "M" && searchPersistent ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="search-persistent" /> : deviceClass === "M" && balancedActions ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="balanced-actions" /> : compact && productActions ? <GroupedDestinationRank nav={nav} deviceClass={deviceClass} renderIcon={renderIcon} placement="bottom" appearance="product-actions" /> : compact && !grouped && !balancedActions && !searchPersistent && !invertedSearch && !brandSearch && !contextStripControls && !contextStripActions ? <DestinationRank nav={nav} renderIcon={renderIcon} placement="bottom" /> : null}
  </div>;
}
