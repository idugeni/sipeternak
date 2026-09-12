import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronsUpDown,
  CircleUserRound,
  Leaf,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPageMeta, usePageMeta } from "@/lib/page-meta";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CardsSkeleton } from "@/features/shared/skeletons";
import { navSections } from "@/features/shared/navigation";
import type {
  AppRole,
  AuditActivity,
  CageRecord,
  Counts,
  DailyCage,
  DailyRow,
  FeedAlert,
  FeedStock,
} from "@/features/shared/types";
import { DashboardOverview } from "@/features/dashboard/DashboardOverview";

const DailyReportsView = lazy(() =>
  import("@/features/daily-reports/DailyReportsView").then(m => ({
    default: m.DailyReportsView,
  }))
);
const DailyReportPanel = lazy(() =>
  import("@/features/daily-reports/DailyReportPanel").then(m => ({
    default: m.DailyReportPanel,
  }))
);
const CagesGroupsView = lazy(() =>
  import("@/features/cages/CagesGroupsView").then(m => ({
    default: m.CagesGroupsView,
  }))
);
const OperationalCrudView = lazy(() =>
  import("@/features/operations/OperationalCrudView").then(m => ({
    default: m.OperationalCrudView,
  }))
);
const MasterDataView = lazy(() =>
  import("@/features/master-data/MasterDataView").then(m => ({
    default: m.MasterDataView,
  }))
);
const ModuleView = lazy(() =>
  import("@/features/master-data/ModuleView").then(m => ({
    default: m.ModuleView,
  }))
);
const AuditLogView = lazy(() =>
  import("@/features/audit/AuditLogView").then(m => ({
    default: m.AuditLogView,
  }))
);
const ReportHistoryView = lazy(() =>
  import("@/features/reports/ReportHistoryView").then(m => ({
    default: m.ReportHistoryView,
  }))
);
function ViewFallback() {
  return (
    <div className="animate-pulse" aria-label="Memuat modul">
      <div className="mb-5 space-y-2">
        <div className="h-7 w-48 rounded-md bg-[#e4ebe4]" />
        <div className="h-4 w-80 rounded-md bg-[#e4ebe4]" />
      </div>
      <CardsSkeleton count={6} />
    </div>
  );
}

