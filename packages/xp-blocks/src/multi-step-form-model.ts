import type { FormChoiceSetModel, FormFieldModel } from "./form-surface-model";
import type { CartLineModel, CartSummaryModel } from "./shopping-cart-model";

export const MULTI_STEP_SOURCE_KEYS = [
  "multi-step-form-01",
  "multi-step-form-02",
  "multi-step-form-03",
] as const;

export type MultiStepSourceKey = (typeof MULTI_STEP_SOURCE_KEYS)[number];
export type WizardPreset = "registration-top" | "rule-rail" | "checkout-cart-address-payment";
export type MultiStepAction = {
  id: string;
  label: string;
  behavior: "previous" | "next" | "submit" | "reset" | "retry";
  emphasis: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  disabledReason?: string;
};
export type CheckoutAction = {
  id: string;
  label: string;
  behavior: "edit" | "remove" | "save" | "add" | "apply" | "reset" | "select-method";
  emphasis: "primary" | "secondary" | "quiet" | "destructive";
};
export type WizardMediaReference = {
  assetKey: string;
  kind: "illustration" | "product-image";
  alt: string;
};
export type WizardDecoration = {
  assetKey: string;
  alt: string;
  role: "decorative" | "supporting";
  presentation: Record<"M" | "TP" | "TL" | "DS" | "DW", "backdrop" | "thumb" | "pane">;
};
export type ReviewRow = { id: string; label: string; value: string };
export type ReceiptBlock = {
  title: string;
  description: string;
  referenceLabel?: string;
  referenceValue?: string;
  acknowledgement?: string;
  contactLabel?: string;
  contact?: string;
  timestampLabel?: string;
  timestamp?: string;
};
export type CheckoutCartPane = {
  kind: "checkout-cart";
  lines: CartLineModel[];
  offers: Array<{ id: string; title: string; description: string }>;
  promotion: { field: FormFieldModel; action: CheckoutAction };
  giftWrap: { title: string; description: string; action: CheckoutAction };
  summary: CartSummaryModel;
  empty: { title: string; description: string; action: CheckoutAction };
};
export type CheckoutAddressPane = {
  kind: "checkout-address";
  addresses: FormChoiceSetModel;
  addressActions: CheckoutAction[];
  addAddressAction: CheckoutAction;
  deliveryChoices: FormChoiceSetModel;
  estimates: Array<{ lineId: string; label: string }>;
  summary: CartSummaryModel;
};
export type CheckoutPaymentPane = {
  kind: "checkout-payment";
  methods: FormChoiceSetModel;
  cardFields: FormFieldModel[];
  cardSaveControl: FormFieldModel;
  giftFields: FormFieldModel[];
  methodActions: CheckoutAction[];
  summary: CartSummaryModel;
};
export type CheckoutConfirmationPane = {
  kind: "checkout-confirmation";
  receipt: ReceiptBlock;
  fulfillmentGroups: Array<{ id: string; title: string; rows: ReviewRow[] }>;
  lines: CartLineModel[];
  summary: CartSummaryModel;
};
export type StepPaneBody =
  | { kind: "form"; fields: FormFieldModel[]; choiceSets?: FormChoiceSetModel[] }
  | { kind: "choice-form"; choiceSets: FormChoiceSetModel[]; fields: FormFieldModel[] }
  | { kind: "review"; rows: ReviewRow[]; acknowledgement: FormFieldModel }
  | { kind: "success"; receipt: ReceiptBlock }
  | CheckoutCartPane
  | CheckoutAddressPane
  | CheckoutPaymentPane
  | CheckoutConfirmationPane;
