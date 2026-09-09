"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { DisclosureGroup, Field, useDeviceClass } from "@xp/primitives";
import type {
  FooterAction, FooterContactBlock, FooterGroup, FooterGroupSection, FooterIdentity,
  FooterIdentityRow, FooterLink, FooterProductCollection, FooterTagCollection, ResolvedFooterFixture,
} from "./footer-model";
import { ValuePropStrip } from "./value-prop-strip";

export type FooterProperties = { model: ResolvedFooterFixture; className?: string };

function ActionLink({ action, className }: { action: FooterAction & { badge?: string }; className?: string }) {
  return <a className={className} href={action.href} aria-label={action.accessibleLabel} target={action.external ? "_blank" : undefined} rel={action.external ? "noreferrer" : undefined} data-action-id={action.id} data-emphasis={action.emphasis} data-xp-control><span>{action.label}</span>{action.badge ? <small>{action.badge}</small> : null}</a>;
}

function LinkList({ links }: { links: FooterLink[] }) {
  return <ul className="xp-footer__link-list">{links.map((link) => <li key={link.id}><ActionLink action={link} /></li>)}</ul>;
}

function OpenGroups({ groups, numbered = false }: { groups: FooterGroup[]; numbered?: boolean }) {
  return <div className="xp-footer__groups" data-footer-groups={numbered ? "numbered-open" : "open"}>{groups.map((group, index) => <section className="xp-footer__group" data-footer-group-id={group.id} key={group.id}><h3>{numbered ? <span className="xp-footer__group-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span> : null}{group.title}</h3><LinkList links={group.links} /></section>)}</div>;
}

function AccordionGroups({ groups, openIds, onOpenChange, label = "Footer navigation" }: { groups: FooterGroup[]; openIds: string[]; onOpenChange: (ids: string[]) => void; label?: string }) {
  return <DisclosureGroup className="xp-footer__accordion" label={label} wallBehavior="interactive" multiple={false} openIds={openIds} onOpenChange={onOpenChange} items={groups.map((group) => ({ id: group.id, title: group.title, content: <LinkList links={group.links} /> }))} />;
}

function SectionedGroups({ groups, sections, openIds, onOpenChange }: { groups: FooterGroup[]; sections: FooterGroupSection[]; openIds: string[]; onOpenChange: (ids: string[]) => void }) {
  const byId = new Map(groups.map((group) => [group.id, group]));
  return <div className="xp-footer__group-sections" data-footer-groups="sectioned-accordion">{[...sections].sort((a, b) => a.rank - b.rank).map((section) => <section className="xp-footer__group-section" data-group-section-id={section.id} key={section.id}><h2>{section.label}</h2><AccordionGroups label={section.label} groups={section.groupIds.map((id) => byId.get(id)).filter((group): group is FooterGroup => Boolean(group))} openIds={openIds} onOpenChange={onOpenChange} /></section>)}</div>;
}

function MediaPicture({ asset, alt, seat, forceDark = false }: { asset: ResolvedFooterFixture["resolvedMedia"][string]; alt: string; seat: string; forceDark?: boolean }) {
  return <picture data-footer-media-key={asset.mediaKey} data-media-seat-id={seat}>{asset.darkSrc ? <source media="(prefers-color-scheme: dark)" srcSet={asset.darkSrc} /> : null}<img src={forceDark && asset.darkSrc ? asset.darkSrc : asset.src} alt={alt} loading="lazy" decoding="async" /></picture>;
}

function IdentityMark({ identity, model }: { identity: FooterIdentity; model: ResolvedFooterFixture }) {
  const asset = model.resolvedMedia[identity.mediaKey];
  const mark = <MediaPicture asset={asset} alt="" seat={identity.id} forceDark={model.tone === "dark"} />;
  return identity.href ? <a className="xp-footer__identity" href={identity.href} aria-label={identity.accessibleLabel ?? identity.name} data-identity-id={identity.id} data-role={identity.role} data-xp-control>{mark}<span>{identity.name}</span></a> : <span className="xp-footer__identity" data-identity-id={identity.id} data-role={identity.role}>{mark}<span>{identity.name}</span></span>;
}

function IdentitySet({ row, model }: { row: FooterIdentityRow; model: ResolvedFooterFixture }) {
  return <div className="xp-footer__identity-set">{row.identities.map((identity) => <IdentityMark identity={identity} model={model} key={identity.id} />)}</div>;
}

function ManualIdentityRail({ row, model }: { row: FooterIdentityRow; model: ResolvedFooterFixture }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [overflowing, setOverflowing] = useState(false);
  const sync = () => { const node = viewport.current; if (!node) return; setOverflowing(node.scrollWidth > node.clientWidth + 1); setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 }); };
  useEffect(() => { sync(); const node = viewport.current; if (!node) return; const observer = new ResizeObserver(sync); observer.observe(node); return () => observer.disconnect(); }, []);
  const move = (direction: -1 | 1) => viewport.current?.scrollBy({ left: direction * viewport.current.clientWidth * .8, behavior: "smooth" });
  return <div className="xp-footer__manual-rail">{overflowing ? <div className="xp-footer__rail-controls"><button type="button" aria-label={`Previous ${row.label ?? "identities"}`} disabled={edges.start} onClick={() => move(-1)} data-xp-control>←</button><button type="button" aria-label={`Next ${row.label ?? "identities"}`} disabled={edges.end} onClick={() => move(1)} data-xp-control>→</button></div> : null}<div className="xp-footer__rail-viewport" ref={viewport} onScroll={sync} data-xp-scroll><IdentitySet row={row} model={model} /></div></div>;
}

function MotionIdentityRail({ row, model }: { row: FooterIdentityRow; model: ResolvedFooterFixture }) {
  const [paused, setPaused] = useState(true);
  useEffect(() => setPaused(true), [model.sourceKey, model.activeStress, row.id]);
  return <div className="xp-footer__motion-rail" data-paused={paused ? "true" : "false"} data-xp-primitive="marquee" aria-label={row.label ?? "Identity marks"}><div className="xp-footer__motion-viewport xp-footer__rail-viewport" data-xp-scroll><div className="xp-footer__motion-track"><IdentitySet row={row} model={model} /></div></div><button className="xp-footer__motion-toggle" type="button" onClick={() => setPaused((value) => !value)} data-xp-control>{paused ? "Resume identity marks" : "Pause identity marks"}</button></div>;
}

function IdentityRows({ model, rows = model.identityRows }: { model: ResolvedFooterFixture; rows?: FooterIdentityRow[] }) {
  return <div className="xp-footer__identity-rows">{rows.map((row) => <section className="xp-footer__identity-row" data-identity-behavior={row.behavior} key={row.id}>{row.label ? <h3>{row.label}</h3> : null}{row.behavior === "manual-rail" ? <ManualIdentityRail row={row} model={model} /> : row.behavior === "paused-marquee" ? <MotionIdentityRail row={row} model={model} /> : <IdentitySet row={row} model={model} />}</section>)}</div>;
}

function Newsletter({ model }: { model: ResolvedFooterFixture }) {
  const newsletter = model.newsletter;
  const [state, setState] = useState<"idle" | "submitting" | "error" | "success">(model.initialNewsletterState);
  const [email, setEmail] = useState("");
  useEffect(() => { setState(model.initialNewsletterState); setEmail(""); }, [model.sourceKey, model.activeStress, model.initialNewsletterState]);
  if (!newsletter) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) { const input = event.currentTarget.elements.namedItem("footer-email") as HTMLInputElement | null; setState("error"); requestAnimationFrame(() => input?.focus()); return; } setState("submitting"); window.setTimeout(() => setState("success"), 350); };
  return <section className="xp-footer__newsletter" data-newsletter-state={state}>{state === "success" ? <div className="xp-footer__newsletter-success"><h3>{newsletter.successTitle}</h3><p>{newsletter.successDescription}</p><p className="xp-footer__sr" role="status" aria-live="polite">{newsletter.announcementSuccess}</p></div> : <form onSubmit={submit} noValidate><Field id={`${newsletter.id}-email`} invalid={state === "error"} hasError={state === "error"} hasHelp={Boolean(newsletter.legalNote)}><Field.Label>{newsletter.label}</Field.Label><div className="xp-footer__newsletter-controls"><Field.Input name="footer-email" type="email" value={email} onChange={(event) => { setEmail(event.currentTarget.value); if (state === "error") setState("idle"); }} placeholder={newsletter.placeholder} inputMode="email" enterKeyHint="send" autoComplete="email" disabled={state === "submitting"} /><button type="submit" disabled={state === "submitting"} data-xp-control>{state === "submitting" ? newsletter.submittingLabel : newsletter.submitLabel}</button></div>{state === "error" ? <Field.Error aria-label={newsletter.announcementError}>{newsletter.error}</Field.Error> : null}{newsletter.legalNote ? <Field.Help>{newsletter.legalNote}</Field.Help> : null}</Field>{state === "submitting" ? <p className="xp-footer__sr" role="status" aria-live="polite">{newsletter.announcementSubmitting}</p> : null}</form>}</section>;
}

