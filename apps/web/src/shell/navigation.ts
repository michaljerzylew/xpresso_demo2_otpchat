/** The shell's navigation model. A module owns a set of route prefixes and, when it has more than
 *  one screen family, a list of sections. The shell renders those sections in the anatomy its class
 *  provides (sidebar tree, wrapping strip or compact select); a screen never chooses where nav goes. */
import type { LucideIcon } from "lucide-react";
import type { DeviceClass } from "@xp/runtime";
import type { RouteSections } from "./sections";
import { modules } from "../app-modules";
export { modules, secondaryTitles } from "../app-modules";
export type NavSection = { path: string; label: string; prefix?: string };
export type NavModule = {
  id: string; label: string; path: string; icon: LucideIcon; prefixes: string[]; sections?: NavSection[];
  navSections?: (pathname: string) => NavSection[];
  sectionHeading?: (pathname: string) => string;
  alignSections?: (pathname: string) => boolean;
  resolveSections?: (pathname: string, deviceClass: DeviceClass) => RouteSections | null;
  railSections?: (pathname: string) => boolean;
  moduleNavigation?: boolean;
  sectionStrip?: boolean;
  galleryNavigation?: boolean;
  dock?: number;
  dockIcon?: LucideIcon;
  qaStates?: string;
  sourcePrefix: string;
};

const matches = (prefix: string, pathname: string) => pathname === prefix || pathname.startsWith(prefix + "/");

/** The longest matching prefix wins, so `/settings/helpdesk/tags` belongs to the inbox module
 *  rather than to workspace settings. `/` only ever matches the overview exactly. */
export function resolveModule(pathname: string): NavModule | undefined {
  if (pathname === "/") return modules.find(module => module.path === "/");
  let best: { module: NavModule; length: number } | undefined;
  for (const module of modules) for (const prefix of module.prefixes) {
    if (matches(prefix, pathname) && (!best || prefix.length > best.length)) best = { module, length: prefix.length };
  }
  if (best?.module.navSections) return { ...best.module, sections: best.module.navSections(pathname) };
  return best?.module;
}

export function resolveSection(module: NavModule | undefined, pathname: string): NavSection | undefined {
  if (!module?.sections) return undefined;
  let best: { section: NavSection; length: number } | undefined;
  for (const section of module.sections) {
    const prefix = section.prefix ?? section.path;
    if (matches(prefix, pathname) && (!best || prefix.length > best.length)) best = { section, length: prefix.length };
  }
  return best?.section;
}


export function moduleId(pathname: string) {
  return resolveModule(pathname)?.id ?? pathname.split("/")[1] ?? modules[0]?.id;
}


/** Only the simulator's own state crosses a route boundary. `theme` is not shell state: nothing in
 *  the shell reads it, the colour mode follows the emulated colour scheme, and the one consumer is
 *  the offers gallery filter (#58). Carrying it made a module filter follow the reader into every
 *  other module, which is the leak this helper exists to prevent (#61, #101). */
export function globalSearch(search: string): string {
  const source = new URLSearchParams(search);
  const global = new URLSearchParams();
  for (const key of ["xp", "xp-frame"]) {
    const value = source.get(key);
    if (value !== null) global.set(key, value);
  }
  return global.size ? "?" + global : "";
}
