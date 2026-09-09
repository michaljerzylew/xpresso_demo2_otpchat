/** Public application components. Import kit.css once after shell styles; no .kit ancestor
 * is required. Theme/runtime provide tokens and data-xp-class at the app boundary.
 * Shell defaults < component roots < component state is the specificity order.
 */
export * from "./components";
export * from "./forms";
export { RecordDeck } from "@xp/primitives";
export { KitLayer as Layer } from "../../shell/KitLayer";
