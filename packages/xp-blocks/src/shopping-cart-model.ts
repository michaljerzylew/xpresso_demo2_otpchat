export const SHOPPING_CART_SOURCE_KEYS = [
  "shopping-cart-01",
  "shopping-cart-02",
  "shopping-cart-03",
  "shopping-cart-04",
] as const;

export type ShoppingCartSourceKey = (typeof SHOPPING_CART_SOURCE_KEYS)[number];
export type Money = { amountMinor: number; currency: string };
export type CartMedia = { assetKey: string; alt: string };
export type CartMeta = { id: string; label: string; value: string };
export type CartQuantity = {
  value: number;
  min: number;
  max: number;
  step: number;
  inputLabel: string;
  decrementLabel: string;
  incrementLabel: string;
};
export type CartVariantOption = { id: string; label: string };
export type CartVariantEditor = {
  label: string;
  selectedId: string;
  options: CartVariantOption[];
  readOnly?: boolean;
};
export type CartLineModel = {
  id: string;
  title: string;
  media: CartMedia;
  meta: CartMeta[];
  unitPrice: Money;
  quantity: CartQuantity;
  selection?: { selected: boolean; label: string };
  variantEditor?: CartVariantEditor;
  fulfillment?: { label: string; iconKey?: string };
  actions?: {
    remove?: { label: string };
    saveForLater?: { label: string };
  };
};

export type SummaryRowKind = "subtotal" | "tax" | "discount" | "shipping" | "adjustment";
export type SummaryRow = { id: string; label: string; kind: SummaryRowKind; amount: Money };
export type CartSummaryModel = {
  rows: SummaryRow[];
  totalLabel: string;
  primaryAction: { id: string; label: string };
  secondaryAction?: { id: string; label: string };
  coupon?: {
    label: string;
    fieldLabel: string;
    applyLabel: string;
    removeLabel: string;
  };
  trustMethods?: Array<{ id: string; label: string; iconKey: string }>;
};

export type CartCopy = {
  heading: string;
  itemCountLabel: string;
  emptyHeading: string;
  emptyBody: string;
  undoLabel: string;
  updateAnnouncement: string;
  errorSummaryLabel: string;
};
export type CartStateCopy = {
  empty: string;
  removal?: string;
  couponInvalid?: string;
  couponApplied?: string;
  quantityMin: string;
  quantityMax?: string;
  pending?: string;
  success?: string;
};
export type CartCopySet<T> = T & { short: T; longLocale: T };
export type CartStressKey = "short" | "longLocale" | "hugePrice" | "quantityAtMin" | "quantityAtMax";
export type CartFixtureStress = {
  longLocale: boolean;
  hugePrice: boolean;
  quantityAtMin: boolean;
  quantityAtMax: boolean;
};

export type CartFixture = {
  sourceKey: "shopping-cart-01" | "shopping-cart-02" | "shopping-cart-04";
  owner: "CartSurface";
  preset: "cart-page" | "cart-drawer" | "compact-overlay";
  items: CartLineModel[];
  pricing: {
    currency: string;
    taxBasisPoints?: number;
    discountBasisPoints?: number;
    shippingMinor: number;
  };
  summary: CartSummaryModel;
  copy: CartCopySet<CartCopy>;
  states: CartCopySet<CartStateCopy>;
  stress: CartFixtureStress;
};

export type CheckoutPlan = { id: string; label: string; description: string; price: Money };
export type CheckoutField = {
  id: "email" | "card" | "cardholder" | "country" | "postal" | "region" | "tax-id";
  label: string;
  required: boolean;
};
export type CheckoutFixture = {
  sourceKey: "shopping-cart-03";
  owner: "CheckoutFlow";
  preset: "plan-payment";
  proof: { kind: "system-ui"; title: string; description: string };
  plans: CheckoutPlan[];
  selectedPlanId: string;
  fields: CheckoutField[];
  pricing: { taxBasisPoints: number };
  actions: { continueLabel: string; backLabel: string; payLabel: string };
  copy: { heading: string; short: { heading: string }; longLocale: { heading: string } };
  states: CartCopySet<{ error: string; pending: string; success: string }>;
  stress: CartFixtureStress;
};

export type ShoppingCartFixture = CartFixture | CheckoutFixture;
export type ProductMediaRecord = {
  key: string;
  kind: "product-thumb";
  assetId: string;
  presentation: "square-cover-center";
  publicBase: string;
  alt: string;
};
export type ShoppingCartMediaRecord = ProductMediaRecord & {
  slug: Exclude<ShoppingCartSourceKey, "shopping-cart-03">;
};
export type ShoppingCartMediaMap = {
  version: "shopping-cart-media-v1";
  generatedAt: string;
  records: ShoppingCartMediaRecord[];
};

