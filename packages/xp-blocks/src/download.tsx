"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  fixtureArtifacts,
  fixtureInitialResolution,
  resolveDownloadSurfaceFixture,
  resolveReleaseListFixture,
  type DownloadActionState,
  type DownloadArtifact,
  type DownloadCopyMode,
  type DownloadFixture,
  type DownloadMediaMap,
  type DownloadSurfaceFixture,
  type PlatformId,
  type PlatformResolution,
  type ReleaseListFixture,
  type ResolvedDownloadSurfaceFixture,
  type ResolvedReleaseListFixture,
} from "./download-model";

export type DownloadScenario = {
  platformId?: PlatformId;
  resolutionStatus?: "hinted" | "confirmed" | "overridden";
  consent?: boolean;
  actionState?: DownloadActionState;
  requirementsOpen?: boolean;
  handoffState?: "idle" | "success" | "error";
};

type SharedProperties = {
  mediaMap: DownloadMediaMap;
  copyMode?: DownloadCopyMode;
  resolution?: PlatformResolution;
  scenario?: DownloadScenario;
  className?: string;
};

type RuntimeState = {
  platformId: PlatformId;
  resolution: PlatformResolution;
  choosePlatform: (platformId: PlatformId) => void;
  actionState: DownloadActionState;
  selectedActionId?: string;
  activate: (event: MouseEvent<HTMLAnchorElement>, artifact: DownloadArtifact, allowed?: boolean) => void;
  setActionState: (state: DownloadActionState) => void;
  handoffState: "idle" | "success" | "error";
  copyHandoff: (href: string) => Promise<void>;
};

const nativeForms: Record<DeviceClass, string> = {
  M: "mobile-platform-lead",
  TP: "tablet-touch-hero",
  TL: "tablet-hybrid-deck",
  DS: "desktop-pointer-deck",
  DW: "desktop-wide-console",
};

const platformNames: Record<PlatformId, string> = {
  ios: "iOS",
  android: "Android",
  "macos-arm": "macOS Apple silicon",
  "macos-intel": "macOS Intel",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
};

const copy = (model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture, key: string | undefined) => key ? model.activeCopy[key] ?? key : "";
const platformFamily = (platformId: PlatformId) => platformId.startsWith("macos-") ? "macos" : platformId;
const matchesPlatform = (artifact: DownloadArtifact, platformId: PlatformId) => platformFamily(artifact.platformId) === platformFamily(platformId);
const primaryArtifacts = (fixture: DownloadFixture) => fixtureArtifacts(fixture).filter(({ kind }) => !["documentation", "release-notes"].includes(kind));
const uniquePlatforms = (fixture: DownloadFixture) => [...new Set(primaryArtifacts(fixture).map(({ platformId }) => platformId))];

