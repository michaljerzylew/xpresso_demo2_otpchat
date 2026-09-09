"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BuyBox } from "./buy-box";
import { DetailSections } from "./detail-sections";
import { PdpGallery } from "./pdp-gallery";
import {
  calculateProductPrice,
  resolveProductOverviewFixture,
  type PdpMediaSeat,
  type ProductDetailFixture,
  type ProductDetailStressKey,
  type ProductOverviewFixture,
  type ProductOverviewMediaMap,
  type ProductOverviewMediaRecord,
  type ResolvedProductAction,
  type ResolvedProductDetail,
} from "./product-overview-model";

export type ResolvePdpMediaSeat = (seat: PdpMediaSeat) => ProductOverviewMediaRecord;
export type ProductOverviewCoreState = {
  model: ResolvedProductDetail;
  selectedSeatId: string;
  activeGallerySeatIds: string[];
  selections: Record<string, string>;
  quantity: number;
  currentPrice: { amountMinor: number; currency: string };
  favorite: boolean;
  commitState: "idle" | "pending" | "error" | "success";
  customAmount: string;
  customAmountError: string;
  announcement: string;
  selectMedia: (seatId: string) => void;
  selectOption: (groupId: string, optionId: string) => void;
  setQuantity: (value: number) => void;
  setCustomAmount: (value: string) => void;
  runAction: (action: ResolvedProductAction) => void;
};

function gallerySeats(model: ResolvedProductDetail, selections: Record<string, string>) {
  const selectedGroups = model.buyBox.optionGroups
    .map((group) => group.options.find(({ id }) => id === selections[group.id])?.mediaSeatIds)
    .filter((ids): ids is string[] => Boolean(ids?.length));
  const colorway = selectedGroups.find((ids) => ids.length > 1);
  return colorway ?? [...new Set([...model.gallery.seatIds, ...selectedGroups.flat()])];
}

