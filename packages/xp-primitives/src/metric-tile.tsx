import type { HTMLAttributes, ReactNode } from "react";

type MetricTileProperties = HTMLAttributes<HTMLElement> & {
  value: ReactNode;
  label: ReactNode;
  delta?: ReactNode;
  trend?: "up" | "down" | "flat";
  spark?: ReactNode;
};

export function MetricTile({ value, label, delta, trend = "flat", spark, className, ...properties }: MetricTileProperties) {
  return (
    <article
      {...properties}
      className={["xp-metric-slot", className].filter(Boolean).join(" ")}
      data-xp-primitive="metric-tile"
      data-trend={trend}
    >
      <div className="xp-metric-tile" data-xp-form>
        <strong className="xp-metric-tile__value" data-xp-role="stat-value">{value}</strong>
        <span className="xp-metric-tile__label" data-xp-role="label">{label}</span>
        {delta ? <span className="xp-metric-tile__delta" data-trend={trend}>{delta}</span> : null}
        {spark ? <span className="xp-metric-tile__spark" aria-hidden="true">{spark}</span> : null}
      </div>
    </article>
  );
}
