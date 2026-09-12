# Architecture — SIPETERNAK

React (Vite 8) + Supabase Postgres, deploy statis (Vercel). Repo root adalah
Vite root (`index.html`, `public/`, `src/`). Tanpa backend: tidak ada
Express, tRPC, OAuth, drizzle — data & auth 100% Supabase langsung.

## Vite root & sumber data

- **Vite root = repo root** (layout standar docs: `index.html`, `public/`,
  `src/main.tsx`, `src/vite-env.d.ts`). Output: `dist/public`.
- **Supabase adalah satu-satunya sumber data.** Mode demo/`?preview=true` dan
  semua konstanta `DEMO_*` sudah dihapus — app selalu login + fetch live.
  Dilarang menambah data statis pengganti database. Backend Express hanya
  serve file statis (tanpa API) — dihancurkan total: tRPC, OAuth, drizzle,
  storage proxy, dan Manus harness.

## Struktur direktori

```
src/
  pages/          # Route tipis: komposisi + data-loading saja (Home, NotFound)
  features/       # Satu folder per domain. Satu-satunya tempat logika bisnis UI.
    auth/           LoginScreen
    dashboard/      DashboardOverview, MetricCard, dashboardMetrics (+test)
    daily-reports/  DailyReportsView, DailyReportPanel
    cages/          CagesGroupsView, CageDialog, EmptyDashboard
    operations/     OperationalCrudView (mode: groups|feed|production|health)
    master-data/    MasterDataView, ModuleView
    shell/          Dashboard (sidebar + header + routing antar view)
    shared/         types.ts (AppRole, Counts, DailyRow…), demo-data.ts
    → tiap feature punya index.ts barrel (export *), diimpor via @/features/…
  components/ui/  # shadcn: Button, Dialog, Select, Table, Calendar, AlertDialog,
                  # NullableSelect, DateField, ConfirmDialog (milik kita)
  components/     # Hanya komponen lintas-fitur (ErrorBoundary)
  hooks/ lib/     # Hanya yang benar-benar shared (utils, supabase, format)
  contexts/       # ThemeContext
  dev/            # Playground DEV-only (ComponentShowcase + AIChatBox,
                  # route /__dev/showcase, lazy + import.meta.env.DEV)
tests/            # Test integrasi Supabase (REST langsung, tanpa backend)
docs/             # DATABASE_STANDARDS.md (aturan DB), ARCHITECTURE.md (file ini),
                  # REFACTOR_PLAN_SRC.md (riwayat refactor, sudah dieksekusi)
drizzle/          # ⚠️ LEGACY MySQL — DB aktif adalah Supabase Postgres.
                  # Jangan tambah migrasi di sini sampai diputuskan: dihapus
                  # atau dimigrasi ke Postgres.
```

## Konvensi

- Satu feature = satu folder di `features/<nama>/` + `index.ts` barrel.
  Impor selalu lewat barrel (`@/features/cages`), bukan path file dalam.
- `pages/` tidak boleh berisi logika bisnis — hanya komposisi + fetch data
  tingkat route, lalu oper ke feature via props.
- Tipe bersama di `features/shared/types.ts`; navigasi di
  `features/shared/demo-data.ts` (`navSections`); tanggal hari ini di
  `lib/format.ts` (`today`, `todayIso`, `formatNumber`).
- `components/ui/` adalah library komponen — logika bisnis dilarang di sini
  (kecuali wrapper milik kita: `nullable-select`, `date-field`,
  `confirm-dialog`).
- Warna teks harus lolos WCAG AA (≥4.5) — lihat riwayat audit brand kit.
  Abu sekunder standar: `#5a6d63`.

## Menambah fitur baru

1. Buat `src/features/<nama>/` + komponen + `index.ts`.
2. Daftarkan di navigasi (`features/shared/demo-data.ts` → `navSections`)
   dan di shell (`features/shell/Dashboard.tsx`).
3. Colocate test (`*.test.ts`) di folder feature yang sama.

## Verifikasi

- `npx vite build` — wajib hijau (menangkap import pecah).
- `npx vitest run` — semua file hijau.
- `npm run check` — wajib nol error (gerbang kualitas).
