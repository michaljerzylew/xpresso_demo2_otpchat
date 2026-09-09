"use client";

import { AdaptiveOverlay, MorphSlot, SnapRail, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { resolveGalleryFixture, type GalleryFixture, type GalleryMediaMap, type GalleryStressKey, type ResolvedGalleryItem } from "./gallery-model";

export const GALLERY_UI_PROOF_KEYS = [
  "ui-core-auth","ui-core-dash","ui-core-settings","ui-core-users",
  "ui-retail-home","ui-retail-pdp","ui-retail-cart","ui-retail-checkout",
  "ui-fin-summary","ui-fin-transfer","ui-fin-history","ui-fin-taxes",
  "ui-med-patient","ui-med-schedule","ui-med-prescribe","ui-med-billing",
] as const;

export type GalleryScenario = {
  mediaFallback?: boolean;
  filterId?: string;
  selectedItemId?: string;
  lightboxItemId?: string;
  expanded?: boolean;
};
type Properties = { fixture: GalleryFixture; mediaMap: GalleryMediaMap; stress?: GalleryStressKey; scenario?: GalleryScenario; className?: string };
type View = {
  model: ReturnType<typeof resolveGalleryFixture>; deviceClass: DeviceClass; activeFilterId: string;
  visibleItems: ResolvedGalleryItem[]; selectedIndex: number; selectFilter: (id: string) => void;
  select: (index: number) => void; move: (direction: -1 | 1) => void; open: (item: ResolvedGalleryItem) => void;
  railReference: React.RefObject<HTMLDivElement | null>; mediaFallback: boolean;
  expanded: boolean; setExpanded: (expanded: boolean) => void;
};
const ladder: Record<DeviceClass, string> = { M:"mobile",TP:"tablet-portrait",TL:"tablet-landscape",DS:"desktop-standard",DW:"desktop-wide" };
const fill = (template: string, current: number, total: number) => template.replace("{current}", String(current)).replace("{total}", String(total));

function Chrome({ children, label }: { children?: React.ReactNode; label: string }) {
  return <div className="xp-gallery-proof__chrome" aria-hidden="true"><span/><span/><span/><strong>{label}</strong>{children}</div>;
}
function Rows({ values }: { values: string[] }) { return <div className="xp-gallery-proof__rows" aria-hidden="true">{values.map((value,index)=><span style={{"--proof-row":`${42 + ((index * 17) % 51)}%`} as React.CSSProperties} key={value}>{value}</span>)}</div>; }
function Bars({ values }: { values: number[] }) { return <div className="xp-gallery-proof__bars" aria-hidden="true">{values.map((value,index)=><i style={{"--proof-bar":`${value}%`} as React.CSSProperties} key={`${value}-${index}`}/>)}</div>; }

function UiProof({ item, expanded = false, failed = false }: { item: ResolvedGalleryItem; expanded?: boolean; failed?: boolean }) {
  if (failed || item.mediaStatus === "error") return <div className="xp-gallery-proof xp-gallery-proof--fallback" data-proof-id={item.assetId} role="img" aria-label={item.alt}><strong>{item.title}</strong><span>Interface record unavailable</span></div>;
  const common = { className:`xp-gallery-proof xp-gallery-proof--${item.assetId}`, "data-proof-id":item.assetId, "data-expanded":expanded || undefined, role:"img", "aria-label":item.alt } as const;
  switch (item.assetId) {
    case "ui-core-auth": return <div {...common}><Chrome label="Aster ID"/><div className="xp-gallery-proof__auth"><strong>Workspace access</strong><span>Member address</span><b/><span>Access key</span><b/><i>Verify identity</i></div></div>;
    case "ui-core-dash": return <div {...common}><Chrome label="Relay control"/><div className="xp-gallery-proof__metric"><span>Queue health</span><strong>98.4%</strong><svg viewBox="0 0 240 70" aria-hidden="true"><polyline points="0,55 32,42 64,48 96,19 128,31 160,12 192,24 240,8"/></svg><Bars values={[38,55,44,76,61,84]}/></div></div>;
    case "ui-core-settings": return <div {...common}><Chrome label="Orbit settings"/><div className="xp-gallery-proof__settings"><strong>Notification routing</strong>{["Weekly digest","Incident relay","Quiet hours","Audit copies"].map((value,index)=><span key={value}>{value}<i data-on={index!==2}/></span>)}</div></div>;
    case "ui-core-users": return <div {...common}><Chrome label="Northstar directory"/><div className="xp-gallery-proof__table"><strong>Active members</strong>{["E. North · Owner","S. Vale · Editor","A. Flint · Analyst","M. Reed · Viewer"].map((value,index)=><span key={value}><i>{String(index+1).padStart(2,"0")}</i>{value}<b>{index===3?"Invited":"Active"}</b></span>)}</div></div>;
    case "ui-retail-home": return <div {...common}><Chrome label="Field Supply"/><div className="xp-gallery-proof__store"><strong>Equipment built for wet weather</strong><span>New field cases</span><div><i/><i/><i/></div></div></div>;
    case "ui-retail-pdp": return <div {...common}><Chrome label="Field Supply"/><div className="xp-gallery-proof__product"><div><i/><span/><span/></div><section><small>Series 04</small><strong>Weatherproof field case</strong><p>Locking shell · 18 L · graphite</p><b>Add to kit</b></section></div></div>;
    case "ui-retail-cart": return <div {...common}><Chrome label="Dispatch desk"/><div className="xp-gallery-proof__orders"><strong>Four orders await packing</strong>{["FD-1840 · Case","FD-1839 · Lamp","FD-1838 · Strap"].map((value,index)=><span key={value}><i/>{value}<b>{index?"Queued":"Packing"}</b></span>)}</div></div>;
    case "ui-retail-checkout": return <div {...common}><Chrome label="Secure checkout"/><div className="xp-gallery-proof__checkout"><section><strong>Payment details</strong><span>Card number</span><i/><div><i/><i/></div><b>Confirm 184.00</b></section><aside><span>Field case</span><strong>184.00</strong><p>Tracked delivery included</p></aside></div></div>;
    case "ui-fin-summary": return <div {...common}><Chrome label="Teller ledger"/><div className="xp-gallery-proof__portfolio"><div><strong>124,680</strong><span>Allocated capital</span><i/></div><Rows values={["Reserve 42%","Operations 31%","Growth 19%","Cash 8%"]}/></div></div>;
    case "ui-fin-transfer": return <div {...common}><Chrome label="Teller transfer"/><div className="xp-gallery-proof__transfer"><strong>Move funds</strong><span>From · Operating reserve</span><i>12,400</i><span>To · Expansion account</span><i>11,372</i><b>Review transfer</b></div></div>;
    case "ui-fin-history": return <div {...common}><Chrome label="Month ledger"/><div className="xp-gallery-proof__history"><strong>August activity</strong><Bars values={[24,61,36,82,48,68,44,91]}/><Rows values={["Infrastructure · 4,240","Services · 2,180","Travel · 940"]}/></div></div>;
    case "ui-fin-taxes": return <div {...common}><Chrome label="Fiscal record"/><div className="xp-gallery-proof__document"><header><strong>Annual filing summary</strong><span>FY 2026 · Draft 04</span></header><Rows values={["Gross receipts","Eligible expenses","Taxable balance","Withholding paid","Balance due"]}/><b>Ready for review</b></div></div>;
    case "ui-med-patient": return <div {...common}><Chrome label="Vela patient record"/><div className="xp-gallery-proof__vitals"><header><strong>Leona Hart</strong><span>Stable · Ward C</span></header><svg viewBox="0 0 240 80" aria-hidden="true"><polyline points="0,44 24,40 48,53 72,22 96,34 120,16 144,38 168,28 192,35 216,21 240,30"/><polyline points="0,62 24,58 48,64 72,52 96,57 120,48 144,55 168,50 192,57 216,46 240,51"/></svg><Rows values={["Pulse · 72 bpm","Oxygen · 98%"]}/></div></div>;
    case "ui-med-schedule": return <div {...common}><Chrome label="Clinic roster"/><div className="xp-gallery-proof__schedule"><strong>Tuesday · 14 appointments</strong><div>{["08","09","10","11","12","13"].map((value,index)=><span key={value}>{value}<i data-span={index%3}/></span>)}</div></div></div>;
    case "ui-med-prescribe": return <div {...common}><Chrome label="Medication orders"/><div className="xp-gallery-proof__prescribe"><strong>New medication order</strong><span>Medication</span><i>Amoxicillin</i><span>Dose and interval</span><div><i>250 mg</i><i>8 hours</i></div><b>Review order</b></div></div>;
    case "ui-med-billing": return <div {...common}><Chrome label="Claims desk"/><div className="xp-gallery-proof__claims"><strong>Claim CL-28419</strong><p>Submitted 18 August · 1,480.00</p>{["Received","Clinical review","Coverage check","Settlement"].map((value,index)=><span data-complete={index<3} key={value}><i/>{value}</span>)}</div></div>;
    default: throw new Error(`Gallery has no D-M1 proof renderer for ${item.assetId}.`);
  }
}

function RasterMedia({ item, expanded = false, failed = false }: { item: ResolvedGalleryItem; expanded?: boolean; failed?: boolean }) {
  if (!item.publicBase || failed || item.mediaStatus === "error") return (
    <div className="xp-gallery__held-media" data-expanded={expanded || undefined} data-media-status="error" role="img" aria-label={item.alt}>
      <span>Media record unavailable</span><strong>{item.alt}</strong>
    </div>
  );
  const srcSet = (format: "avif" | "webp") => [640, 1280, 1920].map((width) => `${item.publicBase}-${width}.${format} ${width}w`).join(", ");
  return (
    <picture
      className="xp-gallery__raster-media"
      data-asset-id={item.assetId}
      data-expanded={expanded || undefined}
      data-media-status="resolved-raster"
      style={{
        "--gallery-focal-x": `${item.focalPoint.x * 100}%`,
        "--gallery-focal-y": `${item.focalPoint.y * 100}%`,
      } as React.CSSProperties}
    >
      <source type="image/avif" srcSet={srcSet("avif")}/>
      <source type="image/webp" srcSet={srcSet("webp")}/>
      <img src={`${item.publicBase}-1280.jpg`} srcSet={[640, 1280, 1920].map((width) => `${item.publicBase}-${width}.jpg ${width}w`).join(", ")} sizes="(max-width: 839px) 92vw, 44vw" alt={item.alt} loading="eager" decoding="async"/>
    </picture>
  );
}

function MediaPlate({ item, expanded = false, failed = false }: { item: ResolvedGalleryItem; expanded?: boolean; failed?: boolean }) {
  return item.mediaKind === "ui_project_proof"
    ? <UiProof item={item} expanded={expanded} failed={failed}/>
    : <RasterMedia item={item} expanded={expanded} failed={failed}/>;
}

function GalleryCard({ item, view, index }: { item: ResolvedGalleryItem; view: View; index: number }) {
  const failed = item.mediaStatus === "error" || (view.mediaFallback && index === 0);
  const label = item.title ?? `Frame ${String(index + 1).padStart(2, "0")}`;
  return (
    <article
      className="xp-gallery__card"
      data-gallery-item-id={item.id}
      data-gallery-weight={item.weight ?? "standard"}
      data-selected={view.selectedIndex === index || undefined}
      data-media-state={failed ? "fallback" : item.mediaStatus}
    >
      <MediaPlate item={item} failed={failed}/>
      <button
        type="button"
        className="xp-gallery__proof-open"
        aria-label={`${view.model.labels.lightbox.open}: ${item.alt}`}
        onClick={() => view.open(item)}
        onFocus={() => view.select(index)}
      >
        <span>{label}</span><i aria-hidden="true">↗</i>
      </button>
    </article>
  );
}

function ActionLink({ action }: { action: GalleryFixture["actions"][number] }) {
  return <a className="xp-gallery__action" data-gallery-action-id={action.id} href={action.href}>{action.label}<span aria-hidden="true">↗</span></a>;
}

function StoryRail({ view }: { view: View }) {
  const keyHandler = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      view.move(event.key === "ArrowLeft" ? -1 : 1);
    }
  };
  const bands = view.visibleItems.some(({ band }) => band)
    ? [1, 2].map((band) => view.visibleItems.filter((item) => item.band === band))
    : [view.visibleItems];
  const localForm = view.model.preset === "filtered-project-rail"
    ? "continuous-rail"
    : view.deviceClass === "M"
      ? "story-one-up-peek"
      : view.deviceClass === "TP"
        ? "story-one-half-up"
        : view.deviceClass === "TL"
          ? "story-two-up"
          : "story-three-up";

  return (
    <div className="xp-gallery__filtered" data-local-form={localForm}>
      {view.model.filters.length ? (
        <div className="xp-gallery__filters" role="radiogroup" aria-label={view.model.labels.filter?.group}>
          {view.model.filters.map((filter) => (
            <button type="button" role="radio" aria-checked={filter.id === view.activeFilterId} data-active={filter.id === view.activeFilterId || undefined} onClick={() => view.selectFilter(filter.id)} key={filter.id}>{filter.label}</button>
          ))}
        </div>
      ) : null}
      <div ref={view.railReference} className="xp-gallery__rail-owner" onKeyDown={keyHandler} data-gallery-reveal-owner data-selected-index={view.selectedIndex}>
        {bands.map((bandItems, bandIndex) => (
          <div className="xp-gallery__story-band" data-gallery-band={bandIndex + 1} key={`band-${bandIndex + 1}`}>
            <SnapRail label={`${view.model.intro.heading} ${bands.length > 1 ? bandIndex + 1 : ""}`.trim()} paginationLabel={view.model.labels.progress?.label ?? view.model.intro.heading} markerLabel={(index) => fill(view.model.labels.rail.position, index + 1, bandItems.length)} peek="12%" physics="native">
              {bandItems.map((item) => {
                const index = view.visibleItems.findIndex(({ id }) => id === item.id);
                return <SnapRail.Item key={item.id}><GalleryCard item={item} view={view} index={index}/></SnapRail.Item>;
              })}
            </SnapRail>
          </div>
        ))}
      </div>
      <div className="xp-gallery__rail-controls">
        <button type="button" aria-label={view.model.labels.rail.previous} disabled={view.selectedIndex === 0} onClick={() => view.move(-1)}>←</button>
        <p aria-live="polite">{fill(view.model.labels.rail.position, view.selectedIndex + 1, view.visibleItems.length)}</p>
        <button type="button" aria-label={view.model.labels.rail.next} disabled={view.selectedIndex === view.visibleItems.length - 1} onClick={() => view.move(1)}>→</button>
      </div>
    </div>
  );
}

