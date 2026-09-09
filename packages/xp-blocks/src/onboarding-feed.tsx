"use client";

import { AdaptiveOverlay, FieldGroup, SegmentedControl, StickyActionBar, useDeviceClass } from "@xp/primitives";
import { useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { UploadUnit } from "./upload-unit";
import type { ResolvedUpload, UploadFileRecord, UploadMediaMap } from "./upload-model";
import {
  resolveOnboardingFeedFixture,
  type GuidedItem,
  type GuidedTask,
  type OnboardingControl,
  type OnboardingCopyMode,
  type OnboardingFeedFixture,
  type OnboardingMediaMap,
  type ResolvedOnboardingFixture,
  type ResolvedOnboardingMedia,
  type SetupChecklistPreset,
} from "./onboarding-feed-model";
import { StepPane, WizardShell, defineWizard, type WizardAction, type WizardShellCopy, type WizardStepMeta } from "./wizard-shell";

const emptyUploadMedia: UploadMediaMap = { schemaVersion: "1.0", records: [] };
export type OnboardingGateState = "error" | "pending" | "success" | "notification-error" | "notification-pending" | "notification-subscribed";

function template(value: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce((result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)), value);
}

function text(model: ResolvedOnboardingFixture, key?: string) {
  return key ? model.strings[key] ?? key : "";
}

function stateMessage(model: ResolvedOnboardingFixture, state?: OnboardingGateState) {
  if (!state) return "";
  const stateKey = state === "pending" ? model.stateKeys.pendingKey ?? model.stateKeys.notificationPendingKey ?? model.stateKeys.runningAnnouncementKey
    : state === "success" ? model.stateKeys.successKey ?? model.stateKeys.notificationSubscribedKey ?? model.statusItems?.find(({ state: itemState }) => itemState === "complete")?.bodyKey
      : model.stateKeys.recoverableErrorKey ?? model.stateKeys.notificationErrorKey ?? model.statusItems?.find(({ state: itemState }) => itemState === "pending")?.bodyKey;
  return text(model, stateKey);
}

function GateStateSurface({ model, state }: { model: ResolvedOnboardingFixture; state?: OnboardingGateState }) {
  if (!state || state === "notification-pending" || state === "notification-subscribed") return null;
  const normalized = state === "notification-error" ? "error" : state;
  return <div className="xp-onboarding__gate-state" data-state={normalized} role={normalized === "error" ? "alert" : "status"}><strong>{normalized}</strong><span>{stateMessage(model, state)}</span></div>;
}

function Portraits({ media, model }: { media: ResolvedOnboardingMedia[]; model: ResolvedOnboardingFixture }) {
  return (
    <ul className="xp-onboarding__people" aria-label={text(model, model.titleKey)}>
      {media.map((person) => (
        <li key={person.id}>
          <picture>
            <source srcSet={person.src.replace(/\.webp$/, ".avif")} type="image/avif" />
            <source srcSet={person.src} type="image/webp" />
            <img src={person.src.replace(/\.webp$/, ".jpg")} alt={text(model, person.altKey)} />
          </picture>
          <span><strong>{person.ownerName}</strong></span>
        </li>
      ))}
    </ul>
  );
}

