"use client";

import type { DeviceClass } from "@xp/primitives";
import { useId, useState } from "react";

export type UtilityMetaItem = {
  id: string;
  label: string;
  href?: string;
  value?: string;
};

export type LegacyUtilityMetaModel = {
  label: string;
  items: readonly UtilityMetaItem[];
  status?: { label: string; tone?: "neutral" | "success" | "warning" };
};

export type DashboardFooterLink = {
  id: string;
  label: string;
  href: string;
  role: "legal" | "resource" | "support";
};

export type DashboardFooterSocial = {
  id: string;
  label: string;
  href: string;
  icon: "career" | "code" | "status" | "video";
};

export type DashboardFooterLanguage = {
  label: string;
  currentId: string;
  options: readonly { id: string; label: string }[];
};

export type DashboardFooterIdentity = {
  label: string;
  href: string;
  mark: string;
};

export type DashboardFooterRelocations = {
  settingsDestinations: readonly { id: string; label: string }[];
  appBarActions: readonly { id: string; label: string }[];
  breadcrumb: readonly { id: string; label: string }[];
};

export type DashboardFooterStress = {
  short?: Partial<Pick<DashboardFooterUtilityMetaModel, "copyright">>;
  longLocale?: Partial<Pick<DashboardFooterUtilityMetaModel, "copyright">>;
};

export type DashboardFooterUtilityMetaModel = {
  sourceKey: `dashboard-footer-${string}`;
  preset: string;
  label: string;
  copyright?: string;
  links: readonly DashboardFooterLink[];
  language: DashboardFooterLanguage | null;
  socials: readonly DashboardFooterSocial[];
  identity: DashboardFooterIdentity | null;
  version?: string;
  skin: "plain" | "brand-violet" | "brand-ink";
  placement: "content" | "full-bleed";
  settingsProjection: {
    aboutLabel: string;
    legalLabel: string;
    languageLabel?: string;
  };
  relocated: DashboardFooterRelocations;
  stress?: DashboardFooterStress;
};

export type UtilityMetaModel = LegacyUtilityMetaModel | DashboardFooterUtilityMetaModel;

const dashboardFooterSpecs = {
  "dashboard-footer-01": { preset: "social-meta", links: 0, socials: 4, language: 0, identity: 0, settings: 0, actions: 0, breadcrumb: 0 },
  "dashboard-footer-02": { preset: "resource-meta", links: 4, socials: 0, language: 0, identity: 0, settings: 0, actions: 0, breadcrumb: 0 },
  "dashboard-footer-03": { preset: "language-meta", links: 0, socials: 0, language: 5, identity: 0, settings: 2, actions: 0, breadcrumb: 0 },
  "dashboard-footer-04": { preset: "legal-language-social", links: 5, socials: 3, language: 5, identity: 0, settings: 0, actions: 0, breadcrumb: 0 },
  "dashboard-footer-05": { preset: "brand-social", links: 0, socials: 4, language: 0, identity: 1, settings: 0, actions: 0, breadcrumb: 0 },
  "dashboard-footer-06": { preset: "brand-resource", links: 4, socials: 4, language: 0, identity: 1, settings: 1, actions: 0, breadcrumb: 0 },
  "dashboard-footer-07": { preset: "full-bleed-meta", links: 3, socials: 4, language: 0, identity: 0, settings: 0, actions: 0, breadcrumb: 0 },
  "dashboard-footer-08": { preset: "action-relocated-meta", links: 3, socials: 4, language: 0, identity: 0, settings: 0, actions: 1, breadcrumb: 0 },
  "dashboard-footer-09": { preset: "context-relocated-meta", links: 0, socials: 0, language: 0, identity: 0, settings: 0, actions: 0, breadcrumb: 3 },
  "dashboard-footer-10": { preset: "center-brand-meta", links: 3, socials: 0, language: 0, identity: 1, settings: 1, actions: 0, breadcrumb: 0 },
} as const;

