"use client";

import { ChoiceSet, Field, FieldGroup, SectionedForm, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FormChoiceSetModel, FormFieldModel } from "./form-surface-model";
import type {
  MultiStepAction,
  MultiStepFormFixture,
  StepPaneBody,
  WizardDecoration,
  WizardStep,
} from "./multi-step-form-model";
import {
  StepPane,
  WizardShell,
  defineWizard,
  type WizardDefinition,
  type WizardShellCopy,
  type WizardStepMeta,
} from "./wizard-shell";

const registrationDefinition = defineWizard([
  { id: "s01-account" },
  { id: "s01-personal" },
  { id: "s01-subscription" },
  { id: "s01-complete" },
] as const);

const ruleDefinition = defineWizard([
  { id: "s02-trigger" },
  { id: "s02-parameters" },
  { id: "s02-delivery" },
  { id: "s02-verification" },
  { id: "s02-complete" },
] as const);

type ControlValue = string | number | boolean | string[];
type DirectSourceKey = "multi-step-form-01" | "multi-step-form-02";

export type MultiStepFormProperties = {
  model: MultiStepFormFixture;
  onAction?: (action: MultiStepAction, stepId: string) => boolean | void | Promise<boolean | void>;
};

export function supportsDirectMultiStepForm(sourceKey: MultiStepFormFixture["sourceKey"]): sourceKey is DirectSourceKey {
  return sourceKey === "multi-step-form-01" || sourceKey === "multi-step-form-02";
}

function controlsFromBody(body: StepPaneBody) {
  if (body.kind === "form") return { fields: body.fields, choiceSets: body.choiceSets ?? [] };
  if (body.kind === "choice-form") return { fields: body.fields, choiceSets: body.choiceSets };
  if (body.kind === "review") return { fields: [body.acknowledgement], choiceSets: [] };
  if (body.kind === "success") return { fields: [], choiceSets: [] };
  throw new Error(`MultiStepForm direct renderer cannot render checkout body ${body.kind}.`);
}

function initialValues(model: MultiStepFormFixture) {
  const values: Record<string, ControlValue> = {};
  for (const step of model.steps) {
    const { fields, choiceSets } = controlsFromBody(step.pane.body);
    for (const field of fields) {
      values[field.id] = field.value ?? (field.kind === "checkbox" || field.kind === "switch" ? false : "");
    }
    for (const set of choiceSets) {
      values[set.id] = set.value ?? (set.selection === "multi" ? [] : set.options[0]?.id ?? "");
    }
  }
  return values;
}

function autoCompleteFor(field: FormFieldModel) {
  if (field.kind === "email") return "email";
  if (field.kind === "tel") return "tel";
  if (field.kind === "password") return "new-password";
  if (field.id.includes("first-name")) return "given-name";
  if (field.id.includes("last-name")) return "family-name";
  if (field.id.includes("street")) return "street-address";
  if (field.id.includes("postal")) return "postal-code";
  if (field.id.includes("city")) return "address-level2";
  if (field.id.includes("region")) return "address-level1";
  if (field.id.includes("cardholder")) return "cc-name";
  if (field.id.includes("card-number")) return "cc-number";
  if (field.id.includes("expiration")) return "cc-exp";
  if (field.id.includes("security-code")) return "cc-csc";
  return "off";
}

