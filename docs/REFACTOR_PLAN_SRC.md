# Plan: Refactor ke `src/` (Vite root di repo root)

Tujuan: struktur root mirip template Vite (`index.html`, `public/`, `src/`)
dengan codebase tetap hijau (build + check + vitest). **Rencana saja —
JANGAN eksekusi tanpa persetujuan eksplisit.**

## Prasyarat (sudah beres)

- Kode aplikasi bersih dari brand platform; tersisa hanya harness backend
  (`server/platform`, rute OAuth) dan manifes `template.json`.
- `npm run check` nol error, `vite build` hijau, vitest 6/6.

## Fase 1 — Pindahkan frontend `client/*` → root

| Dari                | Ke           | Keterangan                                           |
| ------------------- | ------------ | ---------------------------------------------------- |
| `client/index.html` | `index.html` | Entry Vite                                           |
| `client/public/*`   | `public/*`   | Termasuk hapus sisa folder platform bila muncul lagi |
| `client/src/*`      | `src/*`      | Termasuk `dev/`, `features/`, `vite-env.d.ts`        |
| `client/`           | HAPUS        | Setelah semua pindah dan hijau                       |

## Fase 2 — Sesuaikan konfigurasi (7 file)

1. `vite.config.ts`: `root` → `import.meta.dirname`; `publicDir` → `./public`;
   `outDir` tetap `dist/public`; `resolve.alias.@` → `./src`;
   `envDir` tetap repo root (`.env` tidak pindah).
2. `tsconfig.json`: `include` → `["src/**/*", "shared/**/*", "server/**/*"]`;
   `paths.@/*` → `["./src/*"]`.
3. `server/_core/vite.ts`: `clientTemplate` `../.., "client", "index.html"` →
   `.., "index.html"`; `distPath` dev `../.., "dist", "public"` → `.., "dist", "public"`.
4. `package.json`: tidak berubah (script sama).
5. `.gitignore`: pastikan `dist/` tetap (sudah).
6. `opencode.json` / tooling: tidak berubah (tidak path-dependent).
7. `docs/ARCHITECTURE.md` + bagian "Vite root" di bawah: perbarui.

## Fase 3 — Backend `_core` (opsional, risiko sedang)

- `server/_core/` → `server/platform/` + `shared/_core/errors.ts` → `shared/errors.ts`.
- Syarat: update semua import (`./_core/x` → `./platform/x`, `../../drizzle/schema`
  → tetap), lalu `npm run check` nol error.
- `platform/types/*` sudah final (`platformTypes.ts`, 1 importir: `sdk.ts`).
- JANGAN rename rute `/api/*` (kontrak gateway) dan JANGAN hapus mount OAuth
  sebelum deployment baru teruji.

## Fase 4 — Verifikasi (gerbang, berurutan)

1. `npx vite build` hijau (menangkap path alias/index.html pecah).
2. `npm run check` nol error (menangkap import `_core` tertinggal).
3. `npx vitest run` 6/6.
4. Smoke `npm run dev`: buka `/` (login Supabase), pindah 3 view, submit 1 form.
5. `grep -r "client/" --include="*.ts*"` nol hit (tidak ada path lama tersisa).

## Risiko & mitigasi

- **Deploy harness** mengasumsikan layout `client/`+`dist/public` → jaga `outDir`
  tetap `dist/public`; uji `npm run build && npm start` sebelum merge.
- **OAuth callback** (`/api/oauth/callback`) origin-based → tidak terpengaruh.
- **Rollback**: semua langkah di atas reversibel via move-back + revert 7 file
  config; tidak ada migrasi DB.

## Status: DIEKSEKUSI 2026-09-12 — Fase 1–4 hijau (build + check + vitest +

dev smoke). Dilanjutkan strip backend total: `server/` kini hanya
`index.ts` (static-only) + `vite.ts` + 2 test Supabase; `shared/`,
`drizzle/`, tRPC, OAuth, `db.ts`, `template.json` dihapus; 13 dep mati
dibuang (`@trpc/*`, `drizzle-*`, `mysql2`, `axios`, `cookie`, `jose`,
`superjson`, `zod`, `vite-plugin-manus-runtime`, …).
