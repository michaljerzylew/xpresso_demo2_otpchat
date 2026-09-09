"use client";

import { MetricTile, MorphSlot, SegmentedControl, SnapRail, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  resolveTrustBurstFixture,
  type ChannelState,
  type ResolvedTrustBurstFixture,
  type ResolvedTrustMedia,
  type RewardTile,
  type SocialProofMediaRecord,
  type TrustBurstFixture,
  type TrustMetric,
} from "./trust-burst-model";

type TrustBurstProperties = {
  fixture: TrustBurstFixture;
  media: SocialProofMediaRecord[];
  stress?: string;
  className?: string;
};

const ladder: Record<DeviceClass, string> = { M: "compact", TP: "compact", TL: "balanced", DS: "wide", DW: "wide" };
const iconPaths: Record<string, string> = {
  users: "M5 19c.6-3 2.9-4.5 7-4.5s6.4 1.5 7 4.5M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  file: "M6 3h8l4 4v14H6V3Zm8 0v5h5",
  activity: "M3 12h4l2-6 4 12 2-6h6",
  check: "m5 12 4 4L19 6",
  dollar: "M12 3v18m4-14H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7",
  server: "M4 4h16v6H4V4Zm0 10h16v6H4v-6Zm3-7h.01M7 17h.01",
  database: "M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3Zm0 0v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3ZM3 12h18",
  calendar: "M5 5h14v15H5V5Zm3-2v4m8-4v4M5 10h14",
  tag: "M4 4h7l9 9-7 7-9-9V4Zm4 4h.01",
};

function SystemGlyph({ iconKey }: { iconKey?: string }) {
  const path = iconPaths[iconKey ?? "activity"] ?? iconPaths.activity;
  return <svg className="xp-trust__glyph" viewBox="0 0 24 24" aria-hidden="true" data-icon-key={iconKey}><path d={path}/></svg>;
}

function Intro({ model }: { model: ResolvedTrustBurstFixture }) {
  return <header className="xp-trust__intro">
    {model.eyebrow ? <p className="xp-trust__eyebrow">{model.eyebrow}</p> : null}
    <h2>{model.heading}</h2>
    {model.description ? <p className="xp-trust__description">{model.description}</p> : null}
  </header>;
}

function Delta({ metric }: { metric: TrustMetric }) {
  if (!metric.delta) return null;
  return <span className="xp-trust__delta" data-direction={metric.delta.direction} data-tone={metric.delta.tone}>
    <span aria-hidden="true">{metric.delta.direction === "up" ? "↑" : metric.delta.direction === "down" ? "↓" : "→"}</span>
    {metric.delta.display}{metric.delta.context ? <small>{metric.delta.context}</small> : null}
  </span>;
}

function Metric({ metric, className, runtimeId, runtimeState }: { metric: TrustMetric; className?: string; runtimeId?: string; runtimeState?: "live" | "error" }) {
  return <MetricTile
    className={["xp-trust__metric", className].filter(Boolean).join(" ")}
    value={metric.value}
    label={<span className="xp-trust__metric-copy">{metric.iconKey ? <SystemGlyph iconKey={metric.iconKey}/> : null}<span>{metric.label}</span>{metric.description ? <small>{metric.description}</small> : null}</span>}
    delta={<Delta metric={metric}/>} trend={metric.delta?.direction}
    data-metric-id={metric.id}
    data-runtime-seat-id={runtimeId}
    data-runtime-state={runtimeState}
  />;
}

function Vector({ media, className }: { media: ResolvedTrustMedia; className?: string }) {
  return <img className={className} src={media.src} alt={media.seat.alt} data-media-seat-id={media.seat.id} data-media-kind="vector"/>;
}

function Photo({ media, failed }: { media: ResolvedTrustMedia; failed: boolean }) {
  if (failed) return <div className="xp-trust__media-fallback" role="img" aria-label={media.seat.alt} data-media-seat-id={media.seat.id} data-media-state="error"><span aria-hidden="true"/></div>;
  const base = media.publicBase;
  return <picture className="xp-trust__photo" data-media-seat-id={media.seat.id}>
    <source srcSet={`${base}-1280.avif`} type="image/avif"/>
    <source srcSet={`${base}-1280.webp`} type="image/webp"/>
    <img src={`${base}-1280.jpg`} alt={media.seat.alt}/>
  </picture>;
}

