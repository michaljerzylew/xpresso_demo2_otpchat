import type { Money } from "./shopping-cart-model.ts";

export const CHECKOUT_FLOW_SOURCE_KEYS = [
  "checkout-page-01",
  "checkout-page-02",
  "checkout-page-03",
  "checkout-page-04",
] as const;

export type CheckoutFlowSourceKey = (typeof CHECKOUT_FLOW_SOURCE_KEYS)[number];
export type CheckoutPreset = "cart-payment" | "saved-methods" | "guided-details" | "full-journey";
export type CheckoutFlowAdapterSourceKey = "multi-step-form-03" | "shopping-cart-03";
export type CheckoutFlowRuntimeSourceKey = CheckoutFlowSourceKey | CheckoutFlowAdapterSourceKey;
export type CheckoutFlowRuntimePreset = CheckoutPreset | "checkout-cart-address-payment" | "plan-payment";
export type CheckoutAutocomplete =
  | "off"
  | "email"
  | "given-name"
  | "family-name"
  | "organization"
  | "address-line1"
  | "address-line2"
  | "address-level1"
  | "address-level2"
  | "postal-code"
  | "cc-name"
  | "cc-number"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-csc"
  | `shipping ${"given-name" | "family-name" | "organization" | "address-line1" | "address-line2" | "address-level1" | "address-level2" | "postal-code" | "tel"}`;

export type CheckoutFieldRef = {
  id: string;
  kind: "text" | "email" | "tel" | "password" | "select" | "checkbox" | "card-number" | "card-expiry" | "card-csc";
  label: string;
  required?: boolean;
  span?: "one" | "two" | "full";
  autocomplete: CheckoutAutocomplete;
  inputMode: "text" | "email" | "tel" | "numeric";
  options?: Array<{ id: string; label: string }>;
  help?: string;
  error?: string;
};

export type PaymentMethodChoice = {
  id: string;
  label: string;
  description?: string;
  markId?: string;
  disabled?: boolean;
  disabledReason?: string;
};
export type SavedMethodChoice = PaymentMethodChoice & {
  maskedIdentity: string;
  expiryLabel: string;
  management: Array<"edit" | "delete">;
};
export type AddressChoice = {
  id: string;
  label: string;
  addressLines: string[];
  phoneLabel?: string;
  badge?: string;
  management: Array<"edit" | "remove">;
};
export type DeliveryChoice = {
  id: string;
  label: string;
  description: string;
  fee: Money;
  estimatedWindow: string;
};
export type CheckoutOffer = { id: string; label: string };
export type CheckoutNotice = {
  id: string;
  tone: "neutral" | "positive" | "warning";
  title: string;
  description: string;
  offers?: CheckoutOffer[];
  dismissible?: boolean;
};
export type AddressSnapshot = { label: string; lines: string[]; phoneLabel?: string };
export type CheckoutStepAction = { id: string; stageId: string; label: string; kind: "back" | "next" | "commit" };

export type CheckoutLineMetaRole = "seller" | "stock" | "rating" | "previous-price" | "detail";
export type CheckoutLineMeta = { id: string; role: CheckoutLineMetaRole; label: string; value: string };
export type CartLineRef = {
  id: string;
  mediaId: string;
  title: string;
  meta: Array<string | CheckoutLineMeta>;
  unitPrice: Money;
  quantity: { value: number; min: number; max: number };
  actions: Array<"remove" | "save-for-later">;
  actionLabels?: Partial<Record<"remove" | "save-for-later", string>>;
};
export type CheckoutCart = {
  lines: CartLineRef[];
  coupon?: { id: string; label: string; fieldLabel: string; actionLabel: string };
  emptyState: { title: string; description?: string; actionLabel: string };
};
export type CheckoutSummaryRow = {
  id: string;
  label: string;
  kind: "subtotal" | "shipping" | "pickup" | "tax" | "discount" | "surcharge";
  amount: Money;
};
export type CheckoutSummary = { rows: CheckoutSummaryRow[]; total: Money; totalDerivation: "computed"; label?: string };

