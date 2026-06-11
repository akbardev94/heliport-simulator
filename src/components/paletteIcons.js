/** Palette icons matching the design mockup. */

export function PaletteTlofIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#f59e0b" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
      >
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

export const PALETTE_CUSTOM_ICONS = {
  tlof: PaletteTlofIcon,
  fato: PaletteFatoIcon,
  safety: PaletteSafetyIcon,
};
