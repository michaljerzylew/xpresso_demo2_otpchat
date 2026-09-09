"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import { useState, type ReactNode } from "react";
import type { AppBarAction, AppBarModel, AppBarProperties } from "./app-bar";
import type { NavModel, NavUtility } from "./nav-model";

export type GreetingCommandModel = {
  profile: { name: string; email: string; role: string; avatarAlt: string };
  avatar?: { avifSrc: string; webpSrc: string; jpegSrc: string };
  searchActionLabel: string;
  boxedShellControl?: boolean;
  compactConsolidatedUtilityIds?: readonly string[];
  languageUtilityId?: string;
  languageChoices?: readonly NavUtility[];
  accountGroups?: readonly { name: string; items: readonly NavUtility[] }[];
};

export type CanvasGreetingMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type CanvasGreetingModel = GreetingCommandModel & {
  summaries: readonly CanvasGreetingMetric[];
  railLabel: string;
};

export type GreetingCommandReachability = {
  id: string;
  kind: "search" | "utility" | "account";
  taps: 1 | 2;
  surface: "command" | "search-overlay" | "account-overlay";
};

export function greetingCommandReachability(nav: NavModel, deviceClass: DeviceClass): GreetingCommandReachability[] {
  const compactSearch = deviceClass === "M" || deviceClass === "TP";
  return [
    { id: "search", kind: "search", taps: compactSearch ? 2 : 1, surface: compactSearch ? "search-overlay" : "command" },
    ...(nav.utility ?? []).map(({ id }) => ({ id, kind: "utility" as const, taps: 1 as const, surface: "command" as const })),
    { id: "account", kind: "account", taps: 2, surface: "account-overlay" },
  ];
}

