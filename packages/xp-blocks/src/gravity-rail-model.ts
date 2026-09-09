export const GRAVITY_RAIL_PRESETS = ["framed-mono-wrap", "hairline-color-grid", "soft-mosaic", "dual-card-marquee", "bare-color-wall", "split-vertical-partners", "split-identity-orbit", "split-staggered-pyramid", "split-muted-mosaic"] as const;
export type GravityRailPreset = (typeof GRAVITY_RAIL_PRESETS)[number];
export type GravityRailMode = "auto" | "static" | "marquee";
export type GravityRailLogoRecord = { id: string; companyId: string; assetRef: string; name: string; role: "partner" | "product"; presentation: "symbol" | "wordmark" | "combination"; tone: "color" | "mono" };
export type GravityRailFixture = { slug: string; preset: GravityRailPreset; mode: GravityRailMode; module: "GravityRail"; copy: { eyebrow?: { text: string; treatment: "text" | "outline-badge" }; heading: { text: string; emphasis?: { phrase: string; treatment: "underline" } }; body: string; actionPrompt?: string; action?: { label: string; href: string }; accessibilityIntro: string; logos: GravityRailLogoRecord[] } };
type LogoVariant = { path: string; sha256: string };
type LogoPresentation = { kind: GravityRailLogoRecord["presentation"]; opticalScale: number; baselineShiftEm: number; variants: { colorOnLight: LogoVariant; colorOnDark: LogoVariant; monoOnLight: LogoVariant; monoOnDark: LogoVariant } };
export type GravityRailLogoLibrary = { identities: Array<{ id: string; companyId: string; name: string; role: GravityRailLogoRecord["role"]; presentations: LogoPresentation[] }> };
export type GravityRailIdentity = GravityRailLogoRecord & { lightSrc: string; darkSrc: string; lightHash: string; darkHash: string; opticalScale: number; baselineShiftEm: number };
export type GravityRailModel = Omit<GravityRailFixture, "copy"> & { copy: Omit<GravityRailFixture["copy"], "logos"> & { logos: GravityRailIdentity[] } };

const expected: Record<GravityRailPreset, { count: number; mode: GravityRailMode; productCount: number }> = {
  "framed-mono-wrap": { count: 10, mode: "auto", productCount: 0 }, "hairline-color-grid": { count: 15, mode: "static", productCount: 0 }, "soft-mosaic": { count: 12, mode: "auto", productCount: 0 }, "dual-card-marquee": { count: 12, mode: "marquee", productCount: 0 }, "bare-color-wall": { count: 14, mode: "auto", productCount: 0 }, "split-vertical-partners": { count: 19, mode: "auto", productCount: 0 }, "split-identity-orbit": { count: 10, mode: "auto", productCount: 1 }, "split-staggered-pyramid": { count: 9, mode: "static", productCount: 0 }, "split-muted-mosaic": { count: 6, mode: "static", productCount: 0 },
};
const localAssetPath = (path: string) => `/${path.replace(/^assets-library\//, "assets-library/")}`;
export function resolveGravityRailFixture(fixture: GravityRailFixture, library: GravityRailLogoLibrary): GravityRailModel {
  if (!GRAVITY_RAIL_PRESETS.includes(fixture.preset)) throw new Error(`Unknown GravityRail preset: ${fixture.preset}`);
  const contract = expected[fixture.preset];
  if (fixture.mode !== contract.mode) throw new Error(`${fixture.slug} requires mode ${contract.mode}`);
  if (fixture.copy.logos.length !== contract.count) throw new Error(`${fixture.slug} requires ${contract.count} identities`);
  if (fixture.copy.logos.filter((logo) => logo.role === "product").length !== contract.productCount) throw new Error(`${fixture.slug} product ownership does not match ${fixture.preset}`);
  const ids = new Set<string>();
  const logos = fixture.copy.logos.map((logo) => {
    if (ids.has(logo.companyId)) throw new Error(`${fixture.slug} repeats ${logo.companyId}`); ids.add(logo.companyId);
    const identity = library.identities.find((entry) => entry.id === logo.assetRef && entry.companyId === logo.companyId);
    const presentation = identity?.presentations.find((entry) => entry.kind === logo.presentation);
    if (!identity || !presentation || identity.name !== logo.name || identity.role !== logo.role) throw new Error(`${fixture.slug} cannot resolve ${logo.assetRef}/${logo.presentation}`);
    const light = presentation.variants[`${logo.tone}OnLight`]; const dark = presentation.variants[`${logo.tone}OnDark`];
    return { ...logo, lightSrc: localAssetPath(light.path), darkSrc: localAssetPath(dark.path), lightHash: light.sha256, darkHash: dark.sha256, opticalScale: presentation.opticalScale, baselineShiftEm: presentation.baselineShiftEm };
  });
  return { ...fixture, copy: { ...fixture.copy, logos } };
}
