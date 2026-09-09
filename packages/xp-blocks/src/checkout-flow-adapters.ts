"use client";

import {
  calculateCheckoutTotal,
  type AdaptedCheckoutFlowFixture,
  type CartLineRef,
  type CheckoutFieldRef,
  type CheckoutInlineAction,
  type CheckoutMediaSeat,
  type CheckoutStep,
  type CheckoutStepAction,
  type CheckoutSummary,
  type DeliveryChoice,
} from "./checkout-flow-model";
import type { CheckoutMediaMapRecord, ResolveCheckoutMediaSeat } from "./checkout-flow";
import {
  resolveMultiStepFormFixture,
  type CheckoutAddressPane,
  type CheckoutCartPane,
  type CheckoutConfirmationPane,
  type CheckoutPaymentPane,
  type MultiStepFormFixture,
} from "./multi-step-form-model";
import {
  calculateCheckout,
  resolveShoppingCartFixture,
  type CartStressKey,
  type CheckoutFixture,
  type Money,
  type ShoppingCartMediaMap,
} from "./shopping-cart-model";
import { defineWizard, type WizardDefinition } from "./wizard-shell";
import type { FormFieldModel } from "./form-surface-model";

export type MultiStepCheckoutStress = "short" | "longLocale" | "error" | "emptyCart" | "processing";
export type ShoppingCheckoutState = "error" | "pending" | "success";
export type CheckoutFlowAdapterResult = {
  model: AdaptedCheckoutFlowFixture;
  definition: WizardDefinition<string>;
  resolveMediaSeat: ResolveCheckoutMediaSeat;
};

function runtimeWizard<const Steps extends readonly { id: string }[]>(steps: Steps) {
  return defineWizard(steps) as unknown as WizardDefinition<string>;
}

export const MULTI_STEP_FORM_03_CHECKOUT_DEFINITION = runtimeWizard([
  { id: "s03-cart" },
  { id: "s03-address" },
  { id: "s03-payment" },
  { id: "s03-confirmation" },
] as const);

export const SHOPPING_CART_03_CHECKOUT_DEFINITION = runtimeWizard([
  { id: "shopping03-plan" },
  { id: "shopping03-payment" },
] as const);

const WHY = "Source03 keeps one CheckoutFlow and one WizardShell owner; the adapter translates source-owned inventory without a parallel renderer.";

