"use client";

import { WIND_CONE_ICON_URL } from "@/lib/windconeArt";

/**
 * Compass showing dominant wind bearing.
 * windDir: degrees, 0 = North, clockwise (meteorological).
 */
export default function WindRose({ windDir = 270 }) {
  const cx = 70;
  const cy = 70;

  return (
    <svg viewBox="0 0 140 140" width="140" height="140" aria-hidden>
      {/* outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r="60"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="4 5"
      />

      {/* cardinal labels */}
      {[
        { d: "N", x: cx, y: 14 },
        { d: "E", x: 126, y: cy + 3 },
        { d: "S", x: cx, y: 128 },
        { d: "W", x: 14, y: cy + 3 },
      ].map(({ d, x, y }) => (
        <text
          key={d}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#94a3b8"
        >
          {d}
        </text>
      ))}

      {/* wind direction arrow — rotates with bearing */}
      <g transform={`rotate(${windDir} ${cx} ${cy})`}>
        <line
          x1={cx}
          y1={cy + 18}
          x2={cx}
          y2={cy - 36}
          stroke="#1f4e9c"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d={`M${cx} ${cy - 44} L${cx - 7} ${cy - 30} L${cx + 7} ${cy - 30} Z`} fill="#1f4e9c" />
      </g>

      {/* wind cone — fixed top-right on rim */}
      <image
        href={`${WIND_CONE_ICON_URL}?width=64&height=64`}
        x={86}
        y={6}
        width={36}
        height={36}
      />

      {/* hub */}
      <circle cx={cx} cy={cy} r="3.5" fill="#1f4e9c" />
    </svg>
  );
}
