"use client";

import { createContext, useContext, useEffect, useId, useState, type CSSProperties, type FocusEvent, type PointerEvent } from "react";
import { Marquee } from "@xp/primitives";
import type { GravityRailIdentity, GravityRailModel } from "./gravity-rail-model";

function Heading({ heading }: { heading: GravityRailModel["copy"]["heading"] }) {
  const emphasis = heading.emphasis?.phrase;
  if (!emphasis || !heading.text.includes(emphasis)) return <>{heading.text}</>;
  const [before, after] = heading.text.split(emphasis);
  return <>{before}<span className="xp-gravity__emphasis">{emphasis}</span>{after}</>;
}

const GravityTheme = createContext<"light" | "dark">("light");

function LogoImage({ logo, surfaceTheme }: { logo: GravityRailIdentity; surfaceTheme?: "light" | "dark" }) {
  const pageTheme = useContext(GravityTheme);
  const theme = surfaceTheme ?? pageTheme;
  const style = {
    "--xp-logo-scale": logo.opticalScale,
    "--xp-logo-baseline": `${logo.baselineShiftEm}em`,
  } as CSSProperties;
  return (
    <picture className="xp-gravity__picture" style={style} data-xp-logo-picture data-resolved-theme={theme}>
      <img
        src={theme === "dark" ? logo.darkSrc : logo.lightSrc}
        alt={logo.name}
        loading="eager"
        decoding="sync"
        data-company-id={logo.companyId}
        data-asset-ref={logo.assetRef}
        data-light-hash={logo.lightHash}
        data-dark-hash={logo.darkHash}
      />
    </picture>
  );
}

function DecorativeLogoImage({ logo }: { logo: GravityRailIdentity }) {
  const theme = useContext(GravityTheme);
  const style = { "--xp-logo-scale": logo.opticalScale, "--xp-logo-baseline": `${logo.baselineShiftEm}em` } as CSSProperties;
  return <picture className="xp-gravity__picture" style={style}><img src={theme === "dark" ? logo.darkSrc : logo.lightSrc} alt="" /></picture>;
}

function StaticList({ logos, className }: { logos: GravityRailIdentity[]; className?: string }) {
  return (
    <ul className={["xp-gravity__list", className].filter(Boolean).join(" ")} data-xp-gravity-list data-xp-semantic-owner>
      {logos.map((logo, index) => (
        <li key={logo.id} className="xp-gravity__item" data-xp-gravity-record data-index={index + 1} data-role={logo.role}>
          <LogoImage logo={logo} />
        </li>
      ))}
    </ul>
  );
}

function MotionLane({ logos, index, reverse, axis, paused, onPausedChange, showToggle }: {
  logos: GravityRailIdentity[];
  index: number;
  reverse: boolean;
  axis: "horizontal" | "vertical" | "responsive";
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  showToggle: boolean;
}) {
  const records = logos.map((logo) => (
    <span key={logo.id} className="xp-gravity__motion-item" role="listitem" data-xp-gravity-record>
      <LogoImage logo={logo} />
      <span className="xp-gravity__reduced-label" aria-hidden="true">{logo.name}</span>
    </span>
  ));
  const clones = logos.map((logo) => <span key={`clone-${logo.id}`} className="xp-gravity__motion-item"><DecorativeLogoImage logo={logo} /></span>);
  return (
    <li className="xp-gravity__lane" data-xp-gravity-lane data-lane={index + 1} role="presentation">
      <Marquee
        label={`Partner lane ${index + 1}`}
        pauseLabel="Pause logos"
        resumeLabel="Resume logos"
        paused={paused}
        onPausedChange={onPausedChange}
        showToggle={showToggle}
        reverse={reverse}
        axis={axis}
        speedPixelsPerSecond={32}
        cloneChildren={clones}
      >
        {records}
      </Marquee>
    </li>
  );
}

