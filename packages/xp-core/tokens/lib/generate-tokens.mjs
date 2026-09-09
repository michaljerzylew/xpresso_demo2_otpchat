const CAPS = { flat: 1.15, gentle: 1.5, steep: 2.5 };

const round4 = (number) => Math.round(number * 10000) / 10000;

const tokenStep = (step) => (step < 0 ? `-${Math.abs(step)}` : String(step));

function toRem(px, remBase) {
  return round4(px / remBase);
}

function fluid(wMin, vMin, wMax, vMax, unit, remBase) {
  const slope = (vMax - vMin) / (wMax - wMin);
  const intercept = vMin - slope * wMin;
  const low = Math.min(vMin, vMax);
  const high = Math.max(vMin, vMax);

  if (Math.abs(vMax - vMin) < 0.01) return `${toRem(vMin, remBase)}rem`;
  return `clamp(${toRem(low, remBase)}rem, ${toRem(intercept, remBase)}rem + ${round4(slope * 100)}${unit}, ${toRem(high, remBase)}rem)`;
}

export function validateConfig(config) {
  const errors = [];
  const segments = config.segments;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const pole = config.type.poles[segment.class];
    const next = segments[index + 1];

    if (!pole) {
      errors.push(`type poles: missing class ${segment.class}`);
      continue;
    }

    for (const step of config.type.steps) {
      const min = pole.min.size * Math.pow(pole.min.ratio, step);
      const max = pole.max.size * Math.pow(pole.max.ratio, step);
      const slopeClass = config.type.slopeClass[String(step)];
      const ratio = Math.max(min, max) / Math.min(min, max);

      if (!CAPS[slopeClass]) errors.push(`slope class: text-step-${step} has unknown class ${slopeClass}`);
      if (CAPS[slopeClass] && ratio > CAPS[slopeClass]) {
        errors.push(`wcag/slope: text-step-${step} in ${segment.class}: ${min.toFixed(1)}→${max.toFixed(1)} = ${ratio.toFixed(2)}× > ${slopeClass} cap ${CAPS[slopeClass]}`);
      }
      if (ratio > 2.5) errors.push(`wcagViolation: text-step-${step} in ${segment.class} exceeds 2.5×`);

      if (next) {
        const nextPole = config.type.poles[next.class];
        const nextMin = nextPole.min.size * Math.pow(nextPole.min.ratio, step);
        if (Math.abs(nextMin - max) > 0.05) {
          errors.push(`continuity: text-step-${step} ${segment.class}.max=${max.toFixed(2)} ≠ ${next.class}.min=${nextMin.toFixed(2)}`);
        }
      }
    }

    const [spaceMin, spaceMax] = config.space.unit[segment.class];
    if (spaceMax < spaceMin) errors.push(`monotone: space unit shrinks inside ${segment.class}`);
    if (next && config.space.unit[next.class][0] !== spaceMax) {
      errors.push(`continuity: space unit ${segment.class}.max=${spaceMax} ≠ ${next.class}.min=${config.space.unit[next.class][0]}`);
    }

    for (const [role, mapping] of Object.entries(config.roles)) {
      if (role === "$doc") continue;
      const step = mapping[segment.class];
      if (step === undefined) {
        errors.push(`role ${role}: missing class ${segment.class}`);
        continue;
      }
      if (next && mapping[next.class] < step) {
        errors.push(`role ${role}: step falls ${segment.class}->${next.class} (must be monotone)`);
      }
    }
  }

  return errors;
}

