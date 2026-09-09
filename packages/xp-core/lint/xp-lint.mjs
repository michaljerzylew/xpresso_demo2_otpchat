const ROOT_SELECTOR = /(?:\[data-xp-block(?:=[^\]]+)?\]|\.xp-block(?:\b|[-_]))[^,{]*\{/g;
const ALLOWED_ROOT_THRESHOLDS = new Set([20, 26, 34, 42, 56]);
const ALLOWED_INNER_THRESHOLDS = new Set([10, 15, 20, 26, 34, 42, 56]);

function issue(rule, message, index = 0) {
  return { rule, message, index };
}

function withoutLegalClassSelectors(source) {
  return source.replace(/style\(\s*--xp-class\s*:\s*(?:M|TP|TL|DS|DW)\s*\)/g, "style(xp-class-cell)");
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function addMatches(issues, source, pattern, rule, message) {
  for (const match of source.matchAll(pattern)) issues.push(issue(rule, message(match), match.index));
}

function lintLiteralLengths(source, issues) {
  const lengthPattern = /(?<![\w.-])(\d+(?:\.\d+)?)(px|rem)\b/g;
  for (const match of source.matchAll(lengthPattern)) {
    const value = Number(match[1]);
    if (value === 0) continue;
    const line = source.slice(source.lastIndexOf("\n", match.index) + 1, source.indexOf("\n", match.index) === -1 ? source.length : source.indexOf("\n", match.index));
    if (value === 1 && match[2] === "px" && /border/i.test(line)) continue;
    if (match[2] === "rem" && /@container/.test(line) && ALLOWED_INNER_THRESHOLDS.has(value)) continue;
    issues.push(issue("literal-length", `Literal ${match[0]} is outside L0.`, match.index));
  }
}

function lintThresholds(source, issues) {
  const pattern = /@container\s+([\w-]+)?\s*\([^)]*inline-size\s*(?:>=|>|<=|<)\s*(\d+(?:\.\d+)?)rem[^)]*\)/g;
  for (const match of source.matchAll(pattern)) {
    const containerName = match[1] ?? "";
    const threshold = Number(match[2]);
    const allowed = containerName === "xp-slot" ? ALLOWED_ROOT_THRESHOLDS : ALLOWED_INNER_THRESHOLDS;
    if (!allowed.has(threshold)) {
      issues.push(issue("offscale-threshold", `${threshold}rem is not on the ${containerName === "xp-slot" ? "S" : "S/T"} scale.`, match.index));
    }
  }
}

function lintRootRules(source, issues) {
  for (const match of source.matchAll(ROOT_SELECTOR)) {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = source.indexOf("}", bodyStart);
    const body = source.slice(bodyStart, bodyEnd === -1 ? source.length : bodyEnd);
    if (/(?:^|[;\s])margin(?:-inline|-block|-left|-right|-top|-bottom)?\s*:/.test(body)) {
      issues.push(issue("outer-margin", "A block root cannot own outer margin.", match.index));
    }
    if (/container-type\s*:/.test(body)) {
      issues.push(issue("root-container-type", "The shell owns the block root container.", match.index));
    }
  }
}

export function lintSource(source, context = {}) {
  const path = context.path ?? "unknown.css";
  const declaredTokens = new Set(context.declaredTokens ?? []);
  const hasContainerAncestor = context.hasContainerAncestor ?? false;
  const issues = [];

  addMatches(issues, source, /@media[^\{]*(?:\bwidth\b|min-width|max-width)[^\{]*\{/g, "viewport-media", () => "Viewport geometry media query in block source.");
  addMatches(issues, source, /\b(?:sm|md|lg|xl|2xl):[\w[\]-]+/g, "viewport-variant", (match) => `Tailwind viewport variant ${match[0]} is forbidden.`);
  addMatches(issues, source, /(?<![\w.-])(?:\d+(?:\.\d+)?)(?:vw|vh|vi|vb|dvh|svh)\b/g, "viewport-unit", (match) => `Viewport unit ${match[0]} is shell-only.`);
  lintLiteralLengths(source, issues);

  const classReads = withoutLegalClassSelectors(source);
  addMatches(issues, classReads, /--xp-class\b/g, "xp-class-read", () => "--xp-class may appear only in a form-cell style query.");
  lintRootRules(source, issues);

  addMatches(issues, source, /position\s*:\s*(?:absolute|fixed|sticky)\b/g, "block-position", (match) => `${match[0]} is shell/algebra-owned.`);
  addMatches(issues, source, /display\s*:\s*(?:flex|grid|inline-flex|inline-grid)\b/g, "bare-layout", (match) => `${match[0]} must be expressed by L1 algebra.`);
  addMatches(issues, source, /className\s*=\s*["'`][^"'`]*\b(?:flex|inline-flex|grid|inline-grid)\b[^"'`]*["'`]/g, "bare-layout", () => "Tailwind flex/grid is forbidden in block code.");
  addMatches(issues, source, /(?:^|[;\s{])(?:left|right|margin-left|margin-right|padding-left|padding-right)\s*:/gm, "physical-property", (match) => `Physical property ${match[0].trim()} must be logical.`);
  addMatches(issues, source, /\b(?:ml|mr|pl|pr)-[\w[\]-]+|\btext-left\b/g, "physical-property", (match) => `Physical utility ${match[0]} must be logical.`);
  lintThresholds(source, issues);

  if (/cqi\b/.test(source) && !hasContainerAncestor) {
    issues.push(issue("orphan-cqi", "cqi requires the manifest-backed xp-slot ancestor."));
  }

  for (const match of source.matchAll(/var\(\s*(--[\w-]+)/g)) {
    const token = match[1];
    if (!declaredTokens.has(token)) issues.push(issue("undeclared-token", `${token} is used but absent from manifest.tokens.`, match.index));
  }

  addMatches(issues, source, /\buseIsMobile\b/g, "use-is-mobile", () => "useIsMobile collapses the five-class contract.");
  addMatches(issues, source, /\bwindow\.innerWidth\b/g, "window-width", () => "window.innerWidth bypasses the class/slot contract.");
  addMatches(issues, source, /user-scalable\s*=\s*(?:no|0)/gi, "disable-zoom", () => "Viewport zoom cannot be disabled.");
  addMatches(issues, source, /--text-step-[\w-]+/g, "raw-text-step", () => "Blocks bind --role-*; raw --text-step-* is forbidden by A3.");
  addMatches(issues, source, /(?:cdn\.)?shadcnstudio\.com|ss-assets/gi, "vendor-asset", (match) => `Vendor asset reference ${match[0]} is forbidden.`);

  return issues.map((entry) => ({ ...entry, path, line: lineAt(source, entry.index) }));
}