export type CalculatedCart = {
  lineTotals: Record<string, Money>;
  subtotal: Money;
  tax: Money;
  discount: Money;
  shipping: Money;
  total: Money;
};
export type ResolvedCartFixture = CartFixture & {
  calculated: CalculatedCart;
  resolvedMedia: ShoppingCartMediaRecord[];
};
export type ResolvedCheckoutFixture = CheckoutFixture & {
  selectedPlan: CheckoutPlan;
  calculated: { subtotal: Money; tax: Money; total: Money };
};
export type ResolvedShoppingCartFixture = ResolvedCartFixture | ResolvedCheckoutFixture;

const SOURCE_PRESETS: Record<ShoppingCartSourceKey, ShoppingCartFixture["preset"]> = {
  "shopping-cart-01": "cart-page",
  "shopping-cart-02": "cart-drawer",
  "shopping-cart-03": "plan-payment",
  "shopping-cart-04": "compact-overlay",
};
const CHECKOUT_FIELD_IDS = ["email", "card", "cardholder", "country", "postal", "region", "tax-id"];

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const money = (amountMinor: number, currency: string): Money => ({ amountMinor, currency });
const basisPoints = (amountMinor: number, value = 0) => Math.round((amountMinor * value) / 10_000);

function validateMoney(value: Money, label: string, sourceKey: string) {
  if (!Number.isInteger(value.amountMinor) || value.amountMinor < 0) throw new Error(`${sourceKey} ${label} requires non-negative integer minor units.`);
  required(value.currency, `${label} currency`, sourceKey);
}

function validateLine(line: CartLineModel, currency: string, sourceKey: CartFixture["sourceKey"]) {
  required(line.id, "line ID", sourceKey);
  required(line.title, `line ${line.id} title`, sourceKey);
  required(line.media.assetKey, `line ${line.id} media key`, sourceKey);
  required(line.media.alt, `line ${line.id} media alternative`, sourceKey);
  validateMoney(line.unitPrice, `line ${line.id} price`, sourceKey);
  if (line.unitPrice.currency !== currency) throw new Error(`${sourceKey} line ${line.id} currency drifts from pricing currency.`);
  const quantity = line.quantity;
  if (![quantity.value, quantity.min, quantity.max, quantity.step].every(Number.isInteger) || quantity.min < 1 || quantity.min > quantity.max || quantity.step < 1 || quantity.value < quantity.min || quantity.value > quantity.max) {
    throw new Error(`${sourceKey} line ${line.id} has invalid quantity boundaries.`);
  }
  required(quantity.inputLabel, `line ${line.id} quantity label`, sourceKey);
  required(quantity.decrementLabel, `line ${line.id} decrement label`, sourceKey);
  required(quantity.incrementLabel, `line ${line.id} increment label`, sourceKey);
  unique(line.meta.map(({ id }) => id), `metadata IDs in line ${line.id}`, sourceKey);
  if (line.variantEditor) {
    unique(line.variantEditor.options.map(({ id }) => id), `variant option IDs in line ${line.id}`, sourceKey);
    if (!line.variantEditor.options.some(({ id }) => id === line.variantEditor?.selectedId)) throw new Error(`${sourceKey} line ${line.id} cannot resolve its selected variant.`);
  }
}

export function calculateCart(fixture: Pick<CartFixture, "items" | "pricing">): CalculatedCart {
  const currency = fixture.pricing.currency;
  const lineTotals = Object.fromEntries(fixture.items.map((line) => [line.id, money(line.unitPrice.amountMinor * line.quantity.value, currency)]));
  const subtotalMinor = Object.values(lineTotals).reduce((sum, value) => sum + value.amountMinor, 0);
  const taxMinor = basisPoints(subtotalMinor, fixture.pricing.taxBasisPoints);
  const discountMinor = basisPoints(subtotalMinor, fixture.pricing.discountBasisPoints);
  const shippingMinor = fixture.pricing.shippingMinor;
  return {
    lineTotals,
    subtotal: money(subtotalMinor, currency),
    tax: money(taxMinor, currency),
    discount: money(discountMinor, currency),
    shipping: money(shippingMinor, currency),
    total: money(subtotalMinor + taxMinor - discountMinor + shippingMinor, currency),
  };
}

