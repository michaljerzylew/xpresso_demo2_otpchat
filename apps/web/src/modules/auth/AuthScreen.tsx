import { brand } from "../../app-modules";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useDeviceClass } from "@xp/runtime";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Link2Off, LogOut } from "lucide-react";
import { Button, Input, PasswordInput, Layer, Badge } from "../kit";
import { authDemo } from "../../data/auth";
import { authHref, blankValues, checkCode, normalizeEmail, passwordChecks, safeDestination, validate, type AuthErrors, type AuthValues } from "./logic";
import { useAuthSession } from "./session";
import { AuthArrival } from "../../shell/motion";
import { registrationForms, type AuthScreen } from "./forms";
import "./auth.css";

export const titles: Record<AuthScreen, string> = { login: `Sign in to ${brand.name}`, register: "Create your account", "forgot-password": "Recover your account", "reset-password": "Set a new password", "two-factor": "Confirm it's you", "verify-email": "Verify your email" };
const descriptions: Record<AuthScreen, string> = {
  login: "Pick up where your team left off.", register: "Join the people behind every waterfront experience.",
  "forgot-password": "Enter your email to get a password reset link.", "reset-password": `Choose a password you haven't used for ${brand.name} before.`,
  "two-factor": "Enter the six-digit code from your authenticator.", "verify-email": "Enter the six-digit code from your verification email.",
};
const actions: Record<AuthScreen, string> = { login: "Sign in", register: "Create account", "forgot-password": "Send reset link", "reset-password": "Update password", "two-factor": "Verify and sign in", "verify-email": "Verify email" };

