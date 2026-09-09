"use client";

import {
  AdaptiveOverlay,
  MorphSlot,
  SnapRail,
  StickyActionBar,
  defineStepper,
  type DeviceClass,
} from "@xp/primitives";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type WizardActionBehavior = "previous" | "next" | "submit" | "reset" | "retry";
export type WizardActionEmphasis = "primary" | "secondary" | "quiet";

export type WizardAction = {
  id: string;
  label: string;
  behavior: WizardActionBehavior;
  emphasis: WizardActionEmphasis;
  disabled?: boolean;
  disabledReason?: string;
};

export type WizardStepMeta<Id extends string = string> = {
  id: Id;
  label: string;
  shortLabel?: string;
  subprogress?: string;
  description?: string;
  progress?: "visible" | "hidden";
  terminal?: boolean;
  actions: WizardAction[];
};

export type WizardShellCopy = {
  progressLabel: string;
  openStepListLabel: string;
  closeStepListLabel: string;
  stepCount: string;
  currentStepLabel: string;
  completedStepLabel: string;
  availableStepLabel: string;
  lockedStepLabel: string;
  announcements: {
    stepChanged: string;
    validationFailed: string;
    submitted: string;
    reset: string;
    processing: string;
    failed: string;
  };
};

type WizardStepperInstance<Id extends string> = {
  id: Id;
  index: number;
  completed: Id[];
  data: { reset: () => void };
  setComplete: (id?: Id, value?: boolean) => void;
  next: () => Promise<boolean>;
  prev: () => Promise<boolean>;
  goTo: (id: Id) => Promise<boolean>;
  reset: () => Promise<boolean>;
};

export type WizardDefinition<Id extends string = string> = {
  steps: readonly { id: Id }[];
  useStepper: (options?: {
    defaultStep?: Id;
    step?: Id | null;
    onStepChange?: (step: Id) => void;
  }) => WizardStepperInstance<Id>;
};

export function defineWizard<const Steps extends readonly { id: string }[]>(steps: Steps) {
  return defineStepper(steps, { linear: true }) as unknown as WizardDefinition<Steps[number]["id"]>;
}

export function canNavigateToWizardStep<Id extends string>(targetId: Id, currentId: Id, visited: ReadonlySet<Id>) {
  return targetId === currentId || visited.has(targetId);
}

export type WizardNavigationPolicy = "visited" | "direct";

export function canNavigateWithWizardPolicy<Id extends string>(
  targetId: Id,
  currentId: Id,
  visited: ReadonlySet<Id>,
  policy: WizardNavigationPolicy,
) {
  return policy === "direct" || canNavigateToWizardStep(targetId, currentId, visited);
}

export function validateWizardConfiguration<Id extends string>(
  definition: WizardDefinition<Id>,
  steps: readonly WizardStepMeta<Id>[],
  initialStepId: Id,
) {
  const engineIds = definition.steps.map(({ id }) => id);
  const metaIds = steps.map(({ id }) => id);
  if (!steps.length) throw new Error("WizardShell requires at least one step.");
  if (new Set(engineIds).size !== engineIds.length || new Set(metaIds).size !== metaIds.length) {
    throw new Error("WizardShell step IDs must be unique.");
  }
  if (engineIds.join("|") !== metaIds.join("|")) {
    throw new Error("WizardShell definition and step metadata must have the same ordered IDs.");
  }
  if (!engineIds.includes(initialStepId)) throw new Error("WizardShell initial step must exist in the definition.");
  if (steps.filter(({ terminal }) => terminal).length !== 1) throw new Error("WizardShell requires exactly one terminal step.");
  for (const step of steps) {
    if (!step.label.trim()) throw new Error(`WizardShell step ${step.id} requires a fixture-owned label.`);
    if (new Set(step.actions.map(({ id }) => id)).size !== step.actions.length) {
      throw new Error(`WizardShell step ${step.id} repeats an action ID.`);
    }
    if (step.actions.filter(({ emphasis }) => emphasis === "primary").length > 1) {
      throw new Error(`WizardShell step ${step.id} may expose at most one primary action.`);
    }
  }
  return true;
}

export type StepPaneProperties = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  headingId: string;
  title: ReactNode;
  lede?: ReactNode;
  validationSummary?: ReactNode;
  context?: ReactNode;
  contextPlacement?: "before-controls" | "aside";
  busy?: boolean;
};

