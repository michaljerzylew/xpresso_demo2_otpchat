"use client";

import {
  AdaptiveOverlay,
  ChipBar,
  DisclosureGroup,
  SegmentedControl,
  SnapRail,
  StickyActionBar,
  useDeviceClass,
} from "@xp/primitives";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  resolveCategoryFilterFixture,
  type CategoryFilterFixture,
  type FilterBarField,
  type FilterControl,
  type FilterOption,
  type FilterRange,
  type FilterState,
  type FilterValue,
} from "./category-filter-model";

type ValueChange = (controlId: string, value: FilterValue) => void;
type FilterHost = "rail" | "overlay";
type ChecksFilterControl = Extract<FilterControl, { kind: "checks" }>;
type SelectFilterControl = Exclude<Extract<FilterControl, { options: FilterOption[]; selectedIds: string[] }>, ChecksFilterControl>;

function cloneValues(values: FilterState["values"]): FilterState["values"] {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key,
    Array.isArray(value) ? [...value] : typeof value === "object" ? { ...value } : value,
  ]));
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function valuesEqual(left: FilterState["values"], right: FilterState["values"]) {
  return canonical(left) === canonical(right);
}

function allControls(fixture: CategoryFilterFixture) {
  return [
    ...(fixture.panel?.groups.flatMap((group) => group.controls) ?? []),
    ...(fixture.bar?.controls ?? []),
  ];
}

function valueIsActive(control: FilterControl, value: FilterValue | undefined) {
  if (control.kind === "range") {
    return Boolean(value && !Array.isArray(value) && typeof value === "object" && (
      value.min !== control.bounds.min || value.max !== control.bounds.max
    ));
  }
  if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
  return typeof value === "string" && value.trim().length > 0;
}

function activeCount(fixture: CategoryFilterFixture, values: FilterState["values"]) {
  return allControls(fixture).filter((control) => valueIsActive(control, values[control.id])).length;
}

function resolveResultCount(fixture: CategoryFilterFixture, values: FilterState["values"], fallback: number) {
  return fixture.resultCountCases.find((item) => valuesEqual(item.values, values))?.resultCount ?? fallback;
}

function stateFor(fixture: CategoryFilterFixture, values: FilterState["values"], fallback: number): FilterState {
  return {
    values,
    activeCount: activeCount(fixture, values),
    resultCount: resolveResultCount(fixture, values, fallback),
  };
}

function emptyValue(control: FilterControl): FilterValue {
  if (control.kind === "range") return { min: control.bounds.min, max: control.bounds.max };
  if (control.kind === "text-fields") return control.fields.map(() => "");
  if (control.kind === "segmented") return "";
  return [];
}

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)), template);
}

function optionsFor(control: FilterControl): FilterOption[] {
  return "options" in control ? control.options : [];
}

function summaryFor(control: FilterControl, value: FilterValue | undefined, emptyLabel = "") {
  if (control.kind === "range") {
    if (!value || Array.isArray(value) || typeof value !== "object") return emptyLabel;
    return `${value.min}–${value.max}`;
  }
  if (control.kind === "text-fields") {
    return Array.isArray(value) ? value.filter(Boolean).join(", ") || emptyLabel : emptyLabel;
  }
  const ids = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  const labels = ids.map((id) => optionsFor(control).find((option) => option.id === id)?.label).filter(Boolean);
  return labels.join(", ") || emptyLabel;
}

function controlInvalid(fixture: CategoryFilterFixture, control: FilterControl, value: FilterValue | undefined) {
  if (fixture.states?.errorControlId === control.id) return true;
  if (control.kind !== "range" || !value || Array.isArray(value) || typeof value !== "object") return false;
  return value.min > value.max || value.min < control.bounds.min || value.max > control.bounds.max;
}

