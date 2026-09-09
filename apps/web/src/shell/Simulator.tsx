import { type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { deviceClasses, parseDeviceClass, previewSizes } from "@xp/runtime";
import { MonitorSmartphone } from "lucide-react";

export function PreviewControl() {
  const location = useLocation();
  const navigate = useNavigate();
  const parameters = new URLSearchParams(location.search);
  const selected = parseDeviceClass(parameters.get("xp"));
  if ((!import.meta.env?.DEV && !parameters.has("xp")) || parameters.get("xp-frame") === "1") return null;
  return <label className="device-switcher"><MonitorSmartphone aria-hidden="true" /><select aria-label="Device class preview" value={selected ?? ""} onChange={(event) => {
        if (event.target.value) parameters.set("xp", event.target.value); else parameters.delete("xp");
        navigate({ pathname: location.pathname, search: parameters.toString(), hash: location.hash });
      }}><option value="">Auto</option>{deviceClasses.map((value) => <option key={value}>{value}</option>)}</select></label>;
}

export function Simulator({ children }: { children: ReactNode }) {
  const location = useLocation();
  const parameters = new URLSearchParams(location.search);
  const selected = parseDeviceClass(parameters.get("xp"));
  if (!selected || parameters.get("xp-frame") === "1") return <>{children}<PreviewControl /></>;
  parameters.set("xp-frame", "1");
  return <div className="device-preview"><div className="preview-canvas"><iframe title={selected + " preview"} src={location.pathname + "?" + parameters + location.hash} style={{ width: previewSizes[selected].width, height: previewSizes[selected].height }} /></div><PreviewControl /></div>;
}
