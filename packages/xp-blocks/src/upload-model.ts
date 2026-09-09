export const FILE_UPLOAD_SOURCE_KEYS = Array.from({ length: 7 }, (_, index) =>
  `file-upload-${String(index + 1).padStart(2, "0")}`,
) as FileUploadSourceKey[];

export type FileUploadSourceKey = `file-upload-${string}`;
export type UploadPreset = "basic-single" | "project-assets" | "multi-source" | "avatar" | "workspace-assets" | "upload-manager" | "review-media";
export type UploadStressKey = "short" | "longLocale" | "missingOptional" | "empty" | "pending" | "error" | "success";
export type UploadSourceKind = "device" | "link" | "camera" | "library" | "drive";
export type UploadFileState = "queued" | "uploading" | "done" | "failed";

export type UploadField = {
  label: string;
  helper?: string;
  placeholder?: string;
  lockedReason?: string;
  agreement?: string;
  href?: `/demo/${string}`;
  options?: Array<string | { id: string; initials: string; name: string; markId: string }>;
};

export type UploadFixtureFile = {
  id: string;
  name: string;
  state: UploadFileState;
  progress: number;
  error?: string;
  previewAssetId?: string;
};

export type UploadFixture = {
  schemaVersion: 1;
  owner: "UploadUnit";
  sourceKey: FileUploadSourceKey;
  preset: UploadPreset;
  heading: string;
  description: string;
  hostFields?: Record<string, UploadField>;
  uploadCopy: {
    pointerAction: string;
    touchAction: string;
    constraints: string;
    validation: Record<"count" | "type" | "size" | "duplicate" | "source", string>;
    announcements: Record<"progress" | "success" | "error", string>;
  };
  sources?: Partial<Record<UploadSourceKind, { label: string; instruction: string; error: string }>>;
  files: UploadFixtureFile[];
  actions: Record<string, string | Record<string, string>>;
  stress: Record<UploadStressKey, unknown>;
};

export type UploadMediaRecord = {
  assetId: string;
  alt: string;
  sources: { avif: string; webp: string; jpg: string };
};
export type UploadMediaMap = { schemaVersion: "1.0"; records: UploadMediaRecord[] };

export type UploadFileRecord = UploadFixtureFile & {
  size: number;
  mediaType: string;
  previewUrl?: string;
};

export type ResolvedUpload = Omit<UploadFixture, "files" | "sourceKey"> & {
  sourceKey: string;
  accept: string[];
  multiple: boolean;
  maxFiles: number;
  maxBytes: number;
  files: UploadFileRecord[];
  activeStress?: UploadStressKey;
};

export type UploadHostOverride = {
  sourceKey: string;
  accept: string[];
  multiple: boolean;
  maxFiles: number;
  maxBytes: number;
  uploadCopy?: UploadFixture["uploadCopy"];
  files?: UploadFileRecord[];
};

type Expected = {
  preset: UploadPreset;
  multiple: boolean;
  maxFiles: number;
  maxBytes: number;
  accept: string[];
  fieldKeys: string[];
  fileCount: number;
  sourceKeys: UploadSourceKind[];
};

const EXPECTED: Record<FileUploadSourceKey, Expected> = {
  "file-upload-01": { preset: "basic-single", multiple: false, maxFiles: 1, maxBytes: 10_000_000, accept: ["application/json", "text/plain", ".json", ".txt"], fieldKeys: ["studioName"], fileCount: 1, sourceKeys: [] },
  "file-upload-02": { preset: "project-assets", multiple: true, maxFiles: 6, maxBytes: 5_000_000, accept: ["image/*", "application/pdf", ".doc", ".docx"], fieldKeys: ["projectName", "leadSelector"], fileCount: 6, sourceKeys: [] },
  "file-upload-03": { preset: "multi-source", multiple: true, maxFiles: 6, maxBytes: 5_000_000, accept: ["image/*", "application/pdf"], fieldKeys: [], fileCount: 1, sourceKeys: ["device", "link", "camera", "library", "drive"] },
  "file-upload-04": { preset: "avatar", multiple: false, maxFiles: 1, maxBytes: 1_000_000, accept: ["image/*"], fieldKeys: ["profileName", "profileEmail", "profilePassword"], fileCount: 1, sourceKeys: [] },
  "file-upload-05": { preset: "workspace-assets", multiple: true, maxFiles: 6, maxBytes: 5_000_000, accept: ["image/*", "application/pdf", ".doc", ".docx"], fieldKeys: ["workspaceName", "visibility"], fileCount: 1, sourceKeys: [] },
  "file-upload-06": { preset: "upload-manager", multiple: true, maxFiles: 6, maxBytes: 5_000_000, accept: ["image/*", "application/pdf", ".doc", ".docx", "video/*"], fieldKeys: [], fileCount: 3, sourceKeys: [] },
  "file-upload-07": { preset: "review-media", multiple: true, maxFiles: 6, maxBytes: 5_000_000, accept: ["image/*"], fieldKeys: ["reviewTitle", "reviewBody", "reportRoute", "recommendation", "termsGate"], fileCount: 4, sourceKeys: [] },
};

