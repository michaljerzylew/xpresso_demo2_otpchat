"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Dialog, Popover } from "radix-ui";
import { Drawer } from "vaul";
import { useDeviceClass, useDeviceClassLock, type DeviceClass } from "./device-class";

export type OverlayIntent = "confirm" | "pick" | "edit" | "search" | "inspect" | "detail" | "menu";
export type OverlayPresentation =
  | "action-sheet"
  | "bottom-sheet"
  | "sheet"
  | "dialog"
  | "popover"
  | "dropdown"
  | "full-screen"
  | "side-drawer"
  | "pane"
  | "inspector-pane";

export const overlayIntentMatrix: Record<OverlayIntent, Record<DeviceClass, OverlayPresentation>> = {
  confirm: { M: "action-sheet", TP: "action-sheet", TL: "dialog", DS: "dialog", DW: "dialog" },
  pick: { M: "bottom-sheet", TP: "bottom-sheet", TL: "popover", DS: "popover", DW: "popover" },
  edit: { M: "full-screen", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" },
  search: { M: "full-screen", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" },
  inspect: { M: "bottom-sheet", TP: "sheet", TL: "side-drawer", DS: "pane", DW: "inspector-pane" },
  detail: { M: "bottom-sheet", TP: "sheet", TL: "side-drawer", DS: "pane", DW: "inspector-pane" },
  menu: { M: "bottom-sheet", TP: "popover", TL: "popover", DS: "dropdown", DW: "dropdown" },
};

type OverlayMode = "sheet" | "popover" | "dialog";
export type OverlayDismissReason = "close" | "escape" | "scrim" | "swipe" | "programmatic";
type OverlayContextValue = {
  modal: boolean;
  mode: OverlayMode;
  presentation: OverlayPresentation;
  keyboardInset: number;
  portalContainer?: HTMLElement | null;
  markDismiss: (reason: OverlayDismissReason) => void;
  requestClose: (reason?: OverlayDismissReason) => void;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

function overlayMode(presentation: OverlayPresentation): OverlayMode {
  if (["action-sheet", "bottom-sheet", "sheet"].includes(presentation)) return "sheet";
  if (["popover", "dropdown"].includes(presentation)) return "popover";
  return "dialog";
}

type AdaptiveOverlayRootProperties = {
  intent: OverlayIntent;
  presentation?: Partial<Record<DeviceClass, OverlayPresentation>>;
  why?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismissReason?: (reason: OverlayDismissReason) => void;
  dirty?: boolean;
  onDismissRequest?: (close: () => void) => void;
  portalContainer?: HTMLElement | null;
  modal?: boolean;
  children: ReactNode;
};

function AdaptiveOverlayRoot({
  intent,
  presentation: overrides,
  why,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onDismissReason,
  dirty = false,
  onDismissRequest,
  portalContainer,
  modal = true,
  children,
}: AdaptiveOverlayRootProperties) {
  const deviceClass = useDeviceClass();
  const presentation = overrides?.[deviceClass] ?? overlayIntentMatrix[intent][deviceClass];
  if (overrides?.[deviceClass] && (!why || why.trim().length < 12)) {
    throw new Error("AdaptiveOverlay presentation overrides require a written why (12+ characters).");
  }
  const mode = overlayMode(presentation);
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const pendingDismissReason = useRef<OverlayDismissReason | null>(null);
  const open = controlledOpen ?? localOpen;
  useDeviceClassLock(open);
  const markDismiss = useCallback((reason: OverlayDismissReason) => {
    pendingDismissReason.current = reason;
  }, []);
  const commitOpen = useCallback((next: boolean) => {
    if (controlledOpen === undefined) setLocalOpen(next);
    if (!next) {
      const reason = pendingDismissReason.current ?? (mode === "sheet" ? "swipe" : "programmatic");
      pendingDismissReason.current = null;
      onDismissReason?.(reason);
    }
    onOpenChange?.(next);
  }, [controlledOpen, mode, onDismissReason, onOpenChange]);
  const forceClose = useCallback(() => commitOpen(false), [commitOpen]);
  const requestClose = useCallback((reason: OverlayDismissReason = "programmatic") => {
    if (!pendingDismissReason.current) markDismiss(reason);
    if (dirty) {
      onDismissRequest?.(forceClose);
      return;
    }
    forceClose();
  }, [dirty, forceClose, markDismiss, onDismissRequest]);
  const setOpen = useCallback((next: boolean) => {
    if (next) commitOpen(true);
    else requestClose(mode === "sheet" ? "swipe" : "programmatic");
  }, [commitOpen, mode, requestClose]);

  useEffect(() => {
    if (!open || !window.visualViewport) {
      setKeyboardInset(0);
      return;
    }
    const viewport = window.visualViewport;
    const update = () => setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);

  const context = useMemo(
    () => ({ modal, mode, presentation, keyboardInset, portalContainer, markDismiss, requestClose }),
    [keyboardInset, markDismiss, modal, mode, portalContainer, presentation, requestClose],
  );
  const content = <OverlayContext.Provider value={context}>{children}</OverlayContext.Provider>;

  if (mode === "sheet") {
    if (presentation === "action-sheet") {
      return (
        <Drawer.Root open={open} onOpenChange={setOpen} modal={modal} container={portalContainer} autoFocus>
          {content}
        </Drawer.Root>
      );
    }
    return (
      <Drawer.Root open={open} onOpenChange={setOpen} modal={modal} container={portalContainer} autoFocus>
        {content}
      </Drawer.Root>
    );
  }
  if (mode === "popover") {
    return <Popover.Root open={open} onOpenChange={setOpen}>{content}</Popover.Root>;
  }
  return <Dialog.Root open={open} onOpenChange={setOpen} modal={modal}>{content}</Dialog.Root>;
}

function useOverlayContext() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("AdaptiveOverlay compound components must be inside AdaptiveOverlay.");
  return context;
}

function AdaptiveOverlayTrigger({ children, className, type = "button", ...properties }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { mode } = useOverlayContext();
  const trigger = (
    <button
      {...properties}
      type={type}
      className={["xp-control", "xp-overlay-trigger", className].filter(Boolean).join(" ")}
      data-xp-control
    >
      {children}
    </button>
  );
  if (mode === "sheet") return <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>;
  if (mode === "popover") return <Popover.Trigger asChild>{trigger}</Popover.Trigger>;
  return <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>;
}

function AdaptiveOverlayAnchor({ children }: { children: ReactElement }) {
  const { mode } = useOverlayContext();
  return mode === "popover" ? <Popover.Anchor asChild>{children}</Popover.Anchor> : children;
}

function AdaptiveOverlayContent({ children, className, style, ...properties }: HTMLAttributes<HTMLDivElement>) {
  const { keyboardInset, markDismiss, modal, mode, portalContainer, presentation } = useOverlayContext();
  const shared = {
    ...properties,
    className: ["xp-overlay", className].filter(Boolean).join(" "),
    style: { ...style, "--xp-keyboard-inset": `${keyboardInset}px` } as CSSProperties,
    "data-xp-overlay": "",
    "data-presentation": presentation,
    "data-xp-primitive": "adaptive-overlay",
  };

  if (mode === "sheet") {
    return (
      <Drawer.Portal>
        {modal ? <Drawer.Overlay className="xp-overlay-backdrop" onClick={() => markDismiss("scrim")} /> : null}
        <Drawer.Content {...shared} onEscapeKeyDown={() => markDismiss("escape")}>
          <div className="xp-overlay-handle" aria-hidden="true">
            <span className="xp-overlay-handle-rail" />
          </div>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    );
  }
  if (mode === "popover") {
    return (
      <Popover.Portal container={portalContainer}>
        <Popover.Content {...shared} sideOffset={8} collisionPadding={16} sticky="always">
          {children}
          <Popover.Arrow className="xp-overlay-arrow" />
        </Popover.Content>
      </Popover.Portal>
    );
  }
  return (
    <Dialog.Portal container={portalContainer}>
      {modal ? <Dialog.Overlay className="xp-overlay-backdrop" onClick={() => markDismiss("scrim")} /> : null}
      <Dialog.Content {...shared} onEscapeKeyDown={() => markDismiss("escape")} onPointerDownOutside={() => markDismiss("scrim")}>{children}</Dialog.Content>
    </Dialog.Portal>
  );
}

function AdaptiveOverlayHeader({ title, description, closeLabel }: { title: ReactNode; description?: ReactNode; closeLabel?: ReactNode }) {
  const { mode } = useOverlayContext();
  const close = closeLabel ? (
    <AdaptiveOverlayClose className="xp-overlay-header-close">
      <span aria-hidden="true">×</span>
      <span className="xp-visually-hidden">{closeLabel}</span>
    </AdaptiveOverlayClose>
  ) : null;
  if (mode === "sheet") {
    return (
      <header className="xp-overlay-header">
        <Drawer.Title className="xp-overlay-title">{title}</Drawer.Title>
        {description ? <Drawer.Description className="xp-overlay-description">{description}</Drawer.Description> : null}
        {close}
      </header>
    );
  }
  if (mode === "dialog") {
    return (
      <header className="xp-overlay-header">
        <Dialog.Title className="xp-overlay-title">{title}</Dialog.Title>
        {description ? <Dialog.Description className="xp-overlay-description">{description}</Dialog.Description> : null}
        {close}
      </header>
    );
  }
  return (
    <header className="xp-overlay-header">
      <h2 className="xp-overlay-title">{title}</h2>
      {description ? <p className="xp-overlay-description">{description}</p> : null}
      {close}
    </header>
  );
}

function AdaptiveOverlayBody({ className, ...properties }: HTMLAttributes<HTMLDivElement>) {
  return <div {...properties} className={["xp-overlay-body", className].filter(Boolean).join(" ")} />;
}

function AdaptiveOverlayFooter({ className, ...properties }: HTMLAttributes<HTMLElement>) {
  return <footer {...properties} className={["xp-overlay-footer", className].filter(Boolean).join(" ")} />;
}

function AdaptiveOverlayClose({ children, className, type = "button", ...properties }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { requestClose } = useOverlayContext();
  const { onClick } = properties;
  return (
    <button
      {...properties}
      type={type}
      className={["xp-control", className].filter(Boolean).join(" ")}
      data-xp-control
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) requestClose("close");
      }}
    >
      {children}
    </button>
  );
}

export const AdaptiveOverlay = Object.assign(AdaptiveOverlayRoot, {
  Trigger: AdaptiveOverlayTrigger,
  Anchor: AdaptiveOverlayAnchor,
  Content: AdaptiveOverlayContent,
  Header: AdaptiveOverlayHeader,
  Body: AdaptiveOverlayBody,
  Footer: AdaptiveOverlayFooter,
  Close: AdaptiveOverlayClose,
});

export const BottomSheet = Drawer;
