export const easing = {
  out: "cubic-bezier(0.23,1,0.32,1)",
  inOut: "cubic-bezier(0.77,0,0.175,1)",
  drawer: "cubic-bezier(0.32,0.72,0,1)",
} as const;

export const duration = { press: 120, ui: 200, surface: 320, launch: 600 } as const;

export const motionTokens = {
  "--xp-ease-out": easing.out,
  "--xp-ease-in-out": easing.inOut,
  "--xp-ease-drawer": easing.drawer,
  "--xp-dur-press": `${duration.press}ms`,
  "--xp-dur-ui": `${duration.ui}ms`,
  "--xp-dur-surface": `${duration.surface}ms`,
  "--xp-dur-launch": `${duration.launch}ms`,
} as const;

export function motionCss() {
  return `/* Generated from src/tokens.ts. */\n:root {\n${Object.entries(motionTokens).map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\n`;
}
