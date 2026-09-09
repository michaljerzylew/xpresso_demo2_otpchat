import { useEffect, useState } from "react";
import { startServiceWorker } from "./register";
import { applyThemeColorMetas } from "./theme-color";
import { UpdateToast } from "./UpdateToast";

/**
 * The whole PWA runtime the app mounts: browser-chrome colours from the theme
 * tokens, one worker registration per document, and the reload toast. Renders
 * nothing until a new worker actually takes over.
 */
export function PwaRuntime() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    applyThemeColorMetas();
    startServiceWorker(() => setUpdated(true));
  }, []);
  if (!updated) return null;
  return <UpdateToast onReload={() => location.reload()} onDismiss={() => setUpdated(false)} />;
}
