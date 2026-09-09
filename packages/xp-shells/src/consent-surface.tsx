"use client";

import { AdaptiveOverlay, useDeviceClass, type DeviceClass } from "@xp/primitives";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type ConsentPreset = "policy-manage" | "minimal-binary" | "reasoned-manage";

export type ConsentReason = {
  id: string;
  icon: "cookie" | "shield-check" | "lock-keyhole";
  label: string;
};

export type ConsentCategory = {
  id: string;
  label: string;
  description: string;
  required: boolean;
  defaultEnabled: boolean;
};

export type ConsentCopy = {
  title: string;
  body?: string;
  emblem?: "cookie";
  policyLink?: { label: string; href: string };
  reasons?: readonly ConsentReason[];
  categories?: readonly ConsentCategory[];
  actions: {
    allowAll: string;
    declineOptional?: string;
    manage?: string;
    save?: string;
  };
  announcements: {
    allowAll: string;
    declineOptional?: string;
    save?: string;
    error: string;
  };
};

export type ConsentDecision = {
  outcome: "all" | "essential-only" | "custom";
  enabledCategoryIds: string[];
  decidedAt: string;
};

export type ConsentCallbacks = {
  onAllowAll: (decision: ConsentDecision) => void | Promise<void>;
  onDeclineOptional?: (decision: ConsentDecision) => void | Promise<void>;
  onSavePreferences?: (decision: ConsentDecision) => void | Promise<void>;
  onManageOpenChange?: (open: boolean) => void;
};

export type ConsentSurfaceProperties = ConsentCallbacks & {
  preset: ConsentPreset;
  copy: ConsentCopy;
  ready: boolean;
  resolvedDecision?: ConsentDecision | null;
  initialEnabledCategoryIds?: readonly string[];
  deviceClass?: DeviceClass;
  children?: ReactNode;
  sourceSlug?: string;
};

export const consentSurfaceForms: Record<DeviceClass, "bottom-sheet" | "floating-band" | "corner-card"> = {
  M: "bottom-sheet",
  TP: "floating-band",
  TL: "corner-card",
  DS: "corner-card",
  DW: "corner-card",
};

const EMPTY_CATEGORIES: readonly ConsentCategory[] = [];

function nonempty(value: string | undefined) {
  return Boolean(value?.trim());
}

export function validateConsentCopy(preset: ConsentPreset, copy: ConsentCopy): string[] {
  const errors: string[] = [];
  const categories = copy.categories ?? EMPTY_CATEGORIES;
  const reasons = copy.reasons ?? [];
  const management = preset !== "minimal-binary";
  if (!nonempty(copy.title) || copy.title.length > 40) errors.push("title must contain 1 to 40 characters");
  if (copy.body && copy.body.length > 160) errors.push("body must not exceed 160 characters");
  if (!nonempty(copy.actions.allowAll) || copy.actions.allowAll.length > 28) errors.push("allowAll must contain 1 to 28 characters");
  if (management && (categories.length < 2 || categories.length > 6)) errors.push("managed presets require 2 to 6 categories");
  if (management && !categories.some(({ required }) => required)) errors.push("managed presets require at least one required category");
  if (management && (!nonempty(copy.actions.manage) || !nonempty(copy.actions.save))) errors.push("managed presets require manage and save labels");
  if (preset === "policy-manage") {
    if (copy.emblem !== "cookie" || !nonempty(copy.body) || !copy.policyLink) errors.push("policy-manage requires emblem, body and policy link");
    if (copy.actions.declineOptional || reasons.length) errors.push("policy-manage forbids first-paint decline and reasons");
  }
  if (preset === "minimal-binary") {
    if (copy.emblem !== "cookie" || !nonempty(copy.actions.declineOptional)) errors.push("minimal-binary requires emblem and declineOptional");
    if (copy.body || copy.policyLink || reasons.length || categories.length || copy.actions.manage || copy.actions.save) errors.push("minimal-binary forbids body, policy, reasons, categories and management");
  }
  if (preset === "reasoned-manage") {
    if (copy.emblem || !nonempty(copy.body) || !copy.policyLink) errors.push("reasoned-manage requires body and policy but no lead emblem");
    if (reasons.length !== 3 || reasons.map(({ icon }) => icon).join("|") !== "cookie|shield-check|lock-keyhole") errors.push("reasoned-manage requires the ordered three-reason icon sequence");
    if (!nonempty(copy.actions.declineOptional)) errors.push("reasoned-manage requires declineOptional");
  }
  if (copy.policyLink && (!nonempty(copy.policyLink.label) || !nonempty(copy.policyLink.href) || copy.policyLink.href === "#")) errors.push("policy link must have a descriptive label and real host route");
  if (new Set(categories.map(({ id }) => id)).size !== categories.length) errors.push("category ids must be unique");
  if (categories.some(({ id, label, description }) => !nonempty(id) || !nonempty(label) || label.length > 40 || !nonempty(description) || description.length > 80)) errors.push("category content violates its budget");
  if (categories.some(({ required, defaultEnabled }) => required && !defaultEnabled)) errors.push("required categories must default enabled");
  if (reasons.some(({ id, label }) => !nonempty(id) || !nonempty(label) || label.length > 40)) errors.push("reason content violates its budget");
  if (JSON.stringify(copy).includes("—")) errors.push("copy must not contain em dashes");
  return errors;
}