function exact(actual: unknown[], expected: unknown[], label: string, sourceKey: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${sourceKey} adapter changed ${label}.`);
}

function summary(model: CheckoutCartPane["summary"] | CheckoutAddressPane["summary"] | CheckoutPaymentPane["summary"] | CheckoutConfirmationPane["summary"]): CheckoutSummary {
  const rows = model.rows.map((row) => ({
    id: row.id,
    label: row.label,
    kind: row.kind === "adjustment" ? "surcharge" as const : row.kind,
    amount: row.kind === "discount" ? { ...row.amount, amountMinor: Math.abs(row.amount.amountMinor) } : row.amount,
  }));
  const projected: CheckoutSummary = {
    rows,
    total: rows.reduce<Money>((total, row) => ({
      currency: total.currency,
      amountMinor: total.amountMinor + (row.kind === "discount" ? -row.amount.amountMinor : row.amount.amountMinor),
    }), { currency: rows[0]?.amount.currency ?? "USD", amountMinor: 0 }),
    totalDerivation: "computed",
    label: model.totalLabel,
  };
  calculateCheckoutTotal(projected);
  return projected;
}

function summaryWithShipping(base: CheckoutSummary, shipping: Money): CheckoutSummary {
  const rows = base.rows.map((row) => row.kind === "shipping" ? { ...row, amount: shipping } : row);
  return {
    ...base,
    rows,
    total: calculateCheckoutTotal({ ...base, rows }),
  };
}

function cartLine(line: CheckoutCartPane["lines"][number] | CheckoutConfirmationPane["lines"][number]): CartLineRef {
  const actions = [
    ...(line.actions?.remove ? ["remove" as const] : []),
    ...(line.actions?.saveForLater ? ["save-for-later" as const] : []),
  ];
  return {
    id: line.id,
    mediaId: `media-${line.media.assetKey}`,
    title: line.title,
    meta: line.meta.map((item) => ({ ...item, role: "detail" as const })),
    unitPrice: line.unitPrice,
    quantity: { value: line.quantity.value, min: line.quantity.min, max: line.quantity.max },
    actions,
    actionLabels: {
      ...(line.actions?.remove ? { remove: line.actions.remove.label } : {}),
      ...(line.actions?.saveForLater ? { "save-for-later": line.actions.saveForLater.label } : {}),
    },
  };
}

const FIELD_SEMANTICS: Record<string, Pick<CheckoutFieldRef, "autocomplete" | "inputMode">> = {
  "f03-card-number": { autocomplete: "cc-number", inputMode: "numeric" },
  "f03-card-name": { autocomplete: "cc-name", inputMode: "text" },
  "f03-card-expiry": { autocomplete: "cc-exp", inputMode: "numeric" },
  "f03-card-security": { autocomplete: "cc-csc", inputMode: "numeric" },
  "f03-account-token": { autocomplete: "off", inputMode: "text" },
  "f03-security-pin": { autocomplete: "off", inputMode: "numeric" },
  email: { autocomplete: "email", inputMode: "email" },
  card: { autocomplete: "cc-number", inputMode: "numeric" },
  cardholder: { autocomplete: "cc-name", inputMode: "text" },
  country: { autocomplete: "off", inputMode: "text" },
  postal: { autocomplete: "postal-code", inputMode: "text" },
  region: { autocomplete: "address-level1", inputMode: "text" },
  "tax-id": { autocomplete: "off", inputMode: "text" },
};

function field(model: FormFieldModel | CheckoutFixture["fields"][number]): CheckoutFieldRef {
  const semantics = FIELD_SEMANTICS[model.id];
  if (!semantics) throw new Error(`Checkout adapter lacks field semantics for ${model.id}.`);
  const sourceKind = "kind" in model ? model.kind : model.id === "email" ? "email" : model.id === "card" ? "card-number" : "text";
  const kind: CheckoutFieldRef["kind"] = sourceKind === "switch"
    ? "checkbox"
    : sourceKind === "password"
      ? "password"
      : sourceKind === "email"
        ? "email"
        : sourceKind === "card-number"
          ? "card-number"
          : "text";
  return {
    id: model.id,
    kind,
    label: model.label,
    required: model.required,
    span: "span" in model ? model.span : "full",
    ...semantics,
    ...(model.id === "f03-card-expiry" ? { kind: "card-expiry" as const } : {}),
    ...(model.id === "f03-card-security" ? { kind: "card-csc" as const } : {}),
    ...("help" in model && model.help ? { help: model.help } : {}),
    ...("error" in model && model.error ? { error: model.error } : {}),
  };
}

function stageActions(stepId: string, actions: MultiStepFormFixture["steps"][number]["pane"]["actions"]): CheckoutStepAction[] {
  return actions.map((action) => ({
    id: action.id,
    stageId: stepId,
    label: action.label,
    kind: action.behavior === "previous" ? "back" : action.behavior === "next" ? "next" : "commit",
  }));
}

function inlineActions(actions: Array<{ id: string; label: string; behavior: CheckoutInlineAction["kind"] | "save" }>): CheckoutInlineAction[] {
  return actions.map(({ id, label, behavior }) => ({ id, label, kind: behavior === "save" ? "save-for-later" : behavior }));
}

function parsePrice(value: string, currency: string, sourceKey: string): Money {
  const match = /^\$(\d+)\.(\d{2})$/.exec(value);
  if (!match) throw new Error(`${sourceKey} adapter cannot parse delivery price ${value}.`);
  return { currency, amountMinor: Number(match[1]) * 100 + Number(match[2]) };
}

const MULTI_MEDIA_RECORDS = {
  product_analog_filter: {
    assetId: "multi-step-form-03-analog-filter-rack",
    publicBase: "/media/multi-step-form-03-analog-filter-rack",
  },
  product_calibration_reel: {
    assetId: "multi-step-form-03-calibration-reel",
    publicBase: "/media/multi-step-form-03-calibration-reel",
  },
} as const;

export function createMultiStepForm03MediaResolver(_mediaMap: ShoppingCartMediaMap): ResolveCheckoutMediaSeat {
  return (seat: CheckoutMediaSeat): CheckoutMediaMapRecord => {
    if (!seat.assetKey) throw new Error(`${seat.id} requires a declared product asset key.`);
    const record = MULTI_MEDIA_RECORDS[seat.assetKey as keyof typeof MULTI_MEDIA_RECORDS];
    if (!record?.publicBase.startsWith("/media/")) throw new Error(`multi-step-form-03 cannot resolve ${seat.assetKey}.`);
    return {
      slug: "multi-step-form-03",
      key: seat.assetKey,
      kind: "product-thumb",
      assetId: record.assetId,
      publicBase: record.publicBase,
      alt: seat.alt,
    };
  };
}

const noShoppingMedia: ResolveCheckoutMediaSeat = (seat) => {
  throw new Error(`shopping-cart-03 declares no media seat ${seat.id}.`);
};

export function adaptMultiStepForm03(
  fixture: MultiStepFormFixture,
  mediaMap: ShoppingCartMediaMap,
  stress?: MultiStepCheckoutStress,
): CheckoutFlowAdapterResult {
  if (fixture.sourceKey !== "multi-step-form-03" || fixture.owner !== "CheckoutFlow") throw new Error("adaptMultiStepForm03 accepts only CheckoutFlow-owned multi-step-form-03.");
  const source = resolveMultiStepFormFixture(fixture, stress);
  const [cartStep, addressStep, paymentStep, confirmationStep] = source.steps;
  const cart = cartStep?.pane.body;
  const address = addressStep?.pane.body;
  const payment = paymentStep?.pane.body;
  const confirmation = confirmationStep?.pane.body;
  if (cart?.kind !== "checkout-cart" || address?.kind !== "checkout-address" || payment?.kind !== "checkout-payment" || confirmation?.kind !== "checkout-confirmation") throw new Error(`${source.sourceKey} adapter requires exact checkout pane order.`);

  const baseSummary = summary(cart.summary);
  const currency = baseSummary.total.currency;
  const subtotalMinor = baseSummary.rows.find(({ kind }) => kind === "subtotal")?.amount.amountMinor ?? 0;
  const taxMinor = baseSummary.rows.find(({ kind }) => kind === "tax")?.amount.amountMinor ?? 0;
  const taxBasisPoints = subtotalMinor ? (taxMinor * 10_000) / subtotalMinor : 0;
  if (!Number.isInteger(taxBasisPoints)) throw new Error(`${source.sourceKey} adapter requires an exact integer tax basis.`);
  const lines = cart.lines.map(cartLine);
  const media: CheckoutMediaSeat[] = source.media.map((item) => ({
    id: `media-${item.assetKey}`,
    role: "product-thumbnail",
    alt: item.alt,
    assetKey: item.assetKey,
    aspect: "1:1",
  }));
  const deliveryOptions: DeliveryChoice[] = address.deliveryChoices.options.map((option) => ({
    id: option.id,
    label: option.label,
    description: option.description ?? "",
    fee: parsePrice(option.price ?? "", currency, source.sourceKey),
    estimatedWindow: address.estimates.map(({ label }) => label).join(" · "),
  }));
  const addressInline = inlineActions([...address.addressActions, address.addAddressAction]);
  const paymentInline = inlineActions(payment.methodActions);
  const fieldErrors = source.state?.errorControlId
    ? Object.fromEntries([...payment.cardFields, ...payment.giftFields].filter(({ id }) => id === source.state?.errorControlId).map((item) => [item.id, item.error ?? source.copy.announcements.validationFailed]))
    : {};

  const steps: CheckoutStep[] = [
    {
      id: cartStep.id,
      label: cartStep.label,
      actions: stageActions(cartStep.id, cartStep.pane.actions),
      kind: "review",
      payload: {
        allowCartEditing: true,
        promotions: cart.offers.map((offer) => ({ id: offer.id, tone: "neutral", title: offer.title, description: offer.description })),
        upsells: [{ id: "gift-wrap", label: cart.giftWrap.title, description: cart.giftWrap.description, actionLabel: cart.giftWrap.action.label }],
      },
    },
    {
      id: addressStep.id,
      label: addressStep.label,
      actions: stageActions(addressStep.id, addressStep.pane.actions),
      kind: "delivery",
      payload: {
        savedAddresses: address.addresses.options.map((option) => ({ id: option.id, label: option.label, addressLines: [option.description ?? ""], management: [] })),
        deliveryOptions,
        summaryByDeliveryId: Object.fromEntries(deliveryOptions.map((option) => [option.id, summaryWithShipping(summary(address.summary), option.fee)])),
        inlineActions: addressInline,
        supportingRows: address.estimates.map(({ lineId, label }) => ({ id: lineId, label })),
      },
    },
    {
      id: paymentStep.id,
      label: paymentStep.label,
      actions: stageActions(paymentStep.id, paymentStep.pane.actions),
      kind: "payment",
      payload: {
        selectedMethodId: String(payment.methods.value),
        methods: payment.methods.options.map((option) => ({ id: option.id, label: option.label, description: option.description })),
        cardFields: payment.cardFields.map(field),
        saveMethod: { id: payment.cardSaveControl.id, label: payment.cardSaveControl.label },
        methodPanels: [{ methodId: "payment03-balance", fields: payment.giftFields.map(field) }],
        inlineActions: paymentInline,
      },
    },
    {
      id: confirmationStep.id,
      label: confirmationStep.label,
      actions: [],
      kind: "confirmation",
      payload: {
        receipt: {
          title: confirmation.receipt.title,
          description: confirmation.receipt.description,
          acknowledgement: confirmation.receipt.acknowledgement,
        },
        orderReferenceLabel: confirmation.receipt.referenceLabel,
        orderReferenceValue: confirmation.receipt.referenceValue,
        contactLabel: confirmation.receipt.contactLabel,
        contactValue: confirmation.receipt.contact,
        placedAtLabel: confirmation.receipt.timestampLabel,
        placedAtValue: confirmation.receipt.timestamp,
        fulfillmentGroups: confirmation.fulfillmentGroups,
        lines: confirmation.lines.map(cartLine),
      },
    },
  ];

  const model: AdaptedCheckoutFlowFixture = {
    sourceKey: "multi-step-form-03",
    preset: "checkout-cart-address-payment",
    adapter: { id: "multi-step-form-03-to-checkout-flow", why: WHY },
    cartPricing: { taxBasisPoints },
    title: source.copy.title,
    secureContext: source.copy.description ?? source.copy.progressLabel,
    entryStepId: source.state?.currentStepId ?? source.navigation.initialStepId,
    steps,
    cart: {
      lines,
      coupon: {
        id: cart.promotion.field.id,
        label: cart.summary.coupon?.label ?? cart.promotion.field.label,
        fieldLabel: cart.promotion.field.label,
        actionLabel: cart.promotion.action.label,
      },
      emptyState: { title: cart.empty.title, description: cart.empty.description, actionLabel: cart.empty.action.label },
    },
    summary: baseSummary,
    commit: {
      paymentStepId: paymentStep.id,
      amountSource: "summary.total",
      label: paymentStep.pane.actions.find(({ behavior }) => behavior === "submit")!.label,
      processingLabel: source.copy.processingLabel,
      lockedLabel: source.copy.processingLabel,
    },
    announcements: { processing: source.copy.announcements.processing, success: source.copy.announcements.submitted },
    media,
    fieldErrors,
    commitState: source.state?.processing ? "processing" : "idle",
    calculatedTotal: calculateCheckoutTotal(baseSummary, source.sourceKey),
  };
  validateMultiAdapter(source, model, stress === "emptyCart");
  const resolveMediaSeat = createMultiStepForm03MediaResolver(mediaMap);
  for (const seat of media) resolveMediaSeat(seat);
  return { model, definition: MULTI_STEP_FORM_03_CHECKOUT_DEFINITION, resolveMediaSeat };
}

function validateMultiAdapter(source: MultiStepFormFixture, model: AdaptedCheckoutFlowFixture, empty: boolean) {
  exact(model.steps.map(({ id }) => id), source.steps.map(({ id }) => id), "step IDs/order", source.sourceKey);
  exact(model.steps.map(({ kind }) => kind), ["review", "delivery", "payment", "confirmation"], "step kinds", source.sourceKey);
  exact(model.steps.map(({ actions }) => actions.map(({ kind }) => kind).join(",")), ["next", "back,next", "back,commit", ""], "stage action ownership", source.sourceKey);
  if ((model.cart?.lines.length ?? 0) !== (empty ? 0 : 2)) throw new Error(`${source.sourceKey} adapter changed cart line count.`);
  const delivery = model.steps[1]?.kind === "delivery" ? model.steps[1].payload : undefined;
  const payment = model.steps[2]?.kind === "payment" ? model.steps[2].payload : undefined;
  const confirmation = model.steps[3]?.kind === "confirmation" ? model.steps[3].payload : undefined;
  if (delivery?.savedAddresses?.length !== 2 || delivery.deliveryOptions?.length !== 3 || delivery.supportingRows?.length !== 2 || delivery.inlineActions?.length !== 5) throw new Error(`${source.sourceKey} adapter changed address inventory.`);
  if (payment?.methods.length !== 3 || payment.cardFields?.length !== 4 || payment.methodPanels?.[0]?.fields.length !== 2 || payment.inlineActions?.length !== 3) throw new Error(`${source.sourceKey} adapter changed payment inventory.`);
  if (confirmation?.fulfillmentGroups?.length !== 3 || confirmation.lines.length !== 2) throw new Error(`${source.sourceKey} adapter changed confirmation inventory.`);
  if (model.steps.flatMap(({ actions }) => actions).filter(({ kind }) => kind === "commit").length !== 1) throw new Error(`${source.sourceKey} adapter requires one payment-owned commit.`);
}

function planSummary(fixture: CheckoutFixture, planId: string): CheckoutSummary {
  const result = calculateCheckout({ ...fixture, selectedPlanId: planId });
  return {
    rows: [
      { id: `${planId}-subtotal`, label: fixture.proof.title, kind: "subtotal", amount: result.calculated.subtotal },
      { id: `${planId}-tax`, label: fixture.proof.description, kind: "tax", amount: result.calculated.tax },
    ],
    total: result.calculated.total,
    totalDerivation: "computed",
    label: fixture.copy.heading,
  };
}

export function adaptShoppingCart03(
  fixture: CheckoutFixture,
  mediaMap: ShoppingCartMediaMap,
  options: { stress?: CartStressKey; state?: ShoppingCheckoutState } = {},
): CheckoutFlowAdapterResult {
  if (fixture.sourceKey !== "shopping-cart-03" || fixture.owner !== "CheckoutFlow") throw new Error("adaptShoppingCart03 accepts only CheckoutFlow-owned shopping-cart-03.");
  const stressed = options.stress === "hugePrice"
    ? { ...fixture, plans: fixture.plans.map((plan) => ({ ...plan, price: { ...plan.price, amountMinor: plan.price.amountMinor * 1000 } })) }
    : fixture;
  const source = resolveShoppingCartFixture(stressed, mediaMap, options.stress === "short" || options.stress === "longLocale" ? options.stress : undefined);
  if (source.sourceKey !== "shopping-cart-03") throw new Error("shopping-cart-03 adapter resolved the wrong source.");
  const summaries = Object.fromEntries(source.plans.map(({ id }) => [id, planSummary(source, id)]));
  const selectedSummary = summaries[source.selectedPlanId];
  const selectionStateKey = "shopping03-selected-plan";
  const steps: CheckoutStep[] = [
    {
      id: "shopping03-plan",
      label: source.proof.title,
      actions: [{ id: "shopping03-plan-next", stageId: "shopping03-plan", label: source.actions.continueLabel, kind: "next" }],
      kind: "payment",
      payload: {
        presentation: "selection-only",
        selectionStateKey,
        selectedMethodId: source.selectedPlanId,
        methods: source.plans.map((plan) => ({ id: plan.id, label: plan.label, description: plan.description })),
        systemProof: { systemKey: "ui_checkout_proof", title: source.proof.title, description: source.proof.description },
        summaryByMethodId: summaries,
      },
    },
    {
      id: "shopping03-payment",
      label: source.copy.heading,
      actions: [
        { id: "shopping03-payment-back", stageId: "shopping03-payment", label: source.actions.backLabel, kind: "back" },
        { id: "shopping03-payment-commit", stageId: "shopping03-payment", label: source.actions.payLabel, kind: "commit" },
      ],
      kind: "payment",
      payload: {
        presentation: "fields-only",
        selectionStateKey,
        selectedMethodId: source.selectedPlanId,
        methods: [],
        wideMethods: source.plans.map((plan) => ({ id: plan.id, label: plan.label, description: plan.description })),
        wideSystemProof: { systemKey: "ui_checkout_proof", title: source.proof.title, description: source.proof.description },
        cardFields: source.fields.map(field),
        summaryByMethodId: summaries,
        notices: options.state === "success" ? [{ id: "shopping03-success", tone: "positive", title: source.states.success, description: source.proof.description }] : undefined,
      },
    },
  ];
  const stateCopy = options.state ? source.states[options.state] : undefined;
  const model: AdaptedCheckoutFlowFixture = {
    sourceKey: "shopping-cart-03",
    preset: "plan-payment",
    adapter: { id: "shopping-cart-03-to-checkout-flow", why: WHY },
    title: source.copy.heading,
    secureContext: source.proof.description,
    entryStepId: options.state ? "shopping03-payment" : "shopping03-plan",
    wideEntryStepId: "shopping03-payment",
    steps,
    summary: selectedSummary,
    commit: {
      paymentStepId: "shopping03-payment",
      amountSource: "summary.total",
      label: source.actions.payLabel,
      processingLabel: source.states.pending,
      lockedLabel: source.states.pending,
    },
    announcements: { processing: source.states.pending, success: source.states.success },
    media: [],
    fieldErrors: options.state === "error" ? { card: stateCopy ?? source.states.error } : {},
    commitState: options.state === "pending" ? "processing" : "idle",
    calculatedTotal: selectedSummary.total,
  };
  validateShoppingAdapter(source, model);
  return { model, definition: SHOPPING_CART_03_CHECKOUT_DEFINITION, resolveMediaSeat: noShoppingMedia };
}

function validateShoppingAdapter(source: CheckoutFixture, model: AdaptedCheckoutFlowFixture) {
  exact(model.steps.map(({ kind }) => kind), ["payment", "payment"], "step kinds", source.sourceKey);
  exact(model.steps.map(({ actions }) => actions.map(({ kind }) => kind).join(",")), ["next", "back,commit"], "stage action ownership", source.sourceKey);
  const plan = model.steps[0]?.kind === "payment" ? model.steps[0].payload : undefined;
  const payment = model.steps[1]?.kind === "payment" ? model.steps[1].payload : undefined;
  if (plan?.presentation !== "selection-only" || plan.methods.length !== 3 || Object.keys(plan.summaryByMethodId ?? {}).length !== 3) throw new Error(`${source.sourceKey} adapter changed plan inventory.`);
  if (payment?.presentation !== "fields-only" || payment.methods.length !== 0 || payment.wideMethods?.length !== 3 || payment.cardFields?.length !== 7) throw new Error(`${source.sourceKey} adapter changed payment field inventory.`);
  if (plan.selectionStateKey !== payment.selectionStateKey || plan.selectedMethodId !== payment.selectedMethodId) throw new Error(`${source.sourceKey} adapter split selected-plan ownership.`);
  if (model.steps.flatMap(({ actions }) => actions).filter(({ kind }) => kind === "commit").length !== 1) throw new Error(`${source.sourceKey} adapter requires one payment-owned commit.`);
}
