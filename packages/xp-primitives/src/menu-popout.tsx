"use client";

import type { ReactNode } from "react";
import { AdaptiveOverlay, overlayIntentMatrix } from "./adaptive-overlay";
import { useDeviceClass } from "./device-class";

export type MenuItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  disabled?: boolean;
  onSelect?: () => void;
};

type MenuPopoutProperties = {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  items: MenuItem[];
  closeLabel: ReactNode;
  kind?: "menu" | "detail";
  onOpenChange?: (open: boolean) => void;
};

export function MenuPopout({ trigger, title, description, items, closeLabel, kind = "menu", onOpenChange }: MenuPopoutProperties) {
  const deviceClass = useDeviceClass();
  const presentation = overlayIntentMatrix[kind === "menu" ? "menu" : "detail"][deviceClass];
  const form = presentation.includes("sheet") ? "sheet" : "popover";
  return (
    <div data-xp-primitive="menu-popout" data-variant={form}>
      <AdaptiveOverlay intent={kind === "menu" ? "menu" : "detail"} onOpenChange={onOpenChange}>
        <AdaptiveOverlay.Trigger>{trigger}</AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content>
          <AdaptiveOverlay.Header title={title} description={description} />
          <AdaptiveOverlay.Body>
            <div className="xp-menu" role="menu">
              {items.map((item) => item.href ? (
                <a
                  className="xp-menu__item"
                  href={item.href}
                  aria-disabled={item.disabled || undefined}
                  role="menuitem"
                  data-xp-control
                  key={item.id}
                >
                  {item.icon}<span>{item.label}</span>
                </a>
              ) : (
                <button
                  className="xp-menu__item"
                  type="button"
                  disabled={item.disabled}
                  role="menuitem"
                  data-xp-control
                  onClick={item.onSelect}
                  key={item.id}
                >
                  {item.icon}<span>{item.label}</span>
                </button>
              ))}
            </div>
          </AdaptiveOverlay.Body>
          <AdaptiveOverlay.Footer>
            <AdaptiveOverlay.Close>{closeLabel}</AdaptiveOverlay.Close>
          </AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
    </div>
  );
}
