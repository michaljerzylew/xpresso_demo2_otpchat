import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import { compileTheme, resolveColors } from "./src/theme";
import { presets } from "./src/presets";

// Preserve the core's five fluid segments and cqi/vi expressions verbatim.
// Scaling is a consumer layer, never a second set of metric poles.
const metrics = postcss.parse(readFileSync(new URL("../xp-core/tokens/dist/xp-tokens.css", import.meta.url), "utf8"));
metrics.walkComments(comment => { comment.remove(); });
metrics.walkDecls(decl => {
  const kind = decl.prop.startsWith("--space-") ? "space" : decl.prop.startsWith("--radius-") ? "radius" : null;
  if (!kind || decl.prop.endsWith("-d")) { decl.remove(); return; }
  decl.value = `calc((${decl.value}) * var(--xp-${kind}-scale, 1))`;
});
metrics.walkRules(rule => { if (!rule.nodes.length) rule.remove(); });
metrics.walkAtRules("layer", layer => { layer.replaceWith(...layer.nodes!); });
const destination = new URL("./dist/", import.meta.url);
mkdirSync(destination, { recursive: true });
writeFileSync(new URL("theme.css", destination), compileTheme(presets.graphite) + metrics.toString());
const mappings = Object.keys(resolveColors(presets.graphite, "light")).map(name => `  --color-${name}: var(--xp-${name});`);
for (const family of ["sans", "serif", "mono"]) mappings.push(`  --font-${family}: var(--xp-font-${family});`);
for (const size of ["s", "m", "l"]) mappings.push(`  --shadow-${size}: var(--xp-shadow-${size});`);
writeFileSync(new URL("tailwind.css", destination), `@theme inline {\n  --color-*: initial;\n${mappings.join("\n")}\n}\n@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));\n`);
console.log("theme: default CSS, fluid metric adapters and Tailwind semantic mappings generated");
