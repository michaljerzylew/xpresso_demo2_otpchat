"use client";

import { AdaptiveOverlay, MorphSlot, SnapRail, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { resolveFacesFixture, type FaceAction, type FaceMediaRecord, type FacesFixture, type FacesMediaMap, type ResolvedFacePerson } from "./faces-model";

export type FacesScenario = { activeGroupId?: string; selectedPersonId?: string; openPersonId?: string };
type Properties = { fixture: FacesFixture; mediaMap: FacesMediaMap; stress?: string; scenario?: FacesScenario; className?: string };
type View = {
  model: ReturnType<typeof resolveFacesFixture>; deviceClass: DeviceClass; people: ResolvedFacePerson[];
  selectedPersonId?: string; openPerson: (person: ResolvedFacePerson) => void; selectPerson: (id: string) => void;
  moveSelection: (direction: -1 | 1) => void; activeGroupId?: string; selectGroup: (id: string) => void;
};
const ladder: Record<DeviceClass, string> = { M:"mobile",TP:"tablet-portrait",TL:"tablet-landscape",DS:"desktop-standard",DW:"desktop-wide" };

function FacePicture({ media, avatar = false }: { media: FaceMediaRecord; avatar?: boolean }) {
  const base = media.publicBase;
  const suffix = avatar && media.role === "portrait" ? "-avatar-256" : "-1280";
  return (
    <picture className="xp-faces__picture" data-face-media-id={media.assetId}>
      <source type="image/avif" srcSet={avatar ? `${base}-avatar-256.avif` : `${base}-640.avif 640w, ${base}-1280.avif 1280w, ${base}-1920.avif 1920w`}/>
      <source type="image/webp" srcSet={avatar ? `${base}-avatar-256.webp` : `${base}-640.webp 640w, ${base}-1280.webp 1280w, ${base}-1920.webp 1920w`}/>
      <img src={`${base}${suffix}.jpg`} alt={media.alt} width={avatar ? 256 : media.width} height={avatar ? 256 : media.height} loading="lazy" decoding="async"/>
    </picture>
  );
}

function ActionLink({ action, owner }: { action: FaceAction; owner?: string }) {
  return <a className="xp-faces__action" data-face-action-id={action.id} href={action.href} aria-label={owner ? `${action.label}, ${owner}` : action.label}>{action.label}<span aria-hidden="true">↗</span></a>;
}

function PersonCard({ person, view, compact = false }: { person: ResolvedFacePerson; view: View; compact?: boolean }) {
  const media = person.media[0];
  return (
    <article className="xp-faces__person" data-person-id={person.id} data-selected={view.selectedPersonId === person.id || undefined} data-anonymous={!person.name || undefined}>
      {media ? <FacePicture media={media} avatar={compact}/> : null}
      <div className="xp-faces__person-copy">
        {person.name ? <h3>{person.name}</h3> : <h3 className="xp-visually-hidden">Team portrait</h3>}
        {person.role ? <p>{person.role}</p> : null}
        {person.bio?.map((line) => <p className="xp-faces__bio" key={line}>{line}</p>)}
        {person.name ? <button type="button" className="xp-faces__detail-trigger" aria-label={`View profile: ${person.name}`} onClick={() => view.openPerson(person)}>View profile</button> : null}
        {person.actions.length ? <div className="xp-faces__person-actions">{person.actions.map((action) => <ActionLink action={action} owner={person.name} key={action.id}/>)}</div> : null}
      </div>
    </article>
  );
}

function Directory({ view }: { view: View }) {
  const avatarMode = view.people.length > 12;
  return <div className="xp-faces__directory" data-avatar-mode={avatarMode || undefined} role="list" onKeyDown={(event) => collectionKeys(event, view)}>{view.people.map((person) => <div role="listitem" key={person.id}><PersonCard person={person} view={view} compact={avatarMode}/></div>)}</div>;
}

function FaceRail({ view }: { view: View }) {
  const activeIndex = Math.max(0, view.people.findIndex(({ id }) => id === view.selectedPersonId));
  return (
    <div className="xp-faces__rail" onKeyDown={(event) => collectionKeys(event, view)}>
      <SnapRail label={view.model.intro.title} paginationLabel={`${view.model.intro.title} position`} markerLabel={(index) => `${index} of ${view.people.length}`} peek="13%" physics="native" activeIndex={activeIndex} onActiveChange={(index) => { const id = view.people[index]?.id; if (id && id !== view.selectedPersonId) view.selectPerson(id); }}>
        {view.people.map((person) => <SnapRail.Item key={person.id}><PersonCard person={person} view={view}/></SnapRail.Item>)}
      </SnapRail>
      <div className="xp-faces__rail-controls">
        <button type="button" aria-label="Previous person" onClick={() => view.moveSelection(-1)}>←</button>
        <span aria-live="polite">{Math.max(1, view.people.findIndex(({ id }) => id === view.selectedPersonId) + 1)} / {view.people.length}</span>
        <button type="button" aria-label="Next person" onClick={() => view.moveSelection(1)}>→</button>
      </div>
    </div>
  );
}

function PortraitMosaic({ view }: { view: View }) {
  return <div className="xp-faces__mosaic" data-presentation={view.model.extension.kind === "portrait-mosaic" ? view.model.extension.presentation : undefined}>{view.people.map((person) => <button type="button" className="xp-faces__mosaic-person" onClick={() => person.name && view.openPerson(person)} disabled={!person.name} aria-label={person.name ? `View profile: ${person.name}` : person.media[0]?.alt} key={person.id}>{person.media[0] ? <FacePicture media={person.media[0]} avatar/> : null}{person.name ? <span><strong>{person.name}</strong>{person.role}</span> : null}</button>)}</div>;
}

function Collective({ view }: { view: View }) {
  const extension = view.model.extension;
  if (extension.kind !== "collective") return null;
  const media = view.model.mediaBySeat.get(extension.groupPhotoSeatId);
  return <div className="xp-faces__collective">{media ? <FacePicture media={media}/> : null}<strong>{view.model.intro.title}</strong></div>;
}

function Spotlight({ view }: { view: View }) {
  const selected = view.model.peopleById.get(view.selectedPersonId ?? "") ?? view.people[0];
  if (!selected) return null;
  return (
    <div className="xp-faces__spotlight">
      <div className="xp-faces__spotlight-main"><PersonCard person={selected} view={view}/></div>
      <div className="xp-faces__selector" role="listbox" aria-label="Select a team member">{view.people.map((person) => <button type="button" role="option" aria-selected={person.id === selected.id} onClick={() => view.selectPerson(person.id)} key={person.id}>{person.media.at(-1) ? <FacePicture media={person.media.at(-1)!} avatar/> : null}<span>{person.name}</span></button>)}</div>
    </div>
  );
}

function IdentityRows({ view }: { view: View }) {
  const extension = view.model.extension;
  if (extension.kind !== "identity-marquee") return null;
  return <div className="xp-faces__identity-rows">{extension.rows.map((row) => <div className="xp-faces__identity-row" role="list" aria-label={row.id} key={row.id}>{row.personIds.map((id) => { const person = view.model.peopleById.get(id)!; return <button type="button" role="listitem" onClick={() => view.openPerson(person)} key={id}>{person.media[0] ? <FacePicture media={person.media[0]} avatar/> : null}<span><strong>{person.name}</strong>{person.role}</span></button>; })}</div>)}</div>;
}

function collectionKeys(event: KeyboardEvent<HTMLElement>, view: View) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); view.moveSelection(event.key === "ArrowLeft" ? -1 : 1); }
}

