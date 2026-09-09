"use client";

import { AdaptiveOverlay, useDeviceClass, type DeviceClass, type OverlayPresentation } from "@xp/primitives";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BuyBox } from "./buy-box";
import { DetailSections } from "./detail-sections";
import { PdpGallery } from "./pdp-gallery";
import {
  type PdpMediaSeat,
  type ProductDetailStressKey,
  type ProductOverviewMediaMap,
  type ProductOverviewMediaRecord,
  type ProductQuickViewFixture,
} from "./product-overview-model";
import { ProductOverviewCore } from "./product-overview";

export type ProductQuickViewMediaMap = ProductOverviewMediaMap;

export type ProductQuickViewProperties = {
  fixture: ProductQuickViewFixture;
  mediaMap: ProductQuickViewMediaMap;
  stress?: Extract<ProductDetailStressKey, "short" | "longLocale" | "error" | "pending">;
  defaultOpen?: boolean;
  trigger?: ReactNode;
};

const slotBand = (width: number) => width < 320 ? "S1" : width < 416 ? "S2" : width < 544 ? "S3" : width < 672 ? "S4" : width < 896 ? "S5" : "S6";
const compactClass = (deviceClass: DeviceClass) => deviceClass === "M" || deviceClass === "TP";

export function ProductQuickView({ fixture, mediaMap, stress, defaultOpen = false, trigger }: ProductQuickViewProperties) {
  const deviceClass = useDeviceClass();
  const host = useRef<HTMLDivElement>(null);
  const initializedOpen = useRef(false);
  const hasOpened = useRef(false);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const [open, setOpen] = useState(false);
  const [overlayAnnouncement, setOverlayAnnouncement] = useState("");

  useEffect(() => {
    if (initializedOpen.current) return;
    initializedOpen.current = true;
    if (defaultOpen) {
      setOpen(true);
      setOverlayAnnouncement(fixture.announcements.opened ?? "");
    }
  }, [defaultOpen, fixture.announcements.opened]);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      return;
    }
    if (hasOpened.current) host.current?.querySelector<HTMLButtonElement>(".xp-overlay-trigger")?.focus();
  }, [open]);

  useEffect(() => {
    const node = surfaceNode;
    if (!node) return;
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [surfaceNode]);

  const resolveMediaSeat = useCallback((seat: PdpMediaSeat): ProductOverviewMediaRecord => {
    const record = mediaMap.records.find(({ slug, seatId, key }) => slug === fixture.sourceKey && seatId === seat.id && key === (seat.assetKey ?? seat.systemKey));
    if (!record) throw new Error(`${fixture.sourceKey}/${seat.id} cannot resolve one exact product-quick-view media record.`);
    return record;
  }, [fixture.sourceKey, mediaMap.records]);

  const presentation: Partial<Record<DeviceClass, OverlayPresentation>> = fixture.overlay.presentation;
  const compact = compactClass(deviceClass);

  return <div ref={host} className="xp-product-quick-view-host" data-xp-product-quick-view-host data-source-key={fixture.sourceKey}>
    <AdaptiveOverlay
      intent="edit"
      presentation={presentation}
      why={fixture.overlay.presentation.why}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setOverlayAnnouncement(next ? fixture.announcements.opened ?? "" : fixture.announcements.closed ?? "");
      }}
      modal
    >
      <AdaptiveOverlay.Trigger>{trigger ?? fixture.overlay.triggerLabel}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content
        className="xp-product-quick-view__overlay"
        data-product-quick-view-overlay
        data-source-key={fixture.sourceKey}
        data-device-class={deviceClass}
      >
        <AdaptiveOverlay.Header title={fixture.overlay.titleLabel} closeLabel={fixture.overlay.closeLabel} />
        <AdaptiveOverlay.Body className="xp-product-quick-view__body" data-product-quick-view-scroll-owner>
          <ProductOverviewCore fixture={fixture} mediaMap={mediaMap} stress={stress}>{(state) => <section
            ref={setSurfaceNode}
            className="xp-product-quick-view"
            data-xp-product-quick-view
            data-xp-owner="ProductOverviewCore"
            data-source-key={state.model.sourceKey}
            data-preset={state.model.preset}
            data-device-class={deviceClass}
            data-slot-band={slotBand(width)}
            data-layout={compact ? "compact" : "dialog"}
            aria-labelledby={`${state.model.sourceKey}-title`}
          >
            <PdpGallery state={state} deviceClass={deviceClass} resolveMediaSeat={resolveMediaSeat} />
            <div className="xp-product-quick-view__decision" data-product-quick-view-decision>
              <BuyBox state={state} deviceClass={deviceClass} actionPlacement="overlay" />
              <DetailSections state={state} deviceClass={deviceClass} resolveMediaSeat={resolveMediaSeat} />
              <p className="xp-product-quick-view__live" aria-live="polite">{state.announcement}</p>
            </div>
          </section>}</ProductOverviewCore>
        </AdaptiveOverlay.Body>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
    <p className="xp-product-quick-view__live" aria-live="polite">{overlayAnnouncement}</p>
  </div>;
}
