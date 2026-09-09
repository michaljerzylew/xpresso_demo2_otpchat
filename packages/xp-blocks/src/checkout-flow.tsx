"use client";

import { ChoiceSet, Field, StickyActionBar, useDeviceClass } from "@xp/primitives";
import { useMemo, useState, type ReactNode } from "react";
import {
  resolveCheckoutFlowFixture,
  type AddressChoice,
  type CartLineRef,
  type CheckoutFieldRef,
  type AdaptedCheckoutFlowFixture,
  type CheckoutFlowFixture,
  type CheckoutFlowRenderFixture,
  type CheckoutFlowRuntimeSourceKey,
  type CheckoutFlowSourceKey,
  type CheckoutMediaSeat,
  type CheckoutNotice,
  type CheckoutStep,
  type CheckoutStepAction,
  type DeliveryChoice,
  type PaymentPayload,
  type ResolvedCheckoutFlowFixture,
  type SavedMethodChoice,
} from "./checkout-flow-model";
import type {
  CalculatedCart,
  CartLineModel,
  CartSummaryModel,
  Money,
  ProductMediaRecord,
} from "./shopping-cart-model";
import { CartLine } from "./shopping-cart";
import {
  StepPane,
  WizardShell,
  defineWizard,
  type WizardAction,
  type WizardDefinition,
  type WizardShellCopy,
  type WizardStepMeta,
} from "./wizard-shell";

type ControlValue = string | boolean;
type CheckoutActionHandler = (action: CheckoutStepAction, stepId: string) => boolean | void | Promise<boolean | void>;
export type CheckoutMediaMapRecord = {
  slug: CheckoutFlowRuntimeSourceKey;
  key: string;
  assetId: string;
  alt: string;
} & (
  | { kind: "product-thumb"; publicBase: string }
  | { kind: "system-mark"; publicPath: string }
);
export type ResolveCheckoutMediaSeat = (seat: CheckoutMediaSeat) => CheckoutMediaMapRecord;

const CART_PAYMENT_WIZARD = defineWizard([{ id: "review" }, { id: "payment" }] as const);
const SAVED_METHODS_WIZARD = defineWizard([{ id: "payment" }] as const);
const GUIDED_DETAILS_WIZARD = defineWizard([{ id: "details" }, { id: "delivery" }, { id: "payment" }] as const);
const FULL_JOURNEY_WIZARD = defineWizard([{ id: "review" }, { id: "address" }, { id: "delivery" }, { id: "payment" }, { id: "confirmation" }] as const);

function sourceWizard<Id extends string>(definition: WizardDefinition<Id>) {
  return definition as unknown as WizardDefinition<string>;
}

const CHECKOUT_WIZARD_BY_SOURCE: Record<CheckoutFlowSourceKey, WizardDefinition<string>> = {
  "checkout-page-01": sourceWizard(CART_PAYMENT_WIZARD),
  "checkout-page-02": sourceWizard(SAVED_METHODS_WIZARD),
  "checkout-page-03": sourceWizard(GUIDED_DETAILS_WIZARD),
  "checkout-page-04": sourceWizard(FULL_JOURNEY_WIZARD),
};

const formatMoney = ({ amountMinor, currency }: Money) => new Intl.NumberFormat("en", {
  style: "currency",
  currency,
}).format(amountMinor / 100);

const systemGlyph: Record<string, string> = {
  cart: "◫",
  address: "⌖",
  payment: "▣",
  confirmation: "✓",
};

function fieldType(field: CheckoutFieldRef) {
  if (field.kind === "email" || field.kind === "tel" || field.kind === "password") return field.kind;
  return "text";
}

