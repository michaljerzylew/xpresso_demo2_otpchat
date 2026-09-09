"use client";

import { ChipBar, MorphSlot, type DeviceClass } from "@xp/primitives";
import { useState } from "react";
import type { CompareCandidate, MatrixCompareFixture, ResolvedCompareFixture } from "./compare-model";
import {
  CompareActionControl,
  CompareCandidateIdentity,
  CompareHeader,
  CompareValueView,
  compareAction,
  formatAnnouncement,
  type CompareActionHandler,
} from "./compare-shared";

type MatrixModel = ResolvedCompareFixture & { content: MatrixCompareFixture };
type MatrixCore = {
  model: MatrixModel;
  activeIds: string[];
  setActiveIds: (ids: string[]) => void;
  onAction?: CompareActionHandler;
};

const matrixLadder: Record<DeviceClass, "duel-rows" | "snap-columns" | "table"> = {
  M: "duel-rows",
  TP: "duel-rows",
  TL: "snap-columns",
  DS: "table",
  DW: "table",
};

function candidateAction(model: MatrixModel, candidate: CompareCandidate) {
  const id = model.content.candidateActionIds?.[candidate.id];
  return id ? compareAction(model, id) : undefined;
}

function ProductPicker({ model, activeIds, onChange }: { model: MatrixModel; activeIds: string[]; onChange: (ids: string[]) => void }) {
  const choose = (id: string) => {
    if (activeIds.includes(id)) return;
    onChange([activeIds[0] ?? model.content.candidates[0].id, id]);
  };
  return (
    <div className="xp-compare-picker" data-product-picker data-active-count={activeIds.length}>
      <ChipBar
        items={model.content.candidates.map((candidate) => ({ id: candidate.id, label: candidate.shortName, active: activeIds.includes(candidate.id) }))}
        label={model.content.picker.label}
        removeLabel={(item) => item.label}
        onChange={choose}
      />
    </div>
  );
}

function MatrixIntro({ model, onAction }: { model: MatrixModel; onAction?: CompareActionHandler }) {
  const action = model.content.sectionActionId ? compareAction(model, model.content.sectionActionId) : undefined;
  return <CompareHeader model={model} after={action ? <CompareActionControl action={action} onAction={onAction} /> : undefined} />;
}

function MatrixPromo({ model, onAction }: { model: MatrixModel; onAction?: CompareActionHandler }) {
  const promo = model.content.promo;
  if (!promo) return null;
  const action = compareAction(model, promo.actionId);
  return (
    <aside className="xp-compare-matrix__promo" data-promo-id={promo.id}>
      <p>{promo.eyebrow}</p>
      <strong>{promo.title}</strong>
      <span>{promo.description}</span>
      <CompareActionControl action={action} ownerId={promo.id} onAction={onAction} />
    </aside>
  );
}

