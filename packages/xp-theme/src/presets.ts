import graphite from "../presets/graphite.json";
import paper from "../presets/paper.json";
import aurora from "../presets/aurora.json";
import mono from "../presets/mono.json";
import warm from "../presets/warm.json";
import midnight from "../presets/midnight.json";
import type { ThemeSpec } from "./theme";

export const presets = { graphite, paper, aurora, mono, warm, midnight } satisfies Record<string, ThemeSpec>;
