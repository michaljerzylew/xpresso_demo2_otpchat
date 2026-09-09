import { useState, type ReactNode } from "react";
import { Control } from "./base-controls";

/**
 * A bounded collection form: only the current page exists in the reading order.
 *
 * The controls name the unit they step, derived from `pageSize` rather than written per call site,
 * so changing how much a page carries cannot leave a stale label behind. A page of one record steps
 * records; a page of several steps pages, because the counter beside the controls counts pages. A
 * deck whose records have a noun of their own passes that noun explicitly.
 */
export function RecordDeck<T>({ items, label, render, empty, index: controlledIndex, onIndexChange, pageSize = 1, previousLabel, nextLabel }: {
  items: readonly T[]; label: string; render: (item: T, index: number) => ReactNode;
  empty: ReactNode; pageSize?: number; previousLabel?: string; nextLabel?: string;
  index?: number; onIndexChange?: (index: number) => void;
}) {
  const unit = pageSize === 1 ? "record" : "page";
  const previous = previousLabel ?? `Previous ${unit}`;
  const next = nextLabel ?? `Next ${unit}`;
  const [index, setIndex] = useState(0);
  const active = Math.max(0, Math.min(controlledIndex ?? index, Math.max(0, items.length - 1)));
  const select = (next: number) => { setIndex(next); onIndexChange?.(next); };
  if (!items.length) return <>{empty}</>;
  return <section className="xp-record-deck" data-xp-primitive="record-deck" data-variant="deck" aria-label={label}>
    <div className="xp-record-deck__record" aria-live="polite" aria-atomic="true">{render(items[active], active)}</div>
    <nav aria-label={label + " pagination"} className="xp-record-deck__navigation">
      <Control disabled={active === 0} onClick={() => select(active - 1)}>{previous}</Control>
      <span>{active + 1} / {items.length}</span>
      <Control disabled={active === items.length - 1} onClick={() => select(active + 1)}>{next}</Control>
    </nav>
  </section>;
}