function Wall({ view }: { view: View }) {
  const disclosureApplies = ["M", "TP"].includes(view.deviceClass) && view.visibleItems.length > 8;
  const renderedItems = disclosureApplies && !view.expanded ? view.visibleItems.slice(0, 8) : view.visibleItems;
  const localForm = ["M", "TP"].includes(view.deviceClass)
    ? "wall-two-up"
    : view.deviceClass === "TL"
      ? "wall-normalized"
      : "wall-mosaic";

  return (
    <div className="xp-gallery__wall-owner" data-local-form={localForm} data-expanded={view.expanded || undefined} data-gallery-reveal-owner>
      <div className="xp-gallery__wall" role="list">
        {renderedItems.map((item, index) => <div role="listitem" key={item.id}><GalleryCard item={item} view={view} index={index}/></div>)}
      </div>
      {disclosureApplies ? (
        <button className="xp-gallery__disclosure" type="button" aria-expanded={view.expanded} onClick={() => view.setExpanded(!view.expanded)}>
          {view.expanded ? view.model.labels.wall.showLess : view.model.labels.wall.showAll}
          <span aria-hidden="true">{view.expanded ? "↑" : `+${view.visibleItems.length - renderedItems.length}`}</span>
        </button>
      ) : null}
    </div>
  );
}