function useDownloadState(fixture: DownloadFixture, resolution: PlatformResolution | undefined, scenario: DownloadScenario | undefined): RuntimeState {
  const inputResolution = scenario?.platformId
    ? { status: scenario.resolutionStatus ?? "confirmed", platformId: scenario.platformId } as PlatformResolution
    : resolution ?? fixtureInitialResolution(fixture);
  const platforms = useMemo(() => uniquePlatforms(fixture), [fixture]);
  const inputPlatform = inputResolution.status === "unknown" ? undefined : inputResolution.platformId;
  const viableInput = inputPlatform && platforms.some((platformId) => platformFamily(platformId) === platformFamily(inputPlatform)) ? inputPlatform : undefined;
  const [override, setOverride] = useState<PlatformId | undefined>(inputResolution.status === "overridden" ? viableInput : undefined);
  const [actionState, setActionState] = useState<DownloadActionState>(scenario?.actionState ?? "idle");
  const [selectedActionId, setSelectedActionId] = useState<string>();
  const [handoffState, setHandoffState] = useState<"idle" | "success" | "error">(scenario?.handoffState ?? "idle");

  useEffect(() => {
    try {
      const stored = globalThis.localStorage?.getItem(fixture.platformResolution.persistenceKey) as PlatformId | null;
      if (stored && platforms.includes(stored)) setOverride(stored);
    } catch {
      // Storage is an enhancement; the controlled fixture remains usable when it is unavailable.
    }
  }, [fixture.platformResolution.persistenceKey, platforms]);

  const platformId = override ?? viableInput ?? platforms[0]!;
  const activeResolution: PlatformResolution = override
    ? { status: "overridden", platformId: override }
    : inputResolution;

  const choosePlatform = (next: PlatformId) => {
    setOverride(next);
    setActionState("idle");
    try { globalThis.localStorage?.setItem(fixture.platformResolution.persistenceKey, next); } catch { /* controlled state remains active */ }
  };

  const activate = (event: MouseEvent<HTMLAnchorElement>, artifact: DownloadArtifact, allowed = true) => {
    setSelectedActionId(artifact.id);
    if (!allowed || actionState === "pending") {
      event.preventDefault();
      if (!allowed) setActionState("error");
      return;
    }
    if (scenario?.actionState === "error") {
      event.preventDefault();
      setActionState("error");
      return;
    }
    setActionState("pending");
  };

  const copyHandoff = async (href: string) => {
    try {
      if (!globalThis.navigator?.clipboard) throw new Error("clipboard unavailable");
      await globalThis.navigator.clipboard.writeText(href);
      setHandoffState("success");
    } catch {
      setHandoffState("error");
    }
  };

  return { platformId, resolution: activeResolution, choosePlatform, actionState, selectedActionId, activate, setActionState, handoffState, copyHandoff };
}

