import type { HTMLAttributes, ReactNode } from "react";

export type StickyActionBarPlacement = "page" | "overlay" | "local";

export type StickyActionBarProperties = HTMLAttributes<HTMLElement> & {
  summary?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  placement?: StickyActionBarPlacement;
};

export function StickyActionBar({
  summary,
  primary,
  secondary,
  placement = "page",
  className,
  ...properties
}: StickyActionBarProperties) {
  return (
    <aside
      {...properties}
      className={["xp-sticky-action", className].filter(Boolean).join(" ")}
      data-xp-primitive="sticky-action-bar"
      data-placement={placement}
      data-xp-region-request={placement === "page" ? "bottom" : undefined}
    >
      {summary ? <div className="xp-sticky-action__summary">{summary}</div> : null}
      <div className="xp-sticky-action__actions">
        {secondary}
        {primary}
      </div>
    </aside>
  );
}