export type DetailsPayload = { fields: CheckoutFieldRef[] };
export type CheckoutInlineAction = {
  id: string;
  label: string;
  kind: "edit" | "remove" | "add" | "apply" | "reset" | "select-method" | "save-for-later";
};
export type DeliveryPayload = {
  fields?: CheckoutFieldRef[];
  sameAsBilling?: { id: string; label: string; checked: boolean };
  savedAddresses?: AddressChoice[];
  deliveryOptions?: DeliveryChoice[];
  summaryByDeliveryId?: Record<string, CheckoutSummary>;
  inlineActions?: CheckoutInlineAction[];
  supportingRows?: Array<{ id: string; label: string }>;
};
export type PaymentPayload = {
  selectedMethodId: string;
  methods: PaymentMethodChoice[];
  savedMethods?: SavedMethodChoice[];
  cardFields?: CheckoutFieldRef[];
  saveMethod?: { id: string; label: string };
  methodPanels?: Array<{ methodId: string; fields: CheckoutFieldRef[]; description?: string }>;
  notices?: CheckoutNotice[];
  acknowledgementNoticeId?: string;
  presentation?: "standard" | "selection-only" | "fields-only";
  selectionStateKey?: string;
  summaryByMethodId?: Record<string, CheckoutSummary>;
  proof?: CheckoutNotice;
  wideMethods?: PaymentMethodChoice[];
  wideProof?: CheckoutNotice;
  systemProof?: { systemKey: "ui_checkout_proof"; title: string; description: string };
  wideSystemProof?: { systemKey: "ui_checkout_proof"; title: string; description: string };
  inlineActions?: CheckoutInlineAction[];
};
export type ReviewPayload = {
  promotions?: CheckoutNotice[];
  upsells?: Array<{ id: string; label: string; description: string; actionLabel: string }>;
  allowCartEditing: boolean;
};
export type ConfirmationPayload = {
  orderReferenceLabel?: string;
  orderReferenceValue?: string;
  contactLabel?: string;
  contactValue?: string;
  placedAtLabel?: string;
  placedAtValue?: string;
  deliveryAddress?: AddressSnapshot;
  billingAddress?: AddressSnapshot;
  deliveryMethod?: string;
  receipt?: { title: string; description: string; acknowledgement?: string };
  fulfillmentGroups?: Array<{ id: string; title: string; rows: Array<{ id: string; label: string; value: string }> }>;
  lines: CartLineRef[];
};
export type CheckoutStepBase = { id: string; label: string; actions: CheckoutStepAction[] };
export type CheckoutStep = CheckoutStepBase & (
  | { kind: "review"; payload: ReviewPayload }
  | { kind: "details"; payload: DetailsPayload }
  | { kind: "delivery"; payload: DeliveryPayload }
  | { kind: "payment"; payload: PaymentPayload }
  | { kind: "confirmation"; payload: ConfirmationPayload }
);

