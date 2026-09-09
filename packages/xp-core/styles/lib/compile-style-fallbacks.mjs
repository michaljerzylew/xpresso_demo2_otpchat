import postcss from "postcss";
import { mediaForClass } from "./detection.mjs";

const classPattern = /style\(\s*--xp-class\s*:\s*(M|TP|TL|DS|DW)\s*\)/g;

export function compileStyleFallbacks(source, config, options = {}) {
  const from = options.from ?? "style-query-source.css";
  const root = postcss.parse(source, { from });
  let replacements = 0;

  root.walkAtRules("container", (rule) => {
    const classes = [...rule.params.matchAll(classPattern)].map((match) => match[1]);
    if (classes.length === 0) return;

    const media = postcss.atRule({
      name: "media",
      params: classes.map((className) => mediaForClass(config, className)).join(", "),
    });
    media.append(rule.nodes.map((node) => node.clone()));
    rule.replaceWith(media);
    replacements += 1;
  });

  if (replacements === 0) throw new Error(`No --xp-class style queries found in ${from}.`);
  root.prepend(postcss.comment({ text: "GENERATED width-band fallback; viewport queries are build output, never block source" }));
  return { css: root.toString(), replacements };
}
