import type { Money } from "./shopping-cart-model";

export const FOOTER_SOURCE_KEYS = [
  "footer-component-01", "footer-component-02", "footer-component-03",
  "footer-component-04", "footer-component-05", "footer-component-06",
  "footer-component-07", "footer-component-08", "footer-component-09",
] as const;
export const MEGA_FOOTER_SOURCE_KEYS = [
  "mega-footer-01", "mega-footer-02", "mega-footer-03", "mega-footer-04", "mega-footer-05",
] as const;
export const ALL_FOOTER_SOURCE_KEYS = [...FOOTER_SOURCE_KEYS, ...MEGA_FOOTER_SOURCE_KEYS] as const;

export const FOOTER_PRESETS = ["compact", "columns", "display"] as const;
export const FOOTER_SKINS = ["minimal-line", "proof-newsletter", "newsletter-grid", "cta-utility", "commerce-trust", "inset-dark", "ruled-grid", "numbered-editorial", "outline-wordmark"] as const;
export const MEGA_FOOTER_SKINS = ["mega-contact-trust", "mega-newsletter-matrix", "mega-support-panel", "mega-value-props", "mega-catalog"] as const;
export type FooterSourceKey = (typeof FOOTER_SOURCE_KEYS)[number];
export type MegaFooterSourceKey = (typeof MEGA_FOOTER_SOURCE_KEYS)[number];
export type FooterAnySourceKey = (typeof ALL_FOOTER_SOURCE_KEYS)[number];
export type FooterPreset = (typeof FOOTER_PRESETS)[number];
export type FooterSkin = (typeof FOOTER_SKINS)[number];
export type MegaFooterSkin = (typeof MEGA_FOOTER_SKINS)[number];
export type FooterAnySkin = FooterSkin | MegaFooterSkin;
export type FooterTone = "light" | "dark" | "muted";
export type FooterAction = { id: string; label: string; href: string; emphasis: "primary" | "secondary" | "peer" | "quiet"; external?: boolean; accessibleLabel?: string };
export type FooterLink = FooterAction & { badge?: string };
export type FooterGroup = { id: string; title: string; rank: number; links: FooterLink[] };
export type FooterIdentity = {
  id: string; mediaKey: string; name: string; role: "proof" | "partner" | "payment" | "destination";
  presentation: "symbol" | "wordmark" | "combination"; href?: string; accessibleLabel?: string;
};
export type FooterIdentityRow = {
  id: string; label?: string; behavior: "static-wrap" | "manual-rail" | "paused-marquee"; identities: FooterIdentity[];
};
export type FooterNewsletter = {
  id: string; label: string; placeholder: string; submitLabel: string; submittingLabel: string;
  successTitle: string; successDescription: string; error: string; announcementSubmitting: string;
  announcementSuccess: string; announcementError: string; legalNote?: string;
};
export type FooterDecoration =
  | { kind: "none" }
  | { kind: "foreground-cutout"; mediaKey: string; alt: string; compactPresentation: "chip" }
  | { kind: "outline-wordmark"; text: string; accessible: false; compactPresentation: "cropped-outline" };
export type FooterMediaAsset = { mediaKey: string; kind: "vector" | "raster"; src: string; darkSrc?: string; alt: string };

export type FooterContactItem = {
  id: string; role: "address" | "phone" | "email"; label?: string; value: string;
  iconKey: "system:location" | "system:phone" | "system:email"; href?: string;
};
export type FooterContactBlock = { id: string; title?: string; items: FooterContactItem[] };
export type FooterGroupSection = { id: string; label: string; rank: number; groupIds: string[] };
export type FooterSupportPanel = {
  id: string; accountAction: FooterLink; newsletterId: string; identityRowIds: string[]; includeSocial: true;
};
export type FooterTagCollection = {
  id: string; title: string; behavior: "inert-manual-rail"; items: Array<{ id: string; label: string }>;
};
export type FooterProductRow = { id: string; name: string; price: Money; mediaKey: string; alt: string; href?: never };
export type FooterProductCollection = { id: string; title: string; items: FooterProductRow[] };
export type ValuePropItem = {
  id: string; iconKey: "system:delivery" | "system:payment" | "system:returns";
  title: string; description: string; action?: FooterLink;
};
export type ValuePropItems =
  | [ValuePropItem, ValuePropItem]
  | [ValuePropItem, ValuePropItem, ValuePropItem]
  | [ValuePropItem, ValuePropItem, ValuePropItem, ValuePropItem];
