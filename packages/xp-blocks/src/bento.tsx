"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AdaptiveOverlay, Field, SnapRail, useDeviceClass } from "@xp/primitives";
import {
  resolveBentoFixture,
  type BentoAction,
  type BentoCollection,
  type BentoControl,
  type BentoFixture,
  type BentoIdentity,
  type BentoMediaRecord,
  type BentoRow,
  type BentoSourceKey,
  type BentoSystemSurface,
  type BentoTile,
  type ResolvedBentoFixture,
  type ResolvedBentoMedia,
} from "./bento-model";
import type { ResolvedFeatureFixture } from "./feature-model";
import { FeatureBentoRenderer } from "./feature-bento";

type ProofOrganKind =
  | "dashboard-network" | "dashboard-metrics" | "diagram-radial" | "diagram-flow" | "diagram-stack" | "code-diff" | "file-tree" | "pipeline" | "security"
  | "finance-radial" | "finance-ledger" | "phone" | "transfer" | "people-grid" | "efficiency" | "schedule"
  | "four-axis" | "candidate-match" | "network-growth" | "preset" | "colour" | "typography" | "import-export"
  | "collaboration" | "conversation" | "terminal" | "code-post" | "motion" | "templates" | "install-tree"
  | "design-to-code" | "ide-tree" | "calendar" | "component-states" | "token-workbench" | "code-list";

const SYSTEM_PROOF_KINDS:Partial<Record<BentoSourceKey,Record<string,ProofOrganKind>>>={
  "bento-grid-07":{surf_dash_1:"dashboard-network",surf_dash_2:"dashboard-metrics",surf_seat_diag_1:"diagram-radial",surf_seat_diag_2:"diagram-flow",surf_seat_diag_3:"diagram-stack"},
  "bento-grid-12":{surf_12_1:"code-diff",surf_12_2:"file-tree",surf_12_3:"pipeline",surf_12_4:"security"},
  "bento-grid-17":{surf_assign:"people-grid",surf_efficiency:"efficiency",surf_schedule:"schedule"},
  "bento-grid-21":{surf_cli:"terminal",surf_chat_result:"conversation"},
  "bento-grid-22":{surf_22_code_post:"code-post",surf_22_motion_geometry:"motion",surf_22_pattern_catalog:"templates",surf_install:"install-tree"},
  "bento-grid-23":{surf_prompt:"design-to-code",surf_tree:"ide-tree",surf_chat_result:"conversation"},
  "bento-grid-24":{surf_cal:"calendar",surf_upd:"code-list"},
};

const TILE_PROOF_KINDS:Partial<Record<BentoSourceKey,Record<string,ProofOrganKind>>>={
  "bento-grid-15":{tile_1:"finance-radial",tile_2:"finance-ledger",tile_3:"phone",tile_4:"transfer"},
  "bento-grid-18":{tile_2:"four-axis",tile_3:"network-growth",tile_4:"candidate-match"},
  "bento-grid-20":{tile_1:"preset",tile_2:"colour",tile_3:"typography",tile_5:"import-export"},
  "bento-grid-21":{tile_5:"collaboration"},
  "bento-grid-24":{tile_1:"component-states",tile_5:"token-workbench"},
};

export type BentoProperties = {
  fixture: BentoFixture;
  media: BentoMediaRecord[];
  stress?: string;
  className?: string;
} | {
  featureModel: ResolvedFeatureFixture;
  className?: string;
};

function MediaAsset({ asset }: { asset: ResolvedBentoMedia }) {
  const data = { "data-media-seat-id":asset.seatId,"data-media-key":asset.key,"data-media-kind":asset.kind };
  if(asset.kind==="vector"||asset.kind==="illustration")return <picture {...data} className="xp-bento__media">{asset.darkSrc?<source media="(prefers-color-scheme: dark)" srcSet={asset.darkSrc}/>:null}<img src={asset.src} alt={asset.alt} loading="lazy" decoding="async"/></picture>;
  if(asset.kind==="avatar")return <img {...data} className="xp-bento__avatar" src={asset.src} alt={asset.alt} loading="lazy" decoding="async"/>;
  return <picture {...data} className="xp-bento__media"><source type="image/avif" srcSet={`${asset.publicBase}-640.avif 640w, ${asset.publicBase}-1280.avif 1280w, ${asset.publicBase}-1920.avif 1920w`}/><source type="image/webp" srcSet={`${asset.publicBase}-640.webp 640w, ${asset.publicBase}-1280.webp 1280w, ${asset.publicBase}-1920.webp 1920w`}/><img src={`${asset.publicBase}-1280.jpg`} alt={asset.alt} loading="lazy" decoding="async"/></picture>;
}

