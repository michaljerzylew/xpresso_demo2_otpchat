import { useState } from "react";
import { AdaptiveOverlay } from "@xp/primitives/adaptive-overlay";
import type { usePwaInstall } from "./usePwaInstall";

const steps = {
  ios: [
    "Open this page in Safari.",
    "Tap the Share button in the browser toolbar.",
    "Choose Add to Home Screen.",
    "Confirm with Add. The workspace then opens without browser chrome.",
  ],
  other: [
    "Open the browser menu.",
    "Choose Install app, Add to Home screen or Create shortcut.",
    "Confirm the install. The workspace then opens in its own window.",
  ],
};

/**
 * One "Install app" entry for every platform. Where the browser hands over a real
 * prompt, the entry opens it; otherwise it opens the written steps, which the shell
 * presents as a bottom sheet on M and TP and as a dialog on the desktop classes.
 */
export function InstallControl({ install, placeholder = false }: { install: ReturnType<typeof usePwaInstall>; placeholder?: boolean }) {
  const { availability, platform, outcome, promptInstall } = install;
  const [open, setOpen] = useState(false);

  if (availability === "installed") {
    return <p className="pwa-install" role="status">This workspace is already installed on this device.</p>;
  }
  return <div className="pwa-install">
    {placeholder ? <span className="settings-static-control">Install app</span> : <AdaptiveOverlay intent="confirm" open={open} onOpenChange={async next => {
      if (next && await promptInstall()) return;
      setOpen(next);
    }}>
      <AdaptiveOverlay.Trigger>Install app</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content>
        <AdaptiveOverlay.Header
          title="Install this workspace"
          description="Installing keeps the workspace one tap away and runs it without browser chrome."
          closeLabel="Close install instructions"
        />
        <AdaptiveOverlay.Body>
          <ol className="pwa-install-steps">{steps[platform].map(step => <li key={step}>{step}</li>)}</ol>
        </AdaptiveOverlay.Body>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>}
    <p role="status">{outcome === "dismissed"
      ? "Install dismissed. Open this entry again whenever you want it."
      : availability === "native"
        ? "Your browser can install this workspace directly."
        : "Your browser installs from its own menu; the steps are here."}</p>
  </div>;
}