export type ValuePropStripFixture = {
  schemaVersion: 1; module: "ValuePropStrip"; id: string; skin: "commerce-seams";
  items: ValuePropItems;
  compactBehavior: "manual-snap"; initialActiveId?: string;
};
export type MegaFooterExtension = {
  kind: "mega-footer";
  contact?: FooterContactBlock;
  groupSections: FooterGroupSection[];
  supportPanel?: FooterSupportPanel;
  valuePropStrip?: ValuePropStripFixture;
  tags?: FooterTagCollection;
  products?: FooterProductCollection;
};

export type MegaFooterStressPatch = {
  contact?: { title?: string; itemText?: Record<string, { label?: string; value?: string }> };
  groupSectionLabels?: Record<string, string>;
  supportPanel?: { accountActionLabel?: string };
  valuePropText?: Record<string, { title?: string; description?: string }>;
  tags?: { title?: string; itemLabels?: Record<string, string> };
  products?: { title?: string; itemText?: Record<string, { name?: string; alt?: string }> };
};
export type FooterStressPatch = {
  brand?: Partial<FooterFixture["brand"]>;
  invitation?: Partial<Omit<NonNullable<FooterFixture["invitation"]>, "action">> & { actionLabel?: string };
  groupTitles?: Record<string, string>;
  linkText?: Record<string, Partial<Pick<FooterLink, "label" | "badge" | "accessibleLabel">>>;
  socialLabels?: Record<string, string>;
  newsletter?: Partial<FooterNewsletter>;
  identityLabels?: Record<string, Partial<Pick<FooterIdentity, "name" | "accessibleLabel">>>;
  legal?: Partial<Pick<FooterFixture["legal"], "copyright" | "trustStatement">>;
  decorationAlt?: string;
  extension?: MegaFooterStressPatch;
};

export type FooterFixture = {
  schemaVersion: 1;
  sourceKey: FooterAnySourceKey;
  module: "Footer";
  preset: FooterPreset;
  skin: FooterAnySkin;
  tone: FooterTone;
  brand: { name: string; href?: string; logoKey: "system:brand"; blurb?: string };
  invitation?: { eyebrow?: string; title: string; description?: string; action: FooterLink };
  utilityLinks: FooterLink[];
  groups: FooterGroup[];
  social: FooterLink[];
  newsletter?: FooterNewsletter;
  identityRows: FooterIdentityRow[];
  legal: { copyright: string; copyrightHref?: string; links: FooterLink[]; trustStatement?: string };
  decoration: FooterDecoration;
  groupForm: { mobile: "none" | "single-accordion" | "numbered-open" | "open"; narrowSlot: "none" | "single-accordion" | "numbered-open" | "open" };
  initialOpenGroupId?: string;
  stress: Record<string, FooterStressPatch>;
  extension?: MegaFooterExtension;
};

export type ResolvedFooterMediaAsset = FooterMediaAsset & { identityId?: string; decoration?: true; productId?: string };
export type ResolvedFooterFixture = Omit<FooterFixture, "stress"> & {
  activeStress?: string;
  resolvedMedia: Record<string, ResolvedFooterMediaAsset>;
  initialNewsletterState: "idle" | "error" | "success";
};

