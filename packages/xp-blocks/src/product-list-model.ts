export type ProductListMediaAsset = {
  key: string;
  kind: "responsive-image" | "system-ui" | "pending-gallery";
  src?: string;
  alt: string;
};

export type ProductMoney = { currency: "USD"; current: number; previous?: number };
export type ProductMedia = { key: string; alt: string; aspect: "1:1" | "4:5" | "16:10"; focalPoint?: string };
export type ProductAction = {
  id: string;
  label: string;
  kind: "navigate" | "wishlist" | "quick-add" | "add-to-cart" | "buy-now";
  href?: string;
  emphasis: "primary" | "secondary" | "quiet";
};
export type ProductRating = { value: number; maximum: 5; reviewCount?: number; reviewLabel?: string; reviewHref?: string };
export type ProductInventory = { sold: number; available: number; progress: number };
export type ProductSeller = {
  id: string;
  name: string;
  avatarKey?: string;
  initials: string;
  verified: boolean;
  category: string;
  href: string;
};
export type ProductRecord = {
  id: string;
  name: string;
  href: string;
  media: ProductMedia[];
  price: ProductMoney;
  category?: string;
  tags?: string[];
  badge?: { label: string; tone: "sale" | "status" };
  rating?: ProductRating;
  inventory?: ProductInventory;
  seller?: ProductSeller;
  specifications?: { id: string; label: string }[];
  fulfillment?: { deliveryLabel: string; offerLabel: string; exchangeLabel: string };
  tint?: "neutral" | "mint" | "sand" | "rose" | "sky";
  actions: ProductAction[];
};
export type ProductPromo = {
  role: "promo";
  id: string;
  headline: string;
  accent: string;
  media: ProductMedia;
  action: ProductAction;
};
export type ProductCollectionItem = { role: "product"; product: ProductRecord } | ProductPromo;
export type ProductCollectionFixture = {
  sourceKey: `product-list-${string}`;
  preset: "catalog-deck" | "spec-stack" | "promo-bento" | "trending-rail" | "deal-strip";
  cardComposition: "tile" | "vertical" | "marketplace" | "row";
  eyebrow?: string;
  title: string;
  description?: string;
  items: ProductCollectionItem[];
  collectionAction?: ProductAction;
  countdown?: { label: string; endsAt: string; expiredLabel: string };
  navigation?: { previousLabel: string; nextLabel: string };
  stress?: Record<string, Omit<ProductCollectionFixture, "stress">>;
};
export type ResolvedProductCollectionFixture = ProductCollectionFixture & {
  resolvedMedia: ProductListMediaAsset[];
  hasPendingMedia: boolean;
};

const SOURCE_REQUIREMENTS = {
  "product-list-01": { preset: "catalog-deck", composition: "vertical", products: 6, promos: 0 },
  "product-list-02": { preset: "catalog-deck", composition: "tile", products: 6, promos: 0 },
  "product-list-03": { preset: "catalog-deck", composition: "marketplace", products: 4, promos: 0 },
  "product-list-04": { preset: "spec-stack", composition: "row", products: 2, promos: 0 },
  "product-list-05": { preset: "catalog-deck", composition: "vertical", products: 6, promos: 0 },
  "product-list-06": { preset: "promo-bento", composition: "tile", products: 5, promos: 2 },
  "product-list-07": { preset: "trending-rail", composition: "vertical", products: 7, promos: 0 },
  "product-list-08": { preset: "deal-strip", composition: "vertical", products: 4, promos: 0 },
  "product-list-09": { preset: "trending-rail", composition: "vertical", products: 6, promos: 0 },
} as const;

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const localHref = (value: string | undefined, label: string, sourceKey: string) => {
  if (!value?.startsWith("/demo/") || value === "#") throw new Error(`${sourceKey} ${label} requires a safe local demo href.`);
};