const nonempty = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
};
const exactKeys = (actual: string[], expected: string[], label: string, source: string) => {
  if (actual.sort().join("/") !== [...expected].sort().join("/")) throw new Error(`${source} has invalid ${label}.`);
};
const inferType = (name: string) => {
  const extension = name.split(".").at(-1)?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "avif"].includes(extension ?? "")) return `image/${extension === "jpg" ? "jpeg" : extension}`;
  if (extension === "pdf") return "application/pdf";
  if (extension === "json") return "application/json";
  if (extension === "mp4") return "video/mp4";
  return "application/octet-stream";
};

function applyStress(fixture: UploadFixture, stress?: UploadStressKey) {
  const active = structuredClone(fixture);
  if (!stress) return active;
  if (!(stress in active.stress)) throw new Error(`${active.sourceKey} misses stress ${stress}.`);
  const value = active.stress[stress];
  if ((stress === "short" || stress === "longLocale") && value && typeof value === "object") {
    const copy = value as Record<string, string>;
    for (const key of ["heading", "description"] as const) if (copy[key]) active[key] = copy[key];
    for (const [target, key] of [["pointerAction", "pointerAction"], ["touchAction", "touchAction"], ["constraints", "constraints"]] as const) if (copy[key]) active.uploadCopy[target] = copy[key];
  }
  if (stress === "empty") active.files = [];
  if (stress === "pending") active.files = active.files.map((file) => ({ ...file, state: "uploading", progress: Math.min(72, Math.max(18, file.progress || 38)), error: undefined }));
  if (stress === "error") active.files = active.files.length ? active.files.map((file, index) => index ? file : ({ ...file, state: "failed", progress: 0, error: String(value) })) : [{ id: `${active.sourceKey}-error`, name: "incomplete-upload.bin", state: "failed", progress: 0, error: String(value) }];
  if (stress === "success") active.files = active.files.map((file) => ({ ...file, state: "done", progress: 100, error: undefined }));
  return active;
}

