export const PRICING_APPEARANCES = ["split-offer", "plan-cards", "plan-selector", "comparison-matrix", "plan-bands", "plan-accordion"] as const;
export type PricingAppearance = (typeof PRICING_APPEARANCES)[number];
export type PricingAction = { id: string; label: string; href: string; emphasis: "primary" | "secondary" };
export type PricingFeature = { id: string; label: string; description?: string; availability?: "included" | "excluded" | "limited" };
export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  iconKey?: string;
  badge?: { label: string; tone: "recommended" | "savings" };
  priceByBilling: Record<string, { currency: "USD"; amount: number; cadence: string }>;
  features: PricingFeature[];
  featureGroups?: { id: string; label: string; features: PricingFeature[] }[];
  userSummary?: string;
  action: PricingAction;
};
export type PricingMediaAsset = { key: string; kind: string; src?: string; alt: string };
export type PricingFixture = {
  sourceKey: `pricing-component-${string}`;
  appearance: PricingAppearance;
  eyebrow?: string;
  title: string;
  description?: string;
  billing?: { options: { id: string; label: string; savingsLabel?: string }[]; initialOptionId: string };
  plans: PricingPlan[];
  initialPlanId: string;
  supportingBenefits?: PricingFeature[];
  reassurance?: string[];
  comparison?: { title: string; description?: string; rows: { id: string; label: string; values: Record<string, boolean | string> }[]; action?: PricingAction };
  socialProof?: { rating: number; maximum: 5; reviewCount: number; people: { id: string; name: string; avatarKey: string; alt: string }[] };
  paymentNetworks?: { id: string; name: string; markKey: string }[];
  contactAction?: PricingAction;
  decor?: "cosmic-field" | "geometric-corners" | "gradient-stage";
  stress?: Record<string, Partial<Omit<PricingFixture, "stress">>>;
};
export type ResolvedPricingFixture = PricingFixture & { resolvedMedia: PricingMediaAsset[] };

const expected: Record<string, { appearance: PricingAppearance; plans: number; features: number[]; matrix?: number; benefits?: number; groups?: number; networks?: number }> = {
  "pricing-component-01": { appearance: "split-offer", plans: 2, features: [0,0] },
  "pricing-component-02": { appearance: "split-offer", plans: 1, features: [0], benefits: 6 },
  "pricing-component-03": { appearance: "split-offer", plans: 1, features: [8], benefits: 3 },
  "pricing-component-04": { appearance: "plan-cards", plans: 2, features: [4,7] },
  "pricing-component-05": { appearance: "comparison-matrix", plans: 4, features: [0,0,0,0], matrix: 10 },
  "pricing-component-06": { appearance: "plan-cards", plans: 3, features: [4,4,4] },
  "pricing-component-07": { appearance: "plan-selector", plans: 4, features: [4,4,4,4] },
  "pricing-component-08": { appearance: "plan-cards", plans: 3, features: [5,5,5] },
  "pricing-component-09": { appearance: "plan-cards", plans: 4, features: [5,5,5,5] },
  "pricing-component-10": { appearance: "split-offer", plans: 2, features: [0,0], benefits: 5 },
  "pricing-component-11": { appearance: "plan-cards", plans: 3, features: [5,6,7] },
  "pricing-component-12": { appearance: "plan-cards", plans: 2, features: [5,5] },
  "pricing-component-13": { appearance: "plan-cards", plans: 3, features: [3,3,3] },
  "pricing-component-14": { appearance: "plan-cards", plans: 2, features: [4,5] },
  "pricing-component-15": { appearance: "plan-cards", plans: 3, features: [4,6,4] },
  "pricing-component-16": { appearance: "plan-cards", plans: 3, features: [0,0,0], groups: 4, networks: 5 },
  "pricing-component-17": { appearance: "plan-bands", plans: 3, features: [6,6,6] },
  "pricing-component-18": { appearance: "plan-accordion", plans: 4, features: [0,0,0,0], matrix: 0 },
  "pricing-component-19": { appearance: "plan-cards", plans: 3, features: [4,5,4] },
  "pricing-component-20": { appearance: "comparison-matrix", plans: 4, features: [3,3,3,3], matrix: 8 },
};

const requireText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
};
const requireHref = (value: string, label: string, sourceKey: string) => {
  if (!value.startsWith("/demo/") || value === "#") throw new Error(`${sourceKey} ${label} requires a safe local href.`);
};