export function ProductOverviewCore({
  fixture,
  mediaMap,
  stress,
  children,
}: {
  fixture: ProductDetailFixture;
  mediaMap: ProductOverviewMediaMap;
  stress?: ProductDetailStressKey;
  children: (state: ProductOverviewCoreState) => ReactNode;
}) {
  const model = useMemo(() => resolveProductOverviewFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(model.buyBox.optionGroups.map((group) => [group.id, group.selectedId])));
  const [quantity, setQuantityState] = useState(model.buyBox.quantity?.value ?? 1);
  const [selectedSeatId, setSelectedSeatId] = useState(model.gallery.selectedSeatId);
  const [favorite, setFavorite] = useState(Boolean(model.state.wishlistActive));
  const [commitState, setCommitState] = useState<ProductOverviewCoreState["commitState"]>(stress === "error" ? "error" : stress === "pending" ? "pending" : stress === "success" ? "success" : model.state.commitState);
  const [customAmount, setCustomAmountValue] = useState("");
  const [customAmountError, setCustomAmountError] = useState("");
  const [announcement, setAnnouncement] = useState(() => {
    if (stress === "error" || model.state.commitState === "error") return model.announcements.error ?? model.announcements.actionFailed ?? "";
    if (stress === "pending" || model.state.commitState === "pending") return model.announcements.actionPending ?? "";
    if (stress === "success" || model.state.commitState === "success") return model.announcements.actionSucceeded ?? model.announcements.added ?? "";
    return "";
  });
  const activeGallerySeatIds = useMemo(() => gallerySeats(model, selections), [model, selections]);
  const selectedCustom = model.buyBox.optionGroups.map((group) => group.options.find((option) => option.id === selections[group.id])).find((option) => option?.customAmount)?.customAmount;
  const parsedCustomMinor = /^\d+(?:\.\d{1,2})?$/.test(customAmount) ? Math.round(Number(customAmount) * 100) : undefined;
  const currentPrice = useMemo(() => selectedCustom && parsedCustomMinor !== undefined ? { currency: model.buyBox.price.base.currency, amountMinor: parsedCustomMinor } : calculateProductPrice({
    ...model.buyBox,
    optionGroups: model.buyBox.optionGroups.map((group) => ({ ...group, selectedId: selections[group.id] })),
  }, selections, quantity), [model, parsedCustomMinor, quantity, selectedCustom, selections]);

  useEffect(() => {
    if (!activeGallerySeatIds.includes(selectedSeatId)) setSelectedSeatId(activeGallerySeatIds[0] ?? model.gallery.selectedSeatId);
  }, [activeGallerySeatIds, model.gallery.selectedSeatId, selectedSeatId]);

  const selectMedia = (seatId: string) => {
    if (!activeGallerySeatIds.includes(seatId)) return;
    setSelectedSeatId(seatId);
    if (model.sourceKey === "gift-card-03") {
      const binding = model.buyBox.optionGroups.flatMap((group) => group.options.map((option) => ({ group, option }))).find(({ option }) => option.mediaSeatIds?.length === 1 && option.mediaSeatIds[0] === seatId);
      if (binding) setSelections((current) => ({ ...current, [binding.group.id]: binding.option.id }));
    }
    setAnnouncement(model.announcements.mediaChanged ?? model.announcements.optionChanged ?? "");
  };
  const selectOption = (groupId: string, optionId: string) => {
    const group = model.buyBox.optionGroups.find(({ id }) => id === groupId);
    const option = group?.options.find(({ id }) => id === optionId);
    if (!option || option.disabled) return;
    setSelections((current) => ({ ...current, [groupId]: optionId }));
    if (option.mediaSeatIds?.length) setSelectedSeatId(option.mediaSeatIds[0]);
    setCommitState("idle");
    setCustomAmountError("");
    setAnnouncement(model.announcements.selectionChanged ?? model.announcements.optionChanged ?? "");
  };
  const setQuantity = (value: number) => {
    const bounds = model.buyBox.quantity;
    if (!bounds || !Number.isFinite(value)) return;
    setQuantityState(Math.max(bounds.min, Math.min(bounds.max, value)));
    setCommitState("idle");
    setAnnouncement(model.announcements.quantityChanged ?? "");
  };
  const setCustomAmount = (value: string) => {
    setCustomAmountValue(value);
    setCommitState("idle");
    if (!selectedCustom || !value) return setCustomAmountError("");
    const minor = /^\d+(?:\.\d{1,2})?$/.test(value) ? Math.round(Number(value) * 100) : undefined;
    setCustomAmountError(minor === undefined ? selectedCustom.invalidError : minor < selectedCustom.minMinor || minor > selectedCustom.maxMinor ? selectedCustom.rangeError : "");
  };
  const runAction = (action: ResolvedProductAction) => {
    if (action.normalizedKind === "wishlist") {
      setFavorite((current) => {
        const next = !current;
        setAnnouncement(next ? model.announcements.favoriteAdded ?? model.announcements.optionChanged ?? "" : model.announcements.favoriteRemoved ?? model.announcements.optionChanged ?? "");
        return next;
      });
      return;
    }
    if (action.normalizedKind === "cart" || action.normalizedKind === "purchase") {
      if (selectedCustom && (parsedCustomMinor === undefined || parsedCustomMinor < selectedCustom.minMinor || parsedCustomMinor > selectedCustom.maxMinor)) {
        setCustomAmountError(parsedCustomMinor === undefined ? selectedCustom.invalidError : selectedCustom.rangeError);
        setCommitState("error");
        setAnnouncement(model.announcements.error ?? model.announcements.actionFailed ?? "");
        return;
      }
      setCommitState("success");
      setAnnouncement(model.announcements.actionSucceeded ?? model.announcements.added ?? model.announcements.optionChanged ?? "");
      return;
    }
    setAnnouncement(model.announcements.optionChanged ?? "");
  };

  return <div data-xp-product-core data-source-key={model.sourceKey}>{children({
    model,
    selectedSeatId,
    activeGallerySeatIds,
    selections,
    quantity,
    currentPrice,
    favorite,
    commitState,
    customAmount,
    customAmountError,
    announcement,
    selectMedia,
    selectOption,
    setQuantity,
    setCustomAmount,
    runAction,
  })}</div>;
}

const slotBand = (width: number, sourceKey: string) => width < 320 ? "S1" : width < 416 ? "S2" : width < 544 ? "S3" : width < 672 ? "S4" : width < (sourceKey === "gift-card-03" ? 832 : 896) ? "S5" : "S6";
const layoutFor = (deviceClass: DeviceClass) => deviceClass === "M" ? "compact" : deviceClass === "TP" ? "compact-deck" : deviceClass === "DW" ? "expanded" : "paired";

export function ProductOverview({
  fixture,
  mediaMap,
  stress,
  resolveMediaSeat,
}: {
  fixture: ProductOverviewFixture;
  mediaMap: ProductOverviewMediaMap;
  stress?: ProductDetailStressKey;
  resolveMediaSeat: ResolvePdpMediaSeat;
}) {
  const deviceClass = useDeviceClass();
  const root = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <ProductOverviewCore fixture={fixture} mediaMap={mediaMap} stress={stress}>{(state) => <section
    ref={root}
    className="xp-product-overview"
    data-xp-product-overview
    data-xp-owner="ProductOverviewCore"
    data-source-key={state.model.sourceKey}
    data-preset={state.model.preset}
    data-device-class={deviceClass}
    data-slot-band={slotBand(width, state.model.sourceKey)}
    data-layout={layoutFor(deviceClass)}
    aria-labelledby={`${state.model.sourceKey}-title`}
  >
    <PdpGallery state={state} deviceClass={deviceClass} resolveMediaSeat={resolveMediaSeat} />
    <BuyBox state={state} deviceClass={deviceClass} actionPlacement="local" />
    <DetailSections state={state} deviceClass={deviceClass} resolveMediaSeat={resolveMediaSeat} />
    <p className="xp-product-overview__live" aria-live="polite">{state.announcement}</p>
  </section>}</ProductOverviewCore>;
}