type FooterGroupForm = FooterFixture["groupForm"]["mobile"];
type ExpectedFooter = {
  preset: FooterPreset; skin: FooterAnySkin; tone: FooterTone; form: FooterGroupForm;
  groups: number; links: number; utility: number; social: number; identities: number;
  newsletter: number; actions: number; media: number;
};
const EXPECTED: Record<FooterSourceKey, ExpectedFooter> = {
  "footer-component-01": { preset: "compact", skin: "minimal-line", tone: "light", form: "none", groups: 0, links: 0, utility: 4, social: 4, identities: 0, newsletter: 0, actions: 10, media: 0 },
  "footer-component-02": { preset: "columns", skin: "proof-newsletter", tone: "light", form: "single-accordion", groups: 2, links: 8, utility: 0, social: 4, identities: 6, newsletter: 1, actions: 14, media: 6 },
  "footer-component-03": { preset: "columns", skin: "newsletter-grid", tone: "light", form: "single-accordion", groups: 5, links: 30, utility: 0, social: 0, identities: 0, newsletter: 1, actions: 32, media: 0 },
  "footer-component-04": { preset: "compact", skin: "cta-utility", tone: "light", form: "none", groups: 0, links: 0, utility: 4, social: 4, identities: 0, newsletter: 0, actions: 13, media: 0 },
  "footer-component-05": { preset: "columns", skin: "commerce-trust", tone: "light", form: "single-accordion", groups: 3, links: 17, utility: 2, social: 4, identities: 7, newsletter: 0, actions: 28, media: 7 },
  "footer-component-06": { preset: "columns", skin: "inset-dark", tone: "dark", form: "single-accordion", groups: 2, links: 8, utility: 0, social: 4, identities: 8, newsletter: 0, actions: 15, media: 8 },
  "footer-component-07": { preset: "compact", skin: "ruled-grid", tone: "light", form: "none", groups: 0, links: 0, utility: 5, social: 4, identities: 0, newsletter: 0, actions: 11, media: 0 },
  "footer-component-08": { preset: "display", skin: "numbered-editorial", tone: "light", form: "numbered-open", groups: 2, links: 12, utility: 0, social: 4, identities: 0, newsletter: 1, actions: 20, media: 1 },
  "footer-component-09": { preset: "compact", skin: "outline-wordmark", tone: "muted", form: "open", groups: 2, links: 8, utility: 0, social: 2, identities: 0, newsletter: 0, actions: 12, media: 0 },
};
const MEGA_EXPECTED: Record<MegaFooterSourceKey, ExpectedFooter> = {
  "mega-footer-01": { preset: "columns", skin: "mega-contact-trust", tone: "light", form: "single-accordion", groups: 2, links: 8, utility: 0, social: 0, identities: 6, newsletter: 0, actions: 12, media: 6 },
  "mega-footer-02": { preset: "columns", skin: "mega-newsletter-matrix", tone: "light", form: "single-accordion", groups: 12, links: 61, utility: 0, social: 4, identities: 4, newsletter: 1, actions: 67, media: 4 },
  "mega-footer-03": { preset: "columns", skin: "mega-support-panel", tone: "light", form: "single-accordion", groups: 9, links: 46, utility: 4, social: 4, identities: 2, newsletter: 1, actions: 59, media: 2 },
  "mega-footer-04": { preset: "columns", skin: "mega-value-props", tone: "light", form: "single-accordion", groups: 2, links: 8, utility: 0, social: 0, identities: 6, newsletter: 0, actions: 12, media: 6 },
  "mega-footer-05": { preset: "compact", skin: "mega-catalog", tone: "light", form: "open", groups: 1, links: 5, utility: 0, social: 0, identities: 0, newsletter: 0, actions: 6, media: 2 },
};
const EXPECTED_IDENTITY_ROWS: Record<FooterAnySourceKey, FooterIdentityRow["behavior"][]> = {
  "footer-component-01": [], "footer-component-02": ["static-wrap"], "footer-component-03": [],
  "footer-component-04": [], "footer-component-05": ["manual-rail", "static-wrap"],
  "footer-component-06": ["paused-marquee", "static-wrap"], "footer-component-07": [],
  "footer-component-08": [], "footer-component-09": [],
  "mega-footer-01": ["static-wrap", "static-wrap"], "mega-footer-02": ["static-wrap"],
  "mega-footer-03": ["static-wrap"], "mega-footer-04": ["static-wrap", "static-wrap"], "mega-footer-05": [],
};
const MEGA_GROUP_VECTORS: Record<MegaFooterSourceKey, number[]> = {
  "mega-footer-01": [4, 4],
  "mega-footer-02": [5, 6, 6, 6, 6, 5, 5, 5, 5, 5, 3, 4],
  "mega-footer-03": [6, 6, 6, 5, 5, 5, 5, 5, 3],
  "mega-footer-04": [4, 4],
  "mega-footer-05": [5],
};

