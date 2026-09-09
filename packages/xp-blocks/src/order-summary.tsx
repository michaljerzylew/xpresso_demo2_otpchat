"use client";

import { AdaptiveOverlay, Tabs, useDeviceClass } from "@xp/primitives";
import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  calculateReceipt,
  resolveReceiptFixture,
  type ReceiptAction,
  type ReceiptFact,
  type ReceiptFixture,
  type ReceiptGroup,
  type ReceiptItem,
  type ReceiptMediaSeat,
  type ReceiptPricingRow,
  type ReceiptRegionRef,
  type ReceiptStressKey,
  type ResolvedReceiptFixture,
} from "./order-summary-model";
import type { Money } from "./shopping-cart-model";

export type ResolvedReceiptMedia = {
  slug: string;
  key: string;
  mediaId: string;
  role: ReceiptMediaSeat["role"];
  kind: "responsive-image" | "vector";
  assetId: string;
  publicBase?: string;
  publicPath?: string;
  alt: string;
  presentation: ReceiptMediaSeat["presentation"];
};
export type ResolveReceiptMediaSeat = (seat: ReceiptMediaSeat) => ResolvedReceiptMedia;
export type ReceiptProps = {
  fixture: ReceiptFixture;
  stress?: ReceiptStressKey;
  resolveMediaSeat: ResolveReceiptMediaSeat;
  placement?: "inline" | "overlay";
  onAction?: (action: ReceiptAction) => void;
  onQuantityChange?: (itemId: string, value: number) => void;
  initialViewId?: string;
};

const formatMoney = ({ amountMinor, currency }: Money) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 100);
const slotBand = (width?: number) => width === undefined ? "S1" : width < 320 ? "S1" : width < 416 ? "S2" : width < 544 ? "S3" : width < 672 ? "S4" : width < 896 ? "S5" : "S6";

function validateResolvedMedia(seat: ReceiptMediaSeat, record: ResolvedReceiptMedia, sourceKey: string) {
  if (record.slug !== sourceKey || record.key !== seat.assetKey || record.mediaId !== seat.id || record.role !== seat.role || record.presentation !== seat.presentation) {
    throw new Error(`${sourceKey}/${seat.id} resolved the wrong receipt media record.`);
  }
  if (record.kind === "responsive-image") {
    if (seat.role !== "product-thumb" || !record.publicBase?.startsWith("/media/") || record.publicBase === seat.assetKey || /^https?:\/\//i.test(record.publicBase)) {
      throw new Error(`${sourceKey}/${seat.id} requires a local responsive product path, not its asset key.`);
    }
  } else if (seat.role !== "payment-mark" || !record.publicPath?.startsWith("/media/") || !record.publicPath.endsWith(".svg") || record.publicPath === seat.assetKey || /^https?:\/\//i.test(record.publicPath)) {
    throw new Error(`${sourceKey}/${seat.id} requires a local SVG payment mark.`);
  }
}

function ReceiptPicture({ seat, record }: { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }) {
  if (record.kind === "vector") return <span className="xp-receipt__mark" data-receipt-media-id={seat.id}><img src={record.publicPath} alt={seat.alt} /></span>;
  return <picture className="xp-receipt__picture" data-receipt-media-id={seat.id} data-presentation={seat.presentation}>
    <source srcSet={`${record.publicBase}-640.avif`} type="image/avif" />
    <source srcSet={`${record.publicBase}-640.webp`} type="image/webp" />
    <img src={`${record.publicBase}-640.jpg`} alt={seat.alt} width={640} height={360} loading="lazy" decoding="async" />
  </picture>;
}

const iconGlyph: Record<NonNullable<ReceiptFact["iconKey"]>, string> = { mail: "✉", location: "⌖", person: "●", payment: "▣", shipping: "→", note: "□" };

function FactList({ facts, media }: { facts: ReceiptFact[]; media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }> }) {
  return <dl className="xp-receipt__facts">{facts.map((fact) => <div key={fact.id} data-receipt-fact-id={fact.id}>
    {fact.iconKey ? <span className="xp-receipt__fact-icon" data-icon-key={fact.iconKey} aria-hidden="true">{iconGlyph[fact.iconKey]}</span> : null}
    <dt>{fact.label}</dt>
    <dd>{fact.value}{fact.mediaId ? <ReceiptPicture {...media.get(fact.mediaId)!} /> : null}</dd>
  </div>)}</dl>;
}