function NativeControl({ control, model, value, onValueChange }: { control: OnboardingControl; model: ResolvedOnboardingFixture; value?: string | boolean; onValueChange?: (value: string | boolean) => void }) {
  const label = text(model, control.labelKey);
  const validationMessage = text(model, "state_field_validation");
  if (control.type === "checkbox" || control.type === "switch") {
    return (
      <label className="xp-onboarding__check" data-onboarding-control={control.id}>
        <input type="checkbox" name={control.id} checked={typeof value === "boolean" ? value : undefined} onChange={onValueChange ? (event) => onValueChange(event.currentTarget.checked) : undefined} />
        <span>{label}</span>
      </label>
    );
  }
  if (control.type === "select") {
    return (
      <label className="xp-onboarding__field" data-onboarding-control={control.id}>
        <span>{label}</span>
        <select name={control.id} required={control.required} value={typeof value === "string" ? value : undefined} defaultValue={onValueChange ? undefined : ""} onInvalid={(event) => event.currentTarget.setCustomValidity(validationMessage)} onInput={(event) => event.currentTarget.setCustomValidity("")} onChange={onValueChange ? (event) => onValueChange(event.currentTarget.value) : undefined} autoComplete="off">
          <option value="" disabled>{label}</option>
          {control.options?.map((option) => <option value={option.id} key={option.id}>{text(model, option.labelKey)}</option>)}
        </select>
      </label>
    );
  }
  if (control.type === "textarea") {
    return (
      <label className="xp-onboarding__field" data-onboarding-control={control.id}>
        <span>{label}</span>
        <textarea name={control.id} required={control.required} placeholder={text(model, control.placeholderKey)} rows={3} value={typeof value === "string" ? value : undefined} onInvalid={(event) => event.currentTarget.setCustomValidity(validationMessage)} onInput={(event) => event.currentTarget.setCustomValidity("")} onChange={onValueChange ? (event) => onValueChange(event.currentTarget.value) : undefined} autoComplete="off" enterKeyHint="next" />
      </label>
    );
  }
  return (
    <label className="xp-onboarding__field" data-onboarding-control={control.id}>
      <span>{label}</span>
      <input
        type={control.type}
        name={control.id}
        required={control.required}
        placeholder={text(model, control.placeholderKey)}
        value={typeof value === "string" ? value : undefined}
        onChange={onValueChange ? (event) => onValueChange(event.currentTarget.value) : undefined}
        onInvalid={(event) => event.currentTarget.setCustomValidity(validationMessage)}
        onInput={(event) => event.currentTarget.setCustomValidity("")}
        inputMode={control.type === "email" ? "email" : control.type === "tel" ? "tel" : control.type === "number" ? "numeric" : "text"}
        autoComplete={control.type === "email" ? "email" : control.type === "tel" ? "tel" : control.id === "fullName" ? "name" : "off"}
        enterKeyHint="next"
      />
    </label>
  );
}

function AvatarUpload({ control, model, files, outcome, onFilesChange }: { control: OnboardingControl; model: ResolvedOnboardingFixture; files: UploadFileRecord[]; outcome: "empty" | "accepted" | "removed"; onFilesChange: (files: UploadFileRecord[]) => void }) {
  const owner = useRef<HTMLDivElement>(null);
  const upload = control.upload;
  if (!upload) return null;
  const uploadModel: ResolvedUpload = {
    schemaVersion: 1,
    owner: "UploadUnit",
    sourceKey: "onboarding-feed-02-avatar",
    preset: "avatar",
    heading: text(model, control.labelKey),
    description: text(model, control.helpKey),
    accept: upload.accept,
    multiple: false,
    maxFiles: 1,
    maxBytes: upload.maxBytes,
    files,
    uploadCopy: {
      pointerAction: text(model, upload.chooseKey),
      touchAction: text(model, upload.chooseKey),
      constraints: text(model, control.helpKey),
      validation: { count: text(model, upload.sizeErrorKey), type: text(model, upload.typeErrorKey), size: text(model, upload.sizeErrorKey), duplicate: text(model, upload.typeErrorKey), source: text(model, upload.typeErrorKey) },
      announcements: { progress: text(model, "state_pending"), success: text(model, "state_success"), error: text(model, "state_recoverable_error") },
    },
    actions: { choose: text(model, upload.chooseKey), remove: text(model, upload.removeKey) },
    stress: { short: {}, longLocale: {}, missingOptional: {}, empty: text(model, upload.previewKey), pending: text(model, "state_pending"), error: text(model, "state_recoverable_error"), success: text(model, "state_success") },
  };
  return <div ref={owner} data-onboarding-control={control.id} data-upload-outcome={outcome}><div className="xp-onboarding-profile__upload-state" role="status" aria-live="polite"><span aria-hidden="true" /><strong>{text(model, outcome === "accepted" ? "state_success" : upload.previewKey)}</strong></div><UploadUnit model={uploadModel} mediaMap={emptyUploadMedia} files={files} onFilesChange={onFilesChange} onFileRemoved={() => requestAnimationFrame(() => requestAnimationFrame(() => owner.current?.scrollIntoView({ block: "start", behavior: "instant" })))} /></div>;
}

function wizardCopy(model: ResolvedOnboardingFixture): WizardShellCopy {
  return {
    progressLabel: text(model, "a11y_current_step"),
    openStepListLabel: text(model, "a11y_current_step"),
    closeStepListLabel: text(model, "action_back"),
    stepCount: "{current} / {total}",
    currentStepLabel: text(model, "a11y_current_step"),
    completedStepLabel: text(model, "state_success"),
    availableStepLabel: text(model, "state_step_change"),
    lockedStepLabel: text(model, "state_pending"),
    announcements: {
      stepChanged: "{step}. " + text(model, "state_step_change"),
      validationFailed: text(model, "state_field_validation"),
      submitted: text(model, "state_success"),
      reset: text(model, "state_step_change"),
      processing: text(model, "state_pending"),
      failed: text(model, "state_recoverable_error"),
    },
  };
}