function PlatformGlyph({ platformId, seatId }: { platformId: PlatformId; seatId?: string }) {
  const family = platformFamily(platformId);
  return <svg className="xp-download__platform-glyph" viewBox="0 0 24 24" aria-hidden="true" data-platform-glyph={platformId} data-media-seat-id={seatId}>
    {family === "ios" || family === "android" ? <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4M11 18h2"/></> : null}
    {family === "macos" ? <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></> : null}
    {family === "windows" ? <><path d="M3 5.5 10.5 4v7H3V5.5ZM13 3.5 21 2v9h-8V3.5ZM3 13h7.5v7L3 18.5V13ZM13 13h8v9l-8-1.5V13Z"/></> : null}
    {family === "linux" ? <><path d="M12 3c-3 0-4.5 3.2-4 6-2 2-2.3 5.5-.3 8l2.3-1 2 4 2-4 2.3 1c2-2.5 1.7-6-.3-8 .5-2.8-1-6-4-6Z"/><circle cx="10" cy="8" r=".6"/><circle cx="14" cy="8" r=".6"/></> : null}
    {["chrome", "firefox", "safari"].includes(family) ? <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M20 16l-5-3M4 16l5-3"/></> : null}
  </svg>;
}

function PlatformMark({ model, platformId, seatId }: { model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture; platformId: PlatformId; seatId?: string }) {
  if (!seatId) return <PlatformGlyph platformId={platformId}/>;
  const seat = model.mediaMap.seats.find((record) => record.slug === model.sourceKey && record.seatId === seatId);
  const asset = model.mediaMap.assets.find((record) => record.assetId === seat?.assetId);
  if (!seat || seat.kind !== "runtime-vector" || !asset) throw new Error(`${model.sourceKey}/${seatId} has no mapped local vector.`);
  return <img className="xp-download__platform-mark" src={asset.src} alt="" aria-hidden="true" data-media-seat-id={seatId}/>;
}

function ContextPhoto({ model, seatId }: { model: ResolvedDownloadSurfaceFixture; seatId: string }) {
  const seat = model.mediaMap.seats.find((record) => record.slug === model.sourceKey && record.seatId === seatId);
  const asset = model.mediaMap.assets.find((record) => record.assetId === seat?.assetId);
  if (!seat || seat.kind !== "raster-photo" || asset?.kind !== "raster-photo" || !asset.publicBase) throw new Error(`${model.sourceKey}/${seatId} has no mapped local photograph.`);
  const srcSet = (format: "avif" | "webp") => [640, 1280, 1920].map((width) => `${asset.publicBase}-${width}.${format} ${width}w`).join(", ");
  return <picture className="xp-download__context-photo" data-media-seat-id={seatId}>
    <source type="image/avif" srcSet={srcSet("avif")}/>
    <source type="image/webp" srcSet={srcSet("webp")}/>
    <img src={asset.src} alt={seat.alt} width={asset.width} height={asset.height} loading="eager"/>
  </picture>;
}

function Intro({ model }: { model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture }) {
  if (model.intro) return <header className="xp-download__intro">
    {model.intro.eyebrowKey ? <p>{copy(model, model.intro.eyebrowKey)}</p> : null}
    <h2 id={`${model.sourceKey}-title`}>{copy(model, model.intro.headingKey)}</h2>
    <span>{copy(model, model.intro.bodyKey)}</span>
  </header>;
  if (model.owner === "DownloadSurface" && model.release) return <header className="xp-download__intro">
    <p>{copy(model, model.release.statusKey)}</p>
    <h2 id={`${model.sourceKey}-title`}>{model.release.product} {model.release.version}</h2>
    {model.release.date ? <span>{model.release.date}</span> : null}
  </header>;
  return null;
}

function PlatformPicker({ model, state, artifacts }: { model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture; state: RuntimeState; artifacts: DownloadArtifact[] }) {
  const platforms = [...new Set(artifacts.filter(({ kind }) => !["documentation", "release-notes"].includes(kind)).map(({ platformId }) => platformId))];
  if (platforms.length < 2) return null;
  const pickerKey = model.stateKeys?.picker;
  return <label className="xp-download__picker">
    <span>{copy(model, pickerKey) || "Platform"}</span>
    <select value={platforms.find((platformId) => platformFamily(platformId) === platformFamily(state.platformId)) ?? platforms[0]} onChange={(event) => state.choosePlatform(event.target.value as PlatformId)}>
      {platforms.map((platformId) => <option value={platformId} key={platformId}>{platformNames[platformId]}</option>)}
    </select>
  </label>;
}

function ResolutionStatus({ model, state }: { model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture; state: RuntimeState }) {
  if (state.resolution.status === "unknown") {
    const key = model.stateKeys?.neutral;
    return key ? <p className="xp-download__resolution" role="status">{copy(model, key)}</p> : null;
  }
  const key = state.resolution.status === "overridden" ? model.stateKeys?.overridden : model.stateKeys?.confirmed;
  return key ? <p className="xp-download__resolution" role="status">{copy(model, key)}</p> : null;
}

function actionStateText(model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture, state: RuntimeState) {
  if (state.actionState === "idle") return "";
  const key = model.stateKeys?.[state.actionState];
  if (key) return copy(model, key);
  const action = fixtureArtifacts(model).find(({ id }) => id === state.selectedActionId);
  const label = action ? copy(model, action.labelKey) : "Selected file";
  return state.actionState === "pending" ? `${label}: preparing.` : state.actionState === "success" ? `${label}: started.` : `${label}: unavailable.`;
}

function ActionLink({ model, state, artifact, primary = false, allowed = true, seatId, onActivate }: { model: ResolvedDownloadSurfaceFixture | ResolvedReleaseListFixture; state: RuntimeState; artifact: DownloadArtifact; primary?: boolean; allowed?: boolean; seatId?: string; onActivate?: (event: MouseEvent<HTMLAnchorElement>, artifact: DownloadArtifact) => void }) {
  return <a className="xp-download__action" data-emphasis={primary ? "primary" : "secondary"} data-artifact-id={artifact.id} data-platform-id={artifact.platformId} href={artifact.href} aria-disabled={state.actionState === "pending" || undefined} onClick={(event) => onActivate ? onActivate(event, artifact) : state.activate(event, artifact, allowed)}>
    <PlatformMark model={model} platformId={artifact.platformId} seatId={seatId}/>
    <span>{copy(model, artifact.labelKey)}</span>
    {artifact.countKey ? <small>{copy(model, artifact.countKey)}</small> : null}
  </a>;
}

function PhoneProof({ alt, seatId, variant }: { alt?: string; seatId?: string; variant: "queue" | "status" | "timeline" }) {
  return <figure className="xp-download__phone" role={seatId ? "img" : undefined} aria-label={seatId ? alt : undefined} aria-hidden={seatId ? undefined : true} data-media-seat-id={seatId} data-proof-variant={variant}>
    <div aria-hidden="true"><i/><b/><span/><span/><span/></div>
  </figure>;
}

function ThreeDeviceProof({ alt }: { alt: string }) {
  return <div className="xp-download__device-cluster" role="img" aria-label={alt} data-media-seat-id="d01-three-device-proof">
    <PhoneProof variant="queue"/>
    <PhoneProof variant="timeline"/>
    <PhoneProof variant="status"/>
  </div>;
}

function DashboardProof({ alt }: { alt: string }) {
  return <figure className="xp-download__dashboard-proof" role="img" aria-label={alt} data-media-seat-id="d04-dashboard-proof">
    <div className="xp-download__dashboard-rail" aria-hidden="true"><i/><i/><i/><i/></div>
    <div className="xp-download__dashboard-body" aria-hidden="true"><span/><span/><strong/><div><i/><i/><i/><i/><i/></div><b/><b/></div>
  </figure>;
}

function ordered(artifacts: DownloadArtifact[], platformId: PlatformId) {
  return [...artifacts].sort((left, right) => Number(matchesPlatform(right, platformId)) - Number(matchesPlatform(left, platformId)));
}

function StorePair({ model, state }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState }) {
  const artifacts = ordered(model.artifacts ?? [], state.platformId);
  return <div className="xp-download__promo-layout">
    <div className="xp-download__acquisition">
      <Intro model={model}/>
      <PlatformPicker model={model} state={state} artifacts={artifacts}/>
      <div className="xp-download__actions">{artifacts.map((artifact, index) => <ActionLink model={model} state={state} artifact={artifact} primary={index === 0} seatId={artifact.platformId === "ios" ? "d01-store-ios" : "d01-store-android"} key={artifact.id}/>)}</div>
    </div>
    <ThreeDeviceProof alt={copy(model, "proofAltKey")}/>
  </div>;
}

function ConsentPanel({ model, state, scenario }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState; scenario?: DownloadScenario }) {
  const [consent, setConsent] = useState(scenario?.consent ?? model.consent?.initiallyChecked ?? false);
  const checkbox = useRef<HTMLInputElement>(null);
  const artifacts = ordered(model.artifacts ?? [], state.platformId);
  const selected = artifacts.find((artifact) => matchesPlatform(artifact, state.platformId)) ?? artifacts[0]!;
  const validation = state.actionState === "error" && !consent;
  const activate = (event: MouseEvent<HTMLAnchorElement>, artifact: DownloadArtifact) => {
    state.activate(event, artifact, consent);
    if (!consent) checkbox.current?.focus();
  };
  return <div className="xp-download__release-layout">
    <div className="xp-download__release-copy">
      <Intro model={model}/>
      <ul className="xp-download__service-facts">{model.supportedServices?.map((service) => <li key={service.id}>{copy(model, service.labelKey)}</li>)}</ul>
      <PlatformPicker model={model} state={state} artifacts={artifacts}/>
      <ResolutionStatus model={model} state={state}/>
      <div className="xp-download__consent">
        <label><input ref={checkbox} type="checkbox" checked={consent} aria-invalid={validation || undefined} aria-describedby={validation ? `${model.sourceKey}-consent-error` : undefined} onChange={(event) => { setConsent(event.target.checked); state.setActionState("idle"); }}/><span>{copy(model, model.consent?.labelKey)}</span></label>
        <nav aria-label="Download policies">{model.consent?.routes.map((route) => <a href={route.href} key={route.id}>{copy(model, route.labelKey)}</a>)}</nav>
        {validation ? <p id={`${model.sourceKey}-consent-error`} role="alert">{copy(model, model.consent?.validationKey)}</p> : null}
      </div>
      <ActionLink model={model} state={state} artifact={selected} primary allowed={consent} onActivate={activate}/>
      <details className="xp-download__alternate-actions"><summary>{copy(model, model.stateKeys?.picker)}</summary><div className="xp-download__actions">{artifacts.filter(({ id }) => id !== selected.id).map((artifact) => <ActionLink model={model} state={state} artifact={artifact} allowed={consent} onActivate={activate} key={artifact.id}/>)}</div></details>
    </div>
    <div className="xp-download__proof-pair" aria-label="Original application preview">
      <PhoneProof alt={copy(model, "proofLeftAltKey")} seatId="d02-proof-phone-left" variant="queue"/>
      <PhoneProof alt={copy(model, "proofRightAltKey")} seatId="d02-proof-phone-right" variant="status"/>
    </div>
  </div>;
}