function ReceiptGroups({ groups, media }: { groups: ReceiptGroup[]; media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }> }) {
  return <div className="xp-receipt__groups">{groups.map((group) => <section className="xp-receipt__group" data-receipt-group-id={group.id} key={group.id}><h2>{group.title}</h2><FactList facts={group.facts} media={media} /></section>)}</div>;
}

function QuantityControl({ item, value, onChange }: { item: ReceiptItem; value: number; onChange: (value: number) => void }) {
  const quantity = item.quantity;
  if (quantity.mode === "fixed") return <p className="xp-receipt__fixed-quantity"><span>{quantity.label}</span><strong>{value}</strong></p>;
  const update = (next: number) => Number.isFinite(next) && onChange(Math.min(quantity.max, Math.max(quantity.min, next)));
  return <div className="xp-receipt__stepper">
    <button type="button" aria-label={quantity.decrementLabel} disabled={value <= quantity.min} onClick={() => update(value - quantity.step)}>−</button>
    <label><span>{quantity.label}</span><input type="number" min={quantity.min} max={quantity.max} step={quantity.step} value={value} onChange={(event) => update(event.currentTarget.valueAsNumber)} /></label>
    <button type="button" aria-label={quantity.incrementLabel} disabled={value >= quantity.max} onClick={() => update(value + quantity.step)}>+</button>
  </div>;
}

type ItemRegionProps = {
  model: ResolvedReceiptFixture;
  quantities: Record<string, number>;
  calculated: ReturnType<typeof calculateReceipt>;
  media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }>;
  onQuantity: (item: ReceiptItem, value: number) => void;
};

function ItemCard({ item, quantity, lineTotal, media, onQuantity }: { item: ReceiptItem; quantity: number; lineTotal: Money; media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }>; onQuantity: (value: number) => void }) {
  return <li className="xp-receipt__item" data-receipt-item-id={item.id}>
    <ReceiptPicture {...media.get(item.mediaId)!} />
    <div className="xp-receipt__item-copy"><h3>{item.title}</h3><FactList facts={item.attributes} media={media} /></div>
    <QuantityControl item={item} value={quantity} onChange={onQuantity} />
    <p className="xp-receipt__line-total"><span>{item.lineTotalLabel}</span><strong>{formatMoney(lineTotal)}</strong></p>
    {item.delivery ? <div className="xp-receipt__delivery" data-receipt-fact-id={item.delivery.id}><span>{item.delivery.label}</span><strong>{item.delivery.value}</strong></div> : null}
  </li>;
}

function ItemCards(properties: ItemRegionProps) {
  return <section className="xp-receipt__items" aria-label={properties.model.copy.itemCollectionLabel}><h2>{properties.model.copy.itemCollectionLabel}</h2><ol>{properties.model.items.map((item) => <ItemCard key={item.id} item={item} quantity={properties.quantities[item.id]} lineTotal={properties.calculated.lineTotals[item.id]} media={properties.media} onQuantity={(value) => properties.onQuantity(item, value)} />)}</ol></section>;
}

function ItemTable(properties: ItemRegionProps) {
  const first = properties.model.items[0];
  return <section className="xp-receipt__items xp-receipt__items--table" aria-label={properties.model.copy.itemCollectionLabel}><h2>{properties.model.copy.itemCollectionLabel}</h2><div className="xp-receipt__table-wrap"><table><thead><tr><th scope="col">{properties.model.copy.itemCollectionLabel}</th><th scope="col">{first.quantity.label}</th><th scope="col">{first.lineTotalLabel}</th><th scope="col">{first.delivery?.label}</th></tr></thead><tbody>{properties.model.items.map((item) => <tr key={item.id} data-receipt-item-id={item.id}>
    <th scope="row"><span className="xp-receipt__table-identity"><ReceiptPicture {...properties.media.get(item.mediaId)!} /><span><strong>{item.title}</strong><FactList facts={item.attributes} media={properties.media} /></span></span></th>
    <td data-label={item.quantity.label}><QuantityControl item={item} value={properties.quantities[item.id]} onChange={(value) => properties.onQuantity(item, value)} /></td>
    <td data-label={item.lineTotalLabel}><strong>{formatMoney(properties.calculated.lineTotals[item.id])}</strong></td>
    <td data-label={item.delivery?.label}><span data-receipt-fact-id={item.delivery?.id}>{item.delivery?.value}</span></td>
  </tr>)}</tbody></table></div></section>;
}