export function calculateCheckout(fixture: CheckoutFixture) {
  const selectedPlan = fixture.plans.find(({ id }) => id === fixture.selectedPlanId);
  if (!selectedPlan) throw new Error(`${fixture.sourceKey} cannot resolve selected plan ${fixture.selectedPlanId}.`);
  const subtotal = selectedPlan.price;
  const tax = money(basisPoints(subtotal.amountMinor, fixture.pricing.taxBasisPoints), subtotal.currency);
  return { selectedPlan, calculated: { subtotal, tax, total: money(subtotal.amountMinor + tax.amountMinor, subtotal.currency) } };
}

function validateCartContract(fixture: CartFixture, mediaMap: ShoppingCartMediaMap) {
  const sourceKey = fixture.sourceKey;
  if (fixture.owner !== "CartSurface") throw new Error(`${sourceKey} must resolve to CartSurface.`);
  if (sourceKey === "shopping-cart-01" && fixture.items.length !== 3) throw new Error(`${sourceKey} requires exact 3-line selection, fulfilment, coupon and trust anatomy.`);
  if (sourceKey === "shopping-cart-02" && fixture.items.length !== 4) throw new Error(`${sourceKey} requires exact 4-line variant drawer anatomy.`);
  if (sourceKey === "shopping-cart-04" && (fixture.items.length !== 3 || fixture.items.some(({ actions }) => actions?.remove))) throw new Error(`${sourceKey} requires exact compact-overlay anatomy with zero remove actions.`);
  unique(fixture.items.map(({ id }) => id), "line IDs", sourceKey);
  fixture.items.forEach((line) => validateLine(line, fixture.pricing.currency, sourceKey));
  unique(fixture.summary.rows.map(({ id }) => id), "summary row IDs", sourceKey);
  unique(fixture.summary.rows.map(({ kind }) => kind), "summary row kinds", sourceKey);
  fixture.summary.rows.forEach((row) => validateMoney({ ...row.amount, amountMinor: Math.abs(row.amount.amountMinor) }, `summary row ${row.id}`, sourceKey));
  required(fixture.summary.primaryAction.label, "primary action label", sourceKey);
  const calculated = calculateCart(fixture);
  const expectedRows: Record<SummaryRowKind, number> = {
    subtotal: calculated.subtotal.amountMinor,
    tax: calculated.tax.amountMinor,
    discount: -calculated.discount.amountMinor,
    shipping: calculated.shipping.amountMinor,
    adjustment: 0,
  };
  for (const row of fixture.summary.rows) {
    if (row.amount.currency !== fixture.pricing.currency || row.amount.amountMinor !== expectedRows[row.kind]) throw new Error(`${sourceKey} summary row ${row.id} drifts from calculated pricing.`);
  }
  const records = mediaMap.records.filter(({ slug }) => slug === sourceKey);
  unique(records.map(({ key }) => key), "media keys", sourceKey);
  for (const line of fixture.items) if (!records.some(({ key }) => key === line.media.assetKey)) throw new Error(`${sourceKey} cannot resolve media ${line.media.assetKey}.`);

  if (sourceKey === "shopping-cart-01") {
    if (fixture.items.length !== 3 || fixture.items.filter(({ selection }) => selection).length !== 3 || fixture.items.filter(({ meta }) => meta.length === 1).length !== 3 || fixture.items.filter(({ fulfillment }) => fulfillment).length !== 3 || fixture.items.filter(({ actions }) => actions?.remove).length !== 3 || !fixture.summary.coupon || fixture.summary.trustMethods?.length !== 3 || fixture.summary.rows.map(({ kind }) => kind).join() !== "subtotal,tax,shipping") {
      throw new Error(`${sourceKey} requires exact 3-line selection, fulfilment, coupon and trust anatomy.`);
    }
  }
  if (sourceKey === "shopping-cart-02") {
    const editors = fixture.items.flatMap(({ variantEditor }) => variantEditor ? [variantEditor] : []);
    const signatures = editors.map(({ options }) => options.map(({ id }) => id).join("|") );
    if (fixture.items.length !== 4 || editors.length !== 4 || editors.filter(({ readOnly }) => readOnly).length !== 1 || new Set(signatures).size !== 1 || editors[0]?.options.length !== 6 || fixture.items.filter(({ actions }) => actions?.remove).length !== 4 || !fixture.summary.secondaryAction || fixture.summary.rows.map(({ kind }) => kind).join() !== "subtotal,discount,shipping") {
      throw new Error(`${sourceKey} requires exact 4-line variant drawer anatomy.`);
    }
  }
  if (sourceKey === "shopping-cart-04") {
    if (fixture.items.length !== 3 || fixture.items.some(({ actions }) => actions?.remove) || fixture.items.some(({ meta }) => meta.length !== 1 || meta[0]?.id !== "type") || fixture.summary.secondaryAction || fixture.summary.rows.map(({ kind }) => kind).join() !== "subtotal,shipping") {
      throw new Error(`${sourceKey} requires exact compact-overlay anatomy with zero remove actions.`);
    }
  }
  return { calculated, resolvedMedia: records };
}

