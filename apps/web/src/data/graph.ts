/** Extend this vocabulary in MODEL before adding records. */
export type EntityKind = "record";
export type EntityRef = { kind: EntityKind; id: string };
export type SessionEntity = { kind: EntityKind; id: string; title: string; links: EntityRef[] };
export const entities: SessionEntity[] = [];
