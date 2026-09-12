# Database Standards — SIPETERNAK (Supabase)

Target: **nol WARN / nol ERROR** di Security Advisor dan Performance Advisor,
**nol unindexed foreign key**, RLS lengkap di semua tabel.
Pengecualian tetap: `auth_leaked_password_protection` **diabaikan** — fitur itu
hanya tersedia di tier Pro, jadi WARN-nya tidak perlu digubris.

## 1. RLS (wajib)

- `ENABLE ROW LEVEL SECURITY` di **semua** tabel schema `public` (tanpa kecuali).
- Setiap tabel wajib punya policy lengkap **C-R-U-D** (`FOR SELECT/INSERT/UPDATE/DELETE`),
  `TO authenticated` (jangan `TO public`, jangan `auth.role()` yang deprecated):
  - `SELECT` → `USING`
  - `INSERT` → `WITH CHECK` saja
  - `UPDATE` → wajib `USING` **dan** `WITH CHECK` (tanpa `WITH CHECK`, user bisa
    memindahkan `user_id`/kepemilikan ke user lain; tanpa policy `SELECT`,
    `UPDATE` diam-diam mengembalikan 0 baris)
  - `DELETE` → `USING`
- Semua pemanggilan fungsi di policy wajib dibungkus `SELECT` (initPlan, bukan per-row):
  `using ((select app.is_admin()))`, `using ((select auth.uid()) = id)`.
  Dilarang bentuk tanpa bungkus: `is_admin()`, `auth.uid() = id`.
- Peran:
  - Tabel master (`livestock_types`, `breeds`, `feed_types`, `production_types`,
    `cages`, `livestock_groups`): `SELECT` = `(select app.is_active_user())`,
    `INSERT/UPDATE/DELETE` = `(select app.is_admin())`.
  - Tabel operasional (`feed_transactions`, `production_records`, `health_records`,
    `livestock_events`, `daily_reports`): `SELECT/INSERT/UPDATE` = active user,
    `DELETE` = admin saja.
  - `profiles`: self-or-admin —
    `((select auth.uid()) = id OR (select app.is_admin()))`.
- Pengecualian yang diizinkan (tercatat, bukan pelanggaran):
  - `audit_log`: **hanya** `SELECT` + `INSERT` (append-only, anti-tamper).
    Tanpa `UPDATE`/`DELETE` oleh siapapun kecuali `service_role` via bypass.
  - `app_settings`: `SELECT` + `INSERT` + `UPDATE`, **tanpa** `DELETE`
    (mencegah penghapusan kunci konfigurasi; hapus hanya via `service_role`).

## 2. GRANTs (Data API)

- `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;`
  `anon` tidak mendapat GRANT langsung (akses anon = nol; kalaupun butuh baca
  publik, berikan `GRANT SELECT` eksplisit per tabel + policy `TO anon`).
- `authenticated`: `GRANT SELECT, INSERT, UPDATE, DELETE` per tabel operasional/master.
- Jangan pernah `GRANT ... TO public` — selalu ke role eksplisit.
- RLS tetap sebagai pertahanan berlapis meski GRANT sudah minimal.

## 3. Functions

- Fungsi `SECURITY DEFINER` **dilarang** di schema exposed (`public`).
  Wajib di schema non-exposed: `app` (helper RLS) — contoh: `app.is_admin()`,
  `app.is_active_user()`, `app.handle_new_user()`, `app.touch_updated_at()`.
- Setiap fungsi wajib: `SECURITY DEFINER`, `SET search_path = ''`,
  `STABLE` bila read-only, dan `REVOKE EXECUTE ... FROM anon, public`
  (grant hanya ke `authenticated`/`service_role` sesuai kebutuhan).
- Fungsi di `public` yang boleh ada hanya `SECURITY INVOKER` dan memang
  disengaja sebagai endpoint RPC publik (terdokumentasi).
