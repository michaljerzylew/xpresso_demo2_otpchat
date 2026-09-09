"use client";

import { MorphSlot, SnapRail } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject, type UIEvent } from "react";
import {
  resolveCategoryMedia,
  resolveCategoryNavFixture,
  type CategoryDestination,
  type CategoryDeviceForm,
  type CategoryIcon,
  type CategoryNavFixture,
  type ProductCategoryMediaMap,
  type ProductCategoryStressKey,
  type ResolvedCategoryNav,
} from "./category-nav-model";

export const CATEGORY_NAV_FORM_LADDER = { M: "M", TP: "TP", TL: "TL", DS: "DS", DW: "DW" } as const;

export type CategoryNavProperties = {
  fixture: CategoryNavFixture;
  mediaMap: ProductCategoryMediaMap;
  stress?: ProductCategoryStressKey;
  className?: string;
};

type CategoryNavView = {
  model: ResolvedCategoryNav;
  mediaMap: ProductCategoryMediaMap;
  railIndex: number;
  setRailIndex: (index: number) => void;
  ownerRef: RefObject<HTMLElement | null>;
};

const ICON_PATHS: Record<CategoryIcon, string> = {
  apparel: "M7 8 10 5h4l3 3-2 3v8H9v-8L7 8Z",
  bag: "M8 9h8l1 10H7L8 9Zm2 0V7a2 2 0 0 1 4 0v2",
  footwear: "M6 7v7c3 0 4 3 9 3h3v2H6a2 2 0 0 1-2-2V7h2Z",
  jewelry: "m7 9 5-5 5 5-5 10L7 9Zm2 0h6",
  watch: "M9 4h6l1 4v8l-1 4H9l-1-4V8l1-4Zm3 5v4l3 2",
  device: "M6 5h12v14H6V5Zm3 3h6m-6 3h4m-4 5h6",
  sofa: "M6 11V8h3v3h6V8h3v3a2 2 0 0 1 2 2v5H4v-5a2 2 0 0 1 2-2Z",
  chair: "M8 5h8v8H8V5Zm-2 8h12v3H6v-3Zm2 3v4m8-4v4",
  lamp: "m8 11 4-7 4 7H8Zm4 0v7m-3 2h6",
  storage: "M5 6h14v13H5V6Zm0 4h14m-7-4v13m-2-6h1m2 0h1",
  plant: "M8 20h8l1-7H7l1 7Zm4-7V7m0 3c-3 0-5-2-5-5 3 0 5 2 5 5Zm0 1c3 0 5-2 5-5-3 0-5 2-5 5Z",
  child: "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 1v7m-4-4h8m-6 4-1 5m5-5 1 5",
  eyewear: "M4 10h5l1 5H6l-2-5Zm16 0h-5l-1 5h4l2-5Zm-11 1h6",
};

function CategoryIconGraphic({ icon }: { icon: CategoryIcon }) {
  return <svg className="xp-category-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" aria-hidden="true"><path d={ICON_PATHS[icon]} /></svg>;
}

function CategoryMedia({ view, destination, form }: { view: CategoryNavView; destination: CategoryDestination; form: CategoryDeviceForm }) {
  if (!destination.mediaId) return null;
  const seat = view.model.media.find(({ id }) => id === destination.mediaId);
  if (!seat) return null;
  const media = resolveCategoryMedia(view.mediaMap, view.model.sourceKey, seat, form, view.model.failedMediaIds.has(seat.id));
  if (media.status !== "resolved" || !media.publicBase) {
    return <div className="xp-category-nav__media-fallback" data-media-seat-id={seat.id} data-media-status={media.status} role="img" aria-label={`${seat.alt}. ${view.model.messages.mediaFailure}`}><span aria-hidden="true">◇</span><small>{view.model.messages.mediaFailure}</small></div>;
  }
  return <picture className="xp-category-nav__picture" data-media-seat-id={seat.id} data-media-status="resolved" style={{ "--xp-category-focal": media.objectPosition ?? "50% 50%" } as CSSProperties}>
    <source type="image/avif" srcSet={`${media.publicBase}-1280.avif 1280w, ${media.publicBase}-1920.avif 1920w`} />
    <source type="image/webp" srcSet={`${media.publicBase}-1280.webp 1280w, ${media.publicBase}-1920.webp 1920w`} />
    <img src={`${media.publicBase}-1280.webp`} alt={seat.alt} loading="lazy" decoding="async" />
  </picture>;
}

function DestinationCard({ view, destination, form }: { view: CategoryNavView; destination: CategoryDestination; form: CategoryDeviceForm }) {
  const action = view.model.actions.find(({ id }) => id === destination.actionId);
  if (!action) return null;
  return <article className="xp-category-nav__card" data-destination-id={destination.id} data-prominence={destination.prominence} data-role={destination.role} data-tone={destination.tone}>
    <a href={action.href} data-action-id={action.id} data-xp-control autoFocus={view.model.activeStress === "lastDestination" && destination.id === view.model.destinations.at(-1)?.id || undefined}>
      <div className="xp-category-nav__visual"><CategoryMedia view={view} destination={destination} form={form} />{destination.icon ? <CategoryIconGraphic icon={destination.icon} /> : null}{destination.discountPct ? <strong className="xp-category-nav__discount">−{destination.discountPct}%</strong> : null}</div>
      <div className="xp-category-nav__copy">
        {destination.kicker ? <small>{destination.kicker}</small> : null}
        <h2>{destination.label}</h2>
        {destination.summary ? <p>{destination.summary}</p> : null}
        <div className="xp-category-nav__meta">{destination.productCount !== undefined ? <span>{destination.productCount}</span> : null}{destination.statusLabel ? <span>{destination.statusLabel}</span> : null}{destination.badgeLabel ? <span>{destination.badgeLabel}</span> : null}</div>
        <span className="xp-category-nav__action-label">{action.label}<span aria-hidden="true"> →</span></span>
      </div>
    </a>
  </article>;
}

