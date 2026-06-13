/** Palette item definitions — icons via Iconify, colours match the design mockup. */

import { WIND_CONE_ICON } from "./windconeArt";

export const TLOF_TYPES = ["tlof", "tlof-rooftop"];

export const PALETTE_ITEMS = [
  {
    type: "tlof",
    label: "TLOF",
    icon: "mdi:alpha-h-circle-outline",
    color: "#f59e0b",
    className: "text-amber-500",
    draggable: true,
    hint: "TLOF standar ICAO — klik atau drag ke kanvas",
  },
  {
    type: "tlof-rooftop",
    label: "TLOF Atap",
    icon: "mdi:hospital-box",
    color: "#d8161f",
    className: "text-red-600",
    draggable: true,
    hint: "TLOF helipad atap (merah + salib) — klik atau drag ke kanvas",
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
    type: "imc",
    label: "IMC",
    icon: "mdi:weather-cloudy",
    color: "#ea580c",
    className: "text-orange-600",
    draggable: true,
    hint: "Label IMC — default pojok kanan atas, bisa digeser",
  },
  {
    type: "vmc",
    label: "VMC",
    icon: "mdi:weather-sunny",
    color: "#059669",
    className: "text-green-600",
    draggable: true,
    hint: "Label VMC — default pojok kanan atas, bisa digeser",
  },
  {
    type: "marshaler",
    label: "Marshaler",
    icon: "mdi:account-hard-hat",
    color: "#f97316",
    className: "text-orange-500",
    draggable: true,
    hint: "Klik atau drag marshaler ke kanvas — bisa dipindah",
  },
  {
    type: "obstacle-gedung",
    label: "Gedung",
    icon: "mdi:office-building",
    color: "#475569",
    className: "text-slate-600",
    draggable: true,
    hint: "Klik atau drag gedung ke kanvas sebagai obstacle",
  },
  {
    type: "obstacle-pohon",
    label: "Pohon",
    icon: "mdi:tree",
    color: "#15803d",
    className: "text-green-700",
    draggable: true,
    hint: "Klik atau drag pohon ke kanvas sebagai obstacle",
  },
];

export const DRAGGABLE_TYPES = PALETTE_ITEMS.filter((p) => p.draggable).map(
  (p) => p.type
);

export const BASE_TYPES = [...TLOF_TYPES, "fato", "safety"];

export function isTlofType(type) {
  return TLOF_TYPES.includes(type);
}
