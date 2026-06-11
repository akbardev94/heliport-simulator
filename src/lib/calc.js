// Heliport dimensioning engine.
// References: ICAO Annex 14 Vol II, ICAO Doc 9261 (Heliport Manual),
// FAA AC 150/5390-2D.
//
// All linear results are in metres, rounded to 2 decimals for display.

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// D-value: the largest overall dimension of the helicopter (rotors turning).
export function dValue(spec) {
  return Math.max(Number(spec.D) || 0, Number(spec.OL) || 0);
}

// TLOF (Touchdown and Lift-Off area) minimum dimension.
// ICAO: a surface able to contain a circle of diameter >= 0.83 D.
export function tlofMin(spec) {
  return round2(0.83 * (Number(spec.D) || 0));
}

// FATO (Final Approach and Take-Off area) minimum dimension.
// For Performance Class 1 (surface-level), >= 1.0 D.
export function fatoMin(spec) {
  return round2(1.0 * (Number(spec.D) || 0));
}

// Safety Area: extends beyond the FATO. Width is the greater of 3 m or 0.25 D.
export function safetyAreaWidth(spec) {
  return round2(Math.max(3, 0.25 * (Number(spec.D) || 0)));
}

// Overall FATO + safety area extent (diameter).
export function overallSafetyExtent(spec) {
  return round2(fatoMin(spec) + 2 * safetyAreaWidth(spec));
}

// Approach / Take-off climb surface (simplified PANS/Annex 14 first section).
// Inner edge width = FATO width; divergence each side = 10%; slope by PC.
export function approachSurface(spec) {
  const pc = Number(spec.vmc) || 1;
  const slope = pc === 1 ? 0.08 : pc === 2 ? 0.1 : 0.125; // 8% / 10% / 12.5%
  return {
    innerWidth: fatoMin(spec),
    divergence: 0.1, // 10% each side
    slopePercent: round2(slope * 100),
    firstSectionLength: pc === 1 ? 245 : 245, // m (first section, simplified)
  };
}

// Full result set used across the UI.
export function computeAll(spec) {
  const D = Number(spec.D) || 0;
  return {
    D,
    dValue: round2(dValue(spec)),
    tlof: tlofMin(spec),
    fato: fatoMin(spec),
    safety: safetyAreaWidth(spec),
    overall: overallSafetyExtent(spec),
    approach: approachSurface(spec),
  };
}

// Compare a designed dimension against the minimum requirement.
// Returns "ok" | "warn" | "na".
export function checkStatus(designValue, minValue) {
  if (designValue == null || isNaN(designValue)) return "na";
  if (designValue >= minValue) return "ok";
  return "warn";
}

// --- Approach / take-off climb surface full geometry ---
// Simplified first-section model (ICAO Annex 14 Vol II / Doc 9261).
export function approachGeometry(spec) {
  const a = approachSurface(spec);
  const L = a.firstSectionLength;
  const widthEnd = round2(a.innerWidth + 2 * a.divergence * L);
  const rise = round2((a.slopePercent / 100) * L);
  return { ...a, length: L, widthEnd, rise };
}

// Rotor disc & approximate footprint area.
export function areas(spec) {
  const D = Number(spec.D) || 0;
  const rotorDisc = round2(Math.PI * Math.pow(D / 2, 2));
  const fato = fatoMin(spec);
  const fatoArea = round2(fato * fato);
  const tlof = tlofMin(spec);
  const tlofArea = round2(tlof * tlof);
  const overall = overallSafetyExtent(spec);
  const totalArea = round2(overall * overall);
  return { rotorDisc, fatoArea, tlofArea, totalArea };
}

