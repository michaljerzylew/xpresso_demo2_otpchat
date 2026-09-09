"use client";

import {
  AdaptiveOverlay,
  ChoiceSet,
  Field,
  MorphSlot,
  SegmentedControl,
  StickyActionBar,
  type DeviceClass,
} from "@xp/primitives";
import { useState } from "react";
import type {
  PairedChoiceCompareFixture,
  PairedChoiceOption,
  QueryField,
  ResolvedCompareFixture,
} from "./compare-model";
import {
  CompareActionControl,
  CompareHeader,
  CompareMedia,
  CompareValueView,
  compareAction,
  formatAnnouncement,
  mediaFor,
  type CompareActionHandler,
} from "./compare-shared";

type JourneyModel = ResolvedCompareFixture & { content: PairedChoiceCompareFixture };
type JourneyCore = {
  model: JourneyModel;
  tripModeId: string;
  setTripModeId: (id: string) => void;
  serviceCategoryId: string;
  setServiceCategoryId: (id: string) => void;
  fields: QueryField[];
  setFields: (fields: QueryField[]) => void;
  selections: Record<string, string>;
  setSelections: (selection: Record<string, string>) => void;
  setNotice: (notice: string) => void;
  onAction?: CompareActionHandler;
};

const journeyLadder: Record<DeviceClass, "bounded-editor" | "inline-groups"> = {
  M: "bounded-editor",
  TP: "bounded-editor",
  TL: "inline-groups",
  DS: "inline-groups",
  DW: "inline-groups",
};

function fieldUpdate(fields: QueryField[], id: string, update: Partial<QueryField>): QueryField[] {
  return fields.map((field) => field.id === id ? ({ ...field, ...update } as QueryField) : field);
}

