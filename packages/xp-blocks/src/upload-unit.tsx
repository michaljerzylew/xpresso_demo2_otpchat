"use client";

import { useDeviceClass, useFileUpload } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type CSSProperties, type DragEvent, type KeyboardEvent } from "react";
import { resolveUploadFixture, type ResolvedUpload, type UploadFileRecord, type UploadFixture, type UploadMediaMap, type UploadSourceKind, type UploadStressKey } from "./upload-model";

type PickedFile = { source: string; name: string; size: number; file: File };
export type UploadSourceAdapter = () => Promise<UploadFileRecord[]>;
export type UploadScenario = { dragging?: boolean; source?: UploadSourceKind; selectedLast?: boolean; passwordVisible?: boolean };
type Properties = {
  fixture?: UploadFixture;
  model?: ResolvedUpload;
  mediaMap: UploadMediaMap;
  stress?: UploadStressKey;
  scenario?: UploadScenario;
  adapters?: Partial<Record<UploadSourceKind, UploadSourceAdapter>>;
  files?: UploadFileRecord[];
  onFilesChange?: (files: UploadFileRecord[]) => void;
  onFileRemoved?: (file: UploadFileRecord) => void;
  className?: string;
};

const formatBytes = (bytes: number) => bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
const fileId = (name: string, index: number) => `upload-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${index + 1}`;
const stateLabel: Record<UploadFileRecord["state"], string> = { queued: "Ready", uploading: "Uploading", done: "Uploaded", failed: "Failed" };

function accepts(file: File, model: ResolvedUpload) {
  return model.accept.some((rule) => rule === "*/*" || (rule.endsWith("/*") && file.type.startsWith(rule.slice(0, -1))) || rule === file.type || (rule.startsWith(".") && file.name.toLowerCase().endsWith(rule)));
}

function Preview({ file, mediaMap }: { file: UploadFileRecord; mediaMap: UploadMediaMap }) {
  const media = file.previewAssetId ? mediaMap.records.find(({ assetId }) => assetId === file.previewAssetId) : undefined;
  if (media) return <picture><source srcSet={media.sources.avif} type="image/avif"/><source srcSet={media.sources.webp} type="image/webp"/><img src={media.sources.jpg} alt={media.alt}/></picture>;
  if (file.previewUrl) return <img src={file.previewUrl} alt="Selected file preview"/>;
  return <span className="xp-file-list__type" aria-hidden="true">{file.name.includes(".") ? file.name.split(".").at(-1)?.slice(0, 4).toUpperCase() : "FILE"}</span>;
}

export function FileList({ files, mediaMap, remove, retry, removeLabel = "Remove", retryLabel = "Retry" }: { files: UploadFileRecord[]; mediaMap: UploadMediaMap; remove: (id: string) => void; retry: (id: string) => void; removeLabel?: string; retryLabel?: string }) {
  const deviceClass = useDeviceClass();
  return <div className="xp-file-list" data-xp-owner="FileList" data-device-class={deviceClass}>
    <ul aria-label="Selected files">
      {files.map((file) => <li key={file.id} data-state={file.state}>
        <div className="xp-file-list__preview"><Preview file={file} mediaMap={mediaMap}/></div>
        <div className="xp-file-list__copy"><strong title={file.name}><span>{file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name}</span>{file.name.includes(".") ? <b>{file.name.slice(file.name.lastIndexOf("."))}</b> : null}</strong><span>{formatBytes(file.size)} · {stateLabel[file.state]}</span>{file.error ? <p role="alert">{file.error}</p> : null}</div>
        <div className="xp-file-list__progress"><progress max="100" value={file.progress} aria-label={`${file.name}: ${file.progress}%`}/><i className="xp-file-list__radial" style={{ "--xp-upload-progress": `${file.progress * 3.6}deg` } as CSSProperties} aria-hidden="true"/><span>{file.progress}%</span></div>
        <div className="xp-file-list__actions">{file.state === "failed" ? <button type="button" onClick={() => retry(file.id)}>{retryLabel}</button> : null}<button type="button" onClick={() => remove(file.id)} aria-label={`${removeLabel} ${file.name}`}>{removeLabel}</button></div>
      </li>)}
    </ul>
  </div>;
}

