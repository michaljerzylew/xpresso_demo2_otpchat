export const BLOG_SOURCE_KEYS = Array.from({ length: 17 }, (_, index) =>
  `blog-component-${String(index + 1).padStart(2, "0")}`,
) as BlogSourceKey[];

export type BlogSourceKey = `blog-component-${string}`;
export type ArticleFeedPreset = "card-grid" | "feature-stack" | "article-list" | "ranked-mosaic" | "subscription-grid" | "overlay-mosaic" | "article-carousel" | "case-study-grid" | "editorial-bento" | "article-index" | "searchable-archive";
export type ArticleFeedFacet = "classic" | "author-split" | "related" | "lead-sidebar" | "popular-rail" | "author-rows" | "featured-choice" | "newsletter" | "gallery" | "overlay" | "author-reveal" | "editorial" | "runtime-ui" | "pastel-illustration" | "mixed-media" | "minimal" | "filter-search";

export type ArticleAction = { id: string; ownerId: string; kind: "navigate" | "submit"; label: string; href?: `/demo/${string}` };
export type ArticleAuthor = { id: string; name: string; role?: string; avatarSeatId?: string; actionId?: string };
export type ArticleCategory = { id: string; label: string; actionId?: string };
export type ArticleRecord = { id: string; title: string; summary?: string; eyebrow?: string; date?: string; readTime?: string; categoryIds: string[]; tags: string[]; authorIds: string[]; articleActionId: string; mediaSeatId?: string; rank?: number };
export type ArticleMediaSeat = { id: string; kind: "photo" | "poster" | "avatar" | "runtime-ui" | "illustration-3d"; role: "article-photo" | "article-poster" | "author-identity" | "case-study-ui" | "device-ui" | "web-ui" | "editorial-object" | "metric-object" | "technology-object"; assetKey?: string; runtimeSpecId?: string; alt: string; aspect: `${number}/${number}` | "device"; focalPoint?: { x: number; y: number }; fallback: "neutral-media" | "compact-export" | "code-static" };
export type ArticleFeedStress = { textPatches: Array<{ targetId: string; field: "eyebrow" | "title" | "summary" | "label" | "name" | "role" | "alt"; value: string }>; failMediaIds?: string[]; failRuntimeSpecIds?: string[]; newsletterOutcome?: "invalid" | "submitting" | "success" | "error"; searchQuery?: string };
export type NewsletterPayload = { field: { id: "email"; label: string; placeholder: string; help: string; required: true; inputMode: "email" }; submitActionId: string; messages: Record<"invalid" | "submitting" | "success" | "error", string> };
export type CarouselPayload = { articleIds: string[]; initialArticleId: string; previousLabel: string; nextLabel: string; positionTemplate: string; autoplay: false };
export type ArchivePayload = { categoryIds: [string, string, string, string]; initialCategoryId: string; search: { label: string; placeholder: string; clearLabel: string; noResults: string }; articleIds: [string, string, string, string, string, string] };

export type ArticleFeedFixture = {
  schemaVersion: 1; owner: "ArticleFeed"; sourceKey: BlogSourceKey; preset: ArticleFeedPreset; facet: ArticleFeedFacet;
  intro?: { eyebrow?: string; title: string; body?: string }; articles: ArticleRecord[]; authors: ArticleAuthor[]; categories: ArticleCategory[]; actions: ArticleAction[]; media: ArticleMediaSeat[];
  stress: Record<"short" | "longLocale" | "error", ArticleFeedStress>;
  leadIds?: string[]; supportingIds?: string[]; featuredIds?: string[]; rankedIds?: string[]; newsletter?: NewsletterPayload; carousel?: CarouselPayload; runtimeSpecIds?: string[]; tileOrder?: string[]; ticker?: { labels: [string,string,string,string,string,string,string,string,string]; pauseLabel: string; resumeLabel: string }; archive?: ArchivePayload;
};

