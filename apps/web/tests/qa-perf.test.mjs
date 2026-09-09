import { expect, test } from "vitest";
import { withVerdict, summarise, medianRun, repeatCount, instrument, routeWindow, classifyRepetition, chromeCounts, qaExitCode } from "../../../scripts/qa/perf.mjs";
import { chromium } from "../../../scripts/qa/common.mjs";

test("a quiet DOM cannot end a window while the outgoing pane still exists", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.addInitScript(instrument);
    await page.route("http://qa.test/**", route => route.fulfill({ contentType: "text/html", body: '<nav class="workspace-tabs"><a href="/inbox">Inbox</a></nav><main><div class="route-pane"><h1>Overview</h1></div></main>' }));
    await page.goto("http://qa.test/");
    await page.evaluate(() => {
      document.querySelector("a").onclick = event => {
        event.preventDefault();
        history.pushState({}, "", "/inbox");
        document.querySelector("h1").textContent = "Inbox";
        const outgoing = document.createElement("div");
        outgoing.className = "route-pane";
        document.querySelector("main").append(outgoing);
        // Model a quiet gap before the route lifecycle removes its outgoing pane.
        setTimeout(() => outgoing.remove(), 200);
      };
    });
    expect(await routeWindow(page, "Inbox", "Inbox")).toBe("/inbox");
    const window = await page.evaluate(() => window.__qaPerf.windows[0]);
    expect(window.elapsedMs).toBeGreaterThanOrEqual(150);
    expect(window.frames).toBeGreaterThanOrEqual(4);
  } finally { await browser.close(); }
}, 15_000); // Includes system Chrome startup on the shared host; route deadline stays 4s.

test("a second dropped interval fails regardless of the window fps", () => {
  expect(withVerdict([13, 14, 12].map(frames => ({ frames, elapsedMs: 233.33 }))))
    .toMatchObject([{ dropped: 2, status: "FAIL" }, { dropped: 1, status: "PASS" }, { dropped: 3, status: "FAIL" }]);
  const frameTimes = [0, 49.9, ...Array.from({ length: 19 }, (_, index) => 49.9 + (index + 1) * (383 - 49.9) / 19)];
  expect(withVerdict([{ frameTimes, frames: frameTimes.length, elapsedMs: 383 }])[0])
    .toMatchObject({ expectedIntervals: 23, measuredIntervals: 20, dropped: 3, status: "FAIL" });
  const windows = withVerdict([15, 15, 15, 15, 15, 13].map(frames => ({ frames, elapsedMs: 233.33 })));
  expect(summarise("route-transition", windows, "reviewer regression")).toMatchObject({ fps: 58.57, status: "FAIL" });
  expect(withVerdict([{ frames: 4, elapsedMs: 66.667 }])[0]).toMatchObject({ fps: 45, dropped: 1, status: "PASS" });
});
test("median selection retains every run and a conclusive failure overrides the median", () => {
  const runs = [{ run: 1, fps: 60, status: "PASS" }, { run: 2, fps: 58, status: "PASS" }, { run: 3, fps: 59, status: "PASS" }];
  expect(medianRun(runs)).toMatchObject({ medianRun: 3, fps: 59, status: "PASS", runs });
  expect(medianRun([runs[0], runs[1], { ...runs[2], status: "FAIL" }])).toMatchObject({ medianRun: null, failedRun: 3, status: "FAIL" });
  expect(medianRun([runs[0], { ...runs[1], fps: null }, { ...runs[2], fps: null, status: "FAIL" }]).status).toBe("FAIL");
  expect(medianRun([runs[0]])).toMatchObject({ medianRun: null, status: "INCONCLUSIVE" });
  expect(medianRun([{ ...runs[0], measuredFps: 59.999 }, { ...runs[1], fps: 60, measuredFps: 60.001 }, { ...runs[2], fps: 60, measuredFps: 60 }]).medianRun).toBe(3);
  expect(repeatCount()).toBe(3);
  expect(repeatCount("5")).toBe(5);
  for (const value of [0, 2, -1, 1.5, "bad", Infinity]) expect(() => repeatCount(value)).toThrow();
});

const quiet = { loadavg: [6, 30, 24], cores: 10, otherChromeBrowserProcesses: 1, freeMemoryBytes: 1024 };
const probe = (frames = 16) => summarise("route-transition", withVerdict([{ frames, elapsedMs: 250 }]), "fixture");
const classify = (result, before = quiet, after = quiet) => classifyRepetition(result, { before, after });