function DuelRows({ core }: { core: MatrixCore }) {
  const { model, activeIds, onAction } = core;
  const candidates = activeIds.map((id) => model.content.candidates.find((candidate) => candidate.id === id)).filter((candidate): candidate is CompareCandidate => Boolean(candidate));
  return (
    <div className="xp-compare-matrix__duel" data-compare-form="duel-rows" data-compare-scroll-owner="matrix-compact">
      <MatrixPromo model={model} onAction={onAction} />
      <ProductPicker model={model} activeIds={activeIds} onChange={core.setActiveIds} />
      <div className="xp-compare-matrix__duel-head">
        {candidates.map((candidate) => <CompareCandidateIdentity model={model} candidate={candidate} action={candidateAction(model, candidate)} onAction={onAction} key={candidate.id} />)}
      </div>
      <dl className="xp-compare-matrix__attributes" aria-label={model.copy.comparisonLabel}>
        {model.content.attributes.map((attribute) => (
          <div className="xp-compare-matrix__attribute" data-attribute-id={attribute.id} key={attribute.id}>
            <dt>{attribute.label}</dt>
            <div className="xp-compare-matrix__duel-values">
              {candidates.map((candidate) => (
                <dd data-value-candidate-id={candidate.id} key={candidate.id}>
                  <span className="xp-visually-hidden">{candidate.name}</span>
                  <CompareValueView value={attribute.values[candidate.id]} />
                </dd>
              ))}
            </div>
            {attribute.advice ? <details className="xp-compare-matrix__advice"><summary>{attribute.label}</summary><p>{attribute.advice}</p></details> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}

function MatrixTable({ core, form }: { core: MatrixCore; form: "snap-columns" | "table" }) {
  const { model, onAction } = core;
  const [position, setPosition] = useState(0);
  const updatePosition = (node: HTMLDivElement) => {
    const headers = [...node.querySelectorAll<HTMLElement>("[data-candidate-id]")];
    const nearest = headers.reduce((best, header, index) => Math.abs(header.offsetLeft - node.scrollLeft) < Math.abs((headers[best]?.offsetLeft ?? 0) - node.scrollLeft) ? index : best, 0);
    setPosition(nearest);
  };
  return (
    <div
      className="xp-compare-matrix__wide"
      data-compare-form={form}
      data-compare-scroll-owner={form === "snap-columns" ? "matrix-tablet" : undefined}
    >
      {form === "snap-columns" ? <ProductPicker model={model} activeIds={core.activeIds} onChange={core.setActiveIds} /> : null}
      <div className="xp-compare-matrix__scroller" data-xp-scroll data-xp-compare-scroller tabIndex={0} aria-label={model.copy.comparisonLabel} onScroll={(event) => updatePosition(event.currentTarget)}>
        <table className="xp-compare-matrix__table">
          <caption>{model.copy.comparisonLabel}</caption>
          <thead>
            <tr>
              <th scope="col"><MatrixPromo model={model} onAction={onAction} /></th>
              {model.content.candidates.map((candidate) => (
                <th scope="col" data-highlighted={candidate.highlighted || undefined} key={candidate.id}>
                  <CompareCandidateIdentity model={model} candidate={candidate} action={candidateAction(model, candidate)} onAction={onAction} />
                </th>
              ))}
              {model.content.attributes.some(({ advice }) => advice) ? <th scope="col" className="xp-compare-matrix__advice-heading">{model.copy.comparisonLabel}</th> : null}
            </tr>
          </thead>
          <tbody>
            {model.content.attributes.map((attribute) => (
              <tr data-attribute-id={attribute.id} key={attribute.id}>
                <th scope="row">{attribute.label}</th>
                {model.content.candidates.map((candidate) => <td data-value-candidate-id={candidate.id} data-highlighted={candidate.highlighted || undefined} key={candidate.id}><CompareValueView value={attribute.values[candidate.id]} /></td>)}
                {model.content.attributes.some(({ advice }) => advice) ? <td className="xp-compare-matrix__advice-cell">{attribute.advice ?? ""}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <output className="xp-compare__rail-status" aria-live="polite">{position + 1} / {model.content.candidates.length}</output>
    </div>
  );
}

const renderers = {
  "duel-rows": ({ core }: { core: MatrixCore }) => <DuelRows core={core} />,
  "snap-columns": ({ core }: { core: MatrixCore }) => <MatrixTable core={core} form="snap-columns" />,
  table: ({ core }: { core: MatrixCore }) => <MatrixTable core={core} form="table" />,
};

export function CompareMatrix({ model, onAction }: { model: MatrixModel; onAction?: CompareActionHandler }) {
  const [activeIds, setActiveIds] = useState(() => model.content.picker.defaultActiveIds.slice(0, 2));
  const selectedName = model.content.candidates.find(({ id }) => id === activeIds.at(-1))?.name ?? "";
  return (
    <section className="xp-compare-matrix" data-compare-state-owner data-compare-owner="matrix" data-preset={model.preset}>
      <MatrixIntro model={model} onAction={onAction} />
      <MorphSlot className="xp-compare-matrix__morph" ladder={matrixLadder} core={{ model, activeIds, setActiveIds, onAction }} renderers={renderers} />
      <p className="xp-compare__live" aria-live="polite">{formatAnnouncement(model, "candidateSelected", { name: selectedName })}</p>
    </section>
  );
}
