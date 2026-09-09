"use client";

import { AdaptiveOverlay, StickyActionBar, useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  calculateCart,
  resolveShoppingCartFixture,
  type CalculatedCart,
  type CartFixture,
  type CartLineModel,
  type CartSummaryModel,
  type Money,
  type ProductMediaRecord,
  type ShoppingCartFixture,
  type ShoppingCartMediaMap,
  type ShoppingCartMediaRecord,
} from "./shopping-cart-model";

const formatMoney = ({ amountMinor, currency }: Money) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);

const countWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function liveItemCountLabel(template: string, initialCount: number, currentCount: number) {
  const initialWord = countWords[initialCount];
  const currentWord = countWords[currentCount] ?? String(currentCount);
  const candidates = [String(initialCount), initialWord, initialWord ? `${initialWord[0].toUpperCase()}${initialWord.slice(1)}` : undefined].filter(Boolean) as string[];
  const token = candidates.find((candidate) => new RegExp(`\\b${candidate}\\b`).test(template));
  if (!token) return `${currentCount} ${currentCount === 1 ? "item" : "items"}`;
  const replacement = /^\d+$/.test(token)
    ? String(currentCount)
    : token[0] === token[0].toUpperCase()
      ? `${currentWord[0].toUpperCase()}${currentWord.slice(1)}`
      : currentWord;
  return template.replace(new RegExp(`\\b${token}\\b`), replacement);
}

function ProductPicture({ record, alt }: { record: ProductMediaRecord; alt: string }) {
  return <picture className="xp-cart-line__media">
    <source srcSet={`${record.publicBase}-640.avif`} type="image/avif" />
    <source srcSet={`${record.publicBase}-640.webp`} type="image/webp" />
    <img src={`${record.publicBase}-640.jpg`} alt={alt} width={640} height={360} />
  </picture>;
}