// Build a complete, ordered list of calculation steps with LaTeX.
export function computeSteps(spec) {
  const D = Number(spec.D) || 0;
  const OL = Number(spec.OL) || 0;
  const dv = dValue(spec);
  const tlof = tlofMin(spec);
  const fato = fatoMin(spec);
  const sa = safetyAreaWidth(spec);
  const overall = overallSafetyExtent(spec);
  const ap = approachGeometry(spec);
  const ar = areas(spec);

  return [
    {
      id: "dvalue",
      title: "D-value (dimensi terbesar helikopter)",
      desc: "Nilai acuan ukuran heliport, diambil dari dimensi terbesar antara rotor diameter (D) dan overall length (OL).",
      steps: [
        `D\\text{-value} = \\max(D,\\ OL)`,
        `= \\max(${D},\\ ${OL})`,
        `= ${round2(dv)}\\,\\text{m}`,
      ],
      result: round2(dv),
      unit: "m",
    },
    {
      id: "tlof",
      title: "TLOF (Touchdown & Lift-Off area)",
      desc: "Area pendaratan & lepas landas. Minimal mampu memuat lingkaran berdiameter 0,83 D.",
      steps: [
        `TLOF_{min} = 0.83 \\times D`,
        `= 0.83 \\times ${D}`,
        `= ${tlof}\\,\\text{m}`,
      ],
      result: tlof,
      unit: "m",
    },
    {
      id: "fato",
      title: "FATO (Final Approach & Take-Off area)",
      desc: "Area approach akhir & lepas landas. Untuk Performance Class 1 di permukaan, minimal 1,0 D.",
      steps: [
        `FATO_{min} = 1.0 \\times D`,
        `= 1.0 \\times ${D}`,
        `= ${fato}\\,\\text{m}`,
      ],
      result: fato,
      unit: "m",
    },
    {
      id: "safety",
      title: "Safety Area",
      desc: "Area pengaman mengelilingi FATO. Lebar diambil yang terbesar antara 3 m atau 0,25 D.",
      steps: [
        `SA = \\max(3,\\ 0.25 \\times D)`,
        `= \\max(3,\\ 0.25 \\times ${D})`,
        `= \\max(3,\\ ${round2(0.25 * D)})`,
        `= ${sa}\\,\\text{m}`,
      ],
      result: sa,
      unit: "m",
    },
    {
      id: "overall",
      title: "Total Extent (FATO + 2 × Safety Area)",
      desc: "Total bentang sisi luar area pengaman.",
      steps: [
        `Total = FATO + 2 \\times SA`,
        `= ${fato} + 2 \\times ${sa}`,
        `= ${overall}\\,\\text{m}`,
      ],
      result: overall,
      unit: "m",
    },
    {
      id: "approach-w",
      title: "Lebar Akhir Approach Surface",
      desc: `Permukaan approach melebar 10% tiap sisi sepanjang ${ap.length} m (seksi pertama).`,
      steps: [
        `W_{akhir} = W_{dalam} + 2 \\times d \\times L`,
        `= ${ap.innerWidth} + 2 \\times 0.10 \\times ${ap.length}`,
        `= ${ap.widthEnd}\\,\\text{m}`,
      ],
      result: ap.widthEnd,
      unit: "m",
    },
    {
      id: "approach-rise",
      title: "Kenaikan (Rise) Approach Surface",
      desc: `Kemiringan ${ap.slopePercent}% (sesuai Performance Class ${spec.vmc}).`,
      steps: [
        `Rise = slope \\times L`,
        `= ${(ap.slopePercent / 100).toFixed(3)} \\times ${ap.length}`,
        `= ${ap.rise}\\,\\text{m}`,
      ],
      result: ap.rise,
      unit: "m",
    },
    {
      id: "rotor",
      title: "Luas Piringan Rotor",
      desc: "Luas area yang disapu rotor utama.",
      steps: [
        `A_{rotor} = \\pi \\left(\\tfrac{D}{2}\\right)^2`,
        `= \\pi \\left(\\tfrac{${D}}{2}\\right)^2`,
        `= ${ar.rotorDisc}\\,\\text{m}^2`,
      ],
      result: ar.rotorDisc,
      unit: "m²",
    },
    {
      id: "area-total",
      title: "Luas Total Heliport",
      desc: "Perkiraan luas keseluruhan (Total Extent²).",
      steps: [
        `A_{total} = Total^2`,
        `= ${overall}^2`,
        `= ${ar.totalArea}\\,\\text{m}^2`,
      ],
      result: ar.totalArea,
      unit: "m²",
    },
  ];
}

