"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { toPng } from "html-to-image";
import { HELICOPTERS, WIND_DIRECTIONS } from "@/lib/helicopters";
import {
  computeAll,
  checkStatus,
  computeSteps,
  recommendations,
  validateDesign,
  designVerdict,
} from "@/lib/calc";
import {
  IconArrow,
  IconTrash,
  IconCheck,
  IconWarn,
} from "@/components/icons";
import SiteHeader, { MahasiswaModal } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { isMahasiswaComplete, useMahasiswa } from "@/lib/session";
import LayoutCanvas from "@/components/LayoutCanvas";
import PaletteBar from "@/components/PaletteBar";
import WindRose from "@/components/WindRose";
import Preview2D from "@/components/Preview2D";
import { buildHeliportPdf } from "@/lib/exportPdf";

const View3D = dynamic(
  () => import(/* webpackChunkName: "view3d-preview" */ "@/components/View3D"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
        Memuat pratinjau 3D…
      </div>
    ),
  }
);

const STEPS = ["INPUT DATA", "PILIH KOMPONEN", "DESAIN LAYOUT", "CEK & HASIL"];

export default function Page() {
  const [step, setStep] = useState(0);
  const [helicopter, setHelicopter] = useState("aw139");
  const [spec, setSpec] = useState({ D: 13.8, OL: 16.66, UCW: 2.3, MTOM: 6400, vmc: 1 });
  const [lokasi, setLokasi] = useState({ panjang: 60, lebar: 60, adaObstacle: false });
  const [present, setPresent] = useState([]);
  const [selInfo, setSelInfo] = useState(null);
  const [validation, setValidation] = useState(null); // array of checks or null
  const [dimHitung, setDimHitung] = useState(false);
  const { mahasiswa, save } = useMahasiswa();
  const [pdfProfileOpen, setPdfProfileOpen] = useState(false);

  const canvasRef = useRef(null);
  const resultRef = useRef(null);
  const view3dRef = useRef(null);

  const dims = useMemo(() => computeAll(spec), [spec]);
  const windDir = lokasi.arahAngin ?? 270;
  const setWindDir = (v) => setLokasi((l) => ({ ...l, arahAngin: v }));

  const verdict = useMemo(
    () => (validation ? designVerdict(validation) : null),
    [validation]
  );

  function hitungDimensi() {
    setDimHitung(true);
  }

  function cekDesain() {
    const geo = canvasRef.current?.getGeometry?.();
    const result = validateDesign(dims, geo, lokasi);
    setValidation(result);
    setStep(3);
  }

  function onSelectHelicopter(id) {
    setHelicopter(id);
    const h = HELICOPTERS.find((x) => x.id === id);
    if (h && id !== "custom") {
      setSpec((s) => ({ ...s, D: h.D, OL: h.OL, UCW: h.UCW, MTOM: h.MTOM }));
    }
  }

  function field(key, value) {
    setSpec((s) => ({ ...s, [key]: value === "" ? "" : Number(value) }));
    if (helicopter !== "custom") setHelicopter("custom");
  }

  const checks = useMemo(() => {
    const has = (t) => present.includes(t);
    return [
      { name: "TLOF", min: `≥ 0.83 D`, minVal: dims.tlof, design: has("tlof") ? dims.tlof : null, unit: "m" },
      { name: "FATO", min: `≥ 1 D`, minVal: dims.fato, design: has("fato") ? dims.fato : null, unit: "m" },
      { name: "Safety Area", min: `≥ 3 m / 0.25 D`, minVal: dims.safety, design: has("safety") ? dims.safety : null, unit: "m" },
      { name: "Approach Path", min: `Bebas Obstacle`, minVal: null, design: has("approach") ? 1 : null, unit: "" },
      { name: "Wind Cone", min: `Tersedia`, minVal: null, design: has("windcone") ? 1 : null, unit: "" },
    ];
  }, [present, dims]);

  async function exportPNG() {
    const node = step === 3 ? resultRef.current : canvasRef.current?.getCanvasEl()?.parentElement;
    if (!node) return;
    const url = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = url;
    a.download = "heliport-layout.png";
    a.click();
  }

  function buildPdfReport(mhs) {
    const heliName =
      HELICOPTERS.find((h) => h.id === helicopter)?.name ||
      (helicopter === "custom" ? "Custom" : helicopter);
    const windLabel =
      WIND_DIRECTIONS.find((w) => w.value === Number(lokasi?.arahAngin ?? 270))?.label ?? "-";

    buildHeliportPdf({
      mahasiswa: mhs,
      heliName,
      spec,
      lokasi,
      windLabel,
      dims,
      validation,
      verdict,
      checks,
      steps: computeSteps(spec),
      recs: recommendations(spec, lokasi, validation),
      layoutPng: canvasRef.current?.exportDataURL?.(),
      view3dPng: view3dRef.current?.captureSnapshot?.(),
    });
  }

  function exportPDF() {
    if (!isMahasiswaComplete(mahasiswa)) {
      setPdfProfileOpen(true);
      return;
    }
    buildPdfReport(mahasiswa);
  }

  const allOk =
    present.includes("tlof") &&
    present.includes("fato") &&
    present.includes("safety");

  return (
    <MathJaxContext>
      <div className="min-h-screen">
        <SiteHeader />
        <Stepper step={step} setStep={setStep} />

        <main className="mx-auto max-w-[1400px] px-4 pb-16">
          {/* layout: left input, center canvas, right results */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* LEFT */}
            <section className="space-y-4 lg:col-span-3">
              <InputPanel
                helicopter={helicopter}
                onSelectHelicopter={onSelectHelicopter}
                spec={spec}
                field={field}
              />
              <LocationPanel
                windDir={windDir}
                setWindDir={setWindDir}
                lokasi={lokasi}
                setLokasi={setLokasi}
              />
              <MinDimPanel dims={dims} highlight={dimHitung} onHitung={hitungDimensi} />
            </section>

            {/* CENTER */}
            <section className="lg:col-span-6">
              <div className="card overflow-hidden">
                <div className="card-header bg-brand flex items-center justify-between">
                  <span>3. DESAIN LAYOUT (DRAG &amp; DROP KOMPONEN KE AREA)</span>
                </div>
                <div className="p-4">
                  <PaletteBar
                    onAdd={(t) => canvasRef.current?.addComponent(t)}
                    onDelete={() => canvasRef.current?.removeSelected()}
                    onHighlightBase={(t) => canvasRef.current?.highlightBase(t)}
                  />
                  <p className="my-3 flex items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800 ring-1 ring-sky-100">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-[10px] font-bold text-white">i</span>
                    Petunjuk: Klik atau drag komponen ke kanvas. TLOF, FATO, dan Safety Area bisa dipilih, digeser, atau dihapus dengan tombol Del / Backspace.
                  </p>
                  <LayoutCanvas
                      ref={canvasRef}
                      dims={dims}
                      onComponentsChange={setPresent}
                      onSelectInfo={setSelInfo}
                      selectInfo={selInfo}
                    />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button className="btn-primary" onClick={() => canvasRef.current?.reset()}>
                        Reset Kanvas
                      </button>
                      <button className="btn-ghost" onClick={() => canvasRef.current?.clearComponents()}>
                        <IconTrash /> Hapus Semua
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost" onClick={exportPNG}>
                        Simpan PNG
                      </button>
                      <button className="btn-primary" onClick={cekDesain}>
                        Cek Desain <IconArrow />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="space-y-4 lg:col-span-3">
              <ResultsPanel checks={checks} />
              <DesignCheckPanel
                validation={validation}
                verdict={verdict}
                onCek={cekDesain}
              />
              <TipsPanel />
              <OutputPanel />
            </section>
          </div>

          {/* DETAILED RESULTS (step 4) */}
          {step === 3 && (
            <div className="mt-6" ref={resultRef}>
              <DetailedResults
                dims={dims}
                spec={spec}
                checks={checks}
                allOk={allOk}
                helicopter={helicopter}
                lokasi={lokasi}
                validation={validation}
                verdict={verdict}
                mahasiswa={mahasiswa}
                canvasRef={canvasRef}
                view3dRef={view3dRef}
              />
              <div className="mt-4 flex gap-2">
                <button className="btn-primary" onClick={exportPDF}>
                  Export PDF
                </button>
                <button className="btn-ghost" onClick={exportPNG}>
                  Export PNG
                </button>
              </div>
            </div>
          )}
        </main>

        <SiteFooter />

        {pdfProfileOpen && (
          <MahasiswaModal
            initial={mahasiswa}
            hint="Data mahasiswa wajib diisi sebelum export PDF. Nama lengkap harus diisi."
            onClose={() => setPdfProfileOpen(false)}
            onSave={(d) => {
              save(d);
              setPdfProfileOpen(false);
              buildPdfReport(d);
            }}
          />
        )}
      </div>
    </MathJaxContext>
  );
}
/* ---------------- sub components ---------------- */