function declarationsForSegment(config, segment) {
  const declarations = {};
  const pole = config.type.poles[segment.class];
  const [spaceMin, spaceMax] = config.space.unit[segment.class];
  const [radiusMin, radiusMax] = config.radius.unit[segment.class];

  for (const step of config.type.steps) {
    const min = pole.min.size * Math.pow(pole.min.ratio, step);
    const max = pole.max.size * Math.pow(pole.max.ratio, step);
    declarations[`--text-step-${tokenStep(step)}`] = fluid(segment.min, min, segment.max, max, "cqi", config.remBase);
    declarations[`--text-step-${tokenStep(step)}-vi`] = fluid(segment.min, min, segment.max, max, "vi", config.remBase);
  }

  for (const [name, multiplier] of Object.entries(config.space.scale)) {
    declarations[`--space-${name}`] = fluid(segment.min, spaceMin * multiplier, segment.max, spaceMax * multiplier, "cqi", config.remBase);
    declarations[`--space-${name}-vi`] = fluid(segment.min, spaceMin * multiplier, segment.max, spaceMax * multiplier, "vi", config.remBase);
    declarations[`--space-${name}-d`] = `calc(var(--space-${name}) * var(--xp-density-factor, 1))`;
  }

  for (const [from, to] of config.space.pairs) {
    declarations[`--space-${from}-${to}`] = fluid(
      segment.min,
      spaceMin * config.space.scale[from],
      segment.max,
      spaceMax * config.space.scale[to],
      "cqi",
      config.remBase,
    );
  }

  for (const [role, mapping] of Object.entries(config.roles)) {
    if (role === "$doc") continue;
    declarations[`--role-${role}`] = `var(--text-step-${tokenStep(mapping[segment.class])})`;
  }

  for (const [name, multiplier] of Object.entries(config.radius.scale)) {
    declarations[`--radius-${name}`] = fluid(segment.min, radiusMin * multiplier, segment.max, radiusMax * multiplier, "cqi", config.remBase);
  }

  return declarations;
}

function cssBlock(selector, declarations, indent = "  ") {
  const body = Object.entries(declarations)
    .map(([name, value]) => `${indent}  ${name}: ${value};`)
    .join("\n");
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

function staticDeclarations(config) {
  const slotTokens = Object.fromEntries([
    ...Object.entries(config.slots.root).map(([name, value]) => [`--slot-${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`, `${value}rem`]),
    ...Object.entries(config.slots.inner).map(([name, value]) => [`--tile-${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`, `${value}rem`]),
  ]);

  return {
    "--measure-narrow": `${config.measure.narrow}ch`,
    "--measure-body": `${config.measure.body}ch`,
    "--measure-wide": `${config.measure.wide}ch`,
    "--tap-coarse": `${config.floors.tapCoarse}px`,
    "--tap-fine": `${config.floors.tapFine}px`,
    "--tap-min": "var(--tap-coarse)",
    "--gap-min": `${config.floors.gapMin}px`,
    "--xp-density-factor": "1",
    ...slotTokens,
    ...Object.fromEntries(
      Object.entries(config.rails ?? {})
        .filter(([name]) => name !== "$doc")
        .map(([name, value]) => [`--rail-${name}`, `${value}rem`]),
    ),
  };
}

function buildRuntimeCss(config, segments) {
  let css = "/* GENERATED by @xp/core tokens/build-tokens.mjs. Do not edit. */\n@layer xp.shell {\n";
  css += `${cssBlock(":root", { ...staticDeclarations(config), ...segments[0].declarations })}\n`;

  for (const segment of segments.slice(1)) {
    const media = segment.max >= 2000
      ? `(width >= ${segment.min}px)`
      : `(${segment.min}px <= width < ${segment.max + 1}px)`;
    css += `  @media ${media} {\n${cssBlock(":root", segment.declarations, "    ")}\n  }\n`;
  }

  for (const [mode, multiplier] of Object.entries(config.density.modes)) {
    css += `  [data-xp-density="${mode}"] { --xp-density-factor: ${multiplier}; }\n`;
  }

  css += "}\n";
  return css;
}

function buildTailwindTheme(config) {
  let css = "/* GENERATED Tailwind v4 theme twin. Runtime values remain owned by xp-tokens.css. */\n@theme inline {\n";
  for (const step of config.type.steps) {
    const name = tokenStep(step);
    css += `  --text-step-${name}: var(--text-step-${name});\n`;
  }
  for (const [role] of Object.entries(config.roles)) {
    if (role !== "$doc") css += `  --text-role-${role}: var(--role-${role});\n`;
  }
  for (const name of Object.keys(config.space.scale)) css += `  --spacing-${name}: var(--space-${name});\n`;
  for (const [from, to] of config.space.pairs) css += `  --spacing-${from}-${to}: var(--space-${from}-${to});\n`;
  for (const name of Object.keys(config.radius.scale)) css += `  --radius-${name}: var(--radius-${name});\n`;
  css += "}\n";
  return css;
}

export function generateTokens(config) {
  const errors = validateConfig(config);
  if (errors.length > 0) return { errors, runtimeCss: "", tailwindCss: "", segments: [] };

  const segments = config.segments.map((segment) => ({
    ...segment,
    declarations: declarationsForSegment(config, segment),
  }));

  return {
    errors: [],
    runtimeCss: buildRuntimeCss(config, segments),
    tailwindCss: buildTailwindTheme(config),
    segments,
  };
}