export const StepPane = forwardRef<HTMLElement, StepPaneProperties>(function StepPane(
  { headingId, title, lede, validationSummary, context, contextPlacement = "aside", busy = false, className, children, ...properties },
  reference,
) {
  return (
    <section
      {...properties}
      ref={reference}
      className={["xp-step-pane", className].filter(Boolean).join(" ")}
      aria-labelledby={headingId}
      aria-busy={busy || undefined}
      data-xp-block="step-pane"
      data-wizard-step-pane
    >
      <div className="xp-step-pane__scroll" data-scroll-owner="step-pane">
        <header className="xp-step-pane__header">
          <h2 id={headingId} tabIndex={-1} data-wizard-step-heading>{title}</h2>
          {lede ? <p>{lede}</p> : null}
        </header>
        {context && contextPlacement === "before-controls" ? <aside className="xp-step-pane__context" data-context-order="before-controls">{context}</aside> : null}
        {validationSummary ? <div className="xp-step-pane__validation" role="alert">{validationSummary}</div> : null}
        <div className="xp-step-pane__body">{children}</div>
      </div>
      {context && contextPlacement === "aside" ? <aside className="xp-step-pane__context" data-context-order="aside">{context}</aside> : null}
    </section>
  );
});

export type WizardShellProperties<Id extends string> = {
  definition: WizardDefinition<Id>;
  steps: readonly WizardStepMeta<Id>[];
  copy: WizardShellCopy;
  renderStep: (step: WizardStepMeta<Id>, state: { processing: boolean }) => ReactNode;
  initialStepId?: Id;
  initialVisitedStepIds?: readonly Id[];
  currentStepId?: Id | null;
  onCurrentStepChange?: (stepId: Id) => void;
  validateStep?: (stepId: Id, pane: HTMLElement | null) => boolean | Promise<boolean>;
  onBeforeAction?: (action: WizardAction, stepId: Id) => boolean | void | Promise<boolean | void>;
  onAction?: (action: WizardAction, stepId: Id) => boolean | void | Promise<boolean | void>;
  history?: "none" | "session" | "url";
  historyKey?: string;
  processing?: boolean;
  preset?: "product-wizard" | "account-wizard" | "onboarding-profile";
  navigationPolicy?: WizardNavigationPolicy;
  getStepHref?: (stepId: Id) => string;
  getActionHref?: (action: WizardAction, stepId: Id) => string | undefined;
  className?: string;
};

type WizardFrameCore = {
  current: WizardStepMeta;
  steps: readonly WizardStepMeta[];
  visited: ReadonlySet<string>;
  completed: ReadonlySet<string>;
  copy: WizardShellCopy;
  processing: boolean;
  navigationPolicy: WizardNavigationPolicy;
  getStepHref?: (stepId: string) => string;
  renderStep: (step: WizardStepMeta, state: { processing: boolean }) => ReactNode;
  onNavigate: (stepId: string) => void;
};

const wizardLadder: Record<DeviceClass, string> = {
  M: "app-bar",
  TP: "chip-strip",
  TL: "rail",
  DS: "rail-pane",
  DW: "rail-pane-context",
};

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template);
}

function progressStatus(step: WizardStepMeta, core: WizardFrameCore) {
  if (step.id === core.current.id) return core.copy.currentStepLabel;
  if (core.completed.has(step.id)) return core.copy.completedStepLabel;
  if (core.visited.has(step.id)) return core.copy.availableStepLabel;
  return core.copy.lockedStepLabel;
}

function WizardProgressList({
  core,
  compact = false,
  suppressCurrent = false,
}: {
  core: WizardFrameCore;
  compact?: boolean;
  suppressCurrent?: boolean;
}) {
  const steps = core.steps.filter(({ progress = "visible" }) => progress === "visible");
  return (
    <nav className="xp-wizard-shell__progress-list" aria-label={core.copy.progressLabel} data-compact={compact || undefined}>
      {steps.map((step, index) => {
        const reachable = canNavigateWithWizardPolicy(step.id, core.current.id, core.visited, core.navigationPolicy);
        const current = step.id === core.current.id;
        const content = <><span aria-hidden="true">{index + 1}</span><strong>{compact ? step.shortLabel ?? step.label : step.label}</strong><small>{progressStatus(step, core)}</small></>;
        return core.getStepHref ? (
          <a
            key={step.id}
            href={core.getStepHref(step.id)}
            aria-label={`${step.label}. ${progressStatus(step, core)}`}
            aria-disabled={!reachable || core.processing || undefined}
            aria-current={current && !suppressCurrent ? "step" : undefined}
            data-state={current ? "current" : core.completed.has(step.id) ? "completed" : reachable ? "visited" : "locked"}
            onClick={(event) => { event.preventDefault(); if (reachable && !core.processing) core.onNavigate(step.id); }}
          >{content}</a>
        ) : (
          <button key={step.id} type="button" aria-label={`${step.label}. ${progressStatus(step, core)}`} disabled={!reachable || core.processing} aria-current={current && !suppressCurrent ? "step" : undefined} data-state={current ? "current" : core.completed.has(step.id) ? "completed" : reachable ? "visited" : "locked"} onClick={() => core.onNavigate(step.id)}>{content}</button>
        );
      })}
    </nav>
  );
}

