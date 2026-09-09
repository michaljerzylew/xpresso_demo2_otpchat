export const DECISION_BAND_PRESETS = [
  "store-download-card",
  "email-inline",
  "dramatic-stage",
  "split-ui-proof",
  "email-seam",
  "community-proof",
  "benefit-photo",
  "app-mock-download",
  "collage-trial",
  "docs-strip",
  "tagged-process",
  "photo-newsletter",
  "stats-panel",
  "layered-photo",
] as const;

export type DecisionBandPreset = (typeof DECISION_BAND_PRESETS)[number];

export type DecisionAction = {
  id: string;
  label: string;
  kind: "navigate" | "submit" | "store-destination";
  emphasis: "primary" | "secondary" | "peer";
  href?: string;
  accessibleLabel?: string;
  iconKey?: string;
};

export type DecisionEmailCapture = {
  id: string;
  label: string;
  placeholder?: string;
  required: true;
  inputMode: "email";
  autoComplete: "email";
  enterKeyHint: "send";
  submitActionId: string;
  validation: {
    empty: string;
    invalid: string;
    pending: string;
    success: string;
    failure: string;
  };
};

export type DecisionProof =
  | { kind: "people"; countLabel: string; people: Array<{ id: string; label: string; portraitKey: string }> }
  | { kind: "benefits"; items: Array<{ id: string; label: string }> }
  | { kind: "tags"; items: Array<{ id: string; label: string }> }
  | { kind: "stats"; items: Array<{ id: string; value: number; displayValue: string; suffix?: string; description: string }> };

export type DecisionMediaSeat = {
  id: string;
  role: "platform-mark" | "ui-proof" | "device-mock" | "collage" | "portrait" | "lifestyle-photo" | "background" | "foreground-cutout";
  assetKey: string;
  alt: string;
  focalPoint?: { x: number; y: number };
  compactCrop?: "edge-peek" | "chip" | "contained";
  theme?: "light" | "dark";
};

export type DecisionDecor = {
  kind: "abstract-identity" | "identity-card" | "crosshatch";
  decorative: true;
  assetKey?: string;
};

export type DecisionBandFixture = {
  slug: `cta-section-${string}`;
  preset: DecisionBandPreset;
  tone: "light" | "dark" | "accent";
  eyebrow?: string;
  headline: string;
  lede?: string;
  actions: DecisionAction[];
  form?: DecisionEmailCapture;
  proof?: DecisionProof;
  media?: DecisionMediaSeat[];
  decor?: DecisionDecor[];
  stress?: Record<string, Partial<Omit<DecisionBandFixture, "stress">>>;
};

export type DecisionMediaAsset = {
  key: string;
  kind: "raster" | "vector" | "system";
  src?: string;
  darkSrc?: string;
  alt: string;
};

export type ResolvedDecisionBandFixture = DecisionBandFixture & { resolvedMedia: DecisionMediaAsset[] };

type PresetContract = { actions: number; actionKinds: DecisionAction["kind"][]; form: number; media: number; proof?: DecisionProof["kind"]; proofItems?: number; decor?: number; eyebrow?: boolean; lede?: boolean };

const expected: Record<DecisionBandPreset, PresetContract> = {
  "store-download-card": { actions: 2, actionKinds: ["store-destination", "store-destination"], form: 0, media: 2, lede: true },
  "email-inline": { actions: 1, actionKinds: ["submit"], form: 1, media: 0, eyebrow: true, lede: true },
  "dramatic-stage": { actions: 1, actionKinds: ["navigate"], form: 0, media: 2, lede: true },
  "split-ui-proof": { actions: 1, actionKinds: ["navigate"], form: 0, media: 1, lede: true },
  "email-seam": { actions: 1, actionKinds: ["submit"], form: 1, media: 0, decor: 1, eyebrow: true, lede: true },
  "community-proof": { actions: 1, actionKinds: ["navigate"], form: 0, media: 4, proof: "people", proofItems: 4, lede: true },
  "benefit-photo": { actions: 2, actionKinds: ["navigate", "navigate"], form: 0, media: 1, proof: "benefits", proofItems: 8 },
  "app-mock-download": { actions: 2, actionKinds: ["store-destination", "store-destination"], form: 0, media: 3, eyebrow: true, lede: true },
  "collage-trial": { actions: 1, actionKinds: ["navigate"], form: 0, media: 1, lede: true },
  "docs-strip": { actions: 1, actionKinds: ["navigate"], form: 0, media: 0, lede: true },
  "tagged-process": { actions: 1, actionKinds: ["navigate"], form: 0, media: 0, proof: "tags", proofItems: 3, decor: 2, lede: true },
  "photo-newsletter": { actions: 1, actionKinds: ["submit"], form: 1, media: 1, lede: true },
  "stats-panel": { actions: 2, actionKinds: ["navigate", "navigate"], form: 0, media: 0, proof: "stats", proofItems: 3, decor: 1, lede: true },
  "layered-photo": { actions: 1, actionKinds: ["navigate"], form: 0, media: 2, lede: true },
};