function mapWizardAction(action: { id: string; kind: string; labelKey: string }, model: ResolvedOnboardingFixture): WizardAction {
  return {
    id: action.id,
    label: text(model, action.labelKey),
    behavior: action.kind === "back" ? "previous" : action.kind === "complete" ? "submit" : "next",
    emphasis: action.kind === "back" ? "secondary" : "primary",
  };
}

export function OnboardingProfileAdapter({ fixture, mediaMap, copyMode = "base", gateState }: { fixture: OnboardingFeedFixture; mediaMap: OnboardingMediaMap; copyMode?: OnboardingCopyMode; gateState?: OnboardingGateState }) {
  const model = useMemo(() => resolveOnboardingFeedFixture(fixture, mediaMap, copyMode), [copyMode, fixture, mediaMap]);
  if (model.sourceKey !== "onboarding-feed-02" || !model.steps) throw new Error("OnboardingProfileAdapter accepts onboarding-feed-02 only.");
  const deviceClass = useDeviceClass();
  const compact = deviceClass === "M" || deviceClass === "TP";
  const [chunkByStep, setChunkByStep] = useState<Record<string, number>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [uploadFiles, setUploadFiles] = useState<UploadFileRecord[]>([]);
  const [uploadOutcome, setUploadOutcome] = useState<"empty" | "accepted" | "removed">("empty");
  const definition = useMemo(() => defineWizard(model.steps!.map(({ id }) => ({ id })) as readonly { id: string }[]), [model.steps]);
  const steps = useMemo<WizardStepMeta[]>(() => model.steps!.map((step, index) => {
    const chunkIndex = Math.min(chunkByStep[step.id] ?? 0, Math.max(0, step.mobileChunks.length - 1));
    const actions = step.actions.map((action) => mapWizardAction(action, model));
    if (compact && chunkIndex > 0 && !actions.some(({ behavior }) => behavior === "previous")) {
      actions.unshift({
        id: `chunk-back-${step.id}`,
        label: text(model, "action_back"),
        behavior: "previous",
        emphasis: "secondary",
      });
    }
    return {
      id: step.id,
      label: text(model, step.titleKey),
      shortLabel: String(index + 1).padStart(2, "0"),
      subprogress: compact && step.mobileChunks.length > 1 ? `${chunkIndex + 1}/${step.mobileChunks.length}` : undefined,
      description: text(model, step.descriptionKey),
      terminal: index === model.steps!.length - 1,
      actions,
    };
  }), [chunkByStep, compact, model]);
  const portrait = model.resolvedMedia.find(({ ownerName }) => ownerName === "Beatriz Costa");
  const renderStep = (stepMeta: WizardStepMeta) => {
    const sourceStep = model.steps!.find(({ id }) => id === stepMeta.id)!;
    const chunks = sourceStep.mobileChunks;
    const chunkIndex = Math.min(chunkByStep[sourceStep.id] ?? 0, Math.max(0, chunks.length - 1));
    const activeIds = compact && chunks.length ? new Set(chunks[chunkIndex].controlIds) : null;
    const controls = activeIds ? sourceStep.controls.filter(({ id }) => activeIds.has(id)) : sourceStep.controls;
    const sourceIndex = model.steps!.findIndex(({ id }) => id === sourceStep.id);
    const postTarget = model.steps![Math.min(sourceIndex + 1, model.steps!.length - 1)]!.id;
    return (
      <StepPane
        headingId={`onboarding-step-${sourceStep.id}`}
        title={text(model, sourceStep.titleKey)}
        lede={text(model, sourceStep.descriptionKey)}
        contextPlacement="before-controls"
        context={portrait ? <div className="xp-onboarding-profile__context"><Portraits media={[portrait]} model={model} /><span>{text(model, "state_completion")}</span></div> : undefined}
      >
        <form className="xp-onboarding-profile__form" action={`/demo-submit/onboarding-feed?target=${postTarget}`} method="post">
          <FieldGroup>
            <legend>{text(model, sourceStep.titleKey)}</legend>
            {controls.map((control) => control.type === "image-upload"
              ? <AvatarUpload key={control.id} control={control} model={model} files={uploadFiles} outcome={uploadOutcome} onFilesChange={(nextFiles) => { setUploadOutcome(nextFiles.length ? "accepted" : uploadFiles.length ? "removed" : "empty"); setUploadFiles(nextFiles); }} />
              : <NativeControl key={control.id} control={control} model={model} value={fieldValues[control.id] ?? (control.type === "checkbox" || control.type === "switch" ? false : "")} onValueChange={(value) => setFieldValues((current) => ({ ...current, [control.id]: value }))} />)}
          </FieldGroup>
          {sourceStep.id === "complete" ? <div className="xp-onboarding-profile__completion" data-completion-proof="live"><span aria-hidden="true">✓</span><strong>{text(model, "state_completion")}</strong><progress max="5" value="5" /></div> : null}
          <noscript><button type="submit">{text(model, sourceStep.actions.at(-1)?.labelKey)}</button></noscript>
        </form>
      </StepPane>
    );
  };
  return (
    <section className="xp-onboarding-profile" data-source-key={model.sourceKey} data-copy-mode={copyMode} data-control-total="41" data-state-owner="WizardShell" data-gate-state={gateState}>
      <GateStateSurface model={model} state={gateState} />
      <WizardShell
        definition={definition}
        steps={steps}
        copy={wizardCopy(model)}
        renderStep={renderStep}
        onBeforeAction={(action, stepId) => {
          if (!compact) return;
          const sourceStep = model.steps!.find(({ id }) => id === stepId);
          if (!sourceStep || sourceStep.mobileChunks.length < 2) return;
          const chunkIndex = Math.min(chunkByStep[sourceStep.id] ?? 0, sourceStep.mobileChunks.length - 1);
          if (action.behavior === "previous" && chunkIndex > 0) {
            setChunkByStep((value) => ({ ...value, [sourceStep.id]: chunkIndex - 1 }));
            return false;
          }
          if (action.behavior === "next" && chunkIndex < sourceStep.mobileChunks.length - 1) {
            setChunkByStep((value) => ({ ...value, [sourceStep.id]: chunkIndex + 1 }));
            return false;
          }
        }}
        preset="onboarding-profile"
        navigationPolicy="direct"
        getStepHref={(stepId) => `/demo/onboarding-feed-02/${stepId}`}
        getActionHref={(action, stepId) => {
          const index = model.steps!.findIndex(({ id }) => id === stepId);
          const target = action.behavior === "previous" ? model.steps![Math.max(0, index - 1)] : action.behavior === "next" ? model.steps![Math.min(model.steps!.length - 1, index + 1)] : model.steps![index];
          return `/demo/onboarding-feed-02/${target.id}`;
        }}
        history="url"
        historyKey="onboarding-step"
      />
    </section>
  );
}