function ConsentIcon({ icon }: { icon: ConsentReason["icon"] }) {
  if (icon === "shield-check") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3.2 19 6v5.2c0 4.5-2.8 7.6-7 9.6-4.2-2-7-5.1-7-9.6V6z" /><path d="m8.7 11.8 2.1 2.1 4.6-4.8" /></svg>;
  if (icon === "lock-keyhole") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V7.7a4 4 0 0 1 8 0V10M12 14v2" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.2 13.1A8.5 8.5 0 1 1 10.9 3.8a4.2 4.2 0 0 0 5.2 5.2 4.2 4.2 0 0 0 4.1 4.1Z" /><circle cx="8.4" cy="9.4" r=".7" fill="currentColor" stroke="none" /><circle cx="9.8" cy="15.2" r=".7" fill="currentColor" stroke="none" /><circle cx="14.8" cy="16.2" r=".7" fill="currentColor" stroke="none" /></svg>;
}

function categoryIdsFor(copy: ConsentCopy, mode: "all" | "required") {
  return (copy.categories ?? []).filter((category) => mode === "all" || category.required).map(({ id }) => id);
}

function decisionFor(copy: ConsentCopy, enabledCategoryIds: readonly string[]): ConsentDecision {
  const all = categoryIdsFor(copy, "all");
  const required = categoryIdsFor(copy, "required");
  const enabled = all.filter((id) => enabledCategoryIds.includes(id));
  const outcome = enabled.length === all.length ? "all" : enabled.length === required.length && required.every((id) => enabled.includes(id)) ? "essential-only" : "custom";
  return { outcome, enabledCategoryIds: enabled, decidedAt: new Date().toISOString() };
}