test("loaded measured cadence repetitions never pass or fail, including their diagnostic windows", () => {
  for (const before of [{ ...quiet, loadavg: [6.01, 0, 0] }, { ...quiet, otherChromeBrowserProcesses: 2 }]) {
    for (const frames of [16, 13]) {
      const result = classify({ ...probe(frames), coldWindow: probe(frames).windows[0] }, before);
      expect(result.status).toBe("INCONCLUSIVE");
      expect(result.reason).toMatch(/exceeds/);
      expect(result.windows[0].status).toBe("INCONCLUSIVE");
      expect(result.coldWindow.status).toBe("INCONCLUSIVE");
      expect(result.windows[0].frames).toBe(frames);
      expect(result.host).toEqual({ before, after: quiet });
    }
  }
});

test("quiet boundary keeps existing FPS and drop rules; after snapshot is evidence only", () => {
  expect(classify(probe()).status).toBe("PASS");
  expect(classify(probe(13)).status).toBe("FAIL");
  const slow = summarise("route-transition", withVerdict([{ frames: 10, elapsedMs: 165 }]), "below 58 with one drop");
  expect(classify(slow).status).toBe("FAIL");
  expect(classify(probe(), quiet, { ...quiet, loadavg: [30, 30, 30] }).status).toBe("PASS");
});

test("mixed repetitions use only conclusive FPS and retain every excluded run", () => {
  const runs = [classify({ ...probe(13), run: 1 }, { ...quiet, loadavg: [24, 0, 0] }),
    classify({ ...probe(), run: 2 }), classify({ ...probe(), run: 3 })];
  expect(medianRun(runs)).toMatchObject({ status: "PASS", fps: 60, medianRuns: [2, 3], runs });
  expect(medianRun([runs[0], runs[1]])).toMatchObject({ status: "INCONCLUSIVE", fps: null });
  expect(medianRun([runs[0]])).toMatchObject({ status: "INCONCLUSIVE", fps: null });
  const more = [...runs, classify({ ...probe(), run: 4 }), classify({ ...probe(13), run: 5 })];
  expect(medianRun(more)).toMatchObject({ status: "FAIL", fps: 48, failedRun: 5, runs: more });
});

test("even conclusive median averages unrounded FPS without overriding a failed run", () => {
  const first = classify({ ...probe(), run: 1, measuredFps: 58.001, fps: 58 });
  const second = classify({ ...probe(), run: 2, measuredFps: 58.003, fps: 58 });
  expect(medianRun([first, second])).toMatchObject({ measuredFps: (58.001 + 58.003) / 2, status: "PASS", medianRuns: [1, 2] });
  expect(medianRun([{ ...first, measuredFps: 57.999, status: "FAIL" }, second])).toMatchObject({ fps: 58, status: "FAIL", failedRun: 1 });
  expect(medianRun([first, { ...second, windows: probe(13).windows, status: "FAIL" }]).status).toBe("FAIL");
});

test("one quiet FAIL plus two loaded INCONCLUSIVE repetitions is FAIL with exit 1", () => {
  const loaded = { ...quiet, loadavg: [24, 0, 0] };
  const runs = [classify({ ...probe(13), run: 1 }),
    ...[2, 3].map(run => classify({ ...probe(), run }, loaded))];
  expect(runs.map(run => run.status)).toEqual(["FAIL", "INCONCLUSIVE", "INCONCLUSIVE"]);
  const result = medianRun(runs);
  expect(result).toMatchObject({ status: "FAIL", failedRun: 1, fps: 48, runs });
  expect(qaExitCode([result])).toBe(1);
  expect(qaExitCode([medianRun([runs[0]])])).toBe(1);
});

test.each([
  ["wrong route", "route-transition", "Route Inbox landed on /, expected /inbox"],
  ["missing sheet handle", "sheet-drag", "No draggable sheet handle"],
  ["failed probe setup", "route-transition-TP", "Probe setup failed: heading not found"],
  ["thrown error", "route-transition-TL", "page.evaluate: Overlapping measurement windows"],
  ["unsuccessful drag", "sheet-drag", "Drag did not move the sheet (0px); an idle window must not pass"],
])("loaded-host %s stays FAIL through classification and aggregation with exit 1", (_, interaction, details) => {
  for (const before of [{ ...quiet, loadavg: [24, 0, 0] }, { ...quiet, otherChromeBrowserProcesses: 2 }]) {
    const failure = { interaction, run: 1, cpuThrottle: 4, fps: null, frames: 0, activeMs: 0, windows: [], status: "FAIL", details };
    const classified = classify(failure, before);
    expect(classified).toEqual({ ...failure, host: { before, after: quiet } });
    for (const companions of [[], [2, 3].map(run => classify({ ...probe(), interaction, run }, before)),
      [2, 3].map(run => classify({ ...probe(), interaction, run }))]) {
      const result = medianRun([classified, ...companions]);
      expect(result).toMatchObject({ status: "FAIL", failedRun: 1, fps: null, windows: [], details: expect.stringContaining(details) });
      expect(qaExitCode([result])).toBe(1);
    }
  }
});

