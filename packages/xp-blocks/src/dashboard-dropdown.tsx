"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AdaptiveOverlay, useDeviceClass, type OverlayPresentation } from "@xp/primitives";
import type {
  DashboardDropdownAction,
  DashboardDropdownChoice,
  DashboardDropdownMediaAsset,
  DashboardDropdownMenuFixture,
  DashboardDropdownPerson,
  DashboardDropdownPopoutFixture,
  ResolvedDashboardDropdownFixture,
} from "./dashboard-dropdown-model";

const isAction = (item: DashboardDropdownAction | DashboardDropdownChoice): item is DashboardDropdownAction => "kind" in item;

function Asset({ media, mediaKey, decorative = false }: { media: DashboardDropdownMediaAsset[]; mediaKey?: string; decorative?: boolean }) {
  const asset = media.find((candidate) => candidate.key === mediaKey);
  if (!asset) return null;
  return <img className="xp-dashboard-dropdown__asset" src={asset.src} alt={decorative ? "" : asset.alt} />;
}

function Glyph({ iconKey }: { iconKey?: string }) {
  const key = (iconKey ?? "action").toLocaleLowerCase();
  const family = key.match(/language|locale|globe/) ? "globe"
    : key.match(/wallet|billing|payment|card/) ? "wallet"
      : key.match(/settings|preferences|gear/) ? "settings"
        : key.match(/user|account|person|profile|member|assignee/) ? "person"
          : key.match(/logout|sign-out|signout|session/) ? "logout"
            : key.match(/theme|sun|appearance/) ? "sun"
              : key.match(/search|find/) ? "search"
                : key.match(/notification|bell|alert/) ? "bell"
                  : key.match(/workspace|project|folder/) ? "folder"
                    : key.match(/tag|label/) ? "tag"
                      : key.match(/column|layout/) ? "columns"
                        : key.match(/cart|basket|checkout/) ? "cart"
                          : key.match(/heart|favourite|favorite|save/) ? "heart"
                            : key.match(/share|invite|mail/) ? "share"
                              : key.match(/remove|delete|trash/) ? "trash"
                                : key.match(/copy|link/) ? "link"
                                  : key.match(/edit|write|document|type|font/) ? "edit"
                                    : key.match(/grid|app|launcher/) ? "grid"
                                      : key.match(/more|menu|dots/) ? "more"
                                        : "arrow";
  return (
    <svg className="xp-dashboard-dropdown__glyph" viewBox="0 0 24 24" aria-hidden="true" data-icon-key={iconKey ?? "action"}>
      {family === "globe" ? <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8S14.4 17.8 12 20M12 4c-2.4 2.2-3.6 4.9-3.6 8S9.6 17.8 12 20" /></>
        : family === "wallet" ? <><path d="M4 7.5h14a2 2 0 0 1 2 2v8H6a2 2 0 0 1-2-2zM4 8V6a2 2 0 0 1 2-2h10" /><path d="M15 12h5" /></>
          : family === "settings" ? <><circle cx="12" cy="12" r="2.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>
            : family === "person" ? <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>
              : family === "logout" ? <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></>
                : family === "sun" ? <><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>
                  : family === "search" ? <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>
                    : family === "bell" ? <><path d="M6 16h12l-1.5-2v-3a4.5 4.5 0 0 0-9 0v3z" /><path d="M10 19h4" /></>
                      : family === "folder" ? <path d="M3.5 6.5h6l2 2h9v10h-17z" />
                        : family === "tag" ? <><path d="m4 12 8-8h7v7l-8 8z" /><circle cx="15.5" cy="7.5" r="1" /></>
                          : family === "columns" ? <><rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M10 5v14M15 5v14" /></>
                            : family === "cart" ? <><path d="M3 5h2l2 10h10l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="16" cy="19" r="1" /></>
                              : family === "heart" ? <path d="M12 20S4 15.5 4 9.5C4 6 8.5 4.5 12 8c3.5-3.5 8-2 8 1.5C20 15.5 12 20 12 20z" />
                                : family === "share" ? <><circle cx="6" cy="12" r="2" /><circle cx="17" cy="6" r="2" /><circle cx="17" cy="18" r="2" /><path d="m8 11 7-4M8 13l7 4" /></>
                                  : family === "trash" ? <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" /><path d="M10 10v6M14 10v6" /></>
                                    : family === "link" ? <><path d="M10 14 8.5 15.5a3 3 0 1 1-4-4L7 9M14 10l1.5-1.5a3 3 0 1 1 4 4L17 15M8.5 12h7" /></>
                                      : family === "edit" ? <><path d="m5 16-1 4 4-1L19 8l-3-3zM14.5 6.5l3 3" /><path d="M5 5h6M5 9h4" /></>
                                        : family === "grid" ? <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>
                                          : family === "more" ? <><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>
                                            : <><path d="M5 12h13M14 8l4 4-4 4" /></>}
    </svg>
  );
}