export function ConsentSurface({
  preset,
  copy,
  ready,
  resolvedDecision = null,
  initialEnabledCategoryIds,
  deviceClass: explicitDeviceClass,
  children,
  sourceSlug,
  onAllowAll,
  onDeclineOptional,
  onSavePreferences,
  onManageOpenChange,
}: ConsentSurfaceProperties) {
  const contextDeviceClass = useDeviceClass();
  const deviceClass = explicitDeviceClass ?? contextDeviceClass;
  const categories = copy.categories ?? EMPTY_CATEGORIES;
  const initial = useMemo(() => {
    const requested = new Set(initialEnabledCategoryIds ?? categories.filter(({ defaultEnabled }) => defaultEnabled).map(({ id }) => id));
    return categories.filter(({ required, id }) => required || requested.has(id)).map(({ id }) => id);
  }, [categories, initialEnabledCategoryIds]);
  const [draft, setDraft] = useState<readonly string[]>(initial);
  const [manageOpen, setManageOpen] = useState(false);
  const [pending, setPending] = useState<"allow" | "decline" | "save" | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [ownerHeight, setOwnerHeight] = useState(0);
  const surfaceRef = useRef<HTMLElement>(null);
  const errors = validateConsentCopy(preset, copy);
  if (errors.length) throw new Error(`Invalid ConsentSurface ${preset}: ${errors.join("; ")}`);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !ready || resolvedDecision) {
      setOwnerHeight(0);
      return;
    }
    const update = () => setOwnerHeight(Math.ceil(surface.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [ready, resolvedDecision, deviceClass, preset]);

  const setOpen = (open: boolean) => {
    if (open) {
      setDraft(initial);
      setAnnouncement("");
    } else if (!pending) {
      setDraft(initial);
    }
    setManageOpen(open);
    onManageOpenChange?.(open);
  };

  const commit = async (kind: "allow" | "decline" | "save") => {
    if (pending) return;
    const ids = kind === "allow" ? categoryIdsFor(copy, "all") : kind === "decline" ? categoryIdsFor(copy, "required") : draft;
    const decision = decisionFor(copy, ids);
    const callback = kind === "allow" ? onAllowAll : kind === "decline" ? onDeclineOptional : onSavePreferences;
    if (!callback) return;
    setPending(kind);
    setAnnouncement("");
    try {
      await callback(decision);
      setAnnouncement(kind === "allow" ? copy.announcements.allowAll : kind === "decline" ? copy.announcements.declineOptional ?? "" : copy.announcements.save ?? "");
      if (kind === "save") setOpen(false);
    } catch {
      setAnnouncement(copy.announcements.error);
    } finally {
      setPending(null);
    }
  };

  const form = consentSurfaceForms[deviceClass];
  const managed = preset !== "minimal-binary";
  const overlayPresentation = categories.length >= 4 ? { TL: "sheet" as const } : undefined;
  const hostStyle = { "--xp-bottom-owner-height": `${ownerHeight}px` } as CSSProperties;

  return <div className="xp-consent-host" style={hostStyle} data-xp-consent-host="" data-xp-consent-renderer="" data-bottom-owner={manageOpen ? "overlay" : ready && !resolvedDecision ? "consent" : "none"} data-xp-consent-ready={ready ? "true" : "false"}>
    <div className="xp-consent-host__content" data-xp-consent-page="">{children}</div>
    <p className="xp-consent__announcement" role="status" aria-live="polite" data-xp-consent-announcement="">{announcement}</p>
    {ready && !resolvedDecision ? <section ref={surfaceRef} className={`xp-consent xp-consent--${form} xp-consent--${preset}`} role="region" aria-labelledby={`xp-consent-title-${preset}`} aria-busy={pending ? "true" : undefined} aria-hidden={manageOpen ? "true" : undefined} inert={manageOpen} data-xp-region="bottom" data-xp-consent-surface="" data-xp-consent-owner={manageOpen ? undefined : "consent"} data-source-slug={sourceSlug} data-preset={preset} data-device-class={deviceClass} data-variant={form}>
      {form === "bottom-sheet" ? <span className="xp-consent__handle" aria-hidden="true" /> : null}
      {copy.emblem ? <span className="xp-consent__emblem" data-xp-consent-emblem=""><ConsentIcon icon="cookie" /></span> : null}
      <div className="xp-consent__message">
        <h2 id={`xp-consent-title-${preset}`}>{copy.title}</h2>
        {preset === "policy-manage" && copy.body ? <p data-xp-consent-body="">{copy.body} {copy.policyLink ? <a href={copy.policyLink.href} data-xp-consent-policy="">{copy.policyLink.label}</a> : null}</p> : null}
      </div>
      <div className="xp-consent__actions" data-xp-consent-actions="">
        <button type="button" className="xp-consent__action xp-consent__action--primary" disabled={Boolean(pending)} data-consent-action="allow-all" onClick={() => void commit("allow")}>{copy.actions.allowAll}</button>
        {copy.actions.declineOptional ? <button type="button" className="xp-consent__action xp-consent__action--secondary" disabled={Boolean(pending)} data-consent-action="decline-optional" onClick={() => void commit("decline")}>{copy.actions.declineOptional}</button> : null}
        {managed ? <AdaptiveOverlay open={manageOpen} onOpenChange={setOpen} intent="pick" presentation={overlayPresentation} why={overlayPresentation ? "Four or more categories need a touch-native landscape sheet with a complete fixed footer." : undefined}>
          <AdaptiveOverlay.Trigger className="xp-consent__action xp-consent__action--secondary" disabled={Boolean(pending)} data-consent-action="manage">{copy.actions.manage}</AdaptiveOverlay.Trigger>
          <AdaptiveOverlay.Content className="xp-consent-manage" data-xp-consent-manage="" data-device-class={deviceClass} data-preset={preset} data-xp-consent-owner="overlay">
            <AdaptiveOverlay.Header title={copy.actions.manage} description="Choose which optional data uses are enabled." />
            <AdaptiveOverlay.Body className="xp-consent-manage__body" data-xp-consent-manage-body="">
              {preset === "reasoned-manage" ?
                <ul className="xp-consent-manage__reasons" data-xp-consent-reasons="">{copy.reasons?.map((reason) => <li key={reason.id} data-consent-reason-id={reason.id} data-reason-icon={reason.icon}><span><ConsentIcon icon={reason.icon} /></span><strong>{reason.label}</strong></li>)}</ul>
              : null}
              {copy.body ? <p className="xp-consent-manage__explanation" data-xp-consent-body="">{copy.body} {copy.policyLink ? <a href={copy.policyLink.href} data-xp-consent-policy="">{copy.policyLink.label}</a> : null}</p> : null}
              <fieldset className="xp-consent-manage__categories" data-xp-consent-categories=""><legend>Data use categories</legend>{categories.map((category) => {
                const checked = category.required || draft.includes(category.id);
                const descriptionId = `xp-consent-${preset}-${category.id}-description`;
                return <label key={category.id} data-consent-category-id={category.id} data-consent-required={category.required ? "true" : "false"}>
                  <input type="checkbox" checked={checked} aria-disabled={category.required ? "true" : undefined} aria-describedby={descriptionId} onChange={() => {
                    if (category.required) return;
                    setDraft((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id]);
                  }} />
                  <span><strong>{category.label}{category.required ? " · Required" : ""}</strong><small id={descriptionId}>{category.description}</small></span>
                </label>;
              })}</fieldset>
            </AdaptiveOverlay.Body>
            <AdaptiveOverlay.Footer className="xp-consent-manage__footer" data-xp-consent-manage-footer="">
              <button type="button" className="xp-consent__action xp-consent__action--primary" disabled={Boolean(pending)} data-consent-action="save" onClick={() => void commit("save")}>{copy.actions.save}</button>
              <AdaptiveOverlay.Close className="xp-consent__action xp-consent__action--secondary" disabled={Boolean(pending)} data-consent-action="close">Close preferences</AdaptiveOverlay.Close>
            </AdaptiveOverlay.Footer>
          </AdaptiveOverlay.Content>
        </AdaptiveOverlay> : null}
      </div>
    </section> : null}
  </div>;
}
