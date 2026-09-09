import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RadioGroup, SegmentedControl, Tabs } from "@xp/primitives";
import { useDeviceClass } from "@xp/runtime";
import { generateRamp, cssColor, isThemePreference, type ColorFamily } from "@xp/theme";
import { Check, Copy, Download, RotateCcw, Redo2, Undo2, Upload } from "lucide-react";
import {
  chromaRange, fontCatalogue, fontRoles, hueRange, neutralChromaRange, presetNames, scaleRanges,
  matchesPreset, stateFromPreset, contentWidths, sidebarModes, railStyles, motionIntensities,
  type ConfiguratorState, type FontRole, type PresetName,
} from "./config";
import { encodeState, normalizeState } from "./codec";
import { configuratorGroups, groupAnchor } from "./groups";
import { failures, familyGuard, formatRatio, minimumRatio } from "./guard";
import { exportConfigSnippet, exportCss, exportFileName, exportJson } from "./export";
import { Ramp, Row, Slider, GuardBadge } from "./controls";
import type { Configurator } from "./useConfigurator";

const familyLabel: Record<ColorFamily, string> = {
  primary: "Primary", accent: "Accent", neutral: "Neutral",
  success: "Success", warning: "Warning", danger: "Danger",
};

const presetLabel: Record<PresetName, string> = {
  graphite: "Graphite", paper: "Paper", aurora: "Aurora", mono: "Mono", warm: "Warm", midnight: "Midnight",
};

