"use client";

import { AdaptiveOverlay, Field, FieldGroup, useDeviceClass, type OverlayPresentation } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ResolvedAccountSettingsFixture,
  SettingsAction,
  SettingsControl,
  SettingsMediaAsset,
  SettingsRecord,
  SettingsSection,
} from "./settings-surface-model";

const compactClass = (deviceClass: ReturnType<typeof useDeviceClass>) => deviceClass === "M" || deviceClass === "TP";

function Control({ control, sourceKey, onDirty }: { control: SettingsControl; sourceKey: string; onDirty: () => void }) {
  const id = `${sourceKey}-${control.id}`;
  const [visible, setVisible] = useState(false);
  if (control.kind === "switch" || control.kind === "checkbox") return (
    <label className="xp-settings__boolean" data-control-id={control.id}>
      <input type="checkbox" role={control.kind === "switch" ? "switch" : undefined} defaultChecked={control.checked} onChange={onDirty} />
      <span aria-hidden="true" />
      <strong>{control.label}</strong>
      {control.hint ? <small>{control.hint}</small> : null}
    </label>
  );
  if (control.kind === "radio") return (
    <fieldset className="xp-settings__choices" data-control-id={control.id}>
      <legend>{control.label}</legend>
      {control.choices.map((choice) => <label key={choice.id}><input type="radio" name={id} defaultChecked={choice.id === control.selectedId} onChange={onDirty} /><span><strong>{choice.label}</strong>{choice.hint ? <small>{choice.hint}</small> : null}</span></label>)}
    </fieldset>
  );
  if (control.kind === "upload") return (
    <div className="xp-settings__upload" data-control-id={control.id}>
      <strong>{control.label}</strong><p>{control.hint}</p><button type="button" onClick={onDirty}>Choose file</button><small>{control.accept.join(", ")} · {Math.round(control.maxBytes / 1_000_000)} MB max</small>
    </div>
  );
  if (control.kind === "range") return (
    <Field id={id} data-control-id={control.id}>
      <Field.Label>{control.label}: <output>{control.value}{control.unit}</output></Field.Label>
      <input id={id} type="range" min={control.min} max={control.max} defaultValue={control.value} onChange={onDirty} />
    </Field>
  );
  if (control.kind === "select") return (
    <Field id={id} data-control-id={control.id}>
      <Field.Label>{control.label}</Field.Label>
      <select id={id} autoComplete="off" defaultValue={control.selectedId} onChange={onDirty}>{control.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select>
    </Field>
  );
  const input = control as Extract<SettingsControl, { kind: "text" | "email" | "tel" | "url" | "password" | "number" | "time" }> | Extract<SettingsControl, { kind: "textarea" }>;
  return (
    <Field id={id} hasHelp={Boolean(input.hint)} data-control-id={control.id}>
      <Field.Label>{control.label}{"required" in input && input.required ? <span aria-hidden="true"> *</span> : null}</Field.Label>
      <div className="xp-settings__input-seat">
        {input.kind === "textarea" ? <textarea id={id} defaultValue={input.value} placeholder={input.placeholder} maxLength={input.maxLength} rows={3} onChange={onDirty} /> : <input id={id} type={input.kind === "password" ? (visible ? "text" : "password") : input.kind} inputMode={input.kind === "email" ? "email" : input.kind === "tel" ? "tel" : input.kind === "number" ? "numeric" : "text"} autoComplete="off" defaultValue={input.value} placeholder={input.placeholder} required={input.required} readOnly={input.readOnly} onChange={onDirty} />}
        {control.kind === "password" && control.visibilityToggleLabel ? <button type="button" className="xp-settings__visibility" aria-label={control.visibilityToggleLabel} aria-pressed={visible} onClick={() => setVisible((current) => !current)}><span aria-hidden="true">{visible ? "●" : "○"}</span></button> : null}
      </div>
      {input.hint ? <Field.Help>{input.hint}</Field.Help> : null}
    </Field>
  );
}

function ActionButton({ action, onAction }: { action: SettingsAction; onAction: (action: SettingsAction) => void }) {
  return <button type="button" data-action-id={action.id} data-tone={action.tone} onClick={() => onAction(action)}>{action.label}</button>;
}

function MediaSeat({ record, media }: { record: SettingsRecord; media: SettingsMediaAsset[] }) {
  if (!record.mediaKey) return <span className="xp-settings__record-glyph" aria-hidden="true">{record.title.slice(0, 2).toUpperCase()}</span>;
  const asset = media.find(({ key }) => key === record.mediaKey);
  if (asset?.kind === "raster" && asset.src) return <img src={asset.src} alt={asset.alt} />;
  return <span className="xp-settings__record-glyph" data-media-key={record.mediaKey} aria-hidden="true">{record.title.slice(0, 2).toUpperCase()}</span>;
}

function RecordList({ section, media, sourceKey, onDirty, onAction }: { section: SettingsSection; media: SettingsMediaAsset[]; sourceKey: string; onDirty: () => void; onAction: (action: SettingsAction, record?: SettingsRecord) => void }) {
  return <div className="xp-settings__records" data-record-count={section.records?.length ?? 0}>{section.records?.map((record) => (
    <article className="xp-settings__record" data-record-id={record.id} key={record.id}>
      <div className="xp-settings__record-identity"><MediaSeat record={record} media={media}/><div><h3>{record.title}</h3>{record.subtitle ? <p>{record.subtitle}</p> : null}{record.status ? <span>{record.status}</span> : null}</div></div>
      {section.kind !== "directory" && record.values?.length ? <dl>{record.values.map((value) => <div key={`${record.id}-${value.label}`}><dt>{value.label}</dt><dd>{value.value}</dd></div>)}</dl> : null}
      {record.controls?.length ? <div className="xp-settings__record-controls">{record.controls.map((control) => <Control key={control.id} control={control} sourceKey={sourceKey} onDirty={onDirty}/>)}</div> : null}
      {record.actions?.length ? <div className="xp-settings__record-actions">{record.actions.map((action) => <ActionButton key={action.id} action={action} onAction={(selected) => onAction(selected, record)}/>)}</div> : null}
    </article>
  ))}</div>;
}

function Matrix({ section, sourceKey, onDirty }: { section: SettingsSection; sourceKey: string; onDirty: () => void }) {
  if (!section.matrix) return null;
  return <div className="xp-settings__matrix" data-columns={section.matrix.columns.length}>{section.matrix.groups.map((group) => <section key={group.id} data-matrix-group={group.id}><h3>{group.label}</h3><div role="table" aria-label={group.label}><div role="row" className="xp-settings__matrix-head"><span role="columnheader">Notification</span>{section.matrix?.columns.map((column) => <span role="columnheader" key={column.id}>{column.label}</span>)}</div>{group.rows.map((row) => <div role="row" key={row.id} data-matrix-row={row.id}><strong role="rowheader">{row.label}</strong>{section.matrix?.columns.map((column) => <label key={column.id} aria-label={`${row.label}, ${column.label}`}><span className="xp-settings__matrix-channel" aria-hidden="true">{column.label}</span><input type="checkbox" defaultChecked={row.values[column.id]} onChange={onDirty}/></label>)}</div>)}</div></section>)}</div>;
}

function SectionBody({ section, model, onDirty, onAction }: { section: SettingsSection; model: ResolvedAccountSettingsFixture; onDirty: () => void; onAction: (action: SettingsAction, record?: SettingsRecord) => void }) {
  return <div className="xp-settings__section-body">
    {section.controls?.length ? <FieldGroup className="xp-settings__fields"><legend className="xp-settings__visually-hidden">{section.label}</legend>{section.controls.map((control) => <Control key={control.id} control={control} sourceKey={model.sourceKey} onDirty={onDirty}/>)}</FieldGroup> : null}
    <Matrix section={section} sourceKey={model.sourceKey} onDirty={onDirty}/>
    {section.records?.length ? <RecordList section={section} media={model.resolvedMedia} sourceKey={model.sourceKey} onDirty={onDirty} onAction={onAction}/> : null}
  </div>;
}

function overlayPresentation(deviceClass: ReturnType<typeof useDeviceClass>): OverlayPresentation {
  if (deviceClass === "M") return "bottom-sheet";
  if (deviceClass === "TP") return "action-sheet";
  if (deviceClass === "TL") return "side-drawer";
  return "dialog";
}

export function SettingsSurface({ model }: { model: ResolvedAccountSettingsFixture }) {
  const deviceClass = useDeviceClass();
  const initial = Math.max(0, model.sections.findIndex(({ id }) => id === model.initialSectionId));
  const [active, setActive] = useState(initial);
  const [compactOpen, setCompactOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<{ action: SettingsAction; record?: SettingsRecord } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const paneRef = useRef<HTMLElement | null>(null);
  const compact = compactClass(deviceClass);
  const section = model.sections[active] ?? model.sections[0];
  const presentation = overlayPresentation(deviceClass);
  const visibleActions = section.actions ?? [];
  const allSections = useMemo(() => model.sections, [model.sections]);
  const openSection = (index: number) => { setActive(index); setCompactOpen(compact); setDirty(false); };
  const closeSection = () => { setCompactOpen(false); setDirty(false); };
  const handleAction = (action: SettingsAction, record?: SettingsRecord) => {
    if (action.job === "commit") { setDirty(false); setAnnouncement(action.label); return; }
    if (action.job === "paginate") { setAnnouncement(action.label); return; }
    openerRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setSelected({ action, record });
  };
  const closeAction = () => { setSelected(null); requestAnimationFrame(() => openerRef.current?.focus()); };
  useEffect(() => { paneRef.current?.scrollTo({ top: 0 }); }, [active]);
  return <section className="xp-settings" data-xp-settings-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-compact-open={compactOpen || undefined}>
    <div className="xp-settings__top"><header className="xp-settings__header"><div><p>Account workspace</p><h1>{model.title}</h1>{model.description ? <span>{model.description}</span> : null}</div><span>{active + 1}<small>/{model.sections.length}</small></span></header>{model.alert ? <aside className="xp-settings__alert" data-tone={model.alert.tone} role="status"><strong>{model.alert.title}</strong><span>{model.alert.description}</span></aside> : null}</div>
    <div className="xp-settings__layout">
      <nav className="xp-settings__navigation" aria-label="Settings sections">{allSections.map((item, index) => <button type="button" key={item.id} aria-current={active === index ? "page" : undefined} onClick={() => openSection(index)}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</nav>
      <main ref={paneRef} className="xp-settings__pane" data-visible={!compact || compactOpen || undefined}>
        <header className="xp-settings__pane-header">{compact ? <button type="button" onClick={closeSection} aria-label="Back to settings">←</button> : null}<div><p>Settings section</p><h2>{section.label}</h2>{section.description ? <span>{section.description}</span> : null}</div></header>
        <SectionBody section={section} model={model} onDirty={() => setDirty(true)} onAction={handleAction}/>
      </main>
    </div>
    {(dirty || visibleActions.length) && (!compact || compactOpen) ? <footer className="xp-settings__actions" data-sticky-owner>{visibleActions.map((action) => <ActionButton key={action.id} action={action} onAction={(item) => handleAction(item)}/>)}</footer> : null}
    {announcement ? <p className="xp-settings__announcement" role="status">{announcement}</p> : null}
    <AdaptiveOverlay intent={selected?.action.tone === "danger" ? "confirm" : "detail"} presentation={{ [deviceClass]: presentation }} why="Settings detail and confirmation keep one class-native overlay owner." open={Boolean(selected)} onOpenChange={(open) => { if (!open) closeAction(); }} modal>
      <AdaptiveOverlay.Content className="xp-settings__overlay" data-settings-action={selected?.action.id}>
        <AdaptiveOverlay.Header title={selected?.record?.title ?? selected?.action.label ?? "Settings action"} description={selected?.action.requiresConfirmation ? "Review this change before continuing." : selected?.record?.subtitle} closeLabel="Close" />
        <AdaptiveOverlay.Body>{selected?.record?.values?.length ? <dl>{selected.record.values.map((value) => <div key={value.label}><dt>{value.label}</dt><dd>{value.value}</dd></div>)}</dl> : <p>{selected?.action.tone === "danger" ? "This change affects access or stored settings." : "The selected settings action is ready."}</p>}</AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><button type="button" onClick={closeAction}>Cancel</button><button type="button" data-tone={selected?.action.tone} onClick={() => { setAnnouncement(selected?.action.label ?? "Updated"); closeAction(); }}>{selected?.action.label}</button></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </section>;
}
