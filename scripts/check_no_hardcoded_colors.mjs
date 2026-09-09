#!/usr/bin/env node
// Local CI gate: app styles and routes use semantic theme tokens, never literal colours.
//
// Comment text is not code, so it is excluded before matching: the gate used to read an issue
// reference like `#101` in a comment as a three-digit hex colour. Excluding comments must not blind
// the gate, and deciding where a comment starts by hand does not survive real source. A `//` inside
// a URL starts no comment, and an apostrophe in JSX prose opens no string. So the comment ranges of
// TypeScript, TSX, JS and JSX come from TypeScript's own scanner, which knows both. CSS and HTML get
// their one comment syntax each, neither of which has that ambiguity.
//
// Usage: check_no_hardcoded_colors.mjs [path ...]
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(join(root, "apps/web/package.json"));
const ts = require("typescript");

const SUFFIXES = new Set([".css", ".tsx", ".ts", ".jsx", ".js", ".html"]);
const SCRIPT = new Set([".tsx", ".ts", ".jsx", ".js"]);

const named = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue",
  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk",
  "crimson", "cyan", "dark[a-z]+", "deep[a-z]+", "dimgr[ae]y", "dodgerblue", "firebrick", "floralwhite", "forestgreen",
  "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gr[ae]y", "green", "greenyellow", "honeydew", "hotpink",
  "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "light[a-z]+",
  "lime", "limegreen", "linen", "magenta", "maroon", "medium[a-z]+", "midnightblue", "mintcream", "mistyrose",
  "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "pale[a-z]+",
  "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue",
  "slateblue", "slategr[ae]y", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
  "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
].join("|");
const palette = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const utility = "bg|text|border|ring|outline|fill|stroke|from|via|to|shadow";

const pattern = new RegExp(
  "#[0-9a-f]{3,8}\\b"
  + "|\\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)[ \\t]*\\("
  + `|\\b(?:${utility})-(?:${palette})-[0-9]`
  + `|\\b(?:${utility})-(?:black|white)\\b`
  + `|[:=][ \\t]*["']?(?:${named})(?:[;"'\\s]|$)`,
  "i",
);

/** Blank every character of the given ranges, keeping newlines so lines and columns still line up. */
const blank = (text, ranges) => {
  const out = [...text];
  for (const [start, end] of ranges) for (let i = start; i < Math.min(end, out.length); i++) if (out[i] !== "\n") out[i] = " ";
  return out.join("");
};

/** Comment ranges from TypeScript's own parse, which knows a URL from a comment and JSX text from a
 *  string literal. Leading and trailing trivia of every node covers both comment forms. */
const scriptComments = (path, text, jsx) => {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ranges = [];
  const add = found => { for (const range of found ?? []) ranges.push([range.pos, range.end]); };
  // getChildren, not forEachChild: punctuation tokens are children too, and a comment can sit before
  // a closing bracket or paren, which forEachChild never visits.
  const visit = node => {
    add(ts.getLeadingCommentRanges(text, node.getFullStart()));
    add(ts.getTrailingCommentRanges(text, node.getEnd()));
    for (const child of node.getChildren(source)) visit(child);
  };
  visit(source);
  add(ts.getTrailingCommentRanges(text, source.getEnd()));
  return ranges;
};

const delimited = (text, open, close) => {
  const ranges = [];
  for (let i = text.indexOf(open); i !== -1; i = text.indexOf(open, i + 1)) {
    const end = text.indexOf(close, i + open.length);
    ranges.push([i, end === -1 ? text.length : end + close.length]);
    if (end === -1) break;
    i = end;
  }
  return ranges;
};

const code = (path, text) => {
  const suffix = extname(path);
  if (SCRIPT.has(suffix)) return blank(text, scriptComments(path, text, suffix.endsWith("x")));
  if (suffix === ".css") return blank(text, delimited(text, "/*", "*/"));
  if (suffix === ".html") return blank(text, delimited(text, "<!--", "-->"));
  return text;
};

const files = (target) => {
  if (statSync(target).isFile()) return SUFFIXES.has(extname(target)) ? [target] : [];
  return readdirSync(target, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => files(join(target, entry.name)));
};

const paths = process.argv.slice(2);
const targets = paths.length ? paths : ["apps/web/src", "apps/web/index.html"];
const hits = [];
for (const target of targets.flatMap(path => files(resolve(process.cwd(), path)))) {
  const text = readFileSync(target, "utf8");
  const lines = text.split("\n");
  code(target, text).split("\n").forEach((line, index) => {
    if (pattern.test(line)) hits.push(`${relative(process.cwd(), target)}:${index + 1}:${lines[index].trim()}`);
  });
}

if (hits.length) {
  console.log(hits.join("\n"));
  console.error("FAIL: use semantic theme tokens instead of literal colours or palette utilities.");
  process.exit(1);
}
console.log("PASS: app styles and routes use semantic colours.");
