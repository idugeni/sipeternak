# Checklist E2E Pra-Produksi

Jalankan dengan dua akun: **Admin** dan **Petugas**. Centang semua.

## Akses & peran negatif (wajib lolos)

- [ ] Petugas tidak melihat menu Audit Log & Master Data.
- [ ] Petugas tidak bisa membuka dialog tambah/ubah Kelompok (admin only).
- [ ] Petugas tidak bisa simpan/ubah/hapus transaksi Pakan (coba via UI;
      harus gagal/ditolak).
- [ ] Petugas bisa tambah Laporan Harian, Produksi, Kesehatan miliknya;
      tidak bisa ubah data milik user lain.
- [ ] Eskalasi: sebagai petugas, coba `update profiles set role='admin'`
      via SQL editor dengan API key petugas → harus ERROR
      "Hanya admin yang dapat mengubah role/status pengguna."
- [ ] User `inactive` tidak bisa baca/tulis apa pun (RLS `is_active_user`).
- [ ] Tanpa login: API publik (`/rest/v1/cages` dengan anon key) → 0 baris.

## Fungsional per modul

- [ ] Login salah → pesan error jelas; login benar → toast selamat datang.
- [ ] Tiap modul dari sidebar terbuka, title tab browser berubah
      (`{Modul} - SIPETERNAK`).
- [ ] Simpan: kelompok, pakan (desimal `12,5` kg OK), produksi, kesehatan,
      laporan harian, kandang, master → toast sukses + data tampil.
- [ ] Input `8,5` ekor/butir ditolak ("harus bilangan bulat").
- [ ] Setiap aksi di atas memunculkan baris baru di Aktivitas Terbaru.
- [ ] Logout → dialog konfirmasi → sesi berakhir, kembali ke halaman Masuk.
- [ ] Dropdown profil (sidebar) & lonceng (header) membuka/menutup normal,
      scrollbar kanan tidak hilang.

## Non-fungsional

- [ ] HP (layar kecil): sidebar drawer, form 1 kolom, tidak ada scroll
      horizontal.
- [ ] Chrome + Edge/Safari minimal 1 versi lain.
- [ ] `prefers-reduced-motion`: animasi/scroll halus nonaktif.
- [ ] Waktu muat awal < 3 dtk di throttling 4G (DevTools → Network).
- [ ] Console browser bersih dari error saat menjelajah semua modul.