- Maksimalkan helper terpusat: otorisasi (`is_admin`, `is_active_user`),
  maintenance (`touch_updated_at`), automation (trigger handler). Satu sumber
  kebenaran, jangan duplikasi logika `exists(select 1 from profiles...)` di
  banyak policy.

## 4. Triggers

- Setiap tabel berkolom `updated_at` wajib punya trigger
  `BEFORE UPDATE ... FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at()`.
- `auth.users`: trigger `AFTER INSERT ... EXECUTE FUNCTION app.handle_new_user()`
  (pembuatan profil otomatis; user pertama = `admin`).
- Trigger audit untuk tabel kritis bila dibutuhkan (append ke `audit_log`).
- Dilarang trigger tanpa fungsi di schema `app`; dilarang logika bisnis berat
  di trigger (jaga write latency).

## 5. Enumerated Types

- Semua kolom status/jenis wajib enum, bukan `text` bebas:
  `user_role(admin, petugas)`, `account_status(active, inactive)`,
  `cage_status(active, inactive, maintenance)`, `group_status(active, closed)`,
  `feed_txn_type(in/out/consumption/adjustment)`,
  `health_type(illness/treatment/vaccination/checkup)`,
  `event_type(birth/death/incoming/outgoing/sale/transfer/slaughter/other)`.
- Nilai baru = `ALTER TYPE ... ADD VALUE` (non-destruktif). Jangan ubah/hapus
  nilai yang sudah dipakai baris aktif.

## 6. Extensions

- Hanya install yang dibutuhkan, semua di schema `extensions` bila mendukung:
  - `pgcrypto` (uuid/gen_random), `pg_stat_statements` (diagnostik),
    `moddatetime` (alternatif touch_updated_at), `pg_trgm` (pencarian nama/kode).
- Dilarang mengaktifkan extension "sekadar coba". Setiap extension baru wajib
  dicatat di sini beserta alasannya. `pg_graphql` tetap **nonaktif** bila tak dipakai
  (menutup permukaan `/graphql/v1`).

## 7. Indexes

- Wajib index di: semua FK (`group_id`, `cage_id`, `created_by`, dsb),
  kolom tanggal yang difilter (`txn_date`, `record_date`, `report_date`, `event_date`),
  kolom unik (`code`, `cage_id+report_date`), kolom RLS/join (`created_by`).
- Composite index untuk pola query dominan
  (mis. `(group_id, record_date DESC)`, `(cage_id, report_date DESC)`).
- `unused_index` level **INFO** pada DB sepi bukan alasan drop: index FK adalah
  syarat anti-`unindexed FK` dan akan terpakai seiring trafik. Drop hanya bila
  terbukti duplikat/redundan via `pg_stat_user_indexes` + `EXPLAIN`.
- Buat index dengan `IF NOT EXISTS`; jalankan `ANALYZE` setelah migrasi besar.

## 8. Gerbang kualitas (setiap migrasi)

1. `get_advisors(security)` + `get_advisors(performance)` → **nol WARN/ERROR**,
   **kecuali** `auth_leaked_password_protection` (diabaikan, butir 4) dan
   `INFO unused_index` (ditoleransi dengan justifikasi FK, butir 7).
2. `pg_policies`: semua tabel `public` punya policy; `UPDATE` punya
   `USING + WITH CHECK`; semua fungsi terbungkus `(select ...)`.
3. Uji query peran: `anon` → ditolak (`42501`); `authenticated` non-admin →
   sesuai kebijakan; `admin` → penuh. Tanpa uji ini migrasi belum selesai.
4. `auth_leaked_password_protection`: **diabaikan permanen**. Fitur HaveIBeenPwned
   hanya tersedia di tier Pro dan tidak bisa diaktifkan via SQL maupun dashboard
   tier gratis — WARN ini bukan pelanggaran dan tidak boleh memblokir gerbang.

## 9. Alur kerja

Branch → tulis migrasi → jalankan gerbang butir 8 → merge. Jangan eksekusi
DDL langsung berulang di production tanpa file migrasi yang bersih.
