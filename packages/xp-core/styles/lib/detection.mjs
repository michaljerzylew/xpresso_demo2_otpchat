function nextSegment(config, segment) {
  return config.segments[config.segments.indexOf(segment) + 1];
}

function baseMedia(config, className) {
  const segment = config.segments.find((candidate) => candidate.class === className);
  if (!segment) throw new TypeError(`Unknown XP class: ${className}`);
  const next = nextSegment(config, segment);

  if (segment === config.segments[0]) return `(width < ${segment.max + 1}px)`;
  if (!next) return `(width >= ${segment.min}px)`;
  return `(${segment.min}px <= width < ${segment.max + 1}px)`;
}

export function mediaForClass(config, className) {
  const tie = config.detection.portraitCoarseTie;
  const base = baseMedia(config, className);

  if (className === tie.class) {
    return `${base}, (${tie.min}px <= width < ${tie.max + 1}px) and (orientation: portrait) and (pointer: coarse)`;
  }

  const defaultClass = config.segments.find((segment) => segment.min === tie.min)?.class;
  if (className !== defaultClass) return base;

  const segment = config.segments.find((candidate) => candidate.class === className);
  const beyondTie = `(${tie.max + 1}px <= width < ${segment.max + 1}px)`;
  const tieBand = `(${tie.min}px <= width < ${tie.max + 1}px)`;
  return [
    beyondTie,
    `${tieBand} and (orientation: landscape)`,
    `${tieBand} and (pointer: fine)`,
    `${tieBand} and (pointer: none)`,
  ].join(", ");
}

export function generateDetectionCss(config) {
  const lines = [
    "/* GENERATED from xpresso.fluid.config.json. This is the only viewport-width policy in authored core CSS. */",
    "@layer xp.shell {",
    "  @property --xp-class { syntax: \"M | TP | TL | DS | DW\"; inherits: true; initial-value: M; }",
    "  @property --xp-input { syntax: \"coarse | fine\"; inherits: true; initial-value: coarse; }",
    "  @property --xp-can-hover { syntax: \"<integer>\"; inherits: true; initial-value: 0; }",
    "  @property --xp-orient { syntax: \"portrait | landscape\"; inherits: true; initial-value: portrait; }",
    "  :root { --xp-class: M; --xp-input: coarse; --xp-can-hover: 0; --xp-orient: portrait; --tap-min: var(--tap-coarse); }",
  ];

  for (const segment of config.segments.slice(1)) {
    lines.push(`  @media ${baseMedia(config, segment.class)} { :root { --xp-class: ${segment.class}; } }`);
  }

  const tie = config.detection.portraitCoarseTie;
  lines.push(`  @media (${tie.min}px <= width < ${tie.max + 1}px) and (orientation: portrait) and (pointer: coarse) { :root { --xp-class: ${tie.class}; } }`);
  lines.push("  @media (pointer: fine) { :root { --xp-input: fine; --tap-min: var(--tap-fine); } }");
  lines.push("  @media (hover: hover) { :root { --xp-can-hover: 1; } }");
  lines.push("  @media (any-pointer: coarse) { :root { --tap-min: var(--tap-coarse); } }");
  lines.push("  @media (orientation: landscape) { :root { --xp-orient: landscape; } }");
  lines.push("}");
  return `${lines.join("\n")}\n`;
}