function TileMedia({ tile, model }: { tile:BentoTile;model:ResolvedBentoFixture }) {
  const boundMediaIds=new Set([
    ...model.identities.flatMap(({mediaSeatId})=>mediaSeatId?[mediaSeatId]:[]),
    ...model.collections.flatMap(({items})=>(items??[]).flatMap(({mediaSeatId})=>mediaSeatId?[mediaSeatId]:[])),
  ]);
  const mediaSeatIds=tile.mediaSeatIds.filter((id)=>!boundMediaIds.has(id));
  if(!mediaSeatIds.length)return null;
  return <div className="xp-bento__media-field" data-media-count={mediaSeatIds.length}>{mediaSeatIds.map((id)=>{const asset=model.mediaBySeatId.get(id);return asset?<MediaAsset asset={asset} key={id}/>:null;})}</div>;
}

function MetricList({ ids, model }: { ids:string[];model:ResolvedBentoFixture }) {
  const metrics=ids.map((id)=>model.metrics.find((metric)=>metric.id===id)).filter(Boolean) as ResolvedBentoFixture["metrics"];
  if(!metrics.length)return null;
  return <dl className="xp-bento__metrics">{metrics.map((metric)=><div data-metric-id={metric.id} key={metric.id}><dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.delta?<small data-tone={metric.delta.tone}>{metric.delta.display}</small>:null}{metric.trend?<small>{metric.trend}</small>:null}</div>)}</dl>;
}

function ProofOrgan({ kind, label, options=[], value, selectedDate }: { kind:ProofOrganKind;label:string;options?:string[];value?:string|number|boolean;selectedDate?:string }) {
  const date=selectedDate?new Date(`${selectedDate}T00:00:00Z`):undefined;
  const calendarDays=date?Array.from({length:new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()},(_,index)=>index+1):[];
  return <div className="xp-bento__proof-organ" data-proof-organ data-proof-kind={kind} role="img" aria-label={label}>
    <div className="xp-bento__proof-stage" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
    {options.length?<div className="xp-bento__proof-options">{options.map((option)=><span data-active={String(value)===option||undefined} key={option}>{option}</span>)}</div>:null}
    {calendarDays.length?<div className="xp-bento__calendar" aria-label={selectedDate}>{calendarDays.map((day)=><span data-selected={day===date?.getUTCDate()||undefined} key={day}>{day}</span>)}</div>:null}
  </div>;
}

function TileProof({ tile, model, controls }: { tile:BentoTile;model:ResolvedBentoFixture;controls:Record<string,string|number|boolean> }) {
  const kind=TILE_PROOF_KINDS[model.sourceKey]?.[tile.id];
  if(!kind)return null;
  const payload=tile.payload;
  const collection=payload.kind==="collection"?model.collections.find(({id})=>id===payload.collectionId):undefined;
  const ownedControls=payload.kind==="control"?payload.controlIds.map((id)=>model.controls.find((control)=>control.id===id)).filter(Boolean) as BentoControl[]:[];
  const control=ownedControls[0];
  const surfaceId=payload.kind==="proof"||payload.kind==="mock"?payload.surfaceIds[0]:payload.kind==="control"?payload.resultSurfaceId:undefined;
  const surface=surfaceId?model.systemSurfaces.find(({id})=>id===surfaceId):undefined;
  const label=payload.kind==="feature"?payload.title:collection?.label??control?.label??surface?.title??surface?.label??tile.id;
  const options=ownedControls.flatMap((item)=>item.options?.map(({label:optionLabel})=>optionLabel)??[item.label]);
  return <ProofOrgan kind={kind} label={label} options={options} value={control?controls[control.id]:undefined}/>;
}

