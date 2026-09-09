"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { useDeviceClass } from "./device-class";

export type DisclosureItem = { id: string; title: ReactNode; content: ReactNode };
export type DisclosureWallBehavior = "interactive" | "expanded";

export type DisclosureGroupProperties = {
  items: DisclosureItem[];
  multiple?: boolean;
  defaultOpen?: string[];
  openIds?: string[];
  onOpenChange?: (ids: string[]) => void;
  wallBehavior?: DisclosureWallBehavior;
  label: string;
  className?: string;
};

export function DisclosureGroup({
  items,
  multiple = true,
  defaultOpen = [],
  openIds,
  onOpenChange,
  wallBehavior = "expanded",
  label,
  className,
}: DisclosureGroupProperties) {
  const [localOpen, setLocalOpen] = useState(() => new Set(defaultOpen));
  const open = openIds ? new Set(openIds) : localOpen;
  const groupId = useId().replaceAll(":", "");
  const deviceClass = useDeviceClass();
  const wall = deviceClass === "TL" || deviceClass === "DS" || deviceClass === "DW";
  const expandedWall = wall && wallBehavior === "expanded";
  const toggle = (id: string) => {
    const next = multiple ? new Set(open) : new Set<string>();
    if (open.has(id)) next.delete(id);
    else next.add(id);
    if (openIds === undefined) setLocalOpen(next);
    onOpenChange?.(items.filter((item) => next.has(item.id)).map((item) => item.id));
  };
  const closeFromEscape = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key !== "Escape" || expandedWall || !open.has(id)) return;
    event.preventDefault();
    const next = new Set(open);
    next.delete(id);
    if (openIds === undefined) setLocalOpen(next);
    onOpenChange?.(items.filter((item) => next.has(item.id)).map((item) => item.id));
    event.currentTarget.querySelector<HTMLButtonElement>(".xp-disclosure__trigger")?.focus();
  };
  return (
    <div
      className={["xp-disclosure-group", className].filter(Boolean).join(" ")}
      aria-label={label}
      data-xp-primitive="disclosure-group"
      data-wall-behavior={wallBehavior}
    >
      {items.map((item) => {
        const expanded = expandedWall || open.has(item.id);
        return (
          <section className="xp-disclosure" data-open={expanded ? "true" : "false"} data-disclosure-id={item.id} key={item.id} onKeyDown={(event) => closeFromEscape(event, item.id)}>
            <h3 className="xp-disclosure__heading">
              <button
                className="xp-disclosure__trigger"
                type="button"
                aria-expanded={expanded}
                aria-disabled={expandedWall || undefined}
                aria-controls={`${groupId}-${item.id}-panel`}
                data-xp-control
                onClick={() => { if (!expandedWall) toggle(item.id); }}
              >
                <span>{item.title}</span>
                <span aria-hidden="true">+</span>
              </button>
            </h3>
            <div className="xp-disclosure__clip" id={`${groupId}-${item.id}-panel`} hidden={!expanded}>
              <div className="xp-disclosure__content">{item.content}</div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
