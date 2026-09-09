import { brand } from "../app-modules";
export type CaptureState = "default" | "sheet-open" | "panel-open" | "empty" | "loading" | "error" | "saved" | "selected" | "not-found";
export interface QAScreen { id: string; path: string; module: string; name: string; routeFile: string; states: CaptureState[]; }
export const screens: QAScreen[] = [
  { id: "chat", path: "/", module: "chat", name: brand.name, routeFile: "Chat.tsx", states: ["default", "sheet-open", "panel-open"] },
  { id: "login", path: "/login", module: "auth", name: `Sign in to ${brand.name}`, routeFile: "Login.tsx", states: ["default", "panel-open", "empty", "loading", "error", "sheet-open"] },
  { id: "register", path: "/register", module: "auth", name: "Create your account", routeFile: "Register.tsx", states: ["default", "panel-open", "empty", "loading", "error", "selected"] },
  { id: "forgot-password", path: "/forgot-password", module: "auth", name: "Recover your account", routeFile: "ForgotPassword.tsx", states: ["default", "panel-open", "empty", "loading", "error", "saved"] },
  { id: "reset-password", path: "/reset-password", module: "auth", name: "Set a new password", routeFile: "ResetPassword.tsx", states: ["default", "panel-open", "empty", "loading", "error", "saved", "selected"] },
  { id: "two-factor", path: "/two-factor", module: "auth", name: "Confirm it's you", routeFile: "TwoFactor.tsx", states: ["default", "panel-open", "empty", "loading", "error", "saved", "selected"] },
  { id: "verify-email", path: "/verify-email", module: "auth", name: "Verify your email", routeFile: "VerifyEmail.tsx", states: ["default", "panel-open", "empty", "loading", "error", "saved"] },
  { id: "configure", path: "/configure", module: "settings", name: "Customise", routeFile: "Configure.tsx", states: ["default", "panel-open"] },
];
