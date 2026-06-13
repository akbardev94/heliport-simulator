/** Marshaler (ground guide) PNG asset for canvas and palette. */

export const MARSHALER_IMAGE_URL = "/marshaler.png";

/** Person height on canvas (~1,8 m). */
export const MARSHALER_HEIGHT_M = 1.8;

export function loadMarshalerImage(fabric, scalePxPerM, onReady) {
  const targetH = MARSHALER_HEIGHT_M * scalePxPerM;

  fabric.Image.fromURL(
    MARSHALER_IMAGE_URL,
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
      img.heliType = "marshaler";
      onReady?.(img);
    },
    { crossOrigin: "anonymous" }
  );
}
