import { LayoutDashboard } from "lucide-react";
import type { NavModule } from "./shell/navigation";
import { configuratorGroups, groupAnchor } from "./configurator/groups";
export const modules: NavModule[] = [
  { id: "start", label: "Start", path: "/", icon: LayoutDashboard, prefixes: ["/"], dock: 0, sourcePrefix: "modules/start/" },
];
export const secondaryTitles: Record<string, string> = { "/configure": "Customise" };
export const secondaryNavigation = [{ path: "/configure", label: "Customise" }];
export const brand = {
  name: "xpresso_demo2_otpchat", mark: "xpresso_demo2_otpchat".slice(0, 1).toUpperCase(), workspaceName: "xpresso_demo2_otpchat", subtitle: "Workspace",
  context: "Your workspace", contextNote: "Build your first screen.",
  auth: {
    icon: LayoutDashboard, footNote: "Local · No emails are sent",
    label: "Your workspace", heading: ["One place for", "your work."],
    description: "Sign in to continue to your workspace.", context: "Your account and workspace in one place.",
    foot: "Account access", badge: "Local", person: "Starter User", team: "Workspace",
    links: [{ id: "start", kind: "page", title: "Start", path: "/" }],
    recordsLabel: "Workspace links", contextBadge: "Local session", exploreLabel: "Explore the workspace", explorePath: "/",
    emailPlaceholder: "you@example.test",
  },
};
export const session = { useSession() {} };
export const authNavigation = { defaultPath: "/", paths: ["/", "/configure"] };
export const sections: Record<string, NavModule["resolveSections"]> = {
  ...Object.fromEntries(modules.map(module => [module.id, module.resolveSections])),
  "/configure": (_path, deviceClass) => deviceClass === "DS" || deviceClass === "DW"
    ? { heading: "On this page", kind: "anchor", sections: configuratorGroups.map(group => ({ id: groupAnchor(group.id), label: group.label })) }
    : null,
};
export const sourcePrefixes = [...modules.map(module => module.sourcePrefix), "modules/auth/", "modules/kit/"];
export const qa = {
  perfScreen: "start",
  perfRoutes: [["Customise", "Customise", "/configure"], ["Account access", "Sign in to xpresso_demo2_otpchat", "/login"], ["Start", "xpresso_demo2_otpchat", "/"]] as [string, string, string][],
  states: { ...Object.fromEntries(modules.map(module => [module.id, module.qaStates])), auth: "auth-states.mjs" } as Record<string, string | undefined>,
};

export const pwa = {
  description: "xpresso_demo2_otpchat workspace",
  shortcuts: [{ name: "xpresso_demo2_otpchat", short_name: "Start", description: "Open workspace", url: "/" }, { name: "Customise", short_name: "Customise", description: "Configure workspace", url: "/configure" }],
  screenshots: [] as { file: string; from: string; formFactor: "wide" | "narrow"; label: string }[],
};
