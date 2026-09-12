# Runbook Produksi SIPETERNAK

## 1. Environment (Vercel → Project → Settings → Environment Variables)

| Variable                               | Production                                       | Preview              |
| -------------------------------------- | ------------------------------------------------ | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL project Supabase produksi                    | boleh sama / staging |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` produksi                      | sesuai env           |
| `NEXT_PUBLIC_SITE_URL`                 | domain final (`https://…`), tanpa trailing slash | URL preview          |

Jangan pernah menaruh `service_role` / `sb_secret_*` di env `NEXT_PUBLIC_*`
(ikut terbundel ke browser).

## 2. Auth (Supabase Dashboard → Authentication)

- **Sign In / Up → Allow new signups: OFF.** Semua akun dibuat manual
  (Dashboard → Authentication → Users → Add user) oleh Admin.
- Review berkala: Dashboard → Authentication → Users, hapus akun asing.
- Session: pertahankan JWT expiry bawaan; Audit: semua login tercatat di
  Auth → Logs.

## 3. Manajemen user & role

- Akun baru otomatis `petugas` (trigger `handle_new_user`).
- Kenaikan ke `admin`: jalankan sebagai admin lewat SQL editor
  `update public.profiles set role='admin' where id='<uid>';`
  (trigger `trg_lock_profile_privileges` menolak perubahan oleh non-admin).
- Nonaktifkan user: `update public.profiles set status='inactive' …`
  (diblokir total oleh RLS `is_active_user`).

## 4. Database & backup

- Migrasi repo: `supabase/migrations/*.sql` — urutan sesuai nama file.
  Dua migrasi hardening (`…007`, `…008`) sudah diterapkan ke remote.
- Backup: pastikan Daily Backup / PITR aktif sesuai paket; uji restore
  di project staging minimal sekali sebelum go-live.
- Seed simulasi (`SEED_SIMULASI_*`) dipertahankan sesuai keputusan — jangan
  hapus tanpa backup.

## 5. Monitoring

- Error frontend: pantau Vercel → Deployments → Logs + Speed Insights.
  (Opsional lanjutan: pasang Sentry, isi `VITE_SENTRY_DSN`.)
- Database: Supabase → Logs Explorer; advisor: `get_advisors` (security +
  performance) tiap selesai migrasi.
- Uptime: pasang monitor eksternal (mis. UptimeRobot) ke `https://<domain>/`.

## 6. Rilis

1. `npm run check && npm test && npm run build` hijau lokal.
2. Push pertama (remote belum ada): buat repo kosong di GitHub, lalu
   `git remote add origin https://github.com/<akun>/sipeternak.git`
   dan `git push -u origin main`. Berikutnya cukup `git push`.
3. Push ke `main` → Vercel deploy Production otomatis.
4. Smoke test: login admin + petugas, buka tiap modul, simpan 1 data,
   cek baris baru muncul di Aktivitas Terbaru.
