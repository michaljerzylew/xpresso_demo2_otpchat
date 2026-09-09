import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { chromium, screens, qa, sizes, serve, prepare, runDirectory, waitForOverlayRest, navigationFor } from "./common.mjs";

export const minimumFps = 58;
export function withVerdict(windows) {
  return windows.map(window => {
    if (window.frames < 4 || !(window.elapsedMs > 0)) return { ...window, fps: null, status: "INACTIVE" };
    const fps = (window.frames - 1) * 1000 / window.elapsedMs;
    const expectedIntervals = Math.round(window.elapsedMs / 16.667);
    const measuredIntervals = window.frames - 1;
    const dropped = expectedIntervals - measuredIntervals;
    return { ...window, expectedIntervals, measuredIntervals, dropped, fps: Math.round(fps * 100) / 100, status: Number.isFinite(dropped) && dropped <= 1 ? "PASS" : "FAIL" };
  });
}

export function repeatCount(value = 3) {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 1 || count % 2 !== 1) throw new Error("--repeat must be a positive odd integer (at least 2 conclusive repetitions required for certification)");
  return count;
}

export function medianRun(runs) {
  const conclusive = runs.filter(run => run.status !== "INCONCLUSIVE");
  const failed = conclusive.find(run => run.status === "FAIL");
  // One proven failure is decisive; the minimum-two rule only permits certification.
  if (failed) return { ...failed, medianRun: null, failedRun: failed.run, runs, details: `failure in run ${failed.run}; ${conclusive.length}/${runs.length} conclusive; ${failed.details}` };
  if (conclusive.length < 2) return { interaction: runs[0]?.interaction, cpuThrottle: 4, fps: null, windows: [], status: "INCONCLUSIVE", medianRun: null, runs, details: `${conclusive.length}/${runs.length} conclusive repetitions; at least 2 required` };
  // Invalid probes sort below measured runs; never silently discard one or replace it with a retry.
  const sorted = [...conclusive].sort((a, b) => (a.measuredFps ?? a.fps ?? -Infinity) - (b.measuredFps ?? b.fps ?? -Infinity) || a.run - b.run);
  if (sorted.length % 2 === 0) {
    const middle = sorted.slice(sorted.length / 2 - 1, sorted.length / 2 + 1);
    const values = middle.map(run => run.measuredFps ?? run.fps);
    const measuredFps = values.every(value => Number.isFinite(value)) ? (values[0] + values[1]) / 2 : null;
    const windows = middle.flatMap(run => run.windows ?? []);
    const windowPass = middle.every(run => run.windows?.length
      ? run.windows.some(window => window.status === "PASS") && run.windows.every(window => ["PASS", "INACTIVE"].includes(window.status))
      : run.status === "PASS");
    return { interaction: runs[0]?.interaction, cpuThrottle: 4, measuredFps, fps: measuredFps === null ? null : Math.round(measuredFps * 100) / 100,
      windows, status: measuredFps !== null && measuredFps >= minimumFps && windowPass ? "PASS" : "FAIL", medianRun: null, medianRuns: middle.map(run => run.run), runs,
      details: `median of conclusive runs ${middle.map(run => run.run).join(" and ")}; mean unrounded FPS, both central runs' window gates; ${conclusive.length}/${runs.length} conclusive` };
  }
  const median = sorted[Math.floor(sorted.length / 2)];
  return { ...median, medianRun: median.run, runs, details: `median run ${median.run}; ${conclusive.length}/${runs.length} conclusive; ${median.details}` };
}

export function chromeCounts(output, ownBrowserPid) {
  const processes = output.split("\n").flatMap(line => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
    return match ? [{ pid: Number(match[1]), ppid: Number(match[2]), command: match[3] }] : [];
  });
  const own = new Set([ownBrowserPid]);
  for (let previous = -1; previous !== own.size;) {
    previous = own.size;
    for (const process of processes) if (own.has(process.ppid)) own.add(process.pid);
  }
  const others = processes.filter(process => !own.has(process.pid) && /chrome|chromium/i.test(process.command));
  return { otherChromeProcesses: others.length, otherChromeBrowserProcesses: others.filter(process => /(?:^|\/)(?:Google Chrome(?: for Testing)?|Chromium|chrome|chromium|chromium-browser|chrome-headless-shell)$/i.test(process.command)).length };
}

export function hostSnapshot(ownBrowserPid) {
  return { at: new Date().toISOString(), loadavg: os.loadavg(), cores: os.cpus().length, freeMemoryBytes: os.freemem(),
    ...chromeCounts(execFileSync("ps", ["-axo", "pid=,ppid=,comm="], { encoding: "utf8" }), ownBrowserPid),
    uptime: execFileSync("uptime", { encoding: "utf8" }).trim() };
}