const times = (value: number) => value.toFixed(2) + "×";
const degrees = (value: number) => Math.round(value) + "°";
const chroma = (value: number) => value.toFixed(3);

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Group({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <section className="cfg-group" id={id}>
    <header className="cfg-group__head"><h3>{title}</h3><p>{description}</p></header>
    {children}
  </section>;
}

function PresetPicker({ state, onPick }: { state: ConfiguratorState; onPick: (preset: PresetName) => void }) {
  return <RadioGroup.Root className="cfg-presets" value={state.preset} onValueChange={value => onPick(value as PresetName)} aria-label="Theme preset">
    {presetNames.map(preset => {
      const seeds = stateFromPreset(preset).colors;
      return <RadioGroup.Item key={preset} value={preset} className="cfg-preset" data-xp-control>
        <span className="cfg-preset__swatches" aria-hidden="true">
          {(["neutral", "primary", "accent", "warning"] as const).map(family =>
            <span key={family} style={{ background: cssColor(generateRamp(seeds[family])[family === "neutral" ? 200 : 600]) }} />)}
        </span>
        <span className="cfg-preset__name">{presetLabel[preset]}</span>
      </RadioGroup.Item>;
    })}
  </RadioGroup.Root>;
}

function FamilyControl({ family, state, guard, onSeed }: {
  family: ColorFamily; state: ConfiguratorState; guard: ReturnType<typeof familyGuard>;
  onSeed: (family: ColorFamily, seed: { hue?: number; chroma?: number }) => void;
}) {
  const neutral = family === "neutral";
  const range = neutral ? neutralChromaRange : chromaRange;
  const worst = guard.worst;
  return <div className="cfg-family">
    <div className="cfg-family__head">
      <h4>{familyLabel[family]}</h4>
      <GuardBadge failing={guard.failing} ratio={worst ? formatRatio(worst.ratio) : "not measured"} label={guard.failing
        ? `${familyLabel[family]}: ${guard.failing} pairing${guard.failing === 1 ? "" : "s"} below ${minimumRatio}:1, lowest ${worst ? formatRatio(worst.ratio) : "unknown"}`
        : `${familyLabel[family]}: lowest contrast ${worst ? formatRatio(worst.ratio) : "unknown"} on ${worst?.text} over ${worst?.background} in ${worst?.mode} mode, above the ${minimumRatio}:1 floor`} />
    </div>
    <Ramp family={family} seed={state.colors[family]} />
    <Slider label={neutral ? "Tint hue" : "Hue"} value={state.colors[family].hue}
      min={hueRange.min} max={hueRange.max} step={hueRange.step} format={degrees}
      onChange={hue => onSeed(family, { hue })} />
    <Slider label={neutral ? "Tint strength" : "Chroma"} value={state.colors[family].chroma}
      min={range.min} max={range.max} step={range.step} format={chroma}
      onChange={value => onSeed(family, { chroma: value })} />
  </div>;
}

function ColourGroup({ configurator }: { configurator: Configurator }) {
  const { state, update, contrast } = configurator;
  const seed = (family: ColorFamily, next: { hue?: number; chroma?: number }) =>
    update("seed:" + family + Object.keys(next), { ...state, colors: { ...state.colors, [family]: { ...state.colors[family], ...next } } }, true);
  return <Group id={groupAnchor("colour")} title="Colour" description="Start from a preset, then move the hue and the intensity. Contrast is measured in light and dark as you go.">
    {/* Fonts and layout are orthogonal to a preset, so a preset change carries them over. */}
    <PresetPicker state={state} onPick={preset => update("preset", { ...stateFromPreset(preset, state.layout, state.mode), fonts: state.fonts })} />
    <p className="cfg-basis">{matchesPreset(state, state.preset)
      ? `${presetLabel[state.preset]} preset, unmodified.`
      : `Based on ${presetLabel[state.preset]}, edited.`}</p>
    <Row label="Colour mode" id="cfg-mode">
      <SegmentedControl label="Colour mode" value={state.mode}
        onChange={value => { if (isThemePreference(value)) update("mode", { ...state, mode: value }); }}
        items={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
    </Row>
    {(["primary", "accent", "neutral"] as const).map(family =>
      <FamilyControl key={family} family={family} state={state} guard={familyGuard(contrast, family)} onSeed={seed} />)}
    <details className="cfg-more">
      <summary>Status colours<span className="cfg-more__meta">{formatRatio(Math.min(...(["success", "warning", "danger"] as const)
        .map(family => familyGuard(contrast, family).worst?.ratio ?? Infinity)))} lowest</span></summary>
      {(["success", "warning", "danger"] as const).map(family =>
        <FamilyControl key={family} family={family} state={state} guard={familyGuard(contrast, family)} onSeed={seed} />)}
    </details>
    <ContrastReport configurator={configurator} />
  </Group>;
}

function ContrastReport({ configurator }: { configurator: Configurator }) {
  const failing = failures(configurator.contrast);
  const worst = configurator.contrast.reduce((lowest, measurement) => measurement.ratio < lowest.ratio ? measurement : lowest);
  if (!failing.length) {
    return <p className="cfg-guard-report" data-state="pass">
      Lowest contrast right now is {formatRatio(worst.ratio)}, on {worst.text} over {worst.background} in {worst.mode} mode.
      The floor for readable text is {minimumRatio}:1.
    </p>;
  }
  const shown = failing.slice(0, 6);
  return <div className="cfg-guard-report" data-state="fail" role="status">
    <p>{failing.length} pairing{failing.length === 1 ? "" : "s"} below {minimumRatio}:1. Move the seed further from the surface it sits on.</p>
    <ul>{shown.map(measurement => <li key={measurement.mode + measurement.text + measurement.background}>
      <span className="cfg-guard-report__pair">{measurement.text} on {measurement.background}</span>
      <span className="cfg-guard-report__mode">{measurement.mode}</span>
      <span className="cfg-guard-report__ratio">{formatRatio(measurement.ratio)}</span>
    </li>)}</ul>
    {failing.length > shown.length ? <p>And {failing.length - shown.length} more.</p> : null}
  </div>;
}

function TypeGroup({ configurator }: { configurator: Configurator }) {
  const { state, update } = configurator;
  const id = useId().replaceAll(":", "");
  // "Long-form", not "Reading": the content-width control already owns that word.
  const roleLabel: Record<FontRole, string> = { sans: "Interface", serif: "Long-form", mono: "Code" };
  return <Group id={groupAnchor("type")} title="Type" description="Three roles: the interface, long-form reading and code. The system fonts are already here; a named one arrives when you pick it.">
    {fontRoles.map(role => <Row key={role} label={roleLabel[role]} id={`${id}-${role}`}>
      <select id={`${id}-${role}`} value={state.fonts[role]}
        onChange={event => update("font:" + role, { ...state, fonts: { ...state.fonts, [role]: event.target.value } })}>
        {fontCatalogue[role].map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </Row>)}
    <div className="cfg-specimen">
      <p className="cfg-specimen__sans">Ship the configuration, not a screenshot of it.</p>
      <p className="cfg-specimen__serif">Ship the configuration, not a screenshot of it.</p>
      <p className="cfg-specimen__mono">applyTheme(spec) &mdash; 0123456789</p>
    </div>
  </Group>;
}

function LayoutGroup({ configurator }: { configurator: Configurator }) {
  const { state, update } = configurator;
  const layout = (key: keyof ConfiguratorState["layout"], value: string) =>
    update("layout:" + key, { ...state, layout: { ...state.layout, [key]: value } as ConfiguratorState["layout"] });
  // Option words stay unique across the panel: three segmented controls sit within one scroll.
  return <Group id={groupAnchor("layout")} title="Layout" description="Corner shape, breathing room and the shape of the workspace around your content.">
    {(Object.keys(scaleRanges) as (keyof typeof scaleRanges)[]).map(key => {
      const range = scaleRanges[key];
      return <Slider key={key} label={range.label} value={state[key]} min={range.min} max={range.max} step={range.step}
        format={times} onChange={value => update("scale:" + key, { ...state, [key]: value }, true)} />;
    })}
    <Row label="Sidebar" id="cfg-sidebar">
      <SegmentedControl label="Sidebar" value={state.layout.sidebar} onChange={value => layout("sidebar", value)}
        items={sidebarModes.map(mode => ({ value: mode, label: { expanded: "Panel", compact: "Icons", hidden: "Hidden" }[mode] }))} />
    </Row>
    <Row label="Content width" id="cfg-content">
      <SegmentedControl label="Content width" value={state.layout.content} onChange={value => layout("content", value)}
        items={contentWidths.map(width => ({ value: width, label: { reading: "Reading", wide: "Wide", full: "Full" }[width] }))} />
    </Row>
    <Row label="Rail" hint="Labels widen the icon rail on TL and DW." id="cfg-rail">
      <SegmentedControl label="Rail" value={state.layout.rail} onChange={value => layout("rail", value)}
        items={railStyles.map(style => ({ value: style, label: { icons: "Icons only", labels: "With labels" }[style] }))} />
    </Row>
    <Row label="Motion" id="cfg-motion">
      <SegmentedControl label="Motion" value={state.layout.motion} onChange={value => layout("motion", value)}
        items={motionIntensities.map(intensity => ({ value: intensity, label: { off: "None", reduced: "Reduced", full: "Fluid" }[intensity] }))} />
    </Row>
  </Group>;
}

function ExportGroup({ configurator }: { configurator: Configurator }) {
  const { state, replace, reset } = configurator;
  const [status, setStatus] = useState("");
  const [problem, setProblem] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const paste = useRef<HTMLTextAreaElement>(null);
  const id = useId().replaceAll(":", "");

  const announce = (message: string) => { setProblem(""); setStatus(message); };
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      announce(label + " copied to the clipboard.");
    } catch {
      setStatus("");
      setProblem("The browser refused clipboard access. Use the text below instead.");
    }
  };
  const apply = (text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      replace(normalizeState(parsed));
      announce("Preset imported. Undo restores the previous configuration.");
    } catch {
      setStatus("");
      setProblem("That is not valid JSON. Export a preset first to see the expected shape.");
    }
  };

  return <Group id={groupAnchor("export")} title="Export" description="Take this look with you as a stylesheet, a preset or a config file, and bring one back.">
    <div className="cfg-actions">
      <button type="button" className="cfg-action" onClick={() => { download(exportFileName.css, exportCss(state), "text/css"); announce("CSS variables file downloaded."); }}>
        <Download aria-hidden="true" />CSS variables
      </button>
      <button type="button" className="cfg-action" onClick={() => { download(exportFileName.json, exportJson(state), "application/json"); announce("JSON preset downloaded."); }}>
        <Download aria-hidden="true" />JSON preset
      </button>
      <button type="button" className="cfg-action" onClick={() => copy("xpresso.config.ts", exportConfigSnippet(state))}>
        <Copy aria-hidden="true" />Copy config
      </button>
      <button type="button" className="cfg-action" onClick={() => copy("Shareable link", location.origin + location.pathname + "#c=" + encodeState(state))}>
        <Copy aria-hidden="true" />Copy link
      </button>
    </div>
    <div className="cfg-actions">
      <button type="button" className="cfg-action" onClick={() => file.current?.click()}>
        <Upload aria-hidden="true" />Import JSON
      </button>
      <button type="button" className="cfg-action" onClick={reset}>
        <RotateCcw aria-hidden="true" />Reset
      </button>
      <input ref={file} className="cfg-visually-hidden" type="file" accept="application/json,.json" tabIndex={-1}
        aria-hidden="true" onChange={async event => {
          const chosen = event.target.files?.[0];
          event.target.value = "";
          if (chosen) apply(await chosen.text());
        }} />
    </div>
    <p className="cfg-status" role="status">{status}</p>
    {problem ? <p className="cfg-problem" role="alert">{problem}</p> : null}
    <details className="cfg-more">
      <summary>Paste a preset<span className="cfg-more__meta">JSON</span></summary>
      <label className="cfg-paste" htmlFor={id + "-paste"}>Preset JSON</label>
      <textarea id={id + "-paste"} ref={paste} rows={4} spellCheck={false}
        placeholder={'{ "preset": "aurora", "radiusScale": 1.2 }'} />
      <button type="button" className="cfg-action" onClick={() => apply(paste.current?.value ?? "")}>
        <Check aria-hidden="true" />Apply preset
      </button>
    </details>
    <details className="cfg-more">
      <summary>Config module<span className="cfg-more__meta">xpresso.config.ts</span></summary>
      <pre className="cfg-code" tabIndex={0}>{exportConfigSnippet(state)}</pre>
    </details>
  </Group>;
}