function RowList({ rows }: { rows:BentoRow[] }) {
  const interactive=rows.some(({id})=>/^row_(?:chk|cell)_/.test(id));
  const initialSelected=useMemo(()=>new Set(rows.filter(({value})=>value==="Checked"||value==="Assigned").map(({id})=>id)),[rows]);
  const [selected,setSelected]=useState(initialSelected);
  useEffect(()=>setSelected(initialSelected),[initialSelected]);
  if(!rows.length)return null;
  return <ul className="xp-bento__rows">{rows.map((row)=>{
    if(!interactive)return <li data-row-id={row.id} data-tone={row.tone} key={row.id}><span>{row.label}</span>{row.value?<strong>{row.value}</strong>:null}</li>;
    const checked=selected.has(row.id),isChecklist=row.id.startsWith("row_chk_");
    return <li key={row.id}><button className="xp-bento__row-action" type="button" data-row-id={row.id} data-tone={checked?"positive":"neutral"} data-xp-control aria-pressed={checked} onClick={()=>setSelected((current)=>{const next=new Set(current);if(next.has(row.id))next.delete(row.id);else next.add(row.id);return next;})}><span>{row.label}</span><strong>{isChecklist?(checked?"Checked":"Unchecked"):(checked?"Assigned":"Unassigned")}</strong></button></li>;
  })}</ul>;
}

function ListView({ rows, initialVisibleRows, model }: { rows:BentoRow[];initialVisibleRows:number;model:ResolvedBentoFixture }) {
  const device=useDeviceClass(),compact=device==="M"||device==="TP";
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>setExpanded(false),[model.sourceKey,device,initialVisibleRows]);
  const hasDisclosure=compact&&initialVisibleRows<rows.length;
  return <div className="xp-bento__list"><RowList rows={hasDisclosure&&!expanded?rows.slice(0,initialVisibleRows):rows}/>{hasDisclosure?<button className="xp-bento__list-disclosure" type="button" data-list-disclosure data-xp-control aria-expanded={expanded} onClick={()=>setExpanded((current)=>!current)}>{expanded?model.copy.collapseLabel:model.copy.expandLabel}</button>:null}</div>;
}

function IdentityList({ identities, model }: { identities:BentoIdentity[];model:ResolvedBentoFixture }) {
  if(!identities.length)return null;
  return <div className="xp-bento__identities" data-identity-count={identities.length}>{identities.map((identity)=>{
    const label=identity.name??identity.label??identity.id;
    const asset=identity.mediaSeatId?model.mediaBySeatId.get(identity.mediaSeatId):undefined;
    return <figure data-identity-id={identity.id} key={identity.id}>{asset?<MediaAsset asset={asset}/>:<span className="xp-bento__initials" aria-hidden="true">{label.split(/\s+/).map((part)=>part[0]).join("").slice(0,2)}</span>}<figcaption><strong>{label}</strong><span>{identity.role}</span></figcaption></figure>;
  })}</div>;
}

function SystemSurface({ surface, model, summary=false }: { surface:BentoSystemSurface;model:ResolvedBentoFixture;summary?:boolean }) {
  const rows=(surface.rowIds??[]).map((id)=>model.rows.find((row)=>row.id===id)).filter(Boolean) as BentoRow[];
  const title=surface.title??surface.label??surface.id;
  const proofKind=SYSTEM_PROOF_KINDS[model.sourceKey]?.[surface.id];
  const stateOptions=Array.isArray(surface.stateOptions)?surface.stateOptions:Object.values(surface.stateOptions??{});
  return <section className="xp-bento__system" data-system-surface-id={surface.id} data-system-kind={surface.kind} tabIndex={0}>
    <header><span className="xp-bento__system-mark" aria-hidden="true"/><h3>{title}</h3></header>
    {!summary&&surface.body?<p>{surface.body}</p>:null}
    {!summary&&surface.selectedDate?<time dateTime={surface.selectedDate}>{surface.selectedDate}</time>:null}
    {!summary&&proofKind?<ProofOrgan kind={proofKind} label={title} selectedDate={surface.selectedDate}/>:null}
    {!summary&&stateOptions.length?<div className="xp-bento__state-options">{stateOptions.map((option)=><span key={option}>{option}</span>)}</div>:null}
    {!summary&&surface.branches?.length?<ul className="xp-bento__branches">{surface.branches.map((branch)=><li data-status={branch.status} key={branch.id}><span>{branch.label}</span><strong>{branch.status}</strong></li>)}</ul>:null}
    {!summary?<RowList rows={rows}/>:null}
    {surface.kind==="chart"&&!summary?<div className="xp-bento__plot" role="img" aria-label={title}><i/><i/><i/><i/><i/></div>:null}
  </section>;
}

