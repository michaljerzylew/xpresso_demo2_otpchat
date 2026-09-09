"use client";

import { useDeviceClass } from "@xp/primitives";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ProductAction, ProductCollectionItem, ProductMedia, ProductRecord, ResolvedProductCollectionFixture } from "./product-list-model";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Media({ media, model, thumbnail = false }: { media: ProductMedia; model: ResolvedProductCollectionFixture; thumbnail?: boolean }) {
  const asset = model.resolvedMedia.find((candidate) => candidate.key === media.key);
  if (asset?.kind === "responsive-image" && asset.src) return <img src={asset.src} alt={media.alt} style={media.focalPoint ? { objectPosition: media.focalPoint } : undefined}/>;
  if (asset?.kind === "system-ui") {
    const content: Record<string, readonly [string, string, string]> = {
      "ui-preview-route-planner": ["18 routes", "4 delayed", "96% ready"],
      "ui-preview-material-ledger": ["142 parts", "8 low", "4 depots"],
      "ui-preview-capacity-map": ["72% load", "9 crews", "3 shifts"],
      "ui-preview-service-console": ["24 open", "6 due", "91% SLA"],
    };
    return <span className="xp-product-list__system-preview" role="img" aria-label={media.alt} data-system-key={media.key} data-media-key={media.key}>{(content[media.key] ?? ["Live", "Ready", "Synced"]).map((label) => <i key={label}>{label}</i>)}<strong>{asset.alt}</strong><small> · Live product preview</small></span>;
  }
  if (thumbnail) return <span className="xp-product-list__pending-media xp-product-list__pending-media--thumbnail" data-media-pending data-media-key={media.key} aria-hidden="true"><i/></span>;
  return <span className="xp-product-list__pending-media" role="img" aria-label={`${media.alt}. Gallery image pending provider delivery.`} data-media-pending data-media-key={media.key}><strong>Gallery pending</strong><small> · Approved product view is awaiting delivery</small></span>;
}

function Action({ action, active, onToggle }: { action: ProductAction; active?: boolean; onToggle?: () => void }) {
  const body: ReactNode = <>{action.kind === "wishlist" ? <span aria-hidden="true">{active ? "♥" : "♡"}</span> : null}<span>{action.label}</span></>;
  if (action.kind === "navigate") return <a className="xp-product-list__action" href={action.href} data-emphasis={action.emphasis} data-action-kind={action.kind} data-xp-control>{body}</a>;
  return <button className="xp-product-list__action" type="button" aria-pressed={action.kind === "wishlist" ? Boolean(active) : undefined} onClick={onToggle} data-emphasis={action.emphasis} data-action-kind={action.kind} data-xp-control>{body}</button>;
}

