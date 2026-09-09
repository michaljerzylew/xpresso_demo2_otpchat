import { forwardRef, type ComponentPropsWithoutRef } from "react";

type AlgebraProps = ComponentPropsWithoutRef<"div">;

function primitive(displayName: string, className: string) {
  const Component = forwardRef<HTMLDivElement, AlgebraProps>(function AlgebraPrimitive(
    { className: consumerClassName, ...props },
    reference,
  ) {
    const classes = [className, consumerClassName].filter(Boolean).join(" ");
    return <div ref={reference} className={classes} {...props} />;
  });
  Component.displayName = displayName;
  return Component;
}

export const Stack = primitive("Stack", "xp-stack");
export const Box = primitive("Box", "xp-box");
export const Center = primitive("Center", "xp-center");
export const Cluster = primitive("Cluster", "xp-cluster");
export const Sidebar = primitive("Sidebar", "xp-sidebar");
export const Switcher = primitive("Switcher", "xp-switcher");
export const Cover = primitive("Cover", "xp-cover");
export const Deck = primitive("Deck", "xp-deck");
export const Frame = primitive("Frame", "xp-frame");
export const Rail = primitive("Rail", "xp-rail");
export const Pager = primitive("Pager", "xp-pager");
export const Imposter = primitive("Imposter", "xp-imposter");