export function resolveProductCollectionFixture(
  fixture: ProductCollectionFixture,
  media: ProductListMediaAsset[],
): ResolvedProductCollectionFixture {
  const requirement = SOURCE_REQUIREMENTS[fixture.sourceKey as keyof typeof SOURCE_REQUIREMENTS];
  if (!requirement) throw new Error(`Unknown product-list source key: ${fixture.sourceKey}`);
  if (fixture.preset !== requirement.preset || fixture.cardComposition !== requirement.composition) {
    throw new Error(`${fixture.sourceKey} has the wrong preset or card composition.`);
  }
  required(fixture.title, "title", fixture.sourceKey);
  const products = fixture.items.filter((item): item is Extract<ProductCollectionItem, { role: "product" }> => item.role === "product");
  const promos = fixture.items.filter((item): item is ProductPromo => item.role === "promo");
  const oneItemStress = products.length === 1 && promos.length === 0;
  if (!oneItemStress && (products.length !== requirement.products || promos.length !== requirement.promos)) {
    throw new Error(`${fixture.sourceKey} requires ${requirement.products} products and ${requirement.promos} promotions.`);
  }
  unique(fixture.items.map((item) => item.role === "product" ? item.product.id : item.id), "item IDs", fixture.sourceKey);
  const mediaByKey = new Map(media.map((asset) => [asset.key, asset]));
  const actionIds: string[] = [];
  const mediaKeys: string[] = [];
  for (const { product } of products) {
    required(product.name, `product ${product.id} name`, fixture.sourceKey);
    localHref(product.href, `product ${product.id}`, fixture.sourceKey);
    if (product.media.length === 0) throw new Error(`${fixture.sourceKey} product ${product.id} requires media.`);
    if (!Number.isFinite(product.price.current) || product.price.current < 0) throw new Error(`${fixture.sourceKey} product ${product.id} has invalid price data.`);
    for (const item of product.media) {
      if (!mediaByKey.has(item.key)) throw new Error(`${fixture.sourceKey} cannot resolve media ${item.key}.`);
      mediaKeys.push(item.key);
    }
    for (const action of product.actions) {
      required(action.label, `action ${action.id} label`, fixture.sourceKey);
      if (action.kind === "navigate") localHref(action.href, `action ${action.id}`, fixture.sourceKey);
      actionIds.push(action.id);
    }
    if (product.rating && (product.rating.maximum !== 5 || product.rating.value < 0 || product.rating.value > 5)) {
      throw new Error(`${fixture.sourceKey} product ${product.id} has invalid rating data.`);
    }
    if (product.rating?.reviewHref) localHref(product.rating.reviewHref, `review ${product.id}`, fixture.sourceKey);
    if (product.seller) {
      localHref(product.seller.href, `seller ${product.seller.id}`, fixture.sourceKey);
      required(product.seller.name, `seller ${product.seller.id} name`, fixture.sourceKey);
    }
    if (product.inventory) {
      const expected = product.inventory.sold + product.inventory.available;
      const percentage = expected ? Math.round((product.inventory.sold / expected) * 100) : 0;
      if (Math.abs(percentage - product.inventory.progress) > 1) throw new Error(`${fixture.sourceKey} product ${product.id} inventory progress drifts from counts.`);
    }
  }
  for (const promo of promos) {
    required(promo.headline, `promotion ${promo.id} headline`, fixture.sourceKey);
    localHref(promo.action.href, `promotion ${promo.id} action`, fixture.sourceKey);
    if (!mediaByKey.has(promo.media.key)) throw new Error(`${fixture.sourceKey} cannot resolve media ${promo.media.key}.`);
    mediaKeys.push(promo.media.key);
    actionIds.push(promo.action.id);
  }
  unique(actionIds, "action IDs", fixture.sourceKey);

  if (!oneItemStress && fixture.sourceKey === "product-list-01" && products.reduce((count, item) => count + (item.product.tags?.length ?? 0), 0) !== 12) throw new Error(`${fixture.sourceKey} requires twelve tags.`);
  if (!oneItemStress && fixture.sourceKey === "product-list-03" && products.filter((item) => item.product.seller?.verified).length !== 4) throw new Error(`${fixture.sourceKey} requires four verified seller rows.`);
  if (!oneItemStress && fixture.sourceKey === "product-list-04" && products.reduce((count, item) => count + (item.product.specifications?.length ?? 0), 0) !== 8) throw new Error(`${fixture.sourceKey} requires eight specifications.`);
  if (!oneItemStress && fixture.sourceKey === "product-list-05" && products.some((item) => item.product.media.length !== 3)) throw new Error(`${fixture.sourceKey} requires three gallery views per product.`);
  if (fixture.sourceKey === "product-list-07" && !fixture.navigation) throw new Error(`${fixture.sourceKey} requires rail navigation labels.`);
  if (!oneItemStress && fixture.sourceKey === "product-list-08" && (!fixture.countdown || !fixture.collectionAction || products.some((item) => !item.product.inventory))) throw new Error(`${fixture.sourceKey} requires countdown, collection action and four inventory records.`);
  if (fixture.sourceKey === "product-list-09" && !fixture.navigation) throw new Error(`${fixture.sourceKey} requires rail navigation labels.`);

  const hasPendingMedia = mediaKeys.some((key) => mediaByKey.get(key)?.kind === "pending-gallery");
  return { ...fixture, resolvedMedia: media, hasPendingMedia };
}