function CollectionView({ collection, model, empty, selectedLast }: { collection:BentoCollection;model:ResolvedBentoFixture;empty:boolean;selectedLast:boolean }) {
  const items=collection.rowIds?.map((id)=>model.rows.find((row)=>row.id===id)).filter(Boolean) as BentoRow[]|undefined;
  const direct=collection.items??[];
  return <section className="xp-bento__collection" data-collection-id={collection.id}>
    {collection.label?<h3>{collection.label}</h3>:null}{collection.description?<p>{collection.description}</p>:null}
    {empty?<p className="xp-bento__empty">{model.copy.emptyLabel}</p>:items?.length?<RowList rows={items}/>:<ul>{direct.map((item,index)=>{const asset=item.mediaSeatId?model.mediaBySeatId.get(item.mediaSeatId):undefined;return <li data-collection-item-id={item.id} data-selected={selectedLast&&index===direct.length-1||undefined} key={item.id}>{asset?<MediaAsset asset={asset}/>:null}<span>{item.label??item.title??item.id}</span>{item.value??item.status??item.summary?<strong>{item.value??item.status??item.summary}</strong>:null}{item.productCount!==undefined?<small>{item.productCount}</small>:null}</li>;})}</ul>}
  </section>;
}

function ControlView({ control, value, onChange, invalid }: { control:BentoControl;value:string|number|boolean;onChange:(value:string|number|boolean)=>void;invalid:boolean }) {
  if(control.kind==="toggle")return <label className="xp-bento__toggle" data-control-id={control.id}><input type="checkbox" checked={Boolean(value)} onChange={(event)=>onChange(event.currentTarget.checked)} data-xp-control/><span>{control.label}</span></label>;
  if(control.kind==="slider"||control.kind==="rating")return <Field className="xp-bento__field" id={`bento-${control.id}`} data-control-id={control.id} invalid={invalid} hasError={invalid}><Field.Label>{control.label}</Field.Label><Field.Input type="range" min={control.kind==="rating"?1:0} max={control.kind==="rating"?5:100} value={Number(value)} onChange={(event)=>onChange(Number(event.currentTarget.value))} inputMode="numeric" enterKeyHint="done" autoComplete="off"/>{invalid?<Field.Error>{control.label}</Field.Error>:null}</Field>;
  if(control.kind==="text")return <Field className="xp-bento__field" id={`bento-${control.id}`} data-control-id={control.id} invalid={invalid} hasError={invalid}><Field.Label>{control.label}</Field.Label><Field.Input value={String(value)} onChange={(event)=>onChange(event.currentTarget.value)} inputMode="text" enterKeyHint="done" autoComplete="off"/>{invalid?<Field.Error>{control.label}</Field.Error>:null}</Field>;
  return <Field className="xp-bento__field" id={`bento-${control.id}`} data-control-id={control.id} invalid={invalid} hasError={invalid}><Field.Label>{control.label}</Field.Label><Field.Select value={String(value)} onChange={(event)=>onChange(event.currentTarget.value)} autoComplete="off">{control.options?.length?control.options.map((option)=><option value={option.value} key={option.id}>{option.label}</option>):<option value={String(value)}>{String(value)}</option>}</Field.Select>{invalid?<Field.Error>{control.label}</Field.Error>:null}</Field>;
}

function ActionView({ action, processing, pressed, onInvoke }: { action:BentoAction;processing:boolean;pressed:boolean;onInvoke:(action:BentoAction)=>void }) {
  const content=processing&&action.processingLabel?action.processingLabel:action.label;
  const properties={className:"xp-bento__action","data-action-id":action.id,"data-action-owner":action.ownerId,"data-emphasis":action.emphasis,"data-xp-control":""};
  if(action.kind==="navigate")return <a {...properties} href={action.href}>{content}</a>;
  return <button {...properties} type="button" disabled={processing||Boolean(action.disabledReason)} aria-pressed={action.kind==="toggle"?pressed:undefined} onClick={()=>onInvoke(action)}>{content}</button>;
}