function Invitation({ model }: { model: ResolvedFooterFixture }) {
  const invitation = model.invitation;
  return invitation ? <section className="xp-footer__invitation">{invitation.eyebrow ? <p>{invitation.eyebrow}</p> : null}<h2>{invitation.title}</h2>{invitation.description ? <p>{invitation.description}</p> : null}<ActionLink action={invitation.action} className="xp-footer__primary-action" /></section> : null;
}

function ContactIcon({ role }: { role: FooterContactBlock["items"][number]["role"] }) {
  if (role === "address") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (role === "phone") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h4l1 5-2.5 1.5a15 15 0 0 0 6 6L16 13l5 1v4c0 1.7-1.3 3-3 3C9.7 21 3 14.3 3 6c0-1.7 1.3-3 3-3Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

function ContactBlock({ contact }: { contact: FooterContactBlock }) {
  return <section className="xp-footer__contact" data-contact-id={contact.id}>{contact.title ? <h2>{contact.title}</h2> : null}<dl>{contact.items.map((item) => <div key={item.id} data-contact-item-id={item.id} data-contact-role={item.role}><span className="xp-footer__contact-icon"><ContactIcon role={item.role} /></span><dt>{item.label}</dt><dd>{item.href ? <a href={item.href} data-xp-control>{item.value}</a> : item.value}</dd></div>)}</dl></section>;
}

function SupportPanel({ model }: { model: ResolvedFooterFixture }) {
  const panel = model.extension?.supportPanel;
  if (!panel) return null;
  const rows = panel.identityRowIds.map((id) => model.identityRows.find((row) => row.id === id)).filter((row): row is FooterIdentityRow => Boolean(row));
  return <aside className="xp-footer__support-panel" data-support-panel-id={panel.id}><ActionLink action={panel.accountAction} className="xp-footer__account-action" /><Newsletter model={model} /><IdentityRows model={model} rows={rows} />{panel.includeSocial ? <nav className="xp-footer__social" aria-label="Social"><LinkList links={model.social} /></nav> : null}</aside>;
}

function TagRail({ tags }: { tags: FooterTagCollection }) {
  const viewport = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); viewport.current?.scrollBy({ left: (event.key === "ArrowRight" ? 1 : -1) * viewport.current.clientWidth * .6, behavior: "smooth" }); };
  return <section className="xp-footer__tags"><h2>{tags.title}</h2><div className="xp-footer__tag-viewport" ref={viewport} tabIndex={0} aria-label={tags.title} onKeyDown={onKeyDown} data-xp-scroll><ul>{tags.items.map((item) => <li key={item.id} data-tag-id={item.id}>{item.label}</li>)}</ul></div></section>;
}

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountMinor / 100);
}

