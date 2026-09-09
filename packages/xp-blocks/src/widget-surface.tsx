"use client";

import { AdaptiveOverlay, useDeviceClass } from "@xp/primitives";
import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { WidgetAction, WidgetFixture, WidgetInteractive, WidgetMedia, WidgetRow, WidgetSummary, WidgetTab, WidgetTwin } from "./widget-surface-model";

const mediaBase: Record<string, string> = {
  widget_product_insight_001: "/media/datatable-range-tablet-640",
  widget_product_001: "/media/datatable-quarry-helmet-640",
  widget_product_002: "/media/datatable-moorland-boots-640",
  widget_product_003: "/media/datatable-signal-gloves-640",
  widget_product_004: "/media/datatable-survey-pack-640",
  widget_product_005: "/media/datatable-shield-glasses-640",
  portrait_person_01: "/media/dashboard-header-01-aarav-patel-avatar-256",
  portrait_person_02: "/media/dashboard-dialog-aisha-khan-avatar-256",
  portrait_person_03: "/media/dashboard-dialog-beatriz-costa-avatar-256",
  portrait_person_04: "/media/dashboard-dialog-darius-vasile-avatar-256",
  portrait_person_05: "/media/dashboard-dialog-elena-popova-avatar-256",
  portrait_person_06: "/media/dashboard-dialog-hiroshi-tanaka-avatar-256",
  photo_team_work_001: "/media/office-team-001-640",
};

const toneColor: Record<string, string> = { positive: "#16835b", negative: "#bd4040", warning: "#b66b12", info: "#3478d4", neutral: "#6e7480" };