function WizardAppBarProgress({ core }: { core: WizardFrameCore }) {
  const [open, setOpen] = useState(false);
  const visible = core.steps.filter(({ progress = "visible" }) => progress === "visible");
  const position = Math.max(0, visible.findIndex(({ id }) => id === core.current.id));
  const currentIsHidden = core.current.progress === "hidden";
  return (
    <div className="xp-wizard-shell__app-bar">
      <div>
        <strong aria-current={currentIsHidden ? undefined : "step"}>{core.current.shortLabel ?? core.current.label}</strong>
        <span data-chunk-progress={core.current.subprogress || undefined}>
          {fillTemplate(core.copy.stepCount, { current: currentIsHidden ? visible.length : position + 1, total: visible.length })}
          {core.current.subprogress ? ` · ${core.current.subprogress}` : null}
        </span>
      </div>
      <AdaptiveOverlay intent="inspect" open={open} onOpenChange={setOpen}>
        <AdaptiveOverlay.Trigger aria-label={core.copy.openStepListLabel}>{core.copy.openStepListLabel}</AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content>
          <AdaptiveOverlay.Header title={core.copy.progressLabel} closeLabel={core.copy.closeStepListLabel}/>
          <AdaptiveOverlay.Body>
            <WizardProgressList
              core={{ ...core, onNavigate: (id) => { core.onNavigate(id); setOpen(false); } }}
              suppressCurrent
            />
          </AdaptiveOverlay.Body>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    </div>
  );
}

function WizardChipProgress({ core }: { core: WizardFrameCore }) {
  const visible = core.steps.filter(({ progress = "visible" }) => progress === "visible");
  return (
    <SnapRail
      className="xp-wizard-shell__chip-strip"
      label={core.copy.progressLabel}
      paginationLabel={core.copy.progressLabel}
      markerLabel={(index) => fillTemplate(core.copy.stepCount, { current: index, total: visible.length })}
      peek="12%"
      cap="18rem"
      markers="none"
    >
      {visible.map((step, index) => {
        const reachable = canNavigateWithWizardPolicy(step.id, core.current.id, core.visited, core.navigationPolicy);
        const current = step.id === core.current.id;
        const content = <><span aria-hidden="true">{index + 1}</span><strong>{step.shortLabel ?? step.label}</strong><small data-chunk-progress={current && step.subprogress || undefined}>{progressStatus(step, core)}{current && step.subprogress ? ` · ${step.subprogress}` : null}</small></>;
        return (
          <SnapRail.Item key={step.id}>
            {core.getStepHref ? <a href={core.getStepHref(step.id)} aria-disabled={!reachable || core.processing || undefined} aria-current={current ? "step" : undefined} data-state={current ? "current" : core.completed.has(step.id) ? "completed" : reachable ? "visited" : "locked"} onClick={(event) => { event.preventDefault(); if (reachable && !core.processing) core.onNavigate(step.id); }}>{content}</a> : <button type="button" disabled={!reachable || core.processing} aria-current={current ? "step" : undefined} data-state={current ? "current" : core.completed.has(step.id) ? "completed" : reachable ? "visited" : "locked"} onClick={() => core.onNavigate(step.id)}>{content}</button>}
          </SnapRail.Item>
        );
      })}
    </SnapRail>
  );
}

function WizardFrame({ core, form }: { core: WizardFrameCore; form: string }) {
  const progress = form === "app-bar"
    ? <WizardAppBarProgress core={core}/>
    : form === "chip-strip"
      ? <WizardChipProgress core={core}/>
      : <WizardProgressList core={core} compact={form === "rail"}/>;
  return (
    <div className="xp-wizard-shell__frame" data-wizard-form={form}>
      {progress}
      <main className="xp-wizard-shell__active-pane">{core.renderStep(core.current, { processing: core.processing })}</main>
    </div>
  );
}

