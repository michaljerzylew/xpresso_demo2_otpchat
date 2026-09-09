"use client";

import type { HTMLAttributes } from "react";

export type ChipItem = {
  id: string;
  label: string;
  active?: boolean;
  removable?: boolean;
};

type ChipBarProperties = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  items: ChipItem[];
  label: string;
  removeLabel: (item: ChipItem) => string;
  onChange?: (id: string) => void;
  onRemove?: (id: string) => void;
};

export function ChipBar({ items, label, removeLabel, onChange, onRemove, className, ...properties }: ChipBarProperties) {
  return (
    <div
      {...properties}
      className={["xp-chip-bar", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label={label}
      data-xp-primitive="chip-bar"
      data-xp-rail
    >
      {items.map((item) => (
        <span className="xp-chip" data-active={item.active ? "true" : undefined} key={item.id}>
          <button
            className="xp-chip__select"
            type="button"
            aria-pressed={item.active}
            data-xp-control
            onClick={() => onChange?.(item.id)}
          >
            {item.label}
          </button>
          {item.removable ? (
            <button
              className="xp-chip__remove"
              type="button"
              aria-label={removeLabel(item)}
              data-xp-control
              onClick={() => onRemove?.(item.id)}
            >
              ×
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}