function ProductCard({ product, model }: { product: ProductRecord; model: ResolvedProductCollectionFixture }) {
  const [saved, setSaved] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const selected = product.media[mediaIndex] ?? product.media[0];
  return (
    <article className="xp-product-list__card" data-product-id={product.id} data-composition={model.cardComposition} data-tint={product.tint}>
      <div className="xp-product-list__media" data-media-count={product.media.length}>
        <a href={product.href} aria-label={`Open ${product.name}`}><Media media={selected} model={model}/></a>
        {product.badge ? <span className="xp-product-list__badge" data-tone={product.badge.tone}>{product.badge.label}</span> : null}
        {product.media.length > 1 ? <div className="xp-product-list__gallery" aria-label={`${product.name} gallery`}>{product.media.map((item, index) => <button type="button" aria-label={`Show ${item.alt}`} aria-pressed={index === mediaIndex} onClick={() => setMediaIndex(index)} key={item.key} data-xp-control><Media media={item} model={model} thumbnail/></button>)}</div> : null}
      </div>
      <div className="xp-product-list__copy">
        {product.category ? <p className="xp-product-list__category">{product.category}</p> : null}
        <h3><a className="xp-product-list__title-link" href={product.href}>{product.name}</a></h3>
        {product.tags?.length ? <ul className="xp-product-list__tags">{product.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
        {product.seller ? <a className="xp-product-list__seller" href={product.seller.href}><span aria-hidden="true">{product.seller.initials}</span><span><strong>{product.seller.name}</strong><small>{product.seller.category}</small></span>{product.seller.verified ? <b aria-label="Verified seller">✓</b> : null}</a> : null}
        {product.rating ? <p className="xp-product-list__rating" aria-label={`${product.rating.value} out of ${product.rating.maximum} stars`}><span aria-hidden="true">★★★★★</span><strong>{product.rating.value}</strong>{product.rating.reviewLabel ? product.rating.reviewHref ? <a href={product.rating.reviewHref}>{product.rating.reviewLabel}</a> : <small>{product.rating.reviewLabel}</small> : null}</p> : null}
        {product.specifications?.length ? <dl className="xp-product-list__specs">{product.specifications.map((spec) => <div key={spec.id}><dt>{spec.label.split(":")[0]}</dt><dd>{spec.label.includes(":") ? spec.label.split(":").slice(1).join(":").trim() : spec.label}</dd></div>)}</dl> : null}
        {product.fulfillment ? <ul className="xp-product-list__fulfillment"><li>{product.fulfillment.deliveryLabel}</li><li>{product.fulfillment.offerLabel}</li><li>{product.fulfillment.exchangeLabel}</li></ul> : null}
        <p className="xp-product-list__price"><strong>{money.format(product.price.current)}</strong>{product.price.previous ? <s>{money.format(product.price.previous)}</s> : null}</p>
        {product.inventory ? <div className="xp-product-list__inventory"><progress max={100} value={product.inventory.progress}/><span>{product.inventory.sold} sold</span><span>{product.inventory.available} left</span></div> : null}
        <div className="xp-product-list__actions">{product.actions.map((action) => <Action action={action} active={action.kind === "wishlist" && saved} onToggle={action.kind === "wishlist" ? () => setSaved((value) => !value) : undefined} key={action.id}/>)}</div>
      </div>
    </article>
  );
}

function PromoCard({ item, model }: { item: Extract<ProductCollectionItem, { role: "promo" }>; model: ResolvedProductCollectionFixture }) {
  return <article className="xp-product-list__promo" style={{ "--xp-promo-accent": item.accent } as CSSProperties} data-promo-id={item.id}><Media media={item.media} model={model}/><div><strong>{item.headline}</strong><Action action={item.action}/></div></article>;
}

export function ProductCollection({ model }: { model: ResolvedProductCollectionFixture }) {
  const deviceClass = useDeviceClass();
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * .82, behavior: "smooth" });
  const compact = deviceClass === "M" || deviceClass === "TP";
  return (
    <section className="xp-product-list" data-xp-product-list-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.cardComposition} data-device-class={deviceClass} data-pending-media={model.hasPendingMedia || undefined} aria-labelledby={`${model.sourceKey}-title`}>
      <header className="xp-product-list__header"><div>{model.eyebrow ? <p>{model.eyebrow}</p> : null}<h2 id={`${model.sourceKey}-title`}>{model.title}</h2>{model.description ? <p>{model.description}</p> : null}</div>{model.countdown ? <time dateTime={model.countdown.endsAt}><small>{model.countdown.label}</small><strong>02:14:36</strong></time> : null}{model.collectionAction ? <Action action={model.collectionAction}/> : null}</header>
      <div className="xp-product-list__stage">
        {model.navigation && !compact ? <button className="xp-product-list__rail-control" type="button" aria-label={model.navigation.previousLabel} onClick={() => scroll(-1)} data-direction="previous" data-xp-control>←</button> : null}
        <div className="xp-product-list__items" ref={rail}>{model.items.map((item) => item.role === "product" ? <ProductCard product={item.product} model={model} key={item.product.id}/> : <PromoCard item={item} model={model} key={item.id}/>)}</div>
        {model.navigation && !compact ? <button className="xp-product-list__rail-control" type="button" aria-label={model.navigation.nextLabel} onClick={() => scroll(1)} data-direction="next" data-xp-control>→</button> : null}
      </div>
    </section>
  );
}
