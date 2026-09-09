export function measureContrast(root) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return Array.from(ctx.getImageData(0, 0, 1, 1, { pixelFormat: "rgba-float16" }).data); };
  const over = (front, back) => { const a = front[3] + back[3] * (1 - front[3]); return [...front.slice(0, 3).map((v, i) => a ? (v * front[3] + back[i] * back[3] * (1 - front[3])) / a : 0), a]; };
  const luminance = color => color.slice(0, 3).reduce((sum, v, i) => sum + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i], 0);
  const results = [];
  const measure = (element, text, color) => {
    // Inactive controls are exempt from text contrast; their muted/opacity treatment
    // is checked separately for every variant by kit.browser.mjs.
    if (element.closest(':disabled, [aria-disabled="true"]')) return;
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || element.closest('[inert],[aria-hidden="true"]') || !element.getBoundingClientRect().width) return;
    let background = [0, 0, 0, 0];
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor);
      if (css.backgroundImage !== "none" || css.filter !== "none" || css.mixBlendMode !== "normal" || css.opacity !== "1") throw new Error("Unsupported compositing: " + ancestor.className);
      background = over(background, rgba(css.backgroundColor));
    }
    if (background[3] !== 1) throw new Error("No opaque background");
    const foreground = over(rgba(color), background), a = luminance(foreground), b = luminance(background);
    results.push({ text, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) });
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const n = walker.currentNode; if (n.textContent.trim()) measure(n.parentElement, n.textContent.trim(), getComputedStyle(n.parentElement).color); }
  for (const el of root.querySelectorAll("input,select,textarea")) {
    if (el.type === "hidden") continue;
    const placeholder = !el.value && el.placeholder;
    measure(el, el.value || placeholder || "control", getComputedStyle(el, placeholder ? "::placeholder" : null).color);
  }
  return results;
}
