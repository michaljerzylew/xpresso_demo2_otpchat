"use client";

import {
  AdaptiveOverlay,
  DataCollection,
  Field,
  MorphSlot,
  SnapRail,
  type DataColumn,
  type DeviceClass,
} from "@xp/primitives";
import { useMemo, useState } from "react";
import type { CompareFilter, ResultRecord, ResultSetCompareFixture, ResolvedCompareFixture } from "./compare-model";
import {
  CompareActionControl,
  CompareCandidateIdentity,
  CompareHeader,
  CompareValueView,
  compareAction,
  formatAnnouncement,
  type CompareActionHandler,
} from "./compare-shared";

type OffersModel = ResolvedCompareFixture & { content: ResultSetCompareFixture };
type FilterSelection = Record<string, string>;
type OffersCore = {
  model: OffersModel;
  applied: FilterSelection;
  setApplied: (selection: FilterSelection) => void;
  draft: FilterSelection;
  setDraft: (selection: FilterSelection) => void;
  setNotice: (notice: string) => void;
  onAction?: CompareActionHandler;
};

const offersLadder: Record<DeviceClass, "peer-cards" | "offer-table"> = {
  M: "peer-cards",
  TP: "peer-cards",
  TL: "offer-table",
  DS: "offer-table",
  DW: "offer-table",
};

function label(model: OffersModel, key: keyof NonNullable<OffersModel["copy"]["fieldLabels"]>) {
  return model.copy.fieldLabels?.[key] ?? model.copy.comparisonLabel;
}

function selectedFrom(filters: CompareFilter[]) {
  return Object.fromEntries(filters.map((filter) => [filter.id, filter.selectedId]));
}

function FilterFields({ model, value, onChange }: {
  model: OffersModel;
  value: FilterSelection;
  onChange: (selection: FilterSelection) => void;
}) {
  return (
    <div className="xp-compare-offers__filter-fields">
      {model.content.filters.map((filter) => (
        <Field id={`xp-compare-${model.sourceKey}-${filter.id}`} key={filter.id}>
          <Field.Label>{filter.label}</Field.Label>
          <Field.Select
            autoComplete="off"
            value={value[filter.id]}
            required={filter.required}
            onChange={(event) => onChange({ ...value, [filter.id]: event.currentTarget.value })}
          >
            {filter.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
          </Field.Select>
        </Field>
      ))}
    </div>
  );
}

function AppliedFilters({ model, applied, onRemove }: { model: OffersModel; applied: FilterSelection; onRemove: (filter: CompareFilter) => void }) {
  return (
    <ul className="xp-compare-offers__applied" aria-label={label(model, "filters")}>
      {model.content.filters.map((filter) => {
        const selected = filter.options.find(({ id }) => id === applied[filter.id]);
        return (
          <li key={filter.id}>
            <span>{filter.label}</span>
            <strong>{selected?.label}</strong>
            <button type="button" data-xp-control onClick={() => onRemove(filter)} aria-label={`${filter.label}: ${selected?.label}`}>×</button>
          </li>
        );
      })}
    </ul>
  );
}

function ResultCount({ model }: { model: OffersModel }) {
  return (
    <output className="xp-compare-offers__result-count" data-result-count aria-label={model.copy.comparisonLabel}>
      <strong>{model.content.records.length}</strong>
      <span>{model.copy.comparisonLabel}</span>
    </output>
  );
}

function CompareFilterBar({ core, compact }: { core: OffersCore; compact: boolean }) {
  const { model, applied, setApplied, draft, setDraft, onAction } = core;
  const [open, setOpen] = useState(false);
  const apply = () => {
    setApplied(draft);
    core.setNotice(formatAnnouncement(model, "filterApplied"));
    const action = compareAction(model, model.content.applyActionId);
    onAction?.({ action, ownerId: action.ownerId });
    setOpen(false);
  };
  const resetFilter = (filter: CompareFilter) => {
    setApplied({ ...applied, [filter.id]: filter.options[0].id });
    core.setNotice(formatAnnouncement(model, "filterReset"));
  };
  const fields = <FilterFields model={model} value={draft} onChange={setDraft} />;
  const applyAction = compareAction(model, model.content.applyActionId);

  return (
    <section className="xp-compare-offers__filters" data-compare-filter-owner data-owner-id={applyAction.ownerId}>
      {compact ? (
        <AdaptiveOverlay intent="edit" open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(applied); }}>
          <AdaptiveOverlay.Trigger>{label(model, "filters")}</AdaptiveOverlay.Trigger>
          <AdaptiveOverlay.Content className="xp-compare-offers__filter-overlay">
            <AdaptiveOverlay.Header title={label(model, "filters")} description={model.copy.description} closeLabel={model.copy.fieldLabels?.close} />
            <AdaptiveOverlay.Body>{fields}</AdaptiveOverlay.Body>
            <AdaptiveOverlay.Footer>
              <CompareActionControl action={applyAction} onAction={() => apply()} />
            </AdaptiveOverlay.Footer>
          </AdaptiveOverlay.Content>
        </AdaptiveOverlay>
      ) : (
        <div className="xp-compare-offers__filter-row">
          {fields}
          <CompareActionControl action={applyAction} onAction={() => {
            setApplied(draft);
            core.setNotice(formatAnnouncement(model, "filterApplied"));
            onAction?.({ action: applyAction, ownerId: applyAction.ownerId });
          }} />
        </div>
      )}
      {compact ? <ResultCount model={model} /> : null}
      <AppliedFilters model={model} applied={applied} onRemove={resetFilter} />
    </section>
  );
}