export function classifyRepetition(result, host) {
  // Functional/setup catches have no cadence measurement. Host load cannot excuse them.
  if (!Number.isFinite(result.fps) || !result.windows.length) return { ...result, host };
  const reasons = [];
  if (host.before.loadavg[0] > host.before.cores * 0.6) reasons.push(`1-minute load ${host.before.loadavg[0]} exceeds cores * 0.6 (${host.before.cores * 0.6})`);
  if (host.before.otherChromeBrowserProcesses > 1) reasons.push(`${host.before.otherChromeBrowserProcesses} other Chrome/Chromium browser processes exceeds 1`);
  if (!reasons.length) return { ...result, host };
  const mark = window => window && ({ ...window, status: "INCONCLUSIVE" });
  return { ...result, host, status: "INCONCLUSIVE", reason: reasons.join("; "), details: `${reasons.join("; ")}; ${result.details}`,
    windows: result.windows.map(mark), coldWindow: mark(result.coldWindow), warmupWindow: mark(result.warmupWindow) };
}

export const inconclusiveMessage = "cadence not certified on this host: rerun perf on a quiet host before merge";
export function qaExitCode(performance, domFailed = false) {
  if (domFailed || performance.some(result => !["PASS", "INCONCLUSIVE"].includes(result.status))) return 1;
  return performance.some(result => result.status === "INCONCLUSIVE") ? 2 : 0;
}
/** Fewer than four frames cannot support a stable cadence verdict. */
export function summarise(interaction, windows, note) {
  const measured = windows.filter(window => window.status !== "INACTIVE");
  const frames = measured.reduce((sum, window) => sum + window.frames, 0);
  const activeMs = Math.round(measured.reduce((sum, window) => sum + window.elapsedMs, 0) * 100) / 100;
  if (!measured.length || !(activeMs > 0)) return { interaction, cpuThrottle: 4, fps: null, frames, activeMs, windows, status: "INACTIVE", details: `No active window supplied at least four valid frames; ${note}` };
  const measuredFps = (frames - measured.length) * 1000 / measured.reduce((sum, window) => sum + window.elapsedMs, 0);
  const fps = Math.round(measuredFps * 100) / 100;
  const worst = measured.reduce((slowest, window) => window.fps < slowest.fps ? window : slowest);
  return { interaction, cpuThrottle: 4, fps, measuredFps, frames, activeMs, windows, status: measured.every(window => window.status === "PASS") && measuredFps >= minimumFps ? "PASS" : "FAIL", details: `${measured.length} active windows, ${windows.length - measured.length} INACTIVE windows, ${activeMs}ms measured, no fixed settle padding; bounded two-frame quiet tail; slowest window ${worst.fps} fps (${worst.label}); ${note}` };
}

// Installed before any script runs: brackets each measured window and samples requestAnimationFrame only inside it.
export function instrument() {
  const state = { windows: [], current: null, lastMutation: 0, observer: null };
  const observe = () => {
    // The init script runs before <html> exists, so the observer attaches on first use.
    if (!state.observer) state.observer = new MutationObserver(() => { state.lastMutation = performance.now(); });
    state.observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  };
  state.start = (label, trackSelector) => {
    if (state.current) throw new Error("Overlapping measurement windows");
    observe();
    const window_ = { label, times: [], offsets: [] };
    state.current = window_;
    const tick = time => {
      if (state.current !== window_) return;
      window_.times.push(time);
      // Sampling the tracked surface every frame proves the interaction actually moved something.
      if (trackSelector) { const box = document.querySelector(trackSelector)?.getBoundingClientRect(); if (box) window_.offsets.push(box.top); }
      window_.handle = requestAnimationFrame(tick);
    };
    window_.handle = requestAnimationFrame(tick);
  };
  state.end = () => {
    const window_ = state.current;
    state.current = null;
    if (!window_) return;
    cancelAnimationFrame(window_.handle);
    const times = window_.times;
    const elapsedMs = times.length >= 2 ? times.at(-1) - times[0] : 0;
    const displacement = window_.offsets.length ? Math.max(...window_.offsets) - Math.min(...window_.offsets) : 0;
    state.windows.push({ index: state.windows.length + 1, label: window_.label, frames: times.length, elapsedMs: Math.round(elapsedMs * 100) / 100, displacementPx: Math.round(displacement * 10) / 10, frameTimes: times });
  };
  state.settled = frames => state.lastMutation && performance.now() - state.lastMutation > frames * 17;
  window.__qaPerf = state;
}

