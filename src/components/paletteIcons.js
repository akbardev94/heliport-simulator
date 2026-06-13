/** Palette icons matching the design mockup — inline SVG for SSR-safe hydration. */

import { WIND_CONE_ICON_URL } from "@/lib/windconeArt";
import { BUILDING_IMAGE_URL, TREE_IMAGE_URL } from "@/lib/obstacleArt";
import { MARSHALER_IMAGE_URL } from "@/lib/marshalerArt";

export function PaletteTlofIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="2" y="2" width="20" height="20" fill="#4f6868" stroke="#f0c931" strokeWidth="1.6" />
      <rect x="2" y="2" width="3.2" height="3.2" fill="#c99200" />
      <rect x="18.8" y="2" width="3.2" height="3.2" fill="#c99200" />
      <rect x="2" y="18.8" width="3.2" height="3.2" fill="#c99200" />
      <rect x="18.8" y="18.8" width="3.2" height="3.2" fill="#c99200" />
      <circle cx="12" cy="12" r="7.8" fill="none" stroke="#f0c931" strokeWidth="1.6" />
      <text
        x="12"
        y="15.8"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="10"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        H
      </text>
    </svg>
  );
}

export function PaletteTlofRooftopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="2" y="2" width="20" height="20" fill="#d8161f" stroke="#fff" strokeWidth="1.2" />
      <rect x="10.5" y="4" width="3" height="16" fill="#fff" />
      <rect x="4" y="10.5" width="16" height="3" fill="#fff" />
      <text x="12" y="14.5" textAnchor="middle" fill="#d8161f" fontSize="8" fontWeight="900" fontFamily="Arial, sans-serif">
        H
      </text>
    </svg>
  );
}

export function PaletteFatoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#1e293b" strokeWidth="2.5" />
    </svg>
  );
}

export function PaletteSafetyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#16a34a" strokeWidth="2.5" />
    </svg>
  );
}

export function PaletteApproachIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="text-brand">
      <path
        d="M5 12h11.5M14 8l5 4-5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaletteWindconeIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${WIND_CONE_ICON_URL}?width=44&height=44`}
      width={22}
      height={22}
      alt=""
      draggable={false}
    />
  );
}

export function PaletteGedungIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BUILDING_IMAGE_URL} width={22} height={22} alt="" draggable={false} className="object-contain" />
  );
}

export function PalettePohonIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={TREE_IMAGE_URL} width={22} height={22} alt="" draggable={false} className="object-contain" />
  );
}

export function PaletteImcIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#ea580c" stroke="#fff" strokeWidth="1.2" />
      <text x="12" y="13.5" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="900" fontFamily="Arial, sans-serif">
        IMC
      </text>
    </svg>
  );
}

export function PaletteVmcIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#059669" stroke="#fff" strokeWidth="1.2" />
      <text x="12" y="13.5" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="900" fontFamily="Arial, sans-serif">
        VMC
      </text>
    </svg>
  );
}

export function PaletteMarshalerIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={MARSHALER_IMAGE_URL} width={22} height={22} alt="" draggable={false} className="object-contain" />
  );
}

export function PaletteTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden className="text-red-500">
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const PALETTE_CUSTOM_ICONS = {
  tlof: PaletteTlofIcon,
  "tlof-rooftop": PaletteTlofRooftopIcon,
  fato: PaletteFatoIcon,
  safety: PaletteSafetyIcon,
  approach: PaletteApproachIcon,
  windcone: PaletteWindconeIcon,
  imc: PaletteImcIcon,
  vmc: PaletteVmcIcon,
  marshaler: PaletteMarshalerIcon,
  "obstacle-gedung": PaletteGedungIcon,
  "obstacle-pohon": PalettePohonIcon,
};
