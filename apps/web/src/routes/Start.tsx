import { Link } from "react-router";
import { RoutePanes } from "../shell/AppShell";
import { brand } from "../app-modules";
import "../modules/start/start.css";

export function Start() {
  return <RoutePanes><section className="start-screen">
    <h1>{brand.name}</h1>
    <p>No screens are built yet.</p>
    <Link className="kit-button" data-tone="primary" data-variant="solid" to="/configure">Configure workspace</Link>
  </section></RoutePanes>;
}