function validateCheckoutContract(fixture: CheckoutFixture) {
  if (fixture.owner !== "CheckoutFlow") throw new Error(`${fixture.sourceKey} must resolve to CheckoutFlow.`);
  if (fixture.proof.kind !== "system-ui") throw new Error(`${fixture.sourceKey} requires one runtime system UI proof.`);
  required(fixture.proof.title, "proof title", fixture.sourceKey);
  required(fixture.proof.description, "proof description", fixture.sourceKey);
  if (fixture.plans.length !== 3) throw new Error(`${fixture.sourceKey} requires exactly three plans.`);
  unique(fixture.plans.map(({ id }) => id), "plan IDs", fixture.sourceKey);
  fixture.plans.forEach((plan) => {
    required(plan.label, `plan ${plan.id} label`, fixture.sourceKey);
    required(plan.description, `plan ${plan.id} description`, fixture.sourceKey);
    validateMoney(plan.price, `plan ${plan.id} price`, fixture.sourceKey);
  });
  if (fixture.fields.length !== 7 || fixture.fields.map(({ id }) => id).join() !== CHECKOUT_FIELD_IDS.join()) throw new Error(`${fixture.sourceKey} requires the exact seven payment fields in source order.`);
  unique(fixture.fields.map(({ id }) => id), "payment field IDs", fixture.sourceKey);
  for (const field of fixture.fields) required(field.label, `field ${field.id} label`, fixture.sourceKey);
  required(fixture.actions.continueLabel, "continue action label", fixture.sourceKey);
  required(fixture.actions.backLabel, "back action label", fixture.sourceKey);
  required(fixture.actions.payLabel, "payment action label", fixture.sourceKey);
  return calculateCheckout(fixture);
}

function stressCart(fixture: CartFixture, stress?: CartStressKey): CartFixture {
  if (!stress) return fixture;
  if (stress === "short" || stress === "longLocale") return {
    ...fixture,
    copy: { ...fixture.copy, ...fixture.copy[stress] },
    states: { ...fixture.states, ...fixture.states[stress] },
    stress: { ...fixture.stress, longLocale: stress === "longLocale" },
  };
  const withCalculatedRows = (next: CartFixture): CartFixture => {
    const calculated = calculateCart(next);
    const values: Record<SummaryRowKind, number> = {
      subtotal: calculated.subtotal.amountMinor,
      tax: calculated.tax.amountMinor,
      discount: -calculated.discount.amountMinor,
      shipping: calculated.shipping.amountMinor,
      adjustment: 0,
    };
    return { ...next, summary: { ...next.summary, rows: next.summary.rows.map((row) => ({ ...row, amount: { ...row.amount, amountMinor: values[row.kind] } })) } };
  };
  if (stress === "hugePrice") return withCalculatedRows({
    ...fixture,
    items: fixture.items.map((line) => ({ ...line, unitPrice: { ...line.unitPrice, amountMinor: line.unitPrice.amountMinor * 1000 } })),
    pricing: { ...fixture.pricing, shippingMinor: fixture.pricing.shippingMinor * 1000 },
    stress: { ...fixture.stress, hugePrice: true },
  });
  const boundary = stress === "quantityAtMin" ? "min" : "max";
  return withCalculatedRows({
    ...fixture,
    items: fixture.items.map((line) => ({ ...line, quantity: { ...line.quantity, value: line.quantity[boundary] } })),
    stress: { ...fixture.stress, [stress]: true },
  });
}

export function resolveShoppingCartFixture(
  fixture: ShoppingCartFixture,
  mediaMap: ShoppingCartMediaMap,
  stress?: CartStressKey,
): ResolvedShoppingCartFixture {
  if (!SHOPPING_CART_SOURCE_KEYS.includes(fixture.sourceKey) || fixture.preset !== SOURCE_PRESETS[fixture.sourceKey]) throw new Error(`Unknown shopping-cart source/preset pair: ${fixture.sourceKey}/${fixture.preset}.`);
  if (fixture.sourceKey === "shopping-cart-03") {
    if (stress === "short" || stress === "longLocale") fixture = { ...fixture, copy: { ...fixture.copy, ...fixture.copy[stress] } };
    const result = validateCheckoutContract(fixture);
    return { ...fixture, ...result };
  }
  const resolved = stressCart(fixture, stress);
  const result = validateCartContract(resolved, mediaMap);
  return { ...resolved, ...result };
}
