import { useEffect, useState } from "react";
import { Sun, MoonStar } from "lucide-react";
import { SegmentedControl } from "@xp/primitives/segmented-control";
import { getThemePreference, isThemePreference, setThemePreference, themeModeEvent } from "@xp/theme";

export function ThemeControl() {
  const [preference, setPreference] = useState(getThemePreference);
  useEffect(() => {
    const update = () => setPreference(getThemePreference());
    window.addEventListener(themeModeEvent, update);
    return () => window.removeEventListener(themeModeEvent, update);
  }, []);
  return <SegmentedControl label="Color mode" value={preference} onChange={value => { if (isThemePreference(value)) setThemePreference(value); }} items={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />;
}

export function ThemeMenu() {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark");
  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === "dark");
    window.addEventListener(themeModeEvent, update);
    update();
    return () => window.removeEventListener(themeModeEvent, update);
  }, []);
  return <button type="button" className="icon-button theme-switcher" aria-label="Color mode" aria-pressed={dark}
    title={dark ? "Switch to light mode" : "Switch to dark mode"}
    onClick={() => setThemePreference(dark ? "light" : "dark")}>
    <Sun className="theme-sun" aria-hidden="true" /><MoonStar className="theme-moon" aria-hidden="true" />
  </button>;
}
