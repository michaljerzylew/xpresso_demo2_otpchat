"use client";

import {
  Children,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useDeviceClassLock } from "./device-class";

type SnapRailProperties = HTMLAttributes<HTMLDivElement> & {
  label: string;
  paginationLabel: string;
  markerLabel: (index: number) => string;
  peek?: `${number}%`;
  cap?: string;
  markers?: "auto" | "none";
  physics?: "native" | "embla";
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
};

function validatedPeek(peek: `${number}%`) {
  const value = Number.parseFloat(peek);
  if (!Number.isFinite(value) || value < 8 || value > 15) {
    throw new Error("SnapRail peek must be between 8% and 15%.");
  }
  return `${value}cqi`;
}

function SnapRailRoot({
  label,
  paginationLabel,
  markerLabel,
  peek = "12%",
  cap = "var(--slot-s2-max)",
  markers = "auto",
  physics = "native",
  className,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  activeIndex,
  onActiveChange,
  ...properties
}: SnapRailProperties) {
  const [emblaReference, embla] = useEmblaCarousel({ active: physics === "embla", dragFree: true, containScroll: "trimSnaps" });
  const nativeReference = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ pointer: number; x: number; scroll: number } | null>(null);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  useDeviceClassLock(dragging);
  const count = Children.count(children);
  const renderedActive = activeIndex === undefined ? active : Math.max(0, Math.min(Math.max(0, count - 1), activeIndex));

  const setReferences = useCallback((node: HTMLDivElement | null) => {
    nativeReference.current = node;
    emblaReference(node);
  }, [emblaReference]);

  useEffect(() => {
    if (!embla || physics !== "embla") return;
    const update = () => {
      const next = embla.selectedScrollSnap();
      setActive(next);
      onActiveChange?.(next);
    };
    update();
    embla.on("select", update);
    const begin = () => setDragging(true);
    const end = () => setDragging(false);
    embla.on("pointerDown", begin);
    embla.on("pointerUp", end);
    return () => {
      embla.off("select", update);
      embla.off("pointerDown", begin);
      embla.off("pointerUp", end);
    };
  }, [embla, onActiveChange, physics]);

  useEffect(() => {
    if (activeIndex === undefined || count === 0) return;
    const next = Math.max(0, Math.min(count - 1, activeIndex));
    setActive(next);
    if (physics === "embla") embla?.scrollTo(next);
    else nativeReference.current?.querySelectorAll<HTMLElement>("[data-xp-rail-item]")[next]?.scrollIntoView({ block: "nearest", inline: "start" });
  }, [activeIndex, count, embla, physics]);

  const updateNativeActive = () => {
    const viewport = nativeReference.current;
    if (!viewport || physics !== "native") return;
    const items = [...viewport.querySelectorAll<HTMLElement>("[data-xp-rail-item]")];
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const nearest = maximum > 1 && viewport.scrollLeft >= maximum - 1
      ? Math.max(0, items.length - 1)
      : items.reduce((best, item, index) => (
        Math.abs(item.offsetLeft - viewport.scrollLeft) < Math.abs(items[best]?.offsetLeft - viewport.scrollLeft)
          ? index
          : best
      ), 0);
    setActive(nearest);
    onActiveChange?.(nearest);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || physics !== "native" || event.pointerType !== "mouse") return;
    if ((event.target as HTMLElement).closest("button,a,input,select,textarea,[role='button']")) return;
    const viewport = event.currentTarget;
    drag.current = { pointer: event.pointerId, x: event.clientX, scroll: viewport.scrollLeft };
    setDragging(true);
    viewport.setPointerCapture(event.pointerId);
    viewport.dataset.dragging = "true";
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.current.scroll + drag.current.x - event.clientX;
  };
  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    updateNativeActive();
  };
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    onWheel?.(event);
    if (event.defaultPrevented || physics !== "native" || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const viewport = event.currentTarget;
    if (viewport.scrollWidth <= viewport.clientWidth) return;
    event.preventDefault();
    viewport.scrollLeft += event.deltaY;
    updateNativeActive();
  };
  const goTo = (index: number) => {
    if (physics === "embla") embla?.scrollTo(index);
    else nativeReference.current?.querySelectorAll<HTMLElement>("[data-xp-rail-item]")[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div
      className={["xp-snap-rail-shell", className].filter(Boolean).join(" ")}
      data-xp-primitive="snap-rail"
      style={{ "--xp-rail-peek": validatedPeek(peek), "--xp-rail-cap": cap } as CSSProperties}
    >
      <div
        {...properties}
        ref={setReferences}
        className="xp-snap-rail"
        data-xp-rail
        aria-label={label}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onWheel={handleWheel}
        onScroll={updateNativeActive}
      >
        <div className="xp-snap-rail__track">{children}</div>
      </div>
      {markers === "auto" && count > 1 ? (
        <div className="xp-snap-rail__markers" aria-label={paginationLabel}>
          {Array.from({ length: count }, (_, index) => (
            <button
              className="xp-snap-rail__marker"
              type="button"
              aria-label={markerLabel(index + 1)}
              aria-current={index === renderedActive ? "true" : undefined}
              data-xp-control
              key={index}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const SnapRailItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SnapRailItem(
  { className, ...properties },
  reference,
) {
  return <div {...properties} ref={reference} className={["xp-snap-rail__item", className].filter(Boolean).join(" ")} data-xp-rail-item />;
});

export const SnapRail = Object.assign(SnapRailRoot, { Item: SnapRailItem });