export type StepPaneFixture = {
  id: string;
  title: string;
  lede?: string;
  body: StepPaneBody;
  actions: MultiStepAction[];
  decoration?: WizardDecoration;
};
export type WizardStep = {
  id: string;
  label: string;
  shortLabel: string;
  description?: string;
  iconKey: string;
  progress: "visible" | "hidden";
  terminal: boolean;
  pane: StepPaneFixture;
};
export type WizardNavigation = {
  linear: true;
  allowVisitedJump: boolean;
  initialStepId: string;
  initialVisitedStepIds: string[];
  history: "session" | "url";
  confirmExitWhenDirty: boolean;
};
export type WizardCopy = {
  title: string;
  description?: string;
  progressLabel: string;
  currentStepLabel: string;
  completedStepLabel: string;
  availableStepLabel: string;
  lockedStepLabel: string;
  openStepListLabel: string;
  closeStepListLabel: string;
  validationSummaryTitle: string;
  processingLabel: string;
  announcements: {
    stepChanged: string;
    stepCompleted: string;
    validationFailed: string;
    submitted: string;
    reset: string;
    processing: string;
    failed: string;
  };
};
export type MultiStepState = {
  currentStepId?: string;
  processing?: boolean;
  errorStepId?: string;
  errorControlId?: string;
  emptyCart?: boolean;
};
export type MultiStepFormStress = {
  navigation?: Partial<WizardNavigation>;
  steps?: WizardStep[];
  copy?: Partial<WizardCopy> & { announcements?: Partial<WizardCopy["announcements"]> };
  media?: WizardMediaReference[];
  state?: MultiStepState;
};
export type MultiStepFormFixture = {
  sourceKey: MultiStepSourceKey;
  preset: WizardPreset;
  owner: "WizardShell" | "CheckoutFlow";
  navigation: WizardNavigation;
  steps: WizardStep[];
  copy: WizardCopy;
  media: WizardMediaReference[];
  state?: MultiStepState;
  stress: {
    short: MultiStepFormStress;
    longLocale: MultiStepFormStress;
    error: MultiStepFormStress;
    emptyCart?: MultiStepFormStress;
    processing?: MultiStepFormStress;
  };
};

const PRESETS: Record<MultiStepSourceKey, WizardPreset> = {
  "multi-step-form-01": "registration-top",
  "multi-step-form-02": "rule-rail",
  "multi-step-form-03": "checkout-cart-address-payment",
};
const OWNERS: Record<MultiStepSourceKey, MultiStepFormFixture["owner"]> = {
  "multi-step-form-01": "WizardShell",
  "multi-step-form-02": "WizardShell",
  "multi-step-form-03": "CheckoutFlow",
};

