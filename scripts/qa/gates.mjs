// Runs in the browser. Keep it self-contained so regression fixtures use the same oracle.
// Every gate also returns how many elements or samples it actually inspected, so a gate that
// observed nothing is reported INACTIVE instead of passing vacuously.
// inspectDOM is serialized into the page, so it inlines this same 1px allowance; the two must stay equal.
export const overflowAllowancePx = 1;
export function inspectDOM({ deviceClass, reducedMotion }) {
  const overflowAllowance = 1; // Must equal the exported overflowAllowancePx; this function runs in the browser.
  const findings = { overflow: [], tapTargets: [], textSize: [], missingAlt: [], animationBudget: [], reducedMotion: [] };
  const measured = { elements: 0, overflow: 0, tapTargets: 0, textSize: 0, missingAlt: 0, animationBudget: 0, reducedMotion: 0 };
  const label = el => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : ""} ${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 70)}`;
  const visible = el => {
    const css = getComputedStyle(el);
    const clipped = css.clipPath === "inset(50%)" || /rect\(0px[, ]+0px[, ]+0px[, ]+0px\)/.test(css.clip);
    return !clipped && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getBoundingClientRect().width > 0 && !el.closest('[inert], [aria-hidden="true"]');
  };
  const ms = value => value.trim().endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
  const elements = [...document.querySelectorAll("body *")].filter(visible);
  measured.elements = elements.length;
  measured.overflow = elements.length;
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth) findings.overflow.push("document scrollWidth > clientWidth");
  for (const el of elements) {
    const css = getComputedStyle(el);
    // Native editors scroll their value without overflowing the surrounding layout, and a declared
    // ellipsis (or line clamp) is a designed truncation, not content escaping the layout. Clipping
    // without either still fails, because that silently hides content.
    const truncates = (css.textOverflow === "ellipsis" && ["hidden", "clip", "auto", "scroll"].includes(css.overflowX)) || (css.webkitLineClamp && css.webkitLineClamp !== "none");
    // Vision §3 permits horizontal section-chip navigation. Its scrollport is
    // intentional; ordinary content overflow and hidden clipping still fail.
    const scrollingNavigation = el.matches("nav") && ["auto", "scroll"].includes(css.overflowX) && css.overflowY === "hidden";
    if (!el.matches("input,textarea,select") && !truncates && !scrollingNavigation && el.clientWidth && el.scrollWidth > el.clientWidth + overflowAllowance) findings.overflow.push(`${label(el)}: ${el.scrollWidth} > ${el.clientWidth}`);
    if (el.matches('a[href],button,input:not([type="hidden"]),select,textarea,[role="button"],[role="radio"],[role="tab"],[role="checkbox"],[tabindex]') && !el.matches(':disabled,[tabindex="-1"]')) {
      measured.tapTargets++;
      // A wrapping label is part of a native input's clickable hit area.
      const targets = [el, ...(el.labels ? [...el.labels] : [])].map(node => node.getBoundingClientRect());
      const minimum = ["M", "TP"].includes(deviceClass) ? 44 : 24;
      if (!targets.some(box => box.width >= minimum && box.height >= minimum)) findings.tapTargets.push(`${label(el)}: ${targets[0].width.toFixed(1)}x${targets[0].height.toFixed(1)}`);
    }
    if ([...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) || el.matches("input,select,textarea")) {
      measured.textSize++;
      if (parseFloat(css.fontSize) < 12) findings.textSize.push(`${label(el)}: ${css.fontSize}`);
    }
    if (el.matches("img")) {
      measured.missingAlt++;
      if (el.matches("img:not([alt])")) findings.missingAlt.push(label(el));
    }
    const launch = el.matches('[data-qa-motion="launch"]') ? ms(css.getPropertyValue("--xp-dur-launch")) : 0;
    for (const [kind, durations, delays, names] of [["transition", css.transitionDuration, css.transitionDelay, css.transitionProperty], ["animation", css.animationDuration, css.animationDelay, css.animationName]]) {
      if (names === "none") continue;
      const waits = delays.split(",").map(ms);
      durations.split(",").map(ms).forEach((duration, index) => {
        if (!(duration > 0)) return;
        measured.animationBudget++;
        if (reducedMotion) measured.reducedMotion++;
        const total = duration + Math.max(0, waits[index % waits.length]);
        if (total > 300 && !(launch > 0 && total <= launch)) findings.animationBudget.push(`${label(el)} ${kind}: ${total}ms`);
        if (reducedMotion && kind === "transition" && names.split(",").some(name => /^(all|transform|translate|scale|rotate|left|top|width|height)$/.test(name.trim()))) findings.reducedMotion.push(`${label(el)} moves via ${names}`);
      });
    }
  }
  for (const animation of document.getAnimations()) {
    measured.animationBudget++;
    if (reducedMotion) measured.reducedMotion++;
    const target = animation.effect?.target;
    const timing = animation.effect?.getComputedTiming();
    const launch = target?.matches('[data-qa-motion="launch"]') ? ms(getComputedStyle(target).getPropertyValue("--xp-dur-launch")) : 0;
    if (timing?.activeDuration > 300 && !(launch > 0 && timing.activeDuration <= launch)) findings.animationBudget.push(`active animation: ${timing.activeDuration}ms`);
    if (reducedMotion && animation.effect?.getKeyframes().some(frame => ["transform", "translate", "scale", "rotate", "left", "top", "width", "height"].some(key => key in frame))) findings.reducedMotion.push("active animation has spatial keyframes");
  }
  if (reducedMotion) {
    // The media-query assertion is itself a sample, so the reduced-motion gate is armed in every reduce run.
    measured.reducedMotion++;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) findings.reducedMotion.push("reduced-motion media query did not match");
  }
  const content = elements.filter(el => el.closest("main"));
  // Account for nested pane scrolling, not just the fixed-height document shell.
  const scrollExcess = Math.max(0, ...content.map(el => el.clientHeight ? el.scrollHeight - el.clientHeight : 0));
  return { findings, measured, geometry: { viewportHeight: innerHeight, documentHeight: document.documentElement.scrollHeight, pageHeight: Math.max(document.documentElement.scrollHeight, innerHeight + scrollExcess), scrollExcess, mainElements: content.length } };
}

/**
 * The founding failure is a mobile page that stacks a desktop layout. It only means anything when the
 * matching wide form genuinely fits its own viewport, so the wide document height is compared with the
 * same 1px rounding allowance the overflow gate uses. When it does not fit, the detector is INACTIVE:
 * it must never report PASS for a comparison it could not make.
 */
export function foundingFailure(mobile, wide, allowance = overflowAllowancePx) {
  if (!mobile || !wide) return { status: "INACTIVE", details: ["Missing geometry for the M or DW baseline"] };
  const limit = mobile.viewportHeight * 1.25;
  const baseline = `DW document ${wide.documentHeight}px vs viewport ${wide.viewportHeight}px (+${allowance}px allowance)`;
  if (wide.documentHeight > wide.viewportHeight + allowance) return { status: "INACTIVE", details: [`DW baseline does not fit its viewport, so a stacked M form cannot be judged: ${baseline}`] };
  // An M shot reports the rule that fired on it; the DW baseline belongs to the INACTIVE branch,
  // where it is the reason the comparison could not be made (#101).
  const details = [`M effective ${mobile.pageHeight}px vs limit ${limit}px`];
  return { status: mobile.pageHeight > limit ? "FAIL" : "PASS", details };
}

export async function focusTrap(page, overlayExpected) {
  const dialogs = page.getByRole("dialog");
  if (!overlayExpected) return { status: "NA", details: ["No overlay in this state"] };
  if (await dialogs.count() !== 1) return { status: "FAIL", details: ["Expected one open dialog"] };
  const dialog = dialogs.first();
  const details = [];
  const inside = () => dialog.evaluate(el => el.contains(document.activeElement));
  if (!await inside()) details.push("Opening did not move focus into the dialog");
  // Includes `details > summary`: it is tabbable, and counting it is what makes the traversal long
  // enough to walk off the end of a sheet whose last control is a disclosure.
  const count = await dialog.locator('a[href],button,input,select,textarea,details > summary:first-of-type,[tabindex]:not([tabindex="-1"])').count();
  if (!count) return { status: "INACTIVE", details: ["Open dialog has no focusable elements; traversal proves nothing"] };
  // Traversing a long sheet scrolls its body. Preserve the requested visual state for capture.
  const scroll = await dialog.evaluateHandle(el => [el, ...el.querySelectorAll("*")].map(node => ({ node, left: node.scrollLeft, top: node.scrollTop })));
  try {
    for (const key of ["Tab", "Shift+Tab"]) for (let index = 0; index < count + 2; index++) {
      await page.keyboard.press(key);
      if (!await inside()) { details.push(`Focus escaped on ${key} at step ${index + 1}`); break; }
    }
  } finally {
    await scroll.evaluate(positions => positions.forEach(({ node, left, top }) => node.scrollTo(left, top)));
    await scroll.dispose();
  }
  return { status: details.length ? "FAIL" : "PASS", details: details.length ? details : [`${count} focusable elements traversed both ways`] };
}