function HostFields({ model, passwordVisible, setPasswordVisible, termsAccepted, setTermsAccepted }: { model: ResolvedUpload; passwordVisible: boolean; setPasswordVisible: (value: boolean) => void; termsAccepted: boolean; setTermsAccepted: (value: boolean) => void }) {
  return <div className="xp-upload__host-fields">{Object.entries(model.hostFields ?? {}).map(([key, field]) => {
    if (key === "leadSelector" && field.options?.every((option) => typeof option !== "string")) return <fieldset className="xp-upload__lead-field" key={key}><legend>{field.label}</legend>{field.helper ? <p>{field.helper}</p> : null}<div>{field.options.map((option, index) => typeof option === "string" ? null : <label key={option.id}><input name={key} type="radio" defaultChecked={index === 0}/><span data-mark-id={option.markId}>{option.initials}</span><b>{option.name}</b></label>)}</div></fieldset>;
    if (key === "visibility" && field.options?.every((option) => typeof option === "string")) return <fieldset className="xp-upload__visibility-field" key={key} aria-describedby={`${model.sourceKey}-${key}-reason`}><legend>{field.label}</legend><div>{field.options.map((option, index) => typeof option === "string" ? <label key={option}><input name={key} type="radio" defaultChecked={index === 0} disabled/><span>{option}</span></label> : null)}</div>{field.lockedReason ? <p id={`${model.sourceKey}-${key}-reason`}>{field.lockedReason}</p> : null}</fieldset>;
    if (key === "recommendation" && field.options?.every((option) => typeof option === "string")) return <fieldset key={key}><legend>{field.helper ?? field.label}</legend><div className="xp-upload__choices">{field.options.map((option, index) => typeof option === "string" ? <label key={option}><input name={key} type="radio" defaultChecked={index === 0}/><span>{option}</span></label> : null)}</div></fieldset>;
    if (key === "termsGate") return <label className="xp-upload__terms" key={key}><input type="checkbox" checked={termsAccepted} onChange={(event)=>setTermsAccepted(event.currentTarget.checked)}/><span>{field.agreement}</span></label>;
    if (key === "reportRoute") return <p className="xp-upload__report" key={key}>{field.helper} <a href={field.href}>{field.label}</a></p>;
    if (key === "reviewBody") return <label className="xp-upload__field" key={key}><span>{field.label}</span><textarea placeholder={field.placeholder} rows={4}/>{field.helper ? <small>{field.helper}</small> : null}</label>;
    const password = key === "profilePassword";
    return <label className="xp-upload__field" key={key}><span>{field.label}</span><span className="xp-upload__input-wrap"><input type={password && !passwordVisible ? "password" : key === "profileEmail" ? "email" : "text"} placeholder={field.placeholder}/>{password ? <button type="button" aria-pressed={passwordVisible} onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? String(model.actions.hidePassword) : String(model.actions.revealPassword)}</button> : null}</span>{field.helper ? <small>{field.helper}</small> : null}</label>;
  })}</div>;
}

function normalizeFiles(selected: PickedFile[], model: ResolvedUpload, existing: UploadFileRecord[]) {
  const accepted: UploadFileRecord[] = [];
  let message = "";
  for (const item of selected) {
    if (existing.length + accepted.length >= model.maxFiles) { message = model.uploadCopy.validation.count; break; }
    if (existing.some(({ name }) => name.toLowerCase() === item.name.toLowerCase()) || accepted.some(({ name }) => name.toLowerCase() === item.name.toLowerCase())) { message = model.uploadCopy.validation.duplicate; continue; }
    if (item.size > model.maxBytes) { message = model.uploadCopy.validation.size; continue; }
    if (!accepts(item.file, model)) { message = model.uploadCopy.validation.type; continue; }
    accepted.push({ id: fileId(item.name, existing.length + accepted.length), name: item.name, size: item.size, mediaType: item.file.type || "application/octet-stream", previewUrl: item.source, progress: 0, state: "queued" });
  }
  return { accepted, message };
}

