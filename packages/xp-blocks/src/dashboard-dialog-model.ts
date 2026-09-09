export const DASHBOARD_DIALOG_PRESETS = [
  "plan-compare",
  "success-receipt",
  "payment-card-editor",
  "workspace-connection",
  "seat-configurator",
  "access-manager",
  "payment-card-compact",
  "phone-verification",
  "auth-method-setup",
  "payment-method-picker",
  "file-importer",
  "product-editor",
  "project-share-list",
  "address-editor",
  "referral-share",
  "application-wizard",
  "employee-editor",
  "schedule-editor",
  "command-search",
  "payment-success",
  "destructive-confirm",
  "security-factor-disable",
  "workspace-create",
  "pipeline-builder",
  "collaboration-link",
] as const;

export type DashboardDialogPreset = (typeof DASHBOARD_DIALOG_PRESETS)[number];
export type DashboardDialogIntent = "confirm" | "pick" | "edit" | "search";
export type DashboardDialogProfile = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

export type DashboardDialogAction = {
  id: string;
  label: string;
  kind: "primary" | "secondary" | "destructive" | "utility";
  behavior?: "close" | "next" | "previous" | "copy" | "submit" | "select" | "none";
  disabled?: boolean;
};

export type DashboardDialogField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "url" | "password" | "number" | "money" | "date" | "time" | "textarea" | "select";
  required?: boolean;
  readOnly?: boolean;
  options?: Array<{ id: string; label: string }>;
  hint?: string;
  value?: string;
};

export type DashboardDialogChoice = {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  iconKey?: string;
  mediaKey?: string;
  details?: string[];
};

