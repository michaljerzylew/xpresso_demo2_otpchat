import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { startThemeMode } from "@xp/theme";
import { startConfiguration } from "./configurator/boot";

startConfiguration();
const stopThemeMode = startThemeMode();
if (import.meta.hot) import.meta.hot.dispose(stopThemeMode);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
