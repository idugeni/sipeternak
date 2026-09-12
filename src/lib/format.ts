export function todayLong(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
export const todayIso = new Date().toISOString().slice(0, 10);
// Tanggal lokal (zona waktu perangkat, bukan UTC) — batas hari tepat
// tengah malam waktu setempat, bukan 07:00 WIB seperti versi UTC.
export function todayLocalIso(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function daysAgoLocalIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return todayLocalIso(date);
}
export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
// Satuan cacah (ekor, butir, unit, laporan) — selalu bulat, tanpa koma.
export function formatCount(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}
// Berat pakan (kg) — boleh 1 desimal, artefak float dibulatkan dulu.
export function formatKg(value: number) {
  const rounded = Math.round(Number(value) * 10) / 10;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(rounded);
}
