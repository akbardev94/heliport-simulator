/** Building & tree obstacle PNG assets for canvas and palette. */

export const BUILDING_IMAGE_URL = "/building.png";
export const TREE_IMAGE_URL = "/tree.png";

export const OBSTACLE_SIZES_M = {
  gedung: 6,
  pohon: 4,
};

/** Load PNG as Fabric.Image scaled to footprint width (metres → px). */
export function loadObstacleImage(fabric, kind, scalePxPerM, onReady) {
  const url = kind === "pohon" ? TREE_IMAGE_URL : BUILDING_IMAGE_URL;
  const targetW = OBSTACLE_SIZES_M[kind] * scalePxPerM;

  fabric.Image.fromURL(
    url,
    (img) => {
      if (!img) {
        onReady?.(null);
        return;
      }
      const scale = targetW / (img.width || targetW);
      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: "left",
        originY: "top",
      });
      img.heliType = "obstacle";
      img.heliObstacleKind = kind;
      onReady?.(img);
    },
    { crossOrigin: "anonymous" }
  );
}

export function obstacleKindFromType(type) {
  if (type === "obstacle-pohon") return "pohon";
  return "gedung";
}

export function isObstacleType(type) {
  return type === "obstacle-gedung" || type === "obstacle-pohon";
}
