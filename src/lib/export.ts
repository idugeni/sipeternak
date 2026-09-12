import { toast } from "sonner";

export type ExportFormat = "excel" | "csv" | "pdf";

export interface ExportColumn<T> {
  header: string;
  /** Lebar kolom (karakter, untuk Excel). */
  width?: number;
  align?: "left" | "center" | "right";
  value: (row: T, index: number) => string | number | null | undefined;
}

export interface ExportMeta {
  /** Kode jenis dokumen, mis. "LH" (Laporan Harian), "KD" (Kandang). */
  docCode: string;
  title: string;
  subtitle?: string;
  /** Periode data, mis. "13 Agu 2026 – 12 Sep 2026". */
  period?: string;
  /** Baris info filter aktif, mis. ["Status: Aktif", "Jenis: Sapi"]. */
  filters?: string[];
  generatedBy?: string;
}

/* ------------------------------------------------------------------ */
/* Util dasar                                                          */
/* ------------------------------------------------------------------ */

const ORG_LINE_1 = "LAPAS TERBUKA KELAS IIB KENDAL";
const ORG_LINE_2 = "SIPETERNAK — Sistem Monitoring Terpadu Peternakan";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Nomor dokumen deterministik berbasis waktu: KODE/SIPETERNAK/YYYY/MMDD-HHmm */
export function buildDocNumber(docCode: string, at = new Date()) {
  return `${docCode}/SIPETERNAK/${at.getFullYear()}/${pad2(at.getMonth() + 1)}${pad2(at.getDate())}-${pad2(at.getHours())}${pad2(at.getMinutes())}`;
}

