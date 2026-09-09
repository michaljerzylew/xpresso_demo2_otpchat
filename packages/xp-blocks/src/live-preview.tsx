"use client";

import { AdaptiveOverlay, type DeviceClass } from "@xp/primitives";
import type { GiftCardMediaRecord } from "./gift-card-model";

export type LivePreviewValue = { cover: GiftCardMediaRecord | null; coverUrl?: string; coverLabel: string; recipient: string; amount: string; message: string };
export type LivePreviewCopy = { heading: string; fallback: string; coverLabel: string; recipientLabel: string; amountLabel: string; messageLabel: string; compactLabel: string; expand: string; close: string };

function PreviewCard({ value, copy }: { value: LivePreviewValue; copy: LivePreviewCopy }) {
  return <article className="xp-live-preview__card" aria-label={copy.heading}>
    <div className="xp-live-preview__cover" data-media-status={value.coverUrl ? "runtime-upload" : value.cover?.status ?? "missing"}>
      {value.coverUrl ? <img src={value.coverUrl} alt={value.coverLabel} /> : value.cover ? <img src={value.cover.src} alt={value.cover.alt} /> : <strong>{copy.fallback}</strong>}
    </div>
    <dl>
      <div><dt>{copy.recipientLabel}</dt><dd>{value.recipient || "—"}</dd></div>
      <div><dt>{copy.amountLabel}</dt><dd>{value.amount}</dd></div>
      <div><dt>{copy.messageLabel}</dt><dd>{value.message || "—"}</dd></div>
    </dl>
  </article>;
}

export function LivePreview({ value, copy, deviceClass }: { value: LivePreviewValue; copy: LivePreviewCopy; deviceClass: DeviceClass }) {
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <section className="xp-live-preview" data-xp-owner="LivePreview" data-preset="gift-card-editor" data-form={compact ? "dock" : "pane"}>
    <header><h2>{copy.heading}</h2>{compact ? <span>{copy.compactLabel}</span> : null}</header>
    <PreviewCard value={value} copy={copy} />
    <AdaptiveOverlay intent="inspect" presentation={{ M: "full-screen", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" }} why="Compact gift-card forms need an inspectable preview while wide forms retain a bounded side pane.">
      <AdaptiveOverlay.Trigger>{copy.expand}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-live-preview__overlay">
        <AdaptiveOverlay.Header title={copy.heading} closeLabel={copy.close} />
        <AdaptiveOverlay.Body><PreviewCard value={value} copy={copy} /></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>{copy.close}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </section>;
}
