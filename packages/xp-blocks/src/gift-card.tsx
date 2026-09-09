"use client";

import { ChipBar, ChoiceSet, Field, FieldGroup, StickyActionBar, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { UploadUnit } from "./upload-unit";
import {
  createGiftCardUploadModel,
  EMPTY_UPLOAD_MEDIA_MAP,
  resolveGiftCardFixture,
  type GiftCardMediaMap,
  type GiftCardStressKey,
  type GiftCardSurfaceFixture,
  type LiveDesignerFixture,
} from "./gift-card-model";
import { LivePreview } from "./live-preview";
import type { UploadFileRecord } from "./upload-model";

type Values = Record<string, string>;
type Errors = Record<string, string>;
const slotBand = (width: number) => width < 320 ? "S1" : width < 416 ? "S2" : width < 544 ? "S3" : width < 672 ? "S4" : width < 832 ? "S5" : "S6";
const formFor = (deviceClass: DeviceClass) => deviceClass === "M" ? "one-pane" : deviceClass === "TP" ? "touch-deck" : deviceClass === "TL" ? "split" : deviceClass === "DS" ? "split" : deviceClass === "DW" ? "expanded-split" : "one-pane";
const interpolate = (value: string, variables: Record<string, string | number>) => Object.entries(variables).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)), value);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rovingIndex = (event: KeyboardEvent<HTMLButtonElement>, current: number, count: number) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : Math.max(0, Math.min(count - 1, current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1)));
  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(":scope > button")[next]?.focus();
  return next;
};

function TextField({ id, label, example, value, error, help, type = "text", onChange }: { id: string; label: string; example: string; value: string; error?: string; help?: string; type?: string; onChange: (value: string) => void }) {
  return <Field id={id} invalid={Boolean(error)} hasHelp={Boolean(help)} hasError={Boolean(error)}>
    <Field.Label>{label}</Field.Label>
    <Field.Input type={type} value={value} placeholder={example} inputMode={type === "email" ? "email" : "text"} enterKeyHint="next" autoComplete={type === "email" ? "email" : "off"} onChange={(event) => onChange(event.currentTarget.value)} />
    {help ? <Field.Help>{help}</Field.Help> : null}
    {error ? <Field.Error>{error}</Field.Error> : null}
  </Field>;
}

function GiftArt({ record, className }: { record: { alt: string; src: string; status: string }; className?: string }) {
  return <img className={className} src={record.src} alt={record.alt} width={960} height={600} loading="eager" decoding="async" data-media-status={record.status} />;
}