function DesktopProof({ model, state }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState }) {
  const direct = model.artifacts?.find(({ kind }) => kind === "direct")!;
  const notes = model.artifacts?.find(({ kind }) => kind === "release-notes")!;
  const requestedPlatform = state.resolution.status === "unknown" ? undefined : state.resolution.platformId;
  const mismatched = Boolean(requestedPlatform && !matchesPlatform(direct, requestedPlatform));
  return <div className="xp-download__promo-layout xp-download__promo-layout--desktop">
    <div className="xp-download__acquisition">
      <Intro model={model}/>
      <dl className="xp-download__metadata"><div><dt>Version</dt><dd>{direct.version}</dd></div><div><dt>Compatibility</dt><dd>{direct.compatibility}</dd></div></dl>
      {mismatched ? <p className="xp-download__resolution" role="status">{copy(model, model.stateKeys?.nonmatching)}</p> : null}
      <div className="xp-download__actions"><ActionLink model={model} state={state} artifact={direct} primary/><ActionLink model={model} state={state} artifact={notes}/></div>
    </div>
    <DashboardProof alt={copy(model, "proofAltKey")}/>
  </div>;
}

function RequirementsPanel({ model, state, deviceClass, scenario }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState; deviceClass: DeviceClass; scenario?: DownloadScenario }) {
  const [open, setOpen] = useState(scenario?.requirementsOpen ?? !["M", "TP"].includes(deviceClass));
  const artifacts = ordered((model.artifacts ?? []).filter(({ kind }) => kind === "direct"), state.platformId);
  const selected = artifacts.find((artifact) => matchesPlatform(artifact, state.platformId)) ?? artifacts[0]!;
  const documentation = model.artifacts?.find(({ kind }) => kind === "documentation")!;
  return <div className="xp-download__requirements-layout">
    <div className="xp-download__release-copy">
      <Intro model={model}/>
      <dl className="xp-download__metadata"><div><dt>Version</dt><dd>{model.release?.version}</dd></div><div><dt>File size</dt><dd>{model.release?.size}</dd></div><div><dt>Status</dt><dd>{copy(model, model.release?.statusKey)}</dd></div></dl>
      <PlatformPicker model={model} state={state} artifacts={artifacts}/>
      <ResolutionStatus model={model} state={state}/>
      <div className="xp-download__actions"><ActionLink model={model} state={state} artifact={selected} primary/><ActionLink model={model} state={state} artifact={documentation}/></div>
      <details className="xp-download__alternate-actions"><summary>{copy(model, model.stateKeys?.picker)}</summary><div className="xp-download__actions">{artifacts.filter(({ id }) => id !== selected.id).map((artifact) => <ActionLink model={model} state={state} artifact={artifact} key={artifact.id}/>)}</div></details>
    </div>
    <div className="xp-download__requirements-side">
      <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>{copy(model, model.stateKeys?.requirementsDisclosure)}</summary><ul>{model.requirements?.map((item) => <li key={item.id}>{copy(model, item.labelKey)}</li>)}</ul></details>
      <ul className="xp-download__benefits">{model.benefits?.map((item) => <li key={item.id}>{copy(model, item.labelKey)}</li>)}</ul>
    </div>
  </div>;
}

