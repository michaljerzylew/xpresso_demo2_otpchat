"use client";

import { useDeviceClass } from "@xp/primitives";
import { useId, useMemo, useState, type FormEvent } from "react";
import type { DecisionAction, DecisionMediaSeat, DecisionProof, ResolvedDecisionBandFixture } from "./decision-band-model";

function MediaSeat({ seat, model }: { seat: DecisionMediaSeat; model: ResolvedDecisionBandFixture }) {
  const asset = model.resolvedMedia.find((candidate) => candidate.key === seat.assetKey);
  if (!asset) return null;
  const source = model.tone === "dark" || seat.theme === "dark" ? asset.darkSrc ?? asset.src : asset.src;
  const style = seat.focalPoint ? { objectPosition: `${seat.focalPoint.x * 100}% ${seat.focalPoint.y * 100}%` } : undefined;
  if (source) return <img className="xp-decision-band__media-asset" src={source} alt={seat.alt} style={style}/>;
  const systemContent: Record<string, { heading: string; cells: readonly [string, string, string, string] }> = {
    ui_signal: { heading: "Route control", cells: ["18 active paths", "North relay online", "Dock sector clear", "2 routes to review"] },
    ui_capacity: { heading: "Shift capacity", cells: ["68% North", "84% Dock", "51% Yard", "72% Intake"] },
    ui_schedule: { heading: "Fleet health", cells: ["All systems online", "Sensor array healthy", "Relay bridge review", "Power loop due"] },
    device_field_console: { heading: "Shift board", cells: ["06:30 North", "10:15 Intake", "14:40 Yard", "3 routes"] },
    collage_work_surfaces: { heading: "Operations workspace", cells: ["Live map · 12 sites", "Work orders · 38", "Team board · 7 crews", "Alerts · 2"] },
  };
  const content = systemContent[seat.assetKey] ?? { heading: "System preview", cells: ["Status", "Queue", "Schedule", "Review"] as const };
  return (
    <span className="xp-decision-band__system-media" role={seat.alt ? "img" : undefined} aria-label={seat.alt || undefined} data-system-role={seat.role} data-system-key={seat.assetKey}>
      {content.cells.map((label) => <span key={label}><small>{label}</small></span>)}
      <strong>{content.heading}</strong>
    </span>
  );
}

function Action({ action, model, disabled = false }: { action: DecisionAction; model: ResolvedDecisionBandFixture; disabled?: boolean }) {
  const className = "xp-decision-band__action";
  const icon = action.iconKey ? model.resolvedMedia.find((candidate) => candidate.key === action.iconKey) : undefined;
  const iconNode = icon?.src ? <img data-action-icon={action.iconKey} src={icon.src} alt=""/> : action.iconKey ? <span data-action-icon={action.iconKey} aria-hidden="true"/> : null;
  if (action.kind === "submit") return <button className={className} data-emphasis={action.emphasis} type="submit" aria-label={action.accessibleLabel} disabled={disabled}>{iconNode}<span>{action.label}</span></button>;
  return <a className={className} data-emphasis={action.emphasis} data-action-kind={action.kind} href={action.href} aria-label={action.accessibleLabel}>{iconNode}<span>{action.label}</span></a>;
}

function Proof({ proof, model }: { proof: DecisionProof; model: ResolvedDecisionBandFixture }) {
  if (proof.kind === "people") return (
    <div className="xp-decision-band__people" aria-label={proof.countLabel}>
      <div>{proof.people.map((person) => {
        const asset = model.resolvedMedia.find((candidate) => candidate.key === person.portraitKey);
        return <button type="button" key={person.id} aria-label={person.label} data-person-id={person.id}>{asset?.src ? <img src={asset.src} alt=""/> : <span aria-hidden="true">{person.label.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>}<small role="tooltip">{person.label}</small></button>;
      })}</div>
      <strong>{proof.countLabel}</strong>
    </div>
  );
  if (proof.kind === "benefits") return <ul className="xp-decision-band__benefits">{proof.items.map((item) => <li key={item.id}><span aria-hidden="true">✓</span>{item.label}</li>)}</ul>;
  if (proof.kind === "tags") return <ul className="xp-decision-band__tags">{proof.items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>;
  return <dl className="xp-decision-band__stats">{proof.items.map((item) => <div key={item.id}><dt><strong>{item.displayValue}</strong>{item.suffix ? <span>{item.suffix}</span> : null}</dt><dd>{item.description}</dd></div>)}</dl>;
}

export function DecisionBand({ model }: { model: ResolvedDecisionBandFixture }) {
  const deviceClass = useDeviceClass();
  const inputId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "empty" | "invalid" | "pending" | "success" | "failure">("idle");
  const media = useMemo(() => (model.media ?? []).filter((seat) => seat.role !== "portrait" && seat.role !== "platform-mark"), [model.media]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!model.form) return;
    if (!email.trim()) return setState("empty");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState("invalid");
    setState("pending");
    window.setTimeout(() => setState(new URLSearchParams(window.location.search).get("form") === "failure" ? "failure" : "success"), 220);
  };
  const message = model.form && state !== "idle" ? model.form.validation[state] : "";

  return (
    <section className="xp-decision-band" data-xp-decision-band-renderer data-source-key={model.slug} data-preset={model.preset} data-tone={model.tone} data-device-class={deviceClass}>
      <div className="xp-decision-band__decor" aria-hidden="true">{model.decor?.map((decor, index) => <span key={`${decor.kind}-${index}`} data-decor-kind={decor.kind}/>)}</div>
      <div className="xp-decision-band__payload">
        {model.eyebrow ? <p className="xp-decision-band__eyebrow">{model.eyebrow}</p> : null}
        <h1>{model.headline}</h1>
        {model.lede ? <p className="xp-decision-band__lede">{model.lede}</p> : null}
        {model.proof ? <Proof proof={model.proof} model={model}/> : null}
        {model.form ? (
          <form className="xp-decision-band__form" onSubmit={submit} noValidate data-form-state={state}>
            <label htmlFor={inputId}>{model.form.label}</label>
            <div><input id={inputId} type="email" inputMode="email" autoComplete="email" enterKeyHint="send" required={model.form.required} disabled={state === "pending"} value={email} placeholder={model.form.placeholder} aria-describedby={message ? statusId : undefined} aria-invalid={state === "empty" || state === "invalid" || state === "failure"} onChange={(event) => { setEmail(event.currentTarget.value); if (state !== "idle") setState("idle"); }}/>{model.actions.filter((action) => action.kind === "submit").map((action) => <Action action={action} model={model} disabled={state === "pending"} key={action.id}/>)}</div>
            <output id={statusId} aria-live="polite">{message}</output>
          </form>
        ) : <div className="xp-decision-band__actions">{model.actions.map((action) => <Action action={action} model={model} key={action.id}/>)}</div>}
      </div>
      {media.length ? <div className="xp-decision-band__media" data-media-count={media.length}>{media.map((seat) => <figure key={seat.id} data-media-role={seat.role} data-media-key={seat.assetKey} data-compact-crop={seat.compactCrop}><MediaSeat seat={seat} model={model}/></figure>)}</div> : null}
    </section>
  );
}
