import { mkdirSync, writeFileSync } from "node:fs";
import { motionCss } from "./src/tokens";

mkdirSync(new URL("./styles/", import.meta.url), { recursive: true });
writeFileSync(new URL("./styles/motion.css", import.meta.url), motionCss());
console.log("motion: styles/motion.css generated from shared tokens");
