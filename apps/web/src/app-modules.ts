import { MessageSquare } from "lucide-react";
import type { NavModule } from "./shell/navigation";
import { configuratorGroups, groupAnchor } from "./configurator/groups";
export const modules: NavModule[] = [
  { id: "chat", label: "Chat", path: "/", icon: MessageSquare, prefixes: ["/", "/c"], dock: 0, sourcePrefix: "modules/chat/" },
];
export const secondaryTitles: Record<string, string> = { "/configure": "Customise" };
export const secondaryNavigation = [{ path: "/configure", label: "Customise" }];
export const brand = {
  name: "OTP Chat", mark: "O", workspaceName: "OTP Chat", subtitle: "Autonomous AI Workspace",
  context: "OTP Chat Workspace", contextNote: "Powered by Featherless AI and Cloudflare Access",
  auth: {
    icon: MessageSquare, footNote: "Protected by Cloudflare Access OTP",
    label: "OTP Chat", heading: ["Autonomous AI", "for your team."],
    description: "Sign in with your organization email.", context: "Autonomous conversational AI on the edge.",
    foot: "Cloudflare Access OTP", badge: "Cloudflare Access", person: "Team Member", team: "Organization",
    links: [{ id: "chat", kind: "page", title: "Chat", path: "/" }],
    recordsLabel: "Recent Conversations", contextBadge: "Edge Session", exploreLabel: "Open OTP Chat", explorePath: "/",
    emailPlaceholder: "user@milkies.work",
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
  perfScreen: "chat",
  perfRoutes: [["Customise", "Customise", "/configure"], ["Account access", "Sign in to OTP Chat", "/login"], ["Chat", "OTP Chat", "/"]] as [string, string, string][],
  states: { ...Object.fromEntries(modules.map(module => [module.id, module.qaStates])), auth: "auth-states.mjs" } as Record<string, string | undefined>,
};

export const pwa = {
  description: "Premier autonomous ChatGPT-class PWA powered by Featherless AI and Cloudflare Access OTP",
  shortcuts: [
    { name: "New Chat", short_name: "New", description: "Start fresh conversation", url: "/?action=new" },
    { name: "Customise", short_name: "Customise", description: "Configure workspace", url: "/configure" }
  ],
  screenshots: [] as { file: string; from: string; formFactor: "wide" | "narrow"; label: string }[],
};