const qrMultiply = (left: number, right: number) => {
  let result = 0, factor = left, value = right;
  while (value) {
    if (value & 1) result ^= factor;
    value >>>= 1;
    factor = (factor << 1) ^ ((factor >>> 7) * 0x11d);
  }
  return result;
};

function qrGenerator(degree: number) {
  let polynomial = [1], root = 1;
  for (let index = 0; index < degree; index += 1) {
    const next = Array(polynomial.length + 1).fill(0) as number[];
    polynomial.forEach((coefficient, position) => {
      next[position] ^= coefficient;
      next[position + 1] ^= qrMultiply(coefficient, root);
    });
    polynomial = next;
    root = qrMultiply(root, 2);
  }
  return polynomial;
}

function qrCodewords(payload: string) {
  const bytes = [...new TextEncoder().encode(payload)];
  if (bytes.length > 78) throw new Error("Download handoff exceeds QR version 4-L byte capacity.");
  const bits: number[] = [0, 1, 0, 0];
  for (let bit = 7; bit >= 0; bit -= 1) bits.push((bytes.length >>> bit) & 1);
  for (const byte of bytes) for (let bit = 7; bit >= 0; bit -= 1) bits.push((byte >>> bit) & 1);
  for (let index = 0; index < Math.min(4, 640 - bits.length); index += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = Array.from({ length: bits.length / 8 }, (_, index) => bits.slice(index * 8, index * 8 + 8).reduce((value, bit) => (value << 1) | bit, 0));
  for (let pad = 0; data.length < 80; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
  const divisor = qrGenerator(20), remainder = Array(20).fill(0) as number[];
  for (const byte of data) {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    for (let index = 0; index < remainder.length; index += 1) remainder[index] ^= qrMultiply(divisor[index + 1]!, factor);
  }
  return [...data, ...remainder];
}

export function createDownloadHandoffQrMatrix(payload: string) {
  const size = 33;
  const dark = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const reserved = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  const set = (x: number, y: number, value: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    dark[y]![x] = value; reserved[y]![x] = true;
  };
  const finder = (centerX: number, centerY: number) => {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  for (let position = 8; position < size - 8; position += 1) {
    if (!reserved[6]![position]) set(position, 6, position % 2 === 0);
    if (!reserved[position]![6]) set(6, position, position % 2 === 0);
  }
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) set(26 + dx, 26 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  let formatRemainder = 8;
  for (let index = 0; index < 10; index += 1) formatRemainder = (formatRemainder << 1) ^ (((formatRemainder >>> 9) & 1) * 0x537);
  const format = ((8 << 10) | formatRemainder) ^ 0x5412;
  const formatBit = (index: number) => ((format >>> index) & 1) !== 0;
  for (let index = 0; index <= 5; index += 1) set(8, index, formatBit(index));
  set(8, 7, formatBit(6)); set(8, 8, formatBit(7)); set(7, 8, formatBit(8));
  for (let index = 9; index < 15; index += 1) set(14 - index, 8, formatBit(index));
  for (let index = 0; index < 8; index += 1) set(size - 1 - index, 8, formatBit(index));
  for (let index = 8; index < 15; index += 1) set(8, size - 15 + index, formatBit(index));
  set(8, size - 8, true);
  const stream = qrCodewords(payload).flatMap((byte) => Array.from({ length: 8 }, (_, index) => (byte >>> (7 - index)) & 1));
  let streamIndex = 0, upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (reserved[y]![x]) continue;
        const value = Boolean(stream[streamIndex++] ?? 0) !== ((x + y) % 2 === 0);
        dark[y]![x] = value;
      }
    }
    upward = !upward;
  }
  return dark;
}