function ActionSet({ ownerId, model, processing, invokedActions, onInvoke }: { ownerId:string;model:ResolvedBentoFixture;processing:boolean;invokedActions:Set<string>;onInvoke:(action:BentoAction)=>void }) {
  const actions=model.actions.filter((action)=>action.ownerId===ownerId);
  if(!actions.length)return null;
  return <div className="xp-bento__actions" data-action-owner-set={ownerId}>{actions.map((action)=><ActionView action={action} processing={processing} pressed={invokedActions.has(action.id)} onInvoke={onInvoke} key={action.id}/>)}</div>;
}

function DetailSurface({ tile, model }: { tile:BentoTile;model:ResolvedBentoFixture }) {
  const ids=tile.payload.kind==="mock"||tile.payload.kind==="proof"?tile.payload.surfaceIds:tile.systemSurfaceIds??[];
  const surfaces=ids.map((id)=>model.systemSurfaces.find((surface)=>surface.id===id)).filter(Boolean) as BentoSystemSurface[];
  const [open,setOpen]=useState(false);
  const triggerId=`bento-detail-${model.sourceKey}-${tile.id}`;
  if(!surfaces.length)return null;
  return <AdaptiveOverlay intent="detail" open={open} onOpenChange={(next)=>{setOpen(next);if(!next)requestAnimationFrame(()=>document.getElementById(triggerId)?.focus())}}><AdaptiveOverlay.Trigger id={triggerId} className="xp-bento__detail-trigger">{model.copy.openLabel}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-bento__overlay"><AdaptiveOverlay.Header title={surfaces[0].title??model.copy.openLabel} description={surfaces[0].body} closeLabel={model.copy.closeLabel}/><AdaptiveOverlay.Body>{surfaces.map((surface)=><SystemSurface surface={surface} model={model} key={surface.id}/>)}</AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function explicitlyOwnedSurfaceIds(model:ResolvedBentoFixture) {
  return new Set(model.tiles.flatMap((candidate)=>{
    const payload=candidate.payload;
    const payloadIds=payload.kind==="proof"||payload.kind==="mock"
      ? payload.surfaceIds
      : payload.kind==="metric"&&payload.visualId
        ? [payload.visualId]
        : [];
    return [...payloadIds,...(candidate.systemSurfaceIds??[])];
  }));
}

function TilePayload({ tile, model, controls, setControl, invalid, empty, selectedLast }: { tile:BentoTile;model:ResolvedBentoFixture;controls:Record<string,string|number|boolean>;setControl:(id:string,value:string|number|boolean)=>void;invalid:boolean;empty:boolean;selectedLast:boolean }) {
  const payload=tile.payload;
  if(payload.kind==="feature")return <><div className="xp-bento__copy">{payload.iconKey?<span className="xp-bento__icon" aria-hidden="true">{payload.iconKey.slice(0,2).toUpperCase()}</span>:null}<h2>{payload.title}</h2>{payload.body.map((line,index)=><p key={index}>{line}</p>)}</div><MetricList ids={payload.factIds??[]} model={model}/></>;
  if(payload.kind==="metric")return <><MetricList ids={payload.metricIds} model={model}/>{payload.visualId?model.systemSurfaces.filter(({id})=>id===payload.visualId).map((surface)=><SystemSurface surface={surface} model={model} key={surface.id}/>):null}</>;
  if(payload.kind==="proof")return <>{payload.surfaceIds.map((id)=>{const surface=model.systemSurfaces.find((item)=>item.id===id);return surface?<SystemSurface surface={surface} model={model} key={id}/>:null;})}<IdentityList identities={(payload.identityIds??[]).map((id)=>model.identities.find((identity)=>identity.id===id)).filter(Boolean) as BentoIdentity[]} model={model}/></>;
  if(payload.kind==="media")return payload.caption?<p className="xp-bento__caption">{payload.caption}</p>:null;
  if(payload.kind==="mock")return <>{payload.surfaceIds.map((id)=>{const surface=model.systemSurfaces.find((item)=>item.id===id);return surface?<SystemSurface surface={surface} model={model} summary key={id}/>:null;})}</>;
  if(payload.kind==="list")return <ListView rows={payload.rowIds.map((id)=>model.rows.find((row)=>row.id===id)).filter(Boolean) as BentoRow[]} initialVisibleRows={payload.initialVisibleRows} model={model}/>;
  if(payload.kind==="collection"){
    const collection=model.collections.find(({id})=>id===payload.collectionId);
    return collection?<CollectionView collection={collection} model={model} empty={empty} selectedLast={selectedLast}/>:null;
  }
  if(payload.kind==="control"){
    const resultIsOwned=explicitlyOwnedSurfaceIds(model).has(payload.resultSurfaceId);
    return <div className="xp-bento__controls">{payload.controlIds.map((id)=>{const control=model.controls.find((item)=>item.id===id);return control?<ControlView control={control} value={controls[id]} onChange={(value)=>setControl(id,value)} invalid={invalid} key={id}/>:null;})}{resultIsOwned?null:model.systemSurfaces.filter(({id})=>id===payload.resultSurfaceId).map((surface)=><SystemSurface surface={surface} model={model} key={surface.id}/>)}</div>;
  }
  return <ol className="xp-bento__process">{payload.stepIds.map((id)=><li data-active={id===payload.activeStepId||undefined} key={id}>{model.processes.find((step)=>step.id===id)?.label??id}</li>)}</ol>;
}