export function isDashboardFooterUtilityMeta(model: UtilityMetaModel): model is DashboardFooterUtilityMetaModel {
  return "sourceKey" in model && model.sourceKey.startsWith("dashboard-footer-");
}

export function isLegacyUtilityMeta(model: UtilityMetaModel): model is LegacyUtilityMetaModel {
  return "items" in model;
}

function localHref(value: string) {
  return value.startsWith("/demo/") && !value.includes("#");
}

export function resolveDashboardFooterFixture(
  input: DashboardFooterUtilityMetaModel,
  stress?: "short" | "longLocale",
): DashboardFooterUtilityMetaModel {
  const spec = dashboardFooterSpecs[input.sourceKey as keyof typeof dashboardFooterSpecs];
  if (!spec) throw new Error(`Unknown dashboard footer source: ${input.sourceKey}`);
  const counts = {
    links: input.links.length,
    socials: input.socials.length,
    language: input.language?.options.length ?? 0,
    identity: input.identity ? 1 : 0,
    settings: input.relocated.settingsDestinations.length,
    actions: input.relocated.appBarActions.length,
    breadcrumb: input.relocated.breadcrumb.length,
  };
  for (const [key, value] of Object.entries(counts)) {
    if (value !== spec[key as keyof typeof counts]) throw new Error(`${input.sourceKey} has invalid ${key} count.`);
  }
  if (input.preset !== spec.preset) throw new Error(`${input.sourceKey} has invalid preset.`);
  const ids = [
    ...input.links.map(({ id }) => id),
    ...input.socials.map(({ id }) => id),
    ...input.relocated.settingsDestinations.map(({ id }) => id),
    ...input.relocated.appBarActions.map(({ id }) => id),
    ...input.relocated.breadcrumb.map(({ id }) => id),
  ];
  if (new Set(ids).size !== ids.length) throw new Error(`${input.sourceKey} has duplicate job ids.`);
  if (input.links.some(({ href }) => !localHref(href)) || input.socials.some(({ href }) => !localHref(href)) || (input.identity && !localHref(input.identity.href))) {
    throw new Error(`${input.sourceKey} requires safe local preview hrefs.`);
  }
  if (input.language && (!input.language.options.some(({ id }) => id === input.language?.currentId) || new Set(input.language.options.map(({ id }) => id)).size !== input.language.options.length)) {
    throw new Error(`${input.sourceKey} has invalid language selection data.`);
  }
  const patch = stress ? input.stress?.[stress] : undefined;
  return patch ? { ...input, ...patch } : input;
}

function SocialGlyph({ icon }: { icon: DashboardFooterSocial["icon"] }) {
  const paths = {
    career: <><circle cx="8" cy="6" r="2.25"/><path d="M3.5 14c.45-3 2-4.5 4.5-4.5s4.05 1.5 4.5 4.5"/></>,
    code: <><path d="m6 4-4 4 4 4M10 4l4 4-4 4"/><path d="m9 2-2 12"/></>,
    status: <><path d="M3 12V8M8 12V5M13 12V2"/><circle cx="3" cy="5" r="1"/><circle cx="8" cy="2" r="1"/><circle cx="13" cy="14" r="1"/></>,
    video: <><rect x="2" y="3.5" width="9" height="9" rx="2"/><path d="m11 6 3-1.5v7L11 10"/></>,
  } as const;
  return <svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</g></svg>;
}

function Identity({ identity }: { identity: DashboardFooterIdentity }) {
  return <a className="xp-utility-meta__identity" href={identity.href}><span aria-hidden="true">{identity.mark}</span><strong>{identity.label}</strong></a>;
}

function Socials({ socials }: { socials: readonly DashboardFooterSocial[] }) {
  if (!socials.length) return null;
  return <ul className="xp-utility-meta__socials" aria-label="Profiles">{socials.map((social) => <li key={social.id}><a href={social.href} aria-label={social.label} title={social.label}><SocialGlyph icon={social.icon}/><span className="xp-visually-hidden">{social.label}</span></a></li>)}</ul>;
}

