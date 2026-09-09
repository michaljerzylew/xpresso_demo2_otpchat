import type { ConfiguratorState } from "./config";
import { serialize } from "./serialize";

export type History = {
  past: ConfiguratorState[];
  present: ConfiguratorState;
  future: ConfiguratorState[];
  /** Identifies the control that produced `present`, so a dragged slider stays one undo step. */
  lastEdit?: { key: string; at: number; continuous: boolean };
};

export type HistoryAction =
  | { type: "edit"; state: ConfiguratorState; key: string; at: number; continuous?: boolean }
  /** An external colour-mode change, which is not an edit of this configuration. */
  | { type: "mode"; mode: ConfiguratorState["mode"] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "replace"; state: ConfiguratorState };

export const historyLimit = 50;
/**
 * Only a continuous gesture coalesces, and only on one control within this window. A click on a
 * discrete control is always its own step: two clicks in a second must undo one at a time.
 */
export const coalesceWindow = 600;

export function initialHistory(state: ConfiguratorState): History {
  return { past: [], present: state, future: [] };
}

export function historyReducer(history: History, action: HistoryAction): History {
  switch (action.type) {
    case "edit": {
      if (serialize(action.state) === serialize(history.present)) return history;
      const edit = { key: action.key, at: action.at, continuous: Boolean(action.continuous) };
      const continues = Boolean(action.continuous) && history.lastEdit?.key === action.key
        && history.lastEdit.continuous && action.at - history.lastEdit.at <= coalesceWindow;
      const past = continues ? history.past : [...history.past, history.present].slice(-historyLimit);
      return { past, present: action.state, future: [], lastEdit: edit };
    }
    case "mode": {
      // Settings, the header menu and another tab all write the same shared preference. Following
      // it must not create an undo step: nothing about this configuration was edited.
      if (history.present.mode === action.mode) return history;
      return { ...history, present: { ...history.present, mode: action.mode } };
    }
    case "undo": {
      if (!history.past.length) return history;
      return {
        past: history.past.slice(0, -1),
        present: history.past[history.past.length - 1],
        future: [history.present, ...history.future].slice(0, historyLimit),
      };
    }
    case "redo": {
      if (!history.future.length) return history;
      const [next, ...rest] = history.future;
      return { past: [...history.past, history.present].slice(-historyLimit), present: next, future: rest };
    }
    case "replace": {
      if (serialize(action.state) === serialize(history.present)) return history;
      return { past: [...history.past, history.present].slice(-historyLimit), present: action.state, future: [] };
    }
  }
}

export const canUndo = (history: History) => history.past.length > 0;
export const canRedo = (history: History) => history.future.length > 0;
