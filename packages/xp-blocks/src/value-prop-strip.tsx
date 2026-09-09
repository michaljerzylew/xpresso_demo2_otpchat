"use client";

import { useEffect, useRef, useState } from "react";
import type { FooterLink, ValuePropItem, ValuePropStripFixture } from "./footer-model";

export type ValuePropStripProperties = { fixture: ValuePropStripFixture; className?: string };

function SystemIcon({ iconKey }: { iconKey: ValuePropItem["iconKey"] }) {
  if (iconKey === "system:delivery") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5h10v9H3zM13 10h4l3 3v3.5h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>;
  if (iconKey === "system:payment") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8H3v-4M3.5 8a8 8 0 1 1-.1 7M8 12h8" /></svg>;
}

function PropAction({ action }: { action: FooterLink }) {
  return <a href={action.href} aria-label={action.accessibleLabel} data-action-id={action.id} data-emphasis={action.emphasis} data-xp-control>{action.label}</a>;
}

export function ValuePropStrip({ fixture, className }: ValuePropStripProperties) {
  const viewport = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(fixture.initialActiveId ?? fixture.items[0].id);
  const [overflowing, setOverflowing] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => { setActiveId(fixture.initialActiveId ?? fixture.items[0].id); }, [fixture.id, fixture.initialActiveId, fixture.items]);
  const sync = () => {
    const node = viewport.current;
    if (!node) return;
    setOverflowing(node.scrollWidth > node.clientWidth + 1);
    setEdges({ start: node.scrollLeft <= 1, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1 });
    const items = [...node.querySelectorAll<HTMLElement>("[data-value-prop-id]")];
    const nearest = items.sort((a, b) => Math.abs(a.offsetLeft - node.scrollLeft) - Math.abs(b.offsetLeft - node.scrollLeft))[0];
    if (nearest?.dataset.valuePropId) setActiveId(nearest.dataset.valuePropId);
  };
  useEffect(() => {
    sync();
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fixture.items.length]);
  const move = (direction: -1 | 1) => viewport.current?.scrollBy({ left: direction * viewport.current.clientWidth * .78, behavior: "smooth" });
  return (
    <section className={["xp-value-prop-strip", className].filter(Boolean).join(" ")} aria-label="Service details" data-xp-block="value-prop-strip" data-value-prop-strip-id={fixture.id} data-skin={fixture.skin}>
      <div className="xp-value-prop-strip__viewport" ref={viewport} onScroll={sync} data-xp-scroll>
        <div className="xp-value-prop-strip__track">
          {fixture.items.map((item) => <article key={item.id} tabIndex={0} className="xp-value-prop-strip__item" data-value-prop-id={item.id} data-active={activeId === item.id ? "true" : "false"} onFocus={() => setActiveId(item.id)} onClick={() => setActiveId(item.id)}>
            <span className="xp-value-prop-strip__icon"><SystemIcon iconKey={item.iconKey} /></span>
            <span className="xp-value-prop-strip__copy"><strong>{item.title}</strong><span>{item.description}</span></span>
            {item.action ? <PropAction action={item.action} /> : null}
          </article>)}
        </div>
      </div>
      {overflowing ? <div className="xp-value-prop-strip__controls">
        <button type="button" aria-label="Previous service detail" disabled={edges.start} onClick={() => move(-1)} data-xp-control>←</button>
        <button type="button" aria-label="Next service detail" disabled={edges.end} onClick={() => move(1)} data-xp-control>→</button>
      </div> : null}
    </section>
  );
}
