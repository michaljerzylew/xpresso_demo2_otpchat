import type { DeviceClass } from "@xp/runtime";
import { modules, sections } from "../app-modules";
import { resolveModule } from "./navigation";
/** One entry in a route's section list. `owns` names further pathnames the section is current for. */
export type RouteSection = { id: string; label: string; path?: string; owns?: readonly string[] };

/**
 * A route's sections, declared as data in one place instead of another branch inside the shell's
 * navigation for every module that lands. `param` lists switch a search parameter; `anchor` lists
 * scroll to an element id. `route` sends the links to their own pathnames, which is how a module's
 * section list moves between its routes and how a record route returns to its own gallery.
 */
export type RouteSections = {
  heading: string;
  /** `route` sections are separate pathnames; the id is the path and the link keeps the search. */
  kind: "param" | "anchor" | "route";
  sections: RouteSection[];
  /**
   * A module's own section list, as opposed to the shell's generic "On this page" fallback. DW
   * already carries the modules in its rail, so a module route gives the sidebar over to its tree
   * instead of repeating the rail beside it.
   */
  module?: boolean;
  path?: string;
  clears?: string[];
  param?: { name: string; fallback: string; clears?: string[] };
  /**
   * Classes that mount this list as a strip under the top bar instead of leaving it to the
   * sidebar or the More surface. Vision §3 gives TP and TL a section strip above the list pane.
   */
  strip?: DeviceClass[];
};


export function resolveSections(pathname: string, deviceClass: DeviceClass): RouteSections | null {
  return (sections[pathname] ?? resolveModule(pathname)?.resolveSections)?.(pathname, deviceClass) ?? null;
}
export const isHomePath = (path: string) => Boolean(modules.find(module => module.railSections?.(path)));
