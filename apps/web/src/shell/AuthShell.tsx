import { useEffect, useRef } from "react";
import { Link, useLocation, useMatch } from "react-router";
import { useDeviceClass } from "@xp/runtime";
import { MotionProvider } from "@xp/motion";
import { Avatar, Badge, Layer } from "../modules/kit";
import { authScreens, forms } from "../modules/auth/forms";
import { authHref } from "../modules/auth/logic";
import { brand } from "../app-modules";
import { RouteStage, useFirstPaintStagger, useInputObserver, usePressSurface } from "./motion";
import { SheetHostProvider, useSheetHost } from "./Sheet";
import { ThemeMenu } from "./ThemeControl";
import "@xp/motion/styles/motion.css";
import "../modules/kit/kit.css";
import "./auth-shell.css";

function WorkspaceContext() {
  const { search } = useLocation();
  return <div className="auth-context-content"><div className="auth-person"><Avatar name={brand.auth.person} /><div><strong>{brand.auth.person}</strong><p>{brand.auth.team}</p></div></div><p>{brand.auth.context}</p><nav aria-label={brand.auth.recordsLabel}>{brand.auth.links.map(link => <Link key={link.id} to={authHref(link.path, search)}>{link.title}<span>{link.kind}</span></Link>)}</nav><Badge>{brand.auth.contextBadge}</Badge></div>;
}

export function AuthShell() {
  const AuthIcon = brand.auth.icon;
  const deviceClass = useDeviceClass();
  const { search } = useLocation();
  const match = useMatch("/:screen");
  const screen = authScreens.find(id => id === match?.params.screen?.toLowerCase()) ?? "login";
  const form = forms[screen][deviceClass];
  const root = useRef<HTMLDivElement>(null);
  const { host, anyOpen } = useSheetHost();
  useInputObserver();
  usePressSurface(root);
  // The software keyboard reduces the visual viewport without changing the layout viewport.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || deviceClass !== "M") return;
    const resize = () => { if (root.current) root.current.style.blockSize = viewport.height + "px"; };
    resize(); viewport.addEventListener("resize", resize);
    return () => { viewport.removeEventListener("resize", resize); root.current?.style.removeProperty("block-size"); };
  }, [deviceClass]);
  useFirstPaintStagger(root, "auth-brand", form.context === "pane", ".auth-context-content > *");
  return <MotionProvider><SheetHostProvider host={host}><div ref={root} className="auth-shell" data-xp-shell="" data-device-class={deviceClass} data-auth-layout={form.layout} aria-hidden={anyOpen || undefined}>
    <a className="xp-shell-skip" href="#auth-content">Skip to content</a>
    <header className="auth-top"><Link className="auth-logo" to={authHref("/", search)}><AuthIcon aria-hidden="true" />{brand.name}</Link><div className="auth-top-tools"><Badge>{brand.auth.badge}</Badge><ThemeMenu /></div></header>
    <div className="auth-stage">
      {form.context === "pane" && <aside className="auth-brand"><div><span className="auth-brand-label">{brand.auth.label}</span><h2>{brand.auth.heading[0]}<br />{brand.auth.heading[1]}</h2><p>{brand.auth.description}</p></div><WorkspaceContext />{deviceClass === "DW" && <p className="auth-brand-foot">{brand.auth.foot}</p>}</aside>}
      <main id="auth-content" className="auth-content" tabIndex={-1}><RouteStage /></main>
    </div>
    <footer className="auth-footer"><span>{brand.auth.footNote}</span>{form.context === "sheet" ? <Layer deviceClass={deviceClass} kind="sheet" label="Workspace details" title={`${brand.name} workspace`}><WorkspaceContext /></Layer> : <Link to={authHref(brand.auth.explorePath, search)}>{brand.auth.exploreLabel}</Link>}</footer>
  </div></SheetHostProvider></MotionProvider>;
}