function Pricing({ model, calculated }: { model: ResolvedReceiptFixture; calculated: ReturnType<typeof calculateReceipt> }) {
  const amount = (row: ReceiptPricingRow) => row.kind === "subtotal"
    ? calculated.subtotal
    : row.kind === "discount" ? { ...row.amount, amountMinor: -row.amount.amountMinor } : row.amount;
  return <section className="xp-receipt__pricing" aria-label={model.copy.pricingLabel}><h2>{model.copy.pricingLabel}</h2><dl>{model.pricing.rows.map((row) => <div key={row.id} data-pricing-kind={row.kind}><dt>{row.label}</dt><dd>{formatMoney(amount(row))}</dd></div>)}<div className="xp-receipt__grand-total"><dt>{model.pricing.totalLabel}</dt><dd>{formatMoney(calculated.total)}</dd></div></dl></section>;
}

function Timeline({ model }: { model: ResolvedReceiptFixture }) {
  return <section className="xp-receipt__timeline" aria-label={model.copy.timelineLabel}><h2>{model.copy.timelineLabel}</h2><ol>{model.timeline!.map((event) => <li key={event.id} data-receipt-event-id={event.id} data-event-state={event.state}><span className="xp-receipt__event-mark" aria-hidden="true" /><div><strong>{event.title}</strong><p>{event.description}</p></div><span className="xp-receipt__event-status"><span>{event.state}</span>{event.timeLabel ? <time>{event.timeLabel}</time> : null}</span></li>)}</ol></section>;
}

function ReceiptActionControl({ action, onAction }: { action: ReceiptAction; onAction?: (action: ReceiptAction) => void }) {
  const properties = { className: "xp-receipt__action", "data-receipt-action-id": action.id, "data-emphasis": action.emphasis };
  return action.behavior === "navigate"
    ? <a {...properties} href={action.href} onClick={() => onAction?.(action)}>{action.label}</a>
    : <button {...properties} type="button" onClick={() => onAction?.(action)}>{action.label}</button>;
}

function ReceiptActions({ actions, onAction }: { actions: ReceiptAction[]; onAction?: (action: ReceiptAction) => void }) {
  return <div className="xp-receipt__actions">{actions.map((action) => <ReceiptActionControl action={action} onAction={onAction} key={action.id} />)}</div>;
}

function ErrorState({ model }: { model: ResolvedReceiptFixture }) {
  return <section className="xp-receipt__error" role="alert"><h2>{model.copy.errorTitle}</h2><p>{model.copy.errorDescription}</p>{model.copy.retryLabel ? <button type="button" data-receipt-retry>{model.copy.retryLabel}</button> : null}</section>;
}

function ViewRegion({ region, itemRegion, model, calculated, media }: { region: ReceiptRegionRef; itemRegion: ReactNode; model: ResolvedReceiptFixture; calculated: ReturnType<typeof calculateReceipt>; media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }> }) {
  if (region.kind === "items") return itemRegion;
  if (region.kind === "pricing") return <Pricing model={model} calculated={calculated} />;
  if (region.kind === "timeline") return <Timeline model={model} />;
  const group = model.groups.find(({ id }) => id === region.groupId)!;
  return <ReceiptGroups groups={[group]} media={media} />;
}