function collectionAction(model: ResolvedCategoryNav) {
  const action = model.actions.find(({ kind }) => kind === "collection");
  return action ? <a className="xp-category-nav__collection" data-action-id={action.id} data-xp-control href={action.href} autoFocus={model.activeStress === "collectionActionFocus" || undefined}>{action.label}<span aria-hidden="true"> →</span></a> : null;
}

function shouldRail(model: ResolvedCategoryNav, form: CategoryDeviceForm) {
  return model.composition === "finite-rail"
    || (form === "M" && model.composition !== "icon-list")
    || (["cutout-deck", "capsule"].includes(model.composition) && form === "TP");
}

function railMove(view: CategoryNavView, index: number) {
  const bounded = Math.max(0, Math.min(index, view.model.destinations.length - 1));
  view.ownerRef.current?.querySelectorAll<HTMLElement>("[data-xp-rail-item]")[bounded]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  view.setRailIndex(bounded);
}

function updateRail(view: CategoryNavView, event: UIEvent<HTMLDivElement>) {
  const rail = event.currentTarget;
  const items = [...rail.querySelectorAll<HTMLElement>("[data-xp-rail-item]")];
  const nearest = items.reduce((best, item, index) => Math.abs(item.offsetLeft - rail.scrollLeft) < Math.abs((items[best]?.offsetLeft ?? 0) - rail.scrollLeft) ? index : best, 0);
  view.setRailIndex(nearest);
}

function CategoryComposition({ view, form }: { view: CategoryNavView; form: CategoryDeviceForm }) {
  const rail = shouldRail(view.model, form);
  const cards = view.model.destinations.map((destination) => <DestinationCard destination={destination} form={form} view={view} key={destination.id} />);
  return <>
    {rail ? <div className="xp-category-nav__rail-region">
      <SnapRail label={view.model.labels.region ?? view.model.intro.heading} paginationLabel={view.model.labels.region ?? "Category positions"} markerLabel={(index) => `Go to category ${index}`} markers="none" onScroll={(event) => updateRail(view, event)} onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); railMove(view, event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : view.railIndex + (event.key === "ArrowRight" ? 1 : -1)); }}>
        {cards.map((card, index) => <SnapRail.Item data-rail-index={index} key={view.model.destinations[index]?.id}>{card}</SnapRail.Item>)}
      </SnapRail>
      {(form === "DS" || form === "DW") ? <div className="xp-category-nav__rail-controls"><button type="button" data-xp-control disabled={view.railIndex === 0} onClick={() => railMove(view, view.railIndex - 1)}>{view.model.labels.previous ?? "Previous"}</button><span aria-live="polite" data-rail-position><bdi dir="ltr">{view.railIndex + 1} / {cards.length}</bdi></span><button type="button" data-xp-control disabled={view.railIndex === cards.length - 1} onClick={() => railMove(view, view.railIndex + 1)}>{view.model.labels.next ?? "Next"}</button></div> : null}
    </div> : <div className="xp-category-nav__grid">{cards}</div>}
    {collectionAction(view.model)}
  </>;
}

const renderers = Object.fromEntries(Object.keys(CATEGORY_NAV_FORM_LADDER).map((form) => [form, ({ core }: { core: CategoryNavView }) => <CategoryComposition view={core} form={form as CategoryDeviceForm} />])) as Record<CategoryDeviceForm, ({ core }: { core: CategoryNavView }) => ReactNode>;

export function CategoryNav({ fixture, mediaMap, stress, className }: CategoryNavProperties) {
  const model = useMemo(() => resolveCategoryNavFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const initial = stress === "railLast" || stress === "lastDestination" ? model.destinations.length - 1 : 0;
  const [railIndex, setRailIndex] = useState(initial);
  const ownerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setRailIndex(initial);
    if (initial > 0) ownerRef.current?.querySelectorAll<HTMLElement>("[data-xp-rail-item]")[initial]?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "start" });
  }, [initial, model.sourceKey]);
  const view = { model, mediaMap, railIndex, setRailIndex, ownerRef };
  return <section ref={ownerRef} className={["xp-category-nav", className].filter(Boolean).join(" ")} data-category-nav-owner data-category-nav-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.composition} dir={model.direction} aria-labelledby={`${model.sourceKey}-title`}>
    <header className="xp-category-nav__intro">{model.intro.eyebrow ? <p>{model.intro.eyebrow}</p> : null}<h1 id={`${model.sourceKey}-title`}>{model.intro.heading}</h1>{model.intro.description ? <p>{model.intro.description}</p> : null}</header>
    <MorphSlot ladder={CATEGORY_NAV_FORM_LADDER} core={view} renderers={renderers} />
  </section>;
}
