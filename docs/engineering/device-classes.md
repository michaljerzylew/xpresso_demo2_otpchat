# Device classes

Issue #36 adds `@xp/runtime` and five application shell forms. The classification describes the window, not the hardware. The runtime is original repository code; the four vendored packages retain their provenance.

| Class | Width in CSS pixels | Shell anatomy |
|---|---|---|
| M | below 600 | Top bar, safe-area bottom tabs, and the section rail under the top bar per vision §3: the inbox chip rail, the overview's paged rail; one inbox pane at a time; module overflow in a bottom sheet |
| TP | 600–839 | Compact top bar and horizontal navigation; inbox list and detail |
| TL | 840–1199 | Left icon rail with a sidebar expansion control; list and detail |
| DS | 1200–1599 | Expanded sidebar, content, optional details inspector |
| DW | 1600 and above | Icon rail, sidebar, content, inspector; inbox adds a separate conversation list |

A coarse pointer in portrait orientation at 840–899 CSS pixels resolves to TP. Fine pointers, landscape windows and widths of 900 or more do not use that tie-break. Hover and pointer capability are independent of width.

TP reserves a 320–360px inbox list track (`clamp(320px, 45%, 360px)`), with the remaining width assigned to detail, per vision §3 (#77). DS and DW reserve a 256px sidebar and a 336px inspector track, within the vision's 240–280px and 320–360px ranges. TL's optional sidebar remains 176px. Dashboard collections use two compact lines per item through TP; a three-column row is available only when the local content container reaches 840px. Controls use 8px radii, cards 12px and panes/sheets up to 16px; overlay headings stay at 16px across forms. The Settings save status precedes its button so scrolling that button into view keeps confirmation clear of the mobile dock.

Desktop dashboard rows share grid tracks through a subgrid, keeping authors aligned regardless of status-label width. Open and Resolved chips pair 12px text with CSS dots and the theme's warning/success semantic colours. On mobile, the conversation heading aligns with its inspector control and the back button follows the title and metadata.

## Runtime contract

`resolveDeviceClass({ width, height, pointer, hover, orientation }, { previous, overlayOpen, dragActive })` is pure. The second argument is optional. While either interaction flag is true, it retains `previous`; without a prior class it resolves the initial class normally. There is no extra pixel deadband, so idle classification uses the documented boundaries exactly.

`DeviceClassProvider` measures the browser at first client render (SSR defaults to M), listens for resize, orientation and input media-query changes, and exposes `useDeviceClass()`. It publishes these values on the document's `<html>`:

| Attribute / token | Value |
|---|---|
| `data-xp-class`, `--xp-class` | M, TP, TL, DS or DW |
| `data-xp-input`, `--xp-input` | coarse, fine or none |
| `--xp-can-hover` | 1 or 0 |
| `--tap-min` | 24px for fine; 44px for coarse or no primary pointer |

An explicit `deviceClass` prop can select a form in tests or nested shell previews. Nested providers do not overwrite document tokens. Primitive device-class exports now point to the same runtime context; there is no second width detector.

`useDeviceClassLock(active)` acquires a reference-counted lock. `AdaptiveOverlay` and `SnapRail` call it for open overlays and pointer dragging, and the shell's own sheet and More menu hold it for as long as they are open. Native HTML dragstart/end/drop also lock the root provider. Multiple locks compose; release is idempotent, and releasing the final lock applies the latest pending class. A custom pointer gesture must call this hook from its active state, including cancellation. `useDeviceClassBusy()` lets the shell yield the bottom region while interaction locks are active.

Input tokens continue reflecting the actual input capability while the form is locked. The root provider restores previous document attributes and inline tokens on unmount.

## One route, five forms

Route components in `apps/web/src/routes` own data, selection, drafts and form state. `RoutePanes` in the shell receives their list, detail and inspector slots. It chooses the form, mounts `xp-slot` wrappers and relocates supporting information into the shell's modal sheet on compact classes (M and TP bottom sheet, TL side drawer). Content geometry uses the slot's container, with no viewport reads or width media queries in routes.

Why: the existing generic AppShell gives M and TP the same bottom-tab anatomy. The app-specific shell composes a docked header, its own sheet and region arbitration to implement the Issue's distinct TP form and DW multi-pane form without changing unrelated vendored shells. Since #71 the sheet is the shell's own `<dialog>` driven by `@xp/motion`, so one system owns all shell movement; see [motion wiring](motion-wiring.md).

The web Two-Axis test recursively scans app sources outside `src/shell` for viewport reads and viewport media queries. This guards the demo route content; it does not claim to audit unused upstream blocks. The runtime's Vitest suite covers boundaries, tie-breaks, interaction locks, release order and simulator dimensions.

The demo routes use local sample data. Inbox search, selection and replies work in memory; settings use native form validation and a local save confirmation. Resizing the shell retains route state. No API or persistence across reloads is claimed.

The header keeps one Color mode ghost button at its far right. Sun/MoonStar switches directly between light and dark; Settings > Profile > Appearance and language retains Light/Dark/System. Control floors are 44px on M/TP, 40px on TL and 36px on DS/DW with a fine pointer; coarse-pointer chrome retains 44px; desktop headers are 56px. Inspector controls are compact labelled icons beside the pane heading, with space reserved in the heading, rather than a separate toolbar band. A docked inspector occupies a grid track rather than covering content. TL expands and collapses its sidebar and DS toggles its inspector through a Flip layout transition that frees the track immediately on collapse; DW keeps its inspector visible.

Section navigation lives in the sidebar when the class has one. Otherwise it takes the form its class gives it, and the two never appear together: a second copy of the same links marks the same entry current twice and costs height the tightest desktop window does not have. A module whose sections are screen families of its own carries them itself: Inbox exposes Conversations, Tickets, Contacts, Knowledge, Agents, Reports and Helpdesk settings as a scrolling chip rail on M, a strip directly above the panes on TP, tabs inside the list track with popover overflow on TL, and the section sidebar on DS and DW. Conversation folders and team inboxes belong to the Inbox inspector, and they fold behind a summary on the two 768px classes. A module whose sections are views declares them in the route model instead: Work, Calendar and Copilot read them from a strip under the top bar on TP, on TL, and on a DS with no sidebar. Overview and settings anchors keep the shell's sidebar or More sheet and menu. The More menu carries primary navigation and the route's own sections together, so its content already exceeds a 768px screen. The layer is bounded by the viewport rather than by its content, ending above the bottom edge and scrolling the rest of the list inside itself for any number of destinations; its offset from the top is written once and the bound derived from it, so the two cannot drift apart. Its rows take the sidebar's 34px fine-pointer height on TL, DS and DW, and keep the 44px touch height on TP, which opens the same layer: at 44px everywhere, twelve rows overflowed a DS layer by 31px and drew the last one at half height against the border, scrollable and reachable but reading as breakage. Every state the app ships now fits the layer whole on all four classes. `test:browser:offers-round5` measures the resting box, the rows the bottom edge would bisect and the reachability of the last entry, on TL, DS and DW in both modes, with two destinations beyond what the app ships. On Work and the shared shell, M keeps five safe-area dock destinations: Overview, Calendar, Inbox, Settings and Kit. The header control opens the module sheet and is labelled Workspace navigation on Work. Inbox, Calendar and Copilot use the module dock instead: Copilot, Inbox, Calendar, Venue and More. Sidebar navigation has a bounded scrollport; the workspace context occupies separate space below it so links cannot slide behind the footer, and each scrollport keeps a visible scrollbar while it overflows. Route changes reveal the active section. DS uses independent primary and section scroll windows (round 5, Issues #60 and #102). At 1366x768 the shared navigation region measures 540.734px: eight primary rows (seven modules plus Account access) occupy 256px, and the section-link window is 224px. Work has six 32px section rows (192px), so all fourteen links fit at the current count. Calendar and Copilot each have four section rows (128px). Inbox has seven (224px), which fills its window exactly, and the helpdesk settings tree has twelve and scrolls inside the same window. Longer lists scroll in whole-row windows; no fixed destination count is assumed. Primary M navigation remains in the safe-area tab bar. Shell and route surfaces use semantic theme colours; the mounted dashboard metric primitive also uses semantic colours in every container-query variant.

Pane anatomy is the shell's alone, and the shell now says which surface it used: `useInspectorSurface()` reports `labelled` when the inspector mounted in a sheet or drawer whose header prints its title, and `docked` when it occupies a grid track with no header. Pane content asks that rather than inferring it from a device class, because DS declares a docked toggle pane and still opens a labelled drawer below 1400px, which is how offers came to print each inspector's heading twice in that one state.

## Simulator

Open `/inbox?xp=M` (or TP/TL/DS/DW). The host renders an iframe with a real viewport of the selected canonical dimensions. Its URL includes `xp-frame=1` to prevent nesting; route navigation preserves simulation parameters. The iframe gets the runtime's HTML tokens. Width changes form; pointer and hover still reflect the actual browser capabilities.

A small floating device selector is anchored bottom-right in development builds or when the URL has `?xp`. It is absent inside preview frames. The native select supports keyboard focus and selection; Auto removes the override, and M/TP/TL/DS/DW select canonical viewports. The selector floats over the application without reserving a full-width bottom strip; on M it sits above the safe-area tab bar. Open app overlays hide it. The preview host also uses its full height for the scrollable iframe canvas. The iframe border does not subtract from the requested viewport dimensions. Production without `?xp` has no selector. Invalid class strings fall back to Auto. A preview is a separate document and restarts local demo state when its class is changed.

## Browser evidence

Build the generated package styles before starting the application:

```sh
pnpm -r build
pnpm --filter web dev --host 127.0.0.1 --port 5173
# In another terminal:
pnpm --filter web evidence
```

The harness uses system Chrome through `chromium.launch({ channel: "chrome" })`, without downloading browsers or installing packages. It connects to `http://127.0.0.1:5173`; set `XP_BASE_URL` to override.

It checks shell anatomy, document and header/tab descendant overflow (any element with `scrollWidth > clientWidth` fails), 56px DW, 64px other desktop/tablet and 72px mobile conversation rows, floating-selector geometry without a reserved band, visible text contrast (minimum 4.5:1 in both modes), settings, replies, navigation, pane selection, TL sidebar collapse, DS inspector toggle, DW contextual filtering, overlay resize locking and the iframe's actual width. Keyboard checks press the first Tab, verify initial sheet focus after 700ms, traverse both directions and verify focus returns to the trigger. M/TP controls must measure at least 44px in both dimensions, including inspector links in sheets; only the clipped skip link is exempt. Page exceptions and same-origin HTTP responses with status >=400 fail the suite, including preview-frame requests. All text nodes are measured against their effective composited background; native form values inherit the same semantic ink/surface pair.

Thirty-six route screenshots plus six menu/simulator screenshots are saved under `apps/web/evidence/` and remain gitignored. Issue #39 adds two more, `install-wide.png` and `install-narrow.png`, captured at `/?xp-frame=1` so the development-only device selector is absent; they become the manifest screenshots (see [PWA](pwa.md)). Each route filename uses `<route>-<class>-<mode>.png` (the extra 320px set uses `M-320`), where route is `dashboard` (the / route), `inbox` or `settings`, and mode is `light` or `dark`.

| Class | Viewport | Visual verdict for each route, in both modes |
|---|---|---|
| M | 320×568 and 390×844 | Overview has a compact metric row; inbox uses a single selectable list; settings scrolls within the reserved tab-bar boundary. |
| TP | 768×1024 | Horizontal navigation stays docked; inbox preserves list/detail panes; settings has readable full-width fields. |
| TL | 1024×768 | Persistent rail reserves content width; inbox splits cleanly; settings remains scrollable and usable beside the rail. |
| DS | 1366×768 | Expanded sidebar and section navigation are distinct from content; inspector toggle reserves a separate track. |
| DW | 1920×1080 | Rail, sidebar, content and inspector are separate tracks; inbox adds its own list track; form and message measures remain bounded. |

Round 2 replaces Unicode navigation glyphs with Lucide icons and aligns conversation initials, subject, message preview and timestamp in compact rows. Shell/route spacing uses spacing tokens; stable control geometry and typography do not grow with the spacing scale. The browser suite additionally captures `navigation-M-dark.png`, color-mode popovers at 320/390/768, and M/TP preview hosts. The inspection verdict and required local checks are recorded in the session journal. No API or reload persistence for demo data is claimed. Motion is wired into these shells by Issue #71 and documented in [motion wiring](motion-wiring.md).