function Trigger({ fixture, media }: { fixture: ResolvedDashboardDropdownFixture; media: DashboardDropdownMediaAsset[] }) {
  return (
    <span className="xp-dashboard-dropdown__trigger-content">
      {fixture.trigger.mediaKey ? <Asset media={media} mediaKey={fixture.trigger.mediaKey} decorative /> : <Glyph iconKey={fixture.trigger.iconKey} />}
      <span>{fixture.trigger.label}</span>
      {fixture.trigger.valueText ? <small>{fixture.trigger.valueText}</small> : null}
    </span>
  );
}

function PersonRow({ person, media, selected, onSelect, interactive = true }: { person: DashboardDropdownPerson; media: DashboardDropdownMediaAsset[]; selected: boolean; onSelect: () => void; interactive?: boolean }) {
  const content = <>
      <Asset media={media} mediaKey={person.avatarKey} />
      <span className="xp-dashboard-dropdown__row-copy"><strong>{person.displayName}</strong>{person.secondaryText ? <small>{person.secondaryText}</small> : null}</span>
      {person.status ? <span className="xp-dashboard-dropdown__status" data-tone={person.status.tone}>{person.status.label}</span> : null}
      <span className="xp-dashboard-dropdown__check" aria-hidden="true">{selected ? "✓" : ""}</span>
  </>;
  if (!interactive) return <div className="xp-dashboard-dropdown__person" data-static-person>{content}</div>;
  return <button className="xp-dashboard-dropdown__person" type="button" role="option" aria-selected={selected} onClick={onSelect} data-xp-control>{content}</button>;
}

function MenuRow({
  item,
  media,
  selected,
  selection,
  submenuParentId,
  onSelect,
  onSubmenu,
}: {
  item: DashboardDropdownAction | DashboardDropdownChoice;
  media: DashboardDropdownMediaAsset[];
  selected: boolean;
  selection: DashboardDropdownMenuFixture["selection"];
  submenuParentId?: string;
  onSelect: () => void;
  onSubmenu: () => void;
}) {
  const action = isAction(item);
  const role = selection === "single" ? "menuitemradio" : selection === "multiple" ? "option" : "menuitem";
  const properties = selection === "single" ? { "aria-checked": selected } : selection === "multiple" ? { "aria-selected": selected } : {};
  const supportingText = action ? item.description : item.secondaryText;
  const content = <><span className="xp-dashboard-dropdown__row-leading">{"mediaKey" in item && item.mediaKey ? <Asset media={media} mediaKey={item.mediaKey} /> : <Glyph iconKey={item.iconKey} />}</span><span className="xp-dashboard-dropdown__row-copy"><strong>{item.label}</strong>{supportingText ? <small>{supportingText}</small> : null}</span>{action && item.shortcut ? <kbd>{item.shortcut}</kbd> : null}{selected ? <span className="xp-dashboard-dropdown__check" aria-hidden="true">✓</span> : null}</>;
  const className = "xp-dashboard-dropdown__row";
  if (action && item.href) return <a className={className} href={item.href} role={role} {...properties} data-kind={item.kind} data-xp-control>{content}</a>;
  return <button className={className} type="button" role={role} {...properties} disabled={item.disabled} data-kind={action ? item.kind : "choice"} onClick={action && item.id === submenuParentId ? onSubmenu : onSelect} data-xp-control>{content}</button>;
}

function ReorderControls({ label, index, count, announcementLabels, onMove }: { label: string; index: number; count: number; announcementLabels: Record<string, string>; onMove: (offset: number) => void }) {
  const replaceLabel = (template: string | undefined) => (template ?? "").replace("{label}", label);
  return (
    <span className="xp-dashboard-dropdown__reorder" aria-label={replaceLabel(announcementLabels.reorder)}>
      <button type="button" aria-label={replaceLabel(announcementLabels.moveUp)} disabled={index === 0} onClick={() => onMove(-1)} data-xp-control>↑</button>
      <button type="button" aria-label={replaceLabel(announcementLabels.moveDown)} disabled={index === count - 1} onClick={() => onMove(1)} data-xp-control>↓</button>
    </span>
  );
}

