"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useMemo, type CSSProperties } from "react";
import {
  resolveStatusPageFixture,
  type ResolvedStatusPageFixture,
  type StatusCopyMode,
  type StatusMediaMap,
  type StatusPageFixture,
} from "./status-page-model";

export type StatusPageScenario = {
  mediaFallback?: boolean;
  reducedData?: boolean;
  motion?: "settled" | "active" | "reduced";
  pointer?: "rest" | "proximate";
};

export type StatusPageProperties = {
  fixture: StatusPageFixture;
  mediaMap: StatusMediaMap;
  copyMode?: StatusCopyMode;
  hostMode?: "shell" | "standalone";
  deviceClass?: DeviceClass;
  scenario?: StatusPageScenario;
  className?: string;
};

const NATIVE_FORMS: Record<DeviceClass, string> = {
  M: "touch-cover",
  TP: "touch-stack",
  TL: "touch-landscape",
  DS: "compact-desktop",
  DW: "bounded-wide",
};

function copy(model: ResolvedStatusPageFixture, key: string | undefined) {
  if (!key) return "";
  const value = model.activeCopy[key];
  if (!value) throw new Error(`${model.sourceKey} misses resolved copy key ${key}.`);
  return value;
}

function SignalField({ model, scenario }: { model: ResolvedStatusPageFixture; scenario?: StatusPageScenario }) {
  if (model.identity.kind !== "system-art") return null;
  const words = model.identity.wordKeys.map((key) => copy(model, key));
  return <div className="xp-status-page__signal" data-motion={scenario?.motion ?? "settled"} data-pointer={scenario?.pointer ?? "rest"}>
    <svg viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><pattern id={`${model.sourceKey}-signal-grid`} width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="currentColor"/></pattern></defs>
      <rect width="640" height="420" fill={`url(#${model.sourceKey}-signal-grid)`}/>
      <path className="xp-status-page__signal-trace xp-status-page__signal-trace--a" d="M30 304C148 304 164 112 288 112s134 187 322 187"/>
      <path className="xp-status-page__signal-trace xp-status-page__signal-trace--b" d="M54 336c92-8 126-94 215-94 104 0 126 89 310 51"/>
      <circle className="xp-status-page__signal-node" cx="289" cy="112" r="10"/>
    </svg>
    <div className="xp-status-page__signal-words">{words.map((word, index) => <span data-signal-word={index + 1} key={word}>{word}</span>)}</div>
  </div>;
}

function PhotoIdentity({ model }: { model: ResolvedStatusPageFixture }) {
  const base = model.media.publicBase;
  if (!base) throw new Error("StatusPage photo identity has no public base.");
  return <picture className="xp-status-page__photo">
    <source type="image/avif" srcSet={`${base}-640.avif 640w, ${base}-1280.avif 1280w, ${base}-1920.avif 1920w`}/>
    <source type="image/webp" srcSet={`${base}-640.webp 640w, ${base}-1280.webp 1280w, ${base}-1920.webp 1920w`}/>
    <img src={`${base}-1280.jpg`} srcSet={`${base}-640.jpg 640w, ${base}-1280.jpg 1280w, ${base}-1920.jpg 1920w`} width="1280" height="720" alt="" loading="eager" decoding="async"/>
  </picture>;
}

function StatusIdentity({ model, scenario }: { model: ResolvedStatusPageFixture; scenario?: StatusPageScenario }) {
  const fallback = scenario?.mediaFallback;
  const reducedData = model.identity.kind === "photo" && scenario?.reducedData;
  const mediaState = fallback ? "fallback" : reducedData ? "reduced-data" : "ready";
  const vectorStyle = model.media.src ? ({ "--status-vector": `url("${model.media.src}")` } as CSSProperties) : undefined;
  const fallbackKey = reducedData && model.identity.kind === "photo" ? model.identity.reducedDataKey : model.identity.mediaErrorKey;
  return <div className="xp-status-page__identity" data-status-identity data-media-state={mediaState} aria-hidden={mediaState === "ready" ? "true" : undefined}>
    <span className="xp-status-page__identity-numeral" aria-hidden="true">404</span>
    {mediaState !== "ready" ? <p className="xp-status-page__media-note">{copy(model, fallbackKey)}</p>
      : model.identity.kind === "vector-illustration" && model.preset === "orbit-panel" ? <img className="xp-status-page__vector-image" src={model.media.src} width="640" height="400" alt="" decoding="async"/>
      : model.identity.kind === "vector-illustration" ? <span className="xp-status-page__vector" style={vectorStyle}/>
      : model.identity.kind === "photo" ? <PhotoIdentity model={model}/>
      : model.identity.kind === "system-art" ? <SignalField model={model} scenario={scenario}/>
      : null}
  </div>;
}

function StatusCopy({ model }: { model: ResolvedStatusPageFixture }) {
  return <div className="xp-status-page__copy">
    {model.kickerKey ? <p className="xp-status-page__kicker">{copy(model, model.kickerKey)}</p> : null}
    <h1 id={`${model.sourceKey}-title`} className="xp-status-page__heading" tabIndex={-1} data-status-heading>
      <span className="xp-status-page__heading-code">{model.code}</span>
      <span>{copy(model, model.headlineKey)}</span>
    </h1>
    <p className="xp-status-page__body" data-status-body>{copy(model, model.bodyKey)}</p>
    <a className="xp-status-page__action" href={model.primaryAction.href} data-status-action data-action-id={model.primaryAction.id}>{copy(model, model.primaryAction.labelKey)}</a>
  </div>;
}

export function StatusPage({ fixture, mediaMap, copyMode, hostMode = "shell", deviceClass: forcedDeviceClass, scenario, className }: StatusPageProperties) {
  const ambientDeviceClass = useDeviceClass();
  const deviceClass = forcedDeviceClass ?? ambientDeviceClass;
  const model = useMemo(() => resolveStatusPageFixture(fixture, mediaMap, copyMode), [fixture, mediaMap, copyMode]);
  const presentation = model.identity.presentations[deviceClass];
  return <main
    className={["xp-status-page", `xp-status-page--${model.preset}`, className].filter(Boolean).join(" ")}
    data-xp-owner="StatusPage"
    data-source-key={model.sourceKey}
    data-preset={model.preset}
    data-device-class={deviceClass}
    data-native-form={NATIVE_FORMS[deviceClass]}
    data-presentation={presentation}
    data-host-mode={hostMode}
    data-copy-mode={model.activeCopyMode}
    aria-labelledby={`${model.sourceKey}-title`}
  >
    <div className="xp-status-page__layout">
      <StatusCopy model={model}/>
      <StatusIdentity model={model} scenario={scenario}/>
    </div>
  </main>;
}