// --- Geometry helpers (canvas px coordinates) ---
function rectContains(outer, inner, tol = 1) {
  if (!outer || !inner) return false;
  return (
    inner.left >= outer.left - tol &&
    inner.top >= outer.top - tol &&
    inner.left + inner.width <= outer.left + outer.width + tol &&
    inner.top + inner.height <= outer.top + outer.height + tol
  );
}

function rectsIntersect(a, b) {
  if (!a || !b) return false;
  return !(
    a.left + a.width < b.left ||
    b.left + b.width < a.left ||
    a.top + a.height < b.top ||
    b.top + b.height < a.top
  );
}

// Validate the student's design against the basic rules from the brief.
// `geo` comes from LayoutCanvas.getGeometry().
// Returns an ordered list of checks: { id, label, status, message }.
// status: "ok" | "fail" | "na"
export function validateDesign(dims, geo, lokasi) {
  if (!geo) return [];
  const has = (t) => geo.present?.includes(t);
  const { areas, obstacles = [], approaches = [], windcone } = geo;
  const s = geo.scale || 1;
  const out = [];

  // Designed sizes (metres) derived from the drawn base squares.
  const tlofM = areas?.tlof ? areas.tlof.width / s : 0;
  const fatoM = areas?.fato ? areas.fato.width / s : 0;
  const safetyTotalM = areas?.safety ? areas.safety.width / s : 0;

  // 1. TLOF minimum
  out.push({
    id: "tlof-min",
    label: "Ukuran TLOF",
    status: !has("tlof") ? "na" : tlofM >= dims.tlof - 0.05 ? "ok" : "fail",
    message: !has("tlof")
      ? "TLOF belum digambar."
      : tlofM >= dims.tlof - 0.05
      ? `Ukuran TLOF memenuhi minimum (${round2(tlofM)} m ≥ ${dims.tlof} m).`
      : "Ukuran TLOF belum memenuhi minimum.",
  });

  // 2. FATO minimum
  out.push({
    id: "fato-min",
    label: "Ukuran FATO",
    status: !has("fato") ? "na" : fatoM >= dims.fato - 0.05 ? "ok" : "fail",
    message: !has("fato")
      ? "FATO belum digambar."
      : fatoM >= dims.fato - 0.05
      ? `Ukuran FATO memenuhi minimum (${round2(fatoM)} m ≥ ${dims.fato} m).`
      : "Ukuran FATO belum memenuhi minimum.",
  });

  // 3. Safety area sufficient
  const safetyBandM = round2((safetyTotalM - fatoM) / 2);
  out.push({
    id: "safety-min",
    label: "Safety Area",
    status: !has("safety") ? "na" : safetyBandM >= dims.safety - 0.05 ? "ok" : "fail",
    message: !has("safety")
      ? "Safety Area belum digambar."
      : safetyBandM >= dims.safety - 0.05
      ? `Safety Area cukup (${safetyBandM} m ≥ ${dims.safety} m).`
      : "Safety Area terlalu kecil.",
  });

  // 4. TLOF inside FATO
  const tlofInFato = rectContains(areas?.fato, areas?.tlof);
  out.push({
    id: "tlof-in-fato",
    label: "TLOF di dalam FATO",
    status: !(has("tlof") && has("fato")) ? "na" : tlofInFato ? "ok" : "fail",
    message: !(has("tlof") && has("fato"))
      ? "TLOF/FATO belum lengkap."
      : tlofInFato
      ? "TLOF berada di dalam FATO."
      : "TLOF berada di luar FATO.",
  });

  // 5. FATO inside Safety Area
  const fatoInSafety = rectContains(areas?.safety, areas?.fato);
  out.push({
    id: "fato-in-safety",
    label: "FATO di dalam Safety Area",
    status: !(has("fato") && has("safety")) ? "na" : fatoInSafety ? "ok" : "fail",
    message: !(has("fato") && has("safety"))
      ? "FATO/Safety Area belum lengkap."
      : fatoInSafety
      ? "FATO berada di dalam Safety Area."
      : "FATO berada di luar Safety Area.",
  });

  // 6. Wind Cone availability
  out.push({
    id: "windcone",
    label: "Wind Cone",
    status: windcone ? "ok" : "fail",
    message: windcone ? "Wind Cone sudah tersedia." : "Wind Cone belum ditambahkan.",
  });

  // 7. Obstacle clear of approach/departure path
  let obstacleClear = true;
  if (obstacles.length && approaches.length) {
    obstacleClear = !obstacles.some((o) =>
      approaches.some((a) => rectsIntersect(o, a))
    );
  }
  out.push({
    id: "obstacle-approach",
    label: "Obstacle vs Approach Path",
    status:
      obstacles.length === 0
        ? "ok"
        : approaches.length === 0
        ? "na"
        : obstacleClear
        ? "ok"
        : "fail",
    message:
      obstacles.length === 0
        ? "Tidak ada obstacle yang mengganggu."
        : approaches.length === 0
        ? "Approach path belum digambar."
        :       obstacleClear
        ? "Approach/departure path bebas obstacle."
        : "Obstacle berada di jalur approach/departure.",
  });

  // 8. Land area fits the required total extent (uses location input)
  const panjang = Number(lokasi?.panjang) || 0;
  const lebar = Number(lokasi?.lebar) || 0;
  if (panjang > 0 && lebar > 0) {
    const fits = panjang >= dims.overall && lebar >= dims.overall;
    out.push({
      id: "land-fit",
      label: "Luas Lahan",
      status: fits ? "ok" : "fail",
      message: fits
        ? `Lahan ${panjang}×${lebar} m memadai (butuh ${dims.overall}×${dims.overall} m).`
        : `Lahan ${panjang}×${lebar} m terlalu kecil (butuh ${dims.overall}×${dims.overall} m).`,
    });
  }

  return out;
}

