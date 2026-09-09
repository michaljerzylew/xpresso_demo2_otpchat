"use client";

import { ChoiceSet, Field, FieldGroup, SectionedForm, useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { FormActionModel, FormChoiceSetModel, FormFieldModel, FormSectionModel, FormSurfaceFixture } from "./form-surface-model";
import { StepPane, WizardShell, defineWizard, type WizardActionBehavior, type WizardDefinition, type WizardShellCopy, type WizardStepMeta } from "./wizard-shell";

const isWizard = (preset: FormSurfaceFixture["preset"]) => preset === "product-wizard" || preset === "account-wizard";
const isSectionOwner = (preset: FormSurfaceFixture["preset"]) => preset !== "profile-grid";

const productWizardDefinition = defineWizard([
  { id: "step-type" },
  { id: "step-info" },
  { id: "step-price" },
  { id: "step-review" },
  { id: "step-pub" },
] as const);
const accountWizardDefinition = defineWizard([
  { id: "step-acct" },
  { id: "step-comp" },
  { id: "step-sub" },
  { id: "step-done" },
] as const);

const legacyWizardCopy: WizardShellCopy = {
  progressLabel: "Workflow steps",
  openStepListLabel: "View steps",
  closeStepListLabel: "Close steps",
  stepCount: "{current} of {total}",
  currentStepLabel: "Current step",
  completedStepLabel: "Completed step",
  availableStepLabel: "Available step",
  lockedStepLabel: "Locked step",
  announcements: {
    stepChanged: "Step changed to {step}.",
    validationFailed: "Review the marked fields before continuing.",
    submitted: "Workflow submitted.",
    reset: "Workflow reset.",
    processing: "Processing workflow.",
    failed: "The action failed. Your entries are still available.",
  },
};

export function formSurfaceWizardActionBehavior(action: FormActionModel, stepIndex: number, stepCount: number): WizardActionBehavior {
  if (stepIndex === stepCount - 1) return "reset";
  if (action.kind === "secondary") return "previous";
  if (stepIndex === stepCount - 2) return "submit";
  return "next";
}

function FieldControl({ field, sourceKey }: { field: FormFieldModel; sourceKey: string }) {
  const id = `${sourceKey}-${field.id}`;
  const [visible, setVisible] = useState(false);
  if (field.kind === "checkbox" || field.kind === "switch") return (
    <div className="xp-form-surface__boolean" data-field-id={field.id} data-field-span={field.span ?? "one"} data-invalid={field.error ? "true" : undefined}>
      <label htmlFor={id}>
        <input id={id} type="checkbox" role={field.kind === "switch" ? "switch" : undefined} defaultChecked={field.value === true} aria-describedby={field.error ? `${id}-error` : undefined}/>
        <span aria-hidden="true"/>
        <strong>{field.label}</strong>
      </label>
      {field.help ? <p>{field.help}</p> : null}
      {field.error ? <p id={`${id}-error`} role="alert">{field.error}</p> : null}
    </div>
  );
  if (field.kind === "radio" && field.options?.length) return (
    <fieldset className="xp-form-surface__native-choices" data-field-id={field.id} data-field-span={field.span ?? "one"}>
      <legend>{field.label}</legend>
      {field.options.map((option) => <label key={option.id}><input type="radio" name={id} value={option.id} defaultChecked={field.value === option.id}/><span>{option.label}</span></label>)}
      {field.error ? <p role="alert">{field.error}</p> : null}
    </fieldset>
  );
  return (
    <Field id={id} invalid={Boolean(field.error)} hasHelp={Boolean(field.help)} hasError={Boolean(field.error)} data-field-id={field.id} data-field-span={field.span ?? "one"}>
      <Field.Label>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</Field.Label>
      <div className="xp-form-surface__input-seat">
        {field.kind === "textarea" ? <Field.Textarea defaultValue={typeof field.value === "string" ? field.value : undefined} placeholder={field.placeholder} required={field.required} rows={3}/> : field.kind === "select" ? <Field.Select autoComplete="off" defaultValue={typeof field.value === "string" ? field.value : undefined}><option value="">Choose an option</option>{field.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</Field.Select> : <Field.Input type={field.kind === "password" ? (visible ? "text" : "password") : field.kind === "number" || field.kind === "date" || field.kind === "email" || field.kind === "tel" ? field.kind : "text"} inputMode={field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : field.kind === "number" ? "numeric" : "text"} enterKeyHint="next" autoComplete="off" defaultValue={typeof field.value === "string" || typeof field.value === "number" ? field.value : undefined} placeholder={field.placeholder} required={field.required}/>}
        {field.visibilityToggleLabel ? <button type="button" className="xp-form-surface__visibility" aria-label={field.visibilityToggleLabel} aria-pressed={visible} onClick={() => setVisible((value) => !value)}><span aria-hidden="true">{visible ? "◉" : "◎"}</span></button> : null}
      </div>
      {field.help ? <Field.Help>{field.help}</Field.Help> : null}
      {field.error ? <Field.Error>{field.error}</Field.Error> : null}
    </Field>
  );
}

function ChoiceGroup({ set }: { set: FormChoiceSetModel }) {
  const initial = Array.isArray(set.value) ? set.value : set.value ? [set.value] : set.options[0] ? [set.options[0].id] : [];
  const [selected, setSelected] = useState(initial);
  if (set.selection === "single") return <div className="xp-form-surface__choice-group" data-presentation={set.presentation} data-choice-set={set.id}><h3>{set.label}</h3><ChoiceSet label={set.label} items={set.options.map((option) => ({ value: option.id, label: option.label, description: option.description, meta: option.price || option.badge, details: option.details, disabled: option.disabled }))} value={selected[0]} onChange={(value) => setSelected([value])}/>{set.selectedDetails?.length ? <ul className="xp-form-surface__selected-details">{set.selectedDetails.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}</div>;
  return <fieldset className="xp-form-surface__choice-group xp-form-surface__choice-group--multi" data-presentation={set.presentation} data-choice-set={set.id}><legend>{set.label}</legend><div>{set.options.map((option) => {
    const checked = selected.includes(option.id);
    return <label key={option.id} data-selected={checked || undefined} data-disabled={option.disabled || undefined}><input type="checkbox" value={option.id} checked={checked} disabled={option.disabled} onChange={() => setSelected((current) => checked ? current.filter((id) => id !== option.id) : [...current, option.id])}/><span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}{option.disabledReason ? <em>{option.disabledReason}</em> : null}</span></label>;
  })}</div></fieldset>;
}

function SectionBody({ section, sourceKey }: { section: FormSectionModel; sourceKey: string }) {
  return <div className="xp-form-surface__section-body" data-section-body={section.id}>
    {section.description ? <p className="xp-form-surface__section-description">{section.description}</p> : null}
    {section.fields?.length ? <FieldGroup className="xp-form-surface__fields"><legend className="xp-form-surface__visually-hidden">{section.title} fields</legend>{section.fields.map((field) => <FieldControl key={field.id} field={field} sourceKey={sourceKey}/>)}</FieldGroup> : null}
    {section.choiceSets?.map((set) => <ChoiceGroup key={set.id} set={set}/>) }
    {section.optionRows?.length ? <div className="xp-form-surface__option-rows">{section.optionRows.map((row) => <div key={row.id}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div> : null}
    {section.help ? <aside className="xp-form-surface__help"><h3>{section.help.title}</h3>{section.help.description ? <p>{section.help.description}</p> : null}{section.help.reasons?.length ? <ul>{section.help.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}{section.help.link ? <a href={section.help.link.href}>{section.help.link.label}</a> : null}</aside> : null}
  </div>;
}

function SectionNavigation({ sections, active, setActive, kind }: { sections: FormSectionModel[]; active: number; setActive: (index: number) => void; kind: "tabs" | "steps" | "sections" }) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!(["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"] as string[]).includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = (index + direction + sections.length) % sections.length;
    setActive(next);
    const owner = event.currentTarget.parentElement;
    requestAnimationFrame(() => (owner?.querySelectorAll<HTMLButtonElement>("button")[next])?.focus());
  };
  return <nav className="xp-form-surface__section-nav" data-nav-kind={kind} aria-label={kind === "tabs" ? "Profile sections" : "Form sections"} role={kind === "tabs" ? "tablist" : undefined}>{sections.map((section, index) => <button key={section.id} type="button" role={kind === "tabs" ? "tab" : undefined} aria-selected={kind === "tabs" ? active === index : undefined} aria-current={kind !== "tabs" && active === index ? "step" : undefined} tabIndex={kind === "tabs" ? (active === index ? 0 : -1) : undefined} onKeyDown={(event) => onKeyDown(event, index)} onClick={() => setActive(index)} data-active={active === index || undefined}><span>{section.number ?? index + 1}</span><strong>{section.title}</strong>{section.summary?.[0] ? <small>{section.summary[0].value}</small> : null}</button>)}</nav>;
}

function FormActions({ actions, activeSection }: { actions: FormActionModel[]; activeSection: string }) {
  const visible = actions.filter((action) => !action.stage || action.stage === activeSection);
  if (!visible.length) return null;
  return <div className="xp-form-surface__actions" data-sticky-owner>{visible.map((action) => <button key={action.id} type="submit" data-action-id={action.id} data-kind={action.kind}>{action.label}</button>)}</div>;
}

function WizardFormSurfaceWithDefinition<Id extends string>({ model, definition }: { model: FormSurfaceFixture; definition: WizardDefinition<Id> }) {
  const deviceClass = useDeviceClass();
  const steps = useMemo(() => model.sections.map<WizardStepMeta<Id>>((section, index) => ({
    id: section.id as Id,
    label: section.title,
    shortLabel: section.title,
    description: section.description,
    progress: index === model.sections.length - 1 ? "hidden" : "visible",
    terminal: index === model.sections.length - 1,
    actions: model.actions.filter(({ stage }) => stage === section.id).map((action) => ({
      id: action.id,
      label: action.label,
      behavior: formSurfaceWizardActionBehavior(action, index, model.sections.length),
      emphasis: action.kind === "primary" ? "primary" : action.kind === "secondary" ? "secondary" : "quiet",
    })),
  })), [model.actions, model.sections]);

  return <SectionedForm className="xp-form-surface xp-form-surface--wizard-adapter" data-xp-form-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} aria-labelledby={`${model.sourceKey}-title`} onSubmit={(event) => event.preventDefault()}>
    <header className="xp-form-surface__header"><div><p className="xp-form-surface__context">Form workspace</p><h1 id={`${model.sourceKey}-title`}>{model.title}</h1>{model.description ? <p>{model.description}</p> : null}</div></header>
    <WizardShell
      definition={definition}
      steps={steps}
      copy={legacyWizardCopy}
      initialStepId={model.sections[0].id as Id}
      history="none"
      renderStep={(step, state) => {
        const section = model.sections.find(({ id }) => id === step.id);
        if (!section) throw new Error(`${model.sourceKey} cannot resolve wizard step ${step.id}.`);
        const context = section.summary?.length ? <div className="xp-form-surface__summary" aria-label={`${section.title} summary`}><h2>{section.title} summary</h2>{section.summary.map((row) => <div key={row.id}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div> : undefined;
        return <StepPane headingId={`${model.sourceKey}-${section.id}-title`} title={section.title} lede={section.description} context={context} busy={state.processing} data-section-id={section.id}>
          <SectionBody section={{ ...section, description: undefined }} sourceKey={model.sourceKey}/>
        </StepPane>;
      }}
    />
  </SectionedForm>;
}

function WizardFormSurface({ model }: { model: FormSurfaceFixture }) {
  return model.preset === "product-wizard"
    ? <WizardFormSurfaceWithDefinition model={model} definition={productWizardDefinition}/>
    : <WizardFormSurfaceWithDefinition model={model} definition={accountWizardDefinition}/>;
}

function StandardFormSurface({ model }: { model: FormSurfaceFixture }) {
  const deviceClass = useDeviceClass();
  const [active, setActive] = useState(() => Math.max(0, model.sections.findIndex((section) => section.disclosure?.defaultOpen)));
  const workspaceRef = useRef<HTMLDivElement>(null);
  const navigationKind = model.preset === "tabbed-profile" ? "tabs" : model.preset === "checkout-sections" ? "steps" : "sections";
  const activeSection = model.sections[active] ?? model.sections[0];
  const navigationSections = model.sections;
  const sections = useMemo(() => isSectionOwner(model.preset) ? [activeSection] : model.sections, [activeSection, model.preset, model.sections]);
  useEffect(() => {
    if (workspaceRef.current) workspaceRef.current.scrollTop = 0;
  }, [active]);
  return <SectionedForm className="xp-form-surface" data-xp-form-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} aria-labelledby={`${model.sourceKey}-title`} onSubmit={(event) => event.preventDefault()}>
    <header className="xp-form-surface__header"><div><p className="xp-form-surface__context">Form workspace</p><h1 id={`${model.sourceKey}-title`}>{model.title}</h1>{model.description ? <p>{model.description}</p> : null}</div><span className="xp-form-surface__progress">{active + 1}<small>/{model.sections.length}</small></span></header>
    <div ref={workspaceRef} className="xp-form-surface__workspace">
      {isSectionOwner(model.preset) ? <SectionNavigation sections={navigationSections} active={active} setActive={setActive} kind={navigationKind}/> : null}
      <main className="xp-form-surface__pane" tabIndex={-1}>
        {sections.map((section) => <section key={section.id} className="xp-form-surface__section" data-section-id={section.id} role={navigationKind === "tabs" ? "tabpanel" : undefined} aria-labelledby={`${model.sourceKey}-${section.id}-title`}><header><span aria-hidden="true">{section.number ?? active + 1}</span><div><h2 id={`${model.sourceKey}-${section.id}-title`}>{section.title}</h2>{section.description ? <p>{section.description}</p> : null}</div></header><SectionBody section={{ ...section, description: undefined }} sourceKey={model.sourceKey}/></section>)}
      </main>
      {activeSection.summary?.length ? <aside className="xp-form-surface__summary" aria-label={`${activeSection.title} summary`}><h2>Current selection</h2>{activeSection.summary.map((row) => <div key={row.id}><span>{row.label}</span><strong>{row.value}</strong></div>)}</aside> : null}
    </div>
    <FormActions actions={model.actions} activeSection={activeSection.id}/>
  </SectionedForm>;
}

export function FormSurface({ model }: { model: FormSurfaceFixture }) {
  return isWizard(model.preset) ? <WizardFormSurface model={model}/> : <StandardFormSurface model={model}/>;
}