function Glyph({ icon, label, renderActionIcon }: { icon: string; label: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const action: AppBarAction = { id: icon, label, icon, priority: 1 };
  return <span className="xp-greeting-command__glyph" data-icon-key={icon} aria-hidden="true">{renderActionIcon?.(icon, action) ?? label.slice(0, 1)}</span>;
}

function Greeting({ appBar }: { appBar: AppBarModel }) {
  return <div className="xp-greeting-command__greeting" data-xp-greeting-command-greeting=""><strong>{appBar.context.title}</strong><span>{appBar.context.greeting}</span></div>;
}

function SearchField({ appBar, model, id, renderActionIcon }: { appBar: AppBarModel; model: GreetingCommandModel; id: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  return <form className="xp-greeting-command__search-form" role="search" data-xp-greeting-command-search-form="" onSubmit={(event) => event.preventDefault()}><label htmlFor={id}>{appBar.search.label}</label><div><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /><input id={id} type="search" aria-label={appBar.search.label} placeholder={appBar.search.placeholder} enterKeyHint="search" autoFocus={id === "xp-greeting-command-search-overlay"} /><button type="submit" aria-label={model.searchActionLabel} data-xp-greeting-command-search-action=""><Glyph icon="search" label={model.searchActionLabel} renderActionIcon={renderActionIcon} /></button></div></form>;
}

function Search({ appBar, model, deviceClass, sourceSlug, renderActionIcon }: { appBar: AppBarModel; model: GreetingCommandModel; deviceClass: DeviceClass; sourceSlug?: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!appBar.search) return null;
  if (deviceClass !== "M" && deviceClass !== "TP") return <div className="xp-greeting-command__search" data-xp-greeting-command-search=""><SearchField appBar={appBar} model={model} id={`xp-greeting-command-search-${deviceClass.toLowerCase()}`} renderActionIcon={renderActionIcon} /></div>;
  return <div className="xp-greeting-command__search" data-xp-greeting-command-search=""><AdaptiveOverlay intent="edit" presentation={{ M: "full-screen", TP: "action-sheet" }} why="Compact classes open a focused search surface without displacing the four command utilities."><AdaptiveOverlay.Trigger className="xp-greeting-command__control" aria-label={`${appBar.search.label}: ${appBar.search.placeholder}`} data-xp-greeting-command-search-trigger=""><Glyph icon="search" label={appBar.search.label} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-greeting-command-search-overlay="" data-source-slug={sourceSlug}><AdaptiveOverlay.Header title={appBar.search.label} description={appBar.search.placeholder} /><AdaptiveOverlay.Body><SearchField appBar={appBar} model={model} id="xp-greeting-command-search-overlay" renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-greeting-command-search-footer=""><AdaptiveOverlay.Close>Close record search</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function ShellControl({ canvas, deviceClass, railOpen = true, onRailToggle, renderActionIcon }: { canvas?: CanvasGreetingModel; deviceClass: DeviceClass; railOpen?: boolean; onRailToggle?: () => void; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  if (!canvas || (deviceClass !== "M" && deviceClass !== "TP")) {
    return <button type="button" className="xp-greeting-command__control xp-greeting-command__shell-control" aria-label={canvas?.railLabel ?? "Toggle workspace navigation"} aria-pressed={canvas ? railOpen : undefined} onClick={canvas ? onRailToggle : undefined} data-xp-greeting-command-shell-control=""><Glyph icon="panel-left" label={canvas?.railLabel ?? "Toggle workspace navigation"} renderActionIcon={renderActionIcon} /></button>;
  }
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "full-screen", TP: "action-sheet" }} why="The compact shell control owns the application rail slot without inventing navigation routes."><AdaptiveOverlay.Trigger className="xp-greeting-command__control xp-greeting-command__shell-control" aria-label={canvas.railLabel} data-xp-greeting-command-shell-control=""><Glyph icon="panel-left" label={canvas.railLabel} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-canvas-greeting-rail-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={canvas.railLabel} description="Application navigation surface" /><AdaptiveOverlay.Body><div className="xp-canvas-greeting__rail-slot" data-xp-canvas-greeting-rail-slot="" aria-hidden="true" /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close workspace rail</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function UtilityContents({ utility, renderActionIcon }: { utility: NavUtility; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const badgeDescription = utility.badge ? `, ${utility.badge.label}: ${utility.badge.value}` : "";
  return <><Glyph icon={utility.icon} label={utility.label} renderActionIcon={renderActionIcon} /><span className="xp-greeting-command__utility-label">{utility.label}</span>{utility.badge ? <span className="xp-greeting-command__badge" aria-label={`${utility.badge.label}: ${utility.badge.value}`} data-badge-label={utility.badge.label} data-badge-value={utility.badge.value}>{utility.badge.value}</span> : null}<span className="xp-visually-hidden">{badgeDescription}</span></>;
}

function UtilityControl({ utility, renderActionIcon }: { utility: NavUtility; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const label = utility.badge ? `${utility.label}, ${utility.badge.label}: ${utility.badge.value}` : utility.label;
  return utility.href
    ? <a className="xp-greeting-command__control" href={utility.href} aria-label={label} data-xp-greeting-command-utility="" data-utility-id={utility.id}><UtilityContents utility={utility} renderActionIcon={renderActionIcon} /></a>
    : <button type="button" className="xp-greeting-command__control" aria-label={label} data-xp-greeting-command-utility="" data-utility-id={utility.id}><UtilityContents utility={utility} renderActionIcon={renderActionIcon} /></button>;
}

function LanguageControl({ utility, choices, deviceClass, renderActionIcon }: { utility: NavUtility; choices: readonly NavUtility[]; deviceClass: DeviceClass; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The complete locale choice set remains one tap from its labelled command utility."><AdaptiveOverlay.Trigger className="xp-greeting-command__control" aria-label={utility.label} data-xp-greeting-command-utility="" data-utility-id={utility.id}><UtilityContents utility={utility} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-greeting-command-language-overlay="" data-device-class={deviceClass}><AdaptiveOverlay.Header title={utility.label} description="Choose the interface language." /><AdaptiveOverlay.Body><div className="xp-greeting-command__choice-list" role="radiogroup" aria-label={utility.label}>{choices.map((choice, index) => <button key={choice.id} type="button" role="radio" aria-checked={index === 0} data-xp-greeting-command-language-choice="" data-choice-id={choice.id}><Glyph icon={choice.icon} label={choice.label} renderActionIcon={renderActionIcon} /><span>{choice.label}</span><span aria-hidden="true">{index === 0 ? "●" : "○"}</span></button>)}</div></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close language</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function AccountRows({ model, utilities, deviceClass, renderActionIcon }: { model: GreetingCommandModel; utilities: readonly NavUtility[]; deviceClass: DeviceClass; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  const relocatedUtilities = (model.compactConsolidatedUtilityIds ?? []).filter((id) => id !== model.languageUtilityId).map((id) => utilities.find((utility) => utility.id === id)).filter((utility): utility is NavUtility => Boolean(utility));
  return <>{compact && model.languageChoices?.length ? <section className="xp-greeting-command__account-group" data-account-group="language"><h3>Select language</h3><div className="xp-greeting-command__choice-list" role="radiogroup" aria-label="Select language">{model.languageChoices.map((choice, index) => <button key={choice.id} type="button" role="radio" aria-checked={index === 0} data-xp-greeting-command-language-choice="" data-choice-id={choice.id}><Glyph icon={choice.icon} label={choice.label} renderActionIcon={renderActionIcon} /><span>{choice.label}</span><span aria-hidden="true">{index === 0 ? "●" : "○"}</span></button>)}</div></section> : null}{compact && relocatedUtilities.length ? <section className="xp-greeting-command__account-group" data-account-group="relocated-utilities"><h3>Command utilities</h3>{relocatedUtilities.map((utility) => <button key={utility.id} type="button" data-xp-greeting-command-relocated-utility="" data-utility-id={utility.id}><Glyph icon={utility.icon} label={utility.label} renderActionIcon={renderActionIcon} /><span>{utility.label}</span></button>)}</section> : null}{(model.accountGroups ?? []).map((group) => <section key={group.name} className="xp-greeting-command__account-group" data-account-group={group.name}><h3>{group.name}</h3>{group.items.map((item) => item.href ? <a key={item.id} href={item.href} data-xp-greeting-command-account-command="" data-command-id={item.id}><Glyph icon={item.icon} label={item.label} renderActionIcon={renderActionIcon} /><span>{item.label}</span></a> : <button key={item.id} type="button" data-xp-greeting-command-account-command="" data-command-id={item.id}><Glyph icon={item.icon} label={item.label} renderActionIcon={renderActionIcon} /><span>{item.label}</span></button>)}</section>)}</>;
}

function AccountAvatar({ model, large = false }: { model: GreetingCommandModel; large?: boolean }) {
  const initials = model.profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`xp-greeting-command__avatar${large ? " xp-greeting-command__avatar--large" : ""}`} role="img" aria-label={model.profile.avatarAlt}>{model.avatar ? <picture><source srcSet={model.avatar.avifSrc} type="image/avif" /><source srcSet={model.avatar.webpSrc} type="image/webp" /><img src={model.avatar.jpegSrc} alt={model.profile.avatarAlt} /></picture> : initials}</span>;
}

function Account({ model, utilities, deviceClass, sourceSlug, renderActionIcon }: { model: GreetingCommandModel; utilities: readonly NavUtility[]; deviceClass: DeviceClass; sourceSlug?: string; renderActionIcon?: AppBarProperties["renderActionIcon"] }) {
  return <AdaptiveOverlay intent="inspect" presentation={{ M: "action-sheet", TP: "action-sheet", TL: "popover", DS: "popover", DW: "popover" }} why="The separate signed-in account and its grouped commands stay reachable without creating a brand identity."><AdaptiveOverlay.Trigger className="xp-greeting-command__account" aria-label={`Open account for ${model.profile.name}`} data-xp-greeting-command-account-trigger=""><AccountAvatar model={model} /><span className="xp-greeting-command__account-copy"><strong>{model.profile.name}</strong><small>{model.profile.role}</small></span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content data-xp-greeting-command-account-overlay="" data-device-class={deviceClass} data-source-slug={sourceSlug}><AdaptiveOverlay.Header title={model.profile.name} description={model.profile.role} /><AdaptiveOverlay.Body><section className="xp-greeting-command__profile" data-profile-name={model.profile.name} data-profile-email={model.profile.email} data-profile-role={model.profile.role}><AccountAvatar model={model} large /><div><strong>{model.profile.name}</strong><span>{model.profile.role}</span><a href={`mailto:${model.profile.email}`}>{model.profile.email}</a></div></section><AccountRows model={model} utilities={utilities} deviceClass={deviceClass} renderActionIcon={renderActionIcon} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer data-xp-greeting-command-account-footer=""><AdaptiveOverlay.Close>Close account</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function SummaryCards({ summaries }: { summaries: readonly CanvasGreetingMetric[] }) {
  return <section className="xp-canvas-greeting__summaries" aria-label="Terrain summary" data-xp-canvas-greeting-summaries="">{summaries.map((summary, index) => <article key={summary.id} className="xp-canvas-greeting__summary" data-summary-id={summary.id} data-summary-position={index + 1}><span>{summary.label}</span><strong>{summary.value}</strong><small>{summary.detail}</small></article>)}</section>;
}

export function GreetingCommandShell({ nav, appBar, model, canvas, deviceClass, children, renderActionIcon, sourceSlug, sourcePreset }: { nav: NavModel; appBar: AppBarModel; model: GreetingCommandModel; canvas?: CanvasGreetingModel; deviceClass: DeviceClass; children: ReactNode; renderActionIcon?: AppBarProperties["renderActionIcon"]; sourceSlug?: string; sourcePreset?: string }) {
  const [railOpen, setRailOpen] = useState(true);
  const activeModel = canvas ?? model;
  const touchGreeting = deviceClass === "M" || deviceClass === "TP" || deviceClass === "TL";
  const compact = deviceClass === "M" || deviceClass === "TP";
  const consolidated = new Set(activeModel.compactConsolidatedUtilityIds ?? []);
  const visibleUtilities = compact ? (nav.utility ?? []).filter((utility) => !consolidated.has(utility.id)) : (nav.utility ?? []);
  const form = canvas ? { M: "canvas-compact-command", TP: "canvas-portrait-command", TL: "canvas-touch-rail", DS: "canvas-detached-rail", DW: "canvas-detached-rail-wide" }[deviceClass] : { M: "compact-command", TP: "portrait-command", TL: "touch-command", DS: "inline-greeting-command", DW: "inline-greeting-command-wide" }[deviceClass];
  return (
    <div
      className={`xp-app-shell xp-greeting-command-shell${canvas ? " xp-canvas-greeting-shell" : ""}`}
      data-xp-shell=""
      data-xp-greeting-command-shell=""
      data-xp-greeting-command-renderer=""
      data-xp-canvas-greeting-shell={canvas ? "" : undefined}
      data-xp-canvas-greeting-renderer={canvas ? "" : undefined}
      data-rail-open={canvas && !compact ? String(railOpen) : undefined}
      data-shell-family="app"
      data-device-class={deviceClass}
      data-variant={form}
      data-shell-anatomy={canvas ? "appbar.canvas-greeting" : "appbar.greeting-command"}
      data-skin={canvas ? "canvas" : "plain"}
      data-nav-placement="none"
      data-source-slug={sourceSlug}
      data-source-preset={sourcePreset}
    >
      {canvas && !compact ? <aside className="xp-canvas-greeting__rail" aria-label={canvas.railLabel} data-xp-canvas-greeting-rail="" hidden={!railOpen}><div className="xp-canvas-greeting__rail-slot" data-xp-canvas-greeting-rail-slot="" aria-hidden="true" /></aside> : null}
      <a className="xp-shell-skip" href="#xp-shell-content">Skip to content</a>
      <header className="xp-greeting-command__command" data-xp-region="top" data-xp-command-rank="">
        {activeModel.boxedShellControl ? <ShellControl canvas={canvas} deviceClass={deviceClass} railOpen={railOpen} onRailToggle={() => setRailOpen((open) => !open)} renderActionIcon={renderActionIcon} /> : null}
        {touchGreeting ? null : <Greeting appBar={appBar} />}
        <Search appBar={appBar} model={activeModel} deviceClass={deviceClass} sourceSlug={sourceSlug} renderActionIcon={renderActionIcon} />
        <nav className="xp-greeting-command__utilities" aria-label="Command utilities">
          {visibleUtilities.map((utility) => utility.id === activeModel.languageUtilityId && activeModel.languageChoices?.length
            ? <LanguageControl key={utility.id} utility={utility} choices={activeModel.languageChoices} deviceClass={deviceClass} renderActionIcon={renderActionIcon} />
            : <UtilityControl key={utility.id} utility={utility} renderActionIcon={renderActionIcon} />)}
        </nav>
        <Account model={activeModel} utilities={nav.utility ?? []} deviceClass={deviceClass} sourceSlug={sourceSlug} renderActionIcon={renderActionIcon} />
      </header>
      {touchGreeting ? <section className="xp-greeting-command__greeting-band" data-relocation-target="greeting-band"><Greeting appBar={appBar} /></section> : null}
      {canvas ? <SummaryCards summaries={canvas.summaries} /> : null}
      <main className="xp-greeting-command__main xp-slot" id="xp-shell-content" tabIndex={-1} data-xp-region="content"><section className="xp-greeting-command__work-surface" data-xp-greeting-command-work-surface="">{children}</section></main>
    </div>
  );
}
