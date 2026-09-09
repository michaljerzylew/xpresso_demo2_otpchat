const sortKeys = (_key: string, value: unknown) => value && typeof value === "object" && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value as object).sort().map(key => [key, (value as Record<string, unknown>)[key]]))
  : value;

/**
 * One configuration must always produce one string. Spread order differs between an edited
 * object and a normalised one, so every comparison, link and export goes through this
 * key-sorted form. It lives alone so the codec and the state module can both use it.
 */
export const serialize = (value: unknown): string => JSON.stringify(value, sortKeys);
export const canonical = <T>(value: T): T => JSON.parse(serialize(value)) as T;