function Language({ language, compact }: { language: DashboardFooterLanguage; compact: boolean }) {
  const [currentId, setCurrentId] = useState(language.currentId);
  const id = useId();
  return <label className="xp-utility-meta__language" htmlFor={id}><span>{language.label}</span><select id={id} value={currentId} onChange={(event) => setCurrentId(event.target.value)}>{language.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>{compact ? <small>Choose one of {language.options.length} languages</small> : null}</label>;
}

function DashboardFooter({ model, deviceClass, compact }: { model: DashboardFooterUtilityMetaModel; deviceClass: DeviceClass; compact: boolean }) {
  const resourceJobs = model.links.length + model.socials.length;
  if (compact) {
    return <section className="xp-utility-meta xp-utility-meta--settings" data-xp-utility-meta data-xp-utility-meta-settings data-source-key={model.sourceKey} data-device-class={deviceClass} data-skin={model.skin} aria-label={model.label}>
      {model.language ? <section className="xp-utility-meta__settings-group" data-settings-group="language"><h2>{model.settingsProjection.languageLabel ?? model.language.label}</h2><Language language={model.language} compact/></section> : null}
      {model.links.length ? <section className="xp-utility-meta__settings-group" data-settings-group="legal"><h2>{model.settingsProjection.legalLabel}</h2><ul className="xp-utility-meta__links">{model.links.map((link) => <li key={link.id}><a href={link.href}>{link.label}<span aria-hidden="true">›</span></a></li>)}</ul></section> : null}
      <section className="xp-utility-meta__settings-group xp-utility-meta__about" data-settings-group="about"><h2>{model.settingsProjection.aboutLabel}</h2>{model.identity ? <Identity identity={model.identity}/> : null}<div className="xp-utility-meta__about-copy">{model.copyright ? <span>{model.copyright}</span> : null}{model.version ? <small>{model.version}</small> : null}</div><Socials socials={model.socials}/></section>
    </section>;
  }
  return <footer className="xp-utility-meta xp-utility-meta--band" data-xp-utility-meta data-xp-utility-meta-band data-source-key={model.sourceKey} data-device-class={deviceClass} data-skin={model.skin} data-placement={model.placement} aria-label={model.label}>
    {model.identity ? <Identity identity={model.identity}/> : null}
    {model.copyright ? <span className="xp-utility-meta__copyright">{model.copyright}</span> : null}
    {deviceClass === "DW" && resourceJobs <= 7 ? <><ul className="xp-utility-meta__links">{model.links.map((link) => <li key={link.id}><a href={link.href}>{link.label}</a></li>)}</ul><Socials socials={model.socials}/></> : resourceJobs ? <details className="xp-utility-meta__resources"><summary>Resources <span aria-hidden="true">⌄</span></summary><div><ul className="xp-utility-meta__links">{model.links.map((link) => <li key={link.id}><a href={link.href}>{link.label}</a></li>)}</ul><Socials socials={model.socials}/></div></details> : null}
    {model.language ? <Language language={model.language} compact={false}/> : null}
    {model.version ? <small className="xp-utility-meta__version">{model.version}</small> : null}
  </footer>;
}

export function UtilityMeta({ model, deviceClass, compact = false }: {
  model: UtilityMetaModel;
  deviceClass: DeviceClass;
  compact?: boolean;
}) {
  if (isDashboardFooterUtilityMeta(model)) return <DashboardFooter model={model} deviceClass={deviceClass} compact={compact}/>;
  return (
    <footer className="xp-utility-meta" data-xp-utility-meta data-device-class={deviceClass} data-variant={compact ? "compact" : "inline"}>
      <span className="xp-visually-hidden">{model.label}</span>
      <ul>
        {model.items.map((item) => (
          <li key={item.id}>
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
            {item.value ? <small>{item.value}</small> : null}
          </li>
        ))}
      </ul>
      {model.status ? <span className="xp-utility-meta__status" data-tone={model.status.tone ?? "neutral"}>{model.status.label}</span> : null}
    </footer>
  );
}