function BentoTileView({ tile, model, controls, setControl, processing, invalid, empty, selectedLast, invokedActions, onInvoke, unownedIdentities }: { tile:BentoTile;model:ResolvedBentoFixture;controls:Record<string,string|number|boolean>;setControl:(id:string,value:string|number|boolean)=>void;processing:boolean;invalid:boolean;empty:boolean;selectedLast:boolean;invokedActions:Set<string>;onInvoke:(action:BentoAction)=>void;unownedIdentities:BentoIdentity[] }) {
  const device=useDeviceClass();
  const span=device==="TL"||device==="DS"||device==="DW"?tile.span[device]:undefined;
  const style=span?({"--xp-bento-column":span.columnStart??"auto","--xp-bento-span":span.columnSpan,"--xp-bento-row-span":span.rowSpan??1} as CSSProperties):undefined;
  return <article className="xp-bento__tile" style={style} data-bento-tile-id={tile.id} data-role={tile.role} data-rank={tile.rank} data-lead={model.leadTileId===tile.id||undefined} data-density={device==="TL"||device==="DS"||device==="DW"?tile.density[device]:"compact"}>
    <TileMedia tile={tile} model={model}/>
    <TilePayload tile={tile} model={model} controls={controls} setControl={setControl} invalid={invalid} empty={empty} selectedLast={selectedLast}/>
    <TileProof tile={tile} model={model} controls={controls}/>
    {device==="M"||device==="TP"?<DetailSurface tile={tile} model={model}/>:null}
    {model.leadTileId===tile.id&&unownedIdentities.length?<IdentityList identities={unownedIdentities} model={model}/>:null}
    {tile.systemSurfaceIds?.map((id)=>{const surface=model.systemSurfaces.find((item)=>item.id===id);return surface?<SystemSurface surface={surface} model={model} key={id}/>:null;})}
    <ActionSet ownerId={tile.id} model={model} processing={processing} invokedActions={invokedActions} onInvoke={onInvoke}/>
  </article>;
}

function Intro({ model, controls, setControl, invalid, processing, invokedActions, onInvoke }: { model:ResolvedBentoFixture;controls:Record<string,string|number|boolean>;setControl:(id:string,value:string|number|boolean)=>void;invalid:boolean;processing:boolean;invokedActions:Set<string>;onInvoke:(action:BentoAction)=>void }) {
  const ownedControlIds=new Set(model.tiles.flatMap((tile)=>tile.payload.kind==="control"?tile.payload.controlIds:[]));
  const loose=model.controls.filter(({id})=>!ownedControlIds.has(id));
  const explicitSurfaceIds=explicitlyOwnedSurfaceIds(model);
  const looseResultIds=new Set(loose.flatMap(({resultSurfaceId})=>resultSurfaceId&&!explicitSurfaceIds.has(resultSurfaceId)?[resultSurfaceId]:[]));
  if(!model.intro&&!loose.length&&!model.actions.some(({ownerId})=>ownerId==="intro"))return null;
  return <header className="xp-bento__intro" data-bento-intro>{model.intro?.eyebrow?<p className="xp-bento__eyebrow">{model.intro.eyebrow}</p>:null}{model.intro?<><h1>{model.intro.title}</h1>{model.intro.body.map((line,index)=><p key={index}>{line}</p>)}</>:null}{loose.length?<div className="xp-bento__controls xp-bento__controls--intro">{loose.map((control)=><ControlView control={control} value={controls[control.id]} onChange={(value)=>setControl(control.id,value)} invalid={invalid} key={control.id}/>)}{model.systemSurfaces.filter(({id})=>looseResultIds.has(id)).map((surface)=><SystemSurface surface={surface} model={model} key={surface.id}/>)}</div>:null}<ActionSet ownerId="intro" model={model} processing={processing} invokedActions={invokedActions} onInvoke={onInvoke}/></header>;
}

