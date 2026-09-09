"use client";

import { useDeviceClass } from "@xp/primitives";
import { useMemo } from "react";
import { CompareJourney } from "./compare-journey";
import { CompareMatrix } from "./compare-matrix";
import type {
  CompareFixture,
  CompareMediaAsset,
  MatrixCompareFixture,
  PairedChoiceCompareFixture,
  ResolvedCompareFixture,
  ResultSetCompareFixture,
} from "./compare-model";
import { resolveCompareFixture } from "./compare-model";
import { CompareOffers } from "./compare-offers";
import type { CompareActionHandler } from "./compare-shared";

export type CompareSurfaceProperties = {
  fixture: CompareFixture;
  stress?: string;
  media?: CompareMediaAsset[];
  onAction?: CompareActionHandler;
  className?: string;
};

export function CompareSurface({ fixture, stress, media = [], onAction, className }: CompareSurfaceProperties) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => resolveCompareFixture(fixture, stress, media), [fixture, media, stress]);
  const rootClassName = ["xp-compare", `xp-compare--${model.content.kind}`, className].filter(Boolean).join(" ");
  let surface;
  if (model.content.kind === "matrix") surface = <CompareMatrix model={model as ResolvedCompareFixture & { content: MatrixCompareFixture }} onAction={onAction} />;
  else if (model.content.kind === "offers") surface = <CompareOffers model={model as ResolvedCompareFixture & { content: ResultSetCompareFixture }} onAction={onAction} />;
  else surface = <CompareJourney model={model as ResolvedCompareFixture & { content: PairedChoiceCompareFixture }} onAction={onAction} />;

  return (
    <div
      className={rootClassName}
      data-xp-compare-surface
      data-source-key={model.sourceKey}
      data-compare-kind={model.content.kind}
      data-preset={model.preset}
      data-device-class={deviceClass}
      data-active-stress={model.activeStress}
    >
      {surface}
    </div>
  );
}