function Handoff({ model, state, artifact }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState; artifact: DownloadArtifact }) {
  const payload = `https://xpressostudio.milkies.work${artifact.href}`;
  const feedback = state.handoffState === "success" ? copy(model, model.stateKeys?.copied) : state.handoffState === "error" ? copy(model, model.stateKeys?.copyError) : "";
  const modules = createDownloadHandoffQrMatrix(payload);
  return <aside className="xp-download__handoff" data-handoff-organ data-qr-payload={payload} data-copy-state={state.handoffState} aria-label={copy(model, model.stateKeys?.qr)}>
    <svg className="xp-download__qr" viewBox="0 0 41 41" role="img" aria-label={copy(model, model.stateKeys?.qr)} shapeRendering="crispEdges" data-qr-version="4-L"><rect width="41" height="41" fill="white"/>{modules.flatMap((row, y) => row.flatMap((value, x) => value ? [<rect x={x + 4} y={y + 4} width="1" height="1" fill="currentColor" key={`${x}:${y}`}/>] : []))}</svg>
    <button type="button" onClick={() => void state.copyHandoff(payload)}>{copy(model, model.stateKeys?.copy)}</button>
    <span role="status" aria-live="polite">{feedback}</span>
  </aside>;
}

const source03Seat = (artifact: DownloadArtifact) => artifact.platformId === "ios" ? "d03-mark-app-store"
  : artifact.platformId === "android" ? "d03-mark-google-play"
  : artifact.platformId === "chrome" ? "d03-mark-chrome"
  : artifact.platformId === "firefox" ? "d03-mark-firefox"
  : artifact.platformId === "safari" ? "d03-mark-safari"
  : undefined;