const wizardRenderers = Object.fromEntries(
  Object.values(wizardLadder).map((form) => [form, ({ core }: { core: WizardFrameCore }) => <WizardFrame core={core} form={form}/>]),
) as Record<string, ({ core }: { core: WizardFrameCore }) => ReactNode>;

function WizardShellController<Id extends string>({
  definition,
  steps,
  copy,
  renderStep,
  initialStepId = definition.steps[0]?.id as Id,
  initialVisitedStepIds = [],
  currentStepId,
  onCurrentStepChange,
  validateStep,
  onBeforeAction,
  onAction,
  history = "none",
  historyKey = "xp-wizard-step",
  processing = false,
  preset = "product-wizard",
  navigationPolicy = "visited",
  getStepHref,
  getActionHref,
  className,
}: WizardShellProperties<Id>) {
  useMemo(() => validateWizardConfiguration(definition, steps, initialStepId), [definition, initialStepId, steps]);
  const stepper = definition.useStepper({
    defaultStep: initialStepId,
    step: currentStepId,
    onStepChange: onCurrentStepChange,
  });
  const [visited, setVisited] = useState<Set<Id>>(() => new Set([initialStepId, ...initialVisitedStepIds]));
  const [announcement, setAnnouncement] = useState("");
  const [localProcessing, setLocalProcessing] = useState(false);
  const paneOwner = useRef<HTMLDivElement>(null);
  const transitionLock = useRef(false);
  const firstRender = useRef(true);
  const busy = processing || localProcessing;
  const current = steps.find(({ id }) => id === stepper.id) ?? steps[0];
  const completed = useMemo(() => new Set<string>(stepper.completed), [stepper.completed]);

  const writeHistory = useCallback((stepId: Id, replace = false) => {
    if (history === "none" || typeof window === "undefined") return;
    const state = { ...window.history.state, [historyKey]: stepId };
    let url: URL | undefined;
    if (history === "url") {
      url = new URL(window.location.href);
      url.searchParams.set(historyKey, stepId);
    }
    window.history[replace ? "replaceState" : "pushState"](state, "", url);
  }, [history, historyKey]);

  useEffect(() => {
    setVisited((currentVisited) => currentVisited.has(stepper.id) ? currentVisited : new Set([...currentVisited, stepper.id]));
    if (firstRender.current) {
      firstRender.current = false;
      writeHistory(stepper.id, true);
      return;
    }
    const owner = paneOwner.current;
    owner?.querySelector<HTMLElement>("[data-scroll-owner='step-pane']")?.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => owner?.querySelector<HTMLElement>("[data-wizard-step-heading]")?.focus());
    setAnnouncement(fillTemplate(copy.announcements.stepChanged, { step: current.label }));
  }, [copy.announcements.stepChanged, current.label, stepper.id, writeHistory]);

  useEffect(() => {
    if (history === "none") return;
    const onPopState = (event: PopStateEvent) => {
      const raw = history === "url"
        ? new URL(window.location.href).searchParams.get(historyKey)
        : event.state?.[historyKey];
      const target = definition.steps.find(({ id }) => id === raw)?.id;
      if (target && canNavigateWithWizardPolicy(target, stepper.id, visited, navigationPolicy)) void stepper.goTo(target);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [definition.steps, history, historyKey, navigationPolicy, stepper, visited]);

  const validateCurrent = useCallback(async () => {
    const pane = paneOwner.current?.querySelector<HTMLElement>("[data-wizard-step-pane]") ?? null;
    const customValid = validateStep ? await validateStep(stepper.id, pane) : true;
    const invalid = pane?.querySelector<HTMLElement>(":invalid,[aria-invalid='true']") ?? null;
    if (customValid && !invalid) return true;
    setAnnouncement(copy.announcements.validationFailed);
    invalid?.focus();
    if (invalid && "reportValidity" in invalid && typeof invalid.reportValidity === "function") invalid.reportValidity();
    return false;
  }, [copy.announcements.validationFailed, stepper.id, validateStep]);

  const goToVisited = useCallback(async (targetId: Id) => {
    if (busy || transitionLock.current || !canNavigateWithWizardPolicy(targetId, stepper.id, visited, navigationPolicy)) return;
    transitionLock.current = true;
    const changed = await stepper.goTo(targetId);
    transitionLock.current = false;
    if (changed) writeHistory(targetId);
  }, [busy, navigationPolicy, stepper, visited, writeHistory]);

  const runAction = useCallback(async (action: WizardAction) => {
    if (busy || action.disabled || transitionLock.current) return;
    transitionLock.current = true;
    try {
      if (await onBeforeAction?.(action, stepper.id) === false) return;
      if (action.behavior === "previous") {
        const target = definition.steps[stepper.index - 1]?.id;
        const changed = await stepper.prev();
        if (changed && target) writeHistory(target);
        return;
      }
      if (action.behavior === "reset") {
        const accepted = await onAction?.(action, stepper.id);
        if (accepted === false) return;
        for (const id of stepper.completed) stepper.setComplete(id, false);
        stepper.data.reset();
        setVisited(new Set([initialStepId]));
        await stepper.reset();
        writeHistory(initialStepId, true);
        setAnnouncement(copy.announcements.reset);
        return;
      }
      if (action.behavior === "next" || action.behavior === "submit") {
        if (!(await validateCurrent())) return;
      }
      if (action.behavior === "submit" || action.behavior === "retry") {
        setLocalProcessing(true);
        setAnnouncement(copy.announcements.processing);
      }
      const accepted = await onAction?.(action, stepper.id);
      if (accepted === false) {
        if (action.behavior === "submit" || action.behavior === "retry") {
          setAnnouncement(copy.announcements.failed);
        }
        return;
      }
      if (action.behavior === "retry") {
        setAnnouncement(copy.announcements.submitted);
        return;
      }
      stepper.setComplete(stepper.id, true);
      const target = definition.steps[stepper.index + 1]?.id;
      const changed = await stepper.next();
      if (changed && target) {
        setVisited((currentVisited) => new Set([...currentVisited, target]));
        writeHistory(target);
      }
      if (action.behavior === "submit") setAnnouncement(copy.announcements.submitted);
    } catch (error) {
      console.error("WizardShell action failed.", error);
      setAnnouncement(copy.announcements.failed);
    } finally {
      setLocalProcessing(false);
      transitionLock.current = false;
    }
  }, [busy, copy.announcements, definition.steps, initialStepId, onAction, onBeforeAction, stepper, validateCurrent, writeHistory]);

  const actions = current.actions;
  const primary = actions.find(({ emphasis }) => emphasis === "primary") ?? actions.at(-1);
  const secondary = actions.filter((action) => action !== primary);
  const button = (action: WizardAction) => {
    const href = getActionHref?.(action, stepper.id);
    const shared = { "data-action-id": action.id, "data-behavior": action.behavior, "data-emphasis": action.emphasis, title: action.disabled ? action.disabledReason : undefined };
    return href ? <a {...shared} key={action.id} href={href} aria-disabled={busy || action.disabled || undefined} onClick={(event) => { event.preventDefault(); if (!busy && !action.disabled) void runAction(action); }}>{action.label}</a> : <button {...shared} key={action.id} type="button" disabled={busy || action.disabled} onClick={() => void runAction(action)}>{action.label}</button>;
  };
  const core: WizardFrameCore = {
    current,
    steps,
    visited,
    completed,
    copy,
    processing: busy,
    navigationPolicy,
    getStepHref: getStepHref as WizardFrameCore["getStepHref"],
    renderStep: renderStep as WizardFrameCore["renderStep"],
    onNavigate: (id) => void goToVisited(id as Id),
  };

  return (
    <div
      className={["xp-wizard-shell", className].filter(Boolean).join(" ")}
      data-xp-block="wizard-shell"
      data-xp-owner="WizardShell"
      data-preset={preset}
      data-navigation-policy={navigationPolicy}
      data-current-step={stepper.id}
      data-processing={busy || undefined}
    >
      {current.progress === "hidden" ? (
        <span className="xp-wizard-shell__visually-hidden" aria-current="step">{current.label}</span>
      ) : null}
      <div ref={paneOwner} className="xp-wizard-shell__morph-owner">
        <MorphSlot ladder={wizardLadder} core={core} renderers={wizardRenderers}/>
      </div>
      {primary ? (
        <StickyActionBar
          className="xp-wizard-shell__actions"
          placement="page"
          primary={button(primary)}
          secondary={secondary.map(button)}
        />
      ) : null}
      <p className="xp-wizard-shell__visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  );
}

export function WizardShell<const Id extends string>(properties: WizardShellProperties<Id>) {
  const signature = properties.definition.steps.map(({ id }) => id).join("|");
  return <WizardShellController key={`${signature}:${properties.initialStepId ?? ""}`} {...properties}/>;
}