export function UploadUnit({ fixture, model: suppliedModel, mediaMap, stress, scenario, adapters, files: controlledFiles, onFilesChange, onFileRemoved, className }: Properties) {
  const deviceClass = useDeviceClass();
  const touchPrimary = deviceClass === "M" || deviceClass === "TP";
  const model = useMemo(() => {
    if (suppliedModel) return suppliedModel;
    if (!fixture) throw new Error("UploadUnit requires a resolved model or one canonical fixture.");
    return resolveUploadFixture(fixture, mediaMap, stress);
  }, [fixture, mediaMap, stress, suppliedModel]);
  const [, selectFiles] = useFileUpload();
  const [internalFiles, setInternalFiles] = useState(model.files);
  const files = controlledFiles ?? internalFiles;
  const [message, setMessage] = useState("");
  const [activeSource, setActiveSource] = useState<UploadSourceKind | undefined>(scenario?.source);
  const [passwordVisible, setPasswordVisible] = useState(Boolean(scenario?.passwordVisible));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dragging, setDragging] = useState(Boolean(scenario?.dragging));
  const [linkValue, setLinkValue] = useState("");
  const ownedUrls = useRef(new Set<string>());
  const cameraInput = useRef<HTMLInputElement>(null);
  const update = (next: UploadFileRecord[]) => { if (!controlledFiles) setInternalFiles(next); onFilesChange?.(next); };
  const admit = (selected: PickedFile[]) => {
    const { accepted, message: nextMessage } = normalizeFiles(selected, model, files);
    const acceptedUrls = new Set(accepted.map(({ previewUrl }) => previewUrl).filter((url): url is string => Boolean(url)));
    for (const item of selected) if (item.source.startsWith("blob:") && !acceptedUrls.has(item.source)) URL.revokeObjectURL(item.source);
    if (!model.multiple) for (const file of files) if (file.previewUrl?.startsWith("blob:") && !acceptedUrls.has(file.previewUrl)) { URL.revokeObjectURL(file.previewUrl); ownedUrls.current.delete(file.previewUrl); }
    for (const file of accepted) if (file.previewUrl?.startsWith("blob:")) ownedUrls.current.add(file.previewUrl);
    update(model.multiple ? [...files, ...accepted] : accepted.slice(-1));
    setMessage(nextMessage || (accepted.length ? model.uploadCopy.announcements.progress : ""));
  };
  const pick = () => selectFiles({ accept: model.accept.join(","), multiple: model.multiple }, (value) => {
    const selected = (Array.isArray(value) ? value : value ? [value] : []) as PickedFile[];
    admit(selected);
  });
  const remove = (id: string) => { const removed = files.find((file) => file.id === id); if (removed?.previewUrl?.startsWith("blob:")) { URL.revokeObjectURL(removed.previewUrl); ownedUrls.current.delete(removed.previewUrl); } update(files.filter((file) => file.id !== id)); if (removed) onFileRemoved?.(removed); };
  const retry = (id: string) => update(files.map((file) => file.id === id ? { ...file, state: "uploading", progress: 12, error: undefined } : file));
  const runAdapter = async (kind: UploadSourceKind) => {
    setActiveSource(kind);
    if (kind === "device") return pick();
    if (kind === "camera") { cameraInput.current?.click(); return; }
    if (kind === "link") return;
    const adapter = adapters?.[kind];
    if (!adapter) { setMessage(model.uploadCopy.validation.source); return; }
    try { const selected = await adapter(); update(model.multiple ? [...files, ...selected].slice(0, model.maxFiles) : selected.slice(-1)); setMessage(model.uploadCopy.announcements.progress); } catch { setMessage(model.sources?.[kind]?.error ?? model.uploadCopy.validation.source); }
  };
  const importLink = () => {
    try { const url = new URL(linkValue); const name = url.pathname.split("/").filter(Boolean).at(-1) || "linked-file"; const record: UploadFileRecord = { id: fileId(name, files.length), name, size: 1, mediaType: "text/uri-list", progress: 0, state: "queued" }; update([...files, record].slice(0, model.maxFiles)); setMessage(model.uploadCopy.announcements.progress); }
    catch { setMessage(model.sources?.link?.error ?? model.uploadCopy.validation.source); }
  };
  const inputChange = (event: ChangeEvent<HTMLInputElement>) => { const selected = Array.from(event.currentTarget.files ?? []).map((file) => ({ source: URL.createObjectURL(file), name: file.name, size: file.size, file })); admit(selected); event.currentTarget.value = ""; };
  const drop = (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragging(false); const selected = Array.from(event.dataTransfer.files).map((file) => ({ source: URL.createObjectURL(file), name: file.name, size: file.size, file })); admit(selected); };
  const paste = (event: ClipboardEvent<HTMLElement>) => { const selected = Array.from(event.clipboardData.files).map((file) => ({ source: URL.createObjectURL(file), name: file.name, size: file.size, file })); if (selected.length) { event.preventDefault(); admit(selected); } };
  const keyDown = (event: KeyboardEvent<HTMLElement>) => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); pick(); } };
  useEffect(() => () => { for (const url of ownedUrls.current) URL.revokeObjectURL(url); ownedUrls.current.clear(); }, []);

  const chooseLabel = String(model.actions.choose ?? (model.multiple ? "Add files" : "Add file"));
  const removeLabel = String(model.actions.remove ?? "Remove");
  const retryLabel = String(model.actions.retry ?? "Retry");
  const dragHandlers = deviceClass === "M" ? {} : {
    onDragEnter: (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragging(true); },
    onDragOver: (event: DragEvent<HTMLElement>) => event.preventDefault(),
    onDragLeave: () => setDragging(false),
    onDrop: drop,
  };
  const actionEntries = Object.entries(model.actions).filter(([key, value]) => typeof value === "string" && ["cancel", "secondary", "primary"].includes(key));
  return <section className={["xp-upload", `xp-upload--${model.preset}`, className].filter(Boolean).join(" ")} data-xp-owner="UploadUnit" data-upload-state-owner data-device-class={deviceClass} data-source-key={model.sourceKey} data-preset={model.preset} data-stress={model.activeStress ?? "base"} data-dragging={dragging || undefined} onPaste={paste}>
    <header className="xp-upload__intro"><h2>{model.heading}</h2><p>{model.description}</p></header>
    <HostFields model={model} passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted}/>
    <div className="xp-upload__acquisition" tabIndex={0} onKeyDown={keyDown} {...dragHandlers}>
      <input className="xp-upload__native" type="file" accept={model.accept.join(",")} multiple={model.multiple} onChange={inputChange} aria-label={chooseLabel}/>
      {model.sources?.camera ? <input ref={cameraInput} className="xp-upload__native" type="file" accept="image/*" capture="environment" multiple={false} onChange={inputChange} aria-label={model.sources.camera.label}/> : null}
      <noscript><label className="xp-upload__noscript">{chooseLabel}<input type="file" accept={model.accept.join(",")} multiple={model.multiple}/></label></noscript>
      <div className="xp-upload__drop-copy"><strong data-affordance-copy={touchPrimary ? "touch" : "pointer"}>{touchPrimary ? model.uploadCopy.touchAction : model.uploadCopy.pointerAction}</strong><span>{model.uploadCopy.constraints}</span><small>Paste is available while this area is focused.</small></div>
      <button type="button" className="xp-upload__choose" onClick={() => pick()}>{chooseLabel}</button>
    </div>
    {model.sources ? <div className="xp-upload__sources" aria-label="File sources">{Object.entries(model.sources).map(([kind, source]) => {
      const sourceKind = kind as UploadSourceKind; const available = ["device", "camera", "link"].includes(sourceKind) || Boolean(adapters?.[sourceKind]);
      return available ? <button type="button" key={kind} data-active={activeSource === sourceKind || undefined} onClick={() => void runAdapter(sourceKind)}><b>{source.label}</b><span>{source.instruction}</span></button> : null;
    })}</div> : null}
    {activeSource === "link" && model.sources?.link ? <form className="xp-upload__link" onSubmit={(event) => { event.preventDefault(); importLink(); }}><label><span>{model.sources.link.instruction}</span><input type="url" value={linkValue} onChange={(event) => setLinkValue(event.target.value)} required/></label><button type="submit">{model.sources.link.label}</button></form> : null}
    {message ? <p className="xp-upload__message" role={/failed|large|support|unavailable|invalid/i.test(message) ? "alert" : "status"}>{message}</p> : null}
    {files.length ? <FileList files={files} mediaMap={mediaMap} remove={remove} retry={retry} removeLabel={removeLabel} retryLabel={retryLabel}/> : <p className="xp-upload__empty">{String(model.stress.empty)}</p>}
    <footer className="xp-upload__terminal-actions">{actionEntries.map(([key, label]) => <button type={key === "primary" ? "submit" : "button"} data-intent={key} disabled={key === "primary" && Boolean(model.hostFields?.termsGate) && !termsAccepted} key={key}>{String(label)}</button>)}</footer>
  </section>;
}