function ReceiptViews({ model, activeId, onActiveChange, itemRegion, calculated, media, printing }: { model: ResolvedReceiptFixture; activeId: string; onActiveChange: (id: string) => void; itemRegion: ReactNode; calculated: ReturnType<typeof calculateReceipt>; media: Map<string, { seat: ReceiptMediaSeat; record: ResolvedReceiptMedia }>; printing: boolean }) {
  if (printing) return <div className="xp-receipt__print-views">{model.views!.map((view) => <section key={view.id}><h2>{view.label}</h2>{view.regions.map((region, index) => <ViewRegion key={`${view.id}-${index}`} region={region} itemRegion={itemRegion} model={model} calculated={calculated} media={media} />)}</section>)}</div>;
  return <Tabs.Root className="xp-receipt__tabs" value={activeId} onValueChange={onActiveChange}>
    <Tabs.List aria-label={model.copy.heading}>{model.views!.map((view) => <Tabs.Trigger key={view.id} id={`${model.sourceKey}-${view.id}-tab`} value={view.id} data-receipt-view-id={view.id}>{view.label}</Tabs.Trigger>)}</Tabs.List>
    {model.views!.map((view) => <Tabs.Content key={view.id} value={view.id} id={`${model.sourceKey}-${view.id}-panel`} aria-labelledby={`${model.sourceKey}-${view.id}-tab`}>{view.regions.map((region, index) => <ViewRegion key={`${view.id}-${index}`} region={region} itemRegion={itemRegion} model={model} calculated={calculated} media={media} />)}</Tabs.Content>)}
  </Tabs.Root>;
}

function ReceiptBody({ model, skeleton, quantities, calculated, media, onQuantity, activeViewId, onViewChange, printing }: ItemRegionProps & { skeleton: string; activeViewId: string; onViewChange: (id: string) => void; printing: boolean }) {
  const itemRegion = skeleton === "table"
    ? <ItemTable model={model} quantities={quantities} calculated={calculated} media={media} onQuantity={onQuantity} />
    : <ItemCards model={model} quantities={quantities} calculated={calculated} media={media} onQuantity={onQuantity} />;
  if (model.activeStress === "error") return <ErrorState model={model} />;
  if (model.preset === "tabbed-tracker") return <div className="xp-receipt__composition">
    {model.headerFacts.length ? <section className="xp-receipt__meta" aria-label={model.copy.heading}><FactList facts={model.headerFacts} media={media} /></section> : null}
    <ReceiptViews model={model} activeId={activeViewId} onActiveChange={onViewChange} itemRegion={itemRegion} calculated={calculated} media={media} printing={printing} />
  </div>;
  return <div className="xp-receipt__composition">
    {model.headerFacts.length ? <section className="xp-receipt__meta" aria-label={model.copy.heading}><FactList facts={model.headerFacts} media={media} /></section> : null}
    {model.groups.length ? <ReceiptGroups groups={model.groups} media={media} /> : null}
    {itemRegion}
    <Pricing model={model} calculated={calculated} />
    {model.acknowledgement ? <blockquote className="xp-receipt__acknowledgement"><p>{model.acknowledgement.message}</p><cite>{model.acknowledgement.signature}</cite></blockquote> : null}
  </div>;
}

function chooseSkeleton(model: ResolvedReceiptFixture, deviceClass: string, width?: number) {
  const wideClass = deviceClass === "TL" || deviceClass === "DS" || deviceClass === "DW";
  if (model.preset === "delivery-table" && wideClass && (width ?? 0) >= 720) return "table";
  if (model.preset === "split-dialog" && wideClass && (width ?? 0) >= 560) return "grouped-panes";
  if (model.preset === "post-purchase" && wideClass && (width ?? 0) >= 560) return "grouped-panes";
  if (model.preset === "tabbed-tracker") return wideClass ? "tabbed-ticket" : "ticket";
  return deviceClass === "M" ? "ticket" : "labelled-rows";
}