export function CheckoutFieldControl({
  field,
  value,
  error,
  sourceKey,
  onChange,
}: {
  field: CheckoutFieldRef;
  value: ControlValue;
  error?: string;
  sourceKey: string;
  onChange: (value: ControlValue) => void;
}) {
  const id = `${sourceKey}-${field.id}`;
  const invalid = Boolean(error);
  if (field.kind === "checkbox") {
    return (
      <Field id={id} invalid={invalid} hasHelp={Boolean(field.help)} hasError={invalid} className="xp-checkout-field xp-checkout-field--boolean" data-field-span={field.span ?? "one"}>
        <Field.Label>{field.label}</Field.Label>
        <Field.Input
          type="checkbox"
          checked={value === true}
          required={field.required}
          inputMode="text"
          enterKeyHint="next"
          autoComplete={field.autocomplete}
          data-control-id={field.id}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        {field.help ? <Field.Help>{field.help}</Field.Help> : null}
        {error ? <Field.Error>{error}</Field.Error> : null}
      </Field>
    );
  }
  return (
    <Field id={id} invalid={invalid} hasHelp={Boolean(field.help)} hasError={invalid} className="xp-checkout-field" data-field-span={field.span ?? "one"}>
      <Field.Label>{field.label}</Field.Label>
      {field.kind === "select" ? (
        <Field.Select
          autoComplete={field.autocomplete}
          value={typeof value === "string" ? value : ""}
          required={field.required}
          data-control-id={field.id}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {field.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Field.Select>
      ) : (
        <Field.Input
          type={fieldType(field)}
          inputMode={field.inputMode}
          enterKeyHint="next"
          autoComplete={field.autocomplete}
          value={typeof value === "string" ? value : ""}
          required={field.required}
          data-control-id={field.id}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
      {field.help ? <Field.Help>{field.help}</Field.Help> : null}
      {error ? <Field.Error>{error}</Field.Error> : null}
    </Field>
  );
}

function cartMeta(meta: CartLineRef["meta"], currency: string): CartLineModel["meta"] {
  return meta.map((item, index) => typeof item === "string"
    ? { id: `meta-${index + 1}`, label: "", value: item }
    : {
        id: item.id,
        label: item.label,
        value: item.role === "previous-price" && /^\d+$/.test(item.value)
          ? formatMoney({ currency, amountMinor: Number(item.value) })
          : item.value,
      });
}

function productMediaRecord(seat: CheckoutMediaSeat, resolveMediaSeat: ResolveCheckoutMediaSeat): ProductMediaRecord {
  const record = resolveMediaSeat(seat);
  if (record.kind !== "product-thumb") throw new Error(`${seat.id} requires a resolved product media record.`);
  if (record.key !== seat.assetKey) throw new Error(`${seat.id} resolved the wrong product media key.`);
  if (record.publicBase === seat.assetKey || /^pending(?::|-)/i.test(record.publicBase) || /^https?:\/\//i.test(record.publicBase)) {
    throw new Error(`${seat.id} assetKey is an identity key, not a public media URL.`);
  }
  return {
    key: record.key,
    kind: "product-thumb" as const,
    assetId: record.assetId,
    presentation: "square-cover-center" as const,
    publicBase: record.publicBase.replace(/-640$/, ""),
    alt: seat.alt,
  };
}

export function CheckoutCartLine({
  line,
  quantity,
  media,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: {
  line: CartLineRef;
  quantity: number;
  media: ProductMediaRecord;
  onQuantityChange?: (value: number) => void;
  onRemove?: () => void;
  onSaveForLater?: () => void;
}) {
  const model: CartLineModel = {
    id: line.id,
    title: line.title,
    media: { assetKey: media.assetId, alt: media.alt },
    meta: cartMeta(line.meta, line.unitPrice.currency),
    unitPrice: line.unitPrice,
    quantity: {
      ...line.quantity,
      value: quantity,
      step: 1,
      inputLabel: line.title,
      decrementLabel: `${line.title} −`,
      incrementLabel: `${line.title} +`,
    },
  };
  return (
    <div className="xp-checkout-flow__cart-line">
      <CartLine
        line={model}
        lineTotal={{ ...line.unitPrice, amountMinor: line.unitPrice.amountMinor * quantity }}
        media={media}
        onQuantityChange={onQuantityChange}
      />
      {onRemove ? line.actionLabels?.remove
        ? <button className="xp-checkout-flow__line-remove" type="button" aria-label={line.actionLabels.remove} onClick={onRemove}><span aria-hidden="true">×</span></button>
        : <button className="xp-checkout-flow__line-remove" type="button" aria-label={`Remove ${line.title}`} onClick={onRemove}><span aria-hidden="true">×</span></button>
        : null}
      {onSaveForLater ? <button className="xp-checkout-flow__line-save" type="button" onClick={onSaveForLater}>{line.actionLabels?.["save-for-later"]}</button> : null}
    </div>
  );
}

function summaryProjection(summary: CheckoutFlowRenderFixture["summary"], label: string) {
  const byKind = (kind: CheckoutFlowRenderFixture["summary"]["rows"][number]["kind"]) => summary.rows.find((row) => row.kind === kind)?.amount;
  const zero = (currency: string): Money => ({ currency, amountMinor: 0 });
  const currency = summary.total.currency;
  const adjustment = summary.rows.find(({ kind }) => kind === "pickup" || kind === "surcharge");
  const model: CartSummaryModel = {
    rows: summary.rows.map((row) => ({
      id: row.id,
      label: row.label,
      kind: row.kind === "pickup" || row.kind === "surcharge" ? "adjustment" : row.kind,
      amount: row.amount,
    })),
    totalLabel: label,
    primaryAction: { id: "summary-toggle", label },
  };
  const calculated: CalculatedCart = {
    lineTotals: {},
    subtotal: byKind("subtotal") ?? zero(currency),
    tax: byKind("tax") ?? zero(currency),
    discount: byKind("discount") ?? zero(currency),
    shipping: byKind("shipping") ?? adjustment?.amount ?? zero(currency),
    total: summary.total,
  };
  return { model, calculated };
}

function summaryAmount(row: CartSummaryModel["rows"][number], calculated: CalculatedCart) {
  if (row.kind === "adjustment") return row.amount;
  const amount = calculated[row.kind];
  return row.kind === "discount" ? { ...amount, amountMinor: amount.amountMinor === 0 ? 0 : -amount.amountMinor } : amount;
}

function OrderSummaryPane({
  summary,
  calculated,
  lineTitles = [],
  details,
}: {
  summary: CartSummaryModel;
  calculated: CalculatedCart;
  lineTitles?: string[];
  details?: ReactNode;
}) {
  return (
    <aside className="xp-order-summary-bar__pane" data-xp-order-summary-pane>
      {lineTitles.length ? <ul className="xp-order-summary-bar__lines">{lineTitles.map((title) => <li key={title}>{title}</li>)}</ul> : null}
      <dl className="xp-order-summary-bar__rows">
        {summary.rows.map((row) => <div key={row.id}><dt>{row.label}</dt><dd>{formatMoney(summaryAmount(row, calculated))}</dd></div>)}
        <div className="xp-order-summary-bar__total"><dt>{summary.totalLabel}</dt><dd>{formatMoney(calculated.total)}</dd></div>
      </dl>
      {details ? <div className="xp-order-summary-bar__details">{details}</div> : null}
    </aside>
  );
}

export function OrderSummaryBar({
  summary,
  calculated,
  form,
  lineTitles,
  details,
}: {
  summary: CartSummaryModel;
  calculated: CalculatedCart;
  form: "band" | "pane";
  lineTitles?: string[];
  details?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (form === "pane") return <OrderSummaryPane summary={summary} calculated={calculated} lineTitles={lineTitles} details={details}/>;
  return (
    <div className="xp-order-summary-bar" data-form="band" data-open={open || undefined}>
      <StickyActionBar
        placement="overlay"
        summary={<output><span>{summary.totalLabel}</span><strong>{formatMoney(calculated.total)}</strong></output>}
        primary={<button type="button" aria-label={summary.primaryAction.label} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">{open ? "▴" : "▾"}</span></button>}
      />
      {open ? <OrderSummaryPane summary={summary} calculated={calculated} lineTitles={lineTitles} details={details}/> : null}
    </div>
  );
}

function Notice({ notice, acknowledgement = false }: { notice: CheckoutNotice; acknowledgement?: boolean }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <section className="xp-checkout-flow__notice" data-tone={notice.tone} data-dismissible={notice.dismissible || undefined} data-checkout-notice-id={notice.id} data-required-acknowledgement={acknowledgement || undefined} tabIndex={acknowledgement ? -1 : undefined}>
      <header><h3>{notice.title}</h3>{notice.dismissible ? <button type="button" aria-label={`Dismiss ${notice.title}`} onClick={() => setVisible(false)}><span aria-hidden="true">×</span></button> : null}</header>
      <p>{notice.description}</p>
      {notice.offers?.length ? <ul>{notice.offers.map((offer) => <li key={offer.id}>{offer.label}</li>)}</ul> : null}
    </section>
  );
}

function CheckoutSystemProof({
  proof,
  selectedLabel,
}: {
  proof: NonNullable<PaymentPayload["systemProof"]>;
  selectedLabel: string;
}) {
  return (
    <section className="xp-checkout-flow__system-proof" data-system-key={proof.systemKey}>
      <header><div><h3>{proof.title}</h3><p>{proof.description}</p></div><span aria-hidden="true">•••</span></header>
      <div className="xp-checkout-flow__system-canvas" aria-hidden="true">
        <aside><i/><i/><i/><i/></aside>
        <div className="xp-checkout-flow__system-workspace">
          <div className="xp-checkout-flow__system-toolbar"><strong>{selectedLabel}</strong><span/><span/></div>
          <div className="xp-checkout-flow__system-metrics"><i/><i/><i/></div>
          <div className="xp-checkout-flow__system-data"><div><span/><span/><span/><span/></div><ol><li/><li/><li/><li/></ol></div>
        </div>
      </div>
    </section>
  );
}

function Fields({
  fields,
  values,
  errors,
  sourceKey,
  onChange,
}: {
  fields: CheckoutFieldRef[];
  values: Record<string, ControlValue>;
  errors: Record<string, string>;
  sourceKey: string;
  onChange: (id: string, value: ControlValue) => void;
}) {
  return (
    <div className="xp-checkout-flow__fields">
      {fields.map((field) => <CheckoutFieldControl key={field.id} field={field} value={values[field.id] ?? ""} error={errors[field.id]} sourceKey={sourceKey} onChange={(value) => onChange(field.id, value)}/>)}
    </div>
  );
}

type ManagedChoiceItem = {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  media?: ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  actions?: Array<{
    id: string;
    label: string;
    onClick?: () => void;
  }>;
};

function ManagedChoiceSet({
  label,
  name,
  items,
  value,
  onChange,
}: {
  label: string;
  name: string;
  items: ManagedChoiceItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="xp-checkout-flow__managed-choices">
      <legend className="xp-wizard-shell__visually-hidden">{label}</legend>
      {items.map((item) => (
        <div className="xp-checkout-flow__managed-choice" data-state={item.id === value ? "checked" : "unchecked"} key={item.id}>
          <label>
            <input
              type="radio"
              name={name}
              value={item.id}
              checked={item.id === value}
              disabled={item.disabled}
              onChange={() => onChange(item.id)}
            />
            {item.media ? <span className="xp-checkout-flow__managed-media">{item.media}</span> : null}
            <span className="xp-checkout-flow__managed-copy">
              <strong>{item.label}</strong>
              {item.description ? <span>{item.description}</span> : null}
              {item.meta ? <em>{item.meta}</em> : null}
              {item.disabledReason ? <small>{item.disabledReason}</small> : null}
            </span>
          </label>
          {item.actions?.length ? <div className="xp-checkout-flow__managed-actions" aria-label={`${item.label} actions`}>
            {item.actions.map((action) => <button type="button" key={action.id} aria-label={`${action.label} ${item.label}`} onClick={action.onClick}>{action.label}</button>)}
          </div> : null}
        </div>
      ))}
    </fieldset>
  );
}

function AddressChoices({ choices, value, label, onChange }: { choices: AddressChoice[]; value: string; label: string; onChange: (value: string) => void }) {
  return <div className="xp-checkout-flow__address-choices">
    <ManagedChoiceSet label={label} name="checkout-address" value={value} onChange={onChange} items={choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      description: choice.addressLines.join(", "),
      meta: [choice.badge, choice.phoneLabel].filter(Boolean).join(" · "),
      actions: choice.management.map((kind) => ({
        id: `${choice.id}-${kind}`,
        label: kind === "edit" ? "Edit" : "Remove",
      })),
    }))}/>
  </div>;
}

function DeliveryChoices({ choices, value, label, onChange }: { choices: DeliveryChoice[]; value: string; label: string; onChange: (value: string) => void }) {
  return <ChoiceSet label={label} value={value} onChange={onChange} items={choices.map((choice) => ({
    value: choice.id,
    label: choice.label,
    description: choice.description,
    meta: formatMoney(choice.fee),
    details: [choice.estimatedWindow],
  }))}/>;
}

function PaymentChoices({ payload, value, label, media, announcements, resolveMediaSeat, onChange }: { payload: PaymentPayload; value: string; label: string; media: CheckoutMediaSeat[]; announcements: CheckoutFlowRenderFixture["announcements"]; resolveMediaSeat: ResolveCheckoutMediaSeat; onChange: (value: string) => void }) {
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
  const [resultMessage, setResultMessage] = useState<string>();
  const savedMethods = (payload.savedMethods ?? []).filter(({ id }) => !deletedIds.includes(id));
  const choices = [...savedMethods, ...payload.methods];
  const isSavedMethod = (choice: (typeof choices)[number]): choice is SavedMethodChoice => "maskedIdentity" in choice && "expiryLabel" in choice;
  const markFor = (markId?: string) => {
    if (!markId) return undefined;
    const seat = media.find(({ id }) => id === markId);
    if (!seat) throw new Error(`Cannot resolve checkout media seat ${markId}.`);
    const record = resolveMediaSeat(seat);
    if (record.kind !== "system-mark" || record.key !== seat.systemMarkKey) throw new Error(`${markId} requires a resolved payment mark.`);
    if (/^pending(?::|-)/i.test(record.publicPath) || /^https?:\/\//i.test(record.publicPath)) throw new Error(`${markId} requires a local payment mark path.`);
    return <img src={record.publicPath} alt={seat.alt}/>;
  };
  return (
    <div className="xp-checkout-flow__payment-choices">
      <ManagedChoiceSet label={label} name={payload.selectionStateKey ?? "checkout-payment"} value={value} onChange={onChange} items={choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        description: choice.description,
        meta: isSavedMethod(choice) ? `${choice.maskedIdentity} · ${choice.expiryLabel}` : undefined,
        media: markFor(choice.markId),
        disabled: choice.disabled,
        disabledReason: choice.disabledReason,
        actions: isSavedMethod(choice) ? choice.management.map((kind) => ({
          id: `${choice.id}-${kind}`,
          label: kind === "edit" ? "Edit" : "Delete",
          onClick: kind === "delete" ? () => { setPendingDeleteId(choice.id); setResultMessage(undefined); } : undefined,
        })) : undefined,
      }))}/>
      {pendingDeleteId ? <div className="xp-checkout-flow__method-confirm" role="alertdialog" aria-modal="false" aria-labelledby={`${pendingDeleteId}-delete-title`}>
        <strong id={`${pendingDeleteId}-delete-title`}>{savedMethods.find(({ id }) => id === pendingDeleteId)?.label}</strong>
        <div>
          <button type="button" onClick={() => { setDeletedIds((current) => [...current, pendingDeleteId]); setPendingDeleteId(undefined); setResultMessage(announcements.methodDeleted); }}>Delete route</button>
          <button type="button" onClick={() => { setPendingDeleteId(undefined); setResultMessage(announcements.methodDeleteCancelled); }}>Keep route</button>
        </div>
      </div> : null}
      {resultMessage ? <p className="xp-checkout-flow__management-result" role="status">{resultMessage}</p> : null}
    </div>
  );
}

