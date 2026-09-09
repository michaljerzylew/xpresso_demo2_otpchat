"use client";

import type { DeviceClass } from "@xp/primitives";
import type { PdpMediaSeat, ProductDetailSection, ProductOverviewMediaRecord, ResolvedProductAction } from "./product-overview-model";
import type { ProductOverviewCoreState, ResolvePdpMediaSeat } from "./product-overview";

function DetailAction({ action, state }: { action: ResolvedProductAction; state: ProductOverviewCoreState }) {
  const common = { className: "xp-detail-sections__action", "data-product-action-id": action.id, "data-action-kind": action.normalizedKind, "data-emphasis": action.emphasis, "data-xp-control": true } as const;
  return action.normalizedKind === "navigate"
    ? <a {...common} href={action.href}>{action.label}</a>
    : <button {...common} type="button" onClick={() => state.runAction(action)}>{action.label}</button>;
}

function MediaMark({ seat, record, sourceKey }: { seat: PdpMediaSeat; record: ProductOverviewMediaRecord; sourceKey: string }) {
  if (record.slug !== sourceKey || record.seatId !== seat.id || record.key !== (seat.assetKey ?? seat.systemKey)) throw new Error(`${sourceKey}/${seat.id} resolved the wrong detail media record.`);
  if (record.kind === "system-mark" && record.src?.startsWith("/media/") && record.src.endsWith(".svg")) return <img src={record.src} alt={seat.alt} data-detail-media-id={seat.id} />;
  if (record.kind === "product-thumb" && record.publicBase?.startsWith("/media/")) return <picture data-detail-media-id={seat.id}><source srcSet={`${record.publicBase}-640.avif`} type="image/avif" /><source srcSet={`${record.publicBase}-640.webp`} type="image/webp" /><img src={`${record.publicBase}-640.jpg`} alt={seat.alt} width={640} height={480} loading="lazy" /></picture>;
  if (record.kind === "system-ui" && record.systemKey === seat.systemKey) return <span role="img" aria-label={seat.alt} data-detail-media-id={seat.id} data-system-key={seat.systemKey} />;
  throw new Error(`${sourceKey}/${seat.id} cannot render its declared detail media kind.`);
}

function SectionBody({ section, state, resolveMediaSeat }: { section: ProductDetailSection; state: ProductOverviewCoreState; resolveMediaSeat: ResolvePdpMediaSeat }) {
  const actions = (section.actionIds ?? []).map((id) => state.model.actions.find((action) => action.id === id)!).filter(Boolean);
  const seats = (section.mediaSeatIds ?? []).map((id) => state.model.media.find((seat) => seat.id === id)!).filter(Boolean);
  return <div className="xp-detail-sections__body">
    {section.body ? <p>{section.body}</p> : null}
    {section.facts?.length ? <dl>{section.facts.map((fact) => <div key={fact.id} data-detail-fact-id={fact.id} data-tone={fact.tone}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : null}
    {seats.length ? <div className="xp-detail-sections__media">{seats.map((seat) => <MediaMark key={seat.id} seat={seat} record={resolveMediaSeat(seat)} sourceKey={state.model.sourceKey} />)}</div> : null}
    {actions.length ? <div className="xp-detail-sections__actions">{actions.map((action) => <DetailAction key={action.id} action={action} state={state} />)}</div> : null}
  </div>;
}

const detailForm = (deviceClass: DeviceClass) => deviceClass === "M" || deviceClass === "TP" ? "accordion" : deviceClass === "DW" ? "grid-2" : "disclosure";

export function DetailSections({ state, deviceClass, resolveMediaSeat }: { state: ProductOverviewCoreState; deviceClass: DeviceClass; resolveMediaSeat: ResolvePdpMediaSeat }) {
  const form = detailForm(deviceClass);
  const referenced = new Set(state.model.details.flatMap(({ actionIds = [] }) => actionIds));
  const utilityActions = state.model.actions.filter(({ ownerId, id }) => ownerId === "detail-sections" && !referenced.has(id));
  return <section className="xp-detail-sections" data-xp-detail-sections data-xp-owner="DetailSections" data-form={form} aria-label={state.model.product.title}>
    <div className="xp-detail-sections__collection">{state.model.details.map((section) => form === "grid-2"
      ? <article className="xp-detail-sections__section" data-detail-section-id={section.id} data-priority={section.priority} key={section.id}><h2>{section.title}</h2><SectionBody section={section} state={state} resolveMediaSeat={resolveMediaSeat} /></article>
      : <details className="xp-detail-sections__section" data-detail-section-id={section.id} data-priority={section.priority} open={section.initiallyOpen ?? section.priority === 1} key={section.id}><summary data-xp-control>{section.title}</summary><SectionBody section={section} state={state} resolveMediaSeat={resolveMediaSeat} /></details>)}</div>
    {state.model.facts.length ? <div className="xp-detail-sections__support">{state.model.facts.map((fact) => {
      const seats = (fact.mediaSeatIds ?? []).map((id) => state.model.media.find((seat) => seat.id === id)!).filter(Boolean);
      return <article key={fact.id} data-support-fact-id={fact.id} data-kind={fact.kind}><h2>{fact.title}</h2>{fact.body ? <p>{fact.body}</p> : null}{seats.length ? <div className="xp-detail-sections__media">{seats.map((seat) => <MediaMark key={seat.id} seat={seat} record={resolveMediaSeat(seat)} sourceKey={state.model.sourceKey} />)}</div> : null}</article>;
    })}</div> : null}
    {utilityActions.length ? <div className="xp-detail-sections__utility-actions">{utilityActions.map((action) => <DetailAction key={action.id} action={action} state={state} />)}</div> : null}
  </section>;
}
