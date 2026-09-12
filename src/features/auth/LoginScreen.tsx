import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  History,
  Leaf,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePageMeta } from "@/lib/page-meta";
// Perlindungan brute-force sisi klien: jeda progresif setelah 5x gagal
// beruntun. Bertahan antar-reload via localStorage (per browser).
const LOGIN_LOCK_KEY = "sipeternak:login-lock";
const MAX_LOGIN_FAILS = 5;
const BASE_LOCK_MS = 30_000;
const MAX_LOCK_MS = 300_000;
type LoginLock = { fails: number; lockouts: number; lockedUntil: number };
function readLoginLock(): LoginLock {
  try {
    const raw = localStorage.getItem(LOGIN_LOCK_KEY);
    if (!raw) return { fails: 0, lockouts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as Partial<LoginLock>;
    return {
      fails: Number(parsed.fails) || 0,
      lockouts: Number(parsed.lockouts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { fails: 0, lockouts: 0, lockedUntil: 0 };
  }
}
export function LoginScreen({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lock, setLock] = useState<LoginLock>(() => readLoginLock());
  const [now, setNow] = useState(() => Date.now());
  usePageMeta("Masuk");
  // Detik mundur selama masa kunci agar label tombol selalu akurat.
  useEffect(() => {
    if (lock.lockedUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lock.lockedUntil]);
  const lockedSecs = Math.max(0, Math.ceil((lock.lockedUntil - now) / 1000));
  const locked = lockedSecs > 0;
  const persistLock = (next: LoginLock) => {
    setLock(next);
    try {
      localStorage.setItem(LOGIN_LOCK_KEY, JSON.stringify(next));
    } catch {
      // Penyimpanan penuh/diblokir — proteksi sesi ini tetap jalan.
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (locked) {
      toast.error(
        `Terlalu banyak percobaan gagal. Coba lagi dalam ${lockedSecs} detik.`
      );
      return;
    }
    setLoading(true);
    try {
      await onLogin(email, password);
      persistLock({ fails: 0, lockouts: 0, lockedUntil: 0 });
    } catch {
      // onLogin sudah menampilkan toast error yang spesifik — cukup
      // hentikan loading tanpa melempar ulang agar tidak ada
      // unhandled promise rejection di console.
      const fails = lock.fails + 1;
      if (fails >= MAX_LOGIN_FAILS) {
        const lockouts = lock.lockouts + 1;
        const duration = Math.min(
          BASE_LOCK_MS * 2 ** (lockouts - 1),
          MAX_LOCK_MS
        );
        persistLock({
          fails: 0,
          lockouts,
          lockedUntil: Date.now() + duration,
        });
        toast.error(
          `Terlalu banyak percobaan gagal. Jeda ${Math.round(duration / 1000)} detik sebelum mencoba lagi.`
        );
      } else {
        persistLock({ ...lock, fails });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f3] text-[#173b32] lg:grid lg:grid-cols-[1fr_0.9fr]">
      <div className="relative hidden overflow-hidden bg-[#173b32] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center gap-3 text-sm font-semibold tracking-wide">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8e975] text-[#173b32]">
            <Leaf className="h-5 w-5" />
          </span>
          SIPETERNAK
        </div>
        <div className="relative z-10 max-w-xl pb-10">
          <Badge className="mb-6 border-[#d8e975]/25 bg-[#d8e975]/10 text-[#d8e975]">
            Sistem operasional peternakan
          </Badge>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
            Data lapangan yang rapi, keputusan yang lebih pasti.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Satu ruang kerja untuk memantau populasi, pakan, produksi,
            kesehatan, dan laporan harian peternakan Lapas Terbuka Kelas IIB
            Kendal.
          </p>
          <div className="mt-10 flex items-center gap-8 text-sm text-white/60">
            <div>
              <p className="text-2xl font-semibold text-white">24/7</p>
              <p>Jejak operasional</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">1 ruang</p>
              <p>Sumber data terpadu</p>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          Lapas Terbuka Kelas IIB Kendal · 2026
        </p>
      </div>
      {/* Hero mobile: brand terpusat mengisi viewport, bukan ruang kosong. */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[#173b32] via-[#1d5143] to-[#27745b] px-6 pb-10 pt-6 text-center text-white lg:hidden">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full bg-[#d8e975]/15 blur-2xl" />
        <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8e975] text-[#173b32] shadow-[0_10px_30px_rgba(216,233,117,0.35)]">
            <Leaf className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold tracking-[0.22em]">SIPETERNAK</p>
          <Badge className="mt-2 border-[#d8e975]/25 bg-[#d8e975]/10 text-[#d8e975]">
            Sistem operasional peternakan
          </Badge>
          <p className="mt-3 text-lg font-semibold leading-snug tracking-[-0.02em]">
            Data lapangan yang rapi, keputusan yang lebih pasti.
          </p>
          <div className="mt-3 flex w-full items-center justify-center gap-8 text-xs text-white/70">
            <div>
              <p className="text-base font-semibold text-white">24/7</p>
              <p>Jejak operasional</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-base font-semibold text-white">1 ruang</p>
              <p>Sumber data terpadu</p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto -mt-8 flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 pb-5 lg:mx-0 lg:mt-0 lg:min-h-screen lg:max-w-none lg:px-6 lg:py-10">
        <div className="w-full lg:max-w-sm">
          <Card className="w-full border-[#dce4de] bg-white shadow-[0_24px_70px_rgba(27,60,48,0.12)]">
            <CardHeader className="items-center space-y-2.5 pb-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f1d9] text-[#27745b]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-[26px] leading-tight tracking-[-0.03em] text-[#173b32]">
                  Masuk ke ruang kerja
                </CardTitle>
                <CardDescription className="mt-1 text-[#5a6d63]">
                  Gunakan akun internal yang dikelola Admin.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {[
                  { icon: ShieldCheck, label: "Data terpusat" },
                  { icon: History, label: "Jejak audit" },
                  { icon: Leaf, label: "Monitoring harian" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#dce4de] bg-[#f5faf0] px-2.5 py-1 text-[11px] font-medium text-[#27745b]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </CardHeader>
            <form onSubmit={submit}>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6d63]" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@lapas.go.id"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      className="h-11 pl-10 focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Kata sandi</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6d63]" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      className="h-11 pl-10 pr-11 focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(current => !current)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#5a6d63] transition-colors hover:bg-[#f1f4f1] hover:text-[#173b32]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {!isSupabaseConfigured && (
                  <p className="rounded-xl bg-[#fff7e7] px-3 py-2 text-xs text-[#9a681d]">
                    Layanan data belum terhubung. Hubungi administrator.
                  </p>
                )}
                {lock.fails > 0 && !locked ? (
                  <p className="rounded-xl bg-[#fff7e7] px-3 py-2 text-xs text-[#9a681d]">
                    {MAX_LOGIN_FAILS - lock.fails} percobaan tersisa sebelum
                    jeda sementara.
                  </p>
                ) : null}
                <div className="pt-1">
                  <Button
                    className="h-11 w-full bg-gradient-to-b from-[#2e8069] to-[#1d5c48] text-base font-semibold text-white shadow-[0_10px_25px_rgba(39,116,91,0.35)] hover:from-[#27745b] hover:to-[#174838]"
                    type="submit"
                    disabled={loading || locked || !isSupabaseConfigured}
                  >
                    {locked ? (
                      <LockKeyhole className="mr-2 h-4 w-4" />
                    ) : loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    {locked
                      ? `Coba lagi dalam ${lockedSecs} dtk`
                      : loading
                        ? "Memeriksa akun…"
                        : "Masuk"}
                  </Button>
                  <div className="mt-3 rounded-xl bg-[#f6f8f6] px-3 py-2 text-center text-xs leading-5 text-[#5a6d63]">
                    Belum punya akun atau lupa kata sandi?{" "}
                    <span className="font-semibold text-[#27745b]">
                      Hubungi administrator
                    </span>{" "}
                    — akses hanya untuk pengguna terdaftar.
                  </div>
                </div>
              </CardContent>
            </form>
          </Card>
          <p className="mt-4 text-center text-xs text-[#5a6d63] lg:hidden">
            Lapas Terbuka Kelas IIB Kendal · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