/**
 * One window per route change: it opens on the click and closes as soon as the new route's own H1 is in the
 * document, the outgoing pane is removed, and the DOM has stopped mutating for two frames. No fixed idle period,
 * average cannot be diluted by settle time the way a fixed 300ms tail dilutes it.
 */
export async function routeWindow(page, label, heading, navigation = ".workspace-tabs") {
  // Opening the module chooser is setup. The measured window still begins at
  // the destination click and includes the real route/chooser dismissal.
  navigation = await navigationFor(page, label, navigation);
  return page.evaluate(async ({ label, heading, navigation }) => {
    const named = scope => [...scope.querySelectorAll("a")].find(anchor => (anchor.getAttribute("aria-label") ?? anchor.textContent.trim()) === label);
    let link = named(document.querySelector(navigation) ?? document.createElement("div"));
    // Vision §3 keeps four modules in the phone tab bar and gives TP a section switcher, so every
    // other destination is reached through the workspace sheet. The harness follows the same path a
    // person does; opening the sheet stays outside the window, which still opens on the link click.
    if (!link) {
      const opener = document.querySelector('.workspace-tabs button[aria-label="More"], .workspace-heading button[aria-label="Choose module"]');
      if (!opener) throw new Error(`No ${navigation} link named ${label} and no workspace sheet to open`);
      opener.click();
      const deadline = performance.now() + 2000;
      while (!(link = named(document.querySelector("dialog[open]") ?? document.createElement("div")))) {
        if (performance.now() > deadline) throw new Error(`No workspace sheet link named ${label}`);
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }
    const before = location.pathname;
    window.__qaPerf.lastMutation = 0;
    window.__qaPerf.start(`route to ${label}`);
    link.click();
    const deadline = performance.now() + 4000;
    await new Promise((resolve, reject) => {
      const check = () => {
        const arrived = location.pathname !== before && [...document.querySelectorAll("main h1")].some(node => node.textContent.trim() === heading);
        // A busy first mount can leave a two-frame quiet gap before GSAP ticks.
        // Only the route lifecycle's outgoing-pane removal proves completion.
        const completed = document.querySelectorAll(".route-pane").length === 1;
        if (arrived && completed && window.__qaPerf.settled(2)) return resolve();
        if (performance.now() > deadline) return reject(new Error(`Route ${label} did not settle within 4000ms`));
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    window.__qaPerf.end();
    return location.pathname;
  }, { label, heading, navigation });
}

async function performanceRun(browser, base, device = "M") {
  const [width, height] = sizes[device];
  const interaction = device === "M" ? "route-transition" : `route-transition-${device}`;
  const navigation = device === "M" ? ".workspace-tabs" : device === "TP" ? ".workspace-topnav" : device === "TL" ? ".workspace-rail" : ".workspace-sidebar";
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, reducedMotion: "no-preference" });
  await context.addInitScript(instrument);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const results = [];
  try {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await prepare(page, base, screens.find(screen => screen.id === qa.perfScreen), device, "light", "default");
    const route = qa.perfRoutes;
    let coldWindow, warmupWindow;
    try {
      // Product idle preload is in place; preserve first-use cost separately
      // before measuring repeat-navigation cadence. Never silently discard it.
      if (await routeWindow(page, route[0][0], route[0][1], navigation) !== route[0][2]) throw new Error("Cold route did not arrive");
      coldWindow = withVerdict(await page.evaluate(() => window.__qaPerf.windows.splice(0)))[0];
      coldWindow.label += " (cold first transition; separate diagnostic)";
      if (await routeWindow(page, route.at(-1)[0], route.at(-1)[1], navigation) !== route.at(-1)[2]) throw new Error("Warm-up return did not arrive");
      warmupWindow = withVerdict(await page.evaluate(() => window.__qaPerf.windows.splice(0)))[0];
      warmupWindow.label += " (warm-up return; separate diagnostic)";
      // Six real client-side navigations; each one is its own measured window.
      for (let pass = 0; pass < 2; pass++) for (const [label, heading, path] of route) {
        const arrived = await routeWindow(page, label, heading, navigation);
        if (arrived !== path) throw new Error(`Route ${label} landed on ${arrived}, expected ${path}`);
      }
      const windows = await page.evaluate(() => window.__qaPerf.windows.splice(0));
      windows.forEach((window, index) => { window.index = index + 1; });
      results.push({ ...summarise(interaction, withVerdict(windows), `six verified warmed client-side route changes on ${device}; cold transition and warm-up return reported separately, outside the warmed cadence gate`), coldWindow, warmupWindow });
    } catch (error) { results.push({ interaction, cpuThrottle: 4, fps: null, frames: 0, activeMs: 0, windows: [], coldWindow, warmupWindow, status: "FAIL", details: error.message }); }
    if (device !== "M") return results;
    try {
      await page.getByRole("button", { name: "More", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      await waitForOverlayRest(page, ".workspace-sheet[open] .sheet-surface");
      const handle = page.locator(".workspace-sheet[open] .sheet-grip");
      const box = await handle.boundingBox();
      if (!box) throw new Error("No draggable sheet handle");
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      // The window opens on pointer down and closes on pointer up: continuous drag only, no release settle.
      // The sheet surface is measured in-page every frame, so no round trip inflates the window with idle time.
      await page.evaluate(() => window.__qaPerf.start("continuous sheet drag", '.workspace-sheet[open] .sheet-surface'));
      await page.mouse.down();
      for (let step = 1; step <= 45; step++) {
        // Stay in bounds and include the reversal, as the #38 motion probe does.
        await page.mouse.move(x, y + 90 * Math.sin(step / 45 * Math.PI));
        await page.waitForTimeout(16);
      }
      await page.mouse.up();
      const windows = await page.evaluate(() => { window.__qaPerf.end(); return window.__qaPerf.windows.splice(0); });
      const displacement = windows[0]?.displacementPx ?? 0;
      if (displacement < 5) throw new Error(`Drag did not move the sheet (${displacement}px); an idle window must not pass`);
      results.push(summarise("sheet-drag", withVerdict(windows), `sheet displaced ${displacement}px over 45 pointer steps`));
    } catch (error) { results.push({ interaction: "sheet-drag", cpuThrottle: 4, fps: null, frames: 0, activeMs: 0, windows: [], status: "FAIL", details: error.message }); }
  } finally { await context.close(); }
  return results;
}

export async function browserPid(browser) {
  const session = await browser.newBrowserCDPSession();
  let ownBrowserPid;
  try { ownBrowserPid = (await session.send("SystemInfo.getProcessInfo")).processInfo.find(process => process.type === "browser")?.id; }
  finally { await session.detach(); }
  if (!ownBrowserPid) throw new Error("Cannot identify the QA browser PID");
  return ownBrowserPid;
}

export async function performanceGates(browser, base, repeat = 3) {
  repeat = repeatCount(repeat);
  const ownBrowserPid = await browserPid(browser);
  const all = [];
  for (let run = 1; run <= repeat; run++) {
    const before = hostSnapshot(ownBrowserPid);
    let results;
    try {
      results = [];
      for (const device of ["M", "TP", "TL", "DS"]) results.push(...await performanceRun(browser, base, device));
    }
    catch (error) {
      results = ["route-transition", "sheet-drag", "route-transition-TP", "route-transition-TL", "route-transition-DS"].map(interaction => ({ interaction, cpuThrottle: 4, fps: null, frames: 0, activeMs: 0, windows: [], status: "FAIL", details: `Probe setup failed: ${error.message}` }));
    }
    const after = hostSnapshot(ownBrowserPid);
    all.push(results.map(result => classifyRepetition({ ...result, run }, { before, after })));
  }
  return all[0].map((_, index) => medianRun(all.map(results => results[index])));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = runDirectory(process.argv[2]);
  const args = process.argv.slice(3);
  if (args.length && (args.length !== 2 || args[0] !== "--repeat")) throw new Error("Usage: perf.mjs <run-id> [--repeat 3]");
  const repeat = repeatCount(args[1]);
  const server = await serve();
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
    const results = await performanceGates(browser, server.base, repeat);
    await writeFile(resolve(directory, "perf.json"), JSON.stringify(results, null, 2) + "\n");
    console.table(results.map(({ interaction, fps, frames, activeMs, status }) => ({ interaction, fps, frames, activeMs, status })));
    for (const result of results) for (const run of result.runs) {
      console.log(`${result.interaction} run ${run.run}: ${run.fps} fps (${run.status}); ${run.reason ?? "quiet host"}`);
      console.log(`  host before: ${JSON.stringify(run.host.before)}`);
      console.log(`  host after: ${JSON.stringify(run.host.after)}`);
      for (const window of [run.coldWindow, run.warmupWindow].filter(Boolean)) console.log(`  diagnostic: ${window.label}: ${window.fps} fps, ${window.dropped} dropped (${window.status}); outside warmed cadence gate`);
      for (const window of run.windows) console.log(`  window ${window.index}: ${window.fps} fps, ${window.dropped ?? "unmeasured"} dropped, ${window.frames} frames, ${window.elapsedMs}ms (${window.status})`);
    }
    process.exitCode = qaExitCode(results);
    if (results.some(result => result.status === "INCONCLUSIVE")) console.error(inconclusiveMessage);
  } finally { await browser?.close(); await server.close(); }
}
