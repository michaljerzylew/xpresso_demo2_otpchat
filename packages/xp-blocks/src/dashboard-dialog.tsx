"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChoiceSet, Field, ModalSurface, Popout } from "@xp/primitives";
import type {
  DashboardActivityFixture,
  DashboardDialogAction,
  DashboardDialogExtension,
  DashboardDialogField,
  DashboardDialogPerson,
  ResolvedDashboardDialogFixture,
} from "./dashboard-dialog-model";

type DashboardDialogProperties = {
  model: ResolvedDashboardDialogFixture;
  onAction?: (actionId: string, model: ResolvedDashboardDialogFixture) => void;
};

const inputMode = (type: DashboardDialogField["type"]): NonNullable<React.InputHTMLAttributes<HTMLInputElement>["inputMode"]> => {
  if (type === "email") return "email";
  if (type === "tel") return "tel";
  if (type === "url") return "url";
  if (type === "number" || type === "money") return "decimal";
  return "text";
};

const inputType = (type: DashboardDialogField["type"]): React.HTMLInputTypeAttribute => {
  if (["email", "tel", "url", "password", "number", "date", "time"].includes(type)) return type as React.HTMLInputTypeAttribute;
  return "text";
};

function FieldControl({ field, onDirty }: { field: DashboardDialogField; onDirty: () => void }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  if (field.type === "textarea") {
    return (
      <label className="xp-dashboard-dialog__textarea-field" data-field-id={field.id}>
        <span>{field.label}</span>
        <textarea defaultValue={field.value} required={field.required} readOnly={field.readOnly} onChange={onDirty} data-xp-control />
        {field.hint ? <small>{field.hint}</small> : null}
      </label>
    );
  }
  return (
    <Field id={field.id} hasHelp={Boolean(field.hint)} data-field-id={field.id}>
      <Field.Label>{field.label}</Field.Label>
      {field.type === "select" ? (
        <Field.Select autoComplete="off" required={field.required} disabled={field.readOnly} defaultValue={field.value} onChange={onDirty}>
          {field.options?.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
        </Field.Select>
      ) : field.type === "password" ? (
        <span className="xp-dashboard-dialog__password">
          <Field.Input
            type={passwordVisible ? "text" : "password"}
            inputMode="text"
            enterKeyHint="done"
            autoComplete="current-password"
            defaultValue={field.value}
            required={field.required}
            readOnly={field.readOnly}
            onChange={onDirty}
          />
          <button type="button" aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} data-xp-control>
            <span aria-hidden="true">{passwordVisible ? "◉" : "◎"}</span>
            <span className="xp-visually-hidden">{passwordVisible ? "Hide password" : "Show password"}</span>
          </button>
        </span>
      ) : (
        <Field.Input
          type={inputType(field.type)}
          inputMode={inputMode(field.type)}
          enterKeyHint="next"
          autoComplete={field.type === "email" ? "email" : "off"}
          defaultValue={field.value}
          required={field.required}
          readOnly={field.readOnly}
          onChange={onDirty}
        />
      )}
      {field.hint ? <Field.Help>{field.hint}</Field.Help> : null}
    </Field>
  );
}