const renderers = { colour: ColourGroup, type: TypeGroup, layout: LayoutGroup, export: ExportGroup } as const;
const groups = configuratorGroups.map(group => ({ ...group, render: renderers[group.id] }));

/**
 * The history pair. In a docked pane it sits in the panel's own head; in a sheet the shell places
 * it beside the sheet heading, because a band of its own eats scarce sheet height.
 */
export function PanelHistory({ configurator }: { configurator: Configurator }) {
  const { undo, redo, canUndo, canRedo } = configurator;
  return <div className="cfg-history">
    <button type="button" className="cfg-icon" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Cmd or Ctrl + Z)">
      <Undo2 aria-hidden="true" />
    </button>
    <button type="button" className="cfg-icon" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Shift + Cmd or Ctrl + Z)">
      <Redo2 aria-hidden="true" />
    </button>
  </div>;
}

export function ConfiguratorPanel({ configurator }: { configurator: Configurator }) {
  const deviceClass = useDeviceClass();
  const compact = deviceClass === "M" || deviceClass === "TP";
  // Only DS and DW render the panel in a pane of its own; the rest reach it through a sheet whose
  // header already carries the title, the description and the history controls.
  const docked = deviceClass === "DS" || deviceClass === "DW";
  const [tab, setTab] = useState<string>(groups[0].id);

  // Keep the panel scrolled to the group the operator is editing after a tab change.
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [tab]);

  return <div className="xp-configurator" data-compact={compact}>
    {docked ? <header className="cfg-head">
      <div><h2>Customise</h2><p>Every change applies here and in every preview.</p></div>
      <PanelHistory configurator={configurator} />
    </header> : null}
    {compact
      ? <Tabs.Root className="cfg-tabs" value={tab} onValueChange={setTab}>
        <Tabs.List className="cfg-tabs__list" aria-label="Configurator sections">
          {groups.map(group => <Tabs.Trigger key={group.id} className="cfg-tabs__trigger" value={group.id} data-xp-control>{group.label}</Tabs.Trigger>)}
        </Tabs.List>
        <div className="cfg-body" ref={body}>
          {groups.map(group => <Tabs.Content key={group.id} value={group.id} className="cfg-tabs__panel">
            <group.render configurator={configurator} />
          </Tabs.Content>)}
        </div>
      </Tabs.Root>
      : <div className="cfg-body" ref={body}>
        {groups.map(group => <group.render key={group.id} configurator={configurator} />)}
      </div>}
  </div>;
}
