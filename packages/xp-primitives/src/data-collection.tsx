"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { AdaptiveOverlay } from "./adaptive-overlay";
import { useDeviceClass, type DeviceClass } from "./device-class";

export type DataColumnMeta = {
  priority: number;
  role: "title" | "subtitle" | "status" | "value" | "media" | "detail" | "actions";
  summary?: boolean;
};

export type DataColumn<Row> = ColumnDef<Row> & { meta: DataColumnMeta };

type DataCollectionProperties<Row extends object> = {
  data: Row[];
  columns: DataColumn<Row>[];
  label: string;
  empty: ReactNode;
  detailsLabel: ReactNode;
  showDetailsLabel: ReactNode;
  closeDetailsLabel: ReactNode;
  rowLabel: (row: Row) => ReactNode;
  getRowId?: (row: Row, index: number) => string;
  onRowActivate?: (row: Row) => void;
  isRowSelected?: (row: Row) => boolean;
  onRowSelectionChange?: (row: Row, selected: boolean, range: boolean) => void;
  onPageSelectionChange?: (selected: boolean) => void;
  pageSelected?: boolean;
  pagePartiallySelected?: boolean;
  selectRowLabel?: (row: Row) => string;
  selectPageLabel?: string;
  sortColumnId?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (columnId: string) => void;
  deviceClass?: DeviceClass;
};

const formByClass = {
  M: "stack",
  TP: "grid-2",
  TL: "disclosure",
  DS: "grid-4",
  DW: "grid-5",
} as const;

function columnLabel<Row extends object>(column: { id: string; columnDef: ColumnDef<Row> }) {
  return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
}

export function DataCollection<Row extends object>({
  data,
  columns,
  label,
  empty,
  detailsLabel,
  showDetailsLabel,
  closeDetailsLabel,
  rowLabel,
  getRowId,
  onRowActivate,
  isRowSelected,
  onRowSelectionChange,
  onPageSelectionChange,
  pageSelected = false,
  pagePartiallySelected = false,
  selectRowLabel = () => "Select row",
  selectPageLabel = "Select visible rows",
  sortColumnId,
  sortDirection,
  onSortChange,
  deviceClass: deviceClassOverride,
}: DataCollectionProperties<Row>) {
  const ambientDeviceClass = useDeviceClass();
  const deviceClass = deviceClassOverride ?? ambientDeviceClass;
  const form = formByClass[deviceClass];
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  if (!data.length) {
    return <div className="xp-data-empty" data-xp-primitive="data-collection" data-variant={form}>{empty}</div>;
  }

  if (deviceClass === "M" || deviceClass === "TP") {
    return (
      <div
        className="xp-data-cards"
        role="list"
        aria-label={label}
        data-xp-primitive="data-collection"
        data-variant={form}
      >
        {table.getRowModel().rows.map((row) => (
          <article className="xp-data-card" role="listitem" data-selected={isRowSelected?.(row.original) || undefined} key={row.id}>
            {isRowSelected && onRowSelectionChange ? (
              <label className="xp-data-card__select">
                <input
                  type="checkbox"
                  checked={isRowSelected(row.original)}
                  onChange={(event) => onRowSelectionChange(row.original, event.currentTarget.checked, event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey)}
                />
                <span>{selectRowLabel(row.original)}</span>
              </label>
            ) : null}
            <AdaptiveOverlay intent="detail" onOpenChange={(open) => { if (open) onRowActivate?.(row.original); }}>
              <AdaptiveOverlay.Trigger className="xp-data-card__summary">
                {row.getVisibleCells().filter((cell) => (cell.column.columnDef.meta as DataColumnMeta).summary).map((cell) => (
                  <span className="xp-data-card__cell" data-role={(cell.column.columnDef.meta as DataColumnMeta).role} key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                ))}
                <span className="xp-data-card__action">{showDetailsLabel}</span>
              </AdaptiveOverlay.Trigger>
              <AdaptiveOverlay.Content>
                <AdaptiveOverlay.Header title={rowLabel(row.original)} description={detailsLabel} />
                <AdaptiveOverlay.Body>
                  <dl className="xp-data-card__details">
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id}>
                        <dt>{columnLabel(cell.column)}</dt>
                        <dd>{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                      </div>
                    ))}
                  </dl>
                </AdaptiveOverlay.Body>
                <AdaptiveOverlay.Footer>
                  <AdaptiveOverlay.Close>{closeDetailsLabel}</AdaptiveOverlay.Close>
                </AdaptiveOverlay.Footer>
              </AdaptiveOverlay.Content>
            </AdaptiveOverlay>
          </article>
        ))}
      </div>
    );
  }

  const priorityLimit = deviceClass === "TL" ? 3 : deviceClass === "DS" ? 4 : Number.POSITIVE_INFINITY;
  return (
    <div className="xp-data-table-wrap" data-xp-scroll data-xp-primitive="data-collection" data-variant={form}>
      <table className="xp-data-table">
        <caption>{label}</caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {isRowSelected && onRowSelectionChange ? (
                <th scope="col" className="xp-data-table__selection">
                  <label>
                    <input
                      type="checkbox"
                      checked={pageSelected}
                      ref={(node) => { if (node) node.indeterminate = pagePartiallySelected; }}
                      onChange={(event) => onPageSelectionChange?.(event.currentTarget.checked)}
                    />
                    <span className="xp-visually-hidden">{selectPageLabel}</span>
                  </label>
                </th>
              ) : null}
              {headerGroup.headers.filter((header) => (header.column.columnDef.meta as DataColumnMeta).priority <= priorityLimit).map((header) => (
                <th
                  scope="col"
                  aria-sort={sortColumnId === header.column.id ? (sortDirection === "desc" ? "descending" : "ascending") : undefined}
                  key={header.id}
                >
                  {header.column.columnDef.enableSorting && onSortChange ? (
                    <button className="xp-data-table__sort" type="button" onClick={() => onSortChange(header.column.id)}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span aria-hidden="true">{sortColumnId === header.column.id ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}</span>
                    </button>
                  ) : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
              {priorityLimit !== Number.POSITIVE_INFINITY ? <th scope="col">{detailsLabel}</th> : null}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr data-selected={isRowSelected?.(row.original) || undefined} key={row.id}>
              {isRowSelected && onRowSelectionChange ? (
                <td className="xp-data-table__selection">
                  <label>
                    <input
                      type="checkbox"
                      checked={isRowSelected(row.original)}
                      onChange={(event) => onRowSelectionChange(row.original, event.currentTarget.checked, event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey)}
                    />
                    <span className="xp-visually-hidden">{selectRowLabel(row.original)}</span>
                  </label>
                </td>
              ) : null}
              {row.getVisibleCells().filter((cell) => (cell.column.columnDef.meta as DataColumnMeta).priority <= priorityLimit).map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
              {priorityLimit !== Number.POSITIVE_INFINITY ? (
                <td>
                  <details className="xp-data-row-details">
                    <summary>{showDetailsLabel}</summary>
                    <dl>
                      {row.getVisibleCells().filter((cell) => (cell.column.columnDef.meta as DataColumnMeta).priority > priorityLimit).map((cell) => (
                        <div key={cell.id}>
                          <dt>{columnLabel(cell.column)}</dt>
                          <dd>{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
