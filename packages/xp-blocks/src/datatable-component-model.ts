export const DATATABLE_PRESETS = [
  "transactions-basic",
  "courses-progress",
  "fleet-routes",
  "users-admin",
  "invoices",
  "product-inventory",
  "product-analytics",
] as const;

export type DatatablePreset = (typeof DATATABLE_PRESETS)[number];
export type DatatableTone = "neutral" | "positive" | "warning" | "danger" | "info";

export type DatatableIdentityCell = {
  kind: "identity";
  title: string;
  subtitle?: string;
  mediaKey?: string;
  secondaryMediaKey?: string;
  fallback: string;
};

export type DatatableCell =
  | DatatableIdentityCell
  | { kind: "text"; text: string }
  | { kind: "money"; amountMinor: number; currency: string }
  | { kind: "status"; value: string; label: string; tone: DatatableTone }
  | { kind: "payment"; value: string; label: string; markKey: string }
  | { kind: "progress"; value: number; min: number; max: number; completedLabel: string; totalLabel: string }
  | { kind: "metrics"; values: Array<{ id: string; label: string; value: number }> }
  | { kind: "route"; place: string }
  | { kind: "date"; iso: string; display: string }
  | { kind: "toggle"; checked: boolean; onLabel: string; offLabel: string }
  | { kind: "number"; value: number; display: string }
  | { kind: "trend"; value: number; direction: "up" | "down" | "flat"; display: string }
  | { kind: "sparkline"; points: Array<{ key: string; label: string; value: number }>; summary: string };

export type DatatableColumn = {
  id: string;
  label: string;
  role: "selection" | "identity" | "metric" | "status" | "payment-mark" | "text" | "progress" | "actions" | "toggle" | "sparkline";
  priority: number;
  summary: "primary" | "secondary" | "trailing" | "detail-only";
  sortable: boolean;
  filterId?: string;
};

export type DatatableAction = {
  id: string;
  label: string;
  scope: "row" | "bulk" | "collection";
  kind: "inspect" | "edit" | "duplicate" | "delete" | "create" | "export" | "action";
  destructive?: boolean;
  format?: string;
};

export type DatatableMediaReference = { key: string; role: "portrait" | "functional-mark" | "product-thumb"; alt: string };
export type DatatableMediaAsset = { key: string; kind: "raster" | "system"; src?: string; alt: string };

export type DatatableFixture = {
  sourceKey: string;
  preset: DatatablePreset;
  label: string;
  columns: DatatableColumn[];
  rows: Array<{ id: string; cells: Record<string, DatatableCell> }>;
  totalCount: number;
  search?: { label: string; fieldIds: string[] };
  filters: Array<{ id: string; columnId: string; label: string; kind: "single-select"; options: Array<{ id: string; label: string }> }>;
  selection: { enabled: boolean; mode: "none" | "page-and-rows"; range: boolean };
  sort?: { columnId: string; direction: "asc" | "desc" };
  pagination: { mode: "pages"; initialPage: number; initialPageSize: number; pageSizeOptions?: number[] };
  actions: { row: DatatableAction[]; bulk: DatatableAction[]; collection: DatatableAction[] };
  copy: {
    empty: string;
    filteredEmpty: string;
    loading: string;
    error: string;
    retry: string;
    details: string;
    closeDetails: string;
    paginationRange: string;
    selectedCount: string;
    filterCount: string;
  };
  media: DatatableMediaReference[];
  stress?: Record<string, Partial<DatatableFixture>>;
};

export type ResolvedDatatableFixture = DatatableFixture & { resolvedMedia: DatatableMediaAsset[] };

const expected = {
  "transactions-basic": { columns: 5, search: 0, filters: 0, rowActions: 3, collectionActions: 0 },
  "courses-progress": { columns: 5, search: 1, filters: 0, rowActions: 0, collectionActions: 0 },
  "fleet-routes": { columns: 6, search: 0, filters: 0, rowActions: 0, collectionActions: 3 },
  "users-admin": { columns: 7, search: 0, filters: 3, rowActions: 4, collectionActions: 0 },
  invoices: { columns: 8, search: 1, filters: 1, rowActions: 4, collectionActions: 1 },
  "product-inventory": { columns: 8, search: 1, filters: 3, rowActions: 3, collectionActions: 4 },
  "product-analytics": { columns: 7, search: 1, filters: 0, rowActions: 4, collectionActions: 4 },
} satisfies Record<DatatablePreset, Record<string, number>>;

const requireText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};

const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

export function resolveDatatableFixture(fixture: DatatableFixture, media: DatatableMediaAsset[] = []): ResolvedDatatableFixture {
  if (!/^datatable-component-0[1-7]$/.test(fixture.sourceKey)) throw new Error(`Invalid datatable source key: ${fixture.sourceKey}`);
  if (!DATATABLE_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an unknown preset.`);
  requireText(fixture.label, "label", fixture.sourceKey);
  if (fixture.rows.length !== 25 || fixture.totalCount !== 25) throw new Error(`${fixture.sourceKey} requires exactly 25 source rows.`);
  unique(fixture.rows.map((row) => row.id), "row IDs", fixture.sourceKey);
  unique(fixture.columns.map((column) => column.id), "column IDs", fixture.sourceKey);
  const contract = expected[fixture.preset];
  const actual = {
    columns: fixture.columns.length,
    search: fixture.search ? 1 : 0,
    filters: fixture.filters.length,
    rowActions: fixture.actions.row.length,
    collectionActions: fixture.actions.collection.length,
  };
  for (const [key, value] of Object.entries(contract)) {
    if (actual[key as keyof typeof actual] !== value) throw new Error(`${fixture.sourceKey} requires ${value} ${key}, got ${actual[key as keyof typeof actual]}.`);
  }
  const dataColumns = fixture.columns.filter((column) => !["selection", "actions"].includes(column.role));
  for (const row of fixture.rows) {
    for (const column of dataColumns) if (!row.cells[column.id]) throw new Error(`${fixture.sourceKey} row ${row.id} is missing ${column.id}.`);
  }
  if (fixture.preset === "courses-progress") {
    if (fixture.rows.some((row) => row.cells.course?.kind !== "identity" || !row.cells.course.secondaryMediaKey)) throw new Error(`${fixture.sourceKey} requires a tutor portrait beside every course identity.`);
  }
  if (fixture.preset === "product-analytics" && fixture.rows.some((row) => row.cells.sparkline?.kind !== "sparkline" || row.cells.sparkline.points.length !== 12)) {
    throw new Error(`${fixture.sourceKey} requires twelve points in every sparkline.`);
  }
  const mediaKeys = new Set(fixture.media.map((item) => item.key));
  const resolvedKeys = new Set(media.map((item) => item.key));
  for (const row of fixture.rows) for (const cell of Object.values(row.cells)) {
    if (cell.kind === "identity") for (const key of [cell.mediaKey, cell.secondaryMediaKey]) if (key && (!mediaKeys.has(key) || !resolvedKeys.has(key))) throw new Error(`${fixture.sourceKey} cannot resolve media ${key}.`);
    if (cell.kind === "payment" && (!mediaKeys.has(cell.markKey) || !resolvedKeys.has(cell.markKey))) throw new Error(`${fixture.sourceKey} cannot resolve media ${cell.markKey}.`);
  }
  for (const key of Object.values(fixture.copy)) requireText(key, "interface copy", fixture.sourceKey);
  return { ...fixture, resolvedMedia: media };
}