export function AuthScreenView({ screen }: { screen: AuthScreen }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const fixture = params.get("auth-state");
  const session = useAuthSession();
  const navigate = useNavigate();
  const deviceClass = useDeviceClass();
  const paged = screen === "register" && registrationForms[deviceClass] === "pager";
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<AuthValues>(() => ({ ...blankValues(), email: fixture === "empty" || screen === "register" ? "" : session.email }));
  const [errors, setErrors] = useState<AuthErrors>({});
  const [failure, setFailure] = useState(fixture === "error" ? "This request couldn't be completed. Your details are still here. Try again." : "");
  const [loading, setLoading] = useState(fixture === "loading");
  const [success, setSuccess] = useState(fixture === "saved");
  const [recovery, setRecovery] = useState(false);
  const [notice, setNotice] = useState("");
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const focusStep = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const expired = screen === "reset-password" && (params.get("token") !== authDemo.resetToken || session.resetUsed || Date.now() >= session.resetExpires);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (success) successRef.current?.focus(); }, [success]);
  useEffect(() => {
    if (!focusStep.current) return;
    focusStep.current = false;
    formRef.current?.querySelector<HTMLInputElement>(step === 1 ? 'input[name="password"]' : 'input[name="name"]')?.focus();
  }, [step]);
  function changeStep(next: number) { focusStep.current = true; setStep(next); }
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((session.resendAt - Date.now()) / 1000)));
    update(); const interval = setInterval(update, 1000); return () => clearInterval(interval);
  }, [session]);
  const href = (path: string, extra: Record<string, string> = {}) => authHref(path, search, extra);
  const change = (key: keyof AuthValues, value: string | boolean) => {
    const next = { ...values, [key]: value };
    setValues(next); setFailure("");
    // Clear corrected errors before a pointer press blurs the field and targets the submit button.
    if (errors[key]) setErrors(previous => ({ ...previous, [key]: validate(screen, next, recovery)[key] }));
  };
  const blur = (key: keyof AuthValues) => setErrors(previous => ({ ...previous, [key]: validate(screen, values, recovery)[key] }));
  const field = (key: "name" | "email" | "password" | "confirm" | "code") => ({ name: key, value: values[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => change(key, event.target.value), onBlur: () => blur(key), error: errors[key], disabled: loading, required: true });
  function fail(message: string) { setFailure(message); }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || loading || expired) return;
    const checked = validate(screen, values, recovery);
    const activeErrors = paged && step === 0 ? { ...(checked.name ? { name: checked.name } : {}), ...(checked.email ? { email: checked.email } : {}) } : checked;
    setErrors(activeErrors);
    if (Object.keys(activeErrors).length) { requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    if (paged && step === 0) { changeStep(1); return; }
    setFailure(""); setLoading(true); busy.current = true;
    timer.current = setTimeout(() => {
      setLoading(false); busy.current = false;
      if (screen === "login") {
        if (normalizeEmail(values.email) !== normalizeEmail(session.email) || values.password !== session.password) return fail("Email or password doesn't match. Check your details or reset your password.");
        session.pending = true;
        navigate(href(session.verified ? "/two-factor" : "/verify-email"));
      } else if (screen === "register") {
        if (normalizeEmail(values.email) === normalizeEmail(authDemo.person.email)) return fail("This demo account already exists. Sign in or use another email.");
        Object.assign(session, { email: normalizeEmail(values.email), name: values.name.trim(), password: values.password, verified: false, authenticated: false, pending: true });
        navigate(href("/verify-email"));
      } else if (screen === "forgot-password") {
        session.resetUsed = false; session.resetExpires = Date.now() + 15 * 60_000;
        setSuccess(true);
      } else if (screen === "reset-password") {
        if (session.resetUsed || Date.now() >= session.resetExpires) return fail("This reset link has expired. Request a new link.");
        if (values.password === session.password) return fail("Choose a different password from your current one.");
        session.password = values.password; session.resetUsed = true; session.authenticated = false; session.pending = false;
        setSuccess(true);
      } else {
        if (!checkCode(values.code, recovery) || (recovery && session.recoveryUsed)) return fail(recovery ? "That recovery code is invalid or already used. Try your authenticator code." : "That code doesn't match. Check the six digits and try again.");
        if (recovery) session.recoveryUsed = true;
        if (screen === "verify-email") { session.verified = true; session.pending = true; }
        else { session.authenticated = true; session.pending = false; }
        setSuccess(true);
      }
    }, 450);
  }
  function resend() {
    if (Date.now() < session.resendAt) return;
    session.resendAt = Date.now() + 30_000; setRemaining(30);
    setNotice("A new demo code is ready. Use 246810; no email was sent."); setFailure("");
  }
  const canPassword = screen === "login" || screen === "reset-password" || screen === "register";
  const completedText = screen === "forgot-password" ? "Reset link ready" : screen === "reset-password" ? "Password updated" : screen === "verify-email" ? "Email verified" : "You're signed in";
  return <AuthArrival screen={screen}><section className="auth-screen" data-auth-screen={screen} data-auth-state={success ? "saved" : loading ? "loading" : failure ? "error" : fixture === "empty" ? "empty" : "default"}>
    <div className="auth-heading"><Badge tone="primary">{screen === "two-factor" ? "Account protection" : screen === "verify-email" ? "Email confirmation" : "Team access"}</Badge><h1>{success ? completedText : expired ? "Request a fresh reset link" : titles[screen]}</h1>{!success && !expired && <p>{recovery ? "Use a recovery code" : descriptions[screen]}</p>}</div>
    {screen === "login" && !success && (
      <div className="auth-otp-notice" role="region" aria-label="Cloudflare Access OTP Status">
        <div className="auth-otp-notice-header">
          <ShieldCheck aria-hidden="true" className="auth-otp-notice-icon" />
          <div>
            <strong>Cloudflare Access OTP Active</strong>
            <p>You are already authenticated via Zero Trust OTP. Manual password login is not required.</p>
          </div>
        </div>
        <div className="auth-otp-notice-actions">
          <Link to="/" className="kit-button" data-tone="primary" data-variant="solid">
            Open OTP Chat
            <ArrowRight aria-hidden="true" />
          </Link>
          <a href="/logout" className="kit-button" data-variant="quiet" title="Sign out of Cloudflare Access">
            <LogOut aria-hidden="true" />
            <span>Sign out</span>
          </a>
        </div>
      </div>
    )}
    {success ? <div className="auth-success" ref={successRef} tabIndex={-1} role="status" aria-label={completedText}><CheckCircle2 aria-hidden="true" /><p>{screen === "forgot-password" ? `If ${values.email || session.email} has an account, a reset link would be sent. This demo sends no email.` : screen === "reset-password" ? "Your local demo password has changed. Use it the next time you sign in." : `${session.name}, your ${brand.name} demo account is ready.`}</p><Link className="kit-button" data-tone="primary" data-variant="solid" to={screen === "forgot-password" ? href("/reset-password", { token: authDemo.resetToken }) : screen === "reset-password" ? href("/login") : screen === "verify-email" ? href("/two-factor") : href(safeDestination(params.get("next")))}>{screen === "forgot-password" ? "Open demo reset link" : screen === "reset-password" ? "Return to sign in" : screen === "verify-email" ? "Continue to account protection" : "Open workspace"}<ArrowRight aria-hidden="true" /></Link></div> : expired ? <div className="auth-success" role="alert"><Link2Off aria-hidden="true" /><p>This link is missing, expired or already used. Request another to choose a new password.</p><Link className="kit-button" data-tone="primary" data-variant="solid" to={href("/forgot-password")}>Get a new reset link</Link></div> : <form ref={formRef} className="auth-form" noValidate onSubmit={submit}>
      <div className="auth-fields" data-registration-form={screen === "register" ? registrationForms[deviceClass] : undefined}>
        {paged && <div className="auth-step"><span>Step {step + 1} of 2 · {step ? "Account security" : "Your details"}</span>{step === 1 && <Button type="button" variant="quiet" onClick={() => changeStep(0)}><ArrowLeft aria-hidden="true" />Edit details</Button>}</div>}
        {screen === "register" && (!paged || step === 0) && <Input {...field("name")} label="Full name" autoComplete="name" placeholder="Your name" />}
        {["login", "register", "forgot-password"].includes(screen) && (!paged || step === 0) && <Input {...field("email")} label="Email address" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={brand.auth.emailPlaceholder} />}
        {canPassword && (!paged || step === 1) && <PasswordInput {...field("password")} label={screen === "reset-password" ? "New password" : "Password"} autoComplete={screen === "login" ? "current-password" : "new-password"} />}
        {["register", "reset-password"].includes(screen) && (!paged || step === 1) && <>{!errors.password && <p className="auth-password-help">12+ characters, a letter and a number. <span aria-live="polite">{values.password ? `${passwordChecks(values.password).filter(Boolean).length} of 3 requirements met.` : ""}</span></p>}<PasswordInput {...field("confirm")} label="Confirm password" autoComplete="new-password" /></>}
        {screen === "register" && (!paged || step === 1) && <div><label className="auth-check"><input type="checkbox" checked={values.accepted} disabled={loading} onChange={event => change("accepted", event.target.checked)} aria-describedby={errors.accepted ? "auth-consent-error" : undefined} />Create a local demo account. Nothing is sent.</label>{errors.accepted && <p className="auth-error" id="auth-consent-error">{errors.accepted}</p>}</div>}
        {["two-factor", "verify-email"].includes(screen) && <><div className="auth-account"><ShieldCheck aria-hidden="true" /><span>{session.email}</span></div><Input {...field("code")} label={recovery ? "Recovery code" : "Verification code"} inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} maxLength={recovery ? authDemo.recoveryCode.length : 6} placeholder={recovery ? authDemo.recoveryCode.replace(/\d/g, "0") : "000000"} className="auth-code" /><div className="auth-code-tools">{screen === "two-factor" ? <Button type="button" variant="quiet" onClick={() => { setRecovery(!recovery); change("code", ""); setErrors({}); }}>{recovery ? "Use authenticator code" : "Use a recovery code"}</Button> : <Button type="button" variant="quiet" disabled={remaining > 0} onClick={resend}>{remaining > 0 ? `Resend in ${remaining}s` : "Resend code"}</Button>}</div></>}
        {notice && <p role="status">{notice}</p>}
        {screen === "login" && <Link className="auth-link" to={href("/forgot-password")}>Forgot password?</Link>}
        {failure && <div className="auth-error" role="alert">{failure}</div>}
      </div>
      <div className="auth-actions"><Button type="submit" tone="primary" variant="solid" loading={loading}>{loading ? "Please wait…" : paged && step === 0 ? "Continue to security" : actions[screen]}{!loading && <ArrowRight aria-hidden="true" />}</Button>{loading && <Button type="button" variant="quiet" onClick={() => { clearTimeout(timer.current); busy.current = false; setLoading(false); }}>Cancel request</Button>}</div>
    </form>}
    <div className="auth-secondary">{!(success && screen === "reset-password") && (screen === "login" ? <Link className="auth-link" to={href("/register")}>New to {brand.name}? Create an account</Link> : <Link className="auth-link" to={href("/login")}><ArrowLeft aria-hidden="true" />Back to sign in</Link>)}<Layer kind="popover" deviceClass={deviceClass} label="Demo access" title={`Try ${brand.name} auth`}><div className="auth-demo-body"><p>This is a local demo. Use these fictional details:</p><dl className="auth-demo-details"><dt>Email</dt><dd>{session.email}</dd><dt>Password</dt><dd>{session.password}</dd><dt>Verification code</dt><dd>{authDemo.code}</dd><dt>Recovery code</dt><dd>{authDemo.recoveryCode}</dd></dl><p>Accounts and password changes last until this page is reloaded.</p></div></Layer></div>
  </section></AuthArrival>;
}