function BentoResolved({ model, className }: { model:ResolvedBentoFixture;className?:string }) {
  const device=useDeviceClass();
  const processing=model.activeStress==="processing";
  const invalid=model.activeStress==="error";
  const empty=model.activeStress==="empty";
  const selectedLast=model.activeStress==="selectedLast";
  const initialControls=useMemo(()=>Object.fromEntries(model.controls.map((control)=>[control.id,selectedLast&&control.options?.length?control.options.at(-1)!.value:control.value])),[model,selectedLast]);
  const [controls,setControls]=useState<Record<string,string|number|boolean>>(initialControls);
  const [invokedActions,setInvokedActions]=useState<Set<string>>(()=>new Set());
  const [announcement,setAnnouncement]=useState("");
  useEffect(()=>setControls(initialControls),[initialControls]);
  const setControl=(id:string,value:string|number|boolean)=>{setControls((current)=>({...current,[id]:value}));const surfaceId=model.controls.find((control)=>control.id===id)?.resultSurfaceId;const surface=model.systemSurfaces.find((item)=>item.id===surfaceId);setAnnouncement(surface?.body??surface?.title??"");};
  const onInvoke=(action:BentoAction)=>{if(action.kind==="toggle")setInvokedActions((current)=>{const next=new Set(current);if(next.has(action.id))next.delete(action.id);else next.add(action.id);return next;});if(action.successAnnouncementId)setAnnouncement(model.announcements[action.successAnnouncementId]??"");else if(action.processingLabel)setAnnouncement(action.processingLabel);};
  const explicitIdentityIds=new Set(model.tiles.flatMap((tile)=>tile.payload.kind==="proof"?tile.payload.identityIds??[]:[]));
  const unownedIdentities=model.identities.filter(({id})=>!explicitIdentityIds.has(id));
  const tiles=model.tiles.map((tile)=><BentoTileView tile={tile} model={model} controls={controls} setControl={setControl} processing={processing} invalid={invalid} empty={empty} selectedLast={selectedLast} invokedActions={invokedActions} onInvoke={onInvoke} unownedIdentities={unownedIdentities} key={tile.id}/>);
  return <section className={["xp-bento",className].filter(Boolean).join(" ")} data-xp-bento data-xp-owner="Bento" data-bento-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={device} data-stress={model.activeStress}>
    <Intro model={model} controls={controls} setControl={setControl} invalid={invalid} processing={processing} invokedActions={invokedActions} onInvoke={onInvoke}/>
    {device==="M"?<SnapRail className="xp-bento__rail" label={model.copy.railLabel} paginationLabel={model.copy.railLabel} markerLabel={(index)=>`${model.copy.railLabel} ${index}`} cap="min(82cqi, 25rem)">{tiles.map((tile,index)=><SnapRail.Item data-bento-rail-index={index+1} key={model.tiles[index].id}>{tile}</SnapRail.Item>)}</SnapRail>:<div className="xp-bento__grid">{tiles}</div>}
    <p className="xp-bento__live" aria-live="polite">{processing?model.actions.find(({processingLabel})=>processingLabel)?.processingLabel:announcement}</p>
  </section>;
}

function StandardBento({fixture,media,stress,className}:Extract<BentoProperties,{fixture:BentoFixture}>) {
  const model=useMemo(()=>resolveBentoFixture(fixture,stress,media),[fixture,media,stress]);
  return <BentoResolved model={model} className={className}/>;
}

export function Bento(properties:BentoProperties) {
  if("featureModel" in properties)return <FeatureBentoRenderer model={properties.featureModel} className={properties.className}/>;
  return <StandardBento {...properties}/>;
}
