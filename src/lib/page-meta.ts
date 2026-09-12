import { useEffect } from "react";

// Template terpusat untuk title & deskripsi setiap halaman dinamis.
// Title: "{Halaman} · SIPETERNAK"
// Deskripsi: satu kalimat spesifik modul + konteks ruang kerja.

const SITE_NAME = "SIPETERNAK";
const SITE_CONTEXT =
  "Lapas Terbuka Kelas IIB Kendal dalam data terpadu SIPETERNAK.";

function titleFor(page: string) {
  return `${page} - ${SITE_NAME}`;
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  Dashboard: {
    title: titleFor("Dashboard"),
    description: `Ringkasan operasional peternakan — pantau populasi, pakan, produksi, dan kelengkapan laporan harian ${SITE_CONTEXT}`,
  },
  "Laporan Harian": {
    title: titleFor("Laporan Harian"),
    description: `Kelola dan pantau laporan harian kandang — kondisi, pakan, produksi, dan mortalitas ternak ${SITE_CONTEXT}`,
  },
  "Kandang & Kelompok": {
    title: titleFor("Kandang & Kelompok"),
    description: `Data kandang dan kelompok ternak — populasi, kapasitas, dan status setiap kandang ${SITE_CONTEXT}`,
  },
  "Livestock & Populasi": {
    title: titleFor("Livestock & Populasi"),
    description: `Data populasi ternak per kelompok — komposisi jantan, betina, dan mutasi ${SITE_CONTEXT}`,
  },
  Pakan: {
    title: titleFor("Pakan"),
    description: `Stok dan transaksi pakan — stok masuk, pemakaian, dan penyesuaian ${SITE_CONTEXT}`,
  },
  Produksi: {
    title: titleFor("Produksi"),
    description: `Catatan hasil produksi peternakan — perolehan harian per tipe produksi ${SITE_CONTEXT}`,
  },
  Kesehatan: {
    title: titleFor("Kesehatan"),
    description: `Riwayat kesehatan ternak — pemeriksaan, vaksinasi, sakit, dan perawatan ${SITE_CONTEXT}`,
  },
  "Laporan & Riwayat": {
    title: titleFor("Laporan & Riwayat"),
    description: `Arsip laporan dan riwayat operasional peternakan ${SITE_CONTEXT}`,
  },
  "Audit Log": {
    title: titleFor("Audit Log"),
    description: `Jejak aktivitas pengguna ruang kerja ${SITE_NAME} ${SITE_CONTEXT}`,
  },
  "Master Data": {
    title: titleFor("Master Data"),
    description: `Kelola data master — tipe ternak, kandang, pakan, dan tipe produksi ${SITE_CONTEXT}`,
  },
  Masuk: {
    title: titleFor("Masuk"),
    description: `Masuk ke ruang kerja ${SITE_NAME} dengan akun internal yang dikelola Admin ${SITE_CONTEXT}`,
  },
  "Tidak Ditemukan": {
    title: titleFor("Tidak Ditemukan"),
    description: `Halaman yang dicari tidak tersedia di ruang kerja ${SITE_NAME} ${SITE_CONTEXT}`,
  },
};

export function getPageMeta(page: string) {
  return (
    PAGE_META[page] ?? {
      title: titleFor(page),
      description: `Modul ${page} ruang kerja ${SITE_NAME} ${SITE_CONTEXT}`,
    }
  );
}

function setMeta(selector: string, content: string) {
  const tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (tag) tag.setAttribute("content", content);
}

export function applyPageMeta(page: string) {
  if (typeof document === "undefined") return;
  const { title, description } = getPageMeta(page);
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
}

// Dipanggil di setiap komponen halaman dengan label halamannya.
export function usePageMeta(page: string) {
  useEffect(() => {
    applyPageMeta(page);
  }, [page]);
}
