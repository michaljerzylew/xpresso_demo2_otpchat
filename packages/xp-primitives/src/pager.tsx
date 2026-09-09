import { forwardRef, type HTMLAttributes } from "react";

function PagerRoot({ className, ...properties }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...properties}
      className={["xp-pager-native", className].filter(Boolean).join(" ")}
      data-xp-primitive="pager"
      data-xp-rail
      tabIndex={0}
    />
  );
}

const PagerScreen = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function PagerScreen(
  { className, ...properties },
  reference,
) {
  return <section {...properties} ref={reference} className={["xp-pager-native__screen", className].filter(Boolean).join(" ")} />;
});

export const Pager = Object.assign(PagerRoot, { Screen: PagerScreen });
