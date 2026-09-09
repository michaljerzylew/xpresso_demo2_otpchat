"use client";

import { Children, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

type MarqueeProperties = HTMLAttributes<HTMLDivElement> & {
  label: string;
  pauseLabel: string;
  resumeLabel: string;
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  showToggle?: boolean;
  reverse?: boolean;
  axis?: "horizontal" | "vertical" | "responsive";
  cloneChildren?: ReactNode;
  speedPixelsPerSecond?: number;
};

export function Marquee({
  label,
  pauseLabel,
  resumeLabel,
  paused: controlledPaused,
  defaultPaused = false,
  onPausedChange,
  showToggle = true,
  reverse = false,
  axis = "horizontal",
  cloneChildren,
  speedPixelsPerSecond,
  children,
  className,
  style,
  ...properties
}: MarqueeProperties) {
  const [localPaused, setLocalPaused] = useState(defaultPaused);
  const [pageHidden, setPageHidden] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number>();
  const trackReference = useRef<HTMLDivElement>(null);
  const setReference = useRef<HTMLDivElement>(null);
  const paused = controlledPaused ?? localPaused;

  useEffect(() => {
    const syncVisibility = () => setPageHidden(document.visibilityState !== "visible");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useLayoutEffect(() => {
    if (!speedPixelsPerSecond || !trackReference.current || !setReference.current) return;
    const measure = () => {
      const vertical = getComputedStyle(trackReference.current!).flexDirection === "column";
      const box = setReference.current!.getBoundingClientRect();
      const distance = vertical ? box.height : box.width;
      setDurationSeconds(Math.max(1, distance / speedPixelsPerSecond));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(setReference.current);
    return () => observer.disconnect();
  }, [axis, speedPixelsPerSecond]);

  const setPaused = (next: boolean) => {
    if (controlledPaused === undefined) setLocalPaused(next);
    onPausedChange?.(next);
  };

  return (
    <div
      {...properties}
      className={["xp-marquee", className].filter(Boolean).join(" ")}
      style={{ ...style, ...(durationSeconds ? { "--xp-marquee-duration": `${durationSeconds}s` } : {}) } as CSSProperties}
      data-paused={paused || pageHidden ? "true" : "false"}
      data-direction={reverse ? "reverse" : "forward"}
      data-axis={axis}
      data-xp-primitive="marquee"
      aria-label={label}
    >
      <div className="xp-marquee__viewport" data-xp-scroll>
        <div className="xp-marquee__track" ref={trackReference} data-measured-duration={durationSeconds ?? undefined} data-speed-px-s={speedPixelsPerSecond ?? undefined}>
          <div className="xp-marquee__set" ref={setReference}>{children}</div>
          <div className="xp-marquee__set" aria-hidden="true" inert>{cloneChildren ?? Children.toArray(children)}</div>
        </div>
      </div>
      {showToggle ? (
        <button className="xp-marquee__toggle" type="button" data-xp-control onClick={() => setPaused(!paused)}>
          {paused ? resumeLabel : pauseLabel}
        </button>
      ) : null}
    </div>
  );
}
