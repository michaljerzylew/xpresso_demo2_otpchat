/** Local authentication fixture. Replace the service before using real accounts. */
export const authDemo = {
  person: { id: "starter-user", title: "Starter User", email: "starter@example.test" },
  team: { id: "workspace", title: "Workspace", memberIds: ["starter-user"] },
  password: "Workspace2026!",
  code: "246810",
  recoveryCode: "ACCESS-2041",
  resetToken: "local-reset",
  links: [],
} as const;