// Tooltip gelap untuk kontrol sidebar.
function SideTooltip({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="max-w-64 border-[#2f6655] bg-[#174838] text-white"
      >
        <p className="text-xs font-semibold">{title}</p>
        {desc ? (
          <p className="mt-0.5 text-[11px] font-normal leading-4 text-[#b5d0c2]">
            {desc}
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
export function Dashboard({
  counts,
  rows,
  cages,
  activities,
  feedAlerts,
  feedStocks,
  dataLoading,
  onRefresh,
  onLogout,
  userName,
  userEmail,
  role,
}: {
  counts: Counts;
  rows: DailyRow[];
  cages: CageRecord[];
  activities: AuditActivity[];
  feedAlerts: FeedAlert[];
  feedStocks: FeedStock[];
  dataLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  userName: string;
  userEmail?: string;
  role: AppRole;
}) {
  const initialModule = new URLSearchParams(window.location.search).get(
    "module"
  );
  const routeMap: Record<string, string> = {
    daily: "Laporan Harian",
    cages: "Kandang & Kelompok",
    livestock: "Livestock & Populasi",
    feed: "Pakan",
    production: "Produksi",
    health: "Kesehatan",
    reports: "Laporan & Riwayat",
    audit: "Audit Log",
    master: "Master Data",
  };
  const reportPreview =
    new URLSearchParams(window.location.search).get("report") === "true";
  const [active, setActive] = useState(
    routeMap[initialModule ?? ""] ?? "Dashboard"
  );
  usePageMeta(active);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sipeternak-sidebar") === "collapsed";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () =>
    setCollapsed(current => {
      const next = !current;
      try {
        localStorage.setItem(
          "sipeternak-sidebar",
          next ? "collapsed" : "expanded"
        );
      } catch {
        // Penyimpanan lokal tidak tersedia.
      }
      return next;
    });
  const [reportDialogOpen, setReportDialogOpen] = useState(reportPreview);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);

  // "Belum lapor" = kandang AKTIF tanpa laporan hari ini (selaras RPC reports_today di Home).
  const unreportedCount = cages.filter(
    cage => cage.status === "Aktif" && !cage.reported
  ).length;
  const notifications = [
    ...(unreportedCount > 0
      ? [
          {
            id: "unreported",
            icon: AlertTriangle,
            iconClass: "bg-[#fff3e8] text-[#c26a2a]",
            title: `${unreportedCount} kandang belum lapor`,
            desc: "Laporan harian hari ini belum lengkap.",
            target: "Laporan Harian",
          },
        ]
      : []),
    ...(counts.deaths > 0
      ? [
          {
            id: "deaths",
            icon: AlertTriangle,
            iconClass: "bg-[#fdeaea] text-[#b3261e]",
            title: `${counts.deaths} kematian 30 hari terakhir`,
            desc: "Periksa modul Kesehatan untuk tindak lanjut.",
            target: "Kesehatan",
          },
        ]
      : []),
    ...(counts.feed <= 0
      ? [
          {
            id: "feed",
            icon: AlertTriangle,
            iconClass: "bg-[#fff7e7] text-[#9a681d]",
            title: "Stok pakan perlu perhatian",
            desc: "Saldo transaksi pakan nol atau minus.",
            target: "Pakan",
          },
        ]
      : []),
  ];
  const unreadCount = notifRead ? 0 : notifications.length;
  const [selectedCage, setSelectedCage] = useState<DailyCage>({
    code: "B2",
    name: "Kandang Ayam Hias A1",
    population: 210,
    type: "chicken",
    reported: false,
    time: "Belum ada laporan hari ini",
  });
  // Petakan label jenis ke kode tipe yang dipakai panel laporan.
  const toDailyCage = (cage: DailyCage): DailyCage => ({
    id: cage.id,
    code: cage.code,
    name: cage.name,
    population: cage.population,
    type: cage.type.toLowerCase().includes("kambing")
      ? "goat"
      : cage.type.toLowerCase().includes("sapi")
        ? "cattle"
        : cage.type.toLowerCase().includes("puyuh")
          ? "quail"
          : "chicken",
    reported: cage.reported,
    time: cage.time,
  });
  useEffect(() => {
    if (!cages.length) return;
    // Reload global membuat array cages baru — segarkan data pilihan yang
    // masih ada, atau default ke kandang pertama bila belum ada pilihan.
    setSelectedCage(current => {
      const fresh = current.id
        ? (cages.find(cage => cage.id === current.id) ?? cages[0])
        : cages[0];
      return toDailyCage(fresh);
    });
  }, [cages]);
  const openReport = (cage?: DailyCage) => {
    if (cage) setSelectedCage(cage);
    setSidebarOpen(false);
    setReportDialogOpen(true);
  };
  const navigate = (label: string) => {
    setSidebarOpen(false);
    setActive(label);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return (
    <div className="min-h-screen bg-[#f6f7f3] text-[#173b32]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#2f6655] bg-[#1d5143] transition-all duration-200 lg:translate-x-0 ${collapsed ? "lg:w-[76px]" : "lg:w-[260px]"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`relative z-10 flex h-[84px] shrink-0 items-center justify-between bg-[#174838] px-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d8edcf] text-[#246f55]">
              <Leaf className="h-5 w-5" />
            </span>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="whitespace-nowrap text-sm font-bold tracking-[0.14em] text-white">
                SIPETERNAK
              </p>
              <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[#b5d0c2]">
                Operational desk
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#d7e8df] hover:bg-[#2b6856] hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div
          className={`scroll-slim flex-1 overflow-y-auto bg-[#1d5143] px-4 py-6 ${collapsed ? "lg:px-2" : ""}`}
        >
          {navSections.map(section => (
            <div key={section.label} className="mb-7">
              <p
                className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a7c8b9] ${collapsed ? "lg:hidden" : ""}`}
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items
                  .filter(item => !item.adminOnly || role === "admin")
                  .map(({ label, icon: Icon, badge: staticBadge }) => {
                    // Badge Laporan Harian = jumlah kandang belum lapor.
                    const badge =
                      label === "Laporan Harian"
                        ? unreportedCount > 0
                          ? String(unreportedCount)
                          : undefined
                        : staticBadge;
                    return (
                      <SideTooltip
                        key={label}
                        title={
                          collapsed && badge
                            ? `${label} · ${badge} belum lapor`
                            : label
                        }
                        desc={
                          collapsed ? undefined : getPageMeta(label).description
                        }
                      >
                        <button
                          onClick={() => navigate(label)}
                          aria-label={label}
                          className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${active === label ? "bg-[#2e8069] font-semibold text-white" : "text-[#d7e8df] hover:bg-[#2b6856] hover:text-white"}`}
                        >
                          <Icon className="h-[17px] w-[17px] shrink-0" />
                          <span
                            className={`flex-1 ${collapsed ? "lg:hidden" : ""}`}
                          >
                            {label}
                          </span>
                          {badge ? (
                            <>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${collapsed ? "lg:hidden" : ""} ${active === label ? "bg-white text-[#27745b]" : "bg-[#2b6856] text-[#d7e8df]"}`}
                              >
                                {badge}
                              </span>
                              <span
                                className={`absolute ml-6 mt-[-18px] hidden h-2 w-2 rounded-full bg-[#d8e975] ${collapsed ? "lg:block" : ""}`}
                              />
                            </>
                          ) : null}
                        </button>
                      </SideTooltip>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        <div
          className={`relative z-10 shrink-0 bg-[#174838] px-3 py-2.5 shadow-[0_-4px_14px_rgba(0,0,0,0.3)] ${collapsed ? "lg:px-2" : ""}`}
        >
          <SideTooltip
            title={userName}
            desc={role === "admin" ? "Administrator" : "Petugas operasional"}
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-xl bg-[#1d5143] px-2.5 py-2 text-left outline-none transition-colors hover:bg-[#2b6856] focus-visible:bg-[#2b6856] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                  aria-label="Menu profil"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#27745b] text-xs font-bold text-white">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                  <span
                    className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}
                  >
                    <span className="block truncate text-sm font-semibold text-white">
                      {userName}
                    </span>
                    <span className="block text-xs text-[#b5d0c2]">
                      {role === "admin"
                        ? "Administrator"
                        : "Petugas operasional"}
                    </span>
                  </span>
                  <ChevronsUpDown
                    className={`h-4 w-4 shrink-0 text-[#b5d0c2] ${collapsed ? "lg:hidden" : ""}`}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-60">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-semibold text-[#173b32]">
                    {userName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-[#5a6d63]">
                    {userEmail ??
                      (role === "admin"
                        ? "Administrator"
                        : "Petugas operasional")}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("Dashboard")}>
                  <CircleUserRound />
                  Profil saya
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("Master Data")}>
                  <Settings />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={event => {
                    event.preventDefault();
                    setLogoutDialogOpen(true);
                  }}
                >
                  <LogOut />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SideTooltip>
        </div>
      </aside>
      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-[#173b32]/25 lg:hidden"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <main
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"}`}
      >
        <header className="sticky top-0 z-20 flex h-[84px] items-center justify-between border-b border-[#dfe7e1] bg-white px-5 shadow-[0_2px_16px_rgba(23,59,50,0.1)] sm:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden shrink-0 text-[#5a6d63] lg:flex"
              onClick={toggleCollapsed}
              aria-label={
                collapsed ? "Bentangkan sidebar" : "Rampingkan sidebar"
              }
              title={collapsed ? "Bentangkan sidebar" : "Rampingkan sidebar"}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs text-[#5a6d63]">
                SIPETERNAK / <span className="text-[#27745b]">{active}</span>
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[#173b32]">
                {active === "Dashboard" ? "Ringkasan operasional" : active}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-[#5a6d63]"
                  aria-label="Notifikasi"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#df815c]" />
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifikasi</span>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setNotifRead(true)}
                      className="rounded px-1 text-xs font-normal text-[#27745b] transition-colors hover:bg-[#eef3ed] hover:text-[#1d5c48]"
                    >
                      Tandai dibaca
                    </button>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="flex items-start gap-3 px-2 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9f1d9] text-[#27745b]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-[#173b32]">
                        Semua operasional terpantau
                      </span>
                      <span className="mt-0.5 block text-xs text-[#5a6d63]">
                        Tidak ada peringatan saat ini.
                      </span>
                    </span>
                  </div>
                ) : (
                  notifications.map(item => (
                    <DropdownMenuItem
                      key={item.id}
                      className="items-start gap-3 py-2.5"
                      onSelect={() => {
                        setNotifRead(true);
                        navigate(item.target);
                      }}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#173b32]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#5a6d63]">
                          {item.desc}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden h-7 w-px bg-[#dfe7e1] sm:block" />
            <Badge
              variant="outline"
              className="hidden gap-1.5 border-[#c9dbca] bg-[#f5faf0] text-[#27745b] sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#6aa774]" />
              Online
            </Badge>
            <Badge
              variant="outline"
              className="hidden border-[#c9dbca] bg-white text-[#27745b] sm:flex"
            >
              {role === "admin" ? "Administrator" : "Petugas"}
            </Badge>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1480px] flex-1 px-5 py-7 sm:px-8 lg:px-10">
          <Suspense fallback={<ViewFallback />}>
            {active === "Dashboard" ? (
              <DashboardOverview
                counts={counts}
                rows={rows}
                cages={cages}
                activities={activities.slice(0, 5)}
                feedAlerts={feedAlerts}
                feedStocks={feedStocks}
                dataLoading={dataLoading}
                onNavigate={navigate}
                onRefresh={onRefresh}
                onOpenReport={cage =>
                  openReport(cage ? toDailyCage(cage) : undefined)
                }
              />
            ) : active === "Laporan Harian" ? (
              <DailyReportsView
                rows={rows}
                cages={cages}
                dataLoading={dataLoading}
                onOpenReport={openReport}
                generatedBy={userName}
              />
            ) : active === "Kandang & Kelompok" ? (
              <CagesGroupsView
                cages={cages}
                role={role}
                dataLoading={dataLoading}
                onSaved={onRefresh}
                generatedBy={userName}
              />
            ) : active === "Livestock & Populasi" ? (
              <OperationalCrudView
                mode="groups"
                role={role}
                cages={cages}
                generatedBy={userName}
                onSaved={onRefresh}
              />
            ) : active === "Pakan" ? (
              <OperationalCrudView
                mode="feed"
                role={role}
                cages={cages}
                generatedBy={userName}
                onSaved={onRefresh}
              />
            ) : active === "Produksi" ? (
              <OperationalCrudView
                mode="production"
                role={role}
                cages={cages}
                generatedBy={userName}
                onSaved={onRefresh}
              />
            ) : active === "Kesehatan" ? (
              <OperationalCrudView
                mode="health"
                role={role}
                cages={cages}
                generatedBy={userName}
                onSaved={onRefresh}
              />
            ) : active === "Master Data" ? (
              <MasterDataView
                role={role}
                generatedBy={userName}
                onSaved={onRefresh}
              />
            ) : active === "Audit Log" ? (
              <AuditLogView
                activities={activities}
                dataLoading={dataLoading}
                generatedBy={userName}
              />
            ) : active === "Laporan & Riwayat" ? (
              <ReportHistoryView
                rows={rows}
                cages={cages}
                role={role}
                dataLoading={dataLoading}
                onRefresh={onRefresh}
                generatedBy={userName}
              />
            ) : (
              <ModuleView
                active={active}
                onOpenReport={() => openReport()}
                counts={counts}
                cages={cages}
                role={role}
                dataLoading={dataLoading}
              />
            )}
          </Suspense>
        </div>
        <footer className="border-t border-[#dfe7e1]/80 px-5 py-4 sm:px-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-1 text-xs text-[#5a6d63] sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-[#315844]">
              © 2026 SIPETERNAK{" "}
              <span className="font-normal text-[#5a6d63]">
                Sistem Monitoring Terpadu Peternakan
              </span>
            </p>
            <p>Lapas Terbuka Kelas IIB Kendal</p>
          </div>
        </footer>
      </main>
      <Suspense fallback={null}>
        <DailyReportPanel
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          cage={selectedCage}
          onSaved={onRefresh}
        />
      </Suspense>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari SIPETERNAK?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi {userName} akan diakhiri. Anda harus masuk kembali untuk
              mengakses ruang kerja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLogoutDialogOpen(false);
                onLogout();
              }}
              className="bg-[#b3261e] text-white hover:bg-[#8f1d17]"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
