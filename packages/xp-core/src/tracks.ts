declare const trackBrand: unique symbol;

export type TrackToken = string & { readonly [trackBrand]: "xp-track" };

function token(value: string): TrackToken {
  if (value.trim().length === 0) throw new TypeError("Track values cannot be empty.");
  return value as TrackToken;
}

export const pin = (value: string): TrackToken => token(value);

export const hug = (cap?: string): TrackToken => (
  cap === undefined ? token("auto") : token(`fit-content(${cap})`)
);

export const flex = (minimum: string): TrackToken => token(`minmax(min(100%, ${minimum}), 1fr)`);

export const bound = (minimum: string, maximum: string): TrackToken => token(`minmax(${minimum}, ${maximum})`);

export const tracks = (...values: TrackToken[]): string => values.join(" ");
