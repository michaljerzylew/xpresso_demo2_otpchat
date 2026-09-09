import { useEffect, useRef } from "react";
import { enter } from "@xp/motion";

/**
 * Announces that a newer worker has taken over. Occasional frequency, so the
 * standard entrance applies: `enter()` scales from 0.96 and fades in over the UI
 * duration, and reduced motion is handled inside the motion package.
 */
export function UpdateToast({ onReload, onDismiss }: { onReload: () => void; onDismiss: () => void }) {
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const animation = enter(element);
    return () => animation.cancel();
  }, []);
  return <div className="pwa-toast" ref={surface} role="status" aria-live="polite">
    <p>New version, reload</p>
    <div className="pwa-toast-actions">
      <button type="button" onClick={onReload}>Reload</button>
      <button type="button" onClick={onDismiss}>Later</button>
    </div>
  </div>;
}