function PeopleList({ people, media, onDirty }: { people: DashboardDialogPerson[]; media: ResolvedDashboardDialogFixture["resolvedMedia"]; onDirty: () => void }) {
  return (
    <ul className="xp-dashboard-dialog__people" data-dialog-people>
      {people.map((person) => (
        <li key={person.id} data-person-id={person.id}>
          <span className="xp-dashboard-dialog__avatar" data-avatar-key={person.avatarKey}>
            {media.find((asset) => asset.key === person.avatarKey)
              ? <img src={media.find((asset) => asset.key === person.avatarKey)?.src} alt="" />
              : <span aria-hidden="true">{person.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>}
          </span>
          <span><strong>{person.displayName}</strong><small>{person.secondaryText}</small></span>
          {person.status ? <em data-tone={person.status.tone}>{person.status.label}</em> : null}
          {person.roleOptions?.length ? (
            <select aria-label={`${person.displayName}: ${person.secondaryText}`} onChange={onDirty} data-xp-control>
              {person.roleOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
            </select>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SearchContent({ extension, media }: { extension: Extract<DashboardDialogExtension, { kind: "search" }>; media: ResolvedDashboardDialogFixture["resolvedMedia"] }) {
  const [query, setQuery] = useState("");
  const groups = extension.groups.map((group) => ({
    ...group,
    results: group.results.filter((result) => `${result.label} ${result.detail ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  }));
  const results = groups.flatMap((group) => group.results);
  const [activeId, setActiveId] = useState(extension.groups[0]?.results[0]?.id ?? "");
  const move = (delta: number) => {
    const current = Math.max(0, results.findIndex((result) => result.id === activeId));
    setActiveId(results[Math.min(results.length - 1, Math.max(0, current + delta))]?.id ?? "");
  };
  return (
    <section className="xp-dashboard-dialog__search" data-extension="search">
      <label>
        <span>{extension.queryLabel}</span>
        <input
          type="search"
          placeholder={extension.queryPlaceholder}
          value={query}
          role="combobox"
          aria-expanded="true"
          aria-controls="dashboard-dialog-results"
          aria-activedescendant={activeId || undefined}
          autoFocus
          onChange={(event) => { setQuery(event.currentTarget.value); setActiveId(""); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
            if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
          }}
          data-xp-control
        />
      </label>
      <div id="dashboard-dialog-results" role="listbox">
        {results.length ? groups.map((group) => group.results.length ? (
          <section key={group.id} data-result-group={group.id}>
            <h3>{group.label}</h3>
            <ul>{group.results.map((result) => {
              const mark = result.markKey ? media.find((asset) => asset.key === result.markKey) : undefined;
              const portraits = result.mediaKeys?.map((key) => media.find((asset) => asset.key === key)).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset)) ?? [];
              return <li key={result.id}><button id={result.id} role="option" aria-selected={result.id === activeId} type="button" onPointerEnter={() => setActiveId(result.id)} data-xp-control>{mark ? <img className="xp-dashboard-dialog__result-mark" src={mark.src} alt={mark.alt} /> : null}<span className="xp-dashboard-dialog__result-copy"><strong>{result.label}</strong>{result.detail ? <span>{result.detail}</span> : null}</span>{portraits.length ? <span className="xp-dashboard-dialog__result-portraits" aria-hidden="true">{portraits.map((asset) => <img src={asset.src} alt="" key={asset.key} />)}</span> : null}{result.status ? <em>{result.status}</em> : null}{result.moreActionLabel ? <span className="xp-dashboard-dialog__result-more" aria-label={result.moreActionLabel}>•••</span> : null}</button></li>;
            })}</ul>
          </section>
        ) : null) : <p>{extension.emptyLabel}</p>}
      </div>
      {extension.keyboardLegend?.length ? <div className="xp-dashboard-dialog__key-legend">{extension.keyboardLegend.map((item) => <kbd key={item}>{item}</kbd>)}</div> : null}
    </section>
  );
}

function ExtensionContent({ extension, activeStageId, selectedChoiceId, media, onStageChange, onDirty }: {
  extension?: DashboardDialogExtension;
  activeStageId?: string;
  selectedChoiceId?: string;
  media: ResolvedDashboardDialogFixture["resolvedMedia"];
  onStageChange: (id: string) => void;
  onDirty: () => void;
}) {
  if (!extension || extension.kind === "none") return null;
  if (extension.kind === "calculation") {
    return (
      <section className="xp-dashboard-dialog__calculation" data-extension="calculation">
        <output className="xp-dashboard-dialog__quantity" aria-label={`Current quantity ${extension.quantity.value}`}>{extension.quantity.value}</output>
        <input type="range" min={extension.quantity.min} max={extension.quantity.max} defaultValue={extension.quantity.value} onChange={onDirty} data-xp-control />
        <dl>{extension.summaryRows.map((row) => <div data-summary-kind={row.label.toLowerCase() === "savings" ? "savings" : undefined} key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
        {extension.toggleLabel ? <label><input type="checkbox" onChange={onDirty} /> <span>{extension.toggleLabel}</span></label> : null}
      </section>
    );
  }
  if (extension.kind === "configuration") {
    return (
      <section className="xp-dashboard-dialog__configuration" data-extension="configuration">
        <aside>
          <span className="xp-dashboard-dialog__configuration-mark" aria-hidden="true">⌁</span>
          <h3>{extension.summary.title}</h3>
          <p>{extension.summary.description}</p>
          <hr />
          <strong>Info</strong>
          <p>{extension.summary.info}</p>
        </aside>
        <ol>
          {extension.steps.map((step, index) => (
            <li key={step.id}>
              <label htmlFor={`${step.id}-choice`}><span>{index + 1}</span><strong>{step.label}</strong></label>
              <p>{step.description}</p>
              <select id={`${step.id}-choice`} defaultValue={step.selectedChoiceId} onChange={onDirty} data-xp-control>
                {step.choices?.map((choice) => <option value={choice.id} key={choice.id}>{choice.label}</option>)}
              </select>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  if (extension.kind === "wizard") {
    const steps = extension.stages;
    const activeId = activeStageId ?? extension.currentStageId;
    return (
      <section className="xp-dashboard-dialog__wizard" data-extension={extension.kind}>
        <ol>{steps.map((step) => <li data-current={step.id === activeId || undefined} key={step.id}><button type="button" onClick={() => onStageChange(step.id)} data-xp-control>{step.label}</button></li>)}</ol>
        {steps.filter((step) => step.id === activeId).map((step) => <div key={step.id}>{step.description ? <p>{step.description}</p> : null}{step.fields?.map((field) => <FieldControl field={field} onDirty={onDirty} key={field.id} />)}{step.choices?.length ? <ChoiceSet label={step.label} defaultValue={step.selectedChoiceId} items={step.choices.map((choice) => ({ value: choice.id, label: choice.label, description: choice.description }))} onChange={onDirty} /> : null}</div>)}
        {extension.branches?.filter((branch) => branch.choiceId === selectedChoiceId).map((branch) => <section className="xp-dashboard-dialog__branch" data-branch={branch.choiceId} key={branch.choiceId}>{branch.instructions?.map((instruction) => <p key={instruction}>{instruction}</p>)}{branch.qrPayload ? <code>{branch.qrPayload}</code> : null}{branch.manualKey ? <output>{branch.manualKey}</output> : null}{branch.recoveryHint ? <small>{branch.recoveryHint}</small> : null}{branch.fields?.map((field) => <FieldControl field={field} onDirty={onDirty} key={field.id} />)}</section>)}
      </section>
    );
  }
  if (extension.kind === "upload") {
    return <ul className="xp-dashboard-dialog__uploads" data-extension="upload">{extension.rows.map((row) => <li data-status={row.status} key={row.id}><span className="xp-dashboard-dialog__upload-copy"><strong>{row.filename}</strong><span className="xp-dashboard-dialog__upload-status">{row.status}</span>{row.error ? <span role="alert">{row.error}</span> : null}</span>{row.progress !== undefined ? <progress max={100} value={row.progress} /> : null}<span className="xp-dashboard-dialog__upload-actions">{row.retryLabel ? <button type="button" data-xp-control>{row.retryLabel}</button> : null}{row.removeLabel ? <button type="button" data-xp-control>{row.removeLabel}</button> : null}</span></li>)}</ul>;
  }
  if (extension.kind === "search") {
    return <SearchContent extension={extension} media={media} />;
  }
  if (extension.kind === "sharing") return <section className="xp-dashboard-dialog__sharing" data-extension="sharing">{extension.publicState ? <p>{extension.publicState}</p> : null}{extension.copyValue ? <output>{extension.copyValue}</output> : null}</section>;
  if (extension.kind === "schedule") return <section className="xp-dashboard-dialog__schedule" data-extension="schedule"><fieldset className="xp-dashboard-dialog__weekdays"><legend>{extension.weekdays.map((day) => day.label).join(", ")}</legend>{extension.weekdays.map((day) => <label key={day.id}><input type="checkbox" onChange={onDirty} /><span aria-label={day.label}>{day.shortLabel}</span></label>)}</fieldset><ChoiceSet label={extension.recurrence.label} defaultValue={extension.recurrence.selectedChoiceId} items={extension.recurrence.choices.map((choice) => ({ value: choice.id, label: choice.label }))} onChange={onDirty} /><label className="xp-dashboard-dialog__range"><span>{extension.memberCount.label}</span><output>{extension.memberCount.value}</output><input type="range" min={extension.memberCount.min} max={extension.memberCount.max} defaultValue={extension.memberCount.value} onChange={onDirty} data-xp-control /></label><ChoiceSet label={extension.platform.label} defaultValue={extension.platform.selectedChoiceId} items={extension.platform.choices.map((choice) => ({ value: choice.id, label: choice.label }))} onChange={onDirty} /></section>;
  if (extension.kind === "referral") return (
    <section className="xp-dashboard-dialog__referral" data-extension="referral">
      <ol>{extension.steps.map((step) => <li key={step.id}><strong>{step.label}</strong>{step.description ? <span>{step.description}</span> : null}</li>)}</ol>
      <output>{extension.copyValue}</output>
      <div className="xp-dashboard-dialog__share-actions" aria-label="Sharing destinations">
        {extension.shareActions.map((action) => <button type="button" data-xp-control key={action.id}>{action.label}</button>)}
      </div>
    </section>
  );
  if (extension.kind === "preview") return <section className="xp-dashboard-dialog__preview" data-extension="preview"><h3>{extension.label}</h3><dl>{extension.values.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>;
  return null;
}

function ActivityFeed({ fixture, media }: { fixture: DashboardActivityFixture; media: ResolvedDashboardDialogFixture["resolvedMedia"] }) {
  return (
    <ol className="xp-dashboard-dialog__activity" data-dialog-activity-feed>
      {fixture.extension.activities.map((activity) => (
        <li data-activity-kind={activity.kind} key={activity.id}>
          {activity.avatarKey ? <span className="xp-dashboard-dialog__avatar">{media.find((asset) => asset.key === activity.avatarKey) ? <img src={media.find((asset) => asset.key === activity.avatarKey)?.src} alt="" /> : null}</span> : null}
          <time>{activity.time}</time>
          <p><strong>{activity.actor}</strong> {activity.body}</p>
          {activity.kind === "reply" && fixture.extension.replyLabel ? (
            <label className="xp-dashboard-dialog__activity-reply">
              <strong>{activity.resourceLabel}</strong>
              <span className="xp-visually-hidden">{fixture.extension.replyLabel}</span>
              <input type="text" placeholder={fixture.extension.replyLabel} data-xp-control />
            </label>
          ) : activity.resourceLabel ? (
            <button className="xp-dashboard-dialog__activity-resource" type="button" data-resource-kind={activity.kind} data-xp-control>{activity.resourceLabel}</button>
          ) : null}
          {activity.tags?.length ? <ul>{activity.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
        </li>
      ))}
    </ol>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  return <span className="xp-dashboard-dialog__trigger-label">{children}</span>;
}

function ChoiceMark({ iconKey }: { iconKey: string }) {
  if (iconKey === "message-code") return <svg className="xp-dashboard-dialog__choice-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 3v-13Z"/><path d="M8 9h8M8 12h5"/></svg>;
  if (iconKey === "security-code") return <svg className="xp-dashboard-dialog__choice-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.4-2.8 7.8-7 10-4.2-2.2-7-5.6-7-10V6l7-3Z"/><path d="m9.5 12 1.6 1.6 3.7-4"/></svg>;
  return <span className="xp-dashboard-dialog__choice-mark" data-icon-key={iconKey} aria-hidden="true" />;
}

export function DashboardDialog({ model, onAction }: DashboardDialogProperties) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const forceClose = useRef<(() => void) | null>(null);
  const initialStageId = model.surface === "popout" || model.extension?.kind !== "wizard" ? "" : model.extension.currentStageId;
  const [activeStageId, setActiveStageId] = useState(initialStageId);
  const [selectedChoiceId, setSelectedChoiceId] = useState(model.surface === "popout" ? "" : model.selectedChoiceId ?? "");
  const markDirty = () => setDirty(true);

  if (model.surface === "popout") {
    return (
      <section className="xp-dashboard-dialog xp-dashboard-dialog--popout" data-xp-dashboard-dialog-renderer data-source-key={model.sourceKey} data-profile="P7">
        <Popout
          trigger={<Trigger>{model.triggerLabel}</Trigger>}
          title={model.title}
          description={model.description}
          closeLabel={model.closeLabel}
          open={open}
          onOpenChange={setOpen}
          contentClassName="xp-dashboard-dialog__surface"
          contentData={{ "data-source-key": model.sourceKey, "data-profile": "P7" }}
        >
          <ActivityFeed fixture={model} media={model.resolvedMedia} />
        </Popout>
      </section>
    );
  }

  const stageActions = model.preset === "auth-method-setup"
    ? model.actions.filter((action) => activeStageId === "s1" ? ["act-cancel", "act-continue"].includes(action.id) : ["act-back", "act-cancel", "act-verify"].includes(action.id))
    : model.preset === "application-wizard"
      ? model.actions.filter((action) => activeStageId === "st4" ? ["act-prev", "act-success"].includes(action.id) : ["act-prev", "act-next"].includes(action.id))
      : model.actions;
  const keepsHeaderCloseWithCancel = model.preset === "destructive-confirm" || model.preset === "security-factor-disable";
  const closeAction = keepsHeaderCloseWithCancel ? undefined : stageActions.find((action) => action.behavior === "close");
  const headerClose = keepsHeaderCloseWithCancel || !model.actions.some((action) => action.behavior === "close");
  const visibleActions = stageActions.filter((action) => action.id !== closeAction?.id);
  const inlineMediaKeys = new Set([
    ...(model.choices ?? []).flatMap((choice) => [choice.mediaKey, choice.iconKey].filter((key): key is string => Boolean(key))),
    ...(model.people ?? []).map((person) => person.avatarKey),
    ...(model.extension?.kind === "search" ? model.extension.groups.flatMap((group) => group.results.flatMap((result) => [result.markKey, ...(result.mediaKeys ?? [])].filter((key): key is string => Boolean(key)))) : []),
  ]);
  const standaloneMedia = model.resolvedMedia.filter((asset) => !inlineMediaKeys.has(asset.key));
  const load = {
    fieldCount: model.fields?.length,
    comparableChoiceCount: model.choices?.length,
    longForm: model.profile === "P4" || model.profile === "P5",
    dense: model.profile === "P4" || model.profile === "P5",
  };
  const act = (action: DashboardDialogAction) => {
    onAction?.(action.id, model);
    setAnnouncement(action.behavior === "copy" ? model.announcements.copied ?? model.announcements.success : model.announcements[action.id] ?? "");
    if (model.extension?.kind === "wizard" && (action.behavior === "next" || action.behavior === "previous")) {
      const stages = model.extension.stages;
      const index = Math.max(0, stages.findIndex((stage) => stage.id === activeStageId));
      if (model.preset === "auth-method-setup" && action.behavior === "next" && activeStageId === "s1") {
        setActiveStageId(selectedChoiceId === "c2" ? "s3" : "s2");
      } else {
        const next = action.behavior === "next" ? Math.min(stages.length - 1, index + 1) : Math.max(0, index - 1);
        setActiveStageId(stages[next]?.id ?? activeStageId);
      }
      return;
    }
    if (action.behavior === "close" || action.behavior === "submit") {
      setDirty(false);
      setOpen(false);
    }
  };
  const dismiss = (close: () => void) => {
    forceClose.current = close;
    setDiscardPrompt(true);
  };

  return (
    <section className="xp-dashboard-dialog" data-xp-dashboard-dialog-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-profile={model.profile}>
      <ModalSurface
        intent={model.intent}
        trigger={<Trigger>{model.triggerLabel}</Trigger>}
        title={discardPrompt ? model.announcements.discardTitle : model.title}
        description={discardPrompt ? model.announcements.discardDescription : model.description}
        headerCloseLabel={headerClose && !discardPrompt ? model.closeLabel : undefined}
        load={load}
        open={open}
        onOpenChange={(next) => { setOpen(next); if (next) setAnnouncement(""); else { setDirty(false); setDiscardPrompt(false); } }}
        dirty={dirty}
        onDismissRequest={dismiss}
        closeLabel={headerClose ? undefined : model.closeLabel}
        closeAction={closeAction}
        contentClassName="xp-dashboard-dialog__surface"
        contentData={{ "data-source-key": model.sourceKey, "data-preset": model.preset, "data-profile": model.profile }}
        actions={discardPrompt ? [] : visibleActions.map((action) => ({
          ...action,
          tone: action.kind === "primary" || action.kind === "destructive" ? action.kind : "neutral",
          disabled: model.preset === "application-wizard" && action.behavior === "previous" && activeStageId === "st1",
          onAction: () => act(action),
        }))}
        footer={discardPrompt ? (
          <>
            <button type="button" className="xp-control xp-modal-action" data-tone="neutral" onClick={() => setDiscardPrompt(false)}>{model.announcements.keepEditing}</button>
            <button type="button" className="xp-control xp-modal-action" data-tone="destructive" onClick={() => { setDirty(false); setDiscardPrompt(false); forceClose.current?.(); }}>{model.announcements.discard}</button>
          </>
        ) : null}
      >
        {discardPrompt ? null : (
          <div className="xp-dashboard-dialog__body" data-dialog-scroll-owner>
            {model.status ? <span className="xp-dashboard-dialog__status" data-status={model.status} aria-hidden="true">{model.status === "danger" ? <svg viewBox="0 0 24 24"><path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg> : <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>}</span> : null}
            {model.acknowledgement ? <p className="xp-dashboard-dialog__acknowledgement">{model.acknowledgement}</p> : null}
            {standaloneMedia.length ? <div className="xp-dashboard-dialog__media">{standaloneMedia.map((asset) => model.preset === "product-editor" ? <figure key={asset.key}><img src={asset.src} alt={asset.alt} data-media-role={model.media?.find((reference) => reference.key === asset.key)?.role} /><button type="button" aria-label={`Remove ${asset.alt}`} data-xp-control>×</button></figure> : <img src={asset.src} alt={asset.alt} data-media-role={model.media?.find((reference) => reference.key === asset.key)?.role} key={asset.key} />)}</div> : null}
            {model.choices?.length ? <ChoiceSet label={model.title} value={selectedChoiceId || undefined} items={model.choices.map((choice) => {
              const mediaKey = choice.mediaKey ?? choice.iconKey;
              const media = mediaKey ? model.resolvedMedia.find((asset) => asset.key === mediaKey) : undefined;
              return {
                value: choice.id,
                label: choice.label,
                description: choice.description,
                meta: choice.meta,
                details: choice.details,
                media: media ? <img src={media.src} alt={media.alt} /> : choice.iconKey ? <ChoiceMark iconKey={choice.iconKey} /> : undefined,
              };
            })} onChange={(value) => { setSelectedChoiceId(value); markDirty(); }} /> : null}
            {model.fields?.length ? <div className="xp-dashboard-dialog__fields">{model.fields.map((field) => <FieldControl field={field} onDirty={markDirty} key={field.id} />)}</div> : null}
            {model.booleans?.length ? <div className="xp-dashboard-dialog__booleans">{model.booleans.map((item) => { const isSwitch = model.preset === "workspace-create" || model.preset === "collaboration-link"; return <label data-control-kind={isSwitch ? "switch" : "checkbox"} key={item.id}><input type="checkbox" role={isSwitch ? "switch" : undefined} defaultChecked={item.defaultChecked} onChange={markDirty} data-xp-control /><span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span></label>; })}</div> : null}
            {model.people?.length ? <>{model.preset === "project-share-list" ? <p className="xp-dashboard-dialog__member-count">{model.people.length} members</p> : null}<PeopleList people={model.people} media={model.resolvedMedia} onDirty={markDirty} /></> : null}
            {model.upload ? <div className="xp-dashboard-dialog__dropzone" data-upload-max-files={model.upload.maxFiles} data-upload-max-bytes={model.upload.maxBytesPerFile}><span>{model.upload.acceptedTypes.join(", ")}</span><small>Up to {model.upload.maxFiles} files · {Math.round(model.upload.maxBytesPerFile / 1048576)} MB each</small></div> : null}
            <ExtensionContent extension={model.extension} activeStageId={activeStageId} selectedChoiceId={selectedChoiceId} media={model.resolvedMedia} onStageChange={setActiveStageId} onDirty={markDirty} />
            {announcement ? <p className="xp-dashboard-dialog__feedback" role="status">{announcement}</p> : null}
          </div>
        )}
      </ModalSurface>
    </section>
  );
}