function ProductRows({ products, model }: { products: FooterProductCollection; model: ResolvedFooterFixture }) {
  return <section className="xp-footer__products"><h2>{products.title}</h2><div>{products.items.map((product) => <article key={product.id} data-product-id={product.id}><MediaPicture asset={model.resolvedMedia[product.mediaKey]} alt={product.alt} seat={product.id} /><span><strong>{product.name}</strong><span>{formatMoney(product.price.amountMinor, product.price.currency)} <small>{product.price.currency}</small></span></span></article>)}</div></section>;
}

function Decoration({ model }: { model: ResolvedFooterFixture }) {
  if (model.decoration.kind === "none") return null;
  if (model.decoration.kind === "outline-wordmark") return <div className="xp-footer__outline-wordmark" aria-hidden="true">{model.decoration.text}</div>;
  return <div className="xp-footer__decoration" data-compact-presentation={model.decoration.compactPresentation}><MediaPicture asset={model.resolvedMedia[model.decoration.mediaKey]} alt={model.decoration.alt} seat="footer-decoration" /></div>;
}

function Brand({ model }: { model: ResolvedFooterFixture }) {
  const initials = model.brand.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const content = <><span className="xp-footer__brand-mark" aria-hidden="true">{initials}</span><span>{model.brand.name}</span></>;
  return <div className="xp-footer__brand">{model.brand.href ? <a href={model.brand.href} data-action-id={`${model.sourceKey}-brand`} data-xp-control>{content}</a> : <div className="xp-footer__brand-static">{content}</div>}{model.brand.blurb ? <p>{model.brand.blurb}</p> : null}</div>;
}