export function CartLine({
  line,
  lineTotal,
  media,
  quantityBadge = false,
  onQuantityChange,
  onRemove,
}: {
  line: CartLineModel;
  lineTotal: Money;
  media: ProductMediaRecord;
  quantityBadge?: boolean;
  onQuantityChange?: (value: number) => void;
  onRemove?: () => void;
}) {
  const quantity = line.quantity;
  const update = (value: number) => onQuantityChange?.(Math.max(quantity.min, Math.min(quantity.max, value)));
  return <article className="xp-cart-line" data-xp-cart-line data-line-id={line.id}>
    {line.selection ? <label className="xp-cart-line__selection"><input type="checkbox" defaultChecked={line.selection.selected} /><span>{line.selection.label}</span></label> : null}
    <ProductPicture record={media} alt={line.media.alt} />
    <div className="xp-cart-line__identity">
      {quantityBadge ? <div className="xp-cart-line__identity-title"><h3>{line.title}</h3><span className="xp-cart-line__quantity-badge" data-quantity-badge={quantity.value} aria-label={`${quantity.inputLabel}: ${quantity.value}`}>{quantity.value}</span></div> : <h3>{line.title}</h3>}
      {line.meta.map((item) => <p key={item.id}><span>{item.label}</span><strong>{item.value}</strong></p>)}
      {line.fulfillment ? <p className="xp-cart-line__fulfillment"><span aria-hidden="true">●</span>{line.fulfillment.label}</p> : null}
      {line.variantEditor ? line.variantEditor.readOnly
        ? <p><span>{line.variantEditor.label}</span><strong>{line.variantEditor.options.find(({ id }) => id === line.variantEditor?.selectedId)?.label}</strong></p>
        : <label className="xp-cart-line__variant">{line.variantEditor.label}<select defaultValue={line.variantEditor.selectedId}>{line.variantEditor.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        : null}
    </div>
    {onQuantityChange ? <div className="xp-cart-line__quantity">
      <button type="button" aria-label={quantity.decrementLabel} disabled={quantity.value <= quantity.min} onClick={() => update(quantity.value - quantity.step)}>−</button>
      <label><span>{quantity.inputLabel}</span><input type="number" min={quantity.min} max={quantity.max} step={quantity.step} value={quantity.value} onChange={(event) => update(event.currentTarget.valueAsNumber)} /></label>
      <button type="button" aria-label={quantity.incrementLabel} disabled={quantity.value >= quantity.max} onClick={() => update(quantity.value + quantity.step)}>+</button>
    </div> : <p className="xp-cart-line__quantity xp-cart-line__quantity--static"><span>{quantity.inputLabel}</span><strong>{quantity.value}</strong></p>}
    <strong className="xp-cart-line__total">{formatMoney(lineTotal)}</strong>
    {line.actions?.remove && onRemove ? <button className="xp-cart-line__remove" type="button" onClick={onRemove}>{line.actions.remove.label}</button> : null}
  </article>;
}

function TotalMoney({ money, showCurrencyCode }: { money: Money; showCurrencyCode?: boolean }) {
  return <>{showCurrencyCode ? <small className="xp-cart-summary__currency">{money.currency}</small> : null}<span>{formatMoney(money)}</span></>;
}

function SummaryRows({ summary, calculated, includeTotal = true, showCurrencyCode = false }: { summary: CartSummaryModel; calculated: CalculatedCart; includeTotal?: boolean; showCurrencyCode?: boolean }) {
  const amountFor = (row: CartSummaryModel["rows"][number]) => row.kind === "discount"
    ? { ...calculated.discount, amountMinor: -calculated.discount.amountMinor }
    : row.kind === "adjustment" ? row.amount : calculated[row.kind];
  return <dl className="xp-cart-summary__rows">
    {summary.rows.map((row) => <div key={row.id}><dt>{row.label}</dt><dd>{formatMoney(amountFor(row))}</dd></div>)}
    {includeTotal ? <div className="xp-cart-summary__total"><dt>{summary.totalLabel}</dt><dd><TotalMoney money={calculated.total} showCurrencyCode={showCurrencyCode} /></dd></div> : null}
  </dl>;
}

function SummaryActions({ summary, onPrimary }: { summary: CartSummaryModel; onPrimary?: () => void }) {
  return <>
    {summary.secondaryAction ? <button type="button" className="xp-cart-action xp-cart-action--secondary">{summary.secondaryAction.label}</button> : null}
    <button type="button" className="xp-cart-action xp-cart-action--primary" onClick={onPrimary}>{summary.primaryAction.label}</button>
  </>;
}

export function CartSummary({
  summary,
  calculated,
  form,
  placement = "page",
  showCurrencyCode = false,
  onPrimary,
}: {
  summary: CartSummaryModel;
  calculated: CalculatedCart;
  form: "band" | "pane";
  placement?: "page" | "overlay";
  showCurrencyCode?: boolean;
  onPrimary?: () => void;
}) {
  if (form === "band") return <StickyActionBar
    className="xp-cart-summary xp-cart-summary--band"
    placement={placement}
    summary={<><span>{summary.totalLabel}</span><strong><TotalMoney money={calculated.total} showCurrencyCode={showCurrencyCode} /></strong></>}
    secondary={summary.secondaryAction ? <button type="button" className="xp-cart-action xp-cart-action--secondary">{summary.secondaryAction.label}</button> : undefined}
    primary={<button type="button" className="xp-cart-action xp-cart-action--primary" onClick={onPrimary}>{summary.primaryAction.label}</button>}
  />;
  return <aside className="xp-cart-summary xp-cart-summary--pane" data-xp-cart-summary data-form="pane">
    <SummaryRows summary={summary} calculated={calculated} showCurrencyCode={showCurrencyCode} />
    <div className="xp-cart-summary__actions"><SummaryActions summary={summary} onPrimary={onPrimary} /></div>
  </aside>;
}

function CartBody({
  fixture,
  mediaMap,
  compactSummary,
  overlay,
  renderPageHeader,
}: {
  fixture: CartFixture;
  mediaMap: ShoppingCartMediaMap;
  compactSummary: boolean;
  overlay?: boolean;
  renderPageHeader?: (itemCount: number) => ReactNode;
}) {
  const [items, setItems] = useState(() => fixture.items);
  const [removed, setRemoved] = useState<CartLineModel | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const working = useMemo(() => ({ ...fixture, items }), [fixture, items]);
  const calculated = useMemo(() => calculateCart(working), [working]);
  const records = mediaMap.records.filter(({ slug }) => slug === fixture.sourceKey);
  const changeQuantity = (id: string, value: number) => setItems((current) => current.map((line) => line.id === id ? { ...line, quantity: { ...line.quantity, value } } : line));
  const remove = (id: string) => setItems((current) => {
    const line = current.find((item) => item.id === id) ?? null;
    setRemoved(line);
    return current.filter((item) => item.id !== id);
  });
  const undo = () => {
    if (removed) setItems((current) => [...current, removed].sort((left, right) => fixture.items.findIndex(({ id }) => id === left.id) - fixture.items.findIndex(({ id }) => id === right.id)));
    setRemoved(null);
  };
  const body = <>
      {items.length ? <div className="xp-cart-surface__lines">{items.map((line) => <CartLine key={line.id} line={line} lineTotal={calculated.lineTotals[line.id]} media={records.find(({ key }) => key === line.media.assetKey)!} quantityBadge={fixture.sourceKey === "shopping-cart-04"} onQuantityChange={(value) => changeQuantity(line.id, value)} onRemove={line.actions?.remove ? () => remove(line.id) : undefined} />)}</div>
        : <section className="xp-cart-surface__empty"><h2>{fixture.copy.emptyHeading}</h2><p>{fixture.copy.emptyBody}</p></section>}
      {removed ? <div className="xp-cart-surface__undo" role="status"><span>{fixture.states.removal}</span><button type="button" onClick={undo}>{fixture.copy.undoLabel}</button></div> : null}
      {fixture.summary.coupon ? <section className="xp-cart-surface__coupon"><button type="button" aria-expanded={couponOpen} onClick={() => setCouponOpen((current) => !current)}>{fixture.summary.coupon.label}</button>{couponOpen ? <div><label>{fixture.summary.coupon.fieldLabel}<input type="text" /></label><button type="button">{fixture.summary.coupon.applyLabel}</button></div> : null}</section> : null}
      {fixture.summary.trustMethods?.length ? <ul className="xp-cart-surface__trust" aria-label="Order assurances">
        {fixture.summary.trustMethods.map((method) => <li key={method.id}><span aria-hidden="true" data-icon-key={method.iconKey}>✓</span>{method.label}</li>)}
      </ul> : null}
      {compactSummary ? <SummaryRows summary={fixture.summary} calculated={calculated} includeTotal={fixture.sourceKey !== "shopping-cart-04"} /> : null}
    </>;
  const summary = <CartSummary summary={fixture.summary} calculated={calculated} form={compactSummary ? "band" : "pane"} placement={overlay ? "overlay" : "page"} showCurrencyCode={fixture.sourceKey === "shopping-cart-04"} />;
  if (overlay) return <>
    <AdaptiveOverlay.Body className="xp-cart-surface__body">{body}<p className="xp-cart-surface__live" aria-live="polite">{fixture.copy.updateAnnouncement}</p></AdaptiveOverlay.Body>
    {summary}
  </>;
  return <>
    {renderPageHeader?.(items.length)}
    <div className="xp-cart-surface__composition" data-empty={items.length === 0 || undefined}>
      <div className="xp-cart-surface__body">{body}</div>
      {summary}
      <p className="xp-cart-surface__live" aria-live="polite">{fixture.copy.updateAnnouncement}</p>
    </div>
  </>;
}

function TransientCart({ fixture, mediaMap, trigger, defaultOpen }: { fixture: CartFixture; mediaMap: ShoppingCartMediaMap; trigger?: ReactNode; defaultOpen?: boolean }) {
  const deviceClass = useDeviceClass();
  const [open, setOpen] = useState(false);
  const openedFromDefault = useRef(false);
  useEffect(() => {
    if (!defaultOpen || openedFromDefault.current) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        openedFromDefault.current = true;
        setOpen(true);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [defaultOpen]);
  const source02 = fixture.sourceKey === "shopping-cart-02";
  const presentation = source02
    ? { M: "sheet", TP: "sheet", TL: "side-drawer", DS: "side-drawer", DW: "side-drawer" } as const
    : { M: "sheet", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" } as const;
  return <div className="xp-cart-surface" data-xp-cart-renderer data-source-key={fixture.sourceKey} data-preset={fixture.preset} data-device-class={deviceClass}>
    <AdaptiveOverlay intent="inspect" presentation={presentation} why="Transient cart returns to its owning shopping context" open={open} onOpenChange={setOpen}>
      <AdaptiveOverlay.Trigger>{trigger ?? fixture.copy.heading}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-cart-surface__overlay" data-source-key={fixture.sourceKey} data-device-class={deviceClass}>
        <AdaptiveOverlay.Header title={fixture.copy.heading} description={fixture.copy.itemCountLabel} closeLabel="Close cart" />
        <CartBody fixture={fixture} mediaMap={mediaMap} compactSummary overlay />
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </div>;
}

export function CartSurface({ model, mediaMap, trigger, defaultOpen }: { model: ShoppingCartFixture; mediaMap: ShoppingCartMediaMap; trigger?: ReactNode; defaultOpen?: boolean }) {
  const resolved = resolveShoppingCartFixture(model, mediaMap);
  const deviceClass = useDeviceClass();
  if (resolved.sourceKey === "shopping-cart-03") throw new Error("shopping-cart-03 is owned by CheckoutFlow, not CartSurface.");
  if (resolved.preset !== "cart-page") return <TransientCart fixture={resolved} mediaMap={mediaMap} trigger={trigger} defaultOpen={defaultOpen} />;
  const compactSummary = deviceClass === "M" || deviceClass === "TP" || deviceClass === "TL";
  return <section className="xp-cart-surface" data-xp-cart-renderer data-source-key={resolved.sourceKey} data-preset={resolved.preset} data-device-class={deviceClass} aria-labelledby={`${resolved.sourceKey}-title`}>
    <CartBody
      fixture={resolved}
      mediaMap={mediaMap}
      compactSummary={compactSummary}
      renderPageHeader={(itemCount) => <header className="xp-cart-surface__header">
        <div><p>Equipment order</p><h1 id={`${resolved.sourceKey}-title`}>{resolved.copy.heading}</h1></div>
        <strong data-item-count={itemCount}>{liveItemCountLabel(resolved.copy.itemCountLabel, resolved.items.length, itemCount)}</strong>
      </header>}
    />
  </section>;
}