const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const exact = (actual: unknown[], expected: unknown[], label: string, sourceKey: string) => {
  if (actual.join("|") !== expected.join("|")) throw new Error(`${sourceKey} requires exact ${label}: ${expected.join(", ")}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

function mergeStress(fixture: MultiStepFormFixture, stress?: keyof MultiStepFormFixture["stress"]): MultiStepFormFixture {
  if (!stress) return structuredClone(fixture);
  const patch = fixture.stress[stress];
  if (!patch) throw new Error(`${fixture.sourceKey} does not declare ${stress} stress.`);
  const resolved = structuredClone(fixture);
  if (patch.navigation) resolved.navigation = { ...resolved.navigation, ...patch.navigation };
  if (patch.steps) resolved.steps = structuredClone(patch.steps);
  if (patch.copy) resolved.copy = {
    ...resolved.copy,
    ...patch.copy,
    announcements: { ...resolved.copy.announcements, ...patch.copy.announcements },
  };
  if (patch.media) resolved.media = structuredClone(patch.media);
  if (patch.state) resolved.state = { ...resolved.state, ...patch.state };
  if (stress === "emptyCart") {
    const cart = resolved.steps.find(({ pane }) => pane.body.kind === "checkout-cart");
    if (cart?.pane.body.kind !== "checkout-cart") throw new Error(`${fixture.sourceKey} emptyCart stress requires a checkout cart pane.`);
    cart.pane.body.lines = [];
    resolved.state = { ...resolved.state, emptyCart: true };
  }
  return resolved;
}

function controlIds(body: StepPaneBody) {
  switch (body.kind) {
    case "form": return [...body.fields.map(({ id }) => id), ...(body.choiceSets ?? []).map(({ id }) => id)];
    case "choice-form": return [...body.fields.map(({ id }) => id), ...body.choiceSets.map(({ id }) => id)];
    case "review": return [body.acknowledgement.id];
    case "checkout-cart": return [body.promotion.field.id];
    case "checkout-address": return [body.addresses.id, body.deliveryChoices.id];
    case "checkout-payment": return [body.methods.id, body.cardSaveControl.id, ...body.cardFields.map(({ id }) => id), ...body.giftFields.map(({ id }) => id)];
    default: return [];
  }
}

function validateCommon(fixture: MultiStepFormFixture) {
  const { sourceKey, steps, navigation, copy, media, state } = fixture;
  if (PRESETS[sourceKey] !== fixture.preset || OWNERS[sourceKey] !== fixture.owner) throw new Error(`${sourceKey} has an invalid preset or owner.`);
  if (!navigation.linear) throw new Error(`${sourceKey} requires linear navigation.`);
  unique(steps.map(({ id }) => id), "step IDs", sourceKey);
  unique(steps.map(({ pane }) => pane.id), "pane IDs", sourceKey);
  unique(media.map(({ assetKey }) => assetKey), "media keys", sourceKey);
  const stepIds = new Set(steps.map(({ id }) => id));
  if (!stepIds.has(navigation.initialStepId)) throw new Error(`${sourceKey} cannot resolve initial step ${navigation.initialStepId}.`);
  for (const id of navigation.initialVisitedStepIds) if (!stepIds.has(id)) throw new Error(`${sourceKey} cannot resolve visited step ${id}.`);
  const currentStepId = state?.currentStepId ?? navigation.initialStepId;
  if (!stepIds.has(currentStepId)) throw new Error(`${sourceKey} cannot resolve current step ${currentStepId}.`);
  if (steps.filter(({ terminal }) => terminal).length !== 1) throw new Error(`${sourceKey} requires exactly one terminal step.`);
  const nestedIds: string[] = [];
  const controls: string[] = [];
  for (const step of steps) {
    text(step.label, "step label", sourceKey);
    text(step.shortLabel, "step short label", sourceKey);
    text(step.iconKey, "step icon key", sourceKey);
    text(step.pane.title, "pane title", sourceKey);
    nestedIds.push(step.id, step.pane.id, ...step.pane.actions.map(({ id }) => id));
    controls.push(...controlIds(step.pane.body));
    for (const action of step.pane.actions) {
      text(action.label, `action ${action.id} label`, sourceKey);
      if (action.disabled && !action.disabledReason) throw new Error(`${sourceKey} disabled action ${action.id} requires a reason.`);
    }
    if (step.pane.decoration && !media.some(({ assetKey }) => assetKey === step.pane.decoration?.assetKey)) throw new Error(`${sourceKey} cannot resolve decoration ${step.pane.decoration.assetKey}.`);
  }
  unique(nestedIds, "step or action IDs", sourceKey);
  unique(controls, "control IDs", sourceKey);
  if (state?.errorStepId && !stepIds.has(state.errorStepId)) throw new Error(`${sourceKey} cannot resolve error step ${state.errorStepId}.`);
  if (state?.errorControlId && !controls.includes(state.errorControlId)) throw new Error(`${sourceKey} cannot resolve error control ${state.errorControlId}.`);
  for (const value of [copy.title, copy.progressLabel, copy.currentStepLabel, copy.completedStepLabel, copy.availableStepLabel, copy.lockedStepLabel, copy.openStepListLabel, copy.closeStepListLabel, copy.validationSummaryTitle, copy.processingLabel, ...Object.values(copy.announcements)]) text(value, "wizard copy", sourceKey);
}

function validateSource01(fixture: MultiStepFormFixture) {
  const { sourceKey, steps } = fixture;
  if (steps.length !== 4) throw new Error(`${sourceKey} requires four steps.`);
  exact(steps.map(({ progress }) => progress), ["visible", "visible", "visible", "hidden"], "progress flags", sourceKey);
  exact(steps.map(({ terminal }) => terminal), [false, false, false, true], "terminal flags", sourceKey);
  exact(steps.map(({ pane }) => pane.body.kind), ["form", "form", "choice-form", "success"], "body kinds", sourceKey);
  const [one, two, three] = steps.map(({ pane }) => pane.body);
  if (one.kind !== "form" || two.kind !== "form" || three.kind !== "choice-form" || one.fields.length !== 5 || two.fields.length !== 8 || three.fields.length !== 4 || three.choiceSets.length !== 1 || three.choiceSets[0]?.options.length !== 3) throw new Error(`${sourceKey} requires exact 5, 8, and 4-field registration anatomy plus one three-option choice set.`);
  exact(steps.map(({ pane }) => pane.actions.map(({ behavior }) => behavior).join(",")), ["next", "previous,next", "previous,submit", "reset"], "stage action ownership", sourceKey);
}

function validateSource02(fixture: MultiStepFormFixture) {
  const { sourceKey, steps } = fixture;
  if (steps.length !== 5) throw new Error(`${sourceKey} requires five steps.`);
  exact(steps.map(({ progress }) => progress), ["visible", "visible", "visible", "visible", "hidden"], "progress flags", sourceKey);
  exact(steps.map(({ terminal }) => terminal), [false, false, false, false, true], "terminal flags", sourceKey);
  exact(steps.map(({ pane }) => pane.body.kind), ["choice-form", "form", "form", "review", "success"], "body kinds", sourceKey);
  const [trigger, parameters, delivery, review] = steps.map(({ pane }) => pane.body);
  if (trigger.kind !== "choice-form" || trigger.fields.length !== 2 || trigger.choiceSets.length !== 1 || trigger.choiceSets[0]?.options.length !== 3 || parameters.kind !== "form" || parameters.fields.length !== 6 || parameters.choiceSets?.length !== 1 || parameters.choiceSets[0]?.options.length !== 3 || delivery.kind !== "form" || delivery.fields.length !== 7 || review.kind !== "review" || review.rows.length !== 5) throw new Error(`${sourceKey} has invalid rule workflow counts.`);
  exact(steps.map(({ pane }) => pane.actions.map(({ behavior }) => behavior).join(",")), ["next", "previous,next", "previous,next", "previous,submit", "reset"], "stage action ownership", sourceKey);
  exact(steps.flatMap(({ pane }, index) => pane.decoration ? [index] : []), [0, 3], "decoration owners", sourceKey);
}

function validateSource03(fixture: MultiStepFormFixture, allowEmpty: boolean) {
  const { sourceKey, steps } = fixture;
  if (steps.length !== 4) throw new Error(`${sourceKey} requires four visible steps.`);
  exact(steps.map(({ progress }) => progress), ["visible", "visible", "visible", "visible"], "progress flags", sourceKey);
  exact(steps.map(({ terminal }) => terminal), [false, false, false, true], "terminal flags", sourceKey);
  exact(steps.map(({ pane }) => pane.body.kind), ["checkout-cart", "checkout-address", "checkout-payment", "checkout-confirmation"], "body kinds", sourceKey);
  const [cart, address, payment, confirmation] = steps.map(({ pane }) => pane.body);
  if (cart.kind !== "checkout-cart" || address.kind !== "checkout-address" || payment.kind !== "checkout-payment" || confirmation.kind !== "checkout-confirmation") throw new Error(`${sourceKey} has invalid checkout pane order.`);
  if ((!allowEmpty && cart.lines.length !== 2) || (allowEmpty && cart.lines.length !== 0) || cart.offers.length !== 2 || address.addresses.options.length !== 2 || address.addressActions.length !== 4 || address.deliveryChoices.options.length !== 3 || address.estimates.length !== 2 || payment.methods.options.length !== 3 || payment.cardFields.length !== 4 || payment.giftFields.length !== 2 || payment.methodActions.length !== 3 || confirmation.fulfillmentGroups.length !== 3 || confirmation.lines.length !== 2) throw new Error(`${sourceKey} has invalid checkout inventory.`);
  exact(steps.map(({ pane }) => pane.actions.map(({ behavior }) => behavior).join(",")), ["next", "previous,next", "previous,submit", ""], "stage action ownership", sourceKey);
  if (steps.flatMap(({ pane }) => pane.actions).filter(({ behavior }) => behavior === "submit").length !== 1) throw new Error(`${sourceKey} requires exactly one payment-owned submit transition.`);
  const mediaKeys = new Set(fixture.media.map(({ assetKey }) => assetKey));
  for (const line of [...cart.lines, ...confirmation.lines]) if (!mediaKeys.has(line.media.assetKey)) throw new Error(`${sourceKey} cannot resolve product media ${line.media.assetKey}.`);
  const lineIds = new Set(confirmation.lines.map(({ id }) => id));
  for (const estimate of address.estimates) if (!lineIds.has(estimate.lineId)) throw new Error(`${sourceKey} estimate references unknown line ${estimate.lineId}.`);
}

export function resolveMultiStepFormFixture(fixture: MultiStepFormFixture, stress?: keyof MultiStepFormFixture["stress"]): MultiStepFormFixture {
  if (!MULTI_STEP_SOURCE_KEYS.includes(fixture.sourceKey)) throw new Error(`Invalid multi-step source key: ${fixture.sourceKey}`);
  const expectedStress = fixture.sourceKey === "multi-step-form-03" ? "emptyCart|error|longLocale|processing|short" : "error|longLocale|short";
  if (Object.keys(fixture.stress).sort().join("|") !== expectedStress) throw new Error(`${fixture.sourceKey} requires exact declared stress states.`);
  const resolved = mergeStress(fixture, stress);
  validateCommon(resolved);
  if (resolved.sourceKey === "multi-step-form-01") validateSource01(resolved);
  if (resolved.sourceKey === "multi-step-form-02") validateSource02(resolved);
  if (resolved.sourceKey === "multi-step-form-03") validateSource03(resolved, stress === "emptyCart");
  return resolved;
}