export function Receipt({ fixture, stress, resolveMediaSeat, placement = "inline", onAction, onQuantityChange, initialViewId }: ReceiptProps) {
  const model = useMemo(() => resolveReceiptFixture(fixture, stress), [fixture, stress]);
  const deviceClass = useDeviceClass();
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const [layoutWidth, setLayoutWidth] = useState<number>();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => Object.fromEntries(model.items.map((item) => [item.id, item.quantity.value])));
  const [announcement, setAnnouncement] = useState("");
  const [activeViewId, setActiveViewId] = useState(initialViewId ?? model.initialViewId ?? "");
  const [printing, setPrinting] = useState(false);
  useEffect(() => { const node = root.current; if (!node) return; const measuredNode = placement === "overlay" ? node.parentElement ?? node : node; const measure = () => { setWidth(node.getBoundingClientRect().width); setLayoutWidth(measuredNode.getBoundingClientRect().width); }; measure(); const observer = new ResizeObserver(measure); observer.observe(node); if (measuredNode !== node) observer.observe(measuredNode); return () => observer.disconnect(); }, [placement]);
  useEffect(() => { setQuantities(Object.fromEntries(model.items.map((item) => [item.id, item.quantity.value]))); setAnnouncement(""); setActiveViewId(initialViewId ?? model.initialViewId ?? ""); }, [initialViewId, model]);
  useEffect(() => { const before = () => setPrinting(true); const after = () => setPrinting(false); window.addEventListener("beforeprint", before); window.addEventListener("afterprint", after); return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); }; }, []);
  const media = useMemo(() => new Map(model.media.map((seat) => { const record = resolveMediaSeat(seat); validateResolvedMedia(seat, record, model.sourceKey); return [seat.id, { seat, record }] as const; })), [model, resolveMediaSeat]);
  const calculated = useMemo(() => calculateReceipt(model, quantities), [model, quantities]);
  const skeleton = chooseSkeleton(model, deviceClass, layoutWidth);
  const form = deviceClass === "M" || deviceClass === "TP" ? "stack" : "pane";
  const changeQuantity = (item: ReceiptItem, value: number) => { setQuantities((current) => ({ ...current, [item.id]: value })); setAnnouncement(model.copy.updateAnnouncement ?? ""); onQuantityChange?.(item.id, value); };
  const changeView = (id: string) => { setActiveViewId(id); setAnnouncement(model.copy.viewAnnouncement ?? ""); };
  const body = <ReceiptBody model={model} skeleton={skeleton} quantities={quantities} calculated={calculated} media={media} onQuantity={changeQuantity} activeViewId={activeViewId} onViewChange={changeView} printing={printing} />;
  const headerActions = model.actions.filter(({ placement: actionPlacement }) => actionPlacement === "header");
  const footerActions = model.actions.filter(({ placement: actionPlacement }) => actionPlacement === "footer");
  const headingId = `${model.sourceKey}-receipt-heading`;
  const rootProperties = { ref: root, className: `xp-receipt xp-receipt--${placement}`, "data-xp-receipt": "", "data-xp-owner": "Receipt", "data-source-key": model.sourceKey, "data-preset": model.preset, "data-device-class": deviceClass, "data-slot-band": slotBand(width), "data-form": form, "data-receipt-skeleton": skeleton, "aria-labelledby": headingId } as const;
  if (placement === "overlay") return <div {...rootProperties}>
    <AdaptiveOverlay.Header title={<span id={headingId}>{model.copy.heading}</span>} description={model.copy.description} closeLabel={model.copy.closeLabel} />
    <AdaptiveOverlay.Body className="xp-receipt__body" data-xp-receipt-scroll>{body}<p className="xp-receipt__live" aria-live="polite">{announcement}</p></AdaptiveOverlay.Body>
    <AdaptiveOverlay.Footer>{footerActions.length ? <ReceiptActions actions={footerActions} onAction={onAction} /> : null}</AdaptiveOverlay.Footer>
  </div>;
  return <div {...rootProperties}>
    <header className="xp-receipt__header"><div><h1 id={headingId}>{model.copy.heading}</h1>{model.copy.description ? <p>{model.copy.description}</p> : null}</div>{headerActions.length ? <ReceiptActions actions={headerActions} onAction={onAction} /> : null}</header>
    <div className="xp-receipt__body">{body}</div>
    {footerActions.length ? <footer className="xp-receipt__footer"><ReceiptActions actions={footerActions} onAction={onAction} /></footer> : null}
    <p className="xp-receipt__live" aria-live="polite">{announcement}</p>
  </div>;
}