function StepIcon({ step, media }: { step: CheckoutStep; media: CheckoutMediaSeat[] }) {
  const key = step.id === "review" ? "cart" : step.id === "address" ? "address" : step.id === "payment" ? "payment" : step.id === "confirmation" ? "confirmation" : undefined;
  const seat = key ? media.find((item) => item.role === "step-icon" && item.systemMarkKey === key) : undefined;
  return seat ? <span className="xp-checkout-flow__step-icon" aria-hidden="true" data-system-mark={seat.systemMarkKey}>{systemGlyph[seat.systemMarkKey!] ?? "•"}</span> : null;
}

export type CheckoutStageProperties = {
  fixture: CheckoutFlowRenderFixture;
  step: CheckoutStep;
  values: Record<string, ControlValue>;
  quantities: Record<string, number>;
  visibleLines: CartLineRef[];
  removedLine?: CartLineRef;
  selectedMethodId: string;
  selectedAddressId: string;
  selectedDeliveryId: string;
  summary: CartSummaryModel;
  calculated: CalculatedCart;
  compactSummary: boolean;
  resolveMediaSeat: ResolveCheckoutMediaSeat;
  onValueChange: (id: string, value: ControlValue) => void;
  onQuantityChange: (id: string, value: number) => void;
  onRemove: (line: CartLineRef) => void;
  onSaveForLater: (line: CartLineRef) => void;
  onRestore: () => void;
  onMethodChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onDeliveryChange: (value: string) => void;
};

