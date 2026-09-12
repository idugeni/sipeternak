<div align="center">

<img src="./public/favicon.svg" width="96" height="96" alt="Logo SIPETERNAK" />

# SIPETERNAK

[![Typing](https://readme-typing-svg.demolab.com?font=Manrope&weight=600&size=22&duration=3000&pause=800&color=D8E975&center=true&vCenter=true&width=620&lines=Sistem+Monitoring+Terpadu+Peternakan;Lapas+Terbuka+Kelas+IIB+Kendal;Populasi+%E2%80%A2+Pakan+%E2%80%A2+Produksi+%E2%80%A2+Kesehatan+%E2%80%A2+Audit)](https://github.com/idugeni/sipeternak)

Satu ruang kerja untuk memantau populasi, pakan, produksi, kesehatan ternak, dan laporan harian — dengan jejak audit penuh.

<img src="./public/og-image.png" alt="Banner SIPETERNAK — Sistem Monitoring Terpadu Peternakan" />

[![Version](https://img.shields.io/github/package-json/v/idugeni/sipeternak?label=version&logo=npm)](https://github.com/idugeni/sipeternak/blob/main/package.json)
[![License](https://img.shields.io/github/license/idugeni/sipeternak?label=license)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/idugeni/sipeternak?label=last%20commit)](https://github.com/idugeni/sipeternak/commits/main)
[![Stars](https://img.shields.io/github/stars/idugeni/sipeternak?label=stars&logo=github)](https://github.com/idugeni/sipeternak/stargazers)
[![Issues](https://img.shields.io/github/issues/idugeni/sipeternak?label=issues)](https://github.com/idugeni/sipeternak/issues)
[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://sipeternak.vercel.app)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[🚀 Live Demo](https://sipeternak.vercel.app) · [📖 Dokumentasi](./docs/ARCHITECTURE.md) · [🐞 Lapor Issue](https://github.com/idugeni/sipeternak/issues) · [📋 Changelog](./CHANGELOG.md)

</div>

---

## ✨ Fitur Utama

| Modul                     | Kemampuan                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| 📊 **Dashboard**          | Metrik populasi, tren 30 hari, produksi mingguan, peringatan stok pakan |
| 🏠 **Kandang & Kelompok** | CRUD kandang, filter jenis/status, paginasi, ekspor CSV/Excel/PDF       |
| 🌾 **Operasional**        | Transaksi pakan, produksi, dan kesehatan ternak tervalidasi per peran   |
| 📝 **Laporan Harian**     | Monitoring kondisi kandang per hari + riwayat & verifikasi 30 hari      |
| 🗂️ **Master Data**        | Jenis ternak, jenis pakan, tipe produksi terpusat                       |
| 🛡️ **Audit Log**          | Jejak aktivitas setiap pengguna, siap ekspor                            |
| 🔐 **Peran & Akses**      | Admin vs Petugas — aksi sensitif terkunci di UI dan database (RLS)      |

## 🧰 Tech Stack

<div align="center">

[![Stack](https://skillicons.dev/icons?i=react,vite,ts,tailwind,supabase,nodejs,vercel,github&theme=light)](https://github.com/idugeni/sipeternak)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061a24)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=061a24)
![Node](https://img.shields.io/badge/Node-24-339933?logo=node.js&logoColor=white)

</div>

- **Frontend** — React 19 + Vite 8 + TypeScript 7 + Tailwind CSS 4 + shadcn/ui (Radix) + Lucide Icons + wouter
- **Backend** — Supabase (PostgreSQL + Auth + RLS) — lihat [`docs/DATABASE_STANDARDS.md`](./docs/DATABASE_STANDARDS.md)
- **Kualitas** — Vitest (unit + integrasi staging), `tsc --noEmit`, Prettier

<div align="center">

[![Repo Card](https://github-readme-stats.vercel.app/api/pin/?username=idugeni&repo=sipeternak&title_color=27745B&text_color=173B32&icon_color=27745B&bg_color=FFFFFF&border_color=DFE7E1)](https://github.com/idugeni/sipeternak)

</div>

## 🏗️ Arsitektur

```mermaid
flowchart LR
    U([Petugas / Admin]) --> FE[Aplikasi React + Vite]
    FE --> R[wouter routes]
    R --> M[Modul: Dashboard, Kandang, Operasional, Laporan, Master Data]
    M --> SB[(Supabase: Postgres + Auth + RLS + RPC)]
    M --> EX[Ekspor CSV / Excel / PDF]
    FE --> V[Vercel Hosting]
```

> Rincian lengkap ada di [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## 🚀 Mulai Cepat

```bash
# 1. Klon & instal (Node 24)
git clone https://github.com/idugeni/sipeternak.git
cd sipeternak
npm ci

# 2. Konfigurasi environment
cp .env.example .env
# → isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 3. Jalan!
npm run dev      # dev server
npm run build    # build produksi → dist/
npm run preview  # pratinjau hasil build
```

| Script           | Fungsi                                               |
| ---------------- | ---------------------------------------------------- |
| `npm run dev`    | Vite dev server                                      |
| `npm run build`  | Build produksi                                       |
| `npm run check`  | Type-check (`tsc --noEmit`)                          |
| `npm run test`   | Vitest (unit; integrasi bila ada kredensial staging) |
| `npm run format` | Prettier seluruh repo                                |

> Detail environment & deployment ada di [`.env.example`](./.env.example) dan [`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

<details>
<summary><b>🗂️ Struktur Proyek</b></summary>

```
src/
├── features/        # Modul per domain (dashboard, cages, operations, ...)
│   ├── auth/        # LoginScreen
│   ├── shell/       # Dashboard shell: sidebar, header, notifikasi
│   └── shared/      # Tipe, navigasi, skeleton
├── components/ui/   # Komponen shadcn/ui (jangan diubah manual)
├── lib/             # Supabase client, format, export (CSV/Excel/PDF)
├── pages/           # Home, NotFound
└── index.css        # Tema + token desain SIPETERNAK
supabase/migrations/ # Migrasi database berversi
tests/               # Tes integrasi Supabase (staging only)
docs/                # Arsitektur, standar DB, runbook, checklist E2E
```

</details>

## 🗺️ Roadmap

- [x] Dashboard, kandang, operasional, laporan harian, master data
- [x] Audit log + ekspor CSV/Excel/PDF + suite tes
- [ ] Mode offline / PWA untuk pencatatan lapangan
- [ ] Notifikasi real-time via Supabase Realtime
- [ ] Dasbor analitik lanjutan (tren musiman, proyeksi pakan)

## ❓ FAQ

<details>
<summary><b>Apakah aplikasi bisa jalan tanpa Supabase?</b></summary>

Belum. Login dan seluruh data membutuhkan `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — tombol masuk nonaktif sampai keduanya terisi.

</details>

<details>
<summary><b>Bagaimana peran Admin vs Petugas ditegakkan?</b></summary>

Dua lapis: UI menyembunyikan/menonaktifkan aksi sensitif, dan database menegakkannya lewat RLS + trigger pengunci peran. Lihat [`docs/DATABASE_STANDARDS.md`](./docs/DATABASE_STANDARDS.md).

</details>

<details>
<summary><b>Bagaimana cara menjalankan tes integrasi?</b></summary>

Tes integrasi hanya menyentuh **staging/branch**, tidak pernah produksi. Isi kredensial staging di environment, lalu `npm test`. Detailnya di [`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

</details>

## 🤝 Kontribusi

Baca [`CONTRIBUTING.md`](./CONTRIBUTING.md) — mencakup alur branch, konvensi commit, dan checklist PR. Isu keamanan? Lihat [`SECURITY.md`](./SECURITY.md).

## 📄 Lisensi

[MIT](./LICENSE) © 2026 Eliyanto Sarage

<div align="center">

⬆️ [Kembali ke atas](#sipeternak)

</div>