function OfferContents({ model, record, onAction }: { model: OffersModel; record: ResultRecord; onAction?: CompareActionHandler }) {
  const candidate = model.content.candidates.find(({ id }) => id === record.candidateId);
  if (!candidate) return null;
  return (
    <>
      <CompareCandidateIdentity model={model} candidate={candidate} />
      <ul className="xp-compare-offers__benefits" aria-label={label(model, "benefits")}>
        {record.benefits.map((benefit, index) => <li data-offer-benefit key={index}>{benefit}</li>)}
      </ul>
      <div className="xp-compare-offers__fee"><span>{label(model, "fee")}</span><CompareValueView value={record.fee} /></div>
      <div className="xp-compare-offers__reward"><strong>{record.reward.title}</strong><span>{record.reward.description}</span></div>
      <CompareActionControl className="xp-compare-offers__record-action" action={compareAction(model, record.actionId)} offerAction onAction={onAction} />
    </>
  );
}

function CompactOffers({ core }: { core: OffersCore }) {
  const { model, onAction } = core;
  return (
    <div className="xp-compare-offers__compact" data-compare-form="peer-cards">
      <CompareFilterBar core={core} compact />
      {model.activeStress === "empty" ? <EmptyOffers core={core} /> : (
        <SnapRail label={model.copy.comparisonLabel} paginationLabel={model.copy.comparisonLabel} markerLabel={(index) => `${index} / ${model.content.records.length}`} peek="12%" physics="native">
          {model.content.records.map((record) => (
            <SnapRail.Item className="xp-compare-offers__card" data-offer-id={record.id} key={record.id}>
              <OfferContents model={model} record={record} onAction={onAction} />
            </SnapRail.Item>
          ))}
        </SnapRail>
      )}
    </div>
  );
}

function EmptyOffers({ core }: { core: OffersCore }) {
  const { model, setApplied, onAction } = core;
  const action = compareAction(model, model.content.empty.resetActionId);
  return (
    <section className="xp-compare-offers__empty" data-empty-state data-owner-id={action.ownerId}>
      <h2>{model.content.empty.title}</h2>
      <p>{model.content.empty.description}</p>
      <CompareActionControl action={action} onAction={(event) => {
        setApplied(selectedFrom(model.content.filters));
        core.setDraft(selectedFrom(model.content.filters));
        core.setNotice(formatAnnouncement(model, "filterReset"));
        onAction?.(event);
      }} />
    </section>
  );
}

