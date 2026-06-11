/** Palette item definitions — icons via Iconify, colours match the design mockup. */

import { WIND_CONE_ICON } from "./windconeArt";

export const PALETTE_ITEMS = [
  {
    type: "tlof",
    label: "TLOF",
    icon: "mdi:alpha-h-circle-outline",
    color: "#f59e0b",
    className: "text-amber-500",
    draggable: true,
    hint: "Klik atau drag TLOF ke kanvas — bisa dipindah",
  },
  {
    type: "fato",
    label: "FATO",
    icon: "tabler:square-dashed",
    color: "#64748b",
    className: "text-slate-500",
    draggable: true,
    hint: "Klik atau drag FATO ke kanvas — bisa dipindah",
  },
  {
    type: "safety",
    label: "Safety Area",
    icon: "tabler:square-dashed",
    color: "#16a34a",
    className: "text-green-600",
    draggable: true,
    hint: "Klik atau drag Safety Area ke kanvas — bisa dipindah",
  },
  {
    type: "approach",
    label: "Approach",
    icon: "mdi:arrow-right-bold",
    color: "#1f4e9c",
    className: "text-brand",
    draggable: true,
    hint: "Klik atau drag ke kanvas",
  },
  {
    type: "windcone",
    label: "Wind Cone",
    icon: WIND_CONE_ICON,
    colorIcon: true,
    draggable: true,
    hint: "Klik atau drag ke kanvas",
  },
  {
    type: "obstacle",
    label: "Obstacle",
    icon: "mdi:cube-outline",
    color: "#475569",
    className: "text-slate-600",
    draggable: true,
    hint: "Klik atau drag ke kanvas",
  },
];

export const DRAGGABLE_TYPES = PALETTE_ITEMS.filter((p) => p.draggable).map(
  (p) => p.type
);

export const BASE_TYPES = ["tlof", "fato", "safety"];
