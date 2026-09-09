import Ajv2020 from "ajv/dist/2020.js";
import schema from "../schemas/block-1.1.schema.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);
const cssForms = new Set(["band", "rail", "stack", "cluster", "pager", "marquee", "toast", "strip"]);
const swapForms = new Set(["sheet", "dialog", "popover", "drawer-side", "pane", "inspector", "tabs", "accordion", "disclosure", "tab-bar", "nav-rail", "top-bar", "mega-panel", "takeover"]);
const rootBands = ["S1", "S2", "S3", "S4", "S5", "S6"];
const innerBands = ["T1", "T2", "T3", ...rootBands];

const formName = (cell) => cell.form;
const isCssForm = (form) => cssForms.has(form) || /^grid-[1-9]\d*$/.test(form);

export function validateManifest(manifest) {
  const valid = validateSchema(manifest);
  const errors = valid ? [] : validateSchema.errors.map((entry) => ({
    rule: "schema",
    path: entry.instancePath || "/",
    message: entry.message,
  }));

  const cells = manifest.forms ?? manifest.formOverrides;
  if (cells) {
    const forms = Object.values(cells).map(formName);
    if (forms.every(isCssForm) && manifest.engine !== "css") {
      errors.push({ rule: "engine", path: "/engine", message: "CSS-morph ladders must use engine=css." });
    }
    if (manifest.engine === "css" && forms.some((form) => swapForms.has(form))) {
      errors.push({ rule: "engine", path: "/engine", message: "A structural swap form cannot use engine=css." });
    }
    if (manifest.engine === "swap" && !forms.some((form) => swapForms.has(form))) {
      errors.push({ rule: "engine", path: "/engine", message: "engine=swap needs a structural swap form." });
    }
    if (manifest.engine === "swap" && manifest.forms && new Set(forms).size < 2) {
      errors.push({ rule: "engine", path: "/engine", message: "A complete swap ladder needs at least two distinct forms." });
    }
  }

  function validateRange(range, order, path) {
    if (range && order.indexOf(range.min) > order.indexOf(range.max)) {
      errors.push({ rule: "band-order", path, message: `${range.min} cannot be above ${range.max}.` });
    }
  }
  validateRange(manifest.slotRange, rootBands, "/slotRange");
  for (const [index, container] of (manifest.innerContainers ?? []).entries()) {
    validateRange(container.bands, innerBands, `/innerContainers/${index}/bands`);
  }

  const adjacency = manifest.adjacency;
  if (adjacency) {
    const exposed = new Set(adjacency.exposes ?? []);
    for (const conflict of adjacency.conflictsWith ?? []) {
      if (exposed.has(conflict)) errors.push({ rule: "adjacency", path: "/adjacency", message: `${conflict} cannot be both exposed and conflicted.` });
    }
    const projection = adjacency.projectionEligibility;
    if (projection) {
      const overlap = projection.eligiblePresets.find((preset) => projection.standalonePresets.includes(preset));
      const declaredPresets = manifest.contract?.presets ?? [];
      const partition = [...projection.eligiblePresets, ...projection.standalonePresets];
      const invented = partition.find((preset) => !declaredPresets.includes(preset));
      const omitted = declaredPresets.find((preset) => !partition.includes(preset));
      if (!exposed.has(projection.capability)) errors.push({ rule: "adjacency", path: "/adjacency/projectionEligibility/capability", message: `${projection.capability} must also be exposed.` });
      if (overlap) errors.push({ rule: "adjacency", path: "/adjacency/projectionEligibility", message: `${overlap} cannot be both projection-eligible and standalone.` });
      if (invented) errors.push({ rule: "adjacency", path: "/adjacency/projectionEligibility", message: `${invented} is not declared by contract.presets.` });
      if (omitted) errors.push({ rule: "adjacency", path: "/adjacency/projectionEligibility", message: `${omitted} must be classified as eligible or standalone.` });
    }
  }

  return { valid: errors.length === 0, errors };
}