function PlatformDeck({ model, state, deviceClass }: { model: ResolvedDownloadSurfaceFixture; state: RuntimeState; deviceClass: DeviceClass }) {
  const groups = [...(model.groups ?? [])].sort((left, right) => Number(right.artifacts.some((artifact) => matchesPlatform(artifact, state.platformId))) - Number(left.artifacts.some((artifact) => matchesPlatform(artifact, state.platformId))));
  const compact = deviceClass === "M" || deviceClass === "TP";
  return <div className="xp-download__deck-layout">
    <Intro model={model}/>
    <PlatformPicker model={model} state={state} artifacts={groups.flatMap(({ artifacts }) => artifacts)}/>
    <ResolutionStatus model={model} state={state}/>
    <div className="xp-download__deck">{groups.map((group, index) => {
      const card = <article className="xp-download__channel" data-leading={index === 0 || undefined} key={group.id}>
        <ContextPhoto model={model} seatId={group.mediaSeatId}/>
        <header><h3>{copy(model, group.titleKey)}</h3><p>{copy(model, group.descriptionKey)}</p></header>
        <div className="xp-download__actions">{ordered(group.artifacts, state.platformId).map((artifact, actionIndex) => <ActionLink model={model} state={state} artifact={artifact} primary={index === 0 && actionIndex === 0} seatId={source03Seat(artifact)} key={artifact.id}/>)}</div>
      </article>;
      return compact && index > 0 ? <details className="xp-download__alternate" key={group.id}><summary>{copy(model, group.titleKey)}</summary>{card}</details> : card;
    })}</div>
    {!(["M", "TP"] as DeviceClass[]).includes(deviceClass) ? <Handoff model={model} state={state} artifact={groups.flatMap(({ artifacts }) => artifacts).find(({ platformId }) => platformId === "ios")!}/> : null}
  </div>;
}

