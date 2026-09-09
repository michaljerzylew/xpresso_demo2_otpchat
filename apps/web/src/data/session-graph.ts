import { entities, type EntityKind, type EntityRef, type SessionEntity } from "./graph";
export type { SessionEntity } from "./graph";
export type SessionGraph = { entities: SessionEntity[] };
export const graphEntity = (graph: SessionGraph, ref: EntityRef) => graph.entities.find(entity => entity.kind === ref.kind && entity.id === ref.id);
/** Resolves the `kind:id` segment a record route carries. */
export const resolveGraphEntity = (graph: SessionGraph, value: string | null) => graph.entities.find(entity => `${entity.kind}:${entity.id}` === value);
export function graphRecords<K extends EntityKind>(graph: SessionGraph, kind: K) {
  return graph.entities.filter((entity): entity is Extract<SessionEntity, { kind: K }> => entity.kind === kind);
}

export const createSessionGraph = (): SessionGraph => structuredClone({ entities });
