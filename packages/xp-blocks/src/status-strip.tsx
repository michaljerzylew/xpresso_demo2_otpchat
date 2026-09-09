"use client";

import { useDeviceClass } from "@xp/primitives";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { StatusService, StatusStripFixture, StatusTick } from "./status-strip-model";

function ServiceStrip({ service, expanded, onExpand, expandLabel, collapseLabel, dismissLabel, instructions }: { service: StatusService; expanded: boolean; onExpand: () => void; expandLabel: string; collapseLabel: string; dismissLabel: string; instructions: string }) {
  const [activeTick, setActiveTick] = useState<StatusTick>();
  const activateAt = (index: number) => {
    const bounded = Math.max(0, Math.min(service.ticks.length - 1, index));
    setActiveTick(service.ticks[bounded]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = Math.max(0, service.ticks.findIndex(({ id }) => id === activeTick?.id));
    if (event.key === "ArrowLeft") { event.preventDefault(); activateAt(current - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); activateAt(current + 1); }
    if (event.key === "Home") { event.preventDefault(); activateAt(0); }
    if (event.key === "End") { event.preventDefault(); activateAt(service.ticks.length - 1); }
    if (event.key === "Escape") { event.preventDefault(); setActiveTick(undefined); }
  };
  return <article className="xp-status-strip__service" data-expanded={expanded || undefined}><header><div><h3>{service.label}</h3><span data-status={service.statusTone}>{service.statusLabel}</span></div><strong>{service.uptimeLabel}</strong><button type="button" aria-expanded={expanded} onClick={onExpand} data-xp-control>{expanded ? collapseLabel : expandLabel}</button></header>{service.meta?.length ? <dl>{service.meta.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : null}<div className="xp-status-strip__ticks" role="listbox" aria-label={instructions} aria-activedescendant={activeTick ? `${service.id}-${activeTick.id}` : undefined} tabIndex={0} onKeyDown={onKeyDown} data-xp-control>{service.ticks.map((tick) => <span id={`${service.id}-${tick.id}`} role="option" aria-selected={activeTick?.id === tick.id} aria-label={`${tick.label}, ${tick.tone}`} data-tone={tick.tone} data-selected={activeTick?.id === tick.id || undefined} onClick={() => setActiveTick(tick)} onMouseEnter={() => setActiveTick(tick)} key={tick.id}><span/></span>)}</div>{activeTick ? <aside className="xp-status-strip__detail"><strong>{activeTick.label}</strong><dl>{activeTick.detail.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl><button type="button" onClick={() => setActiveTick(undefined)} data-xp-control>{dismissLabel}</button></aside> : null}{service.incidents?.length ? <section className="xp-status-strip__incidents" aria-label={service.label}>{service.incidents.map((incident) => <article key={incident.id}><div><strong>{incident.label}</strong><span>{incident.statusLabel}</span></div><p>{incident.description}</p></article>)}</section> : null}</article>;
}

export function StatusStrip({ fixture, stress }: { fixture: StatusStripFixture; stress?: keyof StatusStripFixture["stress"] }) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture, [fixture, stress]);
  const [expandedId, setExpandedId] = useState<string | undefined>(model.expandedServiceId ?? (model.preset === "monitor-accordion" ? model.services[0]?.id : undefined));
  return <section className="xp-status-strip" data-xp-status-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-form={deviceClass === "M" ? "compact-strip" : deviceClass === "TP" ? "summary-strip" : deviceClass === "TL" ? "list-detail" : deviceClass === "DS" ? "full-strip" : "status-pane"} aria-labelledby={`${model.sourceKey}-title`}><header><h2 id={`${model.sourceKey}-title`}>{model.title}</h2><dl>{model.summary.map((item) => <div key={item.id} data-tone={item.tone}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></header><div className="xp-status-strip__services">{model.services.map((service) => <ServiceStrip service={service} expanded={expandedId === service.id} onExpand={() => setExpandedId((current) => current === service.id ? undefined : service.id)} expandLabel={model.copy.expandLabel} collapseLabel={model.copy.collapseLabel} dismissLabel={model.copy.dismissDetailLabel} instructions={model.copy.stripInstructions} key={service.id}/>)}</div><footer className="xp-status-strip__legend" aria-label={model.copy.legendLabel}>{model.legend.map((item) => <span data-tone={item.tone} key={item.tone}><i/>{item.label}</span>)}</footer></section>;
}
