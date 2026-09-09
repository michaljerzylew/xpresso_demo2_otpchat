"use client";

import { ChoiceSet, StickyActionBar, type DeviceClass, type StickyActionBarPlacement } from "@xp/primitives";
import { useEffect, useRef, type ReactNode } from "react";
import type { ProductOptionGroup, ResolvedProductAction } from "./product-overview-model";
import type { ProductOverviewCoreState } from "./product-overview";

const formatMoney = ({ amountMinor, currency }: { amountMinor: number; currency: string }) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
const compactClass = (deviceClass: DeviceClass) => deviceClass === "M" || deviceClass === "TP";

function ProductActionControl({ action, state }: { action: ResolvedProductAction; state: ProductOverviewCoreState }) {
  const commitAction = action.normalizedKind === "cart" || action.normalizedKind === "purchase";
  const committing = state.commitState === "pending" && commitAction;
  const content: ReactNode = <>{committing ? <span className="xp-buy-box__spinner" aria-hidden="true" /> : null}{action.normalizedKind === "wishlist" ? <span aria-hidden="true">{state.favorite ? "♥" : "♡"}</span> : null}<span>{action.label}</span></>;
  const common = { className: "xp-buy-box__action", "data-product-action-id": action.id, "data-action-kind": action.normalizedKind, "data-emphasis": action.emphasis, "data-xp-control": true } as const;
  if (action.normalizedKind === "navigate") return <a {...common} href={action.href}>{content}</a>;
  return <button {...common} type="button" aria-busy={committing || undefined} aria-pressed={action.normalizedKind === "wishlist" ? state.favorite : undefined} data-commit-state={committing ? "pending" : "idle"} disabled={committing} onClick={() => state.runAction(action)}>{content}</button>;
}

function ProductOptionGroupControl({ group, state, compact }: { group: ProductOptionGroup; state: ProductOverviewCoreState; compact: boolean }) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const selectedId = state.selections[group.id];
  const custom = group.options.find(({ id }) => id === selectedId)?.customAmount;

  useEffect(() => {
    const rail = fieldsetRef.current?.querySelector<HTMLElement>(".xp-choice-set");
    const selected = rail?.querySelector<HTMLElement>('[data-state="checked"]');
    if (!rail || !selected || (!compact && rail.scrollWidth <= rail.clientWidth + 1)) return;
    const railLeft = rail.getBoundingClientRect().left;
    const selectedLeft = selected.getBoundingClientRect().left - railLeft + rail.scrollLeft;
    rail.scrollLeft = Math.max(0, selectedLeft - (rail.clientWidth - selected.clientWidth) / 2);
  }, [compact, selectedId]);

  return <fieldset ref={fieldsetRef} className="xp-buy-box__choice-group" data-choice-kind={group.kind} data-option-group-id={group.id}>
    <legend>{group.label}</legend>
    <ChoiceSet label={group.label} value={selectedId} onChange={(value) => state.selectOption(group.id, value)} items={group.options.map((option) => ({
      value: option.id,
      label: option.label,
      description: option.description ?? option.disabledReason,
      disabled: option.disabled,
      media: group.kind === "swatch" ? <span className="xp-buy-box__swatch" data-swatch={option.id} aria-hidden="true" /> : undefined,
      meta: option.priceDelta?.amountMinor ? formatMoney(option.priceDelta) : undefined,
    }))} />
    {custom ? <label className="xp-buy-box__custom-amount">
      <span>{custom.inputLabel}</span>
      <input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" value={state.customAmount} aria-invalid={Boolean(state.customAmountError) || undefined} aria-describedby={`${group.id}-custom-help ${group.id}-custom-error`} onChange={(event) => state.setCustomAmount(event.currentTarget.value)} data-xp-control />
      <small id={`${group.id}-custom-help`}>{custom.help}</small>
      {state.customAmountError ? <strong id={`${group.id}-custom-error`} role="alert">{state.customAmountError}</strong> : null}
    </label> : null}
  </fieldset>;
}

