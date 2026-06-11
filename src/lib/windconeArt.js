/** Wind cone icon (Iconify) — shared across palette, canvas, and drag preview. */

export const WIND_CONE_ICON = "streamline-cyber-color:wind-flag";
export const WIND_CONE_ICON_URL =
  "https://api.iconify.design/streamline-cyber-color/wind-flag.svg";

const CANVAS_HEIGHT_M = 8;

/** Load wind-flag icon as a Fabric.Image scaled to canvas metres. */
export function loadWindconeImage(fabric, scalePxPerM, onReady) {
  const targetH = Math.max(40, CANVAS_HEIGHT_M * scalePxPerM);
  const url = `${WIND_CONE_ICON_URL}?height=${Math.round(targetH * 2)}`;

  fabric.Image.fromURL(
    url,
    (img) => {
      if (!img) {
        onReady?.(null);
        return;
      }
      const scale = targetH / (img.height || targetH);
      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: "left",
        originY: "top",
      });
      img.heliType = "windcone";
      onReady?.(img);
    },
    { crossOrigin: "anonymous" }
  );
}

/** DOM element for HTML5 drag preview. */
export function makeWindconeDragGhost() {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:72px;height:80px;" +
    "display:flex;align-items:center;justify-content:center;" +
    "background:#fff;border:1px solid #e2e8f0;border-radius:10px;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.15);pointer-events:none;z-index:9999;";
  const img = document.createElement("img");
  img.src = `${WIND_CONE_ICON_URL}?width=48&height=48`;
  img.width = 44;
  img.height = 44;
  img.alt = "";
  img.draggable = false;
  wrap.appendChild(img);
  document.body.appendChild(wrap);
  return wrap;
}
