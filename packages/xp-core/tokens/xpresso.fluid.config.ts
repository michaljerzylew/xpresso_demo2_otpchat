import config from "./xpresso.fluid.config.json" with { type: "json" };

export type XpClass = "M" | "TP" | "TL" | "DS" | "DW";

export interface XpFluidConfig {
  remBase: number;
  segments: Array<{ class: XpClass; min: number; max: number }>;
  detection: {
    portraitCoarseTie: { min: number; max: number; class: XpClass };
  };
  type: {
    steps: number[];
    poles: Record<XpClass, { min: { size: number; ratio: number }; max: { size: number; ratio: number } }>;
    slopeClass: Record<string, "flat" | "gentle" | "steep">;
  };
  space: {
    unit: Record<XpClass, [number, number]>;
    scale: Record<string, number>;
    pairs: Array<[string, string]>;
  };
  radius: {
    unit: Record<XpClass, [number, number]>;
    scale: Record<string, number>;
  };
  measure: Record<string, number>;
  floors: { tapCoarse: number; tapFine: number; gapMin: number };
  density: { modes: Record<string, number> };
  rails?: Record<string, number | string>;
  slots: {
    root: Record<string, number>;
    inner: Record<string, number>;
  };
  roles: Record<string, Record<XpClass, number> | string>;
}

export default config as unknown as XpFluidConfig;
