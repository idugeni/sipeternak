import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { daysAgoLocalIso, todayLocalIso } from "@/lib/format";
import type {
  AppRole,
  AuditActivity,
  CageRecord,
  Counts,
  DailyRow,
  FeedAlert,
  FeedStock,
} from "@/features/shared/types";
const Dashboard = lazy(() =>
  import("@/features/shell/Dashboard").then(m => ({ default: m.Dashboard }))
);
import { LoginScreen } from "@/features/auth/LoginScreen";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>({
    population: 0,
    cages: 0,
    reports: 0,
    production: 0,
    feed: 0,
    deaths: 0,
    completion: 0,
  });
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [feedAlerts, setFeedAlerts] = useState<FeedAlert[]>([]);
  const [feedStocks, setFeedStocks] = useState<FeedStock[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const firstLoad = useRef(true);
  const [cages, setCages] = useState<CageRecord[]>([]);
  const [role, setRole] = useState<AppRole>("petugas");
  const [profileName, setProfileName] = useState<string | null>(null);
  // Abaikan respons fetch kedaluwarsa agar tidak menimpa state terbaru.
  const loadSeq = useRef(0);
  // getSession + INITIAL_SESSION tiba berurutan rapat — samakan identitas
  // agar tidak memuat data dua kali.
  const sameSession = (a: Session | null, b: Session | null) =>
    a?.access_token === b?.access_token && a?.user?.id === b?.user?.id;
  const applySession = (next: Session | null) =>
    setSession(current => (sameSession(current, next) ? current : next));
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        // Refresh token internal tidak mengubah identitas — abaikan.
        if (event === "TOKEN_REFRESHED") return;
        applySession(nextSession);
        setAuthLoading(false);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  const loadData = async () => {
    if (!supabase || !session) return;
    const seq = ++loadSeq.current;
    const isStale = () => seq !== loadSeq.current;
    try {
      const todayStr = todayLocalIso();
      let [agg, groups, cageList, types, reports, dailyRows, profile, audit] =
        await Promise.all([
          (supabase as any).rpc("dashboard_overview", {
            p_today: todayStr,
            p_prod_from: daysAgoLocalIso(7),
            p_death_from: daysAgoLocalIso(30),
          }),
          supabase
            .from("livestock_groups")
            .select("cage_id,male_count,female_count,unsexed_count", {
              count: "exact",
            })
            .limit(1000),
          supabase
            .from("cages")
            .select(
              "id,code,name,livestock_type_id,location,capacity,notes,status,created_at",
              { count: "exact" }
            )
            .limit(1000),
          supabase.from("livestock_types").select("id,name").limit(100),
          supabase
            .from("daily_reports")
            .select(
              "id,cage_id,condition,feed_used,mortality,production_quantity,report_date,created_at",
              { count: "exact" }
            )
            .eq("report_date", todayStr)
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("daily_reports")
            .select(
              "id,cage_id,condition,feed_used,mortality,production_quantity,population_note,report_date,status,created_at"
            )
            .gte("report_date", daysAgoLocalIso(30))
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("profiles")
            .select("full_name,role,status")
            .eq("id", session.user.id)
            .maybeSingle(),
          supabase
            .from("audit_log")
            .select("id,actor_name,action,entity,summary,created_at")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
      if (agg.error) {
        // Jam perangkat bisa lebih maju dari server ("JWT issued at future",
        // PGRST303) tepat setelah login — token masih valid, hanya perlu
        // dicoba sekali lagi setelah query lain selesai (tanpa delay buatan).
        const code = String((agg.error as { code?: unknown }).code ?? "");
        const detail = String(
          (agg.error as { message?: unknown }).message ?? ""
        );
        if (/PGRST303|issued at future/i.test(`${code} ${detail}`)) {
          const retry = await (supabase as any).rpc("dashboard_overview", {
            p_today: todayStr,
            p_prod_from: daysAgoLocalIso(7),
            p_death_from: daysAgoLocalIso(30),
          });
          if (!retry.error) agg = retry;
        }
      }
      if (agg.error) throw agg.error;
      if (isStale()) return;
      const totals = (agg.data ?? {}) as {
        population?: number | string;
        cages_active?: number | string;
        reports_today?: number | string;
        production_7d?: number | string;
        feed_balance?: number | string;
        deaths_30d?: number | string;
        feed_by_type?: {
          id: string;
          name: string;
          stock: number | string;
          threshold: number | string | null;
        }[];
      };
      const typeMap = new Map(
        (types.data ?? []).map(item => [item.id, item.name])
      );
      const groupTotals = new Map<string, { male: number; female: number }>();
      for (const group of groups.data ?? []) {
        const key = String((group as any).cage_id ?? "");
        groupTotals.set(key, {
          male: Number(group.male_count ?? 0),
          female: Number(group.female_count ?? 0),
        });
      }
      const reportMap = new Map(
        (reports.data ?? []).map(item => [item.cage_id, item])
      );
      const mappedCages = (cageList.data ?? []).map(cage => {
        const totals = groupTotals.get(cage.id) ?? { male: 0, female: 0 };
        const report = reportMap.get(cage.id);
        return {
          id: cage.id,
          code: cage.code ?? cage.id.slice(0, 6).toUpperCase(),
          name: cage.name,
          livestockTypeId: cage.livestock_type_id,
          location: cage.location,
          capacity: cage.capacity,
          notes: cage.notes,
          population: totals.male + totals.female,
          type:
            typeMap.get(cage.livestock_type_id ?? "") ??
            "Belum diklasifikasikan",
          male: totals.male,
          female: totals.female,
          status: (cage.status === "active"
            ? "Aktif"
            : cage.status === "inactive"
              ? "Nonaktif"
              : "Pemeliharaan") as CageRecord["status"],
          reported: Boolean(report),
          time: report ? "Dilaporkan hari ini" : "Belum ada laporan hari ini",
          last: report ? "Hari ini" : "Belum lapor",
          date: report
            ? new Date(
                report.created_at ?? report.report_date
              ).toLocaleDateString("id-ID")
            : "",
        };
      });
      setCages(mappedCages);
      setRole(profile.data?.role === "admin" ? "admin" : "petugas");
      setProfileName(profile.data?.full_name || null);
      const activeCages = Number(totals.cages_active ?? 0);
      const reportedToday = Number(totals.reports_today ?? 0);
      setCounts({
        population: Number(totals.population ?? 0),
        cages: activeCages,
        reports: reportedToday,
        production: Number(totals.production_7d ?? 0),
        feed: Math.round(Number(totals.feed_balance ?? 0) * 10) / 10,
        deaths: Number(totals.deaths_30d ?? 0),
        completion: activeCages
          ? Math.min(100, Math.round((reportedToday / activeCages) * 100))
          : 0,
      });
      setRows((dailyRows.data ?? []) as DailyRow[]);
      setActivities((audit.data ?? []) as AuditActivity[]);
      const feedTypeRows = totals.feed_by_type ?? [];
      setFeedStocks(
        feedTypeRows.map(type => ({
          feedTypeId: type.id,
          name: type.name,
          stock: Math.round(Number(type.stock ?? 0) * 10) / 10,
          threshold: type.threshold == null ? null : Number(type.threshold),
        }))
      );
      setFeedAlerts(
        feedTypeRows
          .filter(type => Number(type.threshold ?? 0) > 0)
          .map(type => ({
            feedTypeId: type.id,
            name: type.name,
            stock: Math.round(Number(type.stock ?? 0) * 10) / 10,
            threshold: Number(type.threshold),
          }))
          .filter(alert => alert.stock <= alert.threshold)
      );
    } catch (error) {
      console.error(error);
      // Tanpa refresh token otomatis, token kedaluwarsa = sesi berakhir.
      // Kecualikan skew jam ("issued at future"): token masih segar,
      // pengguna tidak boleh dikeluarkan paksa.
      const raw =
        error instanceof Error ? error.message : JSON.stringify(error ?? "");
      if (
        /jwt|token|expired|401|403/i.test(raw) &&
        !/issued at future|PGRST303/i.test(raw)
      ) {
        await supabase?.auth.signOut();
        toast.error("Sesi berakhir. Silakan masuk kembali.");
        return;
      }
      toast.error("Data belum dapat dimuat. Coba segarkan halaman.");
    } finally {
      // Skeleton hanya untuk muat pertama — refresh tidak mengosongkan layar.
      if (firstLoad.current) {
        firstLoad.current = false;
        setDataLoading(false);
      }
    }
  };
  useEffect(() => {
    void loadData();
  }, [session]);
  // Muat ulang saat tab kembali aktif. Hanya visibilitychange — listener
  // focus menyala bersamaan (toast, dialog, DevTools) dan memicu reload ganda.
  useEffect(() => {
    if (!session) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session]);
  const login = async (email: string, password: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "Email atau kata sandi tidak cocok."
          : error.message
      );
      throw error;
    }
    toast.success("Selamat datang kembali di SIPETERNAK.");
  };
  const logout = async () => {
    await supabase?.auth.signOut();
    toast.success("Anda sudah keluar dari SIPETERNAK.");
  };
  if (authLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f3]">
        <div className="flex items-center gap-3 text-sm text-[#5a6d63]">
          <Loader2 className="h-5 w-5 animate-spin text-[#27745b]" />
          Memuat ruang kerja…
        </div>
      </div>
    );
  if (!session) return <LoginScreen onLogin={login} />;
  const userName =
    session?.user.user_metadata?.full_name ||
    session?.user.email?.split("@")[0] ||
    "Petugas";
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7f3]">
          <div className="flex items-center gap-3 text-sm text-[#5a6d63]">
            <Loader2 className="h-5 w-5 animate-spin text-[#27745b]" />
            Memuat ruang kerja…
          </div>
        </div>
      }
    >
      <Dashboard
        counts={counts}
        rows={rows}
        cages={cages}
        activities={activities}
        feedAlerts={feedAlerts}
        feedStocks={feedStocks}
        dataLoading={dataLoading}
        onRefresh={() => void loadData()}
        onLogout={logout}
        userName={profileName || userName}
        userEmail={session?.user.email ?? undefined}
        role={role}
      />
    </Suspense>
  );
}
