import { useCallback, useEffect, useState } from "react";

/** Chromium's install prompt event; not in the DOM lib because it is not standardised. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "other";
/** `native`: the browser offered a prompt. `guide`: only manual steps exist. */
export type InstallAvailability = "native" | "guide" | "installed";

function iosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS reports a Mac user agent, so the touch count is the only signal left.
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

/** Chromium's installed-app query; not in the DOM lib because it is not standardised. */
type RelatedAppNavigator = Navigator & {
  getInstalledRelatedApps?: () => Promise<{ platform?: string; id?: string; url?: string }[]>;
};

/** Safari's own flag, the only synchronous signal available at first render. */
function standaloneNow(): boolean {
  return typeof navigator !== "undefined" && "standalone" in navigator && navigator.standalone === true;
}

/**
 * Chromium's answer to "is this app already installed". `beforeinstallprompt` not
 * firing is not the same question: it also stays silent before the engagement
 * heuristic is met, which would show a reader install steps for an app they already
 * have. The manifest lists itself under `related_applications` with
 * `platform: "webapp"` and the absolute web app id desktop Chromium matches against,
 * which is what lets the query resolve to this app; see docs/engineering/pwa.md.
 * Display-mode detection stays out of the hook either way: `matchMedia` is viewport
 * knowledge, which app code outside the shell layer may not hold.
 */
async function relatedAppInstalled(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const query = (navigator as RelatedAppNavigator).getInstalledRelatedApps;
  if (typeof query !== "function") return false;
  try {
    // Rejects outside a secure top-level context, which is not an answer of "no".
    return (await query.call(navigator)).some(app => app.platform === "webapp");
  } catch {
    return false;
  }
}

/**
 * Install affordance state for the settings entry. Chromium and desktop browsers
 * hand over a real prompt; every other engine gets written steps instead, because
 * there is no API to open the install flow.
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(standaloneNow);
  const [outcome, setOutcome] = useState<"accepted" | "dismissed" | null>(null);

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const finish = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", finish);
    let live = true;
    // Asynchronous, so the entry starts as "guide" and settles once Chromium answers.
    void relatedAppInstalled().then(yes => { if (live && yes) setInstalled(true); });
    return () => {
      live = false;
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", finish);
    };
  }, []);

  /** Resolves false when no prompt exists, so the caller can open the steps instead. */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false;
    setDeferred(null);
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setOutcome(choice.outcome);
    if (choice.outcome === "accepted") setInstalled(true);
    return true;
  }, [deferred]);

  const availability: InstallAvailability = installed ? "installed" : deferred ? "native" : "guide";
  return { availability, platform: iosLike() ? "ios" : "other" as InstallPlatform, outcome, promptInstall };
}
