import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { DeviceClassProvider, deviceClasses } from "@xp/runtime";
import { AppRoutes } from "../src/App.tsx";
import { brand, modules, qa, secondaryNavigation } from "../src/app-modules";

test("the bare manifest gives Start its own label and keeps the product name as its heading", () => {
  expect(modules.map(({ id, label, path }) => ({ id, label, path }))).toEqual([{ id: "start", label: "Start", path: "/" }]);
  expect(qa.perfRoutes[2]).toEqual(["Start", brand.name, "/"]);
  expect(brand.auth.exploreLabel).toBe("Explore the workspace");
  expect(brand.auth.exploreLabel).not.toBe("Open workspace");
  expect(brand.mark).toBe(brand.name.slice(0, 1).toUpperCase());
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(DeviceClassProvider, { deviceClass: "M" }, createElement(AppRoutes))));
  expect(html).toContain(`<h1>${brand.name}</h1>`);
  expect(html).toMatch(/<span>Start<\/span>/);
});

test.each(deviceClasses)("the bare Configure utility is explicitly current only in wide navigation on %s", deviceClass => {
  expect(secondaryNavigation).toEqual([{ path: "/configure", label: "Customise" }]);
  const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/configure"] },
    createElement(DeviceClassProvider, { deviceClass }, createElement(AppRoutes))));
  const currentConfigure = /<a(?=[^>]*href="\/configure")(?=[^>]*aria-current="page")[^>]*>/;
  expect(currentConfigure.test(html)).toBe(["TL", "DS", "DW"].includes(deviceClass));
});