export function CheckoutStage(properties: CheckoutStageProperties) {
  const { fixture, step, values, quantities, visibleLines, removedLine, summary, calculated, compactSummary } = properties;
  const cart = fixture.cart;
  const mediaById = new Map(fixture.media.map((seat) => [seat.id, seat]));
  const stepErrors = controlsForStep(step, properties.selectedMethodId)
    .map(({ id }) => fixture.fieldErrors[id])
    .filter((error): error is string => Boolean(error));
  const hasReview = fixture.steps.some(({ kind }) => kind === "review");
  const summaryDetails = !hasReview && cart?.coupon ? <Field id={`${fixture.sourceKey}-${cart.coupon.id}-summary`} invalid={Boolean(fixture.fieldErrors[cart.coupon.id])} hasError={Boolean(fixture.fieldErrors[cart.coupon.id])} className="xp-checkout-flow__coupon"><Field.Label>{cart.coupon.fieldLabel}</Field.Label><Field.Input type="text" inputMode="text" enterKeyHint="done" autoComplete="off"/><button type="button">{cart.coupon.actionLabel}</button>{fixture.fieldErrors[cart.coupon.id] ? <Field.Error>{fixture.fieldErrors[cart.coupon.id]}</Field.Error> : null}</Field> : undefined;
  const summaryOrgan = <OrderSummaryBar summary={summary} calculated={calculated} form={compactSummary ? "band" : "pane"} lineTitles={!hasReview ? visibleLines.map(({ title }) => title) : undefined} details={summaryDetails}/>;
  let body: ReactNode;
  if (step.kind === "review") {
    body = <>
      {visibleLines.length ? step.payload.promotions?.map((notice) => <Notice notice={notice} key={notice.id}/>) : null}
      {visibleLines.length ? <div className="xp-checkout-flow__cart-lines">{visibleLines.map((line) => <CheckoutCartLine key={line.id} line={line} quantity={quantities[line.id] ?? line.quantity.value} media={productMediaRecord(mediaById.get(line.mediaId)!, properties.resolveMediaSeat)} onQuantityChange={(value) => properties.onQuantityChange(line.id, value)} onRemove={line.actions.includes("remove") ? () => properties.onRemove(line) : undefined} onSaveForLater={line.actions.includes("save-for-later") ? () => properties.onSaveForLater(line) : undefined}/>)}</div>
        : cart ? <section className="xp-checkout-flow__empty"><h3>{cart.emptyState.title}</h3>{cart.emptyState.description ? <p>{cart.emptyState.description}</p> : null}<button type="button">{cart.emptyState.actionLabel}</button></section> : null}
      {removedLine ? <div className="xp-checkout-flow__undo" role="status"><span>{fixture.announcements.cartRemoved}</span><button type="button" aria-label={`Restore ${removedLine.title}`} onClick={properties.onRestore}><span aria-hidden="true">↶</span></button></div> : null}
      {visibleLines.length && cart?.coupon ? <Field id={`${fixture.sourceKey}-${cart.coupon.id}`} invalid={Boolean(fixture.fieldErrors[cart.coupon.id])} hasError={Boolean(fixture.fieldErrors[cart.coupon.id])} className="xp-checkout-flow__coupon"><Field.Label>{cart.coupon.fieldLabel}</Field.Label><Field.Input type="text" inputMode="text" enterKeyHint="done" autoComplete="off"/><button type="button">{cart.coupon.actionLabel}</button>{fixture.fieldErrors[cart.coupon.id] ? <Field.Error>{fixture.fieldErrors[cart.coupon.id]}</Field.Error> : null}</Field> : null}
      {visibleLines.length ? step.payload.upsells?.map((upsell) => <section className="xp-checkout-flow__upsell" key={upsell.id}><h3>{upsell.label}</h3><p>{upsell.description}</p><button type="button">{upsell.actionLabel}</button></section>) : null}
    </>;
  } else if (step.kind === "details") {
    body = <Fields fields={step.payload.fields} values={values} errors={fixture.fieldErrors} sourceKey={fixture.sourceKey} onChange={properties.onValueChange}/>;
  } else if (step.kind === "delivery") {
    body = <>
      {step.payload.sameAsBilling ? <label className="xp-checkout-flow__same-address"><input type="checkbox" checked={values[step.payload.sameAsBilling.id] === true} onChange={(event) => properties.onValueChange(step.payload.sameAsBilling!.id, event.currentTarget.checked)}/><span>{step.payload.sameAsBilling.label}</span></label> : null}
      {step.payload.fields ? <Fields fields={step.payload.fields} values={values} errors={fixture.fieldErrors} sourceKey={fixture.sourceKey} onChange={properties.onValueChange}/> : null}
      {step.payload.savedAddresses ? <AddressChoices choices={step.payload.savedAddresses} value={properties.selectedAddressId} label={step.label} onChange={properties.onAddressChange}/> : null}
      {step.payload.deliveryOptions ? <DeliveryChoices choices={step.payload.deliveryOptions} value={properties.selectedDeliveryId} label={step.label} onChange={properties.onDeliveryChange}/> : null}
      {step.payload.supportingRows?.length ? <ul className="xp-checkout-flow__supporting-rows">{step.payload.supportingRows.map((row) => <li key={row.id}>{row.label}</li>)}</ul> : null}
      {step.payload.inlineActions?.length ? <div className="xp-checkout-flow__inline-actions">{step.payload.inlineActions.map((action) => <button type="button" key={action.id} data-action-kind={action.kind}>{action.label}</button>)}</div> : null}
    </>;
  } else if (step.kind === "payment") {
    const panel = step.payload.methodPanels?.find(({ methodId }) => methodId === properties.selectedMethodId);
    const showCard = step.payload.presentation === "fields-only" || properties.selectedMethodId === "new-method" || properties.selectedMethodId.includes("card");
    const wideChoices = !compactSummary && step.payload.wideMethods?.length ? { ...step.payload, methods: step.payload.wideMethods } : undefined;
    const visibleProof = !compactSummary && step.payload.wideProof ? step.payload.wideProof : step.payload.proof;
    const visibleSystemProof = !compactSummary && step.payload.wideSystemProof ? step.payload.wideSystemProof : step.payload.systemProof;
    const choicePayload = wideChoices ?? step.payload;
    const selectedLabel = choicePayload.methods.find(({ id }) => id === properties.selectedMethodId)?.label ?? step.label;
    const choices = step.payload.presentation !== "fields-only" || wideChoices ? <PaymentChoices payload={choicePayload} value={properties.selectedMethodId} label={step.label} media={fixture.media} announcements={fixture.announcements} resolveMediaSeat={properties.resolveMediaSeat} onChange={properties.onMethodChange}/> : null;
    const fields = showCard && step.payload.cardFields ? <Fields fields={step.payload.cardFields} values={values} errors={fixture.fieldErrors} sourceKey={fixture.sourceKey} onChange={properties.onValueChange}/> : null;
    const trailing = <>
      {showCard && step.payload.saveMethod ? <label className="xp-checkout-flow__save-method"><input type="checkbox" checked={values[step.payload.saveMethod.id] === true} onChange={(event) => properties.onValueChange(step.payload.saveMethod!.id, event.currentTarget.checked)}/><span>{step.payload.saveMethod.label}</span></label> : null}
      {panel ? <div className="xp-checkout-flow__method-panel">{panel.description ? <p>{panel.description}</p> : null}<Fields fields={panel.fields} values={values} errors={fixture.fieldErrors} sourceKey={fixture.sourceKey} onChange={properties.onValueChange}/></div> : null}
      {step.payload.notices?.map((notice) => <Notice notice={notice} acknowledgement={notice.id === step.payload.acknowledgementNoticeId} key={notice.id}/>)}
      {step.payload.inlineActions?.length ? <div className="xp-checkout-flow__inline-actions">{step.payload.inlineActions.map((action) => <button type="button" key={action.id} data-action-kind={action.kind}>{action.label}</button>)}</div> : null}
    </>;
    body = step.payload.wideSystemProof && !compactSummary ? <div className="xp-checkout-flow__plan-payment-grid">
      <div className="xp-checkout-flow__proof-plan-region"><CheckoutSystemProof proof={step.payload.wideSystemProof} selectedLabel={selectedLabel}/>{choices}</div>
      <div className="xp-checkout-flow__payment-total-region">{fields}{trailing}{summaryOrgan}</div>
    </div> : <>
      {visibleSystemProof ? <CheckoutSystemProof proof={visibleSystemProof} selectedLabel={selectedLabel}/> : null}
      {visibleProof ? <Notice notice={visibleProof}/> : null}
      {choices}{fields}{trailing}
    </>;
  } else {
    body = <section className="xp-checkout-flow__confirmation">
      {step.payload.receipt ? <header><h3>{step.payload.receipt.title}</h3><p>{step.payload.receipt.description}</p>{step.payload.receipt.acknowledgement ? <p>{step.payload.receipt.acknowledgement}</p> : null}</header> : null}
      {step.payload.orderReferenceLabel ? <dl>
        <div><dt>{step.payload.orderReferenceLabel}</dt><dd>{step.payload.orderReferenceValue}</dd></div>
        <div><dt>{step.payload.contactLabel}</dt><dd>{step.payload.contactValue}</dd></div>
        <div><dt>{step.payload.placedAtLabel}</dt><dd>{step.payload.placedAtValue}</dd></div>
      </dl> : null}
      {step.payload.fulfillmentGroups ? <div className="xp-checkout-flow__fulfilment">{step.payload.fulfillmentGroups.map((group) => <section key={group.id}><h3>{group.title}</h3><dl>{group.rows.map((row) => <div key={row.id}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>)}</div>
        : step.payload.deliveryAddress && step.payload.billingAddress ? <div className="xp-checkout-flow__fulfilment">
          {[step.payload.deliveryAddress!, step.payload.billingAddress!].map((address) => <section key={address.label}><h3>{address.label}</h3>{address.lines.map((line) => <p key={line}>{line}</p>)}{address.phoneLabel ? <p>{address.phoneLabel}</p> : null}</section>)}
          <p>{step.payload.deliveryMethod}</p>
        </div> : null}
      <div className="xp-checkout-flow__cart-lines">{step.payload.lines.map((line) => <CheckoutCartLine key={line.id} line={line} quantity={quantities[line.id] ?? line.quantity.value} media={productMediaRecord(mediaById.get(line.mediaId)!, properties.resolveMediaSeat)}/>)}</div>
    </section>;
  }
  return (
    <StepPane
      headingId={`${fixture.sourceKey}-${step.id}-heading`}
      title={<><StepIcon step={step} media={fixture.media}/>{step.label}</>}
      lede={fixture.secureContext}
      validationSummary={stepErrors.length ? <ul>{stepErrors.map((error) => <li key={error}>{error}</li>)}</ul> : undefined}
      context={compactSummary || (step.kind === "payment" && Boolean(step.payload.wideSystemProof)) ? undefined : summaryOrgan}
      busy={fixture.commitState === "processing"}
      className="xp-checkout-flow__stage"
      data-checkout-step={step.id}
    >
      {compactSummary ? summaryOrgan : null}
      {fixture.commitState === "processing" ? <p className="xp-checkout-flow__processing" role="status">{fixture.commit.processingLabel}</p> : null}
      {body}
    </StepPane>
  );
}

function wizardCopy(fixture: CheckoutFlowRenderFixture): WizardShellCopy {
  const failure = Object.values(fixture.fieldErrors)[0] ?? fixture.secureContext;
  return {
    progressLabel: fixture.title,
    openStepListLabel: fixture.title,
    closeStepListLabel: "×",
    stepCount: "{current}/{total}",
    currentStepLabel: "●",
    completedStepLabel: "✓",
    availableStepLabel: "○",
    lockedStepLabel: "·",
    announcements: {
      stepChanged: "{step}",
      validationFailed: failure,
      submitted: fixture.announcements.success,
      reset: fixture.announcements.success,
      processing: fixture.announcements.processing,
      failed: failure,
    },
  };
}

function wizardAction(action: CheckoutStepAction): WizardAction {
  return {
    id: action.id,
    label: action.label,
    behavior: action.kind === "back" ? "previous" : action.kind === "next" ? "next" : "submit",
    emphasis: action.kind === "back" ? "secondary" : "primary",
  };
}

function controlsForStep(step: CheckoutStep, selectedMethodId: string) {
  if (step.kind === "details") return step.payload.fields;
  if (step.kind === "delivery") return step.payload.fields ?? [];
  if (step.kind !== "payment") return [];
  const showCard = step.payload.presentation === "fields-only" || selectedMethodId === "new-method" || selectedMethodId.includes("card");
  const panel = step.payload.methodPanels?.find(({ methodId }) => methodId === selectedMethodId);
  return [...(showCard ? step.payload.cardFields ?? [] : []), ...(panel?.fields ?? [])];
}

function focusControl(control: HTMLElement | null) {
  control?.focus();
  if (control && "reportValidity" in control && typeof control.reportValidity === "function") control.reportValidity();
}

function validateCheckoutStage(
  fixture: CheckoutFlowRenderFixture,
  step: CheckoutStep,
  selectedMethodId: string,
  pane: HTMLElement | null,
) {
  if (!pane) return false;
  const controls = Array.from(pane.querySelectorAll<HTMLElement>("[data-control-id]"));
  const erroredField = controlsForStep(step, selectedMethodId).find(({ id }) => fixture.fieldErrors[id]);
  if (erroredField) {
    focusControl(controls.find(({ dataset }) => dataset.controlId === erroredField.id) ?? null);
    return false;
  }
  const invalid = pane.querySelector<HTMLElement>(":invalid,[aria-invalid='true']");
  if (invalid) {
    focusControl(invalid);
    return false;
  }
  if (step.kind === "payment" && step.payload.acknowledgementNoticeId) {
    const acknowledgement = Array.from(pane.querySelectorAll<HTMLElement>("[data-checkout-notice-id]"))
      .find(({ dataset }) => dataset.checkoutNoticeId === step.payload.acknowledgementNoticeId);
    if (!acknowledgement) {
      focusControl(pane.querySelector<HTMLElement>("[data-wizard-step-heading]"));
      return false;
    }
  }
  return true;
}

export type CheckoutFlowProperties = {
  resolveMediaSeat: ResolveCheckoutMediaSeat;
  onAction?: CheckoutActionHandler;
} & (
  | { model: CheckoutFlowFixture; stress?: keyof CheckoutFlowFixture["stress"]; definition?: never }
  | { model: AdaptedCheckoutFlowFixture; stress?: never; definition: WizardDefinition<string> }
);

export function CheckoutFlow({
  model,
  stress,
  resolveMediaSeat,
  onAction,
  definition: adapterDefinition,
}: CheckoutFlowProperties) {
  const adapted = "adapter" in model;
  const fixture: CheckoutFlowRenderFixture = adapted ? model : resolveCheckoutFlowFixture(model, stress);
  const deviceClass = useDeviceClass();
  const compactSummary = deviceClass === "M" || deviceClass === "TP";
  const definition = adapted ? adapterDefinition : CHECKOUT_WIZARD_BY_SOURCE[model.sourceKey];
  if (!definition) throw new Error(`${fixture.sourceKey} requires a stable WizardShell definition.`);
  const steps = useMemo<WizardStepMeta[]>(() => fixture.steps.map((step, index) => ({
    id: step.id,
    label: step.label,
    shortLabel: step.label,
    terminal: index === fixture.steps.length - 1,
    actions: step.actions.map(wizardAction),
  })), [fixture.steps]);
  const [values, setValues] = useState<Record<string, ControlValue>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries((fixture.cart?.lines ?? []).map((line) => [line.id, line.quantity.value])));
  const [removedLineIds, setRemovedLineIds] = useState<string[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>(() => Object.fromEntries(fixture.steps.filter((step): step is CheckoutStep & { kind: "payment" } => step.kind === "payment").map((step) => [step.payload.selectionStateKey ?? step.id, step.payload.selectedMethodId])));
  const addressStep = fixture.steps.find((step): step is CheckoutStep & { kind: "delivery" } => step.kind === "delivery" && Boolean(step.payload.savedAddresses));
  const deliveryStep = fixture.steps.find((step): step is CheckoutStep & { kind: "delivery" } => step.kind === "delivery" && Boolean(step.payload.deliveryOptions));
  const [selectedAddressId, setSelectedAddressId] = useState(() => addressStep?.payload.savedAddresses?.[0]?.id ?? "");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(() => deliveryStep?.payload.deliveryOptions?.[0]?.id ?? "");
  const visibleLines = (fixture.cart?.lines ?? []).filter(({ id }) => !removedLineIds.includes(id));
  const removedLine = (fixture.cart?.lines ?? []).find(({ id }) => id === removedLineIds.at(-1));
  const emptyCart = Boolean(fixture.cart && visibleLines.length === 0);
  const visibleSteps = useMemo(() => emptyCart ? steps.map((step) => step.id === fixture.entryStepId ? { ...step, actions: [] } : step) : steps, [emptyCart, fixture.entryStepId, steps]);
  const workingSummary = useMemo(() => {
    const dynamic = fixture.steps.find((step): step is CheckoutStep & { kind: "payment" } => step.kind === "payment" && Boolean(step.payload.summaryByMethodId));
    const dynamicKey = dynamic?.payload.selectionStateKey ?? dynamic?.id;
    const selectedSummary = dynamic && dynamicKey ? dynamic.payload.summaryByMethodId?.[selectedMethods[dynamicKey] ?? dynamic.payload.selectedMethodId] : undefined;
    const delivery = fixture.steps.find((step): step is CheckoutStep & { kind: "delivery" } => step.kind === "delivery" && Boolean(step.payload.summaryByDeliveryId));
    const deliverySummary = delivery?.payload.summaryByDeliveryId?.[selectedDeliveryId];
    const sourceSummary = selectedSummary ?? deliverySummary ?? fixture.summary;
    if (!fixture.cart) return sourceSummary;
    const subtotal = visibleLines.reduce((sum, line) => sum + line.unitPrice.amountMinor * (quantities[line.id] ?? line.quantity.value), 0);
    const rows = sourceSummary.rows.map((row) => {
      if (emptyCart) return { ...row, amount: { ...row.amount, amountMinor: 0 } };
      if (row.kind === "subtotal") return { ...row, amount: { ...row.amount, amountMinor: subtotal } };
      if (row.kind === "tax" && fixture.cartPricing) return { ...row, amount: { ...row.amount, amountMinor: Math.round((subtotal * fixture.cartPricing.taxBasisPoints) / 10_000) } };
      return row;
    });
    const total = rows.reduce((sum, row) => sum + (row.kind === "discount" ? -1 : 1) * row.amount.amountMinor, 0);
    return { ...sourceSummary, rows, total: { ...sourceSummary.total, amountMinor: total } };
  }, [emptyCart, fixture.cart, fixture.cartPricing, fixture.steps, fixture.summary, quantities, selectedDeliveryId, selectedMethods, visibleLines]);
  const projected = useMemo(() => summaryProjection(workingSummary, workingSummary.label ?? fixture.title), [fixture.title, workingSummary]);
  const stepById = new Map(fixture.steps.map((step) => [step.id, step]));
  const actionById = new Map(fixture.steps.flatMap((step) => step.actions.map((action) => [action.id, action] as const)));
  return (
    <section className="xp-checkout-flow" data-xp-checkout-flow data-source-key={fixture.sourceKey} data-preset={fixture.preset} data-device-class={deviceClass}>
      <header className="xp-checkout-flow__header"><h1>{fixture.title}</h1><p>{fixture.secureContext}</p></header>
      <WizardShell
        definition={definition}
        steps={visibleSteps}
        copy={wizardCopy(fixture)}
        initialStepId={compactSummary ? fixture.entryStepId : fixture.wideEntryStepId ?? fixture.entryStepId}
        processing={fixture.commitState === "processing"}
        validateStep={(stepId, pane) => {
          const step = stepById.get(stepId)!;
          const selectedMethodId = step.kind === "payment" ? selectedMethods[step.payload.selectionStateKey ?? step.id] ?? step.payload.selectedMethodId : "";
          return validateCheckoutStage(fixture, step, selectedMethodId, pane);
        }}
        onAction={(action, stepId) => {
          const sourceAction = actionById.get(action.id);
          return sourceAction ? onAction?.(sourceAction, stepId) : undefined;
        }}
        renderStep={(meta) => {
          const step = stepById.get(meta.id)!;
          const paymentStateKey = step.kind === "payment" ? step.payload.selectionStateKey ?? step.id : "";
          const paymentId = step.kind === "payment" ? selectedMethods[paymentStateKey] ?? step.payload.selectedMethodId : "";
          return <CheckoutStage
            fixture={fixture}
            step={step}
            values={values}
            quantities={quantities}
            visibleLines={visibleLines}
            removedLine={removedLine}
            selectedMethodId={paymentId}
            selectedAddressId={selectedAddressId}
            selectedDeliveryId={selectedDeliveryId}
            summary={projected.model}
            calculated={projected.calculated}
            compactSummary={compactSummary}
            resolveMediaSeat={resolveMediaSeat}
            onValueChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
            onQuantityChange={(id, value) => setQuantities((current) => ({ ...current, [id]: value }))}
            onRemove={(line) => { setRemovedLineIds((current) => current.includes(line.id) ? current : [...current, line.id]); setLiveMessage(fixture.announcements.cartRemoved ?? ""); }}
            onSaveForLater={(line) => setLiveMessage(line.actionLabels?.["save-for-later"] ?? "")}
            onRestore={() => { setRemovedLineIds((current) => current.slice(0, -1)); setLiveMessage(fixture.announcements.cartRestored ?? ""); }}
            onMethodChange={(value) => setSelectedMethods((current) => ({ ...current, [paymentStateKey]: value }))}
            onAddressChange={setSelectedAddressId}
            onDeliveryChange={setSelectedDeliveryId}
          />;
        }}
      />
      <p className="xp-checkout-flow__live" aria-live="polite" aria-atomic="true">{liveMessage}</p>
    </section>
  );
}