test("ps counts other Chrome/Chromium processes and browser roots, excluding the owned tree", () => {
  const ps = `100 1 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
105 104 /Chrome Helper
104 100 /Chrome Helper
200 1 /Applications/Chromium.app/Contents/MacOS/Chromium
201 200 /Chromium Helper
300 1 /opt/google/chrome/chrome
301 300 /chrome_crashpad_handler
400 1 /usr/bin/node`;
  expect(chromeCounts(ps, 100)).toEqual({ otherChromeProcesses: 4, otherChromeBrowserProcesses: 2 });
});

test("QA exit distinguishes inconclusive perf and keeps real failures blocking", () => {
  expect(qaExitCode([{ status: "PASS" }])).toBe(0);
  expect(qaExitCode([{ status: "INCONCLUSIVE" }])).toBe(2);
  expect(qaExitCode([{ status: "INCONCLUSIVE" }], true)).toBe(1);
  expect(qaExitCode([{ status: "INCONCLUSIVE" }, { status: "FAIL" }])).toBe(1);
  expect(qaExitCode([{ status: "INACTIVE" }])).toBe(1);
});
test("a window with no frame interval is inactive, never a pass", () => {
  expect(withVerdict([{ frames: 1, elapsedMs: 0 }])[0].status).toBe("INACTIVE");
  expect(withVerdict([{ frames: 0, elapsedMs: 0 }])[0].fps).toBe(null);
  expect(summarise("route-transition", withVerdict([{ frames: 1, elapsedMs: 0 }]), "note").status).toBe("INACTIVE");
  expect(summarise("route-transition", [], "note").fps).toBe(null);
});

test("a separately reported cold failure survives warm median selection", () => {
  const coldWindow = withVerdict([{ frames: 13, elapsedMs: 233.33, label: "cold first transition" }])[0];
  const windows = withVerdict(Array.from({ length: 6 }, () => ({ frames: 16, elapsedMs: 250 })));
  const runs = [1, 2, 3].map(run => ({ ...summarise("route-transition", windows, "warmed"), run, coldWindow }));
  const selected = medianRun(runs);
  expect(selected.status).toBe("PASS");
  expect(selected.coldWindow).toMatchObject({ status: "FAIL", dropped: 2 });
  expect(selected.runs.every(run => run.coldWindow.status === "FAIL")).toBe(true);
});
test("aggregate fps counts only intervals inside measured windows and one bad window fails the gate", () => {
  // Six windows of 10 frames each: 9 intervals per window over 150ms is 60 fps.
  const good = withVerdict(Array.from({ length: 6 }, (_, index) => ({ index, label: `route ${index}`, frames: 10, elapsedMs: 150 })));
  expect(good.every(window => window.status === "PASS")).toBe(true);
  expect(summarise("route-transition", good, "note")).toMatchObject({ fps: 60, frames: 60, activeMs: 900, status: "PASS" });
  // One janky window drags the aggregate down and fails the interaction even though five windows are clean.
  const janky = withVerdict([...good.slice(0, 5).map(({ index, label, frames, elapsedMs }) => ({ index, label, frames, elapsedMs })), { index: 6, label: "route 6", frames: 10, elapsedMs: 600 }]);
  expect(janky.at(-1).fps).toBe(15);
  expect(summarise("route-transition", janky, "note").status).toBe("FAIL");
  // One dropped frame in one window (14 frames over 233 ms = 55.7 fps) is tolerated when the aggregate still reaches 58.
  const hitch = withVerdict([...good.slice(0, 5).map(({ index, label, frames, elapsedMs }) => ({ index, label, frames, elapsedMs })), { index: 6, label: "route 6", frames: 14, elapsedMs: 233.3 }]);
  expect(hitch.at(-1).status).toBe("PASS");
  expect(summarise("route-transition", hitch, "note").status).toBe("PASS");
  // Windows all above 50 but an aggregate under 58 still fails the interaction.
  const slow = withVerdict(Array.from({ length: 6 }, (_, index) => ({ index, label: `route ${index}`, frames: 10, elapsedMs: 165 })));
  expect(slow.every(window => window.status === "PASS")).toBe(true);
  expect(summarise("route-transition", slow, "note").status).toBe("FAIL");
  expect(summarise("route-transition", withVerdict([{ frames: 30, elapsedMs: 500.01 }]), "rounding")).toMatchObject({ fps: 58, status: "FAIL" });
});

test("short windows remain inactive and do not fail or dilute measured cadence", () => {
  const windows = withVerdict([
    { frames: 2, elapsedMs: 100 },
    { frames: 3, elapsedMs: 200 },
    { frames: 4, elapsedMs: 50 },
  ]);
  expect(windows.map(window => window.status)).toEqual(["INACTIVE", "INACTIVE", "PASS"]);
  expect(summarise("route-transition", windows, "note")).toMatchObject({ fps: 60, frames: 4, activeMs: 50, status: "PASS" });
  expect(summarise("route-transition", windows.slice(0, 2), "note").status).toBe("INACTIVE");
});