export type DashboardDialogBoolean = {
  id: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

export type DashboardDialogPerson = {
  id: string;
  displayName: string;
  secondaryText: string;
  avatarKey: string;
  roleOptions?: Array<{ id: string; label: string }>;
  status?: { label: string; tone: "positive" | "negative" | "neutral" };
};

export type DashboardDialogUpload = {
  maxFiles: number;
  maxBytesPerFile: number;
  acceptedTypes: string[];
  allowUrlImport?: boolean;
};

export type DashboardDialogMediaReference = {
  key: string;
  role: "illustration" | "portrait" | "product" | "mark";
};

export type DashboardDialogMediaAsset = {
  key: string;
  src: string;
  alt: string;
};

export type DashboardDialogResultGroup = {
  id: string;
  label: string;
  results: Array<{ id: string; label: string; detail?: string; mediaKeys?: string[]; markKey?: string; status?: string; moreActionLabel?: string }>;
};

export type DashboardDialogActivity = {
  id: string;
  time: string;
  actor: string;
  body: string;
  avatarKey?: string;
  kind: "reply" | "document" | "design-file" | "tags" | "plain";
  resourceLabel?: string;
  tags?: string[];
};

export type DashboardDialogStep = {
  id: string;
  label: string;
  description?: string;
  fields?: DashboardDialogField[];
  choices?: DashboardDialogChoice[];
  selectedChoiceId?: string;
};

export type DashboardDialogWizardBranch = {
  choiceId: string;
  instructions?: string[];
  fields?: DashboardDialogField[];
  qrPayload?: string;
  manualKey?: string;
  recoveryHint?: string;
};

export type DashboardDialogExtension =
  | { kind: "none" }
  | { kind: "calculation"; quantity: { min: number; max: number; value: number }; summaryRows: Array<{ label: string; value: string }>; toggleLabel?: string }
  | { kind: "wizard"; stages: DashboardDialogStep[]; currentStageId: string; branches?: DashboardDialogWizardBranch[] }
  | { kind: "upload"; rows: Array<{ id: string; filename: string; status: "queued" | "progress" | "error" | "complete"; progress?: number; error?: string; retryLabel?: string; removeLabel?: string }> }
  | { kind: "search"; queryLabel: string; queryPlaceholder: string; groups: DashboardDialogResultGroup[]; emptyLabel: string; keyboardLegend?: string[] }
  | { kind: "activity"; activities: DashboardDialogActivity[]; replyLabel?: string }
  | { kind: "sharing"; publicState?: string; copyValue?: string; copiedLabel?: string }
  | {
      kind: "schedule";
      weekdays: Array<{ id: string; shortLabel: string; label: string }>;
      recurrence: { label: string; choices: DashboardDialogChoice[]; selectedChoiceId?: string };
      memberCount: { label: string; value: number; min: number; max: number };
      platform: { label: string; choices: DashboardDialogChoice[]; selectedChoiceId?: string };
    }
  | { kind: "referral"; steps: DashboardDialogStep[]; shareActions: DashboardDialogAction[]; copyValue: string }
  | { kind: "configuration"; summary: { title: string; description: string; info: string }; steps: DashboardDialogStep[] }
  | { kind: "preview"; label: string; values: Array<{ label: string; value: string }> };

export type DashboardDialogFixture = {
  sourceKey: string;
  preset: DashboardDialogPreset;
  profile: DashboardDialogProfile;
  surface?: "modal";
  intent: DashboardDialogIntent;
  triggerLabel: string;
  closeLabel: string;
  title: string;
  description?: string;
  acknowledgement?: string;
  status?: "success" | "danger" | "neutral";
  fields?: DashboardDialogField[];
  choices?: DashboardDialogChoice[];
  selectedChoiceId?: string;
  booleans?: DashboardDialogBoolean[];
  people?: DashboardDialogPerson[];
  upload?: DashboardDialogUpload;
  media?: DashboardDialogMediaReference[];
  actions: DashboardDialogAction[];
  announcements: Record<string, string>;
  extension?: DashboardDialogExtension;
  stress?: Record<string, Partial<Pick<DashboardDialogFixture, "title" | "description" | "fields" | "choices" | "people" | "actions" | "announcements">>>;
};

export type DashboardActivityFixture = {
  sourceKey: "dashboard-dialog-20";
  preset: "activity-feed";
  profile: "P7";
  surface: "popout";
  triggerLabel: string;
  closeLabel: string;
  title: string;
  description?: string;
  actions: [];
  announcements: Record<string, string>;
  media?: DashboardDialogMediaReference[];
  extension: Extract<DashboardDialogExtension, { kind: "activity" }>;
  stress?: Record<string, Partial<Pick<DashboardActivityFixture, "title" | "description" | "announcements">>>;
};

export type DashboardDialogSourceFixture = DashboardDialogFixture | DashboardActivityFixture;
export type ResolvedDashboardDialogFixture = DashboardDialogSourceFixture & { resolvedMedia: DashboardDialogMediaAsset[] };

const exactCounts: Partial<Record<DashboardDialogPreset, { fields?: number; choices?: number; people?: number; media?: number; actions?: number }>> = {
  "plan-compare": { choices: 2 },
  "success-receipt": { actions: 1 },
  "payment-card-editor": { fields: 4 },
  "workspace-connection": { fields: 1, media: 1 },
  "access-manager": { people: 3 },
  "payment-card-compact": { fields: 4 },
  "phone-verification": { fields: 1 },
  "auth-method-setup": { choices: 2 },
  "payment-method-picker": { choices: 5, actions: 0 },
  "product-editor": { choices: 3, media: 4 },
  "project-share-list": { people: 8 },
  "address-editor": { fields: 10, choices: 2 },
  "employee-editor": { fields: 11, media: 1 },
  "payment-success": { actions: 1 },
  "security-factor-disable": { fields: 2 },
  "workspace-create": { fields: 1, actions: 1 },
  "collaboration-link": { actions: 2 },
};

const ensureUnique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label} IDs.`);
};

const requireStrings = (sourceKey: string, values: Array<[string, unknown]>) => {
  for (const [label, value] of values) {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
  }
};

export function resolveDashboardDialogFixture(
  fixture: DashboardDialogSourceFixture,
  mediaAssets: DashboardDialogMediaAsset[] = [],
): ResolvedDashboardDialogFixture {
  if (!/^dashboard-dialog-(0[1-9]|1\d|2[0-6])$/.test(fixture.sourceKey)) throw new Error(`Invalid dashboard dialog source key: ${fixture.sourceKey}`);
  if (fixture.surface === "popout") {
    requireStrings(fixture.sourceKey, [["triggerLabel", fixture.triggerLabel], ["closeLabel", fixture.closeLabel], ["title", fixture.title]]);
    if (fixture.sourceKey !== "dashboard-dialog-20" || fixture.extension.activities.length !== 6 || fixture.actions.length !== 0) {
      throw new Error("dashboard-dialog-20 must be the six-row action-free activity Popout.");
    }
    ensureUnique(fixture.extension.activities.map((activity) => activity.id), "activity", fixture.sourceKey);
    const activityAvatarKeys = fixture.extension.activities.map((activity) => activity.avatarKey).filter((key): key is string => Boolean(key));
    if (activityAvatarKeys.length !== 6 || new Set(activityAvatarKeys).size !== 6 || fixture.media?.length !== 6) throw new Error("dashboard-dialog-20 requires six distinct activity portraits.");
    const tagged = fixture.extension.activities.find((activity) => activity.kind === "tags");
    if (!tagged || tagged.tags?.length !== 3) throw new Error("dashboard-dialog-20 requires one exact three-tag activity.");
    const resolvedMedia = (fixture.media ?? []).map((reference) => {
      const asset = mediaAssets.find((candidate) => candidate.key === reference.key);
      if (!asset || !asset.src.startsWith("/") || asset.src.startsWith("//")) throw new Error(`${fixture.sourceKey} cannot resolve local media ${reference.key}.`);
      return asset;
    });
    return { ...fixture, resolvedMedia };
  }
  if (!DASHBOARD_DIALOG_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an unknown preset.`);
  requireStrings(fixture.sourceKey, [["triggerLabel", fixture.triggerLabel], ["closeLabel", fixture.closeLabel], ["title", fixture.title]]);
  if (fixture.intent === "edit") {
    requireStrings(fixture.sourceKey, [
      ["announcements.discardTitle", fixture.announcements.discardTitle],
      ["announcements.discardDescription", fixture.announcements.discardDescription],
      ["announcements.keepEditing", fixture.announcements.keepEditing],
      ["announcements.discard", fixture.announcements.discard],
    ]);
  }
  if (fixture.actions.some((action) => !action.behavior)) throw new Error(`${fixture.sourceKey} requires an explicit behavior for every action.`);
  if ((fixture.preset === "success-receipt" || fixture.preset === "payment-success") && !fixture.acknowledgement?.trim()) throw new Error(`${fixture.sourceKey} requires a separate acknowledgement line.`);
  const contract = exactCounts[fixture.preset];
  for (const [key, count] of Object.entries(contract ?? {})) {
    const actual = fixture[key as "fields" | "choices" | "people" | "media" | "actions"]?.length ?? 0;
    if (actual !== count) throw new Error(`${fixture.sourceKey} requires ${count} ${key}, got ${actual}.`);
  }
  ensureUnique(fixture.fields?.map((field) => field.id) ?? [], "field", fixture.sourceKey);
  ensureUnique(fixture.choices?.map((choice) => choice.id) ?? [], "choice", fixture.sourceKey);
  ensureUnique(fixture.people?.map((person) => person.id) ?? [], "person", fixture.sourceKey);
  ensureUnique(fixture.actions.map((action) => action.id), "action", fixture.sourceKey);
  if (fixture.preset === "plan-compare" && fixture.choices?.some((choice) => choice.details?.length !== 4)) throw new Error(`${fixture.sourceKey} requires four benefits per plan.`);
  if (fixture.preset === "seat-configurator" && (fixture.extension?.kind !== "calculation" || fixture.extension.summaryRows.length !== 3)) throw new Error(`${fixture.sourceKey} requires three calculated summary rows.`);
  if ((fixture.preset === "auth-method-setup" || fixture.preset === "application-wizard") && fixture.extension?.kind !== "wizard") throw new Error(`${fixture.sourceKey} requires a wizard extension.`);
  if (fixture.preset === "application-wizard" && fixture.extension?.kind === "wizard" && fixture.extension.stages.length !== 4) throw new Error(`${fixture.sourceKey} requires four stages.`);
  if (fixture.preset === "referral-share" && (fixture.extension?.kind !== "referral" || fixture.extension.steps.length !== 3 || fixture.extension.shareActions.length !== 3)) throw new Error(`${fixture.sourceKey} requires three steps and three share actions.`);
  if (fixture.preset === "schedule-editor" && (fixture.extension?.kind !== "schedule" || fixture.extension.weekdays.length !== 7)) throw new Error(`${fixture.sourceKey} requires seven weekday controls.`);
  if (fixture.preset === "command-search") {
    if (fixture.extension?.kind !== "search" || fixture.extension.groups.length !== 3 || fixture.extension.groups.map((group) => group.results.length).join("/") !== "3/2/2") throw new Error(`${fixture.sourceKey} requires search groups 3/2/2.`);
  }
  if (fixture.preset === "pipeline-builder" && (fixture.extension?.kind !== "configuration" || fixture.extension.steps.length !== 4 || !fixture.extension.summary?.title || !fixture.extension.summary.description || !fixture.extension.summary.info || fixture.extension.steps.some((step) => !step.description || step.choices?.length !== 2 || !step.selectedChoiceId))) throw new Error(`${fixture.sourceKey} requires a summary and four complete configuration sections.`);
  const requestedMedia = fixture.media ?? [];
  const resolvedMedia = requestedMedia.map((reference) => {
    const asset = mediaAssets.find((candidate) => candidate.key === reference.key);
    if (!asset || !asset.src.startsWith("/") || asset.src.startsWith("//")) throw new Error(`${fixture.sourceKey} cannot resolve local media ${reference.key}.`);
    return asset;
  });
  return { ...fixture, resolvedMedia };
}
