import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Panduan - Heliport Design Simulator" };

const STEPS = [
  {
    n: 1,
    title: "Input Data Helikopter & Lokasi",
    points: [
      "Pilih tipe helikopter dari daftar, atau pilih Custom untuk mengisi manual.",
      "Isi Rotor Diameter (D), Overall Length (OL), Undercarriage Width (UCW), MTOM, dan Performance Class (VMC).",
      "Tentukan arah angin dominan; layout sebaiknya searah angin.",
    ],
  },
  {
    n: 2,
    title: "Pilih Komponen",
    points: [
      "Komponen dasar TLOF, FATO, dan Safety Area digambar otomatis sesuai perhitungan.",
      "Komponen tambahan: Approach Path, Wind Cone, dan Obstacle tersedia pada palet.",
    ],
  },
  {
    n: 3,
    title: "Desain Layout (Drag & Drop)",
    points: [
      "Drag komponen dari palet ke kanvas, atau klik untuk menambah cepat.",
      "Geser & ubah ukuran komponen. Ukuran ditampilkan dalam meter (berskala).",
      "Gunakan scale bar 0–50 m sebagai acuan jarak.",
    ],
  },
  {
    n: 4,
    title: "Cek & Hasil",
    points: [
      "Lihat tabel kesesuaian tiap komponen terhadap nilai minimum.",
      "Pelajari langkah perhitungan (step-by-step) yang dirender dengan MathJax.",
      "Tinjau pratinjau 3D dan rekomendasi, lalu export ke PDF atau PNG.",
    ],
  },
];

export default function PanduanPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-brand">Beranda</Link> / Panduan
        </nav>
        <h1 className="text-2xl font-extrabold text-brand">Panduan Penggunaan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ikuti empat langkah berikut untuk membuat dan memeriksa desain heliport.
        </p>

        <div className="mt-6 space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-green-500 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h2 className="text-base font-bold text-slate-800">{s.title}</h2>
              </div>
              <ul className="mt-3 space-y-1.5 pl-11 text-sm text-slate-600">
                {s.points.map((p, i) => (
                  <li key={i} className="list-disc">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-sky-50 p-4 text-sm text-sky-800 ring-1 ring-sky-100">
          <p className="font-semibold">Catatan</p>
          <p className="mt-1">
            Simulator ini alat bantu belajar. Untuk desain nyata, selalu merujuk
            regulasi resmi: ICAO Annex 14 Vol II, ICAO Doc 9261, FAA AC 150/5390-2D.
          </p>
        </div>

        <div className="mt-6">
          <Link href="/" className="btn-primary">Mulai Mendesain</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
