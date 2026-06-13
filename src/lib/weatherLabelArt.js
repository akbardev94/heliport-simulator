/** IMC / VMC weather label components for the layout canvas. */

export const WEATHER_TYPES = ["imc", "vmc"];

export function isWeatherType(type) {
  return WEATHER_TYPES.includes(type);
}

/** Fabric group — compact sign ~2.8 m × 1 m. */
export function createWeatherLabel(fabric, kind, scalePxPerM) {
  const w = 2.8 * scalePxPerM;
  const h = 1 * scalePxPerM;
  const isImc = kind === "imc";
  const fill = isImc ? "#ea580c" : "#059669";
  const subtitle = isImc ? "Instrument" : "Visual";
  const strokeW = Math.max(1.5, h * 0.08);

  const bg = new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill,
    rx: 3,
    ry: 3,
    stroke: "#ffffff",
    strokeWidth: strokeW,
    selectable: false,
    evented: false,
  });

  const main = new fabric.Text(kind.toUpperCase(), {
    left: w * 0.5,
    top: h * 0.38,
    originX: "center",
    originY: "center",
    fontSize: Math.max(12, h * 0.42),
    fontWeight: "900",
    fill: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    selectable: false,
    evented: false,
  });

  const sub = new fabric.Text(subtitle, {
    left: w * 0.5,
    top: h * 0.72,
    originX: "center",
    originY: "center",
    fontSize: Math.max(8, h * 0.22),
    fontWeight: "600",
    fill: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    selectable: false,
    evented: false,
  });

  const group = new fabric.Group([bg, main, sub], { left: 0, top: 0 });
  group.heliType = kind;
  return group;
}

/** Default slot: pojok kanan atas — IMC di atas, VMC di bawahnya. */
export function defaultWeatherPosition(canvas, obj, kind) {
  const margin = 14;
  const gap = 6;
  const w = canvas.getWidth();
  const objW = obj.getScaledWidth();
  const objH = obj.getScaledHeight();

  let top = margin;
  if (kind === "vmc") {
    const imc = canvas.getObjects().find((o) => o.heliType === "imc");
    if (imc) top = imc.top + imc.getScaledHeight() + gap;
    else top = margin + objH + gap;
  }

  obj.set({
    left: w - objW - margin,
    top,
  });
  obj.setCoords();
}
