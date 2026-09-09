"use client";

import type { CSSProperties } from "react";
import { RadioGroup } from "radix-ui";

export type SegmentedItem = { value: string; label: string; disabled?: boolean };

type SegmentedControlProperties = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  items: SegmentedItem[];
  label: string;
  className?: string;
};

export function SegmentedControl({ value, defaultValue, onChange, items, label, className }: SegmentedControlProperties) {
  if (items.length < 2 || items.length > 5) throw new Error("SegmentedControl requires 2–5 items.");
  return (
    <RadioGroup.Root
      className={["xp-segmented", className].filter(Boolean).join(" ")}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      aria-label={label}
      data-xp-primitive="segmented-control"
      style={{ "--xp-segments": items.length } as CSSProperties}
    >
      {items.map((item) => (
        <RadioGroup.Item
          className="xp-segmented__item"
          value={item.value}
          disabled={item.disabled}
          data-xp-control
          key={item.value}
        >
          {item.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