function MotionList({ lanes, axis = "horizontal" }: { lanes: GravityRailIdentity[][]; axis?: "horizontal" | "vertical" | "responsive" }) {
  const [explicitPaused, setExplicitPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const paused = explicitPaused || interactionPaused;
  const pointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") setInteractionPaused(true);
  };
  const pointerLeave = () => setInteractionPaused(false);
  const focus = () => setInteractionPaused(true);
  const blur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteractionPaused(false);
  };
  return (
    <div className="xp-gravity__motion-field" data-shared-paused={paused ? "true" : "false"}
      onPointerEnter={pointerEnter}
      onPointerLeave={pointerLeave}
      onPointerDown={() => setInteractionPaused(true)}
      onPointerUp={() => setInteractionPaused(false)}
      onPointerCancel={() => setInteractionPaused(false)}
      onFocusCapture={focus}
      onBlurCapture={blur}>
      <ul className="xp-gravity__list xp-gravity__list--motion" data-xp-gravity-list data-xp-semantic-owner>
        {lanes.map((lane, index) => <MotionLane key={lane.map((logo) => logo.id).join("-")} logos={lane} index={index} reverse={index % 2 === 1} axis={axis} paused={paused} onPausedChange={setExplicitPaused} showToggle={false} />)}
      </ul>
      <button className="xp-gravity__pause" type="button" data-xp-gravity-pause onClick={() => setExplicitPaused((value) => !value)}>{explicitPaused ? "Resume" : "Pause"}</button>
    </div>
  );
}

function ResponsiveVerticalPartners({ logos }: { logos: GravityRailIdentity[] }) {
  const [tabletLandscape, setTabletLandscape] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 52.5rem) and (max-width: 74.999rem)");
    const sync = () => setTabletLandscape(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return <MotionList lanes={chunks(logos, tabletLandscape ? [7, 6, 6] : [5, 5, 6, 3])} axis="responsive" />;
}

const chunks = (logos: GravityRailIdentity[], sizes: number[]) => {
  let cursor = 0;
  return sizes.map((size) => {
    const value = logos.slice(cursor, cursor + size);
    cursor += size;
    return value;
  });
};

function OrbitField({ logos }: { logos: GravityRailIdentity[] }) {
  const partners = logos.filter((logo) => logo.role === "partner");
  const product = logos.find((logo) => logo.role === "product");
  return (
    <div className="xp-gravity__orbit" data-xp-gravity-orbit data-motion="static-complete">
      <StaticList logos={partners} className="xp-gravity__list--orbit" />
      {product ? <div className="xp-gravity__product" data-xp-product-center data-surface-theme="dark"><LogoImage logo={product} surfaceTheme="dark" /></div> : null}
    </div>
  );
}

function LogoField({ model }: { model: GravityRailModel }) {
  const logos = model.copy.logos;
  if (model.preset === "soft-mosaic") return <MotionList lanes={chunks(logos, [4, 4, 4])} />;
  if (model.preset === "dual-card-marquee") return <MotionList lanes={chunks(logos, [7, 5])} />;
  if (model.preset === "bare-color-wall") return <MotionList lanes={chunks(logos, [7, 7])} />;
  if (model.preset === "split-vertical-partners") return <ResponsiveVerticalPartners logos={logos} />;
  if (model.preset === "split-identity-orbit") return <OrbitField logos={logos} />;
  return <StaticList logos={logos} />;
}

export function GravityRail({ model, className, theme = "light" }: { model: GravityRailModel; className?: string; theme?: "light" | "dark" }) {
  const headingId = useId();
  const split = model.preset.startsWith("split-");
  return (
    <GravityTheme.Provider value={theme}><section
      className={["xp-gravity", className].filter(Boolean).join(" ")}
      data-xp-gravity-renderer
      data-slug={model.slug}
      data-preset={model.preset}
      data-mode={model.mode}
      data-composition={split ? "standalone" : "proof-projection-eligible"}
      aria-labelledby={headingId}
    >
      <div className="xp-gravity__inner">
        <header className="xp-gravity__copy">
          {model.copy.eyebrow ? <p className="xp-gravity__eyebrow" data-treatment={model.copy.eyebrow.treatment}>{model.copy.eyebrow.text}</p> : null}
          <h2 id={headingId}><Heading heading={model.copy.heading} /></h2>
          <p className="xp-gravity__body">{model.copy.body}</p>
          {model.copy.action ? (
            <div className="xp-gravity__action-wrap">
              {model.copy.actionPrompt ? <span>{model.copy.actionPrompt}</span> : null}
              <a className="xp-gravity__action" href={model.copy.action.href} data-xp-gravity-action>{model.copy.action.label}</a>
            </div>
          ) : null}
        </header>
        <div className="xp-gravity__field" aria-label={model.copy.accessibilityIntro} data-xp-gravity-field>
          <LogoField model={model} />
        </div>
      </div>
    </section></GravityTheme.Provider>
  );
}
