import { expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

it("accepts semantic styles and rejects literal CSS, JSX and palette utilities", () => {
  const directory = mkdtempSync(join(tmpdir(), "xp-theme-gate-"));
  const fixture = join(directory, "fixture.tsx");
  const run = (source: string) => {
    writeFileSync(fixture, source);
    return spawnSync("bash", [resolve("../../scripts/check_no_hardcoded_colors.sh"), fixture], { encoding: "utf8" });
  };
  try {
    expect(run('style={{ color: "var(--xp-ink)" }} className="bg-surface text-primary"').status).toBe(0);
    for (const source of ['color: #abc;', 'background: oklch(0.5 0.1 30);', 'color: rgb(10 20 30);', 'color: rebeccapurple;', 'style={{ color: "white" }}', 'className="hover:bg-red-500"']) {
      expect(run(source).status, source).toBe(1);
    }
  } finally { rmSync(directory, { recursive: true }); }
});