export function Footer({ model, className }: FooterProperties) {
  const deviceClass = useDeviceClass();
  const root = useRef<HTMLElement>(null);
  const [slotWidth, setSlotWidth] = useState<number>();
  const initialOpen = () => model.sourceKey.startsWith("mega-footer-") ? [] : model.initialOpenGroupId ? [model.initialOpenGroupId] : [];
  const [openIds, setOpenIds] = useState<string[]>(initialOpen);
  useEffect(() => { const node = root.current; if (!node) return; const measure = () => setSlotWidth(node.getBoundingClientRect().width); measure(); const observer = new ResizeObserver(measure); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => { setOpenIds(initialOpen()); }, [model.sourceKey, model.initialOpenGroupId]);
  const narrow = deviceClass === "M" || (slotWidth !== undefined && slotWidth < 560);
  const sectioned = Boolean(model.extension?.groupSections.length) && !narrow && (deviceClass === "TP" || (slotWidth !== undefined && slotWidth < 720));
  const declaredForm = deviceClass === "M" ? model.groupForm.mobile : narrow ? model.groupForm.narrowSlot : "open";
  const form = model.preset === "display" ? "numbered-open" : sectioned ? "sectioned-accordion" : declaredForm;
  let groups: ReactNode = null;
  if (model.groups.length) groups = form === "single-accordion" ? <AccordionGroups groups={model.groups} openIds={openIds} onOpenChange={setOpenIds} /> : form === "sectioned-accordion" ? <SectionedGroups groups={model.groups} sections={model.extension?.groupSections ?? []} openIds={openIds} onOpenChange={setOpenIds} /> : <OpenGroups groups={model.groups} numbered={form === "numbered-open"} />;
  const supportOwned = Boolean(model.extension?.supportPanel);
  const contactAppsOwned = model.sourceKey === "mega-footer-01" || model.sourceKey === "mega-footer-04";
  const mainIdentityRows = contactAppsOwned ? model.identityRows.slice(0, 1) : [];
  const trailingIdentityRows = contactAppsOwned ? model.identityRows.slice(1) : model.identityRows;
  return <footer ref={root} className={["xp-footer", className].filter(Boolean).join(" ")} data-xp-block="footer" data-xp-footer-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-skin={model.skin} data-tone={model.tone} data-device-class={deviceClass} data-footer-form={form} data-slot-narrow={narrow ? "true" : "false"}>
    <div className="xp-footer__inner">
      <Invitation model={model} />
      {model.extension?.valuePropStrip ? <ValuePropStrip fixture={model.extension.valuePropStrip} /> : null}
      <div className="xp-footer__main"><Brand model={model} />{!supportOwned ? <Newsletter model={model} /> : null}{model.extension?.contact ? <ContactBlock contact={model.extension.contact} /> : null}{groups}{mainIdentityRows.length ? <IdentityRows model={model} rows={mainIdentityRows} /> : null}{supportOwned ? <SupportPanel model={model} /> : null}</div>
      {model.utilityLinks.length ? <nav className="xp-footer__utility" aria-label="Utility"><LinkList links={model.utilityLinks} /></nav> : null}
      {model.extension?.tags ? <TagRail tags={model.extension.tags} /> : null}
      {model.extension?.products ? <ProductRows products={model.extension.products} model={model} /> : null}
      {!supportOwned && trailingIdentityRows.length ? <IdentityRows model={model} rows={trailingIdentityRows} /> : null}
      <div className="xp-footer__lower">{model.social.length && !supportOwned ? <nav className="xp-footer__social" aria-label="Social"><LinkList links={model.social} /></nav> : null}<div className="xp-footer__legal">{model.legal.copyright ? model.legal.copyrightHref ? <a href={model.legal.copyrightHref} data-action-id={`${model.sourceKey}-copyright`} data-xp-control>{model.legal.copyright}</a> : <span>{model.legal.copyright}</span> : null}{model.legal.links.length ? <LinkList links={model.legal.links} /> : null}{model.legal.trustStatement ? <p>{model.legal.trustStatement}</p> : null}</div></div>
      <Decoration model={model} />
    </div>
  </footer>;
}
