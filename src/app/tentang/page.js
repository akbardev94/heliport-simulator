import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Tentang - Heliport Design Simulator" };

const FORMULAS = [
  ["TLOF (min)", "0.83 × D"],
  ["FATO (min)", "1.0 × D"],
  ["Safety Area", "max(3 m, 0.25 × D)"],
  ["Total Extent", "FATO + 2 × Safety Area"],
  ["Luas Rotor", "π (D/2)²"],
];

const STACK = [
  "Next.js 14 (App Router)",
  "Tailwind CSS",
  "Three.js (pratinjau 3D)",
  "Fabric.js (kanvas drag & drop)",
  "MathJax (rumus perhitungan)",
  "html-to-image + jsPDF (export)",
];

export default function TentangPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-brand">Beranda</Link> / Tentang
        </nav>
        <h1 className="text-2xl font-extrabold text-brand">Tentang Simulator</h1>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            <b>Heliport Design Simulator</b> adalah alat bantu pembelajaran untuk
            memahami penentuan dimensi heliport berdasarkan spesifikasi helikopter.
          </p>
          <p>
            Perhitungan merujuk pada <b>ICAO Annex 14 Volume II (Heliports)</b>,{" "}
            <b>ICAO Doc 9261 (Heliport Manual)</b>, dan{" "}
            <b>FAA AC 150/5390-2D</b>.
          </p>
        </div>

        <h2 className="mt-6 text-base font-bold text-slate-800">Rumus Utama</h2>
        <div className="mt-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr><th className="p-2">Komponen</th><th className="p-2">Rumus</th></tr>
            </thead>
            <tbody>
              {FORMULAS.map(([k, v]) => (
                <tr key={k} className="border-t border-slate-100">
                  <td className="p-2 font-medium text-slate-700">{k}</td>
                  <td className="p-2 font-mono text-brand">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-6 text-base font-bold text-slate-800">Teknologi</h2>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
          {STACK.map((t) => (
            <li key={t} className="flex gap-2"><span className="text-brand">›</span>{t}</li>
          ))}
        </ul>

        <div className="mt-8 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
          Disclaimer: hasil simulator bersifat edukatif dan tidak menggantikan
          perhitungan teknis resmi.
        </div>

        <div className="mt-6">
          <Link href="/" className="btn-primary">Kembali ke Simulator</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