// Build the summary verdict + warning list from validateDesign output.
export function designVerdict(checks) {
  const fails = checks.filter((c) => c.status === "fail");
  return {
    passed: fails.length === 0 && checks.length > 0,
    warnings: fails.map((c) => c.message),
    message:
      fails.length === 0 && checks.length > 0
        ? "Desain memenuhi persyaratan dasar."
        : "Desain belum memenuhi persyaratan dasar.",
  };
}

// Simple recommendation engine based on inputs.
export function recommendations(spec, lokasi, checks) {
  const out = [];
  const D = Number(spec.D) || 0;
  const mtom = Number(spec.MTOM) || 0;
  const pc = Number(spec.vmc) || 1;
  if (D <= 0) out.push("Masukkan Rotor Diameter (D) yang valid (> 0).");
  if (pc !== 1)
    out.push(
      `Performance Class ${pc}: tinjau kembali area pengaman & prosedur engine-failure (kebutuhan dapat lebih besar dari PC 1).`
    );
  if (mtom > 7000)
    out.push("MTOM besar (> 7 t): pastikan kekuatan struktur TLOF & dynamic load factor terpenuhi.");

  // Recommendations derived from failed design checks
  (checks || []).forEach((c) => {
    if (c.status !== "fail") return;
    if (c.id === "windcone") out.push("Tambahkan Wind Cone agar arah angin terlihat.");
    else if (c.id === "obstacle-approach")
      out.push("Geser obstacle keluar dari jalur approach/departure.");
    else if (c.id === "land-fit")
      out.push("Perluas lahan atau pilih helikopter dengan rotor diameter lebih kecil.");
    else if (c.id === "tlof-min") out.push("Perbesar TLOF hingga ≥ 0,83 × D.");
    else if (c.id === "safety-min") out.push("Perlebar Safety Area di sekeliling FATO.");
  });

  const panjang = Number(lokasi?.panjang) || 0;
  if (!panjang) out.push("Isi panjang & lebar lahan untuk memeriksa kecukupan area.");
  out.push("Orientasikan FATO/approach searah angin dominan untuk performa terbaik.");
  return out;
}
