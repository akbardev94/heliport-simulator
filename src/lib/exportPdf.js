import jsPDF from "jspdf";
import { checkStatus } from "./calc";

const BRAND = [31, 78, 156];
const MARGIN = 14;
const LINE = 5.2;
const PAGE_H = 297;
const PAGE_W = 210;

export function buildHeliportPdf(data) {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const contentW = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  const addPage = () => {
    pdf.addPage();
    y = MARGIN;
  };

  const need = (h = LINE) => {
    if (y + h > PAGE_H - MARGIN) addPage();
  };

  const heading = (text, size = 13) => {
    need(size + 4);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(size);
    pdf.setTextColor(...BRAND);
    pdf.text(text, MARGIN, y);
    y += size * 0.45 + 5;
    pdf.setTextColor(0, 0, 0);
  };

  const subheading = (text) => {
    need(10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(55, 65, 81);
    pdf.text(text, MARGIN, y);
    y += 7;
    pdf.setTextColor(0, 0, 0);
  };

  const para = (text, size = 10) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, contentW);
    need(lines.length * (size * 0.45 + 1.5));
    pdf.text(lines, MARGIN, y);
    y += lines.length * (size * 0.45 + 1.5) + 2;
  };

  const tableRow = (cols, weights, bold = false) => {
    need(LINE + 1);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(9);
    let x = MARGIN;
    cols.forEach((cell, i) => {
      const w = contentW * weights[i];
      const lines = pdf.splitTextToSize(String(cell ?? "-"), w - 2);
      pdf.text(lines, x + 1, y);
      x += w;
    });
    y += LINE + 1;
  };

  const drawTableHeader = (headers, weights) => {
    need(8);
    pdf.setFillColor(241, 245, 249);
    pdf.rect(MARGIN, y - 4.5, contentW, 7, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(MARGIN, y - 4.5, contentW, 7);
    tableRow(headers, weights, true);
    y += 1;
  };

  const kvTable = (rows) => {
    rows.forEach(([k, v]) => {
      need(LINE + 1);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.text(k, MARGIN + 1, y);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(v), MARGIN + 62, y);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(MARGIN, y + 2, MARGIN + contentW, y + 2);
      y += LINE + 2;
    });
    y += 2;
  };

  const addImage = (dataUrl, title, maxH = 85) => {
    if (!dataUrl) return;
    heading(title, 11);
    try {
      const props = pdf.getImageProperties(dataUrl);
      let w = contentW;
      let h = (props.height / props.width) * w;
      if (h > maxH) {
        h = maxH;
        w = (props.width / props.height) * h;
      }
      need(h + 6);
      const x = MARGIN + (contentW - w) / 2;
      pdf.addImage(dataUrl, "PNG", x, y, w, h);
      y += h + 8;
    } catch {
      para("Gambar tidak dapat dimuat.", 9);
    }
  };

  // --- Cover ---
  pdf.setFillColor(...BRAND);
  pdf.rect(0, 0, PAGE_W, 32, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("LAPORAN DESAIN HELIPORT", MARGIN, 14);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Heliport Design Simulator · Versi Pemula", MARGIN, 22);
  pdf.setTextColor(0, 0, 0);
  y = 42;

  heading("Data Mahasiswa");
  kvTable([
    ["Nama Lengkap", data.mahasiswa.nama],
    ["NIM", data.mahasiswa.nim || "-"],
    ["Program Studi", data.mahasiswa.prodi || "-"],
    ["Kelas", data.mahasiswa.kelas || "-"],
    ["Institusi", data.mahasiswa.institusi || "-"],
  ]);
  para(`Tanggal Laporan: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, 9);
  if (data.verdict?.message) {
    need(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...(data.verdict.passed ? [22, 101, 52] : [180, 83, 9]));
    const vLines = pdf.splitTextToSize(`Status: ${data.verdict.message}`, contentW);
    pdf.text(vLines, MARGIN, y);
    y += vLines.length * 5 + 4;
    pdf.setTextColor(0, 0, 0);
  }

  // --- Data helikopter & lokasi ---
  heading("1. Data Helikopter");
  kvTable([
    ["Jenis Helikopter", data.heliName],
    ["Rotor Diameter (D)", `${data.spec.D} m`],
    ["Overall Length (OL)", `${data.spec.OL} m`],
    ["Undercarriage Width (UCW)", `${data.spec.UCW} m`],
    ["MTOM", `${data.spec.MTOM} kg`],
    ["Performance Class", `PC ${data.spec.vmc}`],
  ]);

  heading("2. Data Lokasi");
  kvTable([
    ["Panjang Lahan", data.lokasi?.panjang ? `${data.lokasi.panjang} m` : "-"],
    ["Lebar Lahan", data.lokasi?.lebar ? `${data.lokasi.lebar} m` : "-"],
    ["Arah Angin Dominan", data.windLabel],
    ["Ada Obstacle", data.lokasi?.adaObstacle ? "Ya" : "Tidak"],
  ]);

  // --- Dimensi ---
  heading("3. Hasil Perhitungan Dimensi");
  kvTable([
    ["TLOF (min. 0,83 D)", `${data.dims.tlof} m`],
    ["FATO (min. 1,0 D)", `${data.dims.fato} m`],
    ["Safety Area", `${data.dims.safety} m`],
    ["Total Extent (FATO + 2×Safety)", `${data.dims.overall} m`],
  ]);

  if (data.steps?.length) {
    subheading("Langkah Perhitungan");
    data.steps.forEach((s, idx) => {
      need(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.text(`${idx + 1}. ${s.title} → ${s.result} ${s.unit}`, MARGIN, y);
      y += 5;
      if (s.desc) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8.5);
        pdf.setTextColor(100, 116, 139);
        const dLines = pdf.splitTextToSize(s.desc, contentW);
        pdf.text(dLines, MARGIN + 2, y);
        y += dLines.length * 4 + 1;
        pdf.setTextColor(0, 0, 0);
      }
      s.steps?.forEach((tex) => {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8.5);
        const tLines = pdf.splitTextToSize(tex.replace(/\\\(|\\\)|\\/g, ""), contentW - 4);
        need(tLines.length * 4);
        pdf.text(tLines, MARGIN + 2, y);
        y += tLines.length * 4 + 1;
      });
      y += 2;
    });
  }

  // --- Cek kesesuaian ---
  addPage();
  heading("4. Hasil Cek Kesesuaian Desain");
  if (data.validation?.length) {
    drawTableHeader(["Pemeriksaan", "Keterangan", "Status"], [0.28, 0.52, 0.2]);
    data.validation.forEach((c) => {
      const st = c.status === "ok" ? "Sesuai" : c.status === "fail" ? "Tidak" : "N/A";
      tableRow([c.label, c.message, st], [0.28, 0.52, 0.2]);
    });
    y += 4;
  } else {
    para("Belum dijalankan. Tekan tombol Cek Desain di simulator.");
  }

  subheading("Tabel Kesesuaian Komponen");
  drawTableHeader(["Komponen", "Minimum", "Desain", "Status"], [0.24, 0.3, 0.22, 0.24]);
  data.checks?.forEach((c) => {
    const st =
      c.minVal == null
        ? c.design != null
          ? "Sesuai"
          : "-"
        : checkStatus(c.design, c.minVal) === "ok"
          ? "Sesuai"
          : "Perlu dicek";
    const min = `${c.min}${c.minVal ? ` (${c.minVal} m)` : ""}`;
    const des =
      c.design == null ? "-" : c.unit ? `${c.design} ${c.unit}` : "Ada";
    tableRow([c.name, min, des, st], [0.24, 0.3, 0.22, 0.24]);
  });

  if (data.recs?.length) {
    y += 4;
    subheading("Rekomendasi");
    data.recs.forEach((r) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(`• ${r}`, contentW);
      need(lines.length * 4.5);
      pdf.text(lines, MARGIN, y);
      y += lines.length * 4.5 + 1;
    });
  }

  // --- Pratinjau gambar ---
  addPage();
  heading("5. Pratinjau Layout");
  addImage(data.layoutPng, "Layout 2D (Kanvas Desain)", 95);
  addImage(data.view3dPng, "Layout 3D (Pratinjau)", 95);

  pdf.save("heliport-hasil.pdf");
}
