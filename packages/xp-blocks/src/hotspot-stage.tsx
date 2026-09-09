"use client";

import { AdaptiveOverlay, MorphSlot } from "@xp/primitives";
import { Children, useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { resolveCategoryMedia, type CategoryDeviceForm, type ProductCategoryMediaMap, type ProductCategoryStressKey } from "./category-nav-model";
import { resolveHotspotStageFixture, type HotspotCropKey, type HotspotProduct, type HotspotStageFixture, type ResolvedHotspotStage } from "./hotspot-stage-model";

export const HOTSPOT_STAGE_FORM_LADDER = { M: "M", TP: "TP", TL: "TL", DS: "DS", DW: "DW" } as const;

export type HotspotStageProperties = {
  fixture: HotspotStageFixture;
  mediaMap: ProductCategoryMediaMap;
  stress?: ProductCategoryStressKey;
  className?: string;
};

type HotspotStageState = { activeHotspotId: string | null; open: boolean; quantity: number; saved: boolean; slotWidth: number };
type HotspotStageView = { model: ResolvedHotspotStage; mediaMap: ProductCategoryMediaMap; state: HotspotStageState; setState: Dispatch<SetStateAction<HotspotStageState>> };

function slotCropKey(form: CategoryDeviceForm, width: number): HotspotCropKey {
  if (form !== "DW") return form;
  const band = width < 280 ? 240 : width < 370 ? 320 : width < 490 ? 420 : width < 640 ? 560 : width < 840 ? 720 : 960;
  return `DW-slot-${band}`;
}

function formatPrice(product: HotspotProduct) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount);
}

function ProductMedia({ view, product, form }: { view: HotspotStageView; product: HotspotProduct; form: CategoryDeviceForm }) {
  const failed = view.model.activeStress === "error" || view.model.activeStress === "productMediaFallback";
  const seat = { id: product.mediaId, alt: product.name, role: "product-still" as const, aspect: "1:1" as const };
  const media = resolveCategoryMedia(view.mediaMap, view.model.sourceKey, seat, form, failed);
  if (media.status !== "resolved" || !media.publicBase) return <div className="xp-hotspot-stage__product-fallback" data-media-seat-id={seat.id} data-media-status={media.status} role="img" aria-label={`${product.name}. ${view.model.messages.productFailure}`}><span aria-hidden="true">◇</span><small>{view.model.messages.productFailure}</small></div>;
  return <picture className="xp-hotspot-stage__product-picture" data-media-seat-id={seat.id} data-media-status="resolved" style={{ "--xp-hotspot-focal": media.objectPosition ?? "50% 50%" } as CSSProperties}><source type="image/avif" srcSet={`${media.publicBase}-1280.avif 1280w, ${media.publicBase}-1920.avif 1920w`} /><source type="image/webp" srcSet={`${media.publicBase}-1280.webp 1280w, ${media.publicBase}-1920.webp 1920w`} /><img src={`${media.publicBase}-1280.webp`} alt={product.name} loading="lazy" decoding="async" /></picture>;
}

