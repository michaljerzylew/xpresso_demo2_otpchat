/** The panel's groups are the route's sections, so the shell's section navigation names them. */
export const configuratorGroups = [
  { id: "colour", label: "Colour" },
  { id: "type", label: "Type" },
  { id: "layout", label: "Layout" },
  { id: "export", label: "Export" },
] as const;

export type ConfiguratorGroupId = (typeof configuratorGroups)[number]["id"];
export const groupAnchor = (id: ConfiguratorGroupId) => "cfg-" + id;
