import { brand, session, secondaryNavigation } from "../app-modules";
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useDeviceClass, useDeviceClassBusy, useDeviceClassLock } from "@xp/runtime";
import { resolveBottomRegion } from "@xp/shells/regions";
import { MotionProvider } from "@xp/motion";
import "@xp/motion/styles/motion.css";
import { ChevronLeft, ChevronRight, Ellipsis, PanelRight, LogIn } from "lucide-react";
import { ThemeMenu } from "./ThemeControl";
import { resolveSections, isHomePath, type RouteSection } from "./sections";
import { globalSearch, modules, resolveModule, resolveSection, secondaryTitles } from "./navigation";
import { Sheet, SheetHostProvider, useSheetHost } from "./Sheet";
import { KineticHeadline, RouteStage, enterSurface, inputFor, routePaneTargets, useFirstPaintStagger, useInputObserver, useLayoutFlip, usePressSurface } from "./motion";


export { KineticHeadline };



function Navigation({ icons = false, close }: { icons?: boolean; close?: () => void }) {
  const { pathname, search } = useLocation();
  const active = resolveModule(pathname);
  return <nav aria-label={icons ? "Workspace rail" : "Main navigation"} className={icons ? "workspace-links icon-links" : "workspace-links"}>
    <NavLink to={"/login" + globalSearch(search)} onClick={close} aria-label="Account access" title={icons ? "Account access" : undefined} className="auth-nav-entry"><LogIn aria-hidden="true" /><span>Account access</span></NavLink>
    {secondaryNavigation.map(link => <NavLink key={link.path} to={link.path + globalSearch(search)} onClick={close} aria-label={link.label}><PanelRight aria-hidden="true" /><span>{link.label}</span></NavLink>)}
    {modules.map(({ id, path, label, icon: Icon }) => <Link key={path} to={path + globalSearch(search)} onClick={close} aria-label={label} title={icons ? label : undefined} aria-current={active?.id === id ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}

/** A module with sections owns section navigation; the remaining routes keep their own anchors. */
function ModuleSections({ close, compact = false }: { close?: () => void; compact?: boolean }) {
  const { pathname, search } = useLocation();
  const deviceClass = useDeviceClass();
  const navigate = useNavigate();
  const module = resolveModule(pathname);
  const current = resolveSection(module, pathname);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if ((deviceClass === "M" || module?.alignSections?.(pathname)) && navigation.current?.closest(".module-strip")) {
      const rail = navigation.current;
      rail.style.paddingInlineEnd = "";
      rail.querySelector('[aria-current="location"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
      // Start on a complete chip, not the last few letters of the preceding section. A small end
      // inset permits this alignment near the last section without moving the selected chip away.
      const left = rail.getBoundingClientRect().left;
      const first = [...rail.querySelectorAll("a")].find(link => link.getBoundingClientRect().left >= left - 1);
      if (first) {
        const offset = rail.scrollLeft + first.getBoundingClientRect().left - left;
        rail.style.paddingInlineEnd = `${Math.max(0, offset - (rail.scrollWidth - rail.clientWidth))}px`;
        rail.scrollLeft = offset;
      }
    }
  }, [current?.path, deviceClass]);
  if (!module?.sections) return null;
  if (compact) return <label className="module-select">Section
    <select value={current?.path ?? module.sections[0].path} onChange={event => { close?.(); navigate(event.target.value + search); }}>
      {module.sections.map(section => <option key={section.path} value={section.path}>{section.label}</option>)}
    </select>
  </label>;
  // The links carry their own class because the DS sidebar scrolls them in a bounded whole-row
  // window of their own, separate from the module list above them (Issues 60 and 102).
  return <nav ref={navigation} className="section-navigation" data-align-sections={module?.alignSections?.(pathname) || undefined} aria-label="Section navigation"><h2>{module?.sectionHeading?.(pathname) ?? "Sections"}</h2>
    <div className="section-navigation-links">{module.sections.map(section => <Link key={section.path} to={section.path + globalSearch(search)} onClick={close} aria-current={current?.path === section.path ? "location" : undefined}>{section.label}</Link>)}</div>
  </nav>;
}

function ModuleDock({ open }: { open: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const { pathname, search } = useLocation();
  const current = resolveModule(pathname)?.id;
  // Vision §3 fixes the phone tab bar for the whole app: Copilot, Inbox, Calendar, Venue and More,
  // where More is the sheet with every module. It is the shell's bar on every route, so no module
  // ships its own tab set and no route pushes a sixth destination into a 320px row (#101).
  const destinations = modules.filter(module => module.dock !== undefined).sort((a, b) => a.dock! - b.dock!);
  // More is a destination too: a reader on Overview, Settings or the kit is standing inside the
  // sheet's half of the app, and the bar says so.
  return <nav className="workspace-links" aria-label="Main navigation">
    {destinations.map(({ id, path, label, icon, dockIcon }) => { const Icon = dockIcon ?? icon; return <Link key={id} to={path + globalSearch(search)} aria-current={current === id ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>; })}
    <button type="button" className="workspace-more-tab" onClick={open} aria-current={current && !destinations.some(module => module.id === current) ? "page" : undefined} aria-label="More"><Ellipsis aria-hidden="true" /><span>More</span></button>
  </nav>;
}

/** TL keeps its section tabs inside the list track, with overflow in the top layer. */
function ListSectionNavigation() {
  const { pathname, search } = useLocation();
  const module = resolveModule(pathname);
  const current = resolveSection(module, pathname);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useDeviceClassLock(open);
  if (!module?.sections) return null;
  const visible = [module.sections[0], current && current !== module.sections[0] ? current : module.sections[1]].filter(Boolean);
  return <div className="module-list-sections">
    <nav className="section-navigation" aria-label="Section navigation">{visible.map(section => <Link key={section.path} to={section.path + globalSearch(search)} aria-current={current?.path === section.path ? "location" : undefined}>{section.label}</Link>)}
      <button ref={trigger} type="button" className="icon-button module-section-trigger" aria-label="More sections" aria-expanded={open} popoverTarget={id}><Ellipsis aria-hidden="true" /></button>
    </nav>
    <div id={id} ref={panel} popover="auto" className="more-popover module-section-popover" onToggle={event => {
      const opened = event.newState === "open";
      setOpen(opened);
      if (opened && panel.current && trigger.current) {
        const bounds = trigger.current.getBoundingClientRect();
        panel.current.style.insetInlineStart = `${Math.max(8, bounds.right - panel.current.offsetWidth)}px`;
        panel.current.style.insetBlockStart = `${bounds.bottom + 4}px`;
        enterSurface(panel.current, trigger.current);
      }
    }}><ModuleSections close={() => panel.current?.hidePopover()} /></div>
  </div>;
}

/**
 * Every shell link retains the simulator's own preferences and nothing else. A module or section
 * destination is a page, not a view of one, so the screen being left must not send its filters
 * along: `/venue/orders?q=Pier%201&view=Served` then Inbox landed on `/inbox?q=Pier%201&view=Served`,
 * which rendered "No conversations match your search" beside an empty search box.
 */
export function shellSearch(search: string) {
  const next = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search)) if (key.startsWith("xp")) next.set(key, value);
  const query = next.toString();
  return query ? "?" + query : "";
}

/** Renders whatever sections a route declares; the shell holds no module vocabulary of its own. */
function SectionNavigation({ close, rail = false, strip = false }: { close?: () => void; rail?: boolean; strip?: boolean }) {
  const { pathname, search, hash } = useLocation();
  const deviceClass = useDeviceClass();
  const route = resolveSections(pathname, deviceClass);
  const navigation = useRef<HTMLElement>(null);
  const [pageSize, setPageSize] = useState(2);
  const [browsing, setBrowsing] = useState<{ path: string; page: number }>();
  useLayoutEffect(() => {
    const node = navigation.current;
    if (!rail || !node) return;
    setBrowsing(undefined);
    const measure = () => setPageSize(node.clientWidth < 330 ? 1 : 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [rail, route?.heading, pathname]);
  if (resolveModule(pathname)?.sections) return <ModuleSections close={close} />;
  if (!route) return null;
  const parameters = new URLSearchParams(search);
  // A section owns the pathname it targets and any prefix it declares, and the most specific owner
  // wins, so a module root does not stay current on every one of its own sub-routes.
  const covers = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");
  const reach = (section: RouteSection) => [section.path ?? section.id, ...(section.owns ?? [])].filter(covers).sort((a, b) => b.length - a.length)[0];
  const owner = route.sections.map(reach).filter(Boolean).sort((a, b) => b!.length - a!.length)[0];
  // The paged rail needs an index to page to, so ownership answers for a route list and the
  // parameter or the anchor answers for the other two kinds.
  const selected = route.kind === "route"
    ? route.sections.findIndex(section => Boolean(owner) && reach(section) === owner)
    : route.sections.findIndex(({ id }, index) => route.param ? (parameters.get(route.param.name) ?? route.param.fallback) === id : hash === "#" + id || (!hash && index === 0));
  const paged = rail;
  const lastPage = Math.ceil(route.sections.length / pageSize) - 1;
  const page = Math.min(lastPage, browsing?.path === pathname ? browsing.page : Math.floor(Math.max(0, selected) / pageSize));
  const start = paged ? page * pageSize : 0;
  // A bounded strip leaves room for the selected destination and an explicit overflow control, so it
  // is always one row: the venue declares ten sections and a wrapping strip would take three rows of
  // a 768px tablet (#59). Both tablet classes permit anchored popovers, so nothing becomes
  // unreachable. A phone pages the same list instead, two entries at a time (#61).
  const bounded = strip && !paged && route.kind === "route";
  const limit = deviceClass === "TP" ? 3 : 4;
  const within = paged ? route.sections.slice(start, start + pageSize) : route.sections;
  const entries = within.filter((section, index) => !bounded || index < limit || reach(section) === owner);
  const overflow = within.filter(section => !entries.includes(section));
  const links = entries.map((section, index) => {
    const { id, label, path } = section;
    if (route.kind === "route") {
      const target = path ?? id;
      // A section link starts its screen fresh: only shell-wide preview state crosses a route
      // boundary, and a filter or capture state belongs to the screen it was set on.
      const next = new URLSearchParams(target === pathname ? parameters : globalSearch(search));
      for (const key of ["state", "q", "status", "priority", "grouping", "record", "layout"]) next.delete(key);
      const current = Boolean(owner) && reach(section) === owner;
      return <Link key={id} onClick={close} aria-current={current ? "location" : undefined} to={target + "?" + next}>{label}</Link>;
    }
    // A parameter or anchor list stays on its own screen, so it keeps that screen's parameters; when
    // it targets a different pathname, only the shell-wide preview state crosses with it.
    const next = new URLSearchParams((path ?? route.path ?? pathname) === pathname ? parameters : globalSearch(search));
    if (route.param) { next.set(route.param.name, id); for (const key of route.param.clears ?? []) next.delete(key); }
    const current = selected === start + index;
    return <Link key={id} onClick={() => {
      close?.();
      // An anchor inside the narrow DS inspector must reveal its owning surface first.
      const surface = route.kind === "anchor" ? document.getElementById(id)?.closest(".workspace-sheet") : null;
      if (surface && !surface.hasAttribute("open")) document.querySelector<HTMLButtonElement>('.route-pane[data-active="true"] .inspector-toggle')?.click();
    }} aria-current={current ? "location" : undefined} to={(path ?? route.path ?? pathname) + "?" + next + (route.kind === "anchor" ? "#" + id : "")}>{label}</Link>;
  });
  // The paged rail lays its two links between the pager buttons, so its links are the nav's own grid
  // children; every other class wraps them in the scrollable list the sidebar reveal effect reads.
  return <nav ref={navigation} className="section-navigation" aria-label="Section navigation" data-home-section-control={rail || undefined} data-section-pager={paged || undefined} data-bounded={bounded || undefined} style={paged ? { gridTemplateColumns: `44px repeat(${entries.length}, minmax(0, 1fr)) 44px` } : undefined}><h2>{route.heading}</h2>
    {paged
      ? <>
        <button type="button" className="icon-button" aria-label="Previous sections" disabled={page === 0} onClick={() => setBrowsing({ path: pathname, page: page - 1 })}><ChevronLeft aria-hidden="true" /></button>
        {links}
        <button type="button" className="icon-button" aria-label="Next sections" disabled={page === lastPage} onClick={() => setBrowsing({ path: pathname, page: page + 1 })}><ChevronRight aria-hidden="true" /></button>
      </>
      : bounded
        // A bounded strip lays its tabs and its overflow control in one row, so they are the nav's
        // own children; every other form wraps them in the scrollport the sidebar reveal effect reads.
        ? <>{links}{overflow.length > 0 && <SectionOverflow sections={overflow} />}</>
        : <div className="section-navigation-links">{links}</div>}
  </nav>;
}

/** The sections a bounded strip could not show, in an anchored layer beside the last visible tab. */
function SectionOverflow({ sections }: { sections: RouteSection[] }) {
  const id = useId();
  const { search } = useLocation();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useDeviceClassLock(open);
  return <>
    <button ref={trigger} type="button" className="section-overflow-trigger" popoverTarget={id} aria-expanded={open}>More sections<Ellipsis aria-hidden="true" /></button>
    <div ref={panel} id={id} popover="auto" className="section-overflow" onToggle={event => {
      const opened = event.newState === "open";
      setOpen(opened);
      if (opened && panel.current && trigger.current) {
        const rect = trigger.current.getBoundingClientRect();
        panel.current.style.insetBlockStart = `${rect.bottom}px`;
        panel.current.style.insetInlineStart = `${Math.min(rect.left, window.innerWidth - panel.current.offsetWidth - 16)}px`;
        enterSurface(panel.current, trigger.current);
      }
    }}>{sections.map(section => <Link key={section.id} to={(section.path ?? section.id) + globalSearch(search)} onClick={() => panel.current?.hidePopover()}>{section.label}</Link>)}</div>
  </>;
}

/** Anchored menu for classes that have room for it; it arrives from its trigger and dismisses natively. */
function MoreMenu() {
  const { pathname } = useLocation();
  const home = isHomePath(pathname);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useDeviceClassLock(open);
  const dismiss = () => panel.current?.hidePopover();
  return <>
    <button ref={trigger} type="button" className="workspace-more icon-button" aria-label="More" aria-expanded={open} popoverTarget={id}><Ellipsis aria-hidden="true" /></button>
    <div ref={panel} id={id} popover="auto" className="more-popover" data-home-menu={home || undefined} onToggle={event => {
      const opened = event.newState === "open";
      setOpen(opened);
      if (opened) enterSurface(panel.current, trigger.current);
    }}><Navigation close={dismiss} />{!home && <SectionNavigation close={dismiss} />}</div>
  </>;
}

export function AppShell() {
  const deviceClass = useDeviceClass();
  const busy = useDeviceClassBusy();
  const { pathname, search, hash } = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const restoreMenuFocus = useRef(false);
  const { anyOpen, host } = useSheetHost();
  const workspace = useRef<HTMLDivElement>(null);
  const railToggle = useRef<HTMLButtonElement>(null);
  const flip = useLayoutFlip();
  useInputObserver();
  usePressSurface(workspace);
  useEffect(() => {
    if (hash && !menuOpen) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash, pathname, menuOpen]);
  const activeModule = resolveModule(pathname);
  // A module carries its own navigation when it owns route sections, as inbox does, or when its
  // sections are views the route model declares, as the calendar's and the copilot's are. Those are
  // the modules that give the phone its own dock. Work keeps the shared dock and reaches its
  // sections from the route's own control, which is what #60 captured, so it joins only
  // `moduleRoute`: the set the tablet reaches other modules from the title for.
  const moduleNavigation = activeModule?.moduleNavigation || Boolean(activeModule?.sections);
  const workRoute = Boolean(activeModule?.sectionStrip);
  // The overview owns the workspace roll-up, the notification centre, the workspace settings and
  // the recovery pages. The calendar and the inbox claim settings prefixes of their own, so a
  // route they own is theirs rather than the overview's (#61).
  const home = Boolean(activeModule?.railSections?.(pathname));
  // A module that owns its own route tree reaches its siblings from the TP title, so that class
  // shows one navigation row: the module's own sections, never a module list above them (#59).
  const moduleRoute = moduleNavigation || workRoute || Boolean(resolveSections(pathname, deviceClass)?.module);
  // Vision §3 gives TP one top bar: the title is the trigger of the module sheet, on every route.
  // Only modules that owned their own route tree had it, and every other route got a row of ten
  // module links in the bar instead, which does not fit 768px and never did: the row measured 1019px
  // of content in 733px of space, so the workspace reported 1037 against the viewport and the
  // overflow gate failed every capture of the kit, settings and the configurator (#101).
  const moduleSheet = deviceClass === "TP";
  const mobile = deviceClass === "M";
  const wide = deviceClass === "DW";
  const tablet = deviceClass === "TL";
  const sidebar = deviceClass === "DS" || wide || (tablet && expanded);
  useEffect(() => {
    const navigation = workspace.current?.querySelector(".workspace-sidebar-navigation");
    if (!navigation) return;
    const reveal = () => navigation.querySelectorAll('[aria-current="location"], [aria-current="page"]').forEach(current => {
      current.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      // `scrollIntoView` aligns to the nearest edge the engine computes, which is not always inside
      // a bounded scrollport: with the venue's ten sections it stopped 14px short of the window and
      // left the current entry clipped (#59). Finish the reveal by arithmetic, against whichever
      // ancestor actually scrolls, which is what the DS layout gate measures.
      // Bounded at the navigation itself. Unbounded, any ancestor with clipped overflow taller than
      // its box would be adopted as the scrollport and scrolled on every route change and resize.
      let port = current.parentElement;
      while (port && port !== navigation && port.scrollHeight <= port.clientHeight) port = port.parentElement;
      if (!port || (port === navigation && port.scrollHeight <= port.clientHeight)) return;
      const bounds = port.getBoundingClientRect();
      const item = current.getBoundingClientRect();
      if (item.bottom > bounds.bottom) port.scrollTop += item.bottom - bounds.bottom;
      else if (item.top < bounds.top) port.scrollTop -= bounds.top - item.top;
    });
    reveal();
    // The wrapper keeps the sidebar's height whatever it holds, so watching it alone misses the
    // list growing inside it: a module with ten sections (#59) revealed its current entry against a
    // shorter scrollport and left it 14px under the edge. Watch the scrollports themselves too.
    const observer = new ResizeObserver(reveal);
    observer.observe(navigation);
    for (const port of navigation.querySelectorAll(".section-navigation-links, .workspace-links")) observer.observe(port);
    return () => observer.disconnect();
  }, [pathname, search, hash, deviceClass, sidebar]);
  const overlayActive = busy || menuOpen || anyOpen;
  const owner = resolveBottomRegion([{ owner: "overlay", active: overlayActive }, { owner: "tab-bar", active: mobile }]);
  session.useSession();
  const activeSection = resolveSection(activeModule, pathname);
  // A route that stays out of primary navigation names itself; otherwise the module names the screen.
  const title = secondaryTitles[pathname] ?? activeModule?.label ?? "Workspace";
  // A module with sections names the section beside its own name; everything else keeps the workspace label.
  const subtitle = activeSection?.label ?? brand.subtitle;
  // Compact classes share a strip; TL keeps section tabs inside the list track.
  const strip = Boolean(activeModule?.sections) && (mobile || deviceClass === "TP");
  // A module without route families still has sections to show on TP: the copilot's and the
  // calendar's are views, and the top strip is where a 768px class reads them. Which classes dock
  // that strip is the module's declaration to make, not the shell's: `strip` in the route section
  // model names them, so copilot's TL row and the venue's come from the same rule (#59).
  const routeSections = resolveSections(pathname, deviceClass);
  const declaredStrip = routeSections?.strip?.includes(deviceClass) ?? false;
  const topStripSections = activeModule?.moduleNavigation || declaredStrip;
  const closeMenu = useCallback(() => { restoreMenuFocus.current = true; setMenuOpen(false); }, []);
  const navigateFromMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    // The bottom bar becomes focusable only after the sheet releases its host.
    if (!restoreMenuFocus.current || overlayActive) return;
    restoreMenuFocus.current = false;
    workspace.current?.querySelector<HTMLButtonElement>(".workspace-more-tab, .workspace-module-switch, .workspace-more")?.focus({ preventScroll: true });
  }, [overlayActive]);
  const toggleSidebar = (detail: number) => {
    const next = !expanded;
    flip(routePaneTargets(workspace.current), () => setExpanded(next), { input: inputFor(detail) });
    if (next) enterSurface(workspace.current?.querySelector(".workspace-sidebar") ?? null, railToggle.current, { input: inputFor(detail) });
  };
  return <MotionProvider><SheetHostProvider host={host}>
    {/* A modal sheet already makes this subtree inert; aria-hidden mirrors that for assistive technology
        without dropping the focus the sheet has to hand back on close. */}
    <div ref={workspace} className="workspace" data-xp-shell="" data-module={activeModule?.id ?? pathname.split("/")[1] ?? modules[0]?.id} data-device-class={deviceClass} data-expanded={expanded} data-bottom-owner={owner ?? "none"} aria-hidden={anyOpen || undefined}>
      <a className="xp-shell-skip" href="#workspace-content">Skip to content</a>
      {(wide || tablet) && <aside className="workspace-rail"><NavLink to={"/" + globalSearch(search)} aria-label="xpresso_demo2_otpchat home" className="workspace-mark">{brand.mark}</NavLink><Navigation icons />{tablet && <button ref={railToggle} type="button" className="icon-button" aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={expanded} onClick={event => toggleSidebar(event.detail)}>{expanded ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</button>}</aside>}
      {sidebar && <aside className="workspace-sidebar"><div className="workspace-brand"><span className="workspace-brand-mark" aria-hidden="true">{brand.mark}</span><div><strong>{brand.workspaceName}</strong><p>{brand.subtitle}</p></div></div><div className="workspace-sidebar-navigation">{!(wide && (activeModule?.galleryNavigation || moduleRoute || routeSections?.module)) && <Navigation />}{(!activeModule?.galleryNavigation || wide) && <SectionNavigation />}</div><div className="workspace-context"><h2>Workspace</h2><p>{brand.context}</p><p>{brand.contextNote}</p></div></aside>}
      <div className="workspace-stage">
        <header className="workspace-header"><div className="workspace-heading">{moduleSheet ? <button type="button" className="workspace-module-switch" aria-label="Choose module" aria-current={activeModule ? "page" : undefined} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>{title}<ChevronRight aria-hidden="true" /></button> : <strong>{title}</strong>}<span>{subtitle}</span></div><div className="workspace-tools">
          {/* The phone's More is its fifth tab, so the header carries none. The overview reaches its
              navigation through the same sheet on TP, where an anchored popover would open beside
              the module switch that already opens one (#61). */}
          {/* The phone's More is its fifth tab and TP's is its title, so neither carries a second
              control; the wide classes keep the anchored menu. */}
          {mobile || moduleSheet ? null : <MoreMenu />}
          <ThemeMenu /></div></header>
        {deviceClass === "TP" && topStripSections && <div className="workspace-topnav" data-sections=""><SectionNavigation strip /></div>}
        {deviceClass !== "TP" && declaredStrip && !sidebar && <div className="section-strip"><SectionNavigation strip /></div>}
        {/* The overview pages its own screens on a phone rather than scrolling them (#61). */}
        {mobile && home && <div className="workspace-topnav home-section-strip"><SectionNavigation rail /></div>}
        {deviceClass === "TP" && activeModule?.galleryNavigation && <div className="kit-section-strip"><SectionNavigation /></div>}
        {/* TP and M keep a module's own section navigation directly above the route. */}
        {strip && <div className="module-strip" data-strip="links"><ModuleSections /></div>}
        {/* The strip is the secondary navigation for a class with no sidebar. Where the sidebar is
            present it already carries the same section tree, and DS showed both: two identical lists
            of six links, each marking the same entry current, spending about 50px of the tightest
            desktop height on navigation already fully visible beside it. */}
        {workRoute && ["TP", "TL", "DS"].includes(deviceClass) && !sidebar && <div className="kit-section-strip"><SectionNavigation /></div>}
        <main id="workspace-content" tabIndex={-1} className="workspace-content"><RouteStage /></main>
      </div>
      {mobile && <div className="workspace-tabs" data-xp-region="bottom" inert={overlayActive} aria-hidden={overlayActive || undefined}><ModuleDock open={() => setMenuOpen(true)} /></div>}
    </div>
    {(mobile || moduleSheet) && <Sheet open={menuOpen} onClose={closeMenu} title="Workspace navigation" description="Open a workspace section." closeLabel="Close navigation">
      <Navigation close={navigateFromMenu} />{!home && <SectionNavigation close={navigateFromMenu} />}
    </Sheet>}
  </SheetHostProvider></MotionProvider>;
}

// Only the shell selects pane anatomy. Content receives a local xp-slot.
/**
 * Which surface the inspector actually mounted in. A drawer and a sheet print the pane's title in
 * their own header, so pane content must not repeat it; a docked pane has no header and must carry
 * it. The declared class form cannot answer this: DS declares a docked toggle pane and still
 * mounts a labelled drawer below 1400px, which is how the same heading came to be rendered twice.
 */
const InspectorSurfaceContext = createContext<"docked" | "labelled">("docked");
export const useInspectorSurface = () => useContext(InspectorSurfaceContext);
export type InspectorLabels = { title: string; description: string; show: string; hide: string; close: string; text?: string };
const detailLabels: InspectorLabels = { title: "Details", description: "Context for this workspace item.", show: "Show details", hide: "Hide details", close: "Close details" };

/** DS starts at 1366px; below 1400px the inspector overlays rather than docks, so a third track never
 *  squeezes the two that carry the route. From the calendar module, #57. */
const inspectorMedia = () => window.matchMedia("(min-width: 1400px)");
const subscribeInspectorWidth = (notify: () => void) => {
  const media = inspectorMedia();
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

export function RoutePanes({ list, children, footer, inspector, inspectorSelection, inspectorActions, inspectorLabels = detailLabels, inspectorDefaultOpen = false, detailOpen = true, sheetOpen, onSheetOpenChange }: { list?: ReactNode; children: ReactNode; footer?: ReactNode; inspectorSelection?: string | null; inspector?: ReactNode; inspectorActions?: ReactNode; inspectorLabels?: InspectorLabels; inspectorDefaultOpen?: boolean; detailOpen?: boolean; sheetOpen?: boolean; onSheetOpenChange?: (open: boolean) => void }) {
  const deviceClass = useDeviceClass();
  const hasInspectorRoom = useSyncExternalStore(subscribeInspectorWidth, () => inspectorMedia().matches, () => true);
  const overlayInspector = deviceClass === "DS" && !hasInspectorRoom;
  const { pathname } = useLocation();
  // Outgoing outlets remain mounted while Router already exposes the destination.
  // First-paint effects belong to this pane's route, never the next route's name.
  const firstPaintRoute = useRef(pathname).current;
  // A pane that is the point of the route starts docked; a supporting pane starts closed.
  const [showInspector, setShowInspector] = useState(inspectorDefaultOpen);
  // A screen may own the sheet (the calendar drives it from its own selection) or leave it to the
  // pane. `inspectorSelection` is the third case: a record arriving in the URL opens the pane the
  // class docks it in, and a route change closes it.
  const [ownSheetOpen, setOwnSheetOpen] = useState(Boolean(inspectorSelection));
  const sheetIsOpen = sheetOpen ?? ownSheetOpen;
  const setSheet = useCallback((open: boolean) => {
    if (onSheetOpenChange) onSheetOpenChange(open);
    else setOwnSheetOpen(open);
  }, [onSheetOpenChange]);
  useEffect(() => {
    if (pathname !== firstPaintRoute) { setOwnSheetOpen(false); return; }
    if (inspectorSelection) { setOwnSheetOpen(true); setShowInspector(true); }
  }, [inspectorSelection, pathname, firstPaintRoute]);
  const panes = useRef<HTMLDivElement>(null);
  const listPane = useRef<HTMLElement>(null);
  const inspectorToggle = useRef<HTMLButtonElement>(null);
  const flip = useLayoutFlip();
  const mobile = deviceClass === "M";
  const docked = deviceClass === "DW" || (deviceClass === "DS" && !overlayInspector && showInspector);
  const showList = Boolean(list) && (!mobile || !detailOpen);
  const closeSheet = useCallback(() => setSheet(false), [setSheet]);
  useFirstPaintStagger(listPane, firstPaintRoute, showList);
  const toggleInspector = (detail: number) => {
    const next = !showInspector;
    flip(routePaneTargets(panes.current), () => setShowInspector(next), { input: inputFor(detail) });
    if (next) enterSurface(panes.current?.querySelector(".route-inspector") ?? null, inspectorToggle.current, { input: inputFor(detail) });
  };
  return <div ref={panes} className="route-panes" data-has-list={Boolean(list)} data-inspector={Boolean(inspector && docked)}>
    {showList && <section ref={listPane} className="route-list xp-slot" aria-label="Conversations">{deviceClass === "TL" && <ListSectionNavigation />}{list}</section>}
    {(!mobile || !list || detailOpen) && <section className="route-detail xp-slot">
      {!showList && deviceClass === "TL" && <ListSectionNavigation />}
      <div className="pane-body">
        {inspector && deviceClass !== "DW" && <div className="pane-actions">{deviceClass === "DS" && !overlayInspector
          ? <button ref={inspectorToggle} type="button" className="inspector-toggle" onClick={event => toggleInspector(event.detail)} aria-expanded={showInspector} aria-controls="route-inspector" aria-label={inspectorLabels.text ? undefined : showInspector ? inspectorLabels.hide : inspectorLabels.show}><PanelRight aria-hidden="true" />{inspectorLabels.text ? <span>{inspectorLabels.text}</span> : null}</button>
          : <button ref={inspectorToggle} type="button" className="inspector-toggle" onClick={() => setSheet(true)} aria-expanded={sheetIsOpen} aria-label={inspectorLabels.text ? undefined : inspectorLabels.show}><PanelRight aria-hidden="true" />{inspectorLabels.text ? <span>{inspectorLabels.text}</span> : null}</button>}</div>}
        {children}
      </div>
      {footer && <footer className="route-footer">{footer}</footer>}
    </section>}
    {inspector && docked && <aside id="route-inspector" className="route-inspector xp-slot" aria-label={inspectorLabels.title}><InspectorSurfaceContext.Provider value="docked">{inspector}</InspectorSurfaceContext.Provider></aside>}
    {inspector && deviceClass !== "DW" && (deviceClass !== "DS" || overlayInspector) && <Sheet open={sheetIsOpen} onClose={closeSheet} axis={deviceClass === "TL" || overlayInspector ? "x" : "y"} title={inspectorLabels.title} description={inspectorLabels.description} closeLabel={inspectorLabels.close} actions={inspectorActions}><InspectorSurfaceContext.Provider value="labelled">{inspector}</InspectorSurfaceContext.Provider></Sheet>}
  </div>;
}