function ProductDetail({ view, product, form }: { view: HotspotStageView; product: HotspotProduct; form: CategoryDeviceForm }) {
  const updateQuantity = (quantity: number) => view.setState((current) => ({ ...current, quantity: Math.max(1, Math.min(99, Number.isFinite(quantity) ? quantity : 1)) }));
  return <div className="xp-hotspot-stage__detail" data-product-id={product.id}>
    <ProductMedia view={view} product={product} form={form} />
    <div className="xp-hotspot-stage__detail-copy"><div className="xp-hotspot-stage__price-row"><strong>{formatPrice(product)}</strong><span aria-label={`${product.rating.value} out of ${product.rating.maximum} stars, ${product.rating.reviewCount} reviews`}>★ {product.rating.value} <small>({product.rating.reviewCount})</small></span></div><p>{product.description}</p>
      <div className="xp-hotspot-stage__local-actions"><button type="button" data-xp-control aria-label={`${view.state.saved ? view.model.labels.unsave : view.model.labels.save}: ${product.name}`} aria-pressed={view.state.saved} onClick={() => view.setState((current) => ({ ...current, saved: !current.saved }))}>{view.state.saved ? view.model.labels.unsave : view.model.labels.save}</button><label><span>{view.model.labels.quantity}</span><span className="xp-hotspot-stage__stepper"><button type="button" data-xp-control aria-label={view.model.labels.decrease} disabled={view.state.quantity === 1} onClick={() => updateQuantity(view.state.quantity - 1)}>−</button><input type="number" min="1" max="99" value={view.state.quantity} onChange={(event) => updateQuantity(event.currentTarget.valueAsNumber)} /><button type="button" data-xp-control aria-label={view.model.labels.increase} disabled={view.state.quantity === 99} onClick={() => updateQuantity(view.state.quantity + 1)}>+</button></span></label></div>
      <a className="xp-hotspot-stage__destination" data-action-id={product.action.id} data-xp-control href={product.action.href}>{product.action.label}<span aria-hidden="true"> →</span></a>
    </div>
  </div>;
}

function RoomVisual({ view, form, cropKey, children }: { view: HotspotStageView; form: CategoryDeviceForm; cropKey: HotspotCropKey; children: ReactNode }) {
  const failed = view.model.activeStress === "error" || view.model.activeStress === "roomMediaFallback";
  const media = resolveCategoryMedia(view.mediaMap, view.model.sourceKey, view.model.roomMedia, form, failed);
  if (media.status !== "resolved" || !media.publicBase) return <div className="xp-hotspot-stage__room-fallback" data-media-seat-id={view.model.roomMedia.id} data-media-status={media.status}><div role="img" aria-label={`${view.model.roomMedia.alt}. ${view.model.messages.roomFailure}`}><span aria-hidden="true">◇</span><p>{view.model.messages.roomFailure}</p></div><ol className="xp-hotspot-stage__fallback-selectors" aria-label={view.model.labels.selectProduct}>{Children.map(children, (child) => <li>{child}</li>)}</ol></div>;
  return <div className="xp-hotspot-stage__room" data-hotspot-crop-key={cropKey}><picture data-media-seat-id={view.model.roomMedia.id} data-media-status="resolved" style={{ "--xp-hotspot-focal": media.objectPosition ?? "50% 50%" } as CSSProperties}><source type="image/avif" srcSet={`${media.publicBase}-1280.avif 1280w, ${media.publicBase}-1920.avif 1920w`} /><source type="image/webp" srcSet={`${media.publicBase}-1280.webp 1280w, ${media.publicBase}-1920.webp 1920w`} /><img src={`${media.publicBase}-1280.webp`} alt={view.model.roomMedia.alt} /></picture>{children}</div>;
}

