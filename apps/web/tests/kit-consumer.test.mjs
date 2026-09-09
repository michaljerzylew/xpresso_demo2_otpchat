import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync } from "node:fs";
import { test, expect } from "vitest";
import { Button, PageHeader, RecordDeck } from "../src/modules/kit/index";

// Real exported components, rendered without the gallery or its .kit boundary.
test("public components render outside the gallery for the browser consumer probe", () => {
const markup = renderToStaticMarkup(createElement("section", { id: "kit-consumer" },
  createElement(PageHeader, { title: "Consumer heading", description: "Independent component consumer" }),
  createElement(RecordDeck, { items: ["First", "Second"], label: "Consumer records", empty: "Empty", render: item => createElement("p", null, item) }),
  ...["neutral", "primary", "success", "warning", "danger"].flatMap(tone =>
    ["solid", "outline", "quiet"].flatMap(variant => ["enabled", "disabled", "loading"].map(state =>
      createElement(Button, { key: `${tone}-${variant}-${state}`, tone, variant, disabled: state === "disabled", loading: state === "loading", "data-case": `${tone}-${variant}-${state}` }, "Consumer action"))))));
expect(markup).not.toContain('class="kit"');
mkdirSync(new URL("../evidence/", import.meta.url), { recursive: true });
writeFileSync(new URL("../evidence/kit-consumer.html", import.meta.url), markup);
});