function ChecksControl({
  control,
  value,
  disabled,
  onChange,
  fixture,
}: {
  control: ChecksFilterControl;
  value: string[];
  disabled?: boolean;
  onChange: ValueChange;
  fixture: CategoryFilterFixture;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = control.initialVisibleCount && !expanded ? control.options.slice(0, control.initialVisibleCount) : control.options;
  const toggle = (option: FilterOption) => {
    if (disabled || option.disabled) return;
    let next: string[];
    if (control.anyOptionId && option.id === control.anyOptionId) next = [option.id];
    else {
      const withoutAny = value.filter((id) => id !== control.anyOptionId);
      next = withoutAny.includes(option.id) ? withoutAny.filter((id) => id !== option.id) : [...withoutAny, option.id];
    }
    onChange(control.id, next);
  };
  return (
    <fieldset className="xp-category-filter__checks" data-presentation={control.presentation} data-control-id={control.id}>
      <legend>{control.label}</legend>
      <div className="xp-category-filter__options">
        {visible.map((option, index) => (
          <label data-tone={option.tone} data-option-id={option.id} data-option-index={index} key={option.id}>
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              disabled={disabled || option.disabled}
              aria-describedby={option.disabledReason ? `${fixture.sourceKey}-${control.id}-${option.id}-reason` : undefined}
              onChange={() => toggle(option)}
            />
            {control.presentation === "swatches" ? <span className="xp-category-filter__swatch" aria-hidden="true" /> : null}
            <span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span>
            {option.countLabel ? <small>{option.countLabel}</small> : null}
            {option.disabledReason ? <small id={`${fixture.sourceKey}-${control.id}-${option.id}-reason`}>{option.disabledReason}</small> : null}
          </label>
        ))}
      </div>
      {control.initialVisibleCount && control.options.length > control.initialVisibleCount ? (
        <button
          className="xp-category-filter__reveal"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          data-xp-control
        >
          {format(expanded ? fixture.copy.collapseGroupLabel : fixture.copy.expandGroupLabel, { label: control.label })}
        </button>
      ) : null}
    </fieldset>
  );
}

function SearchSelectControl({
  control,
  value,
  disabled,
  onChange,
}: {
  control: SelectFilterControl;
  value: string[];
  disabled?: boolean;
  onChange: ValueChange;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const matches = control.options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const select = (option: FilterOption) => {
    if (!disabled && !option.disabled) onChange(control.id, [option.id]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = matches.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowDown" ? Math.min(last, active + 1) : event.key === "ArrowUp" ? Math.max(0, active - 1) : -1;
    if (next >= 0) {
      event.preventDefault();
      setActive(next);
    } else if (event.key === "Enter" && matches[active]) {
      event.preventDefault();
      select(matches[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setActive(0);
    }
  };
  return (
    <div className="xp-category-filter__select xp-category-filter__select--search" data-control-id={control.id}>
      <label htmlFor={`${listId}-query`}>{control.label}</label>
      <input
        id={`${listId}-query`}
        type="search"
        role="combobox"
        value={query}
        disabled={disabled}
        placeholder={control.placeholder}
        aria-controls={listId}
        aria-expanded="true"
        aria-autocomplete="list"
        aria-activedescendant={matches[active] ? `${listId}-${matches[active].id}` : undefined}
        onChange={(event) => { setQuery(event.target.value); setActive(0); }}
        onKeyDown={onKeyDown}
      />
      <div id={listId} role="listbox" aria-label={control.label}>
        {matches.map((option, index) => (
          <button
            id={`${listId}-${option.id}`}
            type="button"
            role="option"
            aria-selected={value.includes(option.id)}
            disabled={disabled || option.disabled}
            tabIndex={-1}
            data-active={index === active || undefined}
            data-option-id={option.id}
            onClick={() => select(option)}
            key={option.id}
          >
            <span>{option.label}</span>{value.includes(option.id) ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
        {!matches.length ? <p>{control.emptyLabel}</p> : null}
      </div>
    </div>
  );
}

function SelectControl({
  control,
  value,
  disabled,
  onChange,
}: {
  control: SelectFilterControl;
  value: string[];
  disabled?: boolean;
  onChange: ValueChange;
}) {
  if (control.kind === "single-select") {
    return (
      <label className="xp-category-filter__select" data-control-id={control.id}>
        <span>{control.label}</span>
        <select value={value[0] ?? ""} disabled={disabled} onChange={(event) => onChange(control.id, event.target.value ? [event.target.value] : [])}>
          <option value="">{control.placeholder}</option>
          {control.options.map((option) => <option value={option.id} disabled={option.disabled} key={option.id}>{option.label}</option>)}
        </select>
      </label>
    );
  }
  return (
    <fieldset className="xp-category-filter__checks" data-presentation="rows" data-control-id={control.id}>
      <legend>{control.label}</legend>
      <div className="xp-category-filter__options">
        {control.options.map((option) => (
          <label data-option-id={option.id} key={option.id}>
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              disabled={disabled || option.disabled}
              onChange={() => onChange(control.id, value.includes(option.id) ? value.filter((id) => id !== option.id) : [...value, option.id])}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FacetRange({
  control,
  value,
  disabled,
  invalid,
  error,
  onChange,
}: {
  control: FilterRange;
  value: { min: number; max: number };
  disabled?: boolean;
  invalid: boolean;
  error?: string;
  onChange: ValueChange;
}) {
  const errorId = `${control.id}-error`;
  const update = (key: "min" | "max", next: number) => onChange(control.id, { ...value, [key]: next });
  const range = (key: "min" | "max", label: string) => (
    <input
      type="range"
      min={control.bounds.min}
      max={control.bounds.max}
      step={control.bounds.step}
      value={value[key]}
      disabled={disabled}
      aria-label={label}
      aria-valuetext={String(value[key])}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      onChange={(event) => update(key, Number(event.target.value))}
    />
  );
  return (
    <fieldset className="xp-category-filter__range" data-control-id={control.id} data-invalid={invalid || undefined}>
      <legend>{control.label}</legend>
      {control.marks?.length ? <div className="xp-category-filter__marks" aria-hidden="true">{control.marks.map((mark) => <span key={mark.value}>{mark.iconKey === "star" ? "★" : mark.label}</span>)}</div> : null}
      <div className="xp-category-filter__range-track">{range("min", control.minLabel)}{range("max", control.maxLabel)}</div>
      {invalid && error ? <p id={errorId} role="alert">{error}</p> : null}
      <div className="xp-category-filter__range-fields">
        {(["min", "max"] as const).map((key) => (
          <label key={key}>
            <span>{key === "min" ? control.minLabel : control.maxLabel}</span>
            <input
              type="number"
              inputMode="decimal"
              enterKeyHint={key === "min" ? "next" : "done"}
              autoComplete="off"
              min={control.bounds.min}
              max={control.bounds.max}
              step={control.bounds.step}
              value={value[key]}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ControlRenderer({
  fixture,
  control,
  state,
  disabled,
  onChange,
}: {
  fixture: CategoryFilterFixture;
  control: FilterControl;
  state: FilterState;
  disabled?: boolean;
  onChange: ValueChange;
}) {
  const value = state.values[control.id];
  if (control.kind === "checks") return <ChecksControl control={control} value={Array.isArray(value) ? value : []} disabled={disabled} onChange={onChange} fixture={fixture} />;
  if (control.kind === "segmented") return <div className="xp-category-filter__segmented" data-control-id={control.id}><span>{control.label}</span><SegmentedControl label={control.label} value={typeof value === "string" ? value : ""} items={control.options.map((option) => ({ value: option.id, label: option.label, disabled: disabled || option.disabled }))} onChange={(next) => onChange(control.id, next)} /></div>;
  if (control.kind === "search-select") return <SearchSelectControl control={control} value={Array.isArray(value) ? value : []} disabled={disabled} onChange={onChange} />;
  if (control.kind === "single-select" || control.kind === "multi-select") return <SelectControl control={control} value={Array.isArray(value) ? value : []} disabled={disabled} onChange={onChange} />;
  if (control.kind === "text-fields") {
    const values = Array.isArray(value) ? value : [];
    return <fieldset className="xp-category-filter__text-fields" data-control-id={control.id}><legend>{control.label}</legend>{control.fields.map((field, index) => <label key={field.id}><span>{field.label}</span><input value={values[index] ?? ""} disabled={disabled} inputMode={field.inputMode} enterKeyHint={field.enterKeyHint} autoComplete={field.autoComplete} onChange={(event) => { const next = [...values]; next[index] = event.target.value; onChange(control.id, next); }} /></label>)}</fieldset>;
  }
  if (control.kind === "range") {
    const rangeValue = value && !Array.isArray(value) && typeof value === "object" ? value : control.value;
    const invalid = controlInvalid(fixture, control, rangeValue);
    return <FacetRange control={control} value={rangeValue} disabled={disabled} invalid={invalid} error={invalid ? fixture.states?.error ?? (rangeValue.min > rangeValue.max ? fixture.copy.validation.rangeOrder : fixture.copy.validation.rangeBounds) : undefined} onChange={onChange} />;
  }
  return null;
}

export type FilterPanelProperties = {
  fixture: CategoryFilterFixture;
  state: FilterState;
  host: FilterHost;
  onValueChange: ValueChange;
  onClear: () => void;
};

export function FilterPanel({ fixture, state, host, onValueChange, onClear }: FilterPanelProperties) {
  const panel = fixture.panel;
  const [query, setQuery] = useState("");
  if (!panel) return null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const groups = normalizedQuery ? panel.groups.filter((group) => group.label.toLocaleLowerCase().includes(normalizedQuery) || group.controls.some((control) => control.label.toLocaleLowerCase().includes(normalizedQuery) || optionsFor(control).some((option) => option.label.toLocaleLowerCase().includes(normalizedQuery)))) : panel.groups;
  const emptySearch = Boolean(panel.search && (fixture.states?.emptySearch || (normalizedQuery && groups.length === 0)));
  const defaults = groups.filter((group) => group.disclosure !== "default-closed").map((group) => group.id);
  const wallBehavior = panel.preset === "accordion-search" || panel.preset === "fashion" ? "interactive" : "expanded";
  const items = groups.map((group) => {
    const reasonId = `${fixture.sourceKey}-${group.id}-locked-reason`;
    return {
      id: `${fixture.sourceKey}-${group.id}`,
      title: <span className="xp-category-filter__group-title"><span>{group.label}</span>{group.locked ? <span aria-hidden="true">⌑</span> : null}</span>,
      content: <div className="xp-category-filter__group" data-group-id={group.id} data-locked={group.locked ? "true" : undefined}>{group.locked ? <p className="xp-category-filter__locked" id={reasonId}>{group.locked.reason}</p> : null}{group.controls.map((control) => <ControlRenderer fixture={fixture} control={control} state={state} disabled={Boolean(group.locked)} onChange={onValueChange} key={control.id} />)}{group.locked?.action ? <button className="xp-category-filter__access" type="button" aria-describedby={reasonId} data-emphasis={group.locked.action.emphasis} data-action-id={group.locked.action.id}>{group.locked.action.label}</button> : null}</div>,
    };
  });
  const chips = panel.preset === "advanced" ? allControls(fixture).filter((control) => valueIsActive(control, state.values[control.id])).map((control) => ({ id: control.id, label: `${control.label}: ${summaryFor(control, state.values[control.id])}`, active: true, removable: true })) : [];
  return (
    <section className="xp-filter-panel" data-xp-filter-panel data-preset={panel.preset} data-host={host} aria-labelledby={`${fixture.sourceKey}-panel-title`}>
      {host === "rail" ? <header className="xp-filter-panel__header"><div><h2 id={`${fixture.sourceKey}-panel-title`}>{fixture.copy.title}</h2>{fixture.copy.description ? <p>{fixture.copy.description}</p> : null}</div>{state.activeCount ? <button type="button" onClick={onClear} data-action="clear" data-xp-control>{fixture.copy.clearLabel}</button> : null}</header> : <h2 className="xp-visually-hidden" id={`${fixture.sourceKey}-panel-title`}>{fixture.copy.title}</h2>}
      {chips.length ? <div className="xp-filter-panel__active"><ChipBar items={chips} label={fixture.copy.title} removeLabel={(item) => format(fixture.copy.removeChipLabel, { label: item.label })} onRemove={(id) => onValueChange(id, emptyValue(allControls(fixture).find((control) => control.id === id)!))} /><button type="button" onClick={onClear} data-action="clear" data-xp-control>{fixture.copy.clearLabel}</button></div> : null}
      {panel.search ? <label className="xp-filter-panel__search"><span>{panel.search.label}</span><input type="search" value={query} placeholder={panel.search.placeholder} onChange={(event) => setQuery(event.target.value)} /></label> : null}
      {emptySearch ? <div className="xp-filter-panel__empty" role="status"><h3>{panel.search?.emptyTitle}</h3><p>{panel.search?.emptyDescription}</p><button type="button" onClick={() => setQuery("")} data-xp-control>{fixture.copy.clearLabel}</button></div> : <DisclosureGroup label={fixture.copy.title} items={items} defaultOpen={defaults.map((id) => `${fixture.sourceKey}-${id}`)} wallBehavior={wallBehavior} />}
    </section>
  );
}

export type FilterBarProperties = {
  fixture: CategoryFilterFixture;
  state: FilterState;
  trigger?: ReactNode;
  sort?: ReactNode;
  onRemove: (controlId: string, optionId?: string) => void;
  onFieldOpen?: (field: FilterBarField, triggerContent: ReactNode) => ReactNode;
};

export function FilterBar({ fixture, state, trigger, sort, onRemove, onFieldOpen }: FilterBarProperties) {
  const bar = fixture.bar;
  if (!bar) return null;
  if (bar.preset === "field-rail") {
    const controls = new Map((bar.controls ?? []).map((control) => [control.id, control]));
    return (
      <section className="xp-filter-bar xp-filter-bar--field" data-xp-filter-bar data-preset="field-rail" aria-label={fixture.copy.title}>
        <SnapRail label={fixture.copy.title} paginationLabel={fixture.copy.title} markerLabel={(index) => `${fixture.copy.title} ${index}`} markers="none" peek="12%">
          {(bar.fields ?? []).map((field) => {
            const control = controls.get(field.controlId)!;
            const summary = summaryFor(control, state.values[control.id], field.emptyValueLabel);
            const fieldTrigger = <><span>{field.label}</span><strong>{summary}</strong></>;
            const active = valueIsActive(control, state.values[control.id]);
            const value = state.values[control.id];
            const selectedOptions = Array.isArray(value) && "options" in control
              ? value.map((optionId) => control.options.find((option) => option.id === optionId)).filter((option): option is FilterOption => Boolean(option))
              : [];
            const chips = selectedOptions.length
              ? selectedOptions.map((option) => ({ id: option.id, label: option.label, active: true, removable: true }))
              : [{ id: control.id, label: summary, active: true, removable: true }];
            return <SnapRail.Item className="xp-filter-bar__field" key={field.id}>{onFieldOpen?.(field, fieldTrigger) ?? <button className="xp-filter-bar__field-trigger" type="button" data-field-id={field.id} data-control-id={control.id} data-xp-control>{fieldTrigger}</button>}{active ? <ChipBar items={chips} label={field.label} removeLabel={(item) => format(fixture.copy.removeChipLabel, { label: item.label })} onRemove={(optionId) => onRemove(control.id, selectedOptions.length ? optionId : undefined)} /> : null}</SnapRail.Item>;
          })}
        </SnapRail>
      </section>
    );
  }
  const chips = allControls(fixture).filter((control) => valueIsActive(control, state.values[control.id])).map((control) => ({ id: control.id, label: `${control.label}: ${summaryFor(control, state.values[control.id])}`, active: true, removable: true }));
  return (
    <section className="xp-filter-bar" data-xp-filter-bar data-preset="summary" aria-label={fixture.copy.title}>
      <div className="xp-filter-bar__summary">{trigger}<p>{format(fixture.copy.resultLabel, { count: state.resultCount })}</p>{sort}</div>
      {chips.length ? <ChipBar className="xp-filter-bar__chips" items={chips} label={fixture.copy.title} removeLabel={(item) => format(fixture.copy.removeChipLabel, { label: item.label })} onRemove={onRemove} /> : null}
    </section>
  );
}

export type CategoryFilterProperties = {
  fixture: CategoryFilterFixture;
  stress?: keyof CategoryFilterFixture["stress"];
  applied?: FilterState;
  defaultOpen?: boolean;
  sort?: ReactNode;
  className?: string;
  onAppliedChange?: (state: FilterState) => void;
};

export function CategoryFilter({ fixture: input, stress, applied: controlledApplied, defaultOpen, sort, className, onAppliedChange }: CategoryFilterProperties) {
  const fixture = useMemo(() => resolveCategoryFilterFixture(input, stress), [input, stress]);
  const deviceClass = useDeviceClass();
  const initial = fixture.initialApplied;
  const [localApplied, setLocalApplied] = useState<FilterState>(() => ({ ...initial, values: cloneValues(initial.values) }));
  const applied = controlledApplied ? stateFor(fixture, cloneValues(controlledApplied.values), controlledApplied.resultCount) : localApplied;
  const [draft, setDraft] = useState<FilterState>(() => ({ ...initial, values: cloneValues(initial.values) }));
  // Open after the provider's first width resolution so a default-open overlay
  // cannot lock the server fallback class (M) on TP/TL/DS/DW.
  const [open, setOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string>();
  const [announcement, setAnnouncement] = useState("");
  const persistent = (deviceClass === "DS" || deviceClass === "DW") && fixture.sourceKey !== "category-filter-03" && fixture.sourceKey !== "category-filter-04";
  const dirty = !valuesEqual(applied.values, draft.values);
  const invalidDraft = allControls(fixture).some((control) => controlInvalid(fixture, control, draft.values[control.id]));

  useEffect(() => {
    const next = { ...fixture.initialApplied, values: cloneValues(fixture.initialApplied.values) };
    setLocalApplied(next);
    setDraft(next);
    setOpen(defaultOpen ?? fixture.sourceKey === "category-filter-03");
    setActiveFieldId(undefined);
  }, [defaultOpen, fixture]);

  const commitApplied = (next: FilterState, message?: string) => {
    setLocalApplied(next);
    onAppliedChange?.(next);
    if (message) setAnnouncement(message);
  };
  const updateState = (current: FilterState, controlId: string, value: FilterValue) => {
    const values = { ...current.values, [controlId]: value };
    return stateFor(fixture, values, current.resultCount);
  };
  const updateApplied: ValueChange = (controlId, value) => {
    const next = updateState(applied, controlId, value);
    commitApplied(next, format(fixture.copy.announcements.applied, { count: next.resultCount }));
  };
  const updateDraft: ValueChange = (controlId, value) => {
    setDraft((current) => {
      const next = updateState(current, controlId, value);
      setAnnouncement(format(fixture.copy.announcements.draftChanged, { count: next.resultCount }));
      return next;
    });
  };
  const resetState = (current: FilterState) => {
    const cleared = fixture.resultCountCases.find((item) => item.id === "cleared");
    if (cleared) return stateFor(fixture, cloneValues(cleared.values), cleared.resultCount);
    const values = Object.fromEntries(allControls(fixture).map((control) => [control.id, emptyValue(control)]));
    return stateFor(fixture, values, current.resultCount);
  };
  const removeApplied = (controlId: string, optionId?: string) => {
    const control = allControls(fixture).find((item) => item.id === controlId)!;
    const current = applied.values[controlId];
    const nextValue = optionId && Array.isArray(current) ? current.filter((id) => id !== optionId) : emptyValue(control);
    const removedLabel = optionId && "options" in control ? control.options.find((option) => option.id === optionId)?.label ?? control.label : control.label;
    const next = updateState(applied, controlId, nextValue);
    commitApplied(next, format(fixture.copy.announcements.removed, { label: removedLabel, count: next.resultCount }));
  };
  const begin = () => {
    setDraft({ ...applied, values: cloneValues(applied.values) });
    setOpen(true);
  };
  const discard = (close?: () => void) => {
    setDraft({ ...applied, values: cloneValues(applied.values) });
    setAnnouncement(fixture.copy.announcements.cancelled);
    close?.();
    setOpen(false);
  };
  const apply = () => {
    if (invalidDraft) return;
    const next = stateFor(fixture, cloneValues(draft.values), draft.resultCount);
    commitApplied(next, format(fixture.copy.announcements.applied, { count: next.resultCount }));
    setOpen(false);
  };
  const clearDraft = () => setDraft((current) => {
    const next = resetState(current);
    setAnnouncement(format(fixture.copy.announcements.cleared, { count: next.resultCount }));
    return next;
  });
  const clearApplied = () => {
    const next = resetState(applied);
    commitApplied(next, format(fixture.copy.announcements.cleared, { count: next.resultCount }));
  };
  const cancelAction = fixture.actions.find((action) => action.behavior === "cancel");
  const applyAction = fixture.actions.find((action) => action.behavior === "apply");
  const rootClass = ["xp-category-filter", className].filter(Boolean).join(" ");

  const overlay = (intent: "inspect" | "edit", includeTrigger: boolean) => (
    <AdaptiveOverlay
      intent={intent}
      open={open}
      onOpenChange={(next) => { if (next) begin(); else if (!dirty) discard(); }}
      dirty={dirty}
      onDismissRequest={(close) => discard(close)}
    >
      {includeTrigger ? <AdaptiveOverlay.Trigger className="xp-category-filter__advanced-trigger" aria-label={format(fixture.copy.activeCountLabel, { count: applied.activeCount })}><span>{fixture.copy.triggerLabel}</span><strong data-active-count>{applied.activeCount}</strong></AdaptiveOverlay.Trigger> : <FilterBar fixture={fixture} state={applied} trigger={<AdaptiveOverlay.Trigger className="xp-filter-bar__trigger" aria-label={format(fixture.copy.activeCountLabel, { count: applied.activeCount })}><span>{fixture.copy.triggerLabel}</span><strong>{applied.activeCount}</strong></AdaptiveOverlay.Trigger>} sort={sort} onRemove={removeApplied} />}
      <AdaptiveOverlay.Content className="xp-category-filter__overlay" style={{ color: "var(--xp-filter-ink)", background: "var(--xp-filter-surface)", borderColor: "var(--xp-filter-line)" }} data-source-key={fixture.sourceKey} data-filter-preset={fixture.panel?.preset}>
        <AdaptiveOverlay.Header title={fixture.copy.title} description={fixture.copy.description} closeLabel={fixture.copy.closeLabel} />
        <AdaptiveOverlay.Body><FilterPanel fixture={fixture} state={draft} host="overlay" onValueChange={updateDraft} onClear={clearDraft} /></AdaptiveOverlay.Body>
        <StickyActionBar
          placement="overlay"
          style={{ color: "var(--xp-filter-ink)", background: "var(--xp-filter-surface)", borderColor: "var(--xp-filter-line)" }}
          summary={format(fixture.copy.resultLabel, { count: draft.resultCount })}
          secondary={<button type="button" data-emphasis={cancelAction?.emphasis ?? "secondary"} data-action-id={cancelAction?.id} onClick={() => discard()} data-xp-control>{cancelAction?.label ?? fixture.copy.cancelLabel}</button>}
          primary={<button type="button" disabled={invalidDraft} data-emphasis={applyAction?.emphasis ?? "primary"} data-action-id={applyAction?.id} onClick={apply} data-xp-control>{applyAction?.label ?? fixture.copy.applyLabel}</button>}
        />
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );

  const fieldBar = fixture.bar?.preset === "field-rail" ? (
    <FilterBar
      fixture={fixture}
      state={applied}
      onRemove={removeApplied}
      onFieldOpen={(field, fieldTrigger) => {
        const control = fixture.bar?.controls?.find((item) => item.id === field.controlId)!;
        const fieldOpen = activeFieldId === field.id;
        return <AdaptiveOverlay intent="pick" open={fieldOpen} onOpenChange={(next) => setActiveFieldId(next ? field.id : undefined)}><AdaptiveOverlay.Trigger className="xp-filter-bar__field-trigger" data-field-id={field.id} data-control-id={control.id}>{fieldTrigger}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-category-filter__field-overlay" style={{ color: "var(--xp-filter-ink)", background: "var(--xp-filter-surface)", borderColor: "var(--xp-filter-line)" }} data-field-id={field.id}><AdaptiveOverlay.Header title={field.label} closeLabel={fixture.copy.closeLabel} /><AdaptiveOverlay.Body><ControlRenderer fixture={fixture} control={control} state={applied} onChange={updateApplied} /></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>{fixture.copy.closeLabel}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
      }}
    />
  ) : null;

  return (
    <section className={rootClass} data-xp-category-filter data-xp-filter-state-owner data-source-key={fixture.sourceKey} data-device-class={deviceClass} data-host={persistent ? "persistent" : fixture.sourceKey === "category-filter-04" ? "field-rail" : "overlay"}>
      {fieldBar}
      {fixture.sourceKey === "category-filter-03" ? overlay("edit", true) : persistent ? <div className="xp-category-filter__persistent"><FilterPanel fixture={fixture} state={applied} host="rail" onValueChange={updateApplied} onClear={clearApplied} /><FilterBar fixture={fixture} state={applied} sort={sort} onRemove={removeApplied} /></div> : fixture.panel ? overlay("inspect", false) : null}
      <p className="xp-visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</p>
    </section>
  );
}