function taskControls(task: GuidedTask) {
  return task.fields ?? task.controls ?? [];
}

function TaskOverlay({ item, model, open, onOpenChange, onComplete }: { item: GuidedItem; model: ResolvedOnboardingFixture; open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void }) {
  const task = item.task;
  if (!task) return null;
  const taskMedia = model.resolvedMedia.filter((person) => task.peopleMediaIds?.includes(person.id));
  const submit = (event: FormEvent) => { event.preventDefault(); onComplete(); onOpenChange(false); };
  return (
    <AdaptiveOverlay intent="edit" open={open} onOpenChange={onOpenChange}>
      <AdaptiveOverlay.Content data-task-kind={task.kind} data-control-count={taskControls(task).length}>
        <AdaptiveOverlay.Header title={text(model, item.titleKey)} description={text(model, item.bodyKey)} closeLabel={text(model, "footer.cancel")} />
        <AdaptiveOverlay.Body>
          <form id={`onboarding-task-${item.id}`} className="xp-onboarding__overlay-form" onSubmit={submit}>
            <FieldGroup>
              <legend>{text(model, item.titleKey)}</legend>
              {taskControls(task).map((control) => <NativeControl key={control.id} control={control} model={model} />)}
            </FieldGroup>
            {taskMedia.length ? <><Portraits media={taskMedia} model={model} /><p>{text(model, "task.terms.invitations.value")}</p></> : null}
            {task.facts?.length ? <dl className="xp-onboarding__facts">{task.facts.map((fact) => <div key={fact.id}><dt>{text(model, fact.labelKey)}</dt><dd>{text(model, fact.valueKey)}</dd></div>)}</dl> : null}
            {task.policyRoutes?.length ? <nav className="xp-onboarding__policy-links">{task.policyRoutes.map((route) => <a href={route.href} key={route.id}>{text(model, route.labelKey)}</a>)}</nav> : null}
            {task.alternateIdentityAction ? <a href={task.alternateIdentityAction.href}>{text(model, task.alternateIdentityAction.labelKey)}</a> : null}
            {task.fullTermsRoute ? <a href={task.fullTermsRoute.href}>{text(model, task.fullTermsRoute.labelKey)}</a> : null}
          </form>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer>
          {task.cancelAction ? <AdaptiveOverlay.Close>{text(model, task.cancelAction.labelKey)}</AdaptiveOverlay.Close> : null}
          <button type="submit" form={`onboarding-task-${item.id}`}>{text(model, task.primaryAction.labelKey)}</button>
        </AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function StatusTimeline({ model }: { model: ResolvedOnboardingFixture }) {
  return (
    <ol className="xp-onboarding__timeline" aria-label={text(model, model.stateKeys.timelineSummaryKey)}>
      {model.statusItems?.map((item) => (
        <li key={item.id} data-state={item.state}>
          <span className="xp-onboarding__status-mark" aria-hidden="true" />
          <div><strong>{text(model, item.titleKey)}</strong><p>{text(model, item.bodyKey)}</p><time>{text(model, item.timeKey)}</time></div>
        </li>
      ))}
    </ol>
  );
}

export function SetupChecklist({ fixture, mediaMap, copyMode = "base", gateState }: { fixture: OnboardingFeedFixture; mediaMap: OnboardingMediaMap; copyMode?: OnboardingCopyMode; gateState?: OnboardingGateState }) {
  const model = useMemo(() => resolveOnboardingFeedFixture(fixture, mediaMap, copyMode), [copyMode, fixture, mediaMap]);
  if (model.owner !== "SetupChecklist") throw new Error("SetupChecklist accepts SetupChecklist fixtures only.");
  const deviceClass = useDeviceClass();
  const compact = deviceClass === "M" || deviceClass === "TP";
  const [openItem, setOpenItem] = useState(model.guidedItems?.[0]?.id ?? "");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [overlayItem, setOverlayItem] = useState<string | null>(null);
  const overlayInvoker = useRef<HTMLAnchorElement | null>(null);
  const [view, setView] = useState(model.views?.[0]?.id ?? "updates");
  const [notification, setNotification] = useState<"idle" | "pending" | "success" | "error">(gateState === "notification-error" ? "error" : gateState === "notification-pending" ? "pending" : gateState === "notification-subscribed" ? "success" : "idle");
  const guidedItems = model.guidedItems ?? [];
  const availableIndex = Math.min(completed.size, Math.max(0, guidedItems.length - 1));
  const activate = (event: MouseEvent<HTMLAnchorElement>, item: GuidedItem) => {
    event.preventDefault();
    if (guidedItems.indexOf(item) > availableIndex) return;
    overlayInvoker.current = event.currentTarget;
    setOpenItem(item.id);
    if (item.task) setOverlayItem(item.id);
    else {
      setCompleted((current) => new Set([...current, item.id]));
      const next = guidedItems[guidedItems.indexOf(item) + 1];
      if (next) setOpenItem(next.id);
    }
  };
  const footer = model.footerActions ?? [];
  const primary = footer.at(-1);
  const secondary = footer.slice(0, -1);
  const relocatedItem = compact && guidedItems.length ? guidedItems.find(({ id }) => id === openItem && !completed.has(id)) : undefined;
  const footerLink = (action: typeof footer[number]) => (
    <a
      href={action.href}
      key={action.id}
      data-intent={action === primary ? "primary" : "secondary"}
      onClick={action.kind === "subscribe" ? (event) => {
        event.preventDefault();
        setNotification("pending");
        window.setTimeout(() => setNotification("success"), 450);
      } : undefined}
    >{text(model, action.labelKey)}</a>
  );
  const guided = guidedItems.length ? (
    <ol className="xp-onboarding__guided">
      {guidedItems.map((item, index) => {
        const isComplete = completed.has(item.id);
        const isAvailable = index <= availableIndex;
        const isOpen = openItem === item.id;
        return (
          <li key={item.id} data-state={isComplete ? "complete" : isAvailable ? "available" : "locked"} data-open={isOpen || undefined}>
            <button type="button" aria-expanded={isOpen} disabled={!isAvailable} onClick={() => setOpenItem(isOpen ? "" : item.id)}>
              <span aria-hidden="true">{isComplete ? "✓" : index + 1}</span><strong>{text(model, item.titleKey)}</strong>
            </button>
            {isOpen ? <div className="xp-onboarding__guided-body"><p>{text(model, item.bodyKey)}</p>{relocatedItem?.id === item.id ? null : <a href={item.action.href} onClick={(event) => activate(event, item)}>{text(model, item.action.labelKey)}</a>}</div> : null}
            {item.task ? <TaskOverlay item={item} model={model} open={overlayItem === item.id} onOpenChange={(open) => { setOverlayItem(open ? item.id : null); if (!open) requestAnimationFrame(() => requestAnimationFrame(() => overlayInvoker.current?.focus())); }} onComplete={() => { setCompleted((current) => new Set([...current, item.id])); const next = guidedItems[index + 1]; if (next) setOpenItem(next.id); }} /> : null}
          </li>
        );
      })}
    </ol>
  ) : null;
  const showDetails = model.preset === "status-tabs" && view === "details";
  const ownsBottomAction = Boolean(primary) && !showDetails;
  const accessId = `${model.sourceKey}-access`;
  const notificationCopy = model.preset === "status-tabs" ? text(model, model.stateKeys[notification === "success" ? "notificationSubscribedKey" : notification === "pending" ? "notificationPendingKey" : notification === "error" ? "notificationErrorKey" : "notificationIdleKey"]) : "";
  return (
    <section className="xp-setup-checklist" data-xp-owner="SetupChecklist" data-state-owner="SetupChecklist" data-source-key={model.sourceKey} data-preset={model.preset as SetupChecklistPreset} data-device-class={deviceClass} data-copy-mode={copyMode} data-gate-state={gateState} data-notification-state={model.preset === "status-tabs" ? notification : undefined}>
      <GateStateSurface model={model} state={gateState} />
      <header className="xp-onboarding__header"><span>{model.sourceKey.replace("onboarding-feed-", "OF-")}</span><h1>{text(model, model.titleKey)}</h1><p>{text(model, model.descriptionKey)}</p></header>
      {model.views ? <SegmentedControl label={text(model, model.titleKey)} items={model.views.map((item) => ({ value: item.id, label: text(model, item.labelKey) }))} value={view} onChange={setView} /> : null}
      <div className="xp-onboarding__content">
        {guided}
        {model.statusItems && !showDetails ? <StatusTimeline model={model} /> : null}
        {showDetails && model.details ? (
          <section className="xp-onboarding__details">
            <dl className="xp-onboarding__facts">{model.details.generalFacts.map((fact) => <div key={fact.id}><dt>{text(model, fact.labelKey)}</dt><dd>{text(model, fact.valueKey)}</dd></div>)}</dl>
            <Portraits media={model.resolvedMedia.filter((person) => model.details!.peopleMediaIds.includes(person.id))} model={model} />
            <label className="xp-onboarding__field" htmlFor={accessId}><span>{text(model, model.details.access.labelKey)}</span><select id={accessId} name="access" value={model.details.access.currentValue} disabled aria-describedby={`${accessId}-reason`}>{model.details.access.options.map((option) => <option value={option.id} key={option.id}>{text(model, option.labelKey)}</option>)}</select><small id={`${accessId}-reason`}>{text(model, model.details.access.disabledReasonKey)}</small></label>
            <a href={model.details.action.href}>{text(model, model.details.action.labelKey)}</a>
          </section>
        ) : null}
        {model.support ? <aside className="xp-onboarding__support"><strong>{text(model, model.support.titleKey)}</strong><p>{text(model, model.support.bodyKey)}</p><a href={model.support.route.href}>{text(model, model.support.route.labelKey)}</a></aside> : null}
      </div>
      {model.preset !== "status-tabs" ? <p className="xp-onboarding__live" role="status" aria-live="polite">{template(text(model, model.stateKeys.progressKey), { complete: completed.size })}</p> : null}
      {ownsBottomAction && primary ? <StickyActionBar className="xp-onboarding__actions" placement="page" summary={model.preset === "status-tabs" ? <span className="xp-onboarding__notification-state" data-state={notification} role="status" aria-live="polite">{notificationCopy}</span> : undefined} primary={relocatedItem ? <a href={relocatedItem.action.href} data-intent="primary" onClick={(event) => activate(event, relocatedItem)}>{text(model, relocatedItem.action.labelKey)}</a> : footerLink(primary)} secondary={secondary.map(footerLink)} /> : null}
    </section>
  );
}