export type CheckoutCommit = {
  paymentStepId: string;
  amountSource: "summary.total";
  label: string;
  processingLabel: string;
  lockedLabel: string;
};
export type CheckoutMediaSeat = {
  id: string;
  role: "product-thumbnail" | "payment-mark" | "step-icon";
  alt: string;
  assetKey?: string;
  systemMarkKey?: string;
  aspect: "1:1" | "contain";
};
export type CheckoutAnnouncements = {
  processing: string;
  success: string;
  cartRemoved?: string;
  cartRestored?: string;
  methodDeleted?: string;
  methodDeleteCancelled?: string;
};
export type CheckoutStress = {
  title?: string;
  secureContext?: string;
  steps?: CheckoutStep[];
  cart?: CheckoutCart;
  summary?: CheckoutSummary;
  fieldErrors?: Record<string, string>;
  commitState?: "idle" | "processing" | "locked";
  announcements?: Partial<CheckoutAnnouncements>;
};
export type CheckoutFlowFixture = {
  sourceKey: CheckoutFlowSourceKey;
  preset: CheckoutPreset;
  title: string;
  secureContext: string;
  entryStepId: string;
  steps: CheckoutStep[];
  cart?: CheckoutCart;
  summary: CheckoutSummary;
  commit: CheckoutCommit;
  announcements: CheckoutAnnouncements;
  media: CheckoutMediaSeat[];
  stress: { short: CheckoutStress; longLocale: CheckoutStress; error: CheckoutStress; processing: CheckoutStress };
};
export type CheckoutStressKey = keyof CheckoutFlowFixture["stress"];
export type ResolvedCheckoutFlowFixture = Omit<CheckoutFlowFixture, "announcements"> & {
  announcements: CheckoutAnnouncements;
  fieldErrors: Record<string, string>;
  commitState: "idle" | "processing" | "locked";
  calculatedTotal: Money;
};
export type CheckoutFlowRenderFixture = Omit<ResolvedCheckoutFlowFixture, "sourceKey" | "preset" | "stress"> & {
  sourceKey: CheckoutFlowRuntimeSourceKey;
  preset: CheckoutFlowRuntimePreset;
  wideEntryStepId?: string;
  stress?: CheckoutFlowFixture["stress"];
  adapter?: {
    id: "multi-step-form-03-to-checkout-flow" | "shopping-cart-03-to-checkout-flow";
    why: string;
  };
  cartPricing?: { taxBasisPoints: number };
};
export type AdaptedCheckoutFlowFixture = CheckoutFlowRenderFixture & {
  sourceKey: CheckoutFlowAdapterSourceKey;
  preset: "checkout-cart-address-payment" | "plan-payment";
  adapter: NonNullable<CheckoutFlowRenderFixture["adapter"]>;
};

const SOURCE_CONTRACT: Record<CheckoutFlowSourceKey, {
  preset: CheckoutPreset;
  stepKinds: string;
  actions: string;
  summaryKinds: string;
  cartLines: number;
  mediaRoles: string;
}> = {
  "checkout-page-01": { preset: "cart-payment", stepKinds: "review|payment", actions: "next|back,commit", summaryKinds: "subtotal|shipping|discount", cartLines: 3, mediaRoles: "product-thumbnail|product-thumbnail|product-thumbnail" },
  "checkout-page-02": { preset: "saved-methods", stepKinds: "payment", actions: "commit", summaryKinds: "subtotal|discount|pickup|tax", cartLines: 0, mediaRoles: "payment-mark|payment-mark|payment-mark|payment-mark" },
  "checkout-page-03": { preset: "guided-details", stepKinds: "details|delivery|payment", actions: "next|back,next|back,commit", summaryKinds: "subtotal|shipping|discount", cartLines: 3, mediaRoles: "product-thumbnail|product-thumbnail|product-thumbnail" },
  "checkout-page-04": { preset: "full-journey", stepKinds: "review|delivery|delivery|payment|confirmation", actions: "next|back,next|back,next|back,commit|", summaryKinds: "subtotal|shipping|discount", cartLines: 2, mediaRoles: "product-thumbnail|product-thumbnail|step-icon|step-icon|step-icon|step-icon" },
};
const META_ROLES: CheckoutLineMetaRole[] = ["seller", "stock", "rating", "previous-price"];