export function formatStampID(at = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

export function slugifyFile(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cellText<T>(col: ExportColumn<T>, row: T, i: number) {
  const v = col.value(row, i);
  return v === null || v === undefined ? "" : String(v);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeCsv(s: string) {
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function metaLines(meta: ExportMeta, docNo: string, stamp: string): string[] {
  const by = meta.generatedBy ?? "Administrator";
  const lines = [ORG_LINE_1, ORG_LINE_2, meta.title, `Nomor Dokumen: ${docNo}`];
  if (meta.subtitle) lines.push(meta.subtitle);
  if (meta.period) lines.push(`Periode: ${meta.period}`);
  if (meta.filters?.length) lines.push(`Filter: ${meta.filters.join(" · ")}`);
  lines.push(`Dicetak: ${stamp} oleh ${by}`);
  return lines;
}

/* ------------------------------------------------------------------ */
/* CSV — delimiter ";" + BOM agar rapi dibuka di Excel Indonesia       */
/* ------------------------------------------------------------------ */

export function exportCsv<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta
) {
  const at = new Date();
  downloadBlob(
    new Blob(["\uFEFF" + buildCsvText(columns, rows, meta, at)], {
      type: "text/csv;charset=utf-8",
    }),
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  toast.success(`Export CSV berhasil (${rows.length} baris).`);
}

/** Builder murni (tanpa DOM) — diuji unit agar isi dokumen terjamin. */
export function buildCsvText<T>(
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta,
  at = new Date()
) {
  const docNo = buildDocNumber(meta.docCode, at);
  const stamp = formatStampID(at);
  const out: string[] = [
    ...metaLines(meta, docNo, stamp),
    "",
    ["No", ...columns.map(c => c.header)].map(escapeCsv).join(";"),
    ...rows.map((row, i) =>
      [String(i + 1), ...columns.map(c => escapeCsv(cellText(c, row, i)))].join(
        ";"
      )
    ),
    "",
    `Jumlah data: ${rows.length} baris`,
    `Dokumen ini dicetak dari SIPETERNAK — ${stamp}`,
  ];
  return out.join("\r\n");
}

/* ------------------------------------------------------------------ */
/* Excel (.xls via HTML) — kop, tabel berbingkai, tanda tangan         */
/* ------------------------------------------------------------------ */

export function exportExcel<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta
) {
  const at = new Date();
  downloadBlob(
    new Blob(["\uFEFF" + buildExcelHtml(columns, rows, meta, at)], {
      type: "application/vnd.ms-excel",
    }),
    filename.endsWith(".xls") ? filename : `${filename}.xls`
  );
  toast.success(`Export Excel berhasil (${rows.length} baris).`);
}

/** Builder murni (tanpa DOM) — diuji unit agar isi dokumen terjamin. */
export function buildExcelHtml<T>(
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta,
  at = new Date()
) {
  const docNo = buildDocNumber(meta.docCode, at);
  const stamp = formatStampID(at);
  const by = meta.generatedBy ?? "Administrator";
  const span = columns.length + 1;
  const kop = metaLines(meta, docNo, stamp)
    .map(
      line =>
        `<tr><td colspan="${span}" style="font-weight:bold;">${escapeHtml(line)}</td></tr>`
    )
    .join("");
  const head = `<tr style="background:#1d5143;color:#ffffff;font-weight:bold;">${[
    "No",
    ...columns.map(c => escapeHtml(c.header)),
  ]
    .map(h => `<td style="border:1px solid #1d5143;padding:6px;">${h}</td>`)
    .join("")}</tr>`;
  const body = rows
    .map(
      (row, i) =>
        `<tr>${[
          String(i + 1),
          ...columns.map(c => escapeHtml(cellText(c, row, i))),
        ]
          .map(
            (v, j) =>
              `<td style="border:1px solid #9db0a4;padding:6px;${j === 0 ? "text-align:center;" : ""}">${v}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">` +
    `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeHtml(meta.title.slice(0, 28))}</x:Name>` +
    `<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>` +
    `<table border="1" cellspacing="0" cellpadding="4">${kop}<tr><td colspan="${span}"></td></tr>${head}${body}` +
    `<tr><td colspan="${span}"></td></tr>` +
    `<tr><td colspan="${span}">Jumlah data: ${rows.length} baris</td></tr>` +
    `<tr><td colspan="${span}">Dokumen ini dicetak dari SIPETERNAK — ${escapeHtml(stamp)}</td></tr>` +
    `<tr><td colspan="${span}"></td></tr>` +
    `<tr><td colspan="${Math.ceil(span / 2)}" style="text-align:center;">Mengetahui,</td><td colspan="${span - Math.ceil(span / 2)}" style="text-align:center;">Kendal, ${escapeHtml(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(at))}</td></tr>` +
    `<tr><td colspan="${Math.ceil(span / 2)}" style="height:56px;"></td><td colspan="${span - Math.ceil(span / 2)}" style="height:56px;"></td></tr>` +
    `<tr><td colspan="${Math.ceil(span / 2)}" style="text-align:center;">( ............................................ )</td><td colspan="${span - Math.ceil(span / 2)}" style="text-align:center;">( ${escapeHtml(by)} )</td></tr>` +
    `</table></body></html>`;
  return html;
}

/* ------------------------------------------------------------------ */
/* PDF — jendela cetak A4: kop, thead berulang, tanda tangan           */
/* ------------------------------------------------------------------ */

export function exportPdf<T>(
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta,
  orientation: "portrait" | "landscape" = "landscape"
): boolean {
  const at = new Date();
  // Catatan: tanpa "noopener" agar opener tetap memegang handle jendela
  // about:blank (same-origin) sehingga document.write + print() bekerja.
  // Jendela ini hanya berisi dokumen yang kita tulis sendiri — aman.
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Popup diblokir browser — izinkan popup untuk export PDF.");
    return false;
  }
  printWindow.document.write(
    buildPdfHtml(columns, rows, meta, orientation, at)
  );
  printWindow.document.close();
  toast.success("Dokumen PDF disiapkan — lanjutkan di dialog cetak.");
  return true;
}

/** Builder murni (tanpa DOM) — diuji unit agar isi dokumen terjamin. */
export function buildPdfHtml<T>(
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta,
  orientation: "portrait" | "landscape" = "landscape",
  at = new Date()
) {
  const docNo = buildDocNumber(meta.docCode, at);
  const stamp = formatStampID(at);
  const by = meta.generatedBy ?? "Administrator";
  const dateOnly = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(at);
  const rowsHtml = rows
    .map(
      (row, i) =>
        `<tr>${[String(i + 1), ...columns.map(c => escapeHtml(cellText(c, row, i)))].map((v, j) => `<td class="${j === 0 ? "c" : ""}">${v}</td>`).join("")}</tr>`
    )
    .join("");
  return (
    `<html><head><title>${escapeHtml(meta.title)} — ${escapeHtml(docNo)}</title><style>` +
    `@page{size:A4 ${orientation};margin:14mm 12mm 16mm 12mm;}` +
    `*{box-sizing:border-box;}body{font-family:Arial,Helvetica,sans-serif;color:#173b32;margin:0;font-size:11px;}` +
    `.kop{text-align:center;border-bottom:3px double #173b32;padding-bottom:10px;margin-bottom:6px;}` +
    `.kop h1{font-size:17px;margin:0;letter-spacing:.06em;}` +
    `.kop h2{font-size:13px;margin:2px 0;font-weight:normal;}` +
    `.doctitle{text-align:center;margin:10px 0 2px;} .doctitle h3{font-size:14px;margin:0;text-transform:uppercase;}` +
    `.meta{display:flex;justify-content:space-between;gap:16px;margin:8px 0;font-size:10.5px;}` +
    `.meta table{border-collapse:collapse;} .meta td{padding:1px 4px;vertical-align:top;}` +
    `table.data{width:100%;border-collapse:collapse;margin-top:8px;font-size:10.5px;}` +
    `table.data thead{display:table-header-group;} table.data tr{page-break-inside:avoid;}` +
    `table.data th,table.data td{border:1px solid #5a6d63;padding:5px 6px;text-align:left;vertical-align:top;}` +
    `table.data th{background:#e5f1e9;} td.c,th.c{text-align:center;}` +
    `.foot{margin-top:6px;font-size:10px;color:#41544b;}` +
    `.sig{display:flex;justify-content:space-between;margin-top:22px;page-break-inside:avoid;}` +
    `.sig div{width:42%;text-align:center;} .sig .sp{height:58px;}` +
    `@media print{.noprint{display:none;}}` +
    `</style></head><body>` +
    `<div class="kop"><h1>${escapeHtml(ORG_LINE_1)}</h1><h2>${escapeHtml(ORG_LINE_2)}</h2></div>` +
    `<div class="doctitle"><h3>${escapeHtml(meta.title)}</h3><div>Nomor: ${escapeHtml(docNo)}</div></div>` +
    `<div class="meta"><table>` +
    (meta.period
      ? `<tr><td>Periode</td><td>:</td><td>${escapeHtml(meta.period)}</td></tr>`
      : "") +
    (meta.filters?.length
      ? `<tr><td>Filter</td><td>:</td><td>${escapeHtml(meta.filters.join(" · "))}</td></tr>`
      : "") +
    `<tr><td>Jumlah data</td><td>:</td><td>${rows.length} baris</td></tr>` +
    `</table><table>` +
    `<tr><td>Dicetak</td><td>:</td><td>${escapeHtml(stamp)}</td></tr>` +
    `<tr><td>Oleh</td><td>:</td><td>${escapeHtml(by)}</td></tr>` +
    `</table></div>` +
    `<table class="data"><thead><tr><th class="c" style="width:34px;">No</th>${columns.map(c => `<th>${escapeHtml(c.header)}</th>`).join("")}</tr></thead>` +
    `<tbody>${rowsHtml || `<tr><td colspan="${columns.length + 1}" style="text-align:center;">Tidak ada data</td></tr>`}</tbody></table>` +
    `<div class="foot">Dokumen ini dicetak dari SIPETERNAK dan sah sebagai arsip operasional.</div>` +
    `<div class="noprint" style="margin:14px 0;text-align:center;"><button onclick="window.print()" style="background:#27745b;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:13px;cursor:pointer;">Cetak / Simpan PDF</button></div>` +
    `<div class="sig"><div>Mengetahui,<br/>Kepala Lapas Terbuka Kelas IIB Kendal<div class="sp"></div>( ............................................ )<br/>NIP. ............................................</div>` +
    `<div>Kendal, ${escapeHtml(dateOnly)}<br/>Petugas<div class="sp"></div>( ${escapeHtml(by)} )</div></div>` +
    `<script>window.addEventListener('load',function(){setTimeout(function(){try{window.print();}catch(e){}},700);});` +
    `window.onafterprint=function(){window.close();};</script>` +
    `</body></html>`
  );
}

/** Dispatcher satu pintu: dipakai semua tombol Export. */
export function runExport<T>(
  format: ExportFormat,
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  meta: ExportMeta
) {
  if (format === "csv") exportCsv(filename, columns, rows, meta);
  else if (format === "excel") exportExcel(filename, columns, rows, meta);
  else
    exportPdf(
      columns,
      rows,
      meta,
      columns.length > 5 ? "landscape" : "portrait"
    );
}