function Glyph({ iconKey = "metric" }: { iconKey?: string }) {
  const seed = [...iconKey].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5;
  return <svg className="xp-widget__glyph" viewBox="0 0 24 24" aria-hidden="true" data-icon-key={iconKey}>
    {seed === 0 ? <><path d="M4 19V9m8 10V5m8 14v-7"/><path d="M2 21h20"/></> : null}
    {seed === 1 ? <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 2"/></> : null}
    {seed === 2 ? <><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8m-8 4h5"/></> : null}
    {seed === 3 ? <><path d="M5 17l4-4 3 2 7-8"/><path d="M15 7h4v4"/></> : null}
    {seed === 4 ? <><path d="M12 3l8 5v8l-8 5-8-5V8z"/><path d="M8 12h8"/></> : null}
  </svg>;
}

function Media({ media, className }: { media: WidgetMedia; className?: string }) {
  const base = mediaBase[media.key];
  if (!base) return <span className={`xp-widget__media-fallback ${className ?? ""}`} role="img" aria-label={media.alt}>{media.alt.slice(0, 2).toUpperCase()}</span>;
  return <picture className={className} data-media-key={media.key} data-media-role={media.role}>
    <source srcSet={`${base}.avif`} type="image/avif"/>
    <source srcSet={`${base}.webp`} type="image/webp"/>
    <img src={`${base}.jpg`} alt={media.alt}/>
  </picture>;
}

function HeaderMedia({ fixture }: { fixture: WidgetFixture }) {
  if (fixture.sourceKey === "widget-component-16") return null;
  const referenced = new Set([
    ...(fixture.rows ?? []).map((row) => row.mediaKey),
    ...(fixture.tabs ?? []).flatMap((tab) => tab.rows.map((row) => row.mediaKey)),
  ].filter(Boolean));
  const media = (fixture.media ?? []).filter((item) => !referenced.has(item.key));
  if (!media.length) return null;
  return <div className="xp-widget__header-media">{media.map((item) => <Media media={item} className="xp-widget__header-picture" key={item.key}/>)}</div>;
}

function Menu({ action, owner }: { action: Extract<WidgetAction, { kind: "menu" }>; owner: string }) {
  return <AdaptiveOverlay intent="menu">
    <AdaptiveOverlay.Trigger className="xp-widget__menu-trigger" aria-label={action.label} data-action-id={action.id}><span aria-hidden="true">•••</span></AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-widget__overlay" data-widget-overlay="menu" data-owner={owner}>
      <AdaptiveOverlay.Header title={action.label} closeLabel={`Close ${action.label}`}/>
      <AdaptiveOverlay.Body><div className="xp-widget__commands">{action.commands.map((command) => <button type="button" key={command.id} data-tone={command.tone}>{command.label}</button>)}</div></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function Action({ action, owner }: { action: WidgetAction; owner: string }) {
  if (action.kind === "menu") return <Menu action={action} owner={owner}/>;
  if (action.kind === "navigate") return <a className="xp-widget__button" href={action.href} data-action-id={action.id}>{action.label}</a>;
  return <button className="xp-widget__button" type="button" data-action-id={action.id}>{action.label}</button>;
}

function Progress({ row }: { row: WidgetRow }) {
  if (!row.progress) return null;
  const ratio = Math.max(0, Math.min(1, row.progress.value / row.progress.max));
  if (row.progress.kind === "ring") return <span className="xp-widget__ring" style={{ "--xp-widget-ratio": `${ratio * 360}deg` } as CSSProperties} role="img" aria-label={`${row.progress.value} of ${row.progress.max}`}><strong>{row.progress.display ?? `${Math.round(ratio * 100)}%`}</strong></span>;
  return <progress className="xp-widget__progress" value={row.progress.value} max={row.progress.max}>{row.progress.value} of {row.progress.max}</progress>;
}

function Samples({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return <span className="xp-widget__samples" aria-hidden="true">{values.map((value, index) => <i key={index} style={{ "--xp-sample": `${Math.max(8, value / max * 100)}%` } as CSSProperties}/>)}</span>;
}

function Row({ row, media }: { row: WidgetRow; media?: WidgetMedia }) {
  return <div className="xp-widget__row" data-row-id={row.id}>
    {media ? <Media media={media} className="xp-widget__thumb"/> : row.iconKey ? <span className="xp-widget__icon"><Glyph iconKey={row.iconKey}/></span> : null}
    {row.progress?.kind === "ring" ? <Progress row={row}/> : null}
    <span className="xp-widget__row-copy"><strong>{row.label}</strong>{row.detail ? <small>{row.detail}</small> : null}{row.status ? <small data-tone={row.status.tone}>{row.status.label}</small> : null}</span>
    {row.samples ? <Samples values={row.samples}/> : null}
    <span className="xp-widget__row-values">{row.value ? <strong>{row.value}</strong> : null}{row.secondaryValue ? <small>{row.secondaryValue}</small> : null}{row.delta ? <small data-tone={row.delta.tone}>{row.delta.direction === "down" ? "↓" : row.delta.direction === "up" ? "↑" : ""} {row.delta.display}</small> : null}</span>
    {row.progress?.kind === "line" ? <Progress row={row}/> : null}
    {row.fields?.map((field) => <label className="xp-widget__field" key={field.id}><span>{field.label}</span><input aria-invalid={Boolean(field.error)} defaultValue={field.value} inputMode={field.kind === "cvc" || field.kind === "card" ? "numeric" : undefined} placeholder={field.placeholder}/>{field.error ? <small>{field.error}</small> : null}</label>)}
    {row.actions?.map((action) => <Action action={action} owner={row.id} key={action.id}/>)}
  </div>;
}

function Summary({ items }: { items: WidgetSummary[] }) {
  return <dl className="xp-widget__summary">{items.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd>{item.detail ? <small>{item.detail}</small> : null}{item.delta ? <em data-tone={item.delta.tone}>{item.delta.direction === "down" ? "↓" : item.delta.direction === "up" ? "↑" : ""} {item.delta.display}</em> : null}{item.progress ? <progress value={item.progress.value} max={item.progress.max}>{item.progress.value}</progress> : null}</div>)}</dl>;
}

function Rows({ fixture }: { fixture: WidgetFixture }) {
  const byKey = Object.fromEntries((fixture.media ?? []).map((media) => [media.key, media]));
  return <div className="xp-widget__rows" data-row-count={fixture.rows?.length ?? 0}>{fixture.rows?.map((row) => <Row key={row.id} row={row} media={row.mediaKey ? byKey[row.mediaKey] : undefined}/>)}</div>;
}

function MiniTable({ fixture }: { fixture: WidgetFixture }) {
  return <div className="xp-widget__table" role="table" aria-label={fixture.title}>
    <div role="row" className="xp-widget__table-head">{fixture.columns?.map((column) => <span role="columnheader" key={column.id}>{column.label}</span>)}</div>
    {fixture.rows?.map((row) => <div role="row" className="xp-widget__table-row" key={row.id} data-row-id={row.id}><span role="cell"><strong>{row.label}</strong><small>{row.detail}</small></span><span role="cell">{row.secondaryValue}</span><span role="cell"><strong>{row.value}</strong><small>{row.delta?.display}</small></span></div>)}
  </div>;
}

function Tabs({ tabs }: { tabs: WidgetTab[] }) {
  const [selected, setSelected] = useState(tabs[0].id);
  const active = tabs.find(({ id }) => id === selected) ?? tabs[0];
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setSelected(tabs[next].id);
    document.getElementById(`widget-tab-${tabs[next].id}`)?.focus();
  };
  return <div className="xp-widget__tabs"><div role="tablist">{tabs.map((tab, index) => <button id={`widget-tab-${tab.id}`} role="tab" type="button" key={tab.id} aria-selected={selected === tab.id} tabIndex={selected === tab.id ? 0 : -1} onClick={() => setSelected(tab.id)} onKeyDown={(event) => onKeyDown(event, index)}>{tab.iconKey ? <Glyph iconKey={tab.iconKey}/> : null}<span>{tab.label}</span></button>)}</div><div role="tabpanel" aria-labelledby={`widget-tab-${active.id}`} data-tab-id={active.id} className="xp-widget__tab-panel">{active.rows.map((row) => <Row row={row} key={row.id}/>)}</div></div>;
}

function PlanPicker({ interactive }: { interactive: Extract<WidgetInteractive, { kind: "plan-picker" }> }) {
  const [selected, setSelected] = useState(interactive.selectedId);
  return <div className="xp-widget__plan"><fieldset><legend>Choose one service package</legend>{interactive.choices.map((choice) => <label key={choice.id} data-selected={selected === choice.id || undefined}><input type="radio" name="widget-plan" value={choice.id} checked={selected === choice.id} onChange={() => setSelected(choice.id)}/><span><strong>{choice.label}</strong>{choice.description ? <small>{choice.description}</small> : null}</span><b>{choice.price}</b></label>)}</fieldset><dl>{interactive.totals.map((row) => <div key={row.id}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl><Action action={interactive.commit} owner="plan-picker"/></div>;
}

function PaymentUpgrade({ interactive }: { interactive: Extract<WidgetInteractive, { kind: "payment-upgrade" }> }) {
  return <div className="xp-widget__payment"><Row row={interactive.currentPlan}/><fieldset><legend>Saved payment methods</legend>{interactive.savedMethods.map((row) => <Row row={row} key={row.id}/>)}</fieldset><label className="xp-widget__field"><span>{interactive.cardInput.label}</span><input inputMode="numeric" placeholder={interactive.cardInput.placeholder}/></label><Action action={interactive.commit} owner="payment-upgrade"/></div>;
}

function CustomerSearch({ interactive }: { interactive: Extract<WidgetInteractive, { kind: "customer-search" }> }) {
  const [query, setQuery] = useState("");
  const results = interactive.allRows.filter((row) => `${row.label} ${row.secondaryValue ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="xp-widget__customers"><Summary items={interactive.summary}/><div className="xp-widget__rows">{interactive.previewRows.map((row) => <Row row={row} key={row.id}/>)}</div><AdaptiveOverlay intent="search"><AdaptiveOverlay.Trigger className="xp-widget__button" data-action-id={interactive.openAction.id}>{interactive.openAction.label}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-widget__overlay xp-widget__search" data-widget-overlay="search"><AdaptiveOverlay.Header title={interactive.openAction.label} closeLabel={`Close ${interactive.openAction.label}`}/><AdaptiveOverlay.Body><label className="xp-widget__search-field"><span>{interactive.searchLabel}</span><input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={interactive.searchLabel}/></label>{results.length ? <div className="xp-widget__search-results">{results.map((row) => <button type="button" key={row.id}><span>{row.label}</span><small>{row.secondaryValue}</small></button>)}</div> : <div className="xp-widget__empty"><h3>{interactive.emptyTitle}</h3><p>{interactive.emptyDescription}</p></div>}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function Interactive({ model }: { model: WidgetInteractive }) {
  if (model.kind === "plan-picker") return <PlanPicker interactive={model}/>;
  if (model.kind === "payment-upgrade") return <PaymentUpgrade interactive={model}/>;
  return <CustomerSearch interactive={model}/>;
}

function Twin({ twin }: { twin: WidgetTwin }) {
  return <section className="xp-widget__twin" data-twin-id={twin.id}><header><h3>{twin.title}</h3>{twin.action ? <Action action={twin.action} owner={twin.id}/> : null}</header><div className="xp-widget__rows">{twin.rows.map((row) => <Row row={row} key={row.id}/>)}</div></section>;
}

function SystemMap({ label }: { label: string }) {
  return <svg className="xp-widget__map" viewBox="0 0 360 180" role="img" aria-label={label}><path d="M18 70l38-28 42 8 28-22 58 13 37-15 48 25 54-6 30 32-24 25-52 4-25 28-65-10-44 18-39-29-45 7-29-23z"/><path d="M0 54h360M0 108h360M90 0v180m90-180v180m90-180v180"/><circle cx="184" cy="88" r="8"/><circle cx="244" cy="116" r="5"/><circle cx="111" cy="75" r="5"/></svg>;
}

function FeatureCard({ fixture }: { fixture: WidgetFixture }) {
  const media = fixture.media ?? [];
  const cover = media.find(({ role }) => role === "cover");
  const avatars = media.filter(({ role }) => role === "avatar");
  return <div className="xp-widget__feature">{cover ? <Media media={cover} className="xp-widget__cover"/> : null}<div className="xp-widget__tags">{fixture.rows?.map((row) => <span key={row.id}>{row.label}</span>)}</div><div className="xp-widget__people">{avatars.map((avatar) => <Media media={avatar} className="xp-widget__avatar" key={avatar.key}/>)}</div></div>;
}

function Body({ fixture }: { fixture: WidgetFixture }) {
  if (fixture.sourceKey === "widget-component-16") return <FeatureCard fixture={fixture}/>;
  if (fixture.preset === "mini-table") return <MiniTable fixture={fixture}/>;
  if (fixture.preset === "tabbed" && fixture.tabs) return <Tabs tabs={fixture.tabs}/>;
  if (fixture.preset === "interactive" && fixture.interactive) return <Interactive model={fixture.interactive}/>;
  if (fixture.preset === "twin-list" && fixture.twins) return <div className="xp-widget__twins"><Twin twin={fixture.twins[0]}/><Twin twin={fixture.twins[1]}/></div>;
  return <><Rows fixture={fixture}/>{fixture.select ? <label className="xp-widget__select"><span>{fixture.select.label}</span><select defaultValue={fixture.select.selectedId}>{fixture.select.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label> : null}{fixture.mapLabel ? <SystemMap label={fixture.mapLabel}/> : null}</>;
}

export function WidgetSurface({ fixture }: { fixture: WidgetFixture }) {
  const deviceClass = useDeviceClass();
  const labelledBy = `${fixture.sourceKey}-title`;
  return <article className="xp-widget" data-xp-widget-renderer data-source-key={fixture.sourceKey} data-preset={fixture.preset} data-device-class={deviceClass} aria-labelledby={labelledBy}>
    <header className="xp-widget__header"><div><h2 id={labelledBy}>{fixture.title}</h2>{fixture.description ? <p>{fixture.description}</p> : null}</div><HeaderMedia fixture={fixture}/><div className="xp-widget__header-actions">{fixture.actions?.filter((action) => action.kind === "menu").map((action) => <Action action={action} owner={fixture.sourceKey} key={action.id}/>)}</div></header>
    {fixture.summary?.length ? <Summary items={fixture.summary}/> : null}
    <div className="xp-widget__body"><Body fixture={fixture}/></div>
    {fixture.actions?.some((action) => action.kind !== "menu") ? <footer className="xp-widget__footer">{fixture.actions.filter((action) => action.kind !== "menu").map((action) => <Action action={action} owner={fixture.sourceKey} key={action.id}/>)}</footer> : null}
  </article>;
}
