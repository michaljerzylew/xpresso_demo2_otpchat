"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { AdaptiveOverlay, type OverlayPresentation } from "./adaptive-overlay";
import { useDeviceClass, type DeviceClass } from "./device-class";

export type ModalIntent = "confirm" | "pick" | "edit" | "search";

export type ModalLoad = {
  fieldCount?: number;
  comparableChoiceCount?: number;
  longForm?: boolean;
  dense?: boolean;
};

export type ModalAction = {
  id: string;
  label: ReactNode;
  tone?: "neutral" | "primary" | "destructive";
  disabled?: boolean;
  onAction?: () => void;
};

type ModalSurfaceBase = {
  intent: ModalIntent;
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  headerCloseLabel?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ModalAction[];
  closeLabel?: ReactNode;
  closeAction?: Pick<ModalAction, "id" | "label">;
  load?: ModalLoad;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dirty?: boolean;
  onDismissRequest?: (close: () => void) => void;
  portalContainer?: HTMLElement | null;
  contentClassName?: string;
  contentAttributes?: Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;
  contentData?: Record<`data-${string}`, string>;
};

export type ModalSurfaceProperties = ModalSurfaceBase & (
  | { intent: "confirm"; load?: ModalLoad }
  | { intent: "pick"; load?: ModalLoad }
  | { intent: "edit"; load?: ModalLoad }
  | { intent: "search"; load?: ModalLoad }
);

export function resolveModalPresentation(intent: ModalIntent, deviceClass: DeviceClass, load: ModalLoad = {}): OverlayPresentation {
  if (intent === "confirm") return deviceClass === "M" || deviceClass === "TP" ? "action-sheet" : "dialog";
  if (intent === "search") {
    if (deviceClass === "M") return "full-screen";
    if (deviceClass === "TP") return "sheet";
    return "dialog";
  }
  if (intent === "edit") {
    if (deviceClass === "M") return "full-screen";
    if (deviceClass === "TP") return "sheet";
    if (deviceClass === "TL" && (load.longForm || (load.fieldCount ?? 0) > 4)) return "side-drawer";
    return "dialog";
  }
  if (deviceClass === "M" || deviceClass === "TP") return "bottom-sheet";
  if (deviceClass === "TL" && !load.dense && !load.longForm && (load.comparableChoiceCount ?? 0) <= 5) return "popover";
  return "dialog";
}

export function ModalSurface({
  intent,
  trigger,
  title,
  description,
  headerCloseLabel,
  children,
  footer,
  actions = [],
  closeLabel,
  closeAction,
  load,
  open,
  defaultOpen,
  onOpenChange,
  dirty,
  onDismissRequest,
  portalContainer,
  contentClassName,
  contentAttributes,
  contentData,
}: ModalSurfaceProperties) {
  const deviceClass = useDeviceClass();
  const presentation = resolveModalPresentation(intent, deviceClass, load);
  const form = presentation === "full-screen" ? "takeover" : presentation;
  return (
    <div data-xp-primitive="modal-intents" data-modal-intent={intent} data-variant={form}>
      <AdaptiveOverlay
        intent={intent}
        presentation={{ [deviceClass]: presentation }}
        why="Dashboard modal load resolves to one native form per open session."
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        dirty={dirty}
        onDismissRequest={onDismissRequest}
        portalContainer={portalContainer}
      >
        <AdaptiveOverlay.Trigger>{trigger}</AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content {...contentAttributes} {...contentData} className={contentClassName}>
          <AdaptiveOverlay.Header title={title} description={description} closeLabel={headerCloseLabel} />
          <AdaptiveOverlay.Body>{children}</AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer>
            {footer}
            {actions.map((action) => (
              <button
                className="xp-control xp-modal-action"
                data-tone={action.tone ?? "neutral"}
                data-action-id={action.id}
                disabled={action.disabled}
                onClick={action.onAction}
                type="button"
                key={action.id}
              >
                {action.label}
              </button>
            ))}
            {closeAction ? (
              <AdaptiveOverlay.Close data-action-id={closeAction.id}>{closeAction.label}</AdaptiveOverlay.Close>
            ) : closeLabel ? (
              <AdaptiveOverlay.Close>{closeLabel}</AdaptiveOverlay.Close>
            ) : null}
          </AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    </div>
  );
}
