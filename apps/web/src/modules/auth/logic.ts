import { authNavigation } from "../../app-modules";
import { authDemo } from "../../data/auth";
import type { AuthScreen } from "./forms";

export type AuthValues = { name: string; email: string; password: string; confirm: string; code: string; accepted: boolean };
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;
export const blankValues = (): AuthValues => ({ name: "", email: "", password: "", confirm: "", code: "", accepted: false });
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function passwordChecks(password: string) {
  return [password.length >= 12, /[a-z]/i.test(password), /[0-9]/.test(password)];
}
function recoveryPattern(code: string) {
  return new RegExp("^" + code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\d/g, "\\d") + "$", "i");
}
export function validate(screen: AuthScreen, values: AuthValues, recovery = false): AuthErrors {
  const errors: AuthErrors = {};
  if (["login", "register", "forgot-password"].includes(screen) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(values.email))) errors.email = "Enter an email address, including its domain.";
  if (screen === "register" && values.name.trim().length < 2) errors.name = "Enter your name so your team can recognise you.";
  if (screen === "login" && !values.password) errors.password = "Enter your password.";
  if (["register", "reset-password"].includes(screen)) {
    if (!passwordChecks(values.password).every(Boolean)) errors.password = "Use at least 12 characters, with a letter and a number.";
    if (values.password !== values.confirm || !values.confirm) errors.confirm = "Enter the same password in both fields.";
  }
  if (screen === "register" && !values.accepted) errors.accepted = "Confirm that you want to create a local demo account.";
  if (["two-factor", "verify-email"].includes(screen) && !(recovery ? recoveryPattern(authDemo.recoveryCode) : /^\d{6}$/).test(values.code.trim())) errors.code = recovery ? "Enter the complete recovery code exactly as provided." : "Enter all six digits from your code.";
  return errors;
}
export function checkCode(value: string, recovery = false) { return value.trim().toUpperCase() === (recovery ? authDemo.recoveryCode : authDemo.code); }
/** Destination allowlist prevents external and nonexistent redirects. */
export function safeDestination(value: string | null) { return authNavigation.paths.includes(value ?? "") ? value! : authNavigation.defaultPath; }
export function authHref(path: string, search: string, extra: Record<string, string> = {}) {
  const source = new URLSearchParams(search), target = new URLSearchParams();
  for (const key of ["xp", "xp-frame", "next"]) if (source.has(key)) target.set(key, source.get(key)!);
  for (const [key, value] of Object.entries(extra)) target.set(key, value);
  return path + (target.size ? "?" + target : "");
}