function OfferTable({ core }: { core: OffersCore }) {
  const { model, onAction } = core;
  const columns = useMemo<DataColumn<ResultRecord>[]>(() => [
    {
      id: "candidate",
      header: label(model, "candidate"),
      meta: { priority: 1, role: "title", summary: true },
      cell: ({ row }) => {
        const candidate = model.content.candidates.find(({ id }) => id === row.original.candidateId)!;
        return <div className="xp-compare-offers__identity" data-offer-id={row.original.id}><span className="xp-compare-offers__cell-label">{label(model, "candidate")}</span><CompareCandidateIdentity model={model} candidate={candidate} /></div>;
      },
    },
    {
      id: "benefits",
      header: label(model, "benefits"),
      meta: { priority: 2, role: "detail", summary: true },
      cell: ({ row }) => <div className="xp-compare-offers__benefits-cell"><span className="xp-compare-offers__cell-label">{label(model, "benefits")}</span><ul className="xp-compare-offers__benefits">{row.original.benefits.map((benefit, index) => <li data-offer-benefit key={index}>{benefit}</li>)}</ul></div>,
    },
    {
      id: "offer",
      header: `${label(model, "fee")} · ${label(model, "reward")} · ${label(model, "action")}`,
      meta: { priority: 3, role: "value", summary: true },
      cell: ({ row }) => (
        <div className="xp-compare-offers__offer-cell">
          <div className="xp-compare-offers__fee"><span>{label(model, "fee")}</span><CompareValueView value={row.original.fee} /></div>
          <span className="xp-compare-offers__reward"><span>{label(model, "reward")}</span><strong>{row.original.reward.title}</strong><span>{row.original.reward.description}</span></span>
          <CompareActionControl className="xp-compare-offers__record-action" action={compareAction(model, row.original.actionId)} offerAction onAction={onAction} />
        </div>
      ),
    },
  ], [model, onAction]);

  if (model.activeStress === "empty") return <div className="xp-compare-offers__wide" data-compare-form="offer-table"><CompareFilterBar core={core} compact={false} /><EmptyOffers core={core} /></div>;
  return (
    <div className="xp-compare-offers__wide" data-compare-form="offer-table">
      <CompareFilterBar core={core} compact={false} />
      <div className="xp-compare-offers__table" data-offer-table>
        <DataCollection
          data={model.content.records}
          columns={columns}
          label={model.copy.comparisonLabel}
          empty={<EmptyOffers core={core} />}
          detailsLabel={model.copy.comparisonLabel}
          showDetailsLabel={model.copy.comparisonLabel}
          closeDetailsLabel={model.copy.fieldLabels?.close ?? model.copy.comparisonLabel}
          rowLabel={(record) => model.content.candidates.find(({ id }) => id === record.candidateId)?.name ?? record.id}
          getRowId={(record) => record.id}
          deviceClass="DW"
        />
      </div>
    </div>
  );
}

const renderers = {
  "peer-cards": ({ core }: { core: OffersCore }) => <CompactOffers core={core} />,
  "offer-table": ({ core }: { core: OffersCore }) => <OfferTable core={core} />,
};

export function CompareOffers({ model, onAction }: { model: OffersModel; onAction?: CompareActionHandler }) {
  const [applied, setApplied] = useState<FilterSelection>(() => selectedFrom(model.content.filters));
  const [draft, setDraft] = useState<FilterSelection>(() => selectedFrom(model.content.filters));
  const [notice, setNotice] = useState(() => model.activeStress === "empty" ? formatAnnouncement(model, "resultsEmpty") : "");
  return (
    <section className="xp-compare-offers" data-compare-state-owner data-compare-owner="offers" data-preset={model.preset}>
      <CompareHeader model={model} />
      <MorphSlot className="xp-compare-offers__morph" ladder={offersLadder} core={{ model, applied, setApplied, draft, setDraft, setNotice, onAction }} renderers={renderers} />
      <p className="xp-compare__live" aria-live="polite">{notice}</p>
    </section>
  );
}