export function BuyBox({ state, deviceClass, actionPlacement = "page" }: { state: ProductOverviewCoreState; deviceClass: DeviceClass; actionPlacement?: StickyActionBarPlacement }) {
  const model = state.model;
  const compact = compactClass(deviceClass);
  const primary = model.actions.find(({ id }) => id === model.buyBox.primaryActionId);
  const secondary = model.buyBox.secondaryActionIds.map((id) => model.actions.find((action) => action.id === id)).filter((action): action is ResolvedProductAction => Boolean(action));
  const quantity = model.buyBox.quantity;
  const form = compact ? "band" : "pane";
  const committing = state.commitState === "pending";
  return <section className="xp-buy-box" data-xp-buy-box data-xp-owner="BuyBox" data-form={form}>
    <div className="xp-buy-box__identity">
      {model.product.breadcrumbs?.length ? <nav aria-label={model.product.title}><ol>{model.product.breadcrumbs.map((item) => <li key={item.id}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}</li>)}</ol></nav> : null}
      {model.product.eyebrow ? <p className="xp-buy-box__eyebrow">{model.product.eyebrow}</p> : null}
      <h1 id={`${model.sourceKey}-title`}>{model.product.title}</h1>
      {model.product.subtitle ? <p className="xp-buy-box__subtitle">{model.product.subtitle}</p> : null}
      {model.product.badge ? <strong className="xp-buy-box__badge">{model.product.badge}</strong> : null}
      {model.product.rating ? <p className="xp-buy-box__rating" aria-label={`${model.product.rating.value} out of ${model.product.rating.maximum}`}><span aria-hidden="true">★★★★★</span><strong>{model.product.rating.value}</strong>{model.product.rating.reviewCount !== undefined ? <small>{model.product.rating.reviewCount} {model.product.rating.reviewLabel}</small> : null}</p> : null}
      {model.product.description ? <p className="xp-buy-box__description">{model.product.description}</p> : null}
      {model.product.inventory ? <p className="xp-buy-box__inventory"><strong>{model.product.inventory.available}</strong> {model.product.inventory.label}{model.product.inventory.sold !== undefined ? <small> · {model.product.inventory.sold}</small> : null}</p> : null}
    </div>
    <p className="xp-buy-box__price"><strong data-current-price={state.currentPrice.amountMinor}>{formatMoney(state.currentPrice)}</strong>{model.buyBox.price.previous ? <s>{formatMoney(model.buyBox.price.previous)}</s> : null}{model.buyBox.price.discountLabel ? <span>{model.buyBox.price.discountLabel}</span> : null}{model.buyBox.price.taxLabel ? <small>{model.buyBox.price.taxLabel}</small> : null}</p>
    <div className="xp-buy-box__choices">{model.buyBox.optionGroups.map((group) => <ProductOptionGroupControl key={group.id} group={group} state={state} compact={compact} />)}</div>
    {quantity ? <div className="xp-buy-box__quantity" data-product-quantity>
      <button type="button" aria-label={quantity.decrementLabel} disabled={state.quantity <= quantity.min} onClick={() => state.setQuantity(state.quantity - quantity.step)} data-xp-control>−</button>
      <label><span>{quantity.inputLabel}</span><input type="number" min={quantity.min} max={quantity.max} step={quantity.step} value={state.quantity} onChange={(event) => state.setQuantity(event.currentTarget.valueAsNumber)} /></label>
      <button type="button" aria-label={quantity.incrementLabel} disabled={state.quantity >= quantity.max} onClick={() => state.setQuantity(state.quantity + quantity.step)} data-xp-control>+</button>
    </div> : null}
    {secondary.length ? <div className="xp-buy-box__secondary-actions">{secondary.map((action) => <ProductActionControl key={action.id} action={action} state={state} />)}</div> : null}
    {!compact && primary ? <div className="xp-buy-box__primary-action"><ProductActionControl action={primary} state={state} /></div> : null}
    {!compact && committing ? <p className="xp-buy-box__status" role="status">{model.announcements.actionPending}</p> : null}
    {state.commitState === "error" ? <p className="xp-buy-box__status" role="alert">{model.announcements.error ?? model.announcements.actionFailed}</p> : null}
    {state.commitState === "success" ? <p className="xp-buy-box__status" role="status">{model.announcements.actionSucceeded ?? model.announcements.added}</p> : null}
    {compact && primary ? <StickyActionBar
      className="xp-buy-box__sticky"
      placement={actionPlacement}
      data-commit-state={committing ? "pending" : "idle"}
      summary={committing ? <span className="xp-buy-box__pending" data-compact-pending role="status">{model.announcements.actionPending}</span> : <><span>{model.product.title}</span><strong>{formatMoney(state.currentPrice)}</strong>{quantity ? <small>{quantity.inputLabel}: {state.quantity}</small> : null}</>}
      primary={<ProductActionControl action={primary} state={state} />}
    /> : null}
  </section>;
}
