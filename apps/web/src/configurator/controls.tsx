import { useId, type ReactNode } from "react";
import { generateRamp, rampSteps, cssColor, type ColorFamily, type ColorSeed } from "@xp/theme";

/** One label, one live value, one control: the row shape the whole panel repeats. */
export function Row({ label, value, hint, children, id }: { label: ReactNode; value?: ReactNode; hint?: ReactNode; children: ReactNode; id?: string }) {
  return <div className="cfg-row">
    <label className="cfg-row__label" htmlFor={id}>{label}</label>
    {value === undefined ? null : <output className="cfg-row__value" htmlFor={id}>{value}</output>}
    <div className="cfg-row__control">{children}</div>
    {hint === undefined ? null : <p className="cfg-row__hint">{hint}</p>}
  </div>;
}

export function Slider({ label, value, min, max, step, format, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (value: number) => string; onChange: (value: number) => void; hint?: ReactNode;
}) {
  const id = "cfg-" + useId().replaceAll(":", "");
  return <Row id={id} label={label} value={format(value)} hint={hint}>
    <input id={id} className="cfg-slider" type="range" min={min} max={max} step={step} value={value}
      onChange={event => onChange(Number(event.target.value))} />
  </Row>;
}

export function Ramp({ family, seed }: { family: ColorFamily; seed: ColorSeed }) {
  const ramp = generateRamp(seed);
  return <div className="cfg-ramp" role="img" aria-label={`${family} ramp, tones ${rampSteps[0]} to ${rampSteps[rampSteps.length - 1]}`}>
    {rampSteps.map(step => <span key={step} className="cfg-ramp__tone" style={{ background: cssColor(ramp[step]) }} />)}
  </div>;
}

/**
 * The measured headroom, not a verdict sticker: the number moves as the seed moves, so a reader
 * can see a pairing approaching the floor before it crosses it.
 */
export function GuardBadge({ failing, ratio, label }: { failing: number; ratio: string; label: string }) {
  return <span className="cfg-guard" data-state={failing ? "fail" : "pass"} title={label}>
    <span aria-hidden="true">{ratio}</span>
    <span className="cfg-visually-hidden">{label}</span>
  </span>;
}

/*
 * There is no press primitive here on purpose. The shell binds `press` to every control inside
 * the workspace and inside each sheet (src/shell/motion.tsx), so a second binding on the same
 * button would fight it. The panel stays declarative.
 */
