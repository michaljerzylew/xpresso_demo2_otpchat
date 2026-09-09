import { useEffect } from "react";
import { Link, Route, Routes } from "react-router";
import { DeviceClassProvider } from "@xp/runtime";
import { warmMotion } from "@xp/motion";
import { AppShell, RoutePanes } from "./shell/AppShell";
import { AuthShell } from "./shell/AuthShell";
import { Simulator } from "./shell/Simulator";
import { AuthSessionProvider } from "./modules/auth/session";
import { SessionGraphProvider } from "./data/session-store";
import { PwaRuntime } from "./pwa/PwaRuntime";
import { Chat } from "./routes/Chat";
import { Configure } from "./routes/Configure";
import { Login } from "./routes/Login";
import { Register } from "./routes/Register";
import { ForgotPassword } from "./routes/ForgotPassword";
import { ResetPassword } from "./routes/ResetPassword";
import { TwoFactor } from "./routes/TwoFactor";
import { VerifyEmail } from "./routes/VerifyEmail";

export function AppRoutes() {
  return <SessionGraphProvider><Routes>
    <Route element={<AuthShell />}>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="two-factor" element={<TwoFactor />} />
      <Route path="verify-email" element={<VerifyEmail />} />
    </Route>
    <Route element={<AppShell />}>
      <Route index element={<Chat />} />
      <Route path="c/:id" element={<Chat />} />
      <Route path="configure" element={<Configure />} />
      <Route path="*" element={<RoutePanes><section className="chat-empty-state"><h1>Page not found</h1><Link to="/">Return to chat</Link></section></RoutePanes>} />
    </Route>
  </Routes></SessionGraphProvider>;
}

export function App() {
  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let secondFrame = 0;
    const warm = () => {
      warmMotion();
    };
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(warm);
        else timer = setTimeout(warm, 0);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return <Simulator><DeviceClassProvider><AuthSessionProvider><AppRoutes /><PwaRuntime /></AuthSessionProvider></DeviceClassProvider></Simulator>;
}
