"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { AdaptiveOverlay } from "./adaptive-overlay";
import { useDeviceClass } from "./device-class";

export type PopoutProperties = {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  portalContainer?: HTMLElement | null;
  contentClassName?: string;
  contentAttributes?: Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;
  contentData?: Record<`data-${string}`, string>;
};

export function Popout({
  trigger,
  title,
  description,
  children,
  footer,
  closeLabel,
  open,
  defaultOpen,
  onOpenChange,
  portalContainer,
  contentClassName,
  contentAttributes,
  contentData,
}: PopoutProperties) {
  const deviceClass = useDeviceClass();
  const presentation = deviceClass === "M"
    ? "full-screen"
    : deviceClass === "TP" || deviceClass === "TL"
      ? "side-drawer"
      : deviceClass === "DS"
        ? "pane"
        : "inspector-pane";
  const form = presentation === "full-screen" ? "takeover" : "drawer-side";
  return (
    <div data-xp-primitive="popout" data-popout-kind="content" data-variant={form}>
      <AdaptiveOverlay
        intent="detail"
        presentation={{ [deviceClass]: presentation }}
        why="Activity content stays contextual in a native end-edge surface."
        modal={deviceClass === "M"}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        portalContainer={portalContainer}
      >
        <AdaptiveOverlay.Trigger>{trigger}</AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content {...contentAttributes} {...contentData} className={contentClassName} data-xp-popout-content>
          <AdaptiveOverlay.Header title={title} description={description} closeLabel={closeLabel} />
          <AdaptiveOverlay.Body>{children}</AdaptiveOverlay.Body>
          {footer ? <AdaptiveOverlay.Footer>{footer}</AdaptiveOverlay.Footer> : null}
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    </div>
  );
}
