import { createContext, useContext, useState, type ReactNode } from "react";
import type { EntityRef } from "./graph";
import { createSessionGraph, graphEntity, resolveGraphEntity, type SessionGraph } from "./session-graph";

function useSessionState(initialGraph: () => SessionGraph) {
  const [graph, setGraph] = useState(initialGraph);
  return { graph, setGraph, findEntity: (ref: EntityRef) => graphEntity(graph, ref),
    resolveEntity: (value: string | null) => resolveGraphEntity(graph, value) };
}
const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);
export function SessionGraphProvider({ children, initialGraph = createSessionGraph }: { children: ReactNode; initialGraph?: () => SessionGraph }) {
  return <SessionContext.Provider value={useSessionState(initialGraph)}>{children}</SessionContext.Provider>;
}
export function useSessionGraph() {
  const state = useContext(SessionContext);
  if (!state) throw new Error("SessionGraphProvider is required");
  return state;
}
