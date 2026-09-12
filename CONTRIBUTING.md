# Berkontribusi ke SIPETERNAK

Terima kasih sudah ingin berkontribusi! Panduan singkat agar PR cepat di-merge. 🙏

## Alur Kerja

1. **Fork** repo, lalu klon fork Anda.
2. Buat branch dari `main`: `git checkout -b fitur/nama-fitur` (atau `fix/...`, `docs/...`).
3. Ikuti standar di [`docs/DATABASE_STANDARDS.md`](./docs/DATABASE_STANDARDS.md) untuk perubahan database (migrasi berversi, RLS wajib untuk tabel baru).
4. **Jangan ubah** `src/components/ui/*` (shadcn/ui) — perbaiki di level halaman/komponen pemakai.
5. Jalankan verifikasi lokal sebelum push:
   ```bash
   npm run check && npm run build && npm test && npm run format
   ```
6. Buka PR ke `main` dengan deskripsi: masalah → solusi → cara menguji.

## Konvensi Commit

Gunakan Bahasa Indonesia, imperatif, dan spesifik:

```
Tambah filter status di halaman kandang
Perbaiki ring fokus berlebih pada field login
```

## Checklist PR

- [ ] `npm run check` & `npm run build` hijau
- [ ] Test relevan ditambah/diupdate (`*.test.ts`)
- [ ] Tidak ada secret/kunci di kode (baca [`SECURITY.md`](./SECURITY.md))
- [ ] Migrasi Supabase (bila ada) sudah diuji di branch/staging, bukan produksi
- [ ] Tangkapan layar untuk perubahan UI (bila relevan)

## Melaporkan Bug

Buka [Issue](https://github.com/idugeni/sipeternak/issues) dengan: langkah reproduksi, hasil aktual vs ekspektasi, browser, dan tangkapan layar.