const requireText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const exact = (actual: unknown[], expected: unknown[], label: string, sourceKey: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${sourceKey} has invalid ${label}.`);
};

function validateMoney(value: Money, label: string, sourceKey: string) {
  if (!Number.isInteger(value.amountMinor) || value.amountMinor < 0) throw new Error(`${sourceKey} ${label} requires non-negative integer minor units.`);
  requireText(value.currency, `${label} currency`, sourceKey);
}

export function calculateCheckoutTotal(summary: CheckoutSummary, sourceKey = "checkout-flow"): Money {
  if (!summary.rows.length) throw new Error(`${sourceKey} requires summary rows.`);
  const currency = summary.total.currency;
  let amountMinor = 0;
  unique(summary.rows.map(({ id }) => id), "summary row IDs", sourceKey);
  for (const row of summary.rows) {
    validateMoney(row.amount, `summary row ${row.id}`, sourceKey);
    if (row.amount.currency !== currency) throw new Error(`${sourceKey} summary row ${row.id} currency drifts from total currency.`);
    amountMinor += (row.kind === "discount" ? -1 : 1) * row.amount.amountMinor;
  }
  validateMoney(summary.total, "summary total", sourceKey);
  return { currency, amountMinor };
}

function fieldsOf(step: CheckoutStep): CheckoutFieldRef[] {
  if (step.kind === "details") return step.payload.fields;
  if (step.kind === "delivery") return step.payload.fields ?? [];
  if (step.kind === "payment") return [
    ...(step.payload.cardFields ?? []),
    ...(step.payload.methodPanels ?? []).flatMap(({ fields }) => fields),
  ];
  return [];
}

function validateField(field: CheckoutFieldRef, sourceKey: string) {
  requireText(field.id, "field ID", sourceKey);
  requireText(field.label, `field ${field.id} label`, sourceKey);
  requireText(field.autocomplete, `field ${field.id} autocomplete`, sourceKey);
  requireText(field.inputMode, `field ${field.id} inputMode`, sourceKey);
  if (field.kind === "select" && !field.options?.length) throw new Error(`${sourceKey} select ${field.id} requires options.`);
  if (field.options) unique(field.options.map(({ id }) => id), `option IDs in ${field.id}`, sourceKey);
}

function validateLine(line: CartLineRef, mediaIds: Set<string>, currency: string, sourceKey: string) {
  requireText(line.id, "cart line ID", sourceKey);
  requireText(line.title, `line ${line.id} title`, sourceKey);
  if (!mediaIds.has(line.mediaId)) throw new Error(`${sourceKey} cannot resolve media seat ${line.mediaId}.`);
  validateMoney(line.unitPrice, `line ${line.id} price`, sourceKey);
  if (line.unitPrice.currency !== currency) throw new Error(`${sourceKey} line ${line.id} currency drifts from summary.`);
  const { value, min, max } = line.quantity;
  if (![value, min, max].every(Number.isInteger) || min < 1 || min > max || value < min || value > max) throw new Error(`${sourceKey} line ${line.id} has invalid quantity bounds.`);
  if (!line.meta.length) throw new Error(`${sourceKey} line ${line.id} requires metadata.`);
  const typed = line.meta.filter((item): item is CheckoutLineMeta => typeof item !== "string");
  unique(typed.map(({ id }) => id), `metadata IDs in ${line.id}`, sourceKey);
  for (const meta of typed) {
    requireText(meta.label, `metadata ${meta.id} label`, sourceKey);
    requireText(meta.value, `metadata ${meta.id} value`, sourceKey);
  }
}

function validateMedia(fixture: ResolvedCheckoutFlowFixture) {
  const { sourceKey, media } = fixture;
  unique(media.map(({ id }) => id), "media seat IDs", sourceKey);
  for (const seat of media) {
    requireText(seat.alt, `media ${seat.id} alternative`, sourceKey);
    const key = seat.assetKey ?? seat.systemMarkKey;
    requireText(key, `media ${seat.id} runtime key`, sourceKey);
    if (/^https?:\/\//i.test(key!)) throw new Error(`${sourceKey} media ${seat.id} cannot use a remote URL.`);
    if (seat.role === "product-thumbnail" && (!seat.assetKey || seat.systemMarkKey)) throw new Error(`${sourceKey} product media ${seat.id} requires only assetKey.`);
    if (seat.role !== "product-thumbnail" && (!seat.systemMarkKey || seat.assetKey)) throw new Error(`${sourceKey} system media ${seat.id} requires only systemMarkKey.`);
  }
}

function validatePayment(payload: PaymentPayload, mediaIds: Set<string>, sourceKey: string) {
  const choices = [...payload.methods, ...(payload.savedMethods ?? [])];
  unique(choices.map(({ id }) => id), "payment choice IDs", sourceKey);
  const selected = choices.find(({ id }) => id === payload.selectedMethodId);
  if (!selected || selected.disabled) throw new Error(`${sourceKey} cannot resolve selected payment method ${payload.selectedMethodId}.`);
  for (const choice of choices) {
    requireText(choice.label, `payment choice ${choice.id} label`, sourceKey);
    if (choice.disabled && !choice.disabledReason) throw new Error(`${sourceKey} disabled payment method ${choice.id} requires a reason.`);
    if (choice.markId && !mediaIds.has(choice.markId)) throw new Error(`${sourceKey} cannot resolve payment mark ${choice.markId}.`);
  }
  for (const panel of payload.methodPanels ?? []) if (!payload.methods.some(({ id }) => id === panel.methodId)) throw new Error(`${sourceKey} cannot resolve method panel ${panel.methodId}.`);
  unique((payload.notices ?? []).map(({ id }) => id), "payment notice IDs", sourceKey);
  if (payload.acknowledgementNoticeId && !payload.notices?.some(({ id }) => id === payload.acknowledgementNoticeId)) throw new Error(`${sourceKey} cannot resolve acknowledgement notice ${payload.acknowledgementNoticeId}.`);
}

function validateExactSource(fixture: ResolvedCheckoutFlowFixture) {
  const { sourceKey, steps, cart, media } = fixture;
  const contract = SOURCE_CONTRACT[sourceKey];
  if (fixture.preset !== contract.preset) throw new Error(`${sourceKey} has the wrong checkout preset.`);
  if (steps.map(({ kind }) => kind).join("|") !== contract.stepKinds) throw new Error(`${sourceKey} has invalid exact step inventory.`);
  if (steps.map(({ actions }) => actions.map(({ kind }) => kind).join(",")).join("|") !== contract.actions) throw new Error(`${sourceKey} has invalid exact stage action ownership.`);
  if (fixture.summary.rows.map(({ kind }) => kind).join("|") !== contract.summaryKinds) throw new Error(`${sourceKey} has invalid exact summary inventory.`);
  if ((cart?.lines.length ?? 0) !== contract.cartLines) throw new Error(`${sourceKey} has invalid exact cart line inventory.`);
  if (media.map(({ role }) => role).join("|") !== contract.mediaRoles) throw new Error(`${sourceKey} has invalid exact media seat inventory.`);

  const payment = steps.find((step): step is CheckoutStep & { kind: "payment" } => step.kind === "payment")?.payload;
  if (!payment) throw new Error(`${sourceKey} requires a payment payload.`);
  if (sourceKey === "checkout-page-01" && (payment.methods.length !== 3 || payment.cardFields?.length !== 5 || !cart?.coupon)) throw new Error(`${sourceKey} requires 3 methods, 5 card fields and one coupon.`);
  if (sourceKey === "checkout-page-02" && (payment.methods.length !== 1 || payment.savedMethods?.length !== 4 || payment.cardFields?.length !== 4 || payment.notices?.length !== 2 || cart)) throw new Error(`${sourceKey} requires 4 saved methods, one new route, 4 card fields, 2 notices and no cart.`);
  if (sourceKey === "checkout-page-03") {
    const details = steps.find((step) => step.kind === "details");
    const delivery = steps.find((step) => step.kind === "delivery");
    if (details?.kind !== "details" || details.payload.fields.length !== 9 || delivery?.kind !== "delivery" || delivery.payload.fields?.length !== 9 || !delivery.payload.sameAsBilling || payment.methods.length !== 1 || payment.cardFields?.length !== 4 || payment.notices?.length !== 1 || !cart?.coupon) throw new Error(`${sourceKey} requires exact 9/9/4 guided field anatomy.`);
  }
  if (sourceKey === "checkout-page-04") {
    const review = steps[0];
    const address = steps[1];
    const delivery = steps[2];
    const confirmation = steps[4];
    if (review?.kind !== "review" || review.payload.promotions?.length !== 1 || review.payload.promotions[0]?.offers?.length !== 2 || review.payload.upsells?.length !== 2 || address?.kind !== "delivery" || address.payload.savedAddresses?.length !== 2 || delivery?.kind !== "delivery" || delivery.payload.deliveryOptions?.length !== 3 || payment.methods.length !== 3 || payment.cardFields?.length !== 4 || !payment.saveMethod || payment.methodPanels?.length !== 1 || payment.methodPanels[0]?.fields.length !== 2 || confirmation?.kind !== "confirmation" || confirmation.payload.lines.length !== 2 || !cart?.coupon) throw new Error(`${sourceKey} requires exact full-journey inventory.`);
    for (const value of [confirmation.payload.orderReferenceValue, confirmation.payload.contactValue, confirmation.payload.placedAtValue]) requireText(value, "confirmation value", sourceKey);
    for (const line of [...cart.lines, ...confirmation.payload.lines]) {
      const typed = line.meta.filter((item): item is CheckoutLineMeta => typeof item !== "string");
      if (typed.length !== 4 || typed.length !== line.meta.length) throw new Error(`${sourceKey} line ${line.id} requires four typed metadata roles.`);
      exact(typed.map(({ role }) => role), META_ROLES, `metadata roles in ${line.id}`, sourceKey);
    }
    if (JSON.stringify(cart.lines.map(({ id, meta }) => ({ id, meta }))) !== JSON.stringify(confirmation.payload.lines.map(({ id, meta }) => ({ id, meta })))) throw new Error(`${sourceKey} cart and confirmation metadata must remain identical.`);
    exact(media.filter(({ role }) => role === "step-icon").map(({ systemMarkKey }) => systemMarkKey), ["cart", "address", "payment", "confirmation"], "step icon keys", sourceKey);
  }
}

function validateResolved(fixture: ResolvedCheckoutFlowFixture) {
  const { sourceKey, steps, cart, summary, media, announcements } = fixture;
  if (!CHECKOUT_FLOW_SOURCE_KEYS.includes(sourceKey)) throw new Error(`Unknown checkout source key: ${sourceKey}`);
  requireText(fixture.title, "title", sourceKey);
  requireText(fixture.secureContext, "secure context", sourceKey);
  unique(steps.map(({ id }) => id), "step IDs", sourceKey);
  const stepIds = new Set(steps.map(({ id }) => id));
  if (!stepIds.has(fixture.entryStepId)) throw new Error(`${sourceKey} cannot resolve entry step ${fixture.entryStepId}.`);
  const actions = steps.flatMap(({ actions }) => actions);
  unique(actions.map(({ id }) => id), "action IDs", sourceKey);
  for (const step of steps) {
    requireText(step.label, `step ${step.id} label`, sourceKey);
    for (const action of step.actions) {
      requireText(action.label, `action ${action.id} label`, sourceKey);
      if (action.stageId !== step.id) throw new Error(`${sourceKey} action ${action.id} is owned by the wrong stage.`);
    }
  }
  const commits = actions.filter(({ kind }) => kind === "commit");
  const paymentStep = steps.find(({ id }) => id === fixture.commit.paymentStepId);
  if (commits.length !== 1 || commits[0]?.stageId !== fixture.commit.paymentStepId || paymentStep?.kind !== "payment") throw new Error(`${sourceKey} requires one payment-owned commit action.`);
  const fields = steps.flatMap(fieldsOf);
  unique(fields.map(({ id }) => id), "field IDs", sourceKey);
  fields.forEach((field) => validateField(field, sourceKey));
  validateMedia(fixture);
  const mediaIds = new Set(media.map(({ id }) => id));
  const currency = summary.total.currency;
  for (const line of cart?.lines ?? []) validateLine(line, mediaIds, currency, sourceKey);
  for (const step of steps) {
    if (step.kind === "payment") validatePayment(step.payload, mediaIds, sourceKey);
    if (step.kind === "confirmation") for (const line of step.payload.lines) validateLine(line, mediaIds, currency, sourceKey);
  }
  if (cart) {
    unique(cart.lines.map(({ id }) => id), "cart line IDs", sourceKey);
    const subtotal = cart.lines.reduce((sum, line) => sum + line.unitPrice.amountMinor * line.quantity.value, 0);
    if (summary.rows.find(({ kind }) => kind === "subtotal")?.amount.amountMinor !== subtotal) throw new Error(`${sourceKey} subtotal must derive from cart lines.`);
  }
  const calculatedTotal = calculateCheckoutTotal(summary, sourceKey);
  if (summary.totalDerivation !== "computed" || calculatedTotal.amountMinor !== summary.total.amountMinor) throw new Error(`${sourceKey} summary total must equal computed minor-unit arithmetic.`);
  if (calculatedTotal.currency !== fixture.calculatedTotal.currency || calculatedTotal.amountMinor !== fixture.calculatedTotal.amountMinor) throw new Error(`${sourceKey} exposes stale calculated total.`);
  const errorRefs = new Set([...fields.map(({ id }) => id), ...(cart?.coupon ? [cart.coupon.id] : [])]);
  for (const id of Object.keys(fixture.fieldErrors)) if (!errorRefs.has(id)) throw new Error(`${sourceKey} error state references unknown control ${id}.`);
  const announcementKeys = Object.keys(announcements).sort();
  const expectedAnnouncements = sourceKey === "checkout-page-02" ? ["methodDeleteCancelled", "methodDeleted", "processing", "success"] : ["cartRemoved", "cartRestored", "processing", "success"];
  exact(announcementKeys, expectedAnnouncements, "announcement inventory", sourceKey);
  for (const [key, value] of Object.entries(announcements)) requireText(value, `announcement ${key}`, sourceKey);
  validateExactSource(fixture);
}

function mergeStress(fixture: CheckoutFlowFixture, stress?: CheckoutStressKey): ResolvedCheckoutFlowFixture {
  const patch = stress ? fixture.stress[stress] : undefined;
  const base = structuredClone(fixture);
  const next = patch ? { ...base, ...structuredClone(patch) } : base;
  const summary = next.summary;
  const commitState = patch?.commitState ?? "idle";
  const entryStepId = commitState === "processing" ? next.commit.paymentStepId : next.entryStepId;
  return {
    ...next,
    entryStepId,
    announcements: { ...base.announcements, ...(patch?.announcements ?? {}) },
    stress: fixture.stress,
    fieldErrors: { ...(patch?.fieldErrors ?? {}) },
    commitState,
    calculatedTotal: calculateCheckoutTotal(summary, fixture.sourceKey),
  };
}

export function resolveCheckoutFlowFixture(fixture: CheckoutFlowFixture, stress?: CheckoutStressKey): ResolvedCheckoutFlowFixture {
  if (!CHECKOUT_FLOW_SOURCE_KEYS.includes(fixture.sourceKey)) throw new Error(`Unknown checkout source key: ${fixture.sourceKey}`);
  if (Object.keys(fixture.stress).sort().join("|") !== "error|longLocale|processing|short") throw new Error(`${fixture.sourceKey} requires exact short, longLocale, error and processing stress states.`);
  const base = mergeStress(fixture);
  validateResolved(base);
  if (!stress) {
    for (const key of Object.keys(fixture.stress) as CheckoutStressKey[]) validateResolved(mergeStress(fixture, key));
    return base;
  }
  const resolved = mergeStress(fixture, stress);
  validateResolved(resolved);
  return resolved;
}