function Stepper({ step, setStep }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center px-6 py-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button onClick={() => setStep(i)} className="flex items-center gap-2 text-sm">
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold ${
                  i <= step ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-semibold tracking-wide ${
                  i === step ? "text-green-600" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="mx-3 h-px flex-1 bg-slate-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InputPanel({ helicopter, onSelectHelicopter, spec, field }) {
  return (
    <div className="card">
      <div className="card-header bg-brand">1. INPUT DATA HELIKOPTER</div>
      <div className="space-y-3 p-4">
        <div>
          <label className="field-label">Pilih Helikopter (contoh)</label>
          <select
            className="field-input"
            value={helicopter}
            onChange={(e) => onSelectHelicopter(e.target.value)}
          >
            {HELICOPTERS.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <NumField label="Rotor Diameter (D)" unit="m" value={spec.D} onChange={(v) => field("D", v)} />
        <NumField label="Overall Length (OL)" unit="m" value={spec.OL} onChange={(v) => field("OL", v)} />
        <NumField label="Undercarriage Width (UCW)" unit="m" value={spec.UCW} onChange={(v) => field("UCW", v)} />
        <NumField label="MTOM" unit="kg" value={spec.MTOM} onChange={(v) => field("MTOM", v)} />
        <div>
          <label className="field-label">Performance Class (VMC)</label>
          <select className="field-input" value={spec.vmc} onChange={(e) => field("vmc", e.target.value)}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, unit, value, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <input
          type="number"
          className="field-input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}

function LocationPanel({ windDir, setWindDir, lokasi, setLokasi }) {
  const label = WIND_DIRECTIONS.find((w) => w.value === Number(windDir))?.label ?? "";
  const setL = (k, v) => setLokasi((l) => ({ ...l, [k]: v }));
  return (
    <div className="card">
      <div className="card-header bg-brand">2. DATA LOKASI (SEDERHANA)</div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <NumField
            label="Panjang Lahan"
            unit="m"
            value={lokasi.panjang}
            onChange={(v) => setL("panjang", v === "" ? "" : Number(v))}
          />
          <NumField
            label="Lebar Lahan"
            unit="m"
            value={lokasi.lebar}
            onChange={(v) => setL("lebar", v === "" ? "" : Number(v))}
          />
        </div>
        <div>
          <label className="field-label">Arah Angin Dominan</label>
          <select className="field-input" value={windDir} onChange={(e) => setWindDir(Number(e.target.value))}>
            {WIND_DIRECTIONS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            checked={!!lokasi.adaObstacle}
            onChange={(e) => setL("adaObstacle", e.target.checked)}
          />
          Terdapat obstacle di sekitar lahan
        </label>
        {lokasi.adaObstacle && (
          <p className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 ring-1 ring-amber-100">
            Tambahkan komponen Gedung atau Pohon pada kanvas, lalu jauhkan dari approach path.
          </p>
        )}
        <div className="flex flex-col items-center py-1">
          <WindRose windDir={windDir} />
          <p className="mt-2 text-sm font-semibold text-slate-600">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MinDimPanel({ dims, highlight, onHitung }) {
  return (
    <div className="card">
      <div className="card-header bg-emerald-600">DIMENSI MINIMUM OTOMATIS</div>
      <div className="p-4 text-sm">
        <Row k="TLOF (min)" formula="≥ 0.83 D" v={`${dims.tlof} m`} />
        <Row k="FATO (min)" formula="≥ 1 D" v={`${dims.fato} m`} />
        <Row k="Safety Area (PC 1)" formula="≥ 3 m / 0.25 D" v={`${dims.safety} m`} />
        <Row k="Total Extent" formula="FATO + 2×Safety" v={`${dims.overall} m`} />
        <button onClick={onHitung} className="btn-primary mt-3 w-full justify-center">
          Hitung Dimensi
        </button>
        {highlight && (
          <p className="mt-2 text-center text-[11px] font-medium text-emerald-600">
            Dimensi minimum dihitung ulang dari data helikopter.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ k, formula, v }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <div>
        <div className="font-medium text-slate-700">{k}</div>
        <div className="text-[11px] text-slate-400">{formula}</div>
      </div>
      <div className="font-bold text-brand">{v}</div>
    </div>
  );
}

function DataRow({ k, v }) {
  return (
    <tr>
      <td className="border p-2 text-slate-600">{k}</td>
      <td className="border p-2 font-semibold text-slate-800">{v}</td>
    </tr>
  );
}

function ResultsPanel({ checks }) {
  return (
    <div className="card">
      <div className="card-header bg-purple-700">4. CEK &amp; HASIL (OTOMATIS)</div>
      <div className="p-3">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400">
              <th className="pb-2">Komponen</th>
              <th className="pb-2">Minimum</th>
              <th className="pb-2">Desain</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => {
              const st = c.minVal == null
                ? (c.design != null ? "ok" : "na")
                : checkStatus(c.design, c.minVal);
              return (
                <tr key={c.name} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 text-slate-500">{c.min}</td>
                  <td className="py-2 text-slate-600">
                    {c.design == null ? "-" : c.unit ? `${c.design} ${c.unit}` : "Ada"}
                  </td>
                  <td className="py-2">
                    {st === "ok" && <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-green-700"><IconCheck /></span>}
                    {st === "warn" && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700"><IconWarn /></span>}
                    {st === "na" && <span className="text-slate-300">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesignCheckPanel({ validation, verdict, onCek }) {
  if (!validation) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <p className="text-sm font-bold text-amber-700">HASIL SEMENTARA</p>
        <p className="mt-2 text-xs text-amber-800/80">
          Belum ada pemeriksaan. Tekan <b>Cek Desain</b> untuk memeriksa kesesuaian layout.
        </p>
        <button onClick={onCek} className="btn-primary mt-3 w-full justify-center">
          Cek Desain
        </button>
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl p-4 ring-1 ${
        verdict?.passed
          ? "bg-green-50 ring-green-200"
          : "bg-amber-50 ring-amber-200"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-sm font-bold ${
          verdict?.passed ? "text-green-700" : "text-amber-700"
        }`}
      >
        {verdict?.passed ? <IconCheck /> : <IconWarn />}
        {verdict?.message}
      </p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {validation.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <span
              className={
                c.status === "ok"
                  ? "text-green-600"
                  : c.status === "fail"
                  ? "text-red-500"
                  : "text-slate-300"
              }
            >
              {c.status === "ok" ? "✓" : c.status === "fail" ? "✕" : "•"}
            </span>
            <span
              className={
                c.status === "fail" ? "text-red-600" : "text-slate-600"
              }
            >
              {c.message}
            </span>
          </li>
        ))}
      </ul>
      <button onClick={onCek} className="btn-ghost mt-3 w-full justify-center">
        Cek Ulang
      </button>
    </div>
  );
}

function TipsPanel() {
  const tips = [
    "Mulai dengan menempatkan TLOF di tengah.",
    "Pastikan FATO mengelilingi TLOF.",
    "Tambahkan Safety Area di luar FATO.",
    "Pastikan approach path bebas dari obstacle.",
    "Jangan lupa menambahkan Wind Cone.",
  ];
  return (
    <div className="rounded-xl bg-sky-50 p-4 ring-1 ring-sky-100">
      <p className="text-sm font-bold text-brand">TIPS UNTUK PEMULA</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-600">
        {tips.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-slate-400">•</span> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OutputPanel() {
  const items = [
    "Gambar Layout Heliport",
    "Tabel Perhitungan Dimensi",
    "Hasil Cek Kesesuaian",
    "Rekomendasi (jika ada)",
    "Export PDF / PNG",
  ];
  return (
    <div className="rounded-xl bg-purple-50 p-4 ring-1 ring-purple-100">
      <p className="text-sm font-bold text-purple-700">OUTPUT YANG AKAN DIDAPATKAN</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-600">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-slate-400">•</span> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailedResults({
  dims,
  spec,
  checks,
  allOk,
  helicopter,
  lokasi,
  validation,
  verdict,
  mahasiswa,
  canvasRef,
  view3dRef,
}) {
  const steps = computeSteps(spec);
  const recs = recommendations(spec, lokasi, validation);
  const heliName =
    HELICOPTERS.find((h) => h.id === helicopter)?.name ||
    (helicopter === "custom" ? "Custom" : helicopter);
  const windLabel =
    WIND_DIRECTIONS.find((w) => w.value === Number(lokasi?.arahAngin ?? 270))?.label ?? "-";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-brand">LAPORAN DESAIN HELIPORT</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${allOk ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {allOk ? "Layout dasar lengkap" : "Layout dasar belum lengkap"}
        </span>
      </div>

      {mahasiswa?.nama && (
        <p className="mt-1 text-xs text-slate-500">
          Oleh: <b>{mahasiswa.nama}</b>
          {mahasiswa.nim ? ` · NIM ${mahasiswa.nim}` : ""}
          {mahasiswa.prodi ? ` · ${mahasiswa.prodi}` : ""}
        </p>
      )}

      {/* Tabel Data Helikopter & Lokasi */}
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700">Tabel Data Helikopter</h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <DataRow k="Jenis Helikopter" v={heliName} />
              <DataRow k="Rotor Diameter (D)" v={`${spec.D} m`} />
              <DataRow k="Overall Length (OL)" v={`${spec.OL} m`} />
              <DataRow k="Undercarriage Width (UCW)" v={`${spec.UCW} m`} />
              <DataRow k="MTOM" v={`${spec.MTOM} kg`} />
              <DataRow k="Performance Class" v={`PC ${spec.vmc}`} />
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700">Tabel Data Lokasi</h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <DataRow k="Panjang Lahan" v={lokasi?.panjang ? `${lokasi.panjang} m` : "-"} />
              <DataRow k="Lebar Lahan" v={lokasi?.lebar ? `${lokasi.lebar} m` : "-"} />
              <DataRow k="Arah Angin Dominan" v={windLabel} />
              <DataRow k="Ada Obstacle" v={lokasi?.adaObstacle ? "Ya" : "Tidak"} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Verdict & warnings */}
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-bold text-slate-700">Hasil Cek Kesesuaian Desain</h3>
        {validation ? (
          <div
            className={`rounded-lg p-4 ring-1 ${
              verdict?.passed ? "bg-green-50 ring-green-200" : "bg-amber-50 ring-amber-200"
            }`}
          >
            <p className={`flex items-center gap-2 font-bold ${verdict?.passed ? "text-green-700" : "text-amber-700"}`}>
              {verdict?.passed ? <IconCheck /> : <IconWarn />} {verdict?.message}
            </p>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-white/60 text-left text-slate-600">
                  <th className="border p-2">Pemeriksaan</th>
                  <th className="border p-2">Keterangan</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {validation.map((c) => (
                  <tr key={c.id}>
                    <td className="border p-2 font-medium">{c.label}</td>
                    <td className="border p-2">{c.message}</td>
                    <td className={`border p-2 font-semibold ${c.status === "fail" ? "text-red-600" : c.status === "ok" ? "text-green-600" : "text-slate-400"}`}>
                      {c.status === "ok" ? "Sesuai" : c.status === "fail" ? "Tidak" : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
            Tekan tombol <b>Cek Desain</b> untuk menjalankan pemeriksaan kesesuaian.
          </p>
        )}
      </div>

      <h3 className="mt-6 text-lg font-extrabold text-brand">PRATINJAU HASIL</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-700">Layout 2D</h4>
          <Preview2D canvasRef={canvasRef} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-700">Layout 3D</h4>
          <View3D ref={view3dRef} dims={dims} />
        </div>
      </div>

      <h3 className="mt-8 text-lg font-extrabold text-brand">HASIL PERHITUNGAN DIMENSI</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">
            Langkah Perhitungan (step-by-step)
          </h3>
          {steps.map((s) => (
            <StepCard key={s.id} step={s} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <h3 className="mb-2 text-sm font-bold text-emerald-700">
              Rekomendasi
            </h3>
            <ul className="space-y-1.5 text-xs text-emerald-900/80">
              {recs.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-500">›</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-bold text-slate-700">Tabel Kesesuaian</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <th className="border p-2">Komponen</th>
              <th className="border p-2">Minimum</th>
              <th className="border p-2">Desain</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => {
              const st = c.minVal == null ? (c.design != null ? "ok" : "na") : checkStatus(c.design, c.minVal);
              return (
                <tr key={c.name}>
                  <td className="border p-2 font-medium">{c.name}</td>
                  <td className="border p-2">{c.min}{c.minVal ? ` (${c.minVal} m)` : ""}</td>
                  <td className="border p-2">{c.design == null ? "-" : c.unit ? `${c.design} ${c.unit}` : "Ada"}</td>
                  <td className="border p-2 font-semibold">
                    {st === "ok" ? "Sesuai" : st === "warn" ? "Perlu dicek" : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepCard({ step }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-700">{step.title}</p>
        <span className="whitespace-nowrap rounded bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
          {step.result} {step.unit}
        </span>
      </div>
      {step.desc && <p className="mb-1 mt-0.5 text-[11px] text-slate-400">{step.desc}</p>}
      <div className="space-y-0.5 text-sm">
        {step.steps.map((tex, i) => (
          <MathJax key={i} className="text-slate-700">{`\\(${tex}\\)`}</MathJax>
        ))}
      </div>
    </div>
  );
}

