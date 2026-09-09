"use client";

import { useDeviceClass } from "@xp/primitives";
import { useMemo, useState } from "react";
import type { EmptyAction, EmptyProof, EmptySurfaceFixture } from "./empty-surface-model";

function Icon({ name }: { name: string }) {
  const path = name === "nodes" ? "M6 5h5v5H6V5Zm7 9h5v5h-5v-5ZM11 8h2v8m0 0h-2" : name === "report" ? "M5 4h14v16H5V4Zm3 11 3-3 2 2 3-4" : "M5 18V11m7 7V7m7 11V3";
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path}/></svg>;
}

function Actions({ actions }: { actions: EmptyAction[] }) {
  if (!actions.length) return null;
  return <div className="xp-empty-surface__actions">{actions.map((action) => <a key={action.id} href={action.href} data-action-id={action.id} data-tone={action.tone}>{action.icon === "add" ? <span aria-hidden="true">+</span> : null}{action.label}</a>)}</div>;
}

const chooseTicks = (ticks: string[], deviceClass: string) => {
  const count = deviceClass === "M" ? Math.min(ticks.length, ticks.length >= 10 ? 4 : 3) : deviceClass === "TP" || deviceClass === "TL" ? Math.min(ticks.length, 6) : ticks.length;
  if (count >= ticks.length) return ticks;
  return Array.from({ length: count }, (_, index) => ticks[Math.round((index * (ticks.length - 1)) / (count - 1))]);
};

