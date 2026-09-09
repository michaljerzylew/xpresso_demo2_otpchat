import type { ReactNode } from "react";
import type {
  CompareAction,
  CompareCandidate,
  CompareResolvedMediaAsset,
  CompareValue,
  ResolvedCompareFixture,
} from "./compare-model";

export type CompareActionEvent = { action: CompareAction; ownerId: string };
export type CompareActionHandler = (event: CompareActionEvent) => void;

export function CompareHeader({ model, after }: { model: ResolvedCompareFixture; after?: ReactNode }) {
  const { copy } = model;
  if (!copy.eyebrow && !copy.title && !copy.description && !after) return null;
  return (
    <header className="xp-compare__header">
      <div className="xp-compare__heading">
        {copy.eyebrow ? <p className="xp-compare__eyebrow">{copy.eyebrow}</p> : null}
        {copy.title ? <h1>{copy.title}</h1> : null}
        {copy.description ? <p className="xp-compare__description">{copy.description}</p> : null}
      </div>
      {after ? <div className="xp-compare__header-action">{after}</div> : null}
    </header>
  );
}

export function compareAction(model: ResolvedCompareFixture, id: string) {
  const action = model.actions.find((candidate) => candidate.id === id);
  if (!action) throw new Error(`${model.sourceKey} cannot render missing action ${id}.`);
  return action;
}

export function CompareActionControl({
  action,
  ownerId = action.ownerId,
  onAction,
  className,
  children,
  offerAction = false,
}: {
  action: CompareAction;
  ownerId?: string;
  onAction?: CompareActionHandler;
  className?: string;
  children?: ReactNode;
  offerAction?: boolean;
}) {
  const properties = {
    className: ["xp-compare__action", className].filter(Boolean).join(" "),
    "data-action-id": action.id,
    "data-action-owner": ownerId,
    "data-emphasis": action.emphasis,
    "data-offer-action": offerAction || undefined,
    "data-xp-control": "",
    onClick: () => onAction?.({ action, ownerId }),
  };
  if (action.href) return <a {...properties} href={action.href}>{children ?? action.label}</a>;
  return <button {...properties} type="button">{children ?? action.label}</button>;
}

export function mediaFor(model: ResolvedCompareFixture, seatId?: string) {
  if (!seatId) return undefined;
  return model.resolvedMedia.find((asset) => asset.seatId === seatId);
}

export function CompareMedia({ asset, className }: { asset?: CompareResolvedMediaAsset; className?: string }) {
  if (!asset) return null;
  const image = <img className={["xp-compare__media", className].filter(Boolean).join(" ")} src={asset.src} alt={asset.alt} data-media-seat-id={asset.seatId} data-media-asset-key={asset.assetKey} />;
  if (!asset.darkSrc) return image;
  return <picture style={{ display: "contents" }}><source media="(prefers-color-scheme: dark)" srcSet={asset.darkSrc} />{image}</picture>;
}

export function CompareCandidateIdentity({ model, candidate, action, onAction }: {
  model: ResolvedCompareFixture;
  candidate: CompareCandidate;
  action?: CompareAction;
  onAction?: CompareActionHandler;
}) {
  return (
    <div className="xp-compare-candidate" data-candidate-id={candidate.id} data-highlighted={candidate.highlighted || undefined}>
      <CompareMedia asset={mediaFor(model, candidate.mediaSeatId)} />
      <span className="xp-compare-candidate__copy">
        <strong>{candidate.name}</strong>
        {candidate.description ? <small>{candidate.description}</small> : null}
        {candidate.badge ? <em>{candidate.badge}</em> : null}
      </span>
      {candidate.price ? <span className="xp-compare-candidate__price"><CompareValueView value={candidate.price.current} />{candidate.price.previous ? <del><CompareValueView value={candidate.price.previous} /></del> : null}{candidate.price.discountLabel ? <small>{candidate.price.discountLabel}</small> : null}</span> : null}
      {action ? <CompareActionControl action={action} ownerId={candidate.id} onAction={onAction} /> : null}
    </div>
  );
}

export function CompareValueView({ value }: { value: CompareValue }) {
  if (value.kind === "text") return <span className="xp-compare-value" data-value-kind="text"><span>{value.text}</span>{value.annotation ? <small>{value.annotation}</small> : null}</span>;
  if (value.kind === "number") return <span className="xp-compare-value xp-compare-value--number" data-value-kind="number"><strong>{new Intl.NumberFormat("en-US").format(value.value)}</strong>{value.unit ? <small>{value.unit}</small> : null}</span>;
  if (value.kind === "money") return <span className="xp-compare-value xp-compare-value--number" data-value-kind="money"><strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: value.currency }).format(value.amountMinor / 100)}</strong>{value.qualifier ? <small>{value.qualifier}</small> : null}</span>;
  if (value.kind === "boolean") {
    const label = value.value ? value.trueLabel : value.falseLabel;
    return <span className="xp-compare-value xp-compare-value--boolean" data-value-kind="boolean" data-value={value.value ? "true" : "false"}><span aria-hidden="true">{value.value ? "✓" : "×"}</span><strong>{label}</strong></span>;
  }
  if (value.kind === "status") return <span className="xp-compare-value xp-compare-value--status" data-value-kind="status" data-tone={value.tone}>{value.label}</span>;
  return <span className="xp-compare-value xp-compare-value--rating" data-value-kind="rating" aria-label={value.label}><strong>{value.value}</strong><span aria-hidden="true"> / {value.maximum}</span><small>{value.label}</small></span>;
}

export function announcement(model: ResolvedCompareFixture, keys: string[]) {
  for (const key of keys) {
    const value = model.copy.announcements[key];
    if (value?.trim()) return value;
  }
  return "";
}

export function formatAnnouncement(model: ResolvedCompareFixture, key: string, tokens: Record<string, string | number> = {}) {
  const template = model.copy.announcements[key] ?? "";
  return Object.entries(tokens).reduce((value, [token, replacement]) => value.replaceAll(`{${token}}`, String(replacement)), template);
}
