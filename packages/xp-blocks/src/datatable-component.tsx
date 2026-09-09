"use client";

import { AdaptiveOverlay, DataCollection, useDeviceClass, type DataColumn, type DataColumnMeta } from "@xp/primitives";
import { useMemo, useRef, useState, type ReactNode } from "react";
import type {
  DatatableAction,
  DatatableCell,
  DatatableColumn,
  DatatableMediaAsset,
  ResolvedDatatableFixture,
} from "./datatable-component-model";

type DataRow = ResolvedDatatableFixture["rows"][number];

function fill(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce((copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)), template);
}

function SystemMark({ mediaKey }: { mediaKey: string }) {
  if (mediaKey === "mark_card") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 9h18M6 15h5"/></svg>;
  if (mediaKey === "mark_bank") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18L12 3 3 9Zm2 2v7m5-7v7m4-7v7m5-7v7M3 21h18"/></svg>;
  if (mediaKey === "icon_truck") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7ZM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>;
  const level = Number(mediaKey.at(-1) ?? 0);
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={level === 0 ? "M12 3 4 7v5c0 4.8 3.2 7.8 8 9 4.8-1.2 8-4.2 8-9V7l-8-4Zm-3 9 2 2 4-5" : level === 1 ? "M4 20h16M7 17V9l5-5 5 5v8M10 17v-5h4v5" : "M12 3v18M6 8h12M7 16h10M9 5h6M9 19h6"}/></svg>;
}

function Media({ mediaKey, media, className = "" }: { mediaKey?: string; media: DatatableMediaAsset[]; className?: string }) {
  if (!mediaKey) return null;
  const asset = media.find((candidate) => candidate.key === mediaKey);
  if (!asset) return null;
  return asset.kind === "system" ? (
    <span className={`xp-datatable__system-mark ${className}`}><SystemMark mediaKey={mediaKey} /></span>
  ) : (
    <img className={`xp-datatable__media ${className}`} src={asset.src} alt={asset.alt} />
  );
}

