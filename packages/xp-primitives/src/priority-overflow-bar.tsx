"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MenuPopout, type MenuItem } from "./menu-popout";
import { useDeviceClass } from "./device-class";

export type OverflowItem = {
  id: string;
  label: string;
  priority: number;
  content: ReactNode;
  onSelect?: () => void;
};

type PriorityOverflowBarProperties = {
  items: OverflowItem[];
  overflowLabel: string;
  closeLabel: string;
  label: string;
};

export function PriorityOverflowBar({ items, overflowLabel, closeLabel, label }: PriorityOverflowBarProperties) {
  const deviceClass = useDeviceClass();
  const container = useRef<HTMLDivElement | null>(null);
  const widths = useRef(new Map<string, number>());
  const [visible, setVisible] = useState(() => new Set(items.map((item) => item.id)));
  const [menuOpen, setMenuOpen] = useState(false);

  const measure = useCallback(() => {
    if (menuOpen) return;
    const root = container.current;
    if (!root) return;
    for (const element of root.querySelectorAll<HTMLElement>("[data-overflow-item]")) {
      widths.current.set(element.dataset.overflowItem ?? "", element.getBoundingClientRect().width);
    }
    const available = root.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(root).columnGap) || 0;
    const more = root.querySelector<HTMLElement>("[data-overflow-more]")?.getBoundingClientRect().width ?? 0;
    const ordered = [...items].sort((left, right) => left.priority - right.priority);
    const next = new Set<string>();
    let used = 0;
    for (const item of ordered) {
      const width = widths.current.get(item.id) ?? 0;
      const reserve = next.size < items.length - 1 ? more + gap : 0;
      if (used + width + (next.size ? gap : 0) + reserve <= available) {
        next.add(item.id);
        used += width + (next.size > 1 ? gap : 0);
      }
    }
    setVisible(next);
  }, [items, menuOpen]);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);

  const overflow = items.filter((item) => !visible.has(item.id));
  const menuItems: MenuItem[] = overflow.map((item) => ({ id: item.id, label: item.label, onSelect: item.onSelect }));

  return (
    <div
      className="xp-priority-bar"
      ref={container}
      role="toolbar"
      aria-label={label}
      data-xp-primitive="priority-overflow-bar"
      data-xp-overflow-measurer
      data-overflow-frozen={menuOpen ? "true" : "false"}
      data-variant={deviceClass === "M" ? "sheet" : "popover"}
    >
      {items.map((item) => (
        <div
          className="xp-priority-bar__item"
          data-overflow-item={item.id}
          data-visible={visible.has(item.id) ? "true" : "false"}
          key={item.id}
        >
          {item.content}
        </div>
      ))}
      <div className="xp-priority-bar__more" data-overflow-more data-visible={overflow.length ? "true" : "false"}>
        <MenuPopout trigger={overflowLabel} title={overflowLabel} items={menuItems} closeLabel={closeLabel} onOpenChange={setMenuOpen} />
      </div>
    </div>
  );
}
