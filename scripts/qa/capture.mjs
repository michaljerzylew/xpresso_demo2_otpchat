import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, screens, sizes, serve, prepare, runDirectory } from "./common.mjs";
import { inspectDOM, foundingFailure, focusTrap } from "./gates.mjs";
import { minimumFps, performanceGates, qaExitCode, inconclusiveMessage } from "./perf.mjs";

const consecutiveSetupFailureLimit = 5;
// A gate is NA when it does not apply to this case, and INACTIVE when it applies but observed nothing.
const notApplicable = (gate, deviceClass, motion) =>
  gate === "reducedMotion" && motion !== "reduced" ? "Only evaluated in reduced-motion runs"
  : null;
const nothingMeasured = {
  overflow: "No visible elements measured",
  tapTargets: "No enabled visible interactive elements measured",
  textSize: "No visible text or form value measured",
  missingAlt: "No visible img element measured",
  animationBudget: "No declared transition/animation duration and no active animation measured",
  reducedMotion: "No motion sample measured",
};

// A run certifies one commit, and this release already discarded a run whose build changed
// underneath it. The manifest names the revision it captured, and says when the tree carried
// uncommitted changes so a reader knows the revision alone does not describe the build (#101).
const revision = (() => {
  const cwd = dirname(fileURLToPath(import.meta.url));
  try {
    return {
      head: execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim(),
      dirty: execFileSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" }).trim().length > 0,
    };
  } catch (error) {
    return { head: null, dirty: null, revisionError: error.message };
  }
})();
const id = process.argv[2] ?? new Date().toISOString().replace(/[:.]/g, "-");
const directory = runDirectory(id);
// XP_QA_MODULES=auth,settings restricts a builder's iteration run to the listed
// registry modules. The report and manifest label such a run partial: a filtered
// run never stands in for the RULES.md section 12 registry run.
const knownModules = [...new Set(screens.map(screen => screen.module))];
const modules = process.env.XP_QA_MODULES === undefined ? null : process.env.XP_QA_MODULES.split(",").map(name => name.trim()).filter(Boolean);
const unknown = (modules ?? []).filter(name => !knownModules.includes(name));
if (unknown.length) throw new Error(`XP_QA_MODULES names unknown module(s) ${unknown.join(", ")}; known modules: ${knownModules.join(", ")}`);
if (modules && !modules.length) throw new Error(`XP_QA_MODULES is set but names no module; known modules: ${knownModules.join(", ")}`);
const selected = modules ? screens.filter(screen => modules.includes(screen.module)) : screens;
await mkdir(resolve(directory, ".."), { recursive: true });
await mkdir(directory, { recursive: false });
const server = await serve();
let browser;
const shots = [];
const cases = selected.flatMap(screen => Object.entries(sizes).flatMap(([deviceClass, size]) =>
  ["light", "dark"].flatMap(mode => screen.states.flatMap(state =>
    ["normal", "reduced"].map(motion => ({ screen, deviceClass, size, mode, state, motion }))))));