export type BlogMediaRecord = { slug: BlogSourceKey; seatId: string; kind: ArticleMediaSeat["kind"]; role: ArticleMediaSeat["role"]; aspect: string; disposition: "accepted-original" | "approved-reuse" | "deterministic-vector" | "deterministic-export" | "runtime-code-spec" | "generate-hold"; status: string; owner: string; src?: string; runtimeSpecId?: string; exportSpecId?: string; reason?: string };
export type ResolvedArticleMedia = BlogMediaRecord & { seat: ArticleMediaSeat };
export type ResolvedArticleFeedFixture = Omit<ArticleFeedFixture, "stress"> & { activeStress?: string; mediaById: ReadonlyMap<string, ResolvedArticleMedia>; heldMediaIds: ReadonlySet<string>; failedMediaIds: ReadonlySet<string>; failedRuntimeSpecIds: ReadonlySet<string>; stressNewsletterOutcome?: ArticleFeedStress["newsletterOutcome"]; stressSearchQuery?: string };

type Expected = { preset: ArticleFeedPreset; facet: ArticleFeedFacet; articles: number; actions: number; authors: number; categories: number; media: number; controls: number };
const row = (preset: ArticleFeedPreset, facet: ArticleFeedFacet, counts: [number,number,number,number,number,number]): Expected => ({ preset, facet, articles:counts[0], actions:counts[1], authors:counts[2], categories:counts[3], media:counts[4], controls:counts[5] });
const EXPECTED: Record<BlogSourceKey, Expected> = {
  "blog-component-01":row("card-grid","classic",[3,3,0,0,3,0]), "blog-component-02":row("feature-stack","lead-sidebar",[4,7,1,0,5,0]),
  "blog-component-03":row("article-list","author-rows",[4,8,4,0,8,0]), "blog-component-04":row("ranked-mosaic","featured-choice",[7,7,3,3,10,0]),
  "blog-component-05":row("card-grid","author-split",[4,8,4,0,8,0]), "blog-component-06":row("subscription-grid","newsletter",[3,5,0,0,3,2]),
  "blog-component-07":row("feature-stack","popular-rail",[5,7,2,0,7,0]), "blog-component-08":row("overlay-mosaic","gallery",[5,6,0,0,5,0]),
  "blog-component-09":row("article-carousel","overlay",[6,7,6,6,12,2]), "blog-component-10":row("article-carousel","author-reveal",[5,5,5,0,10,2]),
  "blog-component-11":row("case-study-grid","runtime-ui",[3,4,0,0,3,0]), "blog-component-12":row("editorial-bento","pastel-illustration",[6,6,0,0,2,0]),
  "blog-component-13":row("editorial-bento","mixed-media",[4,5,0,0,4,1]), "blog-component-14":row("article-index","minimal",[3,4,0,3,0,0]),
  "blog-component-15":row("searchable-archive","filter-search",[6,18,6,4,6,5]), "blog-component-16":row("article-carousel","editorial",[4,8,4,0,4,2]),
  "blog-component-17":row("card-grid","related",[3,9,3,3,3,0]),
};