function HotspotComposition({ view, form }: { view: HotspotStageView; form: CategoryDeviceForm }) {
  const cropKey = slotCropKey(form, view.state.slotWidth);
  const selectHotspot = (hotspotId: string) => {
    view.setState((current) => ({ ...current, open: false, activeHotspotId: hotspotId, quantity: 1, saved: false }));
    requestAnimationFrame(() => view.setState((current) => current.activeHotspotId === hotspotId ? { ...current, open: true } : current));
  };
  const activeAnchor = view.model.hotspots.find(({ hotspotId }) => hotspotId === view.state.activeHotspotId) ?? view.model.hotspots[0];
  const activeProduct = view.model.products.find(({ id }) => id === activeAnchor?.productId) ?? view.model.products[0];
  return <AdaptiveOverlay intent="pick" presentation={{ TL: "sheet" }} why="Touch landscape needs a non-clipped anchored detail sheet." open={view.state.open} onOpenChange={(open) => { const returnTarget = view.state.activeHotspotId; view.setState((current) => ({ ...current, open, activeHotspotId: open ? current.activeHotspotId : null })); if (!open && returnTarget) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-hotspot-id="${returnTarget}"]`)?.focus()); }}>
    <RoomVisual view={view} form={form} cropKey={cropKey}>{view.model.hotspots.map((hotspot, index) => {
      const product = view.model.products.find(({ id }) => id === hotspot.productId);
      const point = hotspot.byCrop?.[cropKey];
      if (!product) return null;
      const trigger = <button type="button" className="xp-control xp-hotspot-stage__trigger" data-xp-control data-hotspot-id={hotspot.hotspotId} data-selected={hotspot.hotspotId === view.state.activeHotspotId ? "true" : undefined} aria-label={`${view.model.labels.selectProduct}: ${product.name}`} aria-pressed={hotspot.hotspotId === view.state.activeHotspotId} style={point ? { "--xp-hotspot-x": `${point.xPct}%`, "--xp-hotspot-y": `${point.yPct}%` } as CSSProperties : undefined} onClick={() => selectHotspot(hotspot.hotspotId)} key={hotspot.hotspotId}><span>{String(index + 1).padStart(2, "0")}</span><b>{product.name}</b></button>;
      return hotspot.hotspotId === activeAnchor?.hotspotId ? <AdaptiveOverlay.Anchor key={hotspot.hotspotId}>{trigger}</AdaptiveOverlay.Anchor> : trigger;
    })}</RoomVisual>
    {activeProduct ? <AdaptiveOverlay.Content className="xp-hotspot-stage__overlay" data-product-id={activeProduct.id}><AdaptiveOverlay.Header title={activeProduct.name} description={`${formatPrice(activeProduct)} · ★ ${activeProduct.rating.value}`} closeLabel={view.model.labels.dismiss} /><AdaptiveOverlay.Body><ProductDetail view={view} product={activeProduct} form={form} /></AdaptiveOverlay.Body></AdaptiveOverlay.Content> : null}
  </AdaptiveOverlay>;
}

const renderers = Object.fromEntries(Object.keys(HOTSPOT_STAGE_FORM_LADDER).map((form) => [form, ({ core }: { core: HotspotStageView }) => <HotspotComposition view={core} form={form as CategoryDeviceForm} />])) as Record<CategoryDeviceForm, ({ core }: { core: HotspotStageView }) => ReactNode>;

export function HotspotStage({ fixture, mediaMap, stress, className }: HotspotStageProperties) {
  const model = useMemo(() => resolveHotspotStageFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const ownerRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<HotspotStageState>(() => ({ activeHotspotId: stress === "dismissed" ? null : model.initialHotspotId, open: false, quantity: stress === "quantity2" ? 2 : 1, saved: stress === "saved", slotWidth: 0 }));
  useEffect(() => { const frame = requestAnimationFrame(() => setState((current) => ({ ...current, activeHotspotId: stress === "dismissed" ? null : model.initialHotspotId, open: stress !== "dismissed", quantity: stress === "quantity2" ? 2 : 1, saved: stress === "saved" }))); return () => cancelAnimationFrame(frame); }, [model.initialHotspotId, model.sourceKey, stress]);
  useEffect(() => { const node = ownerRef.current; if (!node) return; const update = () => setState((current) => ({ ...current, slotWidth: node.getBoundingClientRect().width })); update(); const observer = new ResizeObserver(update); observer.observe(node); return () => observer.disconnect(); }, []);
  const view = { model, mediaMap, state, setState };
  return <section ref={ownerRef} className={["xp-hotspot-stage", className].filter(Boolean).join(" ")} data-hotspot-stage-owner data-hotspot-stage-state-owner data-source-key={model.sourceKey} data-preset={model.preset} dir={model.direction} aria-labelledby={`${model.sourceKey}-title`}>
    <header className="xp-hotspot-stage__intro"><h1 id={`${model.sourceKey}-title`}>{model.heading}</h1><p>{model.description}</p></header>
    <MorphSlot ladder={HOTSPOT_STAGE_FORM_LADDER} core={view} renderers={renderers} />
  </section>;
}