try {
  // Native scroll affordances are part of the UI under review. Headless Chrome's
  // default hiding flag otherwise makes bounded scrolling forms look clipped.
  browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
  let index = 0;
  let consecutiveSetupFailures = 0;
  for (const { screen, deviceClass, size: [width, height], mode, state, motion } of cases) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: ["M", "TP"].includes(deviceClass), colorScheme: mode, reducedMotion: motion === "reduced" ? "reduce" : "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", message => { if (message.type() === "error") errors.push(`${message.text()}${message.location()?.url ? ` [${message.location().url}]` : ""}`); });
    page.on("pageerror", error => errors.push(error.message));
    const record = { screen: screen.id, route: screen.path, module: screen.module, deviceClass, viewport: { width, height }, mode, state, motion, gates: {}, screenshots: [] };
    const prefix = `${screen.id}-${deviceClass}-${mode}-${state}-${motion}`;
    try {
      await prepare(page, server.base, screen, deviceClass, mode, state, motion);
      const { findings, measured, geometry } = await page.evaluate(inspectDOM, { deviceClass, reducedMotion: motion === "reduced" });
      record.geometry = geometry;
      record.measured = measured;
      for (const [gate, details] of Object.entries(findings)) {
        const na = notApplicable(gate, deviceClass, motion);
        record.gates[gate] = na ? { status: "NA", details: [na], measured: 0 }
          : details.length ? { status: "FAIL", details, measured: measured[gate] }
          : measured[gate] > 0 ? { status: "PASS", details: [`${measured[gate]} samples measured`], measured: measured[gate] }
          : { status: "INACTIVE", details: [nothingMeasured[gate]], measured: 0 };
      }
      // A modal is a modal whichever route opened it, so read the expectation from the rendered
      // document rather than a hand-maintained list of state names that new states fall out of.
      const openSheet = await page.locator(".workspace-sheet[open]").count() > 0;
      record.gates.focusTrap = await focusTrap(page, openSheet || await page.locator(".kit-dialog").count() > 0);
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      for (const kind of ["full-page", "first-viewport"]) {
        const file = `${prefix}-${kind}.png`;
        await page.screenshot({ path: resolve(directory, file), fullPage: kind === "full-page" });
        record.screenshots.push({ kind, file });
      }
      consecutiveSetupFailures = 0;
    } catch (error) {
      record.gates.setup = { status: "FAIL", details: [error.message] };
      consecutiveSetupFailures++;
    } finally {
      record.gates.consoleErrors = { status: errors.length ? "FAIL" : "PASS", details: errors.length ? errors : ["No console or page error during navigation, setup and capture"] };
      shots.push(record);
      await context.close();
    }
    index++;
    console.log(`[${index}/${cases.length}] ${prefix}: ${Object.values(record.gates).some(gate => gate.status === "FAIL") ? "FAIL" : "PASS"}`);
    // A broken selector otherwise burns 30s per case for the whole matrix without producing a single PNG.
    if (consecutiveSetupFailures >= consecutiveSetupFailureLimit) throw new Error(`Aborted after ${consecutiveSetupFailures} consecutive setup failures; the harness cannot drive the app. Last error: ${record.gates.setup.details[0]}`);
  }
  for (const record of shots) {
    const wide = shots.find(other => other.screen === record.screen && other.deviceClass === "DW" && other.mode === record.mode && other.state === record.state && other.motion === record.motion);
    record.gates.foundingFailure = record.deviceClass !== "M" ? { status: "NA", details: ["Detector compares the M form against its matching DW form"] }
      : foundingFailure(record.geometry, wide?.geometry);
    // PASS/FAIL is the actionable axis; the gates that observed nothing are reported separately so a
    // clean case never implies that every check actually ran.
    record.status = Object.values(record.gates).some(gate => gate.status === "FAIL") ? "FAIL" : "PASS";
    record.inactiveGates = Object.entries(record.gates).filter(([, gate]) => gate.status === "INACTIVE").map(([name]) => name);
    // One JSON sidecar for each actual PNG, plus all records in the manifest (including setup failures).
    for (const shot of record.screenshots) await writeFile(resolve(directory, shot.file.replace(/\.png$/, ".json")), JSON.stringify({ ...record, shot }, null, 2) + "\n");
  }
  // Match standalone perf's browser lifetime: a large screenshot matrix must not
  // leave hundreds of prior contexts in the process used for the benchmark.
  await browser.close();
  browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
  const performance = await performanceGates(browser, server.base);
  await writeFile(resolve(directory, "perf.json"), JSON.stringify(performance, null, 2) + "\n");
  const manifest = { id, createdAt: new Date().toISOString(), revision: revision.head, dirty: revision.dirty, base: server.base, browser: browser.version(), partial: Boolean(modules), modules: modules ?? knownModules, cases: cases.length, shots, performance };
  await writeFile(resolve(directory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  const gateNames = [...new Set(shots.flatMap(record => Object.keys(record.gates)))];
  const tally = status => gateNames.map(gate => [gate, shots.filter(record => record.gates[gate]?.status === status).length]);
  const lines = [`# QA report: ${id}`, "",
    ...(modules ? [`PARTIAL RUN: XP_QA_MODULES=${modules.join(",")} captured ${selected.length} of ${screens.length} registry screens. This is a builder iteration run, not the RULES.md section 12 registry run; the qualifying run for a PR and the reviewer's run are unfiltered.`, ""] : []),
    `${shots.length} of ${cases.length} planned state/class/mode/motion cases; ${shots.reduce((sum, shot) => sum + shot.screenshots.length, 0)} PNGs. Chrome ${browser.version()}.`,
    `Case verdicts: ${shots.filter(record => record.status === "PASS").length} PASS, ${shots.filter(record => record.status === "FAIL").length} FAIL. ${shots.filter(record => record.inactiveGates?.length).length} cases carry at least one INACTIVE gate: it applied but observed nothing, and is never counted as a pass.`, "",
    "| Screen | Class | PASS | FAIL | Min elements | Failed gates | Inactive gates |", "|---|---|---:|---:|---:|---|---|"];
  for (const screen of selected) for (const deviceClass of Object.keys(sizes)) {
    const records = shots.filter(shot => shot.screen === screen.id && shot.deviceClass === deviceClass);
    if (!records.length) continue;
    const failed = [...new Set(records.flatMap(record => Object.entries(record.gates).filter(([, gate]) => gate.status === "FAIL").map(([name]) => name)))];
    const inactive = [...new Set(records.flatMap(record => record.inactiveGates ?? []))];
    const elements = records.map(record => record.measured?.elements ?? 0);
    lines.push(`| ${screen.id} | ${deviceClass} | ${records.filter(record => record.status === "PASS").length} | ${records.filter(record => record.status === "FAIL").length} | ${Math.min(...elements)} | ${failed.join(", ") || "none"} | ${inactive.join(", ") || "none"} |`);
  }
  lines.push("", "## Gate activity (cases per status)", "", "| Gate | PASS | FAIL | INACTIVE | NA |", "|---|---:|---:|---:|---:|");
  for (const gate of gateNames) {
    const count = status => shots.filter(record => record.gates[gate]?.status === status).length;
    lines.push(`| ${gate} | ${count("PASS")} | ${count("FAIL")} | ${count("INACTIVE")} | ${count("NA")} |`);
  }
  lines.push("", `## Performance (4x CPU throttle, active windows only, minimum ${minimumFps} fps)`, "", "Route PASS gates warmed navigation after a measured cold Inbox visit and warm-up Overview return. Both diagnostic windows have their own verdict below and are excluded from the warmed aggregate/median. Loaded repetitions are INCONCLUSIVE; at least two conclusive repetitions are required for PASS certification (a single conclusive FAIL decides the result). A warmed PASS never certifies cold cadence.", "", "| Interaction | FPS | Windows | Frames | Active ms | Status | Details |", "|---|---:|---:|---:|---:|---|---|");
  for (const result of performance) lines.push(`| ${result.interaction} | ${result.fps ?? "unmeasured"} | ${result.windows?.length ?? 0} | ${result.frames ?? 0} | ${result.activeMs ?? 0} | ${result.status} | ${result.details} |`);
  for (const result of performance) for (const run of result.runs) {
    lines.push(`| ${result.interaction} run ${run.run} host | | | | | ${run.status} | Before: ${JSON.stringify(run.host.before)}; After: ${JSON.stringify(run.host.after)}; ${run.reason ?? "quiet host"} |`);
    for (const window of [run.coldWindow, run.warmupWindow].filter(Boolean)) lines.push(`| ${result.interaction} run ${run.run} diagnostic | ${window.fps} | 1 | ${window.frames} | ${window.elapsedMs} | ${window.status} | ${window.label}; ${window.dropped ?? "unmeasured"} dropped; excluded from warmed aggregate/median |`);
    const worst = run.windows.filter(window => window.status !== "INACTIVE").sort((a, b) => b.dropped - a.dropped || a.fps - b.fps)[0];
    lines.push(`| ${result.interaction} run ${run.run}${run.run === result.medianRun ? " (median)" : ""} | ${run.fps ?? "unmeasured"} | ${run.windows.length} | ${run.frames} | ${run.activeMs} | ${run.status} | Worst: ${worst ? `${worst.label}, ${worst.fps} fps, ${worst.dropped} dropped` : "unmeasured"}; ${run.host.before.uptime} → ${run.host.after.uptime} |`);
    for (const window of run.windows) lines.push(`| ${result.interaction} run ${run.run} window ${window.index} | ${window.fps} | 1 | ${window.frames} | ${window.elapsedMs} | ${window.status} | ${window.label}; ${window.dropped ?? "unmeasured"} dropped |`);
  }
  lines.push("", "## Defects", "");
  for (const record of shots) for (const [gate, result] of Object.entries(record.gates)) if (result.status === "FAIL") lines.push(`- ${record.screen}/${record.deviceClass}/${record.mode}/${record.state}/${record.motion}: **${gate}**: ${result.details.join("; ").replace(/\n/g, " ")}`);
  lines.push("", "## Inactive gates (observed nothing; never counted as a pass)", "");
  for (const [gate, count] of tally("INACTIVE")) if (count) lines.push(`- **${gate}**: INACTIVE in ${count} cases: ${shots.find(record => record.gates[gate]?.status === "INACTIVE").gates[gate].details.join("; ")}`);
  await writeFile(resolve(directory, "qa-report.md"), lines.join("\n") + "\n");
  console.log(`Report: ${directory}/qa-report.md`);
  process.exitCode = qaExitCode(performance, shots.some(record => record.status === "FAIL"));
  if (performance.some(result => result.status === "INCONCLUSIVE")) console.error(inconclusiveMessage);
} finally {
  await browser?.close();
  await server.close();
}