const renderForm = ({ core, form }: { core: View; form: string }) => (
  <div className="xp-gallery__form" data-native-form={form}>
    {core.model.intent === "wall" ? <Wall view={core}/> : <StoryRail view={core}/>}
  </div>
);
const renderers = { mobile: renderForm, "tablet-portrait": renderForm, "tablet-landscape": renderForm, "desktop-standard": renderForm, "desktop-wide": renderForm };

export function Gallery({ fixture, mediaMap, stress, scenario, className }: Properties) {
  const deviceClass = useDeviceClass();
  const model = resolveGalleryFixture(fixture, mediaMap, stress);
  const initialFilter = scenario?.filterId && model.filters.some(({ id }) => id === scenario.filterId)
    ? scenario.filterId
    : model.filters[0]?.id ?? "all";
  const [activeFilterId, setActiveFilterId] = useState(initialFilter);
  const activeFilter = model.filters.find(({ id }) => id === activeFilterId);
  const visibleItems = useMemo(
    () => activeFilter ? activeFilter.itemIds.map((id) => model.itemsById.get(id)!) : model.items,
    [activeFilter, model.items, model.itemsById],
  );
  const initialIndex = Math.max(0, visibleItems.findIndex(({ id }) => id === scenario?.selectedItemId));
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [expanded, setExpanded] = useState(Boolean(scenario?.expanded));
  const [lightboxId, setLightboxId] = useState<string | undefined>(scenario?.lightboxItemId);
  const [zoomed, setZoomed] = useState(false);
  const returnFocusId = useRef<string | undefined>(undefined);
  const railReference = useRef<HTMLDivElement>(null);
  const select = (index: number) => setSelectedIndex(Math.max(0, Math.min(visibleItems.length - 1, index)));
  const move = (direction: -1 | 1) => select(selectedIndex + direction);

  useEffect(() => {
    const owner = railReference.current;
    const item = owner?.querySelector<HTMLElement>(`[data-gallery-item-id="${visibleItems[selectedIndex]?.id}"]`);
    const rail = item?.closest<HTMLElement>("[data-xp-rail]");
    if (rail && item) {
      const railBounds = rail.getBoundingClientRect();
      const itemBounds = item.getBoundingClientRect();
      const inset = Math.max(0, (rail.clientWidth - item.clientWidth) / 2);
      rail.scrollTo({ left: Math.max(0, rail.scrollLeft + itemBounds.left - railBounds.left - inset), behavior: "auto" });
    }
  }, [selectedIndex, visibleItems]);

  const selectFilter = (id: string) => { setActiveFilterId(id); setSelectedIndex(0); };
  const open = (item: ResolvedGalleryItem) => { returnFocusId.current = item.id; setZoomed(false); setLightboxId(item.id); };
  const close = () => {
    const id = returnFocusId.current;
    setLightboxId(undefined);
    setZoomed(false);
    if (id) requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-gallery-item-id="${id}"] .xp-gallery__proof-open`)?.focus()));
  };
  const lightboxItem = lightboxId ? model.itemsById.get(lightboxId) : undefined;
  const lightboxPosition = lightboxItem ? visibleItems.findIndex(({ id }) => id === lightboxItem.id) : -1;
  const lightboxMove = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(visibleItems.length - 1, lightboxPosition + direction));
    setLightboxId(visibleItems[next].id); setSelectedIndex(next); setZoomed(false);
  };
  const lightboxKeyHandler = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); lightboxMove(event.key === "ArrowLeft" ? -1 : 1);
    }
  };
  const mediaFallback = Boolean(scenario?.mediaFallback || stress === "mediaFallback");
  const view: View = { model, deviceClass, activeFilterId, visibleItems, selectedIndex, selectFilter, select, move, open, railReference, mediaFallback, expanded, setExpanded };
  const introActions = model.intro.actionIds.map((id) => model.actions.find((action) => action.id === id)).filter((action): action is GalleryFixture["actions"][number] => Boolean(action));

  return (
    <section className={["xp-gallery", className].filter(Boolean).join(" ")} data-xp-owner="Gallery" data-gallery-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.composition} data-device-class={deviceClass} data-stress={stress ?? "base"} data-terminal-eligible={model.terminalEligible || undefined} aria-labelledby={`${model.sourceKey}-title`}>
      <header className="xp-gallery__intro">
        {model.intro.eyebrow ? <span>{model.intro.eyebrow}</span> : null}
        <h2 id={`${model.sourceKey}-title`}>{model.intro.heading}</h2>
        <p>{model.intro.body}</p>
        {introActions.length ? <div className="xp-gallery__intro-actions">{introActions.map((action) => <ActionLink action={action} key={action.id}/>)}</div> : null}
      </header>
      <MorphSlot className="xp-gallery__morph" ladder={ladder} core={view} renderers={renderers}/>
      {model.footerNote ? (
        <footer className="xp-gallery__footer-note"><div><strong>{model.footerNote.heading}</strong><span>{model.footerNote.countText}</span></div><ActionLink action={model.actions.find(({ id }) => id === model.footerNote!.actionId)!}/></footer>
      ) : null}
      {lightboxItem ? (
        <AdaptiveOverlay intent="detail" presentation={{ M: "full-screen", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" }} why="Gallery inspection keeps one full visual plate and deterministic navigation." open onOpenChange={(next) => { if (!next) close(); }} modal>
          <AdaptiveOverlay.Content className="xp-gallery__lightbox" data-lightbox-item-id={lightboxItem.id} data-zoom={zoomed ? "zoomed" : "fit"} onKeyDown={lightboxKeyHandler}>
            <AdaptiveOverlay.Header title={lightboxItem.title ?? model.intro.heading} description={fill(model.labels.lightbox.position, lightboxPosition + 1, visibleItems.length)} closeLabel={model.labels.lightbox.close}/>
            <AdaptiveOverlay.Body><div className="xp-gallery__lightbox-stage"><MediaPlate item={lightboxItem} expanded failed={lightboxItem.mediaStatus === "error" || (mediaFallback && lightboxPosition === 0)}/></div></AdaptiveOverlay.Body>
            <AdaptiveOverlay.Footer>
              <button type="button" aria-label={model.labels.lightbox.previous} disabled={lightboxPosition <= 0} onClick={() => lightboxMove(-1)}>←</button>
              <button type="button" aria-pressed={zoomed} disabled={lightboxItem.mediaStatus === "error"} onClick={() => setZoomed((value) => !value)}>{zoomed ? model.labels.lightbox.resetZoom : model.labels.lightbox.zoom}</button>
              <button type="button" aria-label={model.labels.lightbox.next} disabled={lightboxPosition >= visibleItems.length - 1} onClick={() => lightboxMove(1)}>→</button>
            </AdaptiveOverlay.Footer>
          </AdaptiveOverlay.Content>
        </AdaptiveOverlay>
      ) : null}
    </section>
  );
}