function Sparkline({ cell }: { cell: Extract<DatatableCell, { kind: "sparkline" }> }) {
  const values = cell.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${26 - ((value - min) / range) * 22}`).join(" ");
  return <svg className="xp-datatable__sparkline" viewBox="0 0 100 30" role="img" aria-label={cell.summary}><polyline points={points}/></svg>;
}

function CellValue({ cell, media, toggle }: { cell: DatatableCell; media: DatatableMediaAsset[]; toggle?: { checked: boolean; pending: boolean; error: boolean; onChange: () => void; errorLabel: string } }): ReactNode {
  switch (cell.kind) {
    case "identity": return (
      <span className="xp-datatable__identity">
        <span className="xp-datatable__identity-media">
          <Media mediaKey={cell.mediaKey} media={media} />
          {cell.secondaryMediaKey ? <Media mediaKey={cell.secondaryMediaKey} media={media} className="xp-datatable__secondary-media" /> : null}
        </span>
        <span><strong>{cell.title}</strong>{cell.subtitle ? <small>{cell.subtitle}</small> : null}</span>
      </span>
    );
    case "text": return cell.text;
    case "money": return <span className="xp-datatable__number">{new Intl.NumberFormat("en-US", { style: "currency", currency: cell.currency }).format(cell.amountMinor / 100)}</span>;
    case "status": return <span className="xp-datatable__status" data-tone={cell.tone}>{cell.label}</span>;
    case "payment": return <span className="xp-datatable__payment"><Media mediaKey={cell.markKey} media={media}/><span>{cell.label}</span></span>;
    case "progress": return <span className="xp-datatable__progress"><progress value={cell.value - cell.min} max={cell.max - cell.min}/><span><strong>{Math.round(((cell.value - cell.min) / Math.max(1, cell.max - cell.min)) * 100)}%</strong><small>{cell.completedLabel} / {cell.totalLabel}</small></span></span>;
    case "metrics": return <span className="xp-datatable__metrics">{cell.values.map((item) => <span key={item.id}><small>{item.label}</small><strong>{item.value}</strong></span>)}</span>;
    case "route": return cell.place;
    case "date": return <time dateTime={cell.iso}>{cell.display}</time>;
    case "toggle": return <span className="xp-datatable__toggle-wrap"><button className="xp-datatable__toggle" type="button" role="switch" aria-checked={toggle?.checked ?? cell.checked} disabled={toggle?.pending} onClick={toggle?.onChange}><span aria-hidden="true"/><small>{(toggle?.checked ?? cell.checked) ? cell.onLabel : cell.offLabel}</small></button>{toggle?.error ? <small className="xp-datatable__mutation-error" role="alert">{toggle.errorLabel}</small> : null}</span>;
    case "number": return <span className="xp-datatable__number">{cell.display}</span>;
    case "trend": return <span className="xp-datatable__trend" data-direction={cell.direction}>{cell.direction === "up" ? "↑" : cell.direction === "down" ? "↓" : "→"} {cell.display}</span>;
    case "sparkline": return <Sparkline cell={cell}/>;
  }
}

function cellText(cell: DatatableCell | undefined): string {
  if (!cell) return "";
  switch (cell.kind) {
    case "identity": return `${cell.title} ${cell.subtitle ?? ""}`;
    case "text": return cell.text;
    case "money": return String(cell.amountMinor);
    case "status": return `${cell.value} ${cell.label}`;
    case "payment": return `${cell.value} ${cell.label}`;
    case "progress": return `${cell.value} ${cell.completedLabel} ${cell.totalLabel}`;
    case "metrics": return cell.values.map((item) => `${item.label} ${item.value}`).join(" ");
    case "route": return cell.place;
    case "date": return `${cell.iso} ${cell.display}`;
    case "toggle": return cell.checked ? `in available ${cell.onLabel}` : `out ${cell.offLabel}`;
    case "number": return `${cell.value} ${cell.display}`;
    case "trend": return `${cell.value} ${cell.display}`;
    case "sparkline": return `${cell.summary} ${cell.points.map((point) => point.value).join(" ")}`;
  }
}

function comparable(cell: DatatableCell | undefined): string | number {
  if (!cell) return "";
  if (cell.kind === "money") return cell.amountMinor;
  if (cell.kind === "number" || cell.kind === "trend" || cell.kind === "progress") return cell.value;
  if (cell.kind === "date") return cell.iso;
  if (cell.kind === "identity") return cell.title.toLocaleLowerCase();
  return cellText(cell).toLocaleLowerCase();
}

function ActionGroup({ actions, rowId, actionScope }: { actions: DatatableAction[]; rowId: string; actionScope?: "selected" | "filtered" }) {
  return <span className="xp-datatable__row-actions">{actions.map((action) => <button type="button" data-action-id={action.id} data-row-id={rowId} data-action-scope={action.kind === "export" ? actionScope : undefined} data-destructive={action.destructive || undefined} key={action.id}>{action.label}</button>)}</span>;
}

function RowActionMenu({ actions, rowId, label }: { actions: DatatableAction[]; rowId: string; label: string }) {
  return <details className="xp-datatable__action-menu"><summary>{label}</summary><ActionGroup actions={actions} rowId={rowId}/></details>;
}

export function DatatableComponent({ model, viewState = "ready" }: { model: ResolvedDatatableFixture; viewState?: "ready" | "loading" | "error" | "filtered-empty" }) {
  const deviceClass = useDeviceClass();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(model.pagination.initialPage);
  const [pageSize, setPageSize] = useState(model.pagination.initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ columnId: string; direction: "asc" | "desc" } | undefined>(model.sort);
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [toggleErrors, setToggleErrors] = useState<Set<string>>(new Set());
  const lastSelectedIndex = useRef<number | null>(null);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = model.rows.filter((row) => {
      if (normalizedQuery && model.search && !model.search.fieldIds.some((id) => cellText(row.cells[id]).toLocaleLowerCase().includes(normalizedQuery))) return false;
      return model.filters.every((filter) => {
        const value = filters[filter.id];
        if (!value) return true;
        return cellText(row.cells[filter.columnId]).toLocaleLowerCase().includes(value.replaceAll("_", " ").toLocaleLowerCase());
      });
    });
    if (!sort) return filtered;
    return [...filtered].sort((left, right) => {
      const a = comparable(left.cells[sort.columnId]);
      const b = comparable(right.cells[sort.columnId]);
      const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
      return sort.direction === "asc" ? result : -result;
    });
  }, [filters, model.filters, model.rows, model.search, query, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visibleRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const pageSelectedCount = pageRows.filter((row) => selected.has(row.id)).length;
  const dataColumns = model.columns.filter((column) => !["selection", "actions"].includes(column.role));

  const columns: DataColumn<DataRow>[] = [
    ...dataColumns.map((column): DataColumn<DataRow> => ({
      id: column.id,
      accessorFn: (row) => cellText(row.cells[column.id]),
      header: column.label,
      enableSorting: column.sortable,
      cell: ({ row }) => {
        const cell = row.original.cells[column.id];
        const toggleKey = `${row.original.id}:${column.id}`;
        const toggle = cell.kind === "toggle" ? {
          checked: toggleValues[toggleKey] ?? cell.checked,
          pending: pendingToggles.has(toggleKey),
          error: toggleErrors.has(toggleKey),
          errorLabel: model.copy.error,
          onChange: () => {
            const previous = toggleValues[toggleKey] ?? cell.checked;
            setToggleErrors((current) => { const next = new Set(current); next.delete(toggleKey); return next; });
            setToggleValues((current) => ({ ...current, [toggleKey]: !previous }));
            setPendingToggles((current) => new Set(current).add(toggleKey));
            window.setTimeout(() => {
              setPendingToggles((current) => { const next = new Set(current); next.delete(toggleKey); return next; });
              if (new URLSearchParams(window.location.search).get("mutation") === "error") {
                setToggleValues((current) => ({ ...current, [toggleKey]: previous }));
                setToggleErrors((current) => new Set(current).add(toggleKey));
              }
            }, 240);
          },
        } : undefined;
        return <CellValue cell={cell} media={model.resolvedMedia} toggle={toggle}/>;
      },
      meta: {
        priority: column.priority,
        role: column.role === "identity" ? "title" : column.role === "status" ? "status" : column.role === "metric" ? "value" : column.role === "payment-mark" ? "media" : "detail",
        summary: column.summary !== "detail-only",
      } satisfies DataColumnMeta,
    })),
    ...(model.actions.row.length ? [{
      id: "actions",
      header: model.columns.find((column) => column.role === "actions")?.label ?? "Actions",
      enableSorting: false,
      cell: ({ row }: { row: { original: DataRow } }) => deviceClass === "M" || deviceClass === "TP"
        ? <ActionGroup actions={model.actions.row} rowId={row.original.id}/>
        : <RowActionMenu actions={model.actions.row} rowId={row.original.id} label={model.columns.find((column) => column.role === "actions")?.label ?? model.label}/>,
      meta: { priority: 99, role: "actions", summary: false } as DataColumnMeta,
    } satisfies DataColumn<DataRow>] : []),
  ];

  const rowLabel = (row: DataRow) => {
    const primary = model.columns.find((column) => column.summary === "primary");
    const cell = primary ? row.cells[primary.id] : Object.values(row.cells)[0];
    return cell?.kind === "identity" ? cell.title : cellText(cell);
  };

  const setRowSelected = (row: DataRow, checked: boolean, range: boolean) => setSelected((current) => {
    const next = new Set(current);
    const index = visibleRows.findIndex((candidate) => candidate.id === row.id);
    if (range && model.selection.range && lastSelectedIndex.current !== null && index >= 0) {
      const start = Math.min(lastSelectedIndex.current, index);
      const end = Math.max(lastSelectedIndex.current, index);
      visibleRows.slice(start, end + 1).forEach((candidate) => checked ? next.add(candidate.id) : next.delete(candidate.id));
    } else if (checked) next.add(row.id); else next.delete(row.id);
    if (index >= 0) lastSelectedIndex.current = index;
    return next;
  });

  const renderFilters = () => model.filters.map((filter) => (
    <label className="xp-datatable__filter" key={filter.id}><span>{filter.label}</span><select value={filters[filter.id] ?? ""} onChange={(event) => { setFilters((current) => ({ ...current, [filter.id]: event.currentTarget.value })); setPage(0); }}><option value="">{filter.label}</option>{filter.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
  ));

  const compactExports = model.actions.collection.filter((action) => action.kind === "export").length > 1;
  const exportActions = model.actions.collection.filter((action) => action.kind === "export");
  const directCollectionActions = compactExports ? model.actions.collection.filter((action) => action.kind !== "export") : model.actions.collection;
  const exportLabel = exportActions[0]?.label.replace(/\s+(?:to\s+)?(?:CSV|Excel|JSON)$/i, "") ?? "";

  return (
    <section className="xp-datatable" data-xp-datatable-renderer data-source-key={model.sourceKey} data-preset={model.preset}>
      <header className="xp-datatable__header">
        <div><p>Data collection</p><h1>{model.label}</h1></div>
        {model.actions.collection.length ? <div className="xp-datatable__collection-actions" data-compact-exports={compactExports || undefined}>
          <ActionGroup actions={directCollectionActions} rowId="collection" actionScope={selected.size ? "selected" : "filtered"}/>
          {compactExports ? <AdaptiveOverlay intent="menu"><AdaptiveOverlay.Trigger>{exportLabel}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content><AdaptiveOverlay.Header title={model.label}/><AdaptiveOverlay.Body><ActionGroup actions={exportActions} rowId="collection" actionScope={selected.size ? "selected" : "filtered"}/></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay> : null}
        </div> : null}
      </header>
      {(model.search || model.filters.length) ? (
        <div className="xp-datatable__toolbar">
          {model.search ? <label className="xp-datatable__search"><span className="xp-visually-hidden">{model.search.label}</span><input type="search" value={query} placeholder={model.search.label} onChange={(event) => { setQuery(event.currentTarget.value); setPage(0); }}/></label> : null}
          {deviceClass === "M" && model.filters.length ? <AdaptiveOverlay intent="pick"><AdaptiveOverlay.Trigger className="xp-datatable__filter-trigger">{fill(model.copy.filterCount, { count: activeFilterCount })}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content><AdaptiveOverlay.Header title={fill(model.copy.filterCount, { count: activeFilterCount })}/><AdaptiveOverlay.Body><div className="xp-datatable__filter-sheet">{renderFilters()}</div></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay> : renderFilters()}
          {activeFilterCount ? <output className="xp-datatable__filter-count">{fill(model.copy.filterCount, { count: activeFilterCount })}</output> : null}
        </div>
      ) : null}
      {model.selection.enabled && selected.size ? <div className="xp-datatable__selection-summary" role="status">{fill(model.copy.selectedCount, { count: selected.size })}</div> : null}
      {viewState === "loading" ? <div className="xp-datatable__state" role="status"><span className="xp-datatable__state-mark" aria-hidden="true"/><p>{model.copy.loading}</p></div> : null}
      {viewState === "error" ? <div className="xp-datatable__state" role="alert"><p>{model.copy.error}</p><button type="button">{model.copy.retry}</button></div> : null}
      {viewState !== "loading" && viewState !== "error" ? <DataCollection
        data={viewState === "filtered-empty" ? [] : pageRows}
        columns={columns}
        label={model.label}
        empty={viewState === "filtered-empty" || query || activeFilterCount ? model.copy.filteredEmpty : model.copy.empty}
        detailsLabel={model.copy.details}
        showDetailsLabel={model.copy.details}
        closeDetailsLabel={model.copy.closeDetails}
        rowLabel={rowLabel}
        getRowId={(row) => row.id}
        isRowSelected={model.selection.enabled ? (row) => selected.has(row.id) : undefined}
        onRowSelectionChange={model.selection.enabled ? setRowSelected : undefined}
        onPageSelectionChange={model.selection.enabled ? (checked) => setSelected((current) => { const next = new Set(current); pageRows.forEach((row) => checked ? next.add(row.id) : next.delete(row.id)); return next; }) : undefined}
        pageSelected={pageRows.length > 0 && pageSelectedCount === pageRows.length}
        pagePartiallySelected={pageSelectedCount > 0 && pageSelectedCount < pageRows.length}
        selectRowLabel={(row) => `Select ${rowLabel(row)}`}
        sortColumnId={sort?.columnId}
        sortDirection={sort?.direction}
        onSortChange={(columnId) => setSort((current) => ({ columnId, direction: current?.columnId === columnId && current.direction === "asc" ? "desc" : "asc" }))}
      /> : null}
      {viewState === "ready" ? <footer className="xp-datatable__pagination">
        <p>{fill(model.copy.paginationRange, { start: visibleRows.length ? safePage * pageSize + 1 : 0, end: Math.min((safePage + 1) * pageSize, visibleRows.length), total: visibleRows.length })}</p>
        {model.pagination.pageSizeOptions ? <label><span>Rows</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.currentTarget.value)); setPage(0); }}>{model.pagination.pageSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}</select></label> : null}
        <nav aria-label={`${model.label} pagination`}><button type="button" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><span>{safePage + 1} / {pageCount}</span><button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button></nav>
      </footer> : null}
    </section>
  );
}