const presetBySlug = Object.fromEntries(DECISION_BAND_PRESETS.map((preset, index) => [`cta-section-${String(index + 1).padStart(2, "0")}`, preset])) as Record<string, DecisionBandPreset>;

const expectedMediaRoles: Partial<Record<DecisionBandPreset, DecisionMediaSeat["role"][]>> = {
  "store-download-card": ["platform-mark", "platform-mark"],
  "dramatic-stage": ["ui-proof", "ui-proof"],
  "split-ui-proof": ["ui-proof"],
  "community-proof": ["portrait", "portrait", "portrait", "portrait"],
  "benefit-photo": ["lifestyle-photo"],
  "app-mock-download": ["device-mock", "platform-mark", "platform-mark"],
  "collage-trial": ["collage"],
  "photo-newsletter": ["lifestyle-photo"],
  "layered-photo": ["background", "foreground-cutout"],
};

const requiredText = (value: unknown, label: string, slug: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${slug} requires fixture-owned ${label}.`);
};

const unique = (values: string[], label: string, slug: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${slug} repeats ${label}.`);
};

const proofCount = (proof?: DecisionProof) => proof ? (proof.kind === "people" ? proof.people.length : proof.items.length) : 0;

export function resolveDecisionBandFixture(fixture: DecisionBandFixture, media: DecisionMediaAsset[] = []): ResolvedDecisionBandFixture {
  if (!/^cta-section-(0[1-9]|1[0-4])$/.test(fixture.slug)) throw new Error(`Invalid CTA source key: ${fixture.slug}`);
  if (!DECISION_BAND_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.slug} has an unknown DecisionBand preset.`);
  if (presetBySlug[fixture.slug] !== fixture.preset) throw new Error(`${fixture.slug} must resolve to ${presetBySlug[fixture.slug]}, not ${fixture.preset}.`);
  requiredText(fixture.headline, "headline", fixture.slug);
  if (fixture.eyebrow !== undefined) requiredText(fixture.eyebrow, "eyebrow", fixture.slug);
  if (fixture.lede !== undefined) requiredText(fixture.lede, "lede", fixture.slug);
  const contract = expected[fixture.preset];
  const actualMedia = fixture.media?.length ?? 0;
  const actualDecor = fixture.decor?.length ?? 0;
  if (fixture.actions.length !== contract.actions) throw new Error(`${fixture.slug} requires ${contract.actions} actions.`);
  if (fixture.actions.map((action) => action.kind).join("|") !== contract.actionKinds.join("|")) throw new Error(`${fixture.slug} requires action kinds ${contract.actionKinds.join(", ")} in source order.`);
  if (Number(Boolean(fixture.form)) !== contract.form) throw new Error(`${fixture.slug} requires ${contract.form} email forms.`);
  if (actualMedia !== contract.media) throw new Error(`${fixture.slug} requires ${contract.media} media seats.`);
  if (actualDecor !== (contract.decor ?? 0)) throw new Error(`${fixture.slug} requires ${contract.decor ?? 0} decor seats.`);
  if (contract.proof && fixture.proof?.kind !== contract.proof) throw new Error(`${fixture.slug} requires ${contract.proof} proof.`);
  if (!contract.proof && fixture.proof) throw new Error(`${fixture.slug} must not invent proof.`);
  if (contract.proofItems !== undefined && proofCount(fixture.proof) !== contract.proofItems) throw new Error(`${fixture.slug} requires ${contract.proofItems} proof items.`);
  if (contract.eyebrow && !fixture.eyebrow) throw new Error(`${fixture.slug} requires an eyebrow.`);
  if (contract.lede && !fixture.lede) throw new Error(`${fixture.slug} requires a lede.`);
  const roles = (fixture.media ?? []).map((seat) => seat.role);
  const roleContract = expectedMediaRoles[fixture.preset];
  if (roleContract && roles.join("|") !== roleContract.join("|")) throw new Error(`${fixture.slug} requires media roles ${roleContract.join(", ")} in source order.`);
  unique(fixture.actions.map((action) => action.id), "action IDs", fixture.slug);
  unique((fixture.media ?? []).map((seat) => seat.id), "media seat IDs", fixture.slug);
  unique((fixture.media ?? []).map((seat) => seat.assetKey), "media asset keys", fixture.slug);
  const primaryCount = fixture.actions.filter((action) => action.emphasis === "primary").length;
  const destinationsOnly = fixture.actions.every((action) => action.kind === "store-destination");
  if (destinationsOnly) {
    if (fixture.actions.some((action) => action.emphasis !== "peer")) throw new Error(`${fixture.slug} store destinations must remain equal peers.`);
  } else if (primaryCount !== 1) throw new Error(`${fixture.slug} requires exactly one primary action.`);
  for (const action of fixture.actions) {
    requiredText(action.label, "action label", fixture.slug);
    if (action.kind === "submit" && action.href) throw new Error(`${fixture.slug} submit actions cannot have hrefs.`);
    if (action.kind !== "submit" && (!action.href || action.href === "#")) throw new Error(`${fixture.slug} navigation actions require real hrefs.`);
  }
  if (fixture.form) {
    if (!fixture.actions.some((action) => action.kind === "submit" && action.id === fixture.form?.submitActionId)) throw new Error(`${fixture.slug} form submit action is unresolved.`);
    requiredText(fixture.form.label, "email label", fixture.slug);
    for (const [state, copy] of Object.entries(fixture.form.validation)) requiredText(copy, `${state} form copy`, fixture.slug);
  }
  if (fixture.proof) {
    const proofItems = fixture.proof.kind === "people" ? fixture.proof.people : fixture.proof.items;
    unique(proofItems.map((item) => item.id), "proof item IDs", fixture.slug);
    for (const item of proofItems) requiredText("label" in item ? item.label : item.description, "proof copy", fixture.slug);
    if (fixture.proof.kind === "people") requiredText(fixture.proof.countLabel, "people count label", fixture.slug);
    if (fixture.proof.kind === "stats") for (const item of fixture.proof.items) {
      requiredText(item.displayValue, "stat display value", fixture.slug);
      requiredText(item.description, "stat description", fixture.slug);
    }
  }
  const declaredKeys = new Set((fixture.media ?? []).map((seat) => seat.assetKey));
  const resolvedKeys = new Set(media.map((asset) => asset.key));
  for (const seat of fixture.media ?? []) requiredText(seat.alt, "semantic media alternative text", fixture.slug);
  for (const action of fixture.actions) {
    if (action.kind === "store-destination" && !action.iconKey) throw new Error(`${fixture.slug} store destination ${action.id} requires an icon key.`);
    if (action.iconKey && !declaredKeys.has(action.iconKey)) throw new Error(`${fixture.slug} action ${action.id} has no declared icon media seat.`);
  }
  for (const key of declaredKeys) if (!resolvedKeys.has(key)) throw new Error(`${fixture.slug} cannot resolve media ${key}.`);
  if (fixture.proof?.kind === "people") for (const person of fixture.proof.people) if (!declaredKeys.has(person.portraitKey)) throw new Error(`${fixture.slug} person ${person.id} has no declared portrait seat.`);
  for (const asset of media) {
    if ((asset.src && /^https?:/.test(asset.src)) || (asset.darkSrc && /^https?:/.test(asset.darkSrc))) throw new Error(`${fixture.slug} cannot resolve remote media.`);
    if (asset.kind !== "system" && !asset.src) throw new Error(`${fixture.slug} media ${asset.key} requires a local source.`);
  }
  return { ...fixture, resolvedMedia: media };
}