function ProofSurfaceView({ surface, failed }: { surface: Extract<ResolvedTrustBurstFixture, { preset: "proof-stage" }>["payload"]["surfaces"][number]; failed: boolean }) {
  if (surface.kind === "line") {
    const high = Math.max(...surface.points, 1);
    const points = surface.points.map((point, index) => `${index * (100 / Math.max(surface.points.length - 1, 1))},${94 - point / high * 74}`).join(" ");
    return <article className="xp-trust__proof-card xp-trust__proof-card--line" data-runtime-seat-id={surface.id} data-runtime-state={failed ? "error" : "live"}>
      <span>{surface.label}</span><strong>{surface.value}</strong>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${surface.label}: ${surface.value}`} preserveAspectRatio="none"><polyline points={points}/></svg>
    </article>;
  }
  if (surface.kind === "donut") {
    const portion = Math.max(0, Math.min(100, surface.segments[0]));
    return <article className="xp-trust__proof-card xp-trust__proof-card--donut" data-runtime-seat-id={surface.id} data-runtime-state={failed ? "error" : "live"}>
      <span>{surface.label}</span><strong>{surface.value}</strong><i style={{ "--xp-trust-portion": `${portion}%` } as CSSProperties} aria-hidden="true"/>
    </article>;
  }
  return <article className="xp-trust__proof-card xp-trust__proof-card--summary" data-runtime-seat-id={surface.id} data-runtime-state={failed ? "error" : "live"}>
    <span>{surface.label}</span><strong>{surface.value}</strong><small>{surface.delta}</small><div aria-hidden="true"><i/><i/><i/></div>
  </article>;
}

function ProofStage({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "proof-stage" }> }) {
  const portraits = model.payload.portraitVectorIds.map((id) => model.mediaById.get(id)!);
  return <div className="xp-trust__proof-layout"><div className="xp-trust__claim"><Intro model={model}/><ul>{model.payload.facts.map((fact) => <li key={fact}><span aria-hidden="true">✓</span>{fact}</li>)}</ul></div>
    <div className="xp-trust__proof-stage" data-proof-stage>
      {portraits.map((media, index) => <Vector className={`xp-trust__portrait xp-trust__portrait--${index + 1}`} media={media} key={media.seat.id}/>)}
      {model.payload.surfaces.map((surface) => <ProofSurfaceView surface={surface} failed={model.failedRuntimeIds.has(surface.id)} key={surface.id}/>)}
    </div></div>;
}

function PlatformWall({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "platform-wall" }> }) {
  return <><Intro model={model}/><div className="xp-trust__platforms">{model.payload.platforms.map((platform) => <article data-platform-id={platform.id} key={platform.id}>
    <Vector media={model.mediaById.get(platform.markId)!}/><div><h3>{platform.name}</h3><strong>{platform.count}</strong><p>{platform.description}</p></div>
  </article>)}</div></>;
}

function MetricCollection({ metrics, className }: { metrics: TrustMetric[]; className?: string }) {
  return <div className={["xp-trust__metrics", className].filter(Boolean).join(" ")}>{metrics.map((metric) => <Metric metric={metric} key={metric.id}/>)}</div>;
}

function ChannelSwitcher({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "channel-switcher" }> }) {
  const [selected, setSelected] = useState(model.payload.initialChannelId);
  const channel = model.payload.channels.find(({ id }) => id === selected) ?? model.payload.channels[0];
  const runtimeIds = ["channel-value", "channel-delta", "channel-context"];
  return <><Intro model={model}/><div className="xp-trust__channel" data-selected-channel={channel.id}>
    <SegmentedControl label={model.heading} items={model.payload.channels.map(({ id, label }) => ({ value: id, label }))} value={channel.id} onChange={setSelected}/>
    <div className="xp-trust__channel-metrics" role="region" aria-live="polite">{channel.metrics.map((metric, index) => <Metric metric={metric} runtimeId={runtimeIds[index]} runtimeState={model.failedRuntimeIds.has(runtimeIds[index]) ? "error" : "live"} key={metric.id}/>)}</div>
  </div></>;
}

function BinaryTile({ tile, failed }: { tile: Extract<RewardTile, { kind: "binary-distribution" }>; failed: boolean }) {
  const first = Number.parseFloat(tile.segments[0].value) || 50;
  return <article className="xp-trust__reward-card xp-trust__reward-card--binary" data-tile-id={tile.id} data-runtime-seat-id="reward-binary-chart" data-runtime-state={failed ? "error" : "live"}>
    <h3>{tile.prompt}</h3><div className="xp-trust__binary-bar" style={{ "--xp-trust-binary": `${first}%` } as CSSProperties} aria-hidden="true"/>
    <dl>{tile.segments.map((segment) => <div key={segment.label}><dt>{segment.label}</dt><dd>{segment.value}</dd></div>)}</dl>
  </article>;
}

function RewardCard({ tile, model }: { tile: RewardTile; model: Extract<ResolvedTrustBurstFixture, { preset: "reward-mosaic" }> }) {
  if (tile.kind === "binary-distribution") return <BinaryTile tile={tile} failed={model.failedRuntimeIds.has("reward-binary-chart")}/>;
  if (tile.kind === "dual-update") return <article className="xp-trust__reward-card" data-tile-id={tile.id}><h3>{tile.title}</h3><MetricCollection metrics={tile.metrics}/></article>;
  if (tile.kind === "percentage-result") return <article className="xp-trust__reward-card xp-trust__reward-card--percentage" data-tile-id={tile.id}><Metric metric={tile.metric}/></article>;
  if (tile.kind === "vector-scene") return <article className="xp-trust__reward-card xp-trust__reward-card--vector" data-tile-id={tile.id}><div><h3>{tile.title}</h3><p>{tile.description}</p></div><Vector media={model.mediaById.get(tile.vectorId)!}/></article>;
  if (tile.kind === "device-scene") {
    const media = model.mediaById.get(tile.mediaId)!;
    if(model.heldMediaIds.has(tile.mediaId))return <article className="xp-trust__reward-card xp-trust__reward-card--held" data-tile-id={tile.id}><h3>{tile.title}</h3><div role="status" aria-busy="true" aria-label={media.seat.alt} data-media-seat-id={tile.mediaId} data-media-state="pending"><span aria-hidden="true"/></div></article>;
    return <article className="xp-trust__reward-card xp-trust__reward-card--device" data-tile-id={tile.id}><h3>{tile.title}</h3><Photo media={media} failed={model.failedMediaIds.has(tile.mediaId)}/></article>;
  }
  return <article className="xp-trust__reward-card xp-trust__reward-card--earnings" data-tile-id={tile.id}><Metric metric={tile.metric}/><div>{tile.vectorIds.map((id) => <Vector media={model.mediaById.get(id)!} key={id}/>)}</div></article>;
}

function RewardMosaic({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "reward-mosaic" }> }) {
  const [hero, ...rest] = model.payload.tiles;
  return <><Intro model={model}/><div className="xp-trust__reward-layout"><RewardCard tile={hero} model={model}/><SnapRail className="xp-trust__reward-rail" label={model.heading} paginationLabel={model.heading} markerLabel={(index) => `${index} / ${rest.length}`} peek="12%" physics="native">
    {rest.map((tile) => <SnapRail.Item key={tile.id}><RewardCard tile={tile} model={model}/></SnapRail.Item>)}
  </SnapRail></div></>;
}

function EvidenceSplit({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "evidence-split" }> }) {
  const media = model.mediaById.get(model.payload.photoId)!;
  return <div className="xp-trust__split"><div><Intro model={model}/><MetricCollection metrics={model.payload.metrics}/></div><Photo media={media} failed={model.failedMediaIds.has(media.seat.id)}/></div>;
}

function Action({ action, mark }: { action: { id: string; label: string; href: string }; mark?: ResolvedTrustMedia }) {
  return <a className="xp-trust__action" href={action.href} data-action-id={action.id}>{mark ? <Vector media={mark}/> : null}<span>{action.label}</span><span aria-hidden="true">↗</span></a>;
}

function DeviceSurface({ id, metric, failed }: { id: string; metric: TrustMetric; failed: boolean }) {
  const state = failed ? "error" : "live";
  if (id === "device-ui-primary") return <article className="xp-trust__device xp-trust__device--primary" data-ui-identity="deployment-status" data-runtime-seat-id={id} data-runtime-state={state}><header><span/><span/><span/></header><div><small>{metric.label}</small><strong>{metric.value}</strong><i/><i/><i/></div></article>;
  if (id === "device-ui-secondary") return <article className="xp-trust__device xp-trust__device--secondary" data-ui-identity="bundle-inspector" data-runtime-seat-id={id} data-runtime-state={state}><header><span/><span/></header><div><strong>{metric.value}</strong><small>{metric.label}</small><meter min="0" max="100" value="72">72%</meter><meter min="0" max="100" value="46">46%</meter></div></article>;
  return <article className="xp-trust__device xp-trust__device--tertiary" data-ui-identity="dependency-terminal" data-runtime-seat-id={id} data-runtime-state={state}><header><span/><span/><span/></header><div><code>&gt; xpr verify</code><strong>{metric.value}</strong><small>{metric.label}</small><i/><i/></div></article>;
}

function ConversionSplit({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "conversion-split" }> }) {
  const { payload } = model;
  const proof: ReactNode = payload.facet === "photo"
    ? <Photo media={model.mediaById.get(payload.photoId)!} failed={model.failedMediaIds.has(payload.photoId)}/>
    : <div className="xp-trust__device-cluster" aria-label={model.heading}>{payload.uiSurfaceIds.map((id, index) => <DeviceSurface id={id} metric={payload.metrics[index]} failed={model.failedRuntimeIds.has(id)} key={id}/>)}</div>;
  const mark = payload.facet === "device" ? model.mediaById.get(payload.actionMarkId) : undefined;
  return <div className="xp-trust__split xp-trust__split--conversion"><div><Intro model={model}/><MetricCollection metrics={payload.metrics}/><Action action={payload.action} mark={mark}/></div>{proof}</div>;
}

function project(lat: number, lng: number) { return { x: (lng + 180) / 360 * 100, y: (90 - lat) / 180 * 100 }; }

function Globe({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "globe-network" }> }) {
  const { globe } = model.payload;
  const nodes = new Map(globe.nodes.map((node) => [node.id, { ...node, ...project(node.lat, node.lng) }]));
  const failed = model.failedRuntimeIds.has(globe.id);
  return <figure className="xp-trust__globe" data-media-seat-id={globe.id} data-procedural-state={failed ? "error" : "live"}>
    <svg viewBox="0 0 100 100" role="img" aria-label={model.mediaById.get(globe.id)!.seat.alt}>
      <circle className="xp-trust__globe-body" cx="50" cy="50" r="43"/>
      <path className="xp-trust__globe-grid" d="M8 50h84M50 7v86M15 31c23 11 47 11 70 0M15 69c23-11 47-11 70 0M31 11c-11 25-11 53 0 78M69 11c11 25 11 53 0 78"/>
      {globe.arcs.map((arc) => { const from = nodes.get(arc.from)!; const to = nodes.get(arc.to)!; const mx = (from.x + to.x) / 2; const my = (from.y + to.y) / 2 - arc.altitude * 26; return <path className="xp-trust__globe-arc" data-tone={arc.tone} d={`M${from.x.toFixed(2)} ${from.y.toFixed(2)} Q${mx.toFixed(2)} ${my.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`} key={arc.id}/>; })}
      {globe.nodes.map((node) => { const point = nodes.get(node.id)!; return <g className="xp-trust__globe-node" transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`} key={node.id}><circle r="2.8"/><circle r="1"/></g>; })}
    </svg>
  </figure>;
}