function JourneyFields({ core }: { core: JourneyCore }) {
  const { model, fields, setFields } = core;
  return (
    <div className="xp-compare-journey__fields">
      {fields.map((field) => {
        if (field.kind === "location") {
          return (
            <Field id={`xp-compare-${model.sourceKey}-${field.id}`} invalid={Boolean(field.error)} hasError={Boolean(field.error)} key={field.id}>
              <Field.Label>{field.label}</Field.Label>
              <Field.Select autoComplete="off" required={field.required} value={field.selectedId} onChange={(event) => setFields(fieldUpdate(fields, field.id, { selectedId: event.currentTarget.value }))}>
                {field.selectedId === "" ? <option value="" hidden>{field.error}</option> : null}
                {model.content.locations.map((location) => <option value={location.id} key={location.id}>{location.label}</option>)}
              </Field.Select>
              {field.error ? <Field.Error>{field.error}</Field.Error> : null}
            </Field>
          );
        }
        if (field.kind === "date") {
          return (
            <Field id={`xp-compare-${model.sourceKey}-${field.id}`} invalid={Boolean(field.error)} hasError={Boolean(field.error)} key={field.id}>
              <Field.Label>{field.label}</Field.Label>
              <Field.Input type="date" inputMode="none" enterKeyHint="next" autoComplete="off" required={field.required} value={field.value} onChange={(event) => setFields(fieldUpdate(fields, field.id, { value: event.currentTarget.value }))} />
              {field.error ? <Field.Error>{field.error}</Field.Error> : null}
            </Field>
          );
        }
        const [countLabel, classLabel = field.label] = field.label.split(/\s+and\s+/i, 2);
        return (
          <div className="xp-compare-journey__travellers" key={field.id}>
            <Field id={`xp-compare-${model.sourceKey}-${field.id}-count`} invalid={Boolean(field.error)} hasError={Boolean(field.error)}>
              <Field.Label>{countLabel}</Field.Label>
              <Field.Input type="number" inputMode="numeric" enterKeyHint="done" autoComplete="off" required min={field.minimum} max={field.maximum} value={field.count} onChange={(event) => setFields(fieldUpdate(fields, field.id, { count: Number(event.currentTarget.value) }))} />
              {field.error ? <Field.Error>{field.error}</Field.Error> : null}
            </Field>
            <Field id={`xp-compare-${model.sourceKey}-${field.id}-class`}>
              <Field.Label>{classLabel}</Field.Label>
              <Field.Select autoComplete="off" required value={field.selectedClassId} onChange={(event) => setFields(fieldUpdate(fields, field.id, { selectedClassId: event.currentTarget.value }))}>
                {field.classOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
              </Field.Select>
            </Field>
          </div>
        );
      })}
    </div>
  );
}

function QueryControls({ core, compact, close }: { core: JourneyCore; compact: boolean; close?: () => void }) {
  const { model, onAction } = core;
  const swap = compareAction(model, model.content.swapActionId);
  const search = compareAction(model, model.content.searchActionId);
  const swapLocations = () => {
    const locations = core.fields.filter((field): field is Extract<QueryField, { kind: "location" }> => field.kind === "location");
    if (locations.length === 2) {
      core.setFields(core.fields.map((field) => field.id === locations[0].id ? { ...field, selectedId: locations[1].selectedId } : field.id === locations[1].id ? { ...field, selectedId: locations[0].selectedId } : field));
    }
    onAction?.({ action: swap, ownerId: swap.ownerId });
    core.setNotice(formatAnnouncement(model, "routeSwapped"));
  };
  const runSearch = () => {
    onAction?.({ action: search, ownerId: search.ownerId });
    core.setNotice(formatAnnouncement(model, "searchExecuted"));
    close?.();
  };
  return (
    <div className="xp-compare-journey__query-controls" data-query-editor data-owner-id={search.ownerId}>
      <SegmentedControl label={model.copy.fieldLabels!.tripMode!} items={model.content.tripModes.map(({ id, label }) => ({ value: id, label }))} value={core.tripModeId} onChange={core.setTripModeId} />
      <SegmentedControl label={model.copy.fieldLabels!.serviceCategory!} items={model.content.serviceCategories.map(({ id, label }) => ({ value: id, label }))} value={core.serviceCategoryId} onChange={core.setServiceCategoryId} />
      <JourneyFields core={core} />
      <div className="xp-compare-journey__query-actions">
        <CompareActionControl action={swap} onAction={() => swapLocations()} />
        {compact ? (
          <StickyActionBar placement="overlay" primary={<CompareActionControl action={search} onAction={() => runSearch()} />} />
        ) : <CompareActionControl action={search} onAction={() => runSearch()} />}
      </div>
    </div>
  );
}

function QuerySummary({ core }: { core: JourneyCore }) {
  const { model, fields } = core;
  return (
    <dl className="xp-compare-journey__summary" aria-label={model.copy.fieldLabels?.query ?? model.copy.comparisonLabel}>
      {fields.map((field) => {
        const value = field.kind === "location"
          ? model.content.locations.find(({ id }) => id === field.selectedId)?.label
          : field.kind === "date"
            ? field.value
            : `${field.count} · ${field.classOptions.find(({ id }) => id === field.selectedClassId)?.label ?? ""}`;
        return <div key={field.id}><dt>{field.label}</dt><dd>{value}</dd></div>;
      })}
    </dl>
  );
}

function RouteChoice({ model, option }: { model: JourneyModel; option: PairedChoiceOption }) {
  return {
    value: option.id,
    label: <span data-choice-id={option.id}>{option.departure.time} {option.departure.period} · {option.arrival.time} {option.arrival.period}</span>,
    description: <span>{option.departure.location} · {option.arrival.location}</span>,
    meta: <CompareValueView value={option.price} />,
    media: <CompareMedia asset={mediaFor(model, option.mediaSeatId)} />,
    details: [
      <span key="duration">{option.duration}</span>,
      <span key="stops">{option.stopCount === 0 ? formatAnnouncement(model, "nonstop") : formatAnnouncement(model, "stops", { count: option.stopCount })}</span>,
    ],
  };
}

function RouteGroups({ core }: { core: JourneyCore }) {
  const { model } = core;
  return (
    <div className="xp-compare-journey__groups">
      {model.content.groups.map((group) => (
        <section className="xp-compare-journey__group" data-route-group={group.role} key={group.id}>
          <header><h2>{group.label}</h2><p>{group.dateLabel}</p></header>
          <ChoiceSet
            label={group.label}
            items={group.options.map((option) => RouteChoice({ model, option }))}
            value={core.selections[group.id]}
            onChange={(id) => core.setSelections({ ...core.selections, [group.id]: id })}
          />
        </section>
      ))}
    </div>
  );
}

function BoundedJourney({ core }: { core: JourneyCore }) {
  const { model } = core;
  const [open, setOpen] = useState(false);
  return (
    <div className="xp-compare-journey__compact" data-compare-form="bounded-editor">
      <section className="xp-compare-journey__query-summary">
        <QuerySummary core={core} />
        <AdaptiveOverlay intent="edit" open={open} onOpenChange={setOpen}>
          <AdaptiveOverlay.Trigger>{model.copy.fieldLabels?.editQuery ?? model.copy.comparisonLabel}</AdaptiveOverlay.Trigger>
          <AdaptiveOverlay.Content className="xp-compare-journey__query-overlay">
            <AdaptiveOverlay.Header title={model.copy.fieldLabels?.query ?? model.copy.comparisonLabel} description={model.copy.description} closeLabel={model.copy.fieldLabels?.close} />
            <AdaptiveOverlay.Body><QueryControls core={core} compact close={() => setOpen(false)} /></AdaptiveOverlay.Body>
          </AdaptiveOverlay.Content>
        </AdaptiveOverlay>
      </section>
      <RouteGroups core={core} />
    </div>
  );
}

function InlineJourney({ core }: { core: JourneyCore }) {
  return <div className="xp-compare-journey__wide" data-compare-form="inline-groups"><QueryControls core={core} compact={false} /><RouteGroups core={core} /></div>;
}

const renderers = {
  "bounded-editor": ({ core }: { core: JourneyCore }) => <BoundedJourney core={core} />,
  "inline-groups": ({ core }: { core: JourneyCore }) => <InlineJourney core={core} />,
};

export function CompareJourney({ model, onAction }: { model: JourneyModel; onAction?: CompareActionHandler }) {
  const [tripModeId, setTripModeId] = useState(model.content.selectedTripModeId);
  const [serviceCategoryId, setServiceCategoryId] = useState(model.content.selectedServiceCategoryId);
  const [fields, setFields] = useState<QueryField[]>(model.content.queryFields);
  const [selections, setSelections] = useState<Record<string, string>>(() => Object.fromEntries(model.content.groups.map(({ id, selectedId }) => [id, selectedId])));
  const [notice, setNotice] = useState("");
  const core = { model, tripModeId, setTripModeId, serviceCategoryId, setServiceCategoryId, fields, setFields, selections, setSelections, setNotice, onAction };
  return (
    <section className="xp-compare-journey" data-compare-state-owner data-compare-owner="journey" data-preset={model.preset}>
      <CompareHeader model={model} />
      <MorphSlot className="xp-compare-journey__morph" ladder={journeyLadder} core={core} renderers={renderers} />
      <p className="xp-compare__live" aria-live="polite">{notice}</p>
    </section>
  );
}