function EmptyChart({ proof, deviceClass }: { proof: Extract<EmptyProof, { kind: "chart" }>; deviceClass: string }) {
  const [tab, setTab] = useState(proof.tabs?.[0]?.id);
  const ticks = chooseTicks(proof.ticks, deviceClass);
  return <div className="xp-empty-surface__chart">
    {proof.tabs ? <div className="xp-empty-surface__tabs" role="tablist" aria-label="Chart view">{proof.tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div> : null}
    {proof.status ? <p className="xp-empty-surface__status"><span aria-hidden="true"/>{proof.status}</p> : null}
    <div className="xp-empty-surface__series">{proof.series.map((series, index) => <div key={series.id}><span data-series={index}/><strong>--</strong><small>{series.label}</small></div>)}</div>
    <div className="xp-empty-surface__plot" aria-hidden="true"><svg viewBox="0 0 100 32" preserveAspectRatio="none"><path d="M0 5H100M0 27H100"/></svg></div>
    <div className="xp-empty-surface__ticks">{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div>
  </div>;
}

function DashboardProof({ proof, deviceClass }: { proof: Extract<EmptyProof, { kind: "dashboard" }>; deviceClass: string }) {
  const [tab, setTab] = useState(proof.tabs[0].id);
  const cap = deviceClass === "M" ? 1 : deviceClass === "TP" ? 2 : deviceClass === "TL" ? 3 : proof.regions.length;
  return <div className="xp-empty-surface__dashboard">
    <div className="xp-empty-surface__tabs" role="tablist" aria-label="Dashboard view">{proof.tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <div className="xp-empty-surface__regions">{proof.regions.slice(0, cap).map((region) => <span key={region.id} data-region-kind={region.kind}/>)}</div>
  </div>;
}

function ProjectBrowser({ proof, deviceClass }: { proof: Extract<EmptyProof, { kind: "projects" }>; deviceClass: string }) {
  const [open, setOpen] = useState(proof.groups[0].id);
  const cap = deviceClass === "M" || deviceClass === "TP" ? 2 : deviceClass === "TL" ? 3 : 6;
  return <div className="xp-empty-surface__projects">{proof.groups.map((group) => {
    const expanded = open === group.id;
    const visible = group.projects.slice(0, cap);
    return <section key={group.id} data-expanded={expanded || undefined}>
      <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : group.id)}><strong>{group.label}</strong><span>{group.count}</span><i aria-hidden="true">⌄</i></button>
      {expanded ? <div className="xp-empty-surface__project-body"><div>{visible.map((project) => <article key={project.id}><span aria-hidden="true"/><strong>{project.name}</strong><p>{project.description}</p></article>)}</div>{visible.length < group.count ? <p className="xp-empty-surface__remaining">{group.count - visible.length} more initiatives remain in this group</p> : null}</div> : null}
    </section>;
  })}</div>;
}

export function EmptySurface({ model }: { model: EmptySurfaceFixture }) {
  const deviceClass = useDeviceClass();
  const proof = model.proof;
  const headerAction = proof.kind === "chart" ? model.actions[0] : undefined;
  const reportSelections = useMemo(() => proof.kind === "report" ? Object.fromEntries(proof.filters.map((filter) => [filter.id, filter.choices[0].id])) : {}, [proof]);
  return <section className="xp-empty-surface" data-xp-empty-renderer data-source-key={model.sourceKey} data-appearance={model.appearance} data-device-class={deviceClass} aria-labelledby={`${model.sourceKey}-title`}>
    {proof.kind !== "finance" ? <header className="xp-empty-surface__header"><div><h1 id={`${model.sourceKey}-title`}>{model.title}</h1>{model.description ? <p>{model.description}</p> : null}</div>{model.metric ? <div className="xp-empty-surface__metric"><small>{model.metric.label}</small><strong>{model.metric.value}</strong></div> : null}{headerAction ? <a className="xp-empty-surface__overflow" href={headerAction.href} data-action-id={headerAction.id} aria-label={headerAction.label}><span aria-hidden="true">⋮</span></a> : null}</header> : null}
    <div className="xp-empty-surface__body">
      {proof.kind === "message" && model.message ? <div className="xp-empty-surface__message"><Icon name={model.message.icon}/><h2>{model.message.title}</h2><p>{model.message.description}</p></div> : null}
      {proof.kind === "quotas" ? <div className="xp-empty-surface__quota-wrap"><div className="xp-empty-surface__quotas">{proof.items.map((item) => <article key={item.id}><span className="xp-empty-surface__ring"><span>0%</span></span><strong>{item.value}/{item.limit}</strong><small>{item.label}</small></article>)}</div>{proof.resetTitle ? <div className="xp-empty-surface__reset"><strong>{proof.resetTitle}</strong><p>{proof.resetDescription}</p></div> : null}</div> : null}
      {proof.kind === "chart" ? <EmptyChart proof={proof} deviceClass={deviceClass}/> : null}
      {proof.kind === "dashboard" ? <DashboardProof proof={proof} deviceClass={deviceClass}/> : null}
      {proof.kind === "finance" ? <div className="xp-empty-surface__finance"><section className="xp-empty-surface__finance-peer"><header><div><h1 id={`${model.sourceKey}-title`}>{model.title}</h1><p>{proof.chartDescription}</p></div><button type="button" aria-label={proof.chartUtilityLabel}><span aria-hidden="true">⋮</span></button></header><div className="xp-empty-surface__finance-chart"><div aria-hidden="true"/><div className="xp-empty-surface__ticks">{chooseTicks(proof.ticks, deviceClass).map((tick) => <span key={tick}>{tick}</span>)}</div></div></section><section className="xp-empty-surface__finance-peer"><header><div><h2>{proof.summaryTitle}</h2><p>{proof.summaryDescription}</p></div><button type="button" aria-label={proof.summaryUtilityLabel}><span aria-hidden="true">⋮</span></button></header><div className="xp-empty-surface__summaries">{proof.summaries.map((item, index) => <article key={item.id}><span data-summary={index} aria-hidden="true">{index === 0 ? "$" : index === 1 ? "▱" : "□"}</span><div><strong>{item.label}</strong><small>{item.value}</small></div></article>)}</div><Actions actions={model.actions}/></section></div> : null}
      {proof.kind === "report" ? <div className="xp-empty-surface__report"><div className="xp-empty-surface__filters">{proof.filters.map((filter) => <label key={filter.id}>{filter.label}<select defaultValue={reportSelections[filter.id]}>{filter.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label>)}</div><div className="xp-empty-surface__report-regions">{proof.regions.slice(0, deviceClass === "M" || deviceClass === "TP" ? 2 : 4).map((region) => <span key={region.id} data-region-kind={region.kind}/>)}</div></div> : null}
      {proof.kind === "projects" ? <ProjectBrowser proof={proof} deviceClass={deviceClass}/> : null}
      {model.message && proof.kind === "dashboard" ? <div className="xp-empty-surface__message xp-empty-surface__message--overlay"><h2>{model.message.title}</h2><p>{model.message.description}</p></div> : null}
      <Actions actions={proof.kind === "chart" || proof.kind === "finance" ? [] : model.actions}/>
    </div>
  </section>;
}
