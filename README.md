# Heliport Design Simulator

Simulator desain heliport berbasis web untuk pembelajaran. Menghitung dimensi
minimum TLOF, FATO, Safety Area, dan permukaan approach berdasarkan data
helikopter, lalu memungkinkan penyusunan layout secara drag & drop.

Referensi regulasi: **ICAO Annex 14 Vol II**, **ICAO Doc 9261 (Heliport Manual)**,
**FAA AC 150/5390-2D**.

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Three.js** — pratinjau 3D layout
- **Fabric.js** — kanvas drag & drop layout 2D
- **better-react-mathjax (MathJax)** — render rumus perhitungan
- **html-to-image** + **jsPDF** — export PNG / PDF

## Rumus Utama

| Komponen   | Rumus                         |
| ---------- | ----------------------------- |
| TLOF (min) | `0.83 × D`                    |
| FATO (min) | `1.0 × D`                     |
| Safety Area| `max(3 m, 0.25 × D)`          |
| Total      | `FATO + 2 × Safety Area`      |

`D` = rotor diameter helikopter.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Alur Aplikasi

1. **Input Data** — pilih/isi spesifikasi helikopter & arah angin.
2. **Pilih Komponen** — palet komponen (TLOF, FATO, Safety, Approach, Wind Cone, Obstacle).
3. **Desain Layout** — susun komponen pada kanvas Fabric.js.
4. **Cek & Hasil** — tabel kesesuaian, rumus (MathJax), pratinjau 3D, export PDF/PNG.