const exact = (items: unknown[], count: number, label: string, source: string) => { if (items.length !== count) throw new Error(`${source} requires exactly ${count} ${label}.`); };
const unique = (values: string[], label: string, source: string) => { if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`); };
const localAction = (action: ArticleAction, source: string) => {
  if (!action.id || !action.label || !action.ownerId) throw new Error(`${source} has an incomplete action.`);
  if (action.kind === "navigate" && (!action.href || !/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(action.href))) throw new Error(`${source} action ${action.id} requires a local /demo route.`);
  if (action.kind === "submit" && action.href) throw new Error(`${source} submit ${action.id} cannot navigate.`);
};

function applyStress(fixture: ArticleFeedFixture, stress?: string) {
  const resolved = structuredClone(fixture);
  if (!stress) return { resolved, patch: undefined };
  const patch = fixture.stress[stress as keyof ArticleFeedFixture["stress"]];
  if (!patch) throw new Error(`${fixture.sourceKey} has no stress state ${stress}.`);
  for (const change of patch.textPatches) {
    const pools: Array<Array<Record<string, unknown>>> = [resolved.articles as unknown as Array<Record<string, unknown>>, resolved.authors as unknown as Array<Record<string, unknown>>, resolved.categories as unknown as Array<Record<string, unknown>>, resolved.media as unknown as Array<Record<string, unknown>>];
    const target = pools.flat().find((record) => record.id === change.targetId);
    if (!target || !(change.field in target)) throw new Error(`${fixture.sourceKey} stress references unknown ${change.targetId}.${change.field}.`);
    target[change.field] = change.value;
  }
  return { resolved, patch };
}

function validateFixture(fixture: ArticleFeedFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.schemaVersion !== 1 || fixture.owner !== "ArticleFeed") throw new Error(`Unknown or invalid Blog fixture ${fixture.sourceKey}.`);
  if (fixture.preset !== expected.preset || fixture.facet !== expected.facet) throw new Error(`${fixture.sourceKey} has the wrong closed preset/facet.`);
  exact(fixture.articles, expected.articles, "articles", fixture.sourceKey); exact(fixture.actions, expected.actions, "actions", fixture.sourceKey); exact(fixture.authors, expected.authors, "authors", fixture.sourceKey); exact(fixture.categories, expected.categories, "categories", fixture.sourceKey); exact(fixture.media, expected.media, "media seats", fixture.sourceKey);
  const ids = [...fixture.articles,...fixture.actions,...fixture.authors,...fixture.categories,...fixture.media].map(({id})=>id); unique(ids,"record IDs",fixture.sourceKey);
  const actions = new Map(fixture.actions.map((action)=>[action.id,action])); const media = new Set(fixture.media.map(({id})=>id)); const authors = new Set(fixture.authors.map(({id})=>id)); const categories = new Set(fixture.categories.map(({id})=>id));
  fixture.actions.forEach((action)=>localAction(action,fixture.sourceKey));
  for (const article of fixture.articles) {
    if (!actions.has(article.articleActionId)) throw new Error(`${fixture.sourceKey} article ${article.id} has a dead route.`);
    if (article.mediaSeatId && !media.has(article.mediaSeatId)) throw new Error(`${fixture.sourceKey} article ${article.id} has missing media.`);
    if (article.authorIds.some((id)=>!authors.has(id)) || article.categoryIds.some((id)=>!categories.has(id))) throw new Error(`${fixture.sourceKey} article ${article.id} has an orphan relation.`);
  }
  for (const author of fixture.authors) if ((author.avatarSeatId && !media.has(author.avatarSeatId)) || (author.actionId && !actions.has(author.actionId))) throw new Error(`${fixture.sourceKey} author ${author.id} has an orphan relation.`);
  for (const category of fixture.categories) if (category.actionId && !actions.has(category.actionId)) throw new Error(`${fixture.sourceKey} category ${category.id} has a dead route.`);
  if (/(?:shadcn|figma|openai|chatgpt|milkies|vendor)/i.test(JSON.stringify(fixture))) throw new Error(`${fixture.sourceKey} contains a forbidden vendor mark.`);
  for (const stress of Object.values(fixture.stress)) if (stress.newsletterOutcome && !["invalid","submitting","success","error"].includes(stress.newsletterOutcome)) throw new Error(`${fixture.sourceKey} has a bad form state.`);
  const controls=(fixture.newsletter?2:0)+(fixture.carousel?2:0)+(fixture.ticker?1:0)+(fixture.archive?5:0); if(controls!==expected.controls) throw new Error(`${fixture.sourceKey} has the wrong control tuple.`);
  if (fixture.carousel) { exact(fixture.carousel.articleIds, fixture.articles.length, "carousel records", fixture.sourceKey); unique(fixture.carousel.articleIds,"carousel records",fixture.sourceKey); if (fixture.carousel.autoplay !== false || !fixture.carousel.articleIds.includes(fixture.carousel.initialArticleId)) throw new Error(`${fixture.sourceKey} carousel must be finite and manual.`); }
  if (fixture.newsletter && !actions.has(fixture.newsletter.submitActionId)) throw new Error(`${fixture.sourceKey} newsletter has a dead submit action.`);
  if (fixture.archive) { exact(fixture.archive.categoryIds,4,"archive categories",fixture.sourceKey); exact(fixture.archive.articleIds,6,"archive articles",fixture.sourceKey); }
  if (fixture.leadIds || fixture.supportingIds) { const partition=[...(fixture.leadIds??[]),...(fixture.supportingIds??[])]; exact(partition,fixture.articles.length,"lead/supporting records",fixture.sourceKey); unique(partition,"lead/supporting records",fixture.sourceKey); }
  if (fixture.featuredIds || fixture.rankedIds) { const partition=[...(fixture.featuredIds??[]),...(fixture.rankedIds??[])]; exact(partition,fixture.articles.length,"featured/ranked records",fixture.sourceKey); unique(partition,"featured/ranked records",fixture.sourceKey); }
  if (fixture.runtimeSpecIds) { exact(fixture.runtimeSpecIds,3,"runtime specs",fixture.sourceKey); unique(fixture.runtimeSpecIds,"runtime specs",fixture.sourceKey); }
  if (fixture.ticker) exact(fixture.ticker.labels,9,"ticker labels",fixture.sourceKey);
  if (fixture.sourceKey === "blog-component-17") for (const article of fixture.articles) if (actions.get(article.articleActionId)?.ownerId !== "feed") throw new Error("blog-component-17 article affordances must be article-owned.");
}

export function resolveArticleFeedFixture(fixture: ArticleFeedFixture, stress: string | undefined, records: BlogMediaRecord[]): ResolvedArticleFeedFixture {
  validateFixture(fixture);
  const { resolved, patch } = applyStress(fixture, stress); validateFixture(resolved);
  const mediaById = new Map<string, ResolvedArticleMedia>(); const held = new Set<string>();
  for (const seat of resolved.media) {
    const candidates = records.filter((record)=>record.slug===resolved.sourceKey && record.seatId===seat.id);
    if (candidates.length !== 1) throw new Error(`${resolved.sourceKey} cannot resolve exact media ${seat.id}.`);
    const record = candidates[0];
    if (record.kind !== seat.kind || record.role !== seat.role || record.aspect !== seat.aspect) throw new Error(`${resolved.sourceKey} media contract drift for ${seat.id}.`);
    if (seat.kind === "runtime-ui" && (record.disposition !== "runtime-code-spec" || record.owner !== "xp-code" || record.runtimeSpecId !== seat.runtimeSpecId)) throw new Error(`${resolved.sourceKey} runtime UI ${seat.id} cannot be rasterized.`);
    if (record.src && !record.src.startsWith("/media/")) throw new Error(`${resolved.sourceKey} media ${seat.id} requires a local public path.`);
    if (record.disposition === "generate-hold") held.add(seat.id);
    mediaById.set(seat.id,{...record,seat});
  }
  const failedMediaIds=new Set(patch?.failMediaIds??[]); const failedRuntimeSpecIds=new Set(patch?.failRuntimeSpecIds??[]);
  for(const id of failedMediaIds) if(!mediaById.has(id)) throw new Error(`${resolved.sourceKey} stress fails unknown media ${id}.`);
  return {...resolved, activeStress:stress, mediaById, heldMediaIds:held, failedMediaIds, failedRuntimeSpecIds, stressNewsletterOutcome:patch?.newsletterOutcome, stressSearchQuery:patch?.searchQuery};
}
