import { useState } from "react";
import { useLocation } from "react-router";
import { Stack } from "@xp/core/algebra";
import { generateRamp, cssColor, type ColorFamily } from "@xp/theme";
import { useDeviceClass } from "@xp/runtime";
import { MonitorSmartphone } from "lucide-react";
import { RoutePanes } from "../shell/AppShell";
import { ConfiguratorPanel, PanelHistory } from "../configurator/ConfiguratorPanel";
import { PreviewStrip } from "../configurator/PreviewStrip";
import { useConfigurator } from "../configurator/useConfigurator";
import { previewFlag } from "../configurator/preview";
import { useFrozenConfigurator } from "../configurator/frozen";
import type { Configurator } from "../configurator/useConfigurator";

const statusFamilies: readonly ColorFamily[] = ["primary", "accent", "success", "warning", "danger"];

/** The subject of the page: one dense sample of the parts a theme actually has to carry. */
function Specimen({ configurator }: { configurator: Configurator }) {
  const { state } = configurator;
  return <section className="cfg-specimen-card" aria-labelledby="specimen">
    <header><h2 id="specimen">Specimen</h2><p>The parts this workspace repeats most, in the look you are choosing.</p></header>
    <div className="cfg-specimen-card__grid">
      <div className="cfg-sample">
        <h3>Text and surfaces</h3>
        <p>Body copy on the page surface, at the spacing you have chosen.</p>
        <p className="cfg-sample__muted">Secondary copy, which contrast is measured against too.</p>
        <div className="cfg-sample__buttons">
          <button type="button" className="cfg-sample__primary">Save configuration</button>
          <button type="button">Discard</button>
        </div>
        <label className="cfg-sample__field">Workspace name
          <input name="specimen-name" defaultValue="Northwind operations" autoComplete="off" />
        </label>
      </div>
      <div className="cfg-sample">
        <h3>Status</h3>
        <ul className="cfg-chips">
          {statusFamilies.map(family => <li key={family} className="cfg-chip" data-family={family}>{family}</li>)}
        </ul>
        <h3>Elevation</h3>
        <div className="cfg-elevation">
          {(["s", "m", "l"] as const).map(size => <div key={size} className="cfg-elevation__card" data-size={size}>shadow&nbsp;{size}</div>)}
        </div>
        <h3>Greys</h3>
        <div className="cfg-ramp" role="img" aria-label="Neutral ramp, tones 50 to 950">
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(step =>
            <span key={step} className="cfg-ramp__tone" style={{ background: cssColor(generateRamp(state.colors.neutral)[step]) }} />)}
        </div>
      </div>
    </div>
  </section>;
}

function ConfigureSurface({ configurator, children }: { configurator: Configurator; children?: React.ReactNode }) {
  return <RoutePanes
    inspector={<ConfiguratorPanel configurator={configurator} />}
    inspectorActions={<PanelHistory configurator={configurator} />}
    inspectorLabels={{ title: "Customise", description: "Theme and layout for this workspace.", show: "Show configurator", hide: "Hide configurator", close: "Close configurator", text: "Customise" }}
    inspectorDefaultOpen
  >
    <Stack className="route-surface cfg-surface">
      <header id="summary">
        <p>Theme and layout</p>
        <h1>Customise</h1>
        <p>Change how this workspace looks, then take the result with you. Everything you touch applies immediately, here and in every preview.</p>
      </header>
      {children}
      <Specimen configurator={configurator} />
    </Stack>
  </RoutePanes>;
}

/** A frame renders the panel as a specimen; only the host document owns live state. */
function FramedConfigure() {
  return <ConfigureSurface configurator={useFrozenConfigurator()} />;
}

function LiveConfigure() {
  const configurator = useConfigurator();
  const deviceClass = useDeviceClass();
  const [route, setRoute] = useState("/");
  const [requested, setRequested] = useState(false);
  // Five live copies of the app is not something a phone should boot unasked, so the compact
  // classes offer the strip instead of mounting it.
  const compact = deviceClass === "M" || deviceClass === "TP";
  const strip = !compact || requested;
  return <ConfigureSurface configurator={configurator}>
    {compact ? <button type="button" className="cfg-strip__toggle" aria-expanded={requested} onClick={() => setRequested(!requested)}>
      <MonitorSmartphone aria-hidden="true" />{requested ? "Hide device previews" : "Show device previews"}
    </button> : null}
    {strip ? <PreviewStrip state={configurator.state} route={route} onRouteChange={setRoute} /> : null}
  </ConfigureSurface>;
}

/**
 * Only a configurator preview is frozen. `xp-frame=1` alone means a canonical-viewport host (the
 * device simulator, or the QA harness), which must exercise the real route.
 */
export function Configure() {
  const preview = new URLSearchParams(useLocation().search).get(previewFlag) === "1";
  return preview ? <FramedConfigure /> : <LiveConfigure />;
}