function FacesForm({ view }: { view: View }) {
  switch (view.model.composition) {
    case "directory": case "filtered-directory": return <Directory view={view}/>;
    case "rail": return <FaceRail view={view}/>;
    case "portrait-mosaic": return <PortraitMosaic view={view}/>;
    case "collective": return <Collective view={view}/>;
    case "spotlight": case "portrait-selector": return <Spotlight view={view}/>;
    case "identity-marquee": return <IdentityRows view={view}/>;
  }
}
const renderForm = ({ core, form }: { core: View; form: string }) => <div className="xp-faces__form" data-native-form={form}><FacesForm view={core}/></div>;
const renderers = { mobile: renderForm, "tablet-portrait": renderForm, "tablet-landscape": renderForm, "desktop-standard": renderForm, "desktop-wide": renderForm };

export function Faces({ fixture, mediaMap, stress, scenario, className }: Properties) {
  const deviceClass = useDeviceClass(); const model = resolveFacesFixture(fixture, mediaMap, stress);
  const initialGroup = scenario?.activeGroupId ?? model.state.activeGroupId ?? (model.extension.kind === "filtered-directory" ? model.extension.initialGroupId : undefined);
  const initialSelected = scenario?.selectedPersonId ?? model.state.selectedPersonId ?? model.state.openPersonId ?? ("initialPersonId" in model.extension ? model.extension.initialPersonId : model.people[0]?.id);
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(initialGroup); const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(initialSelected);
  const stressOpenPersonId = stress ? fixture.stress[stress]?.state?.openPersonId : undefined;
  const [openPersonId, setOpenPersonId] = useState<string | undefined>(scenario?.openPersonId ?? stressOpenPersonId); const returnFocusId = useRef<string | undefined>(undefined);
  const group = model.extension.kind === "filtered-directory" ? model.extension.groups.find(({ id }) => id === activeGroupId) : undefined;
  const people = useMemo(() => group ? group.personIds.map((id) => model.peopleById.get(id)!) : model.people, [group, model.people, model.peopleById]);
  const selectPerson = (id: string) => setSelectedPersonId(id);
  const moveSelection = (direction: -1 | 1) => { const index = Math.max(0, people.findIndex(({ id }) => id === selectedPersonId)); const next = Math.max(0, Math.min(people.length - 1, index + direction)); const id = people[next]?.id; setSelectedPersonId(id); requestAnimationFrame(() => { const person = document.querySelector<HTMLElement>(`[data-person-id="${id}"]`); person?.closest<HTMLElement>("[data-xp-rail-item]")?.scrollIntoView({ block:"nearest", inline:"start" }); person?.querySelector<HTMLElement>("button")?.focus(); }); };
  const openPerson = (person: ResolvedFacePerson) => { returnFocusId.current = person.id; setSelectedPersonId(person.id); setOpenPersonId(person.id); };
  const closePerson = () => { const id = returnFocusId.current; setOpenPersonId(undefined); if (id) requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-person-id="${id}"] .xp-faces__detail-trigger, [data-person-id="${id}"]`)?.focus())); };
  const openPersonModel = openPersonId ? model.peopleById.get(openPersonId) : undefined;
  const selectGroup = (id: string) => { setActiveGroupId(id); if (model.extension.kind === "filtered-directory") setSelectedPersonId(model.extension.groups.find((candidate) => candidate.id === id)?.personIds[0]); };
  const view: View = { model, deviceClass, people, selectedPersonId, openPerson, selectPerson, moveSelection, activeGroupId, selectGroup };
  const introActions = model.intro.actionIds.map((id) => model.actions.find((action) => action.id === id)).filter((action): action is FaceAction => Boolean(action));

  return (
    <section className={["xp-faces",className].filter(Boolean).join(" ")} data-xp-owner="Faces" data-faces-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.composition} data-device-class={deviceClass} data-stress={stress ?? "base"} data-terminal-eligible aria-labelledby={`${model.sourceKey}-title`}>
      <header className="xp-faces__intro">{model.intro.eyebrow ? <span>{model.intro.eyebrow}</span> : null}<h2 id={`${model.sourceKey}-title`}>{model.intro.title}</h2>{model.intro.body?.map((line) => <p key={line}>{line}</p>)}{introActions.length ? <div>{introActions.map((action) => <ActionLink action={action} key={action.id}/>)}</div> : null}</header>
      {model.extension.kind === "filtered-directory" ? <div className="xp-faces__groups" role="radiogroup" aria-label="Team group">{model.extension.groups.map((candidate) => <button type="button" role="radio" aria-checked={candidate.id === activeGroupId} onClick={() => selectGroup(candidate.id)} key={candidate.id}>{candidate.label}<span>{candidate.personIds.length}</span></button>)}</div> : null}
      <MorphSlot className="xp-faces__morph" ladder={ladder} core={view} renderers={renderers}/>
      <p className="xp-visually-hidden" aria-live="polite">{model.announcements.selectionChanged ?? model.announcements.groupChanged ?? ""}</p>
      {openPersonModel ? <AdaptiveOverlay intent="detail" open onOpenChange={(next) => { if (!next) closePerson(); }} modal>
        <AdaptiveOverlay.Content className="xp-faces__sheet" data-person-sheet={openPersonModel.id}>
          <AdaptiveOverlay.Header title={openPersonModel.name ?? "Team member"} description={openPersonModel.role} closeLabel="Close profile"/>
          <AdaptiveOverlay.Body>{openPersonModel.media[0] ? <FacePicture media={openPersonModel.media[0]}/> : null}<div className="xp-faces__sheet-copy">{openPersonModel.bio?.map((line) => <p key={line}>{line}</p>)}{openPersonModel.actions.length ? <div>{openPersonModel.actions.map((action) => <ActionLink action={action} owner={openPersonModel.name} key={action.id}/>)}</div> : null}</div></AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer><button type="button" disabled={people.findIndex(({ id }) => id === openPersonModel.id) <= 0} onClick={() => { moveSelection(-1); const index = people.findIndex(({ id }) => id === openPersonModel.id); setOpenPersonId(people[Math.max(0,index-1)]?.id); }}>Previous</button><AdaptiveOverlay.Close>Close</AdaptiveOverlay.Close><button type="button" disabled={people.findIndex(({ id }) => id === openPersonModel.id) >= people.length - 1} onClick={() => { moveSelection(1); const index = people.findIndex(({ id }) => id === openPersonModel.id); setOpenPersonId(people[Math.min(people.length-1,index+1)]?.id); }}>Next</button></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay> : null}
    </section>
  );
}
