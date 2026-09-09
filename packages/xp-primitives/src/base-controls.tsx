"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Popover, Tooltip } from "radix-ui";

export const Control = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Control({ className, type = "button", ...properties }, reference) {
    return (
      <button
        {...properties}
        ref={reference}
        type={type}
        className={["xp-control", className].filter(Boolean).join(" ")}
        data-xp-control
      />
    );
  },
);

type AdaptiveTooltipProperties = {
  label: ReactNode;
  children: ReactNode;
};

export function AdaptiveTooltip({ label, children }: AdaptiveTooltipProperties) {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (canHover) {
    return (
      <Tooltip.Provider delayDuration={300}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="xp-tooltip" sideOffset={8}>
              {label}
              <Tooltip.Arrow className="xp-tooltip__arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="xp-tooltip" sideOffset={8}>
          {label}
          <Popover.Arrow className="xp-tooltip__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