function validateFixture(fixture: UploadFixture, mediaMap: UploadMediaMap) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.schemaVersion !== 1 || fixture.owner !== "UploadUnit") throw new Error(`Unknown UploadUnit fixture ${fixture.sourceKey}.`);
  if (fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} differs from its closed preset.`);
  nonempty(fixture.heading, "heading", fixture.sourceKey); nonempty(fixture.description, "description", fixture.sourceKey);
  exactKeys(Object.keys(fixture.hostFields ?? {}), expected.fieldKeys, "host fields", fixture.sourceKey);
  exactKeys(Object.keys(fixture.sources ?? {}), expected.sourceKeys, "source adapters", fixture.sourceKey);
  for (const [key, field] of Object.entries(fixture.hostFields ?? {})) {
    nonempty(field.label, `${key} label`, fixture.sourceKey);
    if (field.options?.some((option) => typeof option === "string" ? !option.trim() : !option.id.trim() || !option.name.trim() || !option.initials.trim() || !option.markId.trim())) throw new Error(`${fixture.sourceKey}/${key} has incomplete options.`);
  }
  for (const [kind, source] of Object.entries(fixture.sources ?? {})) {
    nonempty(source?.label, `${kind} source label`, fixture.sourceKey);
    nonempty(source?.instruction, `${kind} source instruction`, fixture.sourceKey);
    nonempty(source?.error, `${kind} source error`, fixture.sourceKey);
  }
  if (fixture.files.length !== expected.fileCount) throw new Error(`${fixture.sourceKey} requires exactly ${expected.fileCount} fixture files.`);
  if (new Set(fixture.files.map(({ id }) => id)).size !== fixture.files.length || new Set(fixture.files.map(({ name }) => name)).size !== fixture.files.length) throw new Error(`${fixture.sourceKey} repeats file identity.`);
  for (const file of fixture.files) {
    nonempty(file.name, `${file.id} name`, fixture.sourceKey);
    if (file.progress < 0 || file.progress > 100) throw new Error(`${fixture.sourceKey}/${file.id} has invalid progress.`);
    if (file.state === "failed" && !file.error) throw new Error(`${fixture.sourceKey}/${file.id} needs an error.`);
  }
  exactKeys(Object.keys(fixture.uploadCopy.validation), ["count", "type", "size", "duplicate", "source"], "validation copy", fixture.sourceKey);
  if (Object.values(fixture.uploadCopy.validation).some((value) => !value.trim()) || Object.values(fixture.uploadCopy.announcements).some((value) => !value.trim())) throw new Error(`${fixture.sourceKey} has incomplete upload copy.`);
  for (const key of ["short", "longLocale", "missingOptional", "empty", "pending", "error", "success"] as UploadStressKey[]) if (!(key in fixture.stress)) throw new Error(`${fixture.sourceKey} misses stress ${key}.`);
  const longToken = (fixture.stress.longLocale as { longestToken?: string })?.longestToken;
  if (!longToken || longToken.length < 24) throw new Error(`${fixture.sourceKey} requires a 24-character long-locale token.`);
  if (fixture.sourceKey === "file-upload-02") {
    const leads = fixture.hostFields?.leadSelector?.options ?? [];
    if (leads.length !== 3 || leads.some((lead) => typeof lead === "string")) throw new Error("file-upload-02 requires three code-owned lead identities.");
  }
  if (fixture.sourceKey === "file-upload-04" && fixture.files.some(({ name }) => !inferType(name).startsWith("image/"))) throw new Error("file-upload-04 accepts image fixture records only.");
  if (fixture.sourceKey === "file-upload-05" && fixture.hostFields?.visibility?.options?.join("/") !== "Private/Public/Pro") throw new Error("file-upload-05 requires the locked Private/Public/Pro vocabulary.");
  if (fixture.sourceKey === "file-upload-06") {
    const states = fixture.files.map(({ state, progress }) => `${state}:${progress}`).join("/");
    if (states !== "uploading:45/uploading:80/failed:0") throw new Error("file-upload-06 requires 45/80 active records and one failed record.");
  }
  if (fixture.sourceKey === "file-upload-07") {
    if (fixture.files.some(({ previewAssetId }) => !previewAssetId || !mediaMap.records.some(({ assetId }) => assetId === previewAssetId))) throw new Error("file-upload-07 requires four resolved preview assets.");
  }
}

function validateActiveFiles(fixture: UploadFixture) {
  if (new Set(fixture.files.map(({ id }) => id)).size !== fixture.files.length || new Set(fixture.files.map(({ name }) => name)).size !== fixture.files.length) throw new Error(`${fixture.sourceKey} repeats file identity.`);
  for (const file of fixture.files) {
    nonempty(file.name, `${file.id} name`, fixture.sourceKey);
    if (file.progress < 0 || file.progress > 100) throw new Error(`${fixture.sourceKey}/${file.id} has invalid progress.`);
    if (file.state === "failed" && !file.error) throw new Error(`${fixture.sourceKey}/${file.id} needs an error.`);
  }
}

export function resolveUploadFixture(fixture: UploadFixture, mediaMap: UploadMediaMap, stress?: UploadStressKey): ResolvedUpload {
  if (mediaMap.schemaVersion !== "1.0" || mediaMap.records.length !== 4 || new Set(mediaMap.records.map(({ assetId }) => assetId)).size !== 4) throw new Error("File Upload media map must contain four unique local preview records.");
  for (const record of mediaMap.records) {
    nonempty(record.alt, `${record.assetId} alt`, "file-upload-media");
    if (Object.values(record.sources).some((value) => !value.startsWith("/media/") || /^https?:/.test(value))) throw new Error(`File Upload media ${record.assetId} is not local.`);
  }
  validateFixture(fixture, mediaMap);
  const active = applyStress(fixture, stress);
  validateActiveFiles(active);
  return {
    ...active,
    ...EXPECTED[active.sourceKey],
    files: active.files.map((file, index) => ({ ...file, size: 80_000 + index * 114_000, mediaType: inferType(file.name) })),
    activeStress: stress,
  };
}

export function adaptUploadHostModel(base: ResolvedUpload, override: UploadHostOverride): ResolvedUpload {
  nonempty(override.sourceKey, "host source key", "upload-host");
  if (!override.accept.length || override.accept.some((value) => !value.trim())) throw new Error("upload-host requires at least one accepted type.");
  if (!Number.isInteger(override.maxFiles) || override.maxFiles < 1 || !Number.isFinite(override.maxBytes) || override.maxBytes < 1) throw new Error("upload-host has invalid file bounds.");
  const uploadCopy = override.uploadCopy ?? base.uploadCopy;
  if (Object.values(uploadCopy.validation).some((value) => !value.trim()) || Object.values(uploadCopy.announcements).some((value) => !value.trim())) throw new Error("upload-host has incomplete upload copy.");
  const files = override.files ?? [];
  if (files.length > override.maxFiles) throw new Error("upload-host starts above its file limit.");
  return { ...base, ...override, uploadCopy, files };
}

export type UploadImplementationProbe = { ownerCount: number; listOwnerCount: number; hiddenTwins: boolean; viewportBranching: boolean; coarseTargetPx: number; fineHitAreaPx: number; adapters: UploadSourceKind[]; objectUrlCleanup: boolean };
export function validateUploadImplementationProbe(probe: UploadImplementationProbe) {
  if (probe.ownerCount !== 1 || probe.listOwnerCount !== 1) throw new Error("upload-owner-cardinality");
  if (probe.hiddenTwins) throw new Error("hidden-responsive-twin");
  if (probe.viewportBranching) throw new Error("two-axis-viewport-branching");
  if (probe.coarseTargetPx < 44 || probe.fineHitAreaPx < 44) throw new Error("B-MOB-target-floor");
  if (["device", "link", "camera", "library", "drive"].some((key) => !probe.adapters.includes(key as UploadSourceKind))) throw new Error("source-adapter-parity");
  if (!probe.objectUrlCleanup) throw new Error("object-url-cleanup");
  return true;
}
