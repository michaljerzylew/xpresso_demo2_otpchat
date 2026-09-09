import { useEffect, useRef, useState, type RefObject } from "react";
import { deviceClasses, previewSizes, type DeviceClass } from "@xp/runtime";
import { ExternalLink } from "lucide-react";
import { applyConfiguration } from "./apply";
import { previewFlag } from "./preview";
import type { ConfiguratorState } from "./config";

/** The band every frame is scaled into, and the extremes that decide the shared scale. */
const bandHeight = 268;
const widest = Math.max(...deviceClasses.map(deviceClass => previewSizes[deviceClass].width));
const tallest = Math.max(...deviceClasses.map(deviceClass => previewSizes[deviceClass].height));

export const previewRoutes = [
  { path: "/", label: "Overview" },
  { path: "/inbox", label: "Inbox" },
  { path: "/settings", label: "Settings" },
  { path: "/configure", label: "Customise" },
] as const;

/**
 * One scale for all five frames keeps the forms comparable, and the widest frame decides it, so
 * no frame can ever be wider than the rail. Measuring our own element is not a viewport read.
 */
function useFitScale(node: RefObject<HTMLElement | null>) {
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const element = node.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [node]);
  return Math.min(bandHeight / tallest, (available || widest) / widest);
}

function PreviewFrame({ deviceClass, route, state, scale }: { deviceClass: DeviceClass; route: string; state: ConfiguratorState; scale: number }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);
  const { width, height } = previewSizes[deviceClass];

  // Same-origin documents are the only channel that carries live theme state across a frame.
  useEffect(() => {
    // The initial empty document is complete too; applying fonts there starts requests that
    // the frame's first navigation cancels. Its load event makes the real document eligible.
    if (!ready) return;
    const target = frame.current?.contentDocument;
    if (target?.readyState === "complete" || target?.readyState === "interactive") applyConfiguration(state, target);
  }, [state, ready]);

  return <figure className="cfg-preview">
    <div className="cfg-preview__viewport" data-ready={ready > 0}>
      {/* zoom, not transform: it scales the layout box as well, so the frame keeps its real
          inner viewport without leaving a 1920px-wide box inside a 400px rail. */}
      <iframe ref={frame} title={`${deviceClass} preview`} tabIndex={-1}
        onLoad={() => setReady(value => value + 1)}
        src={`${route}?xp=${deviceClass}&xp-frame=1&${previewFlag}=1`}
        style={{ inlineSize: width, blockSize: height, zoom: scale }} />
      {ready > 0 ? null : <p className="cfg-preview__pending">Loading {deviceClass}…</p>}
    </div>
    <figcaption>
      <b>{deviceClass}</b><span>{width}×{height}</span>
      {/* The shell's own simulator renders a class at its canonical size in a scrollable canvas,
          so the honest "full size" is that host, opened in a tab of its own. */}
      <a className="cfg-preview__open" href={`${route}?xp=${deviceClass}`} target="_blank" rel="noreferrer"
        aria-label={`Open ${deviceClass} at full size in a new tab`}>
        <ExternalLink aria-hidden="true" />Open
      </a>
    </figcaption>
  </figure>;
}

export function PreviewStrip({ state, route, onRouteChange }: { state: ConfiguratorState; route: string; onRouteChange: (route: string) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const scale = useFitScale(rail);
  return <section className="cfg-strip" aria-label="Device class preview">
    <header className="cfg-strip__head">
      <h2>Live preview</h2>
      <label className="cfg-strip__route">Route
        <select value={route} onChange={event => onRouteChange(event.target.value)}>
          {previewRoutes.map(entry => <option key={entry.path} value={entry.path}>{entry.label}</option>)}
        </select>
      </label>
    </header>
    <div className="cfg-strip__rail" ref={rail}>
      {deviceClasses.map(deviceClass => <PreviewFrame key={deviceClass} deviceClass={deviceClass} route={route} state={state} scale={scale} />)}
    </div>
    <p className="cfg-strip__note">Each preview is the real app at that screen size. They share one scale so you can compare them; open one to see it full size.</p>
  </section>;
}
