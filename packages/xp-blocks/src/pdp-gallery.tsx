"use client";

import { SnapRail, type DeviceClass } from "@xp/primitives";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { PdpMediaSeat, ProductOverviewMediaRecord } from "./product-overview-model";
import type { ProductOverviewCoreState, ResolvePdpMediaSeat } from "./product-overview";

function validateMedia(seat: PdpMediaSeat, record: ProductOverviewMediaRecord, sourceKey: string) {
  if (record.slug !== sourceKey || record.seatId !== seat.id || record.key !== (seat.assetKey ?? seat.systemKey) || record.identityId !== seat.identityId || record.role !== seat.role || record.aspect !== seat.aspect) throw new Error(`${sourceKey}/${seat.id} resolved the wrong product media record.`);
  if (seat.kind === "responsive-image" && (record.kind !== "product-thumb" || !record.publicBase?.startsWith("/media/") || /^https?:\/\//i.test(record.publicBase))) throw new Error(`${sourceKey}/${seat.id} requires local responsive product media.`);
  if (seat.kind === "system-mark" && (record.kind !== "system-mark" || !record.src?.startsWith("/media/") || !record.src.endsWith(".svg"))) throw new Error(`${sourceKey}/${seat.id} requires a local SVG system mark.`);
  if (seat.kind === "vector-art" && (record.kind !== "vector-art" || !record.src?.startsWith("/media/") || !record.src.endsWith(".svg"))) throw new Error(`${sourceKey}/${seat.id} requires local SVG artwork.`);
  if (seat.kind === "system-ui" && (record.kind !== "system-ui" || record.systemKey !== seat.systemKey || record.src)) throw new Error(`${sourceKey}/${seat.id} requires code-rendered system UI.`);
  if (seat.kind === "held-seat" && (record.kind !== "held-seat" || record.src || record.publicBase)) throw new Error(`${sourceKey}/${seat.id} requires a held media seat.`);
}

function SystemPreview({ seat }: { seat: PdpMediaSeat }) {
  return <span className="xp-pdp-gallery__system" role="img" aria-label={seat.alt} data-system-key={seat.systemKey}>
    <span className="xp-pdp-gallery__system-bar"><i /><i /><i /></span>
    <span className="xp-pdp-gallery__system-grid"><i /><i /><i /><i /><i /><i /></span>
    <span className="xp-pdp-gallery__system-chart"><i /><i /><i /><i /><i /></span>
  </span>;
}

function ProductMedia({ seat, record, thumbnail = false }: { seat: PdpMediaSeat; record: ProductOverviewMediaRecord; thumbnail?: boolean }) {
  if (record.kind === "held-seat") return <span className="xp-pdp-gallery__held" role="img" aria-label={`${seat.alt}. Media pending.`} data-media-status="HOLD-INFRA"><strong>Media pending</strong><small>{seat.alt}</small></span>;
  if (record.kind === "system-ui") return <SystemPreview seat={seat} />;
  if (record.kind === "system-mark") return <img className="xp-pdp-gallery__mark" src={record.src} alt={seat.alt} />;
  if (record.kind === "vector-art") return <img className="xp-pdp-gallery__art" src={record.src} alt={seat.alt} data-media-status="RESOLVED-ORIGINAL" />;
  return <picture className="xp-pdp-gallery__picture" data-thumbnail={thumbnail || undefined} data-aspect={seat.aspect}>
    <source srcSet={`${record.publicBase}-${thumbnail ? 640 : 1280}.avif`} type="image/avif" />
    <source srcSet={`${record.publicBase}-${thumbnail ? 640 : 1280}.webp`} type="image/webp" />
    <img src={`${record.publicBase}-${thumbnail ? 640 : 1280}.jpg`} alt={seat.alt} width={1280} height={960} loading={thumbnail ? "lazy" : "eager"} decoding="async" style={seat.focalPoint ? { objectPosition: seat.focalPoint } : undefined} />
  </picture>;
}

const galleryForm = (deviceClass: DeviceClass) => deviceClass === "M" || deviceClass === "TP" ? "pager" : deviceClass === "DW" ? "grid-2" : "rail";

export function PdpGallery({ state, deviceClass, resolveMediaSeat }: { state: ProductOverviewCoreState; deviceClass: DeviceClass; resolveMediaSeat: ResolvePdpMediaSeat }) {
  const root = useRef<HTMLElement>(null);
  const seats = state.activeGallerySeatIds.map((id) => state.model.media.find((seat) => seat.id === id)!).filter(Boolean);
  const records = new Map(seats.map((seat) => {
    const record = resolveMediaSeat(seat);
    validateMedia(seat, record, state.model.sourceKey);
    return [seat.id, record];
  }));
  const selected = seats.find(({ id }) => id === state.selectedSeatId) ?? seats[0];
  const form = galleryForm(deviceClass);
  useEffect(() => {
    if (state.model.sourceKey !== "gift-card-03") return;
    const selectedControl = [...(root.current?.querySelectorAll<HTMLElement>("[data-pdp-media-seat]") ?? [])].find((control) => control.dataset.pdpMediaSeat === state.selectedSeatId);
    selectedControl?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [state.model.sourceKey, state.selectedSeatId]);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
    event.preventDefault();
    const next = key === "Home" ? 0 : key === "End" ? seats.length - 1 : Math.max(0, Math.min(seats.length - 1, index + (key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1)));
    state.selectMedia(seats[next].id);
    event.currentTarget.closest("[data-xp-pdp-gallery]")?.querySelectorAll<HTMLButtonElement>("[data-pdp-media-seat]")[next]?.focus();
  };
  return <section ref={root} className="xp-pdp-gallery" data-xp-pdp-gallery data-xp-owner="PdpGallery" data-form={form} data-presentation={state.model.gallery.presentation} aria-label={state.model.product.title}>
    <div className="xp-pdp-gallery__stage" data-current-media-id={selected.id}>
      <ProductMedia seat={selected} record={records.get(selected.id)!} />
    </div>
    {seats.length > 1 ? <SnapRail
      className="xp-pdp-gallery__rail"
      label={state.model.product.title}
      paginationLabel={state.model.product.title}
      markerLabel={(index) => seats[index - 1]?.alt ?? state.model.product.title}
      markers="none"
      peek="12%"
      physics="native"
    >
      {seats.map((seat) => <SnapRail.Item key={seat.id}>
        <button type="button" aria-label={seat.alt} aria-pressed={seat.id === selected.id} tabIndex={state.model.sourceKey === "gift-card-03" ? seat.id === selected.id ? 0 : -1 : undefined} data-pdp-media-seat={seat.id} data-xp-control onKeyDown={state.model.sourceKey === "gift-card-03" ? (event) => move(event, seats.indexOf(seat)) : undefined} onClick={() => state.selectMedia(seat.id)}>
          <ProductMedia seat={seat} record={records.get(seat.id)!} thumbnail />
        </button>
      </SnapRail.Item>)}
    </SnapRail> : null}
  </section>;
}
