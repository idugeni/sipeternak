import { describe, expect, it } from "vitest";
import {
  buildCsvText,
  buildDocNumber,
  buildExcelHtml,
  buildPdfHtml,
  formatStampID,
  slugifyFile,
  type ExportColumn,
  type ExportMeta,
} from "@/lib/export";

type Row = { name: string; qty: number | null };

const columns: ExportColumn<Row>[] = [
  { header: "Nama", value: row => row.name },
  { header: "Jumlah", value: row => row.qty },
];
const rows: Row[] = [
  { name: "Kandang A", qty: 10 },
  { name: 'Kandang "B" <uji>', qty: null },
];
const meta: ExportMeta = {
  docCode: "LH",
  title: "Laporan Harian Kandang",
  period: "2026-08-13 sampai 2026-09-12",
  filters: ["Status: Selesai"],
  generatedBy: "Administrator",
};
const fixed = new Date(2026, 8, 12, 15, 30, 0);

describe("export document builders", () => {
  it("builds deterministic document numbers", () => {
    expect(buildDocNumber("LH", fixed)).toBe("LH/SIPETERNAK/2026/0912-1530");
  });

  it("slugifies filenames safely", () => {
    expect(slugifyFile("Laporan Harian 13/08 – 12/09")).toBe(
      "laporan-harian-13-08-12-09"
    );
  });

  it("formats Indonesian timestamps", () => {
    expect(formatStampID(fixed)).toContain("12 September 2026");
  });

  it("csv contains kop, headers, numbered rows, and footer", () => {
    const csv = buildCsvText(columns, rows, meta, fixed);
    expect(csv).toContain("LAPAS TERBUKA KELAS IIB KENDAL");
    expect(csv).toContain("Nomor Dokumen: LH/SIPETERNAK/2026/0912-1530");
    expect(csv).toContain("Periode: 2026-08-13 sampai 2026-09-12");
    expect(csv).toContain("No;Nama;Jumlah");
    expect(csv).toContain("1;Kandang A;10");
    // CSV escaping untuk koma/kutip
    expect(csv).toContain('2;"Kandang ""B"" <uji>";');
    expect(csv).toContain("Jumlah data: 2 baris");
  });

  it("excel html escapes content and includes signatures", () => {
    const html = buildExcelHtml(columns, rows, meta, fixed);
    expect(html).toContain("LAPAS TERBUKA KELAS IIB KENDAL");
    expect(html).toContain("LH/SIPETERNAK/2026/0912-1530");
    expect(html).toContain("&quot;B&quot; &lt;uji&gt;");
    expect(html).not.toContain("<uji>");
    expect(html).toContain("Mengetahui,");
    expect(html).toContain("( Administrator )");
  });

  it("pdf html has kop, repeating thead, empty-state, and signatures", () => {
    const html = buildPdfHtml(columns, rows, meta, "landscape", fixed);
    expect(html).toContain("@page{size:A4 landscape;");
    expect(html).toContain("table.data thead{display:table-header-group;}");
    expect(html).toContain("Nomor: LH/SIPETERNAK/2026/0912-1530");
    expect(html).toContain("Kepala Lapas Terbuka Kelas IIB Kendal");
    expect(html).toContain("Cetak / Simpan PDF");
    const empty = buildPdfHtml(columns, [], meta, "portrait", fixed);
    expect(empty).toContain("@page{size:A4 portrait;");
    expect(empty).toContain("Tidak ada data");
  });
});