export function DownloadSurface({ fixture, mediaMap, copyMode, resolution, scenario, className }: SharedProperties & { fixture: DownloadSurfaceFixture }) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => resolveDownloadSurfaceFixture(fixture, mediaMap, copyMode), [fixture, mediaMap, copyMode]);
  const state = useDownloadState(model, resolution, scenario);
  const status = actionStateText(model, state);
  return <section className={["xp-download", `xp-download--${model.preset}`, className].filter(Boolean).join(" ")} data-xp-owner="DownloadSurface" data-download-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-native-form={nativeForms[deviceClass]} data-action-state={state.actionState} data-resolution={state.resolution.status} data-runnable={model.runnable || undefined} aria-labelledby={`${model.sourceKey}-title`}>
    {model.preset === "promo-slab-store-pair" ? <StorePair model={model} state={state}/>
      : model.preset === "release-panel-consent" ? <ConsentPanel model={model} state={state} scenario={scenario}/>
      : model.preset === "platform-deck" ? <PlatformDeck model={model} state={state} deviceClass={deviceClass}/>
      : model.preset === "promo-slab-desktop-proof" ? <DesktopProof model={model} state={state}/>
      : <RequirementsPanel model={model} state={state} deviceClass={deviceClass} scenario={scenario}/>}
    {status ? <p className="xp-download__status" role="status" aria-live="polite" data-status={state.actionState}>{status}</p> : null}
    {state.actionState === "error" && model.stateKeys?.retry ? <button className="xp-download__retry" type="button" onClick={() => state.setActionState("idle")}>{copy(model, model.stateKeys.retry)}</button> : null}
    <noscript>Every download destination remains available as a standard link.</noscript>
  </section>;
}

function AvailabilityMark({ model, item }: { model: ResolvedReleaseListFixture; item: ReleaseListFixture["availability"][number] }) {
  return <li><PlatformMark model={model} platformId={item.platformId} seatId={item.mediaSeatId}/><span>{copy(model, item.labelKey)}</span></li>;
}

export function ReleaseList({ fixture, mediaMap, copyMode, resolution, scenario, className }: SharedProperties & { fixture: ReleaseListFixture }) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => resolveReleaseListFixture(fixture, mediaMap, copyMode), [fixture, mediaMap, copyMode]);
  const state = useDownloadState(model, resolution, scenario);
  const artifacts = model.releases.flatMap(({ artifacts }) => artifacts);
  const status = actionStateText(model, state);
  return <section className={["xp-release-list", className].filter(Boolean).join(" ")} data-xp-owner="ReleaseList" data-download-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-native-form={nativeForms[deviceClass]} data-action-state={state.actionState} data-resolution={state.resolution.status} aria-labelledby={`${model.sourceKey}-title`}>
    <Intro model={model}/>
    <div className="xp-release-list__controls"><PlatformPicker model={model} state={state} artifacts={artifacts}/><ResolutionStatus model={model} state={state}/></div>
    <ul className="xp-release-list__availability" aria-label="Supported platforms">{model.availability.map((item) => <AvailabilityMark model={model} item={item} key={item.id}/>)}</ul>
    <div className="xp-release-list__rows" role="list">{model.releases.map((release) => <article role="listitem" className="xp-release-list__row" data-release-id={release.id} key={release.id}>
      <header><h3>{copy(model, release.titleKey)}</h3><span>{copy(model, release.statusKey)}</span></header>
      <dl><div><dt>Version</dt><dd>{release.version}</dd></div><div><dt>File size</dt><dd>{release.size}</dd></div></dl>
      <div className="xp-release-list__actions">{ordered(release.artifacts, state.platformId).map((artifact) => <ActionLink model={model} state={state} artifact={artifact} primary={matchesPlatform(artifact, state.platformId)} key={artifact.id}/>)}</div>
    </article>)}</div>
    {status ? <p className="xp-download__status" role="status" aria-live="polite" data-status={state.actionState}>{status}</p> : null}
    <noscript>All four release destinations remain standard links.</noscript>
  </section>;
}
