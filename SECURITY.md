# Kebijakan Keamanan

## Versi yang Didukung

| Versi   | Didukung |
| ------- | -------- |
| `main`  | ✅       |
| < `1.0` | ❌       |

## Melaporkan Kerentanan

**Jangan** buka issue publik untuk kerentanan keamanan. Hubungi maintainer langsung:

- 📧 **officialelsa21@gmail.com** — subjek: `[SECURITY] ringkasan singkat`

Sertakan: deskripsi, langkah reproduksi, dampak, dan bila ada saran perbaikan. Kami akan merespons maksimal **72 jam** dan mengoordinasikan publikasi perbaikan sebelum pengungkapan publik.

## Aturan Secret

- Kunci `service_role` / `sb_secret_*` **tidak boleh** ada di kode, env `NEXT_PUBLIC_*`, log, atau tangkapan layar.
- Kredensial hanya lewat environment / GitHub Secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dsb. — lihat [`.env.example`](./.env.example)).
- Tes CRUD integrasi hanya berjalan melawan **staging/branch**, tidak pernah produksi.