export function applyPricingStress(fixture: PricingFixture, key?: string): PricingFixture {
  if (!key || !fixture.stress?.[key]) return fixture;
  const patch = fixture.stress[key];
  const basePlans = new Map(fixture.plans.map((plan) => [plan.id, plan]));
  const plans = patch.plans?.map((plan) => ({ ...basePlans.get(plan.id), ...plan })) as PricingPlan[] | undefined;
  if (key === "singlePlan") return { ...patch, paymentNetworks: fixture.paymentNetworks, plans: plans ?? fixture.plans, stress: fixture.stress } as PricingFixture;
  return { ...fixture, ...patch, plans: plans ?? fixture.plans, stress: fixture.stress };
}

export function resolvePricingFixture(fixture: PricingFixture, media: PricingMediaAsset[] = []): ResolvedPricingFixture {
  const rule = expected[fixture.sourceKey];
  if (!rule) throw new Error(`Unknown pricing source: ${fixture.sourceKey}`);
  if (fixture.appearance !== rule.appearance) throw new Error(`${fixture.sourceKey} has the wrong appearance.`);
  requireText(fixture.title, "title", fixture.sourceKey);
  const stressSingle = fixture.plans.length === 1 && rule.plans > 1;
  if (!stressSingle && fixture.plans.length !== rule.plans) throw new Error(`${fixture.sourceKey} requires ${rule.plans} plans.`);
  const ids = fixture.plans.map((plan) => plan.id);
  if (new Set(ids).size !== ids.length || !ids.includes(fixture.initialPlanId)) throw new Error(`${fixture.sourceKey} has invalid plan identity.`);
  for (const plan of fixture.plans) {
    requireText(plan.name, `plan ${plan.id} name`, fixture.sourceKey);
    requireHref(plan.action.href, `plan ${plan.id} action`, fixture.sourceKey);
    if (!Object.values(plan.priceByBilling).every((price) => price.currency === "USD" && Number.isFinite(price.amount) && price.amount >= 0)) throw new Error(`${fixture.sourceKey} plan ${plan.id} has invalid price data.`);
    const featureIds = [...plan.features, ...(plan.featureGroups?.flatMap((group) => group.features) ?? [])].map((feature) => feature.id);
    if (new Set(featureIds).size !== featureIds.length) throw new Error(`${fixture.sourceKey} plan ${plan.id} repeats feature IDs.`);
  }
  if (!stressSingle) {
    const counts = fixture.plans.map((plan) => plan.features.length);
    if (counts.join("|") !== rule.features.join("|")) throw new Error(`${fixture.sourceKey} feature counts drifted.`);
    if ((fixture.comparison?.rows.length ?? 0) !== (rule.matrix ?? 0)) throw new Error(`${fixture.sourceKey} comparison rows drifted.`);
    if ((fixture.supportingBenefits?.length ?? 0) !== (rule.benefits ?? 0)) throw new Error(`${fixture.sourceKey} supporting benefits drifted.`);
    if (rule.groups && fixture.plans.some((plan) => (plan.featureGroups?.length ?? 0) !== rule.groups || (plan.featureGroups?.flatMap((group) => group.features).length ?? 0) !== 7)) throw new Error(`${fixture.sourceKey} grouped feature anatomy drifted.`);
    if ((fixture.paymentNetworks?.length ?? 0) !== (rule.networks ?? 0)) throw new Error(`${fixture.sourceKey} payment network count drifted.`);
  }
  if (fixture.billing && (!fixture.billing.options.some((option) => option.id === fixture.billing?.initialOptionId) || fixture.billing.options.length !== 2)) throw new Error(`${fixture.sourceKey} billing state is invalid.`);
  if (fixture.comparison?.action) requireHref(fixture.comparison.action.href, "comparison action", fixture.sourceKey);
  if (fixture.contactAction) requireHref(fixture.contactAction.href, "contact action", fixture.sourceKey);
  if (fixture.sourceKey === "pricing-component-20" && (fixture.socialProof?.people.length !== 4 || fixture.socialProof.reviewCount !== 4000 || fixture.socialProof.rating !== 4.5)) throw new Error(`${fixture.sourceKey} social proof drifted.`);
  return { ...fixture, resolvedMedia: media };
}