function FieldControl({
  field,
  value,
  invalid,
  sourceKey,
  onChange,
}: {
  field: FormFieldModel;
  value: ControlValue;
  invalid: boolean;
  sourceKey: DirectSourceKey;
  onChange: (value: ControlValue) => void;
}) {
  const id = `${sourceKey}-${field.id}`;
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (field.kind === "checkbox" || field.kind === "switch") {
    return (
      <div className="xp-multi-step__boolean" data-field-id={field.id} data-field-span={field.span ?? "one"} data-invalid={invalid || undefined}>
        <label htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            role={field.kind === "switch" ? "switch" : undefined}
            checked={value === true}
            required={field.required}
            aria-invalid={invalid || undefined}
            aria-describedby={field.help || invalid ? `${id}-${invalid ? "error" : "help"}` : undefined}
            data-control-id={field.id}
            onChange={(event) => onChange(event.currentTarget.checked)}
          />
          <span aria-hidden="true"/>
          <strong>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</strong>
        </label>
        {field.help && !invalid ? <p id={`${id}-help`}>{field.help}</p> : null}
        {invalid && field.error ? <p id={`${id}-error`} role="alert">{field.error}</p> : null}
      </div>
    );
  }

  if (field.kind === "radio" && field.options?.length) {
    return (
      <fieldset className="xp-multi-step__native-choices" data-field-id={field.id} data-field-span={field.span ?? "one"}>
        <legend>{field.label}</legend>
        {field.options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={id}
              value={option.id}
              checked={value === option.id}
              required={field.required}
              data-control-id={field.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
        {invalid && field.error ? <p role="alert">{field.error}</p> : null}
      </fieldset>
    );
  }

  const stringValue = typeof value === "string" || typeof value === "number" ? value : "";
  return (
    <Field id={id} invalid={invalid} hasHelp={Boolean(field.help)} hasError={invalid && Boolean(field.error)} data-field-id={field.id} data-field-span={field.span ?? "one"}>
      <Field.Label>{field.label}{field.required ? <span aria-hidden="true"> *</span> : null}</Field.Label>
      <div className="xp-multi-step__input-seat">
        {field.kind === "textarea" ? (
          <Field.Textarea
            value={stringValue}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            data-control-id={field.id}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        ) : field.kind === "select" ? (
          <Field.Select
            autoComplete={autoCompleteFor(field)}
            value={stringValue}
            required={field.required}
            data-control-id={field.id}
            onChange={(event) => onChange(event.currentTarget.value)}
          >
            <option value="">{field.placeholder}</option>
            {field.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </Field.Select>
        ) : (
          <Field.Input
            type={field.kind === "password" ? (passwordVisible ? "text" : "password") : field.kind === "number" || field.kind === "date" || field.kind === "email" || field.kind === "tel" ? field.kind : "text"}
            inputMode={field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : field.kind === "number" ? "decimal" : "text"}
            enterKeyHint="next"
            autoComplete={autoCompleteFor(field)}
            value={stringValue}
            placeholder={field.placeholder}
            required={field.required}
            data-control-id={field.id}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        )}
        {field.visibilityToggleLabel ? (
          <button
            type="button"
            className="xp-multi-step__visibility"
            aria-label={field.visibilityToggleLabel}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <span aria-hidden="true">{passwordVisible ? "◉" : "◎"}</span>
          </button>
        ) : null}
      </div>
      {field.help ? <Field.Help>{field.help}</Field.Help> : null}
      {invalid && field.error ? <Field.Error>{field.error}</Field.Error> : null}
    </Field>
  );
}

function ChoiceGroup({ set, value, onChange }: { set: FormChoiceSetModel; value: ControlValue; onChange: (value: ControlValue) => void }) {
  if (set.selection === "single") {
    return (
      <div className="xp-multi-step__choice-group" data-presentation={set.presentation} data-choice-set={set.id} data-control-id={set.id}>
        <h3>{set.label}</h3>
        <ChoiceSet
          label={set.label}
          items={set.options.map((option) => ({
            value: option.id,
            label: option.label,
            description: option.description,
            meta: option.price ?? option.badge,
            details: option.details,
            disabled: option.disabled,
          }))}
          value={typeof value === "string" ? value : undefined}
          onChange={onChange}
        />
      </div>
    );
  }

  const selected = Array.isArray(value) ? value : [];
  return (
    <fieldset className="xp-multi-step__choice-group xp-multi-step__choice-group--multi" data-presentation={set.presentation} data-choice-set={set.id}>
      <legend>{set.label}</legend>
      <div>
        {set.options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label key={option.id} data-selected={checked || undefined} data-disabled={option.disabled || undefined}>
              <input
                type="checkbox"
                value={option.id}
                checked={checked}
                disabled={option.disabled}
                data-control-id={set.id}
                onChange={() => onChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
              />
              <span>
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
                {option.disabledReason ? <em>{option.disabledReason}</em> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Decoration({ decoration, deviceClass }: { decoration: WizardDecoration; deviceClass: DeviceClass }) {
  const presentation = decoration.presentation[deviceClass];
  const registrationSupport = decoration.assetKey === "wizard_registration_support";
  const ruleChoice = decoration.assetKey === "wizard_rule_choice";
  const ruleReview = decoration.assetKey === "wizard_rule_review";
  const decorationKind = registrationSupport
    ? "topographical-contours"
    : ruleChoice
      ? "weather-sensor-schematic"
      : ruleReview
        ? "routing-flow-diagram"
        : "asset-seat";
  return (
    <div
      className="xp-multi-step__decoration"
      data-media-asset-key={decoration.assetKey}
      data-presentation={presentation}
      data-decoration-kind={decorationKind}
      role={decoration.role === "supporting" ? "img" : undefined}
      aria-label={decoration.role === "supporting" ? decoration.alt : undefined}
      aria-hidden={decoration.role === "decorative" ? "true" : undefined}
    >
      {registrationSupport ? (
        <svg viewBox="0 0 360 240" aria-hidden="true" focusable="false" data-contour-map>
          <g data-contour-region="northwest">
            <path data-contour-line d="M-18 92C24 36 92 20 139 45c43 23 53 72 26 103-25 30-81 39-119 15C7 140-8 116-18 92Z"/>
            <path data-contour-line d="M4 94c31-42 80-53 113-35 31 17 39 51 19 74-19 23-59 29-87 12C23 129 12 111 4 94Z"/>
            <path data-contour-line d="M29 95c20-27 51-34 73-22 20 11 25 33 12 48-12 15-38 19-56 8-17-10-24-22-29-34Z"/>
          </g>
          <g data-contour-region="southeast">
            <path data-contour-line d="M178 258c-8-55 25-109 78-124 49-14 101 12 123 56 20 40 3 85-37 109-47 28-112 13-164-41Z"/>
            <path data-contour-line d="M207 247c-5-38 18-76 55-87 35-10 72 8 87 39 14 28 2 60-26 77-33 19-78 9-116-29Z"/>
            <path data-contour-line d="M237 236c-3-22 10-45 32-51 20-6 42 5 51 23 8 17 1 35-15 45-20 11-46 5-68-17Z"/>
          </g>
          <path data-contour-line data-contour-route d="M95 205c36-37 60-30 87-63 28-34 42-75 100-99"/>
          <circle data-contour-anchor cx="96" cy="204" r="5"/>
          <circle data-contour-anchor cx="282" cy="43" r="5"/>
        </svg>
      ) : ruleChoice ? (
        <svg viewBox="0 0 360 240" aria-hidden="true" focusable="false" data-system-illustration="weather-sensor-schematic">
          <path data-system-illustration-part="terrain-back" d="M-12 205c54-27 91-28 126-5 34 23 67 20 105-7 40-29 91-29 153 4"/>
          <path data-system-illustration-part="terrain-front" d="M-12 226c43-21 82-20 118 2 36 21 74 17 112-10 39-28 89-28 154-3"/>
          <path data-system-illustration-part="mast" d="M180 76v126M151 202h58M164 112h32"/>
          <circle data-system-illustration-part="sensor-hub" data-illustration-fill cx="180" cy="75" r="13"/>
          <path data-system-illustration-part="sensor-head" d="M168 76h24M180 63V48M170 48h20"/>
          <path data-system-illustration-part="signal-one" d="M154 78c0-15 12-27 26-27"/>
          <path data-system-illustration-part="signal-two" d="M142 78c0-22 17-39 38-39"/>
          <path data-system-illustration-part="signal-three" d="M130 78c0-28 22-51 50-51"/>
          <path data-system-illustration-part="wind-one" d="M34 77h72c15 0 15-22 1-22-8 0-13 5-13 11"/>
          <path data-system-illustration-part="wind-two" d="M48 103h79c17 0 17 25 1 25-9 0-15-6-15-13"/>
          <path data-system-illustration-part="telemetry" data-illustration-dash d="M198 113c47 1 81 24 105 66"/>
          <circle data-system-illustration-part="telemetry-node" data-illustration-fill cx="304" cy="180" r="7"/>
        </svg>
      ) : ruleReview ? (
        <svg viewBox="0 0 360 240" aria-hidden="true" focusable="false" data-system-illustration="routing-flow-diagram">
          <path data-system-illustration-part="route-input-a" d="M72 66h59c20 0 26 18 26 35v18"/>
          <path data-system-illustration-part="route-input-b" d="M72 174h59c20 0 26-18 26-35v-18"/>
          <path data-system-illustration-part="route-output-a" d="M202 120h38c18 0 25-14 25-30V67"/>
          <path data-system-illustration-part="route-output-b" d="M202 120h38c18 0 25 14 25 30v23"/>
          <rect data-system-illustration-part="node-input-a" data-illustration-node x="28" y="44" width="88" height="44" rx="10"/>
          <rect data-system-illustration-part="node-input-b" data-illustration-node x="28" y="152" width="88" height="44" rx="10"/>
          <path data-system-illustration-part="processor" data-illustration-fill d="M158 81h44l22 39-22 39h-44l-22-39 22-39Z"/>
          <rect data-system-illustration-part="node-output-a" data-illustration-node x="244" y="44" width="88" height="44" rx="10"/>
          <rect data-system-illustration-part="node-output-b" data-illustration-node x="244" y="152" width="88" height="44" rx="10"/>
          <circle data-system-illustration-part="input-a-status" data-illustration-solid cx="51" cy="66" r="6"/>
          <circle data-system-illustration-part="input-b-status" data-illustration-solid cx="51" cy="174" r="6"/>
          <path data-system-illustration-part="processor-mark" d="m164 120 12 12 24-28"/>
          <path data-system-illustration-part="output-a-mark" d="m277 66 8 8 16-17"/>
          <path data-system-illustration-part="output-b-mark" d="m277 174 8 8 16-17"/>
        </svg>
      ) : (
        <span aria-hidden="true" data-decoration-mark>{decoration.assetKey.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

function Body({
  body,
  legend,
  sourceKey,
  values,
  invalidIds,
  setValue,
}: {
  body: StepPaneBody;
  legend: string;
  sourceKey: DirectSourceKey;
  values: Record<string, ControlValue>;
  invalidIds: ReadonlySet<string>;
  setValue: (id: string, value: ControlValue) => void;
}) {
  if (body.kind === "success") {
    return (
      <section className="xp-multi-step__receipt" aria-labelledby={`${sourceKey}-receipt-title`} data-body-kind="success">
        <h3 id={`${sourceKey}-receipt-title`}>{body.receipt.title}</h3>
        <p>{body.receipt.description}</p>
        {body.receipt.referenceLabel && body.receipt.referenceValue ? <dl><div><dt>{body.receipt.referenceLabel}</dt><dd>{body.receipt.referenceValue}</dd></div></dl> : null}
        {body.receipt.acknowledgement ? <p>{body.receipt.acknowledgement}</p> : null}
      </section>
    );
  }

  if (body.kind === "review") {
    return (
      <div className="xp-multi-step__review" data-body-kind="review">
        <dl>{body.rows.map((row) => <div key={row.id}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
        <FieldControl field={body.acknowledgement} value={values[body.acknowledgement.id] ?? false} invalid={invalidIds.has(body.acknowledgement.id)} sourceKey={sourceKey} onChange={(value) => setValue(body.acknowledgement.id, value)}/>
      </div>
    );
  }

  if (body.kind !== "form" && body.kind !== "choice-form") {
    throw new Error(`MultiStepForm direct renderer cannot render checkout body ${body.kind}.`);
  }

  const choiceSets = body.kind === "choice-form" ? body.choiceSets : body.choiceSets ?? [];
  return (
    <div className="xp-multi-step__body" data-body-kind={body.kind}>
      {choiceSets.map((set) => <ChoiceGroup key={set.id} set={set} value={values[set.id] ?? (set.selection === "multi" ? [] : "")} onChange={(value) => setValue(set.id, value)}/>) }
      {body.fields.length ? (
        <FieldGroup className="xp-multi-step__fields">
          <legend className="xp-multi-step__visually-hidden">{legend}</legend>
          {body.fields.map((field) => <FieldControl key={field.id} field={field} value={values[field.id] ?? ""} invalid={invalidIds.has(field.id)} sourceKey={sourceKey} onChange={(value) => setValue(field.id, value)}/>) }
        </FieldGroup>
      ) : null}
    </div>
  );
}

function errorMessages(step: WizardStep, invalidIds: ReadonlySet<string>) {
  const { fields } = controlsFromBody(step.pane.body);
  return fields.filter(({ id, error }) => error && invalidIds.has(id)).map(({ id, error }) => <li key={id}>{error}</li>);
}

function shellCopy(model: MultiStepFormFixture): WizardShellCopy {
  return {
    progressLabel: model.copy.progressLabel,
    openStepListLabel: model.copy.openStepListLabel,
    closeStepListLabel: model.copy.closeStepListLabel,
    stepCount: `${model.copy.currentStepLabel}: {current}/{total}`,
    currentStepLabel: model.copy.currentStepLabel,
    completedStepLabel: model.copy.completedStepLabel,
    availableStepLabel: model.copy.availableStepLabel,
    lockedStepLabel: model.copy.lockedStepLabel,
    announcements: model.copy.announcements,
  };
}

function DirectMultiStepForm<Id extends string>({
  model,
  definition,
  onAction,
}: MultiStepFormProperties & { model: MultiStepFormFixture & { sourceKey: DirectSourceKey }; definition: WizardDefinition<Id> }) {
  const deviceClass = useDeviceClass();
  const [values, setValues] = useState(() => initialValues(model));
  const [dirty, setDirty] = useState(false);
  const [invalidIds, setInvalidIds] = useState<Set<string>>(() => new Set(model.state?.errorControlId ? [model.state.errorControlId] : []));
  const steps = useMemo(() => model.steps.map<WizardStepMeta<Id>>((step) => ({
    id: step.id as Id,
    label: step.label,
    shortLabel: step.shortLabel,
    description: step.description,
    progress: step.progress,
    terminal: step.terminal,
    actions: step.pane.actions,
  })), [model.steps]);
  useEffect(() => {
    if (!model.navigation.confirmExitWhenDirty || !dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, model.navigation.confirmExitWhenDirty]);

  const setValue = useCallback((id: string, value: ControlValue) => {
    setValues((current) => ({ ...current, [id]: value }));
    setInvalidIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setDirty(true);
  }, []);

  const validateStep = useCallback((_stepId: Id, pane: HTMLElement | null) => {
    const controls = [...(pane?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input[data-control-id],select[data-control-id],textarea[data-control-id]") ?? [])];
    const invalid = controls.filter((control) => !control.checkValidity()).map((control) => control.dataset.controlId).filter((id): id is string => Boolean(id));
    setInvalidIds(new Set(invalid));
    return invalid.length === 0;
  }, []);

  const runAction = useCallback(async (action: MultiStepAction, stepId: Id) => {
    const accepted = await onAction?.(action, stepId);
    if (accepted === false) return false;
    if (action.behavior === "reset") {
      setValues(initialValues(model));
      setInvalidIds(new Set());
      setDirty(false);
    }
    if (action.behavior === "submit") setDirty(false);
    return accepted;
  }, [model, onAction]);

  return (
    <SectionedForm
      className="xp-multi-step"
      data-xp-block="multi-step-form"
      data-source-key={model.sourceKey}
      data-preset={model.preset}
      data-device-class={deviceClass}
      aria-labelledby={`${model.sourceKey}-title`}
      onSubmit={(event) => event.preventDefault()}
    >
      <header className="xp-multi-step__header">
        <div><h1 id={`${model.sourceKey}-title`}>{model.copy.title}</h1>{model.copy.description ? <p>{model.copy.description}</p> : null}</div>
        {model.state?.processing ? <p role="status">{model.copy.processingLabel}</p> : null}
      </header>
      <WizardShell
        definition={definition}
        steps={steps}
        copy={shellCopy(model)}
        initialStepId={(model.state?.currentStepId ?? model.navigation.initialStepId) as Id}
        initialVisitedStepIds={model.navigation.initialVisitedStepIds as Id[]}
        validateStep={validateStep}
        onAction={runAction}
        history={model.navigation.history}
        historyKey={`${model.sourceKey}-step`}
        processing={model.state?.processing}
        renderStep={(step, state) => {
          const sourceStep = model.steps.find(({ id }) => id === step.id);
          if (!sourceStep) throw new Error(`${model.sourceKey} cannot resolve step ${step.id}.`);
          const visibleInvalidIds = new Set(invalidIds);
          const errors = errorMessages(sourceStep, visibleInvalidIds);
          const decoration = sourceStep.pane.decoration;
          const context = decoration && deviceClass === "DW" ? <Decoration decoration={decoration} deviceClass={deviceClass}/> : undefined;
          return (
            <StepPane
              headingId={`${model.sourceKey}-${sourceStep.pane.id}-title`}
              title={sourceStep.pane.title}
              lede={sourceStep.pane.lede}
              validationSummary={errors.length ? <div><strong>{model.copy.validationSummaryTitle}</strong><ul>{errors}</ul></div> : undefined}
              context={context}
              busy={state.processing}
              data-step-id={sourceStep.id}
              data-body-kind={sourceStep.pane.body.kind}
            >
              {decoration && deviceClass !== "DW" ? <Decoration decoration={decoration} deviceClass={deviceClass}/> : null}
              <Body body={sourceStep.pane.body} legend={sourceStep.pane.title} sourceKey={model.sourceKey} values={values} invalidIds={visibleInvalidIds} setValue={setValue}/>
            </StepPane>
          );
        }}
      />
    </SectionedForm>
  );
}

export function MultiStepForm({ model, onAction }: MultiStepFormProperties) {
  if (!supportsDirectMultiStepForm(model.sourceKey) || model.owner !== "WizardShell") {
    throw new Error(`${model.sourceKey} belongs to CheckoutFlow and cannot use the direct MultiStepForm renderer.`);
  }
  const directModel = model as MultiStepFormFixture & { sourceKey: DirectSourceKey };
  return directModel.sourceKey === "multi-step-form-01"
    ? <DirectMultiStepForm model={directModel} definition={registrationDefinition} onAction={onAction}/>
    : <DirectMultiStepForm model={directModel} definition={ruleDefinition} onAction={onAction}/>;
}