const text = (value: unknown, label: string, sourceKey: string, allowEmpty = false) => {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const localHref = (value: string) => /^(\/(?!\/)|mailto:|tel:|https:\/\/)/.test(value) && !/^javascript:/i.test(value);
const localMediaPath = (value: string) => /^\/(?!\/)/.test(value);
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const isMegaSource = (sourceKey: FooterAnySourceKey): sourceKey is MegaFooterSourceKey => (MEGA_FOOTER_SOURCE_KEYS as readonly string[]).includes(sourceKey);

function applyExtensionStress(extension: MegaFooterExtension | undefined, patch: MegaFooterStressPatch | undefined) {
  if (!extension || !patch) return extension;
  return {
    ...extension,
    contact: extension.contact ? {
      ...extension.contact,
      ...(patch.contact?.title ? { title: patch.contact.title } : {}),
      items: extension.contact.items.map((item) => ({ ...item, ...(patch.contact?.itemText?.[item.id] ?? {}) })),
    } : undefined,
    groupSections: extension.groupSections.map((section) => ({ ...section, label: patch.groupSectionLabels?.[section.id] ?? section.label })),
    supportPanel: extension.supportPanel ? {
      ...extension.supportPanel,
      accountAction: { ...extension.supportPanel.accountAction, ...(patch.supportPanel?.accountActionLabel ? { label: patch.supportPanel.accountActionLabel } : {}) },
    } : undefined,
    valuePropStrip: extension.valuePropStrip ? {
      ...extension.valuePropStrip,
      items: extension.valuePropStrip.items.map((item) => ({ ...item, ...(patch.valuePropText?.[item.id] ?? {}) })) as ValuePropStripFixture["items"],
    } : undefined,
    tags: extension.tags ? {
      ...extension.tags,
      ...(patch.tags?.title ? { title: patch.tags.title } : {}),
      items: extension.tags.items.map((item) => ({ ...item, label: patch.tags?.itemLabels?.[item.id] ?? item.label })),
    } : undefined,
    products: extension.products ? {
      ...extension.products,
      ...(patch.products?.title ? { title: patch.products.title } : {}),
      items: extension.products.items.map((item) => ({ ...item, ...(patch.products?.itemText?.[item.id] ?? {}) })),
    } : undefined,
  } satisfies MegaFooterExtension;
}

function applyStress(fixture: FooterFixture, stress?: string): FooterFixture {
  if (!stress) return fixture;
  const patch = fixture.stress[stress];
  if (!patch) throw new Error(`${fixture.sourceKey} does not declare stress ${stress}.`);
  const replaceLink = (link: FooterLink) => ({ ...link, ...(patch.linkText?.[link.id] ?? {}), ...(patch.socialLabels?.[link.id] ? { label: patch.socialLabels[link.id] } : {}) });
  const invitation = fixture.invitation ? { ...fixture.invitation, ...patch.invitation, action: { ...fixture.invitation.action, ...(patch.invitation?.actionLabel ? { label: patch.invitation.actionLabel } : {}) } } : undefined;
  if (invitation && "actionLabel" in invitation) delete (invitation as typeof invitation & { actionLabel?: string }).actionLabel;
  return {
    ...fixture,
    brand: { ...fixture.brand, ...patch.brand },
    invitation,
    utilityLinks: fixture.utilityLinks.map(replaceLink),
    groups: fixture.groups.map((group) => ({ ...group, title: patch.groupTitles?.[group.id] ?? group.title, links: group.links.map(replaceLink) })),
    social: fixture.social.map(replaceLink),
    newsletter: fixture.newsletter ? { ...fixture.newsletter, ...patch.newsletter } : undefined,
    identityRows: fixture.identityRows.map((row) => ({ ...row, identities: row.identities.map((identity) => ({ ...identity, ...(patch.identityLabels?.[identity.id] ?? {}) })) })),
    legal: { ...fixture.legal, ...patch.legal, links: fixture.legal.links.map(replaceLink) },
    decoration: fixture.decoration.kind === "foreground-cutout" && patch.decorationAlt ? { ...fixture.decoration, alt: patch.decorationAlt } : fixture.decoration,
    extension: applyExtensionStress(fixture.extension, patch.extension),
  };
}

function countActions(fixture: FooterFixture) {
  return (fixture.brand.href ? 1 : 0) + (fixture.invitation ? 1 : 0) + fixture.utilityLinks.length
    + fixture.groups.flatMap((group) => group.links).length + fixture.social.length
    + fixture.identityRows.flatMap((row) => row.identities).filter((identity) => identity.href).length
    + fixture.legal.links.length + (fixture.legal.copyrightHref ? 1 : 0)
    + (fixture.extension?.supportPanel ? 1 : 0);
}

function validateMegaExtension(fixture: FooterFixture & { sourceKey: MegaFooterSourceKey }, mediaKeys: string[]) {
  const sourceKey = fixture.sourceKey;
  const extension = fixture.extension;
  if (!extension || extension.kind !== "mega-footer") throw new Error(`${sourceKey} requires one typed mega-footer extension.`);
  if (fixture.groups.map(({ links }) => links.length).join("/") !== MEGA_GROUP_VECTORS[sourceKey].join("/")) throw new Error(`${sourceKey} violates its exact group-link vector.`);
  const sectionGroupIds = extension.groupSections.flatMap(({ groupIds }) => groupIds);
  if (sourceKey === "mega-footer-02" || sourceKey === "mega-footer-03") {
    if (extension.groupSections.length !== 3 || sectionGroupIds.length !== fixture.groups.length || fixture.groups.some(({ id }) => sectionGroupIds.filter((value) => value === id).length !== 1)) throw new Error(`${sourceKey} requires three complete non-overlapping group sections.`);
    unique(extension.groupSections.map(({ rank }) => String(rank)), "group-section ranks", sourceKey);
  } else if (extension.groupSections.length !== 0) throw new Error(`${sourceKey} must not invent group sections.`);
  for (const section of extension.groupSections) {
    text(section.label, `group section ${section.id}`, sourceKey);
    if (section.groupIds.some((id) => !fixture.groups.some((group) => group.id === id))) throw new Error(`${sourceKey} group section ${section.id} has an unresolved group ref.`);
  }
  const expectedContactRoles = sourceKey === "mega-footer-01" || sourceKey === "mega-footer-04" ? "address/phone/email" : sourceKey === "mega-footer-05" ? "address/phone" : "";
  const contactRoles = extension.contact?.items.map(({ role }) => role).join("/") ?? "";
  if (contactRoles !== expectedContactRoles) throw new Error(`${sourceKey} violates exact contact roles.`);
  for (const item of extension.contact?.items ?? []) {
    text(item.value, `contact ${item.id}`, sourceKey);
    if (item.href && !localHref(item.href)) throw new Error(`${sourceKey} contact ${item.id} requires a safe href.`);
  }
  if (sourceKey === "mega-footer-03") {
    const panel = extension.supportPanel;
    if (!panel || !fixture.newsletter || panel.newsletterId !== fixture.newsletter.id || !panel.includeSocial || fixture.social.length !== 4 || panel.identityRowIds.length !== 1 || !fixture.identityRows.some(({ id }) => id === panel.identityRowIds[0]) || !localHref(panel.accountAction.href)) throw new Error(`${sourceKey} support panel refs do not resolve to the single newsletter/social/app/account owners.`);
  } else if (extension.supportPanel) throw new Error(`${sourceKey} must not own a support panel.`);
  if (sourceKey === "mega-footer-04") {
    const strip = extension.valuePropStrip;
    if (!strip || strip.items.length !== 3 || strip.items.map(({ iconKey }) => iconKey).join("/") !== "system:delivery/system:payment/system:returns" || strip.initialActiveId && !strip.items.some(({ id }) => id === strip.initialActiveId)) throw new Error(`${sourceKey} requires the exact three-item ValuePropStrip.`);
    strip.items.forEach((item) => { text(item.title, `value proposition ${item.id}`, sourceKey); text(item.description, `value proposition ${item.id}`, sourceKey); });
  } else if (extension.valuePropStrip) throw new Error(`${sourceKey} must not own a value-proposition strip.`);
  if (sourceKey === "mega-footer-05") {
    if (!extension.tags || extension.tags.items.length !== 10 || extension.tags.behavior !== "inert-manual-rail") throw new Error(`${sourceKey} requires ten inert tags.`);
    if (!extension.products || extension.products.items.length !== 2) throw new Error(`${sourceKey} requires two inert product rows.`);
    const currencies = new Set(extension.products.items.map(({ price }) => price.currency));
    for (const product of extension.products.items) {
      if ("href" in product) throw new Error(`${sourceKey} product ${product.id} must remain inert.`);
      text(product.name, `product ${product.id}`, sourceKey); text(product.alt, `product ${product.id} alt`, sourceKey);
      if (!Number.isInteger(product.price.amountMinor) || product.price.amountMinor < 0 || !product.price.currency.trim()) throw new Error(`${sourceKey} product ${product.id} requires typed non-negative Money.`);
    }
    if (currencies.size !== 1 || fixture.brand.href) throw new Error(`${sourceKey} requires one product currency and an inert brand.`);
  } else if (extension.tags || extension.products) throw new Error(`${sourceKey} must not own tags or products.`);
  if (sourceKey !== "mega-footer-05" && !fixture.brand.href) throw new Error(`${sourceKey} requires a linked brand.`);
  if (new Set(mediaKeys).size !== mediaKeys.length) throw new Error(`${sourceKey} repeats media seats.`);
}

export function resolveFooterFixture(fixture: FooterFixture, stress?: string, media: FooterMediaAsset[] = []): ResolvedFooterFixture {
  if (!(ALL_FOOTER_SOURCE_KEYS as readonly string[]).includes(fixture.sourceKey)) throw new Error(`Unknown footer source ${fixture.sourceKey}.`);
  const resolved = applyStress(fixture, stress);
  const sourceKey = resolved.sourceKey;
  const mega = isMegaSource(sourceKey);
  const expected = mega ? MEGA_EXPECTED[sourceKey] : EXPECTED[sourceKey];
  const identities = resolved.identityRows.flatMap((row) => row.identities);
  const products = resolved.extension?.products?.items ?? [];
  const mediaKeys = [...identities.map(({ mediaKey }) => mediaKey), ...(resolved.decoration.kind === "foreground-cutout" ? [resolved.decoration.mediaKey] : []), ...products.map(({ mediaKey }) => mediaKey)];
  if (resolved.module !== "Footer" || resolved.schemaVersion !== 1 || resolved.preset !== expected.preset || resolved.skin !== expected.skin || resolved.tone !== expected.tone || resolved.groupForm.mobile !== expected.form || resolved.groupForm.narrowSlot !== expected.form) throw new Error(`${sourceKey} has source/preset/skin/tone/form drift.`);
  if (resolved.groups.length > 12 || resolved.groups.some((group) => group.links.length < 1 || group.links.length > 10)) throw new Error(`${sourceKey} violates the 0..12 group seam or 1..10 link seam.`);
  const counts = [resolved.groups.length, resolved.groups.flatMap(({ links }) => links).length, resolved.utilityLinks.length, resolved.social.length, identities.length, resolved.newsletter ? 1 : 0, countActions(resolved), mediaKeys.length];
  const target = [expected.groups, expected.links, expected.utility, expected.social, expected.identities, expected.newsletter, expected.actions, expected.media];
  if (counts.some((count, index) => count !== target[index])) throw new Error(`${sourceKey} violates its exact source inventory (${counts.join("/")} != ${target.join("/")}).`);
  if (resolved.identityRows.map(({ behavior }) => behavior).join("/") !== EXPECTED_IDENTITY_ROWS[sourceKey].join("/")) throw new Error(`${sourceKey} violates exact identity-row behavior.`);
  if (resolved.initialOpenGroupId && !resolved.groups.some(({ id }) => id === resolved.initialOpenGroupId)) throw new Error(`${sourceKey} initial open group must resolve.`);
  if (resolved.groupForm.mobile === "single-accordion" && resolved.groups.length < 2) throw new Error(`${sourceKey} single accordion requires at least two groups.`);
  if (mega) validateMegaExtension(resolved as FooterFixture & { sourceKey: MegaFooterSourceKey }, mediaKeys);
  else if (resolved.extension) throw new Error(`${sourceKey} base footer must not own a mega extension.`);

  text(resolved.brand.name, "brand name", sourceKey);
  const links: FooterLink[] = [
    ...(resolved.brand.href ? [{ id: `${sourceKey}-brand`, label: resolved.brand.name, href: resolved.brand.href, emphasis: "secondary" as const }] : []),
    ...(resolved.invitation ? [resolved.invitation.action] : []), ...resolved.utilityLinks,
    ...resolved.groups.flatMap(({ links }) => links), ...resolved.social, ...resolved.legal.links,
    ...(resolved.legal.copyrightHref ? [{ id: `${sourceKey}-copyright`, label: resolved.legal.copyright, href: resolved.legal.copyrightHref, emphasis: "secondary" as const }] : []),
    ...(resolved.extension?.supportPanel ? [resolved.extension.supportPanel.accountAction] : []),
  ];
  const extensionIds = [
    ...(resolved.extension?.contact ? [resolved.extension.contact.id, ...resolved.extension.contact.items.map(({ id }) => id)] : []),
    ...(resolved.extension?.groupSections.map(({ id }) => id) ?? []),
    ...(resolved.extension?.supportPanel ? [resolved.extension.supportPanel.id] : []),
    ...(resolved.extension?.valuePropStrip ? [resolved.extension.valuePropStrip.id, ...resolved.extension.valuePropStrip.items.map(({ id }) => id)] : []),
    ...(resolved.extension?.tags ? [resolved.extension.tags.id, ...resolved.extension.tags.items.map(({ id }) => id)] : []),
    ...(resolved.extension?.products ? [resolved.extension.products.id, ...resolved.extension.products.items.map(({ id }) => id)] : []),
  ];
  unique([...resolved.groups.map(({ id }) => id), ...resolved.identityRows.map(({ id }) => id), ...links.map(({ id }) => id), ...identities.map(({ id }) => id), ...extensionIds], "semantic IDs", sourceKey);
  for (const link of links) { text(link.label, `action ${link.id} label`, sourceKey, link.id.endsWith("-copyright")); if (!localHref(link.href)) throw new Error(`${sourceKey} action ${link.id} requires a safe local or explicit destination href.`); }
  for (const group of resolved.groups) text(group.title, `group ${group.id} title`, sourceKey);
  for (const identity of identities) {
    text(identity.name, `identity ${identity.id} name`, sourceKey);
    if (identity.href && !localHref(identity.href)) throw new Error(`${sourceKey} identity ${identity.id} requires a safe destination href.`);
    const shouldLink = mega ? identity.role === "destination" : (sourceKey === "footer-component-05" && identity.role === "partner") || (sourceKey === "footer-component-06" && identity.role === "destination");
    if (Boolean(identity.href) !== shouldLink) throw new Error(`${sourceKey} identity ${identity.id} violates exact destination ownership.`);
  }
  unique(mediaKeys, "media seats", sourceKey); unique(media.map(({ mediaKey }) => mediaKey), "media assets", sourceKey);
  const resolvedMedia: Record<string, ResolvedFooterMediaAsset> = {};
  for (const key of mediaKeys) {
    const asset = media.find(({ mediaKey }) => mediaKey === key);
    if (!asset) throw new Error(`${sourceKey} cannot resolve local media asset ${key}.`);
    if (!localMediaPath(asset.src) || (asset.darkSrc && !localMediaPath(asset.darkSrc))) throw new Error(`${sourceKey} media ${key} requires local public paths.`);
    const identity = identities.find(({ mediaKey }) => mediaKey === key);
    const product = products.find(({ mediaKey }) => mediaKey === key);
    if (identity && (asset.kind !== "vector" || !asset.darkSrc)) throw new Error(`${sourceKey} identity ${identity.id} requires light and dark vector variants.`);
    if (product && asset.kind !== "raster") throw new Error(`${sourceKey} product ${product.id} requires raster media.`);
    if (!identity && !product && asset.kind !== "raster") throw new Error(`${sourceKey} foreground decoration requires one raster asset.`);
    resolvedMedia[key] = { ...asset, ...(identity ? { identityId: identity.id } : product ? { productId: product.id } : { decoration: true }) };
  }
  const { stress: _stress, ...withoutStress } = resolved;
  return { ...withoutStress, resolvedMedia, activeStress: stress, initialNewsletterState: stress === "newsletterError" ? "error" : stress === "newsletterSuccess" ? "success" : "idle" };
}
