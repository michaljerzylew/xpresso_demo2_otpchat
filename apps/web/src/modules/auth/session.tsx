import { createContext, useContext, useRef, type ReactNode } from "react";
import { authDemo } from "../../data/auth";

export type DemoSession = { email: string; name: string; password: string; pending: boolean; verified: boolean; authenticated: boolean; recoveryUsed: boolean; resetUsed: boolean; resetExpires: number; resendAt: number };
export const createDemoSession = (): DemoSession => ({ email: authDemo.person.email, name: authDemo.person.title, password: authDemo.password, pending: false, verified: true, authenticated: false, recoveryUsed: false, resetUsed: false, resetExpires: Number.POSITIVE_INFINITY, resendAt: 0 });
const Session = createContext<DemoSession | null>(null);
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const session = useRef(createDemoSession());
  return <Session.Provider value={session.current}>{children}</Session.Provider>;
}
export function useAuthSession() { const session = useContext(Session); if (!session) throw new Error("AuthSessionProvider required"); return session; }