function DashboardMenu({ model }: { model: ResolvedDashboardDropdownFixture & DashboardDropdownMenuFixture }) {
  const deviceClass = useDeviceClass();
  const [selectedIds, setSelectedIds] = useState(model.selectedIds ?? []);
  const [orderedIds, setOrderedIds] = useState(model.orderedIds ?? []);
  const [query, setQuery] = useState("");
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const presentation: Record<typeof deviceClass, OverlayPresentation> = {
    M: "action-sheet",
    TP: model.profile === "M1" ? "popover" : "bottom-sheet",
    TL: "popover",
    DS: "dropdown",
    DW: "dropdown",
  };
  const items = model.groups.flatMap((group) => group.items);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const orderedItems = orderedIds.length ? orderedIds.map((id) => itemById.get(id)).filter((item): item is DashboardDropdownAction | DashboardDropdownChoice => Boolean(item)) : items;
  const visibleItems = query ? orderedItems.filter((item) => item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : orderedItems;
  const select = (id: string) => {
    if (model.selection === "none") {
      setAnnouncement(model.announcements.activated ?? "");
      return;
    }
    setSelectedIds((current) => {
      const next = model.selection === "single" ? [id] : current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      setAnnouncement(model.announcements.selectionChanged ?? "");
      return next;
    });
  };
  const move = (id: string, offset: number) => setOrderedIds((current) => {
    const next = [...current];
    const index = next.indexOf(id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    setAnnouncement((model.announcements.moved ?? "").replace("{label}", itemById.get(id)?.label ?? id).replace("{position}", String(target + 1)));
    return next;
  });
  const peopleVisible = query ? (model.people ?? []).filter((person) => `${person.displayName} ${person.secondaryText ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : (model.people ?? []);
  const menuRole = model.selection === "multiple" ? "listbox" : "menu";
  const compact = deviceClass === "M" || deviceClass === "TP";
  const inlineSubmenu = submenuOpen && !compact;
  return (
    <AdaptiveOverlay intent="menu" presentation={{ [deviceClass]: presentation[deviceClass] }} why="Dropdown menus become touch sheets on compact coarse classes." modal={compact}>
      <AdaptiveOverlay.Trigger aria-label={model.trigger.label}><Trigger fixture={model} media={model.resolvedMedia} /></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-dashboard-dropdown__surface xp-dashboard-dropdown__surface--menu" data-source-key={model.sourceKey} data-profile={model.profile} data-preset={model.preset} data-submenu-open={inlineSubmenu || undefined}>
        <AdaptiveOverlay.Header title={submenuOpen && compact ? model.submenu?.label ?? model.title ?? model.trigger.label : model.title ?? model.trigger.label} description={submenuOpen && compact ? undefined : model.description} closeLabel={model.closeLabel} />
        <AdaptiveOverlay.Body>
          <div className="xp-dashboard-dropdown__menu-primary">
            {model.identity ? <div className="xp-dashboard-dropdown__identity"><Asset media={model.resolvedMedia} mediaKey={model.identity.avatarKey} /><span><strong>{model.identity.displayName}</strong>{model.identity.secondaryText ? <small>{model.identity.secondaryText}</small> : null}</span></div> : null}
            {model.summary ? <div className="xp-dashboard-dropdown__summary"><strong>{model.summary.label}</strong>{model.summary.value ? <output>{model.summary.value}</output> : null}{model.summary.description ? <small>{model.summary.description}</small> : null}</div> : null}
            {submenuOpen && compact ? <button className="xp-dashboard-dropdown__back" type="button" onClick={() => setSubmenuOpen(false)} data-xp-control>← {model.title ?? model.trigger.label}</button> : null}
            {!submenuOpen && model.query ? <label className="xp-dashboard-dropdown__query"><span>{model.query.label}</span><input value={query} placeholder={model.query.placeholder} onChange={(event) => setQuery(event.target.value)} data-xp-control /></label> : null}
            <div className="xp-dashboard-dropdown__menu" role={menuRole} aria-multiselectable={model.selection === "multiple" || undefined} aria-label={model.title ?? model.trigger.label}>
              {submenuOpen && compact ? model.submenu?.items.map((item) => <MenuRow key={item.id} item={item} media={model.resolvedMedia} selected={false} selection="none" onSelect={() => select(item.id)} onSubmenu={() => undefined} />) : model.groups.map((group) => {
                const groupItems = orderedIds.length ? visibleItems.filter((item) => group.items.some((candidate) => candidate.id === item.id)) : group.items.filter((item) => visibleItems.some((candidate) => candidate.id === item.id));
                return <section className="xp-dashboard-dropdown__group" data-separated={group.separated || undefined} aria-label={group.label} key={group.id}>{group.label ? <p>{group.label}</p> : null}{groupItems.map((item) => {
                  const index = orderedIds.indexOf(item.id);
                  return <div className="xp-dashboard-dropdown__ordered-row" key={item.id}><MenuRow item={item} media={model.resolvedMedia} selected={selectedIds.includes(item.id)} selection={model.selection} submenuParentId={model.submenu?.parentId} onSelect={() => select(item.id)} onSubmenu={() => setSubmenuOpen(true)} />{index >= 0 ? <ReorderControls label={item.label} index={index} count={orderedIds.length} announcementLabels={model.announcements} onMove={(offset) => move(item.id, offset)} /> : null}</div>;
                })}</section>;
              })}
              {!submenuOpen && peopleVisible.map((person) => <PersonRow key={person.id} person={person} media={model.resolvedMedia} selected={selectedIds.includes(person.id)} onSelect={() => select(person.id)} />)}
              {!submenuOpen && model.query && visibleItems.length + peopleVisible.length === 0 ? <p className="xp-dashboard-dropdown__empty">{model.query.emptyLabel}</p> : null}
            </div>
            {!submenuOpen && model.actions?.length ? <div className="xp-dashboard-dropdown__actions">{model.actions.map((item) => <MenuRow key={item.id} item={item} media={model.resolvedMedia} selected={false} selection="none" onSelect={() => select(item.id)} onSubmenu={() => undefined} />)}</div> : null}
            {model.states.error ? <p className="xp-dashboard-dropdown__error" role="alert">{model.states.error}</p> : null}
            {model.states.disabledReason ? <p className="xp-dashboard-dropdown__permission">{model.states.disabledReason}</p> : null}
          </div>
          {inlineSubmenu ? <aside className="xp-dashboard-dropdown__submenu" role="menu" aria-label={model.submenu?.label}>{model.submenu?.items.map((item) => <MenuRow key={item.id} item={item} media={model.resolvedMedia} selected={false} selection="none" onSelect={() => select(item.id)} onSubmenu={() => undefined} />)}</aside> : null}
          <p className="xp-visually-hidden" aria-live="polite">{announcement}</p>
        </AdaptiveOverlay.Body>
        {compact ? <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>{model.closeLabel}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer> : null}
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function ActionButton({ action, onAction }: { action: DashboardDropdownAction; onAction?: (action: DashboardDropdownAction) => void }) {
  const content = <><Glyph iconKey={action.iconKey} /><span>{action.label}</span></>;
  if (action.href) return <a className="xp-dashboard-dropdown__action" href={action.href} data-kind={action.kind} data-xp-control>{content}</a>;
  return <button className="xp-dashboard-dropdown__action" type="button" disabled={action.disabled} data-kind={action.kind} onClick={() => onAction?.(action)} data-xp-control>{content}</button>;
}

function LineChart({ series, summary }: { series: Array<{ id: string; label: string; value: number }>; summary: string }) {
  const max = Math.max(...series.map((point) => point.value), 1);
  const points = series.map((point, index) => `${(index / Math.max(series.length - 1, 1)) * 100},${40 - (point.value / max) * 34}`).join(" ");
  return <figure className="xp-dashboard-dropdown__chart"><svg viewBox="0 0 100 44" role="img" aria-label={summary}><polyline points={points} /><g>{series.map((point, index) => {
    const x = (index / Math.max(series.length - 1, 1)) * 100;
    const y = 40 - (point.value / max) * 34;
    return <g className="xp-dashboard-dropdown__chart-point" key={point.id} role="button" tabIndex={0} aria-label={`${point.label}: ${point.value}`}><rect x={Math.min(85, Math.max(0, x - 7.5))} y={Math.min(29, Math.max(0, y - 7.5))} width="15" height="15" /><circle cx={x} cy={y} r="2" /></g>;
  })}</g></svg><figcaption>{summary}</figcaption></figure>;
}

function ProductRows({ fixture, cart, onAction }: { fixture: DashboardDropdownPopoutFixture & { resolvedMedia: DashboardDropdownMediaAsset[] }; cart: boolean; onAction: (label: string) => void }) {
  const extension = fixture.extension;
  const lines = extension.kind === "products" ? extension.products : extension.kind === "cart" ? extension.lines : [];
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const visibleLines = lines.filter((line) => !removedIds.includes(line.id));
  if (!visibleLines.length) return <p className="xp-dashboard-dropdown__empty">{extension.kind === "products" ? extension.emptyLabel : fixture.announcements.empty}</p>;
  return <ul className="xp-dashboard-dropdown__products">{visibleLines.map((line) => <li key={line.id}>{line.merchantLabel ? <header>{line.merchantMarkKey ? <Asset media={fixture.resolvedMedia} mediaKey={line.merchantMarkKey} /> : null}<strong>{line.merchantLabel}</strong>{line.statusLabels?.map((status) => <span key={status}>{status}</span>)}</header> : null}<div><Asset media={fixture.resolvedMedia} mediaKey={line.productThumbKey} /><span className="xp-dashboard-dropdown__row-copy"><strong>{line.title}</strong>{line.secondaryText ? <small>{line.secondaryText}</small> : null}{line.ratingLabel ? <small>{line.ratingLabel}</small> : null}<span><b>{line.price}</b>{line.comparisonPrice ? <s>{line.comparisonPrice}</s> : null}</span></span></div>{cart && line.quantity ? <label><span>{line.quantity.label}</span><select defaultValue={line.quantity.value} onChange={(event) => onAction(`${line.quantity!.label} ${event.target.value}`)} data-xp-control>{Array.from({ length: line.quantity.max - line.quantity.min + 1 }, (_, index) => line.quantity!.min + index).map((value) => <option value={value} key={value}>{value}</option>)}</select></label> : null}{line.actions?.length ? <div className="xp-dashboard-dropdown__line-actions">{line.actions.map((action) => <ActionButton action={action} onAction={() => { onAction(fixture.announcements.remove ?? action.label); if (action.kind === "destructive" || action.id.includes("remove")) setRemovedIds((current) => [...current, line.id]); }} key={action.id} />)}</div> : null}</li>)}</ul>;
}

function PopoutBody({ fixture, onDirty, onAction }: { fixture: DashboardDropdownPopoutFixture & { resolvedMedia: DashboardDropdownMediaAsset[] }; onDirty: () => void; onAction: (label: string) => void }) {
  const extension = fixture.extension;
  if (extension.kind === "launcher") return <nav className="xp-dashboard-dropdown__launcher" aria-label={fixture.title}>{extension.destinations.map((item) => {
    const content = <><Asset media={fixture.resolvedMedia} mediaKey={item.mediaKey} /><strong>{item.label}</strong></>;
    if (item.href) return <a href={item.href} key={item.id} data-xp-control>{content}</a>;
    return <button type="button" key={item.id} onClick={() => onAction(item.action?.label ?? item.label)} disabled={item.action?.disabled} data-xp-control>{content}</button>;
  })}</nav>;
  if (extension.kind === "insight") return <div className="xp-dashboard-dropdown__insight"><PersonRow person={extension.person} media={fixture.resolvedMedia} selected={false} onSelect={() => undefined} interactive={false} /><p>{extension.periodLabel}</p><LineChart series={extension.series} summary={extension.summary} /><div>{extension.actions.map((action) => <ActionButton action={action} onAction={() => onAction(action.label)} key={action.id} />)}</div></div>;
  if (extension.kind === "editor-tools") return <div className="xp-dashboard-dropdown__editor"><fieldset><legend>{extension.typeLabel}</legend>{extension.typeChoices.map((choice) => <label key={choice.id}><input type="radio" name="type-choice" onChange={onDirty} data-xp-control /><Glyph iconKey={choice.iconKey} /><span className="xp-dashboard-dropdown__type-copy"><strong>{choice.label}</strong>{choice.secondaryText ? <small>{choice.secondaryText}</small> : null}</span></label>)}</fieldset>{extension.toggles.map((toggle) => <label className="xp-dashboard-dropdown__toggle" key={toggle.id}><input type="checkbox" role="switch" defaultChecked={toggle.checked} onChange={onDirty} data-xp-control /><span><strong>{toggle.label}</strong>{toggle.description ? <small>{toggle.description}</small> : null}</span>{toggle.badge ? <em>{toggle.badge}</em> : null}</label>)}{extension.groups.map((group) => <section key={group.id}>{group.label ? <h3>{group.label}</h3> : null}{group.items.map((item) => isAction(item) ? <ActionButton action={item} onAction={() => onAction(item.label)} key={item.id} /> : null)}</section>)}</div>;
  if (extension.kind === "notifications") return <NotificationCentre fixture={fixture} />;
  if (extension.kind === "products") return <ProductRows fixture={fixture} cart={false} onAction={onAction} />;
  if (extension.kind === "cart") return <ProductRows fixture={fixture} cart onAction={onAction} />;
  if (extension.kind === "invite") return <div className="xp-dashboard-dropdown__invite">{extension.invitees.map((invitee) => <div key={invitee.id}><label><span>{extension.emailLabel}</span><input type="email" defaultValue={invitee.email} aria-invalid={Boolean(invitee.error)} aria-describedby={invitee.error ? `${invitee.id}-error` : undefined} onChange={onDirty} data-xp-control /></label><label><span>{extension.roleLabel}</span><select defaultValue={invitee.roleId} onChange={onDirty} data-xp-control>{extension.roleOptions.map((role) => <option value={role.id} key={role.id}>{role.label}</option>)}</select></label>{invitee.actions?.map((action) => <ActionButton action={action} onAction={onDirty} key={action.id} />)}{invitee.error ? <p id={`${invitee.id}-error`} role="alert">{invitee.error}</p> : null}</div>)}</div>;
  return <div className="xp-dashboard-dropdown__sharing"><label><span>{extension.queryLabel}</span><div><input type="email" placeholder={extension.queryPlaceholder} onChange={onDirty} data-xp-control /></div></label><ul>{extension.members.map((person) => <li key={person.id}><PersonRow person={person} media={fixture.resolvedMedia} selected={false} onSelect={() => undefined} interactive={false} />{person.roleOptions ? <select onChange={onDirty} aria-label={`${fixture.announcements.roleLabel ?? ""} ${person.displayName}`.trim()} data-xp-control>{person.roleOptions.map((role) => <option value={role.id} key={role.id}>{role.label}</option>)}</select> : null}</li>)}</ul><p>{extension.overflowPeople.map((person) => person.displayName).join(", ")}</p><output>{extension.copyValue}</output></div>;
}

function NotificationCentre({ fixture }: { fixture: DashboardDropdownPopoutFixture & { resolvedMedia: DashboardDropdownMediaAsset[] } }) {
  const extension = fixture.extension;
  if (extension.kind !== "notifications") return null;
  const [activeId, setActiveId] = useState(extension.activeTabId);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const active = extension.tabs.find((tab) => tab.id === activeId) ?? extension.tabs[0];
  const visibleRows = active.rows.filter((row) => !dismissed.includes(row.id));
  const unreadCount = visibleRows.filter((row) => row.unread).length;
  return <div className="xp-dashboard-dropdown__notifications"><p className="xp-dashboard-dropdown__unread" aria-live="polite">{fixture.announcements.unreadCount?.replace("{count}", String(unreadCount))}</p><div role="tablist" aria-label={fixture.title}>{extension.tabs.map((tab) => <button id={`${tab.id}-tab`} role="tab" aria-selected={tab.id === activeId} aria-controls={`${tab.id}-panel`} type="button" onClick={() => setActiveId(tab.id)} key={tab.id} data-xp-control>{tab.label}</button>)}<ActionButton action={extension.settingsAction} /></div>{visibleRows.length ? <ol id={`${active.id}-panel`} role="tabpanel" aria-labelledby={`${active.id}-tab`}>{visibleRows.map((row) => <li data-unread={row.unread || undefined} key={row.id}><PersonRow person={row.person} media={fixture.resolvedMedia} selected={false} onSelect={() => undefined} interactive={false} /><p>{row.message}</p><small>{row.timeLabel} · {row.categoryLabel}</small>{row.actions?.map((action) => <ActionButton action={action} key={action.id} />)}{row.resourceLabel ? <button type="button" data-xp-control>{row.resourceLabel}</button> : null}<button className="xp-dashboard-dropdown__notification-dismiss" type="button" aria-label={`${row.message}. ${fixture.announcements.dismiss}`} onClick={() => setDismissed((current) => [...current, row.id])} data-xp-control>×</button></li>)}</ol> : <section className="xp-dashboard-dropdown__empty-state" id={`${active.id}-panel`} role="tabpanel" aria-labelledby={`${active.id}-tab`}><h3>{fixture.announcements.emptyTitle}</h3><p>{fixture.announcements.emptyDescription}</p><button type="button" data-xp-control>{fixture.announcements.emptyActionLabel}</button></section>}</div>;
}

function popoutPresentation(profile: DashboardDropdownPopoutFixture["profile"], deviceClass: ReturnType<typeof useDeviceClass>): OverlayPresentation {
  if (deviceClass === "M") return ["P1", "P3", "P4"].includes(profile) ? "full-screen" : "bottom-sheet";
  if (deviceClass === "TP") return "bottom-sheet";
  if (deviceClass === "TL") return "side-drawer";
  if (deviceClass === "DS") return profile === "P5" ? "side-drawer" : "popover";
  return ["P4", "P5"].includes(profile) ? "inspector-pane" : "popover";
}

function DashboardPopout({ model }: { model: ResolvedDashboardDropdownFixture & DashboardDropdownPopoutFixture }) {
  const deviceClass = useDeviceClass();
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dismissPending, setDismissPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const presentation = popoutPresentation(model.profile, deviceClass);
  const modal = ["M", "TP", "TL"].includes(deviceClass) || presentation !== "popover";
  const footerActions = model.footerActions ?? [];
  const discard = () => { setDirty(false); setDismissPending(false); setOpen(false); };
  return (
    <AdaptiveOverlay intent="detail" presentation={{ [deviceClass]: presentation }} why="Content Popouts preserve their own IA and use class-native surfaces." modal={modal} open={open} onOpenChange={setOpen} dirty={dirty} onDismissRequest={() => setDismissPending(true)}>
      <AdaptiveOverlay.Trigger aria-label={model.trigger.label}><Trigger fixture={model} media={model.resolvedMedia} /></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-dashboard-dropdown__surface xp-dashboard-dropdown__surface--popout" data-source-key={model.sourceKey} data-profile={model.profile} data-preset={model.preset}>
        <AdaptiveOverlay.Header title={model.title} description={model.description} closeLabel={model.closeLabel} />
        <AdaptiveOverlay.Body><PopoutBody fixture={model} onDirty={() => setDirty(true)} onAction={(label) => setAnnouncement(label)} />{model.states.error ? <p role="alert">{model.states.error}</p> : null}{announcement ? <p className="xp-dashboard-dropdown__feedback" role="status">{announcement}</p> : null}<p className="xp-visually-hidden" aria-live="polite">{announcement}</p></AdaptiveOverlay.Body>
        {footerActions.length ? <AdaptiveOverlay.Footer>{footerActions.map((action) => <ActionButton action={action} onAction={() => { const message = model.preset === "access-sharing" && action.id.includes("link") ? model.announcements.copied : model.preset === "member-invite" && action.id.includes("commit") ? model.announcements.inviteSent : action.label; setAnnouncement(message ?? action.label); if (action.kind === "destructive") setDirty(false); }} key={action.id} />)}</AdaptiveOverlay.Footer> : null}
        {dismissPending ? <section className="xp-dashboard-dropdown__discard" role="alertdialog" aria-label={model.announcements.discardTitle}><div className="xp-dashboard-dropdown__discard-panel"><strong>{model.announcements.discardTitle}</strong><p>{model.announcements.discardDescription}</p><button type="button" onClick={() => setDismissPending(false)} data-xp-control>{model.announcements.keepEditing}</button><button type="button" onClick={discard} data-xp-control>{model.announcements.discard}</button></div></section> : null}
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

export function DashboardDropdown({ model }: { model: ResolvedDashboardDropdownFixture }) {
  const renderer = useMemo(() => model.surface, [model.surface]);
  return (
    <section className="xp-dashboard-dropdown" data-xp-dashboard-dropdown-renderer data-source-key={model.sourceKey} data-surface={model.surface} data-preset={model.preset}>
      {renderer === "menu" ? <DashboardMenu model={model as ResolvedDashboardDropdownFixture & DashboardDropdownMenuFixture} /> : <DashboardPopout model={model as ResolvedDashboardDropdownFixture & DashboardDropdownPopoutFixture} />}
    </section>
  );
}
