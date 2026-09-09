import { forwardRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { Control, Field, RecordDeck, SegmentedControl } from "@xp/primitives";
import { Tabs as PrimitiveTabs } from "@xp/primitives/base";
import { AlertCircle, Check, Inbox, X, Eye, EyeOff } from "lucide-react";
import type { DeviceClass } from "@xp/runtime";
import { resolveKitForm } from "./forms";
import { CollectionArrival, StatusArrival } from "../../shell/motion";

/** Semantic roles include accent for the calendar categories (#57). */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "accent";
export type LoadState = "ready" | "empty" | "loading" | "error";
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; variant?: "solid" | "outline" | "quiet"; loading?: boolean }>(function Button({ tone = "neutral", variant = "outline", loading = false, children, className = "", disabled, ...props }, ref) {
  return <Control {...props} ref={ref} className={"kit-button " + className} data-tone={tone} data-variant={variant} disabled={disabled || loading} aria-disabled={disabled || loading || undefined} aria-busy={loading || undefined}>{loading && <span aria-hidden="true">···</span>}{children}</Control>;
});
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) { return <span className="kit-badge" data-tone={tone}>{children}</span>; }
export function Chip({ children, tone = "neutral", onRemove, removeLabel }: { children: ReactNode; tone?: Tone; onRemove?: () => void; removeLabel?: string }) {
  // A chip child is any node, so the name is derived only when it is text. Consumers with richer
  // content pass removeLabel instead of shipping "Remove [object Object]".
  const label = removeLabel ?? (typeof children === "string" || typeof children === "number" ? "Remove " + children : "Remove");
  return <span className="kit-chip" data-tone={tone}><span className="kit-dot" aria-hidden="true" />{children}{onRemove && <Button variant="quiet" aria-label={label} onClick={onRemove}><X aria-hidden="true" /></Button>}</span>;
}
export function Avatar({ name, initials, status, presence }: { name: string; initials?: string; status?: string; presence?: "online" | "away" | "offline" }) { return <span className="kit-avatar" role="img" aria-label={name + (status ? ", " + status : "")} title={name}><span aria-hidden="true">{initials ?? name.split(" ").map(p => p[0]).slice(0, 2).join("")}</span>{status && <span className="kit-presence" data-presence={presence ?? "online"} aria-hidden="true" />}</span>; }
export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLElement>) { return <article {...props} className={"kit-card " + className}>{children}</article>; }
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <header className="kit-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>; }
export function InspectorSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) { return <details className="kit-inspector-section" open={defaultOpen}><summary>{title}</summary><div>{children}</div></details>; }
export function ListRow({ title, description, leading, trailing, onClick, selected }: { title: string; description?: string; leading?: ReactNode; trailing?: ReactNode; onClick?: () => void; selected?: boolean }) {
  const content = <>{leading}<span className="kit-row-copy"><strong>{title}</strong>{description && <span>{description}</span>}</span>{trailing}</>;
  return onClick ? <Button className="kit-row" aria-pressed={selected} onClick={onClick}>{content}</Button> : <div className="kit-row">{content}</div>;
}
export function Input({ label, help, error, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { label: string; help?: string; error?: string }) {
  return <Field className="kit-field" hasHelp={!!help} hasError={!!error} invalid={!!error}><Field.Label>{label}</Field.Label><Field.Input inputMode="text" enterKeyHint="next" autoComplete="off" {...props} />{help && <Field.Help>{help}</Field.Help>}{error && <Field.Error>{error}</Field.Error>}</Field>;
}
export function Textarea({ label, help, error, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; help?: string; error?: string }) {
  return <Field className="kit-field kit-field-multiline" hasHelp={!!help} hasError={!!error} invalid={!!error}><Field.Label>{label}</Field.Label><Field.Textarea rows={rows} {...props} />{help && <Field.Help>{help}</Field.Help>}{error && <Field.Error>{error}</Field.Error>}</Field>;
}
/** A settings switch: a real checkbox with switch semantics, so keyboard and assistive technology
 *  get the native control and the label is part of the hit area. */
export function Toggle({ label, description, checked, onChange, disabled, hideLabel = false }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; hideLabel?: boolean }) {
  return <label className="kit-toggle" data-checked={checked} data-label={hideLabel ? "hidden" : "visible"}>
    <span className="kit-toggle-copy"><strong>{label}</strong>{description && <span>{description}</span>}</span>
    <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
  </label>;
}
export function Select({ label, items, value, onChange, disabled, error }: { label: string; items: { value: string; label: string; disabled?: boolean }[]; value: string; onChange: (value: string) => void; disabled?: boolean; error?: string }) {
  return <Field className="kit-field" invalid={!!error} hasError={!!error}><Field.Label>{label}</Field.Label><Field.Select autoComplete="off" value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>{items.map(item => <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}</Field.Select>{error && <Field.Error>{error}</Field.Error>}</Field>;
}
/** Native password field keeps autofill and a keyboard-operable visibility twin. */
export function PasswordInput({ label, help, error, ...props }: Parameters<typeof Input>[0]) {
  const [visible, setVisible] = useState(false);
  return <Field className="kit-field" hasHelp={!!help} hasError={!!error} invalid={!!error}><Field.Label>{label}</Field.Label><div className="kit-password"><Field.Input inputMode="text" enterKeyHint="next" autoComplete="off" {...props} type={visible ? "text" : "password"} /><Button className="kit-password-toggle" type="button" variant="quiet" disabled={props.disabled} aria-label={(visible ? "Hide " : "Show ") + label.toLowerCase()} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button></div>{help && <Field.Help>{help}</Field.Help>}{error && <Field.Error>{error}</Field.Error>}</Field>;
}
export function Tabs({ value, onChange, items, label }: { value: string; onChange: (value: string) => void; items: { value: string; label: string; content: ReactNode; disabled?: boolean }[]; label: string }) {
  return <PrimitiveTabs.Root value={value} onValueChange={onChange} className="kit-tabs"><PrimitiveTabs.List aria-label={label} className="kit-tab-list">{items.map(item => <PrimitiveTabs.Trigger className="kit-tab" key={item.value} value={item.value} disabled={item.disabled}>{item.label}</PrimitiveTabs.Trigger>)}</PrimitiveTabs.List>{items.map(item => <PrimitiveTabs.Content key={item.value} value={item.value} className="kit-tab-panel">{item.content}</PrimitiveTabs.Content>)}</PrimitiveTabs.Root>;
}
export function Segments(props: Parameters<typeof SegmentedControl>[0]) { return <SegmentedControl {...props} className={"kit-segments " + (props.className ?? "")} />; }
export function State({ state, title, description, action }: { state: Exclude<LoadState, "ready">; title: string; description: string; action?: ReactNode }) {
  const Icon = state === "error" ? AlertCircle : Inbox;
  return <section className="kit-state" data-kit-state={state} role={state === "error" ? "alert" : "status"} aria-busy={state === "loading" || undefined}>
    {state === "loading" ? <div className="kit-skeleton" aria-hidden="true"><span /><span /><span /></div> : <Icon aria-hidden="true" />}
    <h2>{title}</h2><p>{description}</p>{action}
  </section>;
}
export function Toast({ children, onDismiss, tone = "success" }: { children: ReactNode; onDismiss: () => void; tone?: Tone }) {
  return <StatusArrival><div className="kit-toast" role="status" data-tone={tone}><Check aria-hidden="true" /><span>{children}</span><Button aria-label="Dismiss notification" variant="quiet" onClick={onDismiss}><X aria-hidden="true" /></Button></div></StatusArrival>;
}
export type TableColumn<T> = { key: string; label: string; cell: (row: T) => ReactNode; value?: (row: T) => string | number };
/**
 * `groups` splits the rows into named sections of one table instead of one table per section. A
 * table per group repeats its whole header, so a three-status list showed Issue/Status/Assignee/Due
 * three times down one screen. One header, one caption, and a colgroup heading row per section.
 */
export function Table<T extends { id: string }>({ rows, columns, deviceClass, label, renderCard, empty, recordIndex, onRecordIndexChange, groups }: { rows: T[]; columns: TableColumn<T>[]; deviceClass: DeviceClass; label: string; renderCard: (row: T) => ReactNode; empty: ReactNode; recordIndex?: number; onRecordIndexChange?: (index: number) => void; groups?: { name: string; rows: T[] }[] }) {
  const [sort, setSort] = useState<{ key: string; descending: boolean }>();
  const column = columns.find(c => c.key === sort?.key);
  const order = (items: T[]) => column?.value ? [...items].sort((a, b) => { const av = column.value!(a), bv = column.value!(b); return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "en")) * (sort?.descending ? -1 : 1); }) : items;
  const ordered = order(rows);
  if (resolveKitForm(deviceClass).collection === "deck") return <CollectionArrival><RecordDeck items={ordered} label={label} empty={empty} render={renderCard} index={recordIndex} onIndexChange={onRecordIndexChange} /></CollectionArrival>;
  if (!rows.length) return <>{empty}</>;
  const bodies = groups?.length ? groups : [{ name: "", rows: ordered }];
  return <CollectionArrival><table className="kit-table" data-collection-form="table" data-grouped={groups?.length ? "" : undefined}><caption>{label}</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? sort.descending ? "descending" : "ascending" : undefined}>{c.value ? <Button variant="quiet" onClick={() => setSort({ key: c.key, descending: sort?.key === c.key && !sort.descending })}>{c.label}<span aria-hidden="true">{sort?.key === c.key ? sort.descending ? "↓" : "↑" : "↕"}</span></Button> : c.label}</th>)}</tr></thead>{bodies.map(group => <tbody key={group.name}>{group.name && <tr className="kit-table-group"><th scope="colgroup" colSpan={columns.length}>{group.name}<span>{group.rows.length}</span></th></tr>}{order(group.rows).map(row => <tr key={row.id}>{columns.map(c => <td key={c.key}>{c.cell(row)}</td>)}</tr>)}</tbody>)}</table></CollectionArrival>;
}
