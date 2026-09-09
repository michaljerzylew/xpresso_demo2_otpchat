"use client";

import React, { useState } from "react";
import { useDeviceClass } from "@xp/primitives";
import type { ResolvedFeatureFixture } from "./feature-model";
import {
  distributeSurfaces, FeatureActions, FeatureError, FeatureIntroView, FeatureMediaView,
  FeatureSurfaceView,
} from "./feature-shared";

export function FeatureBentoRenderer({model,className}:{model:ResolvedFeatureFixture;className?:string}) {
  if(model.owner!=="Bento")throw new Error(`${model.sourceKey} cannot render through canonical Bento.`);
  const device=useDeviceClass();
  const [paused,setPaused]=useState(false);
  const ownedMediaIds=new Set(model.tiles.flatMap((tile)=>tile.mediaSeatIds??[]));
  const supportingMedia=model.media.filter(({id})=>!ownedMediaIds.has(id));
  return <section className={["xp-feature","xp-feature--bento",className].filter(Boolean).join(" ")} data-xp-bento data-xp-owner="Bento" data-feature-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={device} data-paused={paused||undefined} data-stress={model.activeStress}>
    <FeatureIntroView model={model}/>
    <FeatureError model={model}/>
    {model.controls.some(({kind})=>kind==="pause")?<div className="xp-feature__pause-group">{model.controls.filter(({kind})=>kind==="pause").map((control)=><button className="xp-feature__pause" type="button" data-feature-control-id={control.id} data-control-owner={control.ownerId} data-xp-control aria-pressed={paused} onClick={()=>setPaused((current)=>!current)} key={control.id}>{control.label||model.copy.pauseLabel}</button>)}</div>:null}
    <div className="xp-feature__mosaic" data-feature-tile-count={model.tiles.length}>{model.tiles.map((tile,index)=>{
      const surfaces=distributeSurfaces(model,tile.id,index,model.tiles.length);
      const media=tile.mediaSeatIds?.map((id)=>model.media.find((seat)=>seat.id===id)).filter(Boolean)??[];
      const metrics=tile.metricIds?.map((id)=>model.metrics.find((metric)=>metric.id===id)).filter(Boolean)??[];
      return <article className="xp-feature__tile" data-feature-tile-id={tile.id} data-tile-rank={index+1} key={tile.id}>
        <div className="xp-feature__tile-copy"><small>{String(index+1).padStart(2,"0")}</small><h2>{tile.title}</h2>{tile.body.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</div>
        {media.length?<div className="xp-feature__media-field" data-media-count={media.length}>{media.map((seat)=><FeatureMediaView seat={seat!} model={model} key={seat!.id}/>)}</div>:null}
        {surfaces.map((surface)=><FeatureSurfaceView surface={surface} ownerLabel={tile.title} key={surface.id}/>)}
        {metrics.length?<dl className="xp-feature__metrics">{metrics.map((metric)=><div data-feature-metric-id={metric!.id} key={metric!.id}><dt>{metric!.label}</dt><dd>{metric!.value}{metric!.unit}</dd></div>)}</dl>:null}
        <FeatureActions ownerId={tile.id} model={model}/>
      </article>;
    })}</div>
    {supportingMedia.length?<div className="xp-feature__supporting-media" data-supporting-media-count={supportingMedia.length}>{supportingMedia.map((seat)=><FeatureMediaView seat={seat} model={model} key={seat.id}/>)}</div>:null}
  </section>;
}