export function GiftCardSurface({ fixture, mediaMap, stress }: { fixture: GiftCardSurfaceFixture; mediaMap: GiftCardMediaMap; stress?: GiftCardStressKey }) {
  const model = useMemo(() => resolveGiftCardFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const copy = model.activeCopy;
  const deviceClass = useDeviceClass();
  const root = useRef<HTMLElement>(null);
  const firstInvalid = useRef<HTMLInputElement | null>(null);
  const [width, setWidth] = useState(0);
  const [values, setValues] = useState<Values>(() => model.sourceKey === "gift-card-01" ? { delivery: "email", currency: "USD", amount: model.amountChoices[0].id, timing: "now", customAmount: "" } as Values : { coverSource: "standard", design: model.designs[0].id, currency: "USD", amount: model.amountChoices[0].id, customAmount: "" } as Values);
  const [fields, setFields] = useState<Values>({ recipientName: "", recipientEmail: "", message: "", country: "", city: "", street: "", postalCode: "", date: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [files, setFiles] = useState<UploadFileRecord[]>([]);
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [showAllDesigns, setShowAllDesigns] = useState(false);
  const [commitState, setCommitState] = useState<"idle" | "pending" | "error" | "success">(stress === "error" ? "error" : stress === "pending" ? "pending" : stress === "success" ? "success" : "idle");
  const [balanceState, setBalanceState] = useState<"idle" | "pending" | "error" | "success">(model.sourceKey === "gift-card-02" && stress === "error" ? "error" : "idle");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const setValue = (key: string, value: string, message?: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setCommitState("idle");
    if (message) setAnnouncement(message);
  };
  const setField = (key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setCommitState("idle");
  };
  const selectedCurrency = model.currencies.find(({ id }) => id === values.currency)!;
  const selectedAmount = model.amountChoices.find(({ id }) => id === values.amount)!;
  const customAmountValid = /^\d+(?:\.\d{1,2})?$/.test(values.customAmount);
  const amountMinor = selectedAmount.kind === "custom" ? customAmountValid ? Math.round(Number(values.customAmount) * 100) : 0 : selectedAmount.minorByCurrency?.[values.currency] ?? 0;
  const formattedAmount = new Intl.NumberFormat("en", { style: "currency", currency: selectedCurrency.id }).format(amountMinor / 100);
  const customMin = model.customAmount.minMinorByCurrency[values.currency];
  const customMax = model.customAmount.maxMinorByCurrency[values.currency];

  const validate = () => {
    const next: Errors = {};
    if (selectedAmount.kind === "custom" && (!customAmountValid || amountMinor < customMin || amountMinor > customMax)) next.amount = model.sourceKey === "gift-card-01" ? interpolate(copy[model.stateKeys.validationAmountRangeKey], { min: selectedCurrency.symbol + customMin / 100, max: selectedCurrency.symbol + customMax / 100 }) : !customAmountValid ? copy[model.customAmount.errorInvalidKey] : interpolate(amountMinor < customMin ? copy[model.customAmount.errorMinKey] : copy[model.customAmount.errorMaxKey], { label: copy[selectedCurrency.labelKey] });
    if (!fields.recipientName.trim()) next.recipientName = model.sourceKey === "gift-card-01" ? copy[model.stateKeys.validationNameRequiredKey] : copy[model.stateKeys.fieldRequiredErrorKey];
    if (!fields.recipientEmail.trim()) next.recipientEmail = model.sourceKey === "gift-card-01" ? copy[model.stateKeys.validationEmailRequiredKey] : copy[model.stateKeys.fieldRequiredErrorKey];
    else if (!emailPattern.test(fields.recipientEmail)) next.recipientEmail = model.sourceKey === "gift-card-01" ? copy[model.stateKeys.validationEmailFormatKey] : copy[model.recipientFields[1].validationErrorKey!];
    if (model.sourceKey === "gift-card-01") {
      if (!fields.message.trim()) next.message = copy[model.stateKeys.validationMessageRequiredKey];
      if (values.timing === "scheduled" && !fields.date) next.date = copy[model.stateKeys.validationDateRequiredKey];
      if (values.delivery === "physical") {
        const validationKeys = { country: "validationCountryRequiredKey", city: "validationCityRequiredKey", street: "validationStreetRequiredKey", postalCode: "validationPostalRequiredKey" } as const;
        for (const key of Object.keys(validationKeys) as Array<keyof typeof validationKeys>) if (!fields[key]?.trim()) next[key] = copy[model.stateKeys[validationKeys[key]]];
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) { setCommitState("error"); setAnnouncement(model.sourceKey === "gift-card-01" ? copy[model.stateKeys.errorSummaryKey] : copy[model.stateKeys.purchaseErrorSummaryKey]); queueMicrotask(() => root.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()); return; }
    setCommitState("success");
    setAnnouncement(model.sourceKey === "gift-card-01" ? interpolate(copy[model.stateKeys.successKey], { amount: formattedAmount, delivery: copy[model.deliveryChoices.find(({ id }) => id === values.delivery)!.labelKey] }) : copy[model.stateKeys.purchaseSuccessKey]);
  };

  const heading = copy[model.intro.headingKey];
  const lede = copy[model.sourceKey === "gift-card-01" ? model.intro.ledeKey : model.intro.ledeKey];
  const purchaseLabel = copy[model.sourceKey === "gift-card-01" ? model.stateKeys.purchaseActionKey : model.stateKeys.purchaseActionKey];
  const successMessage = model.sourceKey === "gift-card-01" ? interpolate(copy[model.stateKeys.successKey], { amount: formattedAmount, delivery: copy[model.deliveryChoices.find(({ id }) => id === values.delivery)!.labelKey] }) : copy[model.stateKeys.purchaseSuccessKey];
  const compact = deviceClass === "M" || deviceClass === "TP";
  const action = <button className="xp-gift-card__purchase" type="submit" disabled={commitState === "pending"} data-commit-state={commitState} data-xp-control>{commitState === "pending" ? copy[model.sourceKey === "gift-card-01" ? model.stateKeys.pendingKey : model.stateKeys.purchasePendingKey] : commitState === "error" ? copy[model.sourceKey === "gift-card-01" ? model.stateKeys.retryActionKey : model.stateKeys.purchaseRetryActionKey] : purchaseLabel}</button>;

  const currencyChoices = <FieldGroup className="xp-gift-card__choice-group"><legend>{copy[model.sourceKey === "gift-card-01" ? model.stateKeys.currencyLegendKey : "previewAmountLabel"]}</legend><ChoiceSet label="Currency" value={values.currency} onChange={(value) => setValue("currency", value)} items={model.currencies.map((currency) => ({ value: currency.id, label: copy[currency.labelKey] }))} /></FieldGroup>;
  const amountChoices = <FieldGroup className="xp-gift-card__choice-group"><legend>{copy[model.sourceKey === "gift-card-01" ? model.stateKeys.amountLegendKey : "previewAmountLabel"]}</legend><ChoiceSet label="Amount" value={values.amount} onChange={(value) => setValue("amount", value)} items={model.amountChoices.map((choice) => ({ value: choice.id, label: choice.kind === "custom" ? copy[choice.labelKey] : interpolate(copy[choice.labelKey], { label: selectedCurrency.symbol }) }))} />{selectedAmount.kind === "custom" ? <Field id={`${model.sourceKey}-custom`} invalid={Boolean(errors.amount)} hasHelp hasError={Boolean(errors.amount)}><Field.Label>{copy[model.sourceKey === "gift-card-01" ? model.customAmount.labelKey : model.customAmount.inputLabelKey]}</Field.Label><Field.Input ref={firstInvalid} type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" value={values.customAmount} onChange={(event) => setValue("customAmount", event.currentTarget.value)} /><Field.Help>{model.sourceKey === "gift-card-01" ? interpolate(copy[model.customAmount.helpKey], { min: selectedCurrency.symbol + customMin / 100, max: selectedCurrency.symbol + customMax / 100 }) : `${selectedCurrency.symbol}${customMin / 100}–${selectedCurrency.symbol}${customMax / 100}`}</Field.Help>{errors.amount ? <Field.Error>{errors.amount}</Field.Error> : null}</Field> : null}</FieldGroup>;

  let primaryContent;
  if (model.sourceKey === "gift-card-01") {
    primaryContent = <>
      <div className="xp-gift-card__orientation"><GiftArt className="xp-gift-card__promo-art" record={model.media[0]} /><div><h1 id={`${model.sourceKey}-title`}>{heading}</h1><p>{lede}</p><a href={model.navigation.href}>{copy[model.navigation.orientationActionKey]}</a></div></div>
      <FieldGroup className="xp-gift-card__choice-group"><legend>{copy[model.stateKeys.deliveryLegendKey]}</legend><ChoiceSet label={copy[model.stateKeys.deliveryLegendKey]} value={values.delivery} onChange={(value) => setValue("delivery", value, copy[model.stateKeys.announceDeliveryKey])} items={model.deliveryChoices.map((choice) => ({ value: choice.id, label: copy[choice.labelKey], description: copy[choice.descriptionKey] }))} /></FieldGroup>
      <div className="xp-gift-card__money">{currencyChoices}{amountChoices}</div>
      <FieldGroup className="xp-gift-card__choice-group"><legend>{copy[model.stateKeys.timingLegendKey]}</legend><ChoiceSet label={copy[model.stateKeys.timingLegendKey]} value={values.timing} onChange={(value) => setValue("timing", value)} items={model.timingChoices.map((choice) => ({ value: choice.id, label: copy[choice.labelKey], description: copy[choice.descriptionKey] }))} />{values.timing === "scheduled" ? <TextField id={`${model.sourceKey}-date`} type="date" label={copy[model.timingChoices[1].scheduleDate!.labelKey]} example="" help={copy[model.timingChoices[1].scheduleDate!.helpKey]} value={fields.date} error={errors.date} onChange={(value) => setField("date", value)} /> : null}</FieldGroup>
      <div className="xp-gift-card__fields"><TextField id={`${model.sourceKey}-name`} label={copy[model.recipientFields[0].labelKey]} example={copy[model.recipientFields[0].exampleKey]} value={fields.recipientName} error={errors.recipientName} onChange={(value) => setField("recipientName", value)} /><TextField id={`${model.sourceKey}-email`} type="email" label={copy[model.recipientFields[1].labelKey]} example={copy[model.recipientFields[1].exampleKey]} help={copy[model.recipientFields[1].helpKey!]} value={fields.recipientEmail} error={errors.recipientEmail} onChange={(value) => setField("recipientEmail", value)} /></div>
      <Field id={`${model.sourceKey}-message`} invalid={Boolean(errors.message)} hasHelp hasError={Boolean(errors.message)}><Field.Label>{copy[model.recipientFields[2].labelKey]}</Field.Label><Field.Textarea maxLength={model.limits.messageMaxLength} value={fields.message} placeholder={copy[model.recipientFields[2].exampleKey]} onChange={(event) => setField("message", event.currentTarget.value)} /><Field.Help>{interpolate(copy[model.recipientFields[2].counterKey!], { remaining: model.limits.messageMaxLength - fields.message.length })}</Field.Help>{errors.message ? <Field.Error>{errors.message}</Field.Error> : null}</Field>
      {values.delivery === "physical" ? <div className="xp-gift-card__fields" data-physical-fields>{model.physicalFields.map((field) => <TextField key={field.id} id={`${model.sourceKey}-${field.id}`} label={copy[field.labelKey]} example={copy[field.exampleKey]} value={fields[field.id] ?? ""} error={errors[field.id]} onChange={(value) => setField(field.id, value)} />)}</div> : null}
    </>;
  } else {
    const design = model.designs.find(({ id }) => id === values.design)!;
    const cover = model.media.find(({ seatId }) => seatId === design.mediaId) ?? null;
    const activeTags = design.tagIds.filter((id) => !removedTags.includes(id));
    const visibleDesigns = model.designs.slice(0, showAllDesigns ? 5 : 3);
    const uploadModel = createGiftCardUploadModel(model as LiveDesignerFixture, copy, files);
    const preview = <LivePreview deviceClass={deviceClass} value={{ cover: values.coverSource === "standard" ? cover : null, coverUrl: values.coverSource === "upload" ? files[0]?.previewUrl : undefined, coverLabel: values.coverSource === "standard" ? copy[design.labelKey] : files[0]?.name ?? copy.previewFallback, recipient: fields.recipientName, amount: formattedAmount, message: fields.message }} copy={{ heading: copy.previewHeading, fallback: copy.previewFallback, coverLabel: copy.previewCoverLabel, recipientLabel: copy.previewRecipientLabel, amountLabel: copy.previewAmountLabel, messageLabel: copy.previewMessageLabel, compactLabel: copy.previewDockCompactLabel, expand: copy.expandPreview, close: copy.closePreview }} />;
    primaryContent = <>
      <div className="xp-gift-card__intro"><div><h1 id={`${model.sourceKey}-title`}>{heading}</h1><p>{lede}</p><a href={model.balanceAction.href} aria-busy={balanceState === "pending" || undefined} onClick={(event) => { event.preventDefault(); setBalanceState("pending"); queueMicrotask(() => setBalanceState("success")); }}>{balanceState === "error" ? copy[model.balanceAction.retryActionKey] : copy[model.balanceAction.labelKey]}</a>{balanceState !== "idle" ? <p role={balanceState === "error" ? "alert" : "status"}>{copy[balanceState === "pending" ? model.stateKeys.balancePendingKey : balanceState === "success" ? model.stateKeys.balanceSuccessKey : model.stateKeys.balanceErrorKey].replace("{balance}", formattedAmount)}</p> : null}</div>{preview}</div>
      <FieldGroup className="xp-gift-card__choice-group"><legend>{copy.previewCoverLabel}</legend><ChoiceSet label={copy.previewCoverLabel} value={values.coverSource} onChange={(value) => setValue("coverSource", value)} items={model.coverSources.map((choice) => ({ value: choice.id, label: copy[choice.labelKey] }))} /></FieldGroup>
      {values.coverSource === "standard" ? <section className="xp-gift-card__designs" aria-label={copy.previewCoverLabel}><div className="xp-gift-card__design-rail">{visibleDesigns.map((item, index) => { const art = model.media.find(({ seatId }) => seatId === item.mediaId)!; return <button type="button" key={item.id} aria-pressed={item.id === values.design} tabIndex={item.id === values.design ? 0 : -1} onKeyDown={(event) => { const next = rovingIndex(event, index, visibleDesigns.length); if (next !== undefined) { setValue("design", visibleDesigns[next].id); setRemovedTags([]); } }} onClick={() => { setValue("design", item.id, interpolate(copy[model.stateKeys.selectionAnnouncementKey], { label: copy[item.labelKey] })); setRemovedTags([]); }} data-xp-control><GiftArt record={art} /><strong>{copy[item.labelKey]}</strong></button>; })}</div><button type="button" onClick={() => setShowAllDesigns((current) => !current)} data-xp-control>{copy[showAllDesigns ? model.stateKeys.showLessKey : model.stateKeys.showMoreKey]}</button><ChipBar label="Selected design tags" items={activeTags.map((id) => ({ id, label: copy[model.tags.find((tag) => tag.id === id)!.labelKey], removable: true }))} removeLabel={(item) => `Remove ${item.label}`} onRemove={(id) => setRemovedTags((current) => [...current, id])} /></section> : <UploadUnit model={uploadModel} mediaMap={EMPTY_UPLOAD_MEDIA_MAP} files={files} onFilesChange={setFiles} />}
      <div className="xp-gift-card__money">{currencyChoices}{amountChoices}</div>
      <div className="xp-gift-card__fields"><TextField id={`${model.sourceKey}-name`} label={copy[model.recipientFields[0].labelKey]} example={copy[model.recipientFields[0].exampleKey]} value={fields.recipientName} error={errors.recipientName} onChange={(value) => setField("recipientName", value)} /><TextField id={`${model.sourceKey}-email`} type="email" label={copy[model.recipientFields[1].labelKey]} example={copy[model.recipientFields[1].exampleKey]} value={fields.recipientEmail} error={errors.recipientEmail} onChange={(value) => setField("recipientEmail", value)} /></div>
      <Field id={`${model.sourceKey}-message`} invalid={Boolean(errors.message)} hasHelp hasError={Boolean(errors.message)}><Field.Label>{copy[model.recipientFields[2].labelKey]}</Field.Label><Field.Textarea maxLength={model.limits.messageMaxLength} value={fields.message} placeholder={copy[model.recipientFields[2].exampleKey]} onChange={(event) => setField("message", event.currentTarget.value)} /><Field.Help>{interpolate(copy.recipientMessageCounter40, { remaining: model.limits.messageMaxLength - fields.message.length })}</Field.Help>{errors.message ? <Field.Error>{errors.message}</Field.Error> : null}</Field>
    </>;
  }

  return <section ref={root} className="xp-gift-card" data-xp-gift-card data-xp-owner="GiftCardSurface" data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-slot-band={slotBand(width)} data-form={formFor(deviceClass)} aria-labelledby={`${model.sourceKey}-title`}>
    <form onSubmit={submit} noValidate>{primaryContent}{!compact ? <div className="xp-gift-card__action">{action}</div> : <StickyActionBar placement="local" summary={<><span>{heading}</span><strong>{formattedAmount}</strong></>} primary={action} />}</form>
    {commitState === "error" ? <p className="xp-gift-card__status" role="alert">{announcement || copy[model.sourceKey === "gift-card-01" ? model.stateKeys.recoverableErrorKey : model.stateKeys.purchaseErrorKey]}</p> : null}
    {commitState === "success" ? <p className="xp-gift-card__status" role="status">{announcement || successMessage}</p> : null}
    <p className="xp-gift-card__live" aria-live="polite">{announcement}</p>
  </section>;
}