function GlobeNetwork({ model }: { model: Extract<ResolvedTrustBurstFixture, { preset: "globe-network" }> }) {
  return <><div className="xp-trust__globe-intro"><div><Intro model={model}/><div className="xp-trust__actions">{model.payload.actions.map((action) => <Action action={action} key={action.id}/>)}</div></div><p>{model.payload.supportingCopy}</p></div>
    <div className="xp-trust__globe-layout"><MetricCollection metrics={model.payload.metrics}/><Globe model={model}/></div></>;
}

function Preset({ model }: { model: ResolvedTrustBurstFixture }) {
  if (model.preset === "proof-stage") return <ProofStage model={model}/>;
  if (model.preset === "platform-wall") return <PlatformWall model={model}/>;
  if (model.preset === "stat-band") return <><Intro model={model}/><MetricCollection className="xp-trust__metrics--band" metrics={model.payload.metrics}/></>;
  if (model.preset === "channel-switcher") return <ChannelSwitcher model={model}/>;
  if (model.preset === "reward-mosaic") return <RewardMosaic model={model}/>;
  if (model.preset === "metric-deck") return <><Intro model={model}/><MetricCollection className="xp-trust__metrics--deck" metrics={model.payload.metrics}/></>;
  if (model.preset === "metric-panel") return <div className="xp-trust__panel"><Intro model={model}/><MetricCollection metrics={model.payload.metrics}/></div>;
  if (model.preset === "evidence-split") return <EvidenceSplit model={model}/>;
  if (model.preset === "conversion-split") return <ConversionSplit model={model}/>;
  return <GlobeNetwork model={model}/>;
}

const renderPreset = ({ core }: { core: ResolvedTrustBurstFixture }) => <Preset model={core}/>;
const renderers = { compact: renderPreset, balanced: renderPreset, wide: renderPreset };

export function TrustBurst({ fixture, media, stress, className }: TrustBurstProperties) {
  const deviceClass = useDeviceClass();
  const model = resolveTrustBurstFixture(fixture, stress, media);
  return <section
    className={["xp-trust", className].filter(Boolean).join(" ")}
    data-xp-owner="TrustBurst"
    data-trust-burst-state-owner
    data-source-key={model.sourceKey}
    data-preset={model.preset}
    data-device-class={deviceClass}
    data-stress={model.activeStress}
    data-build-state={model.heldMediaIds.size ? "held-media" : "runnable"}
  ><MorphSlot className="xp-trust__morph" ladder={ladder} core={model} renderers={renderers}/></section>;
}
