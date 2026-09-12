import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Egg,
  HeartPulse,
  PawPrint,
  Plus,
  RefreshCw,
  Warehouse,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/features/dashboard/MetricCard";
import { EmptyDashboard } from "@/features/cages/EmptyDashboard";
import {
  buildPopulationSeries,
  buildWeeklyProduction,
  formatShortDate,
} from "@/features/dashboard/dashboardMetrics";
import {
  PopulationTrendChart,
  WeeklyProductionChart,
} from "@/features/dashboard/charts";
import { formatCount, formatKg } from "@/lib/format";
import { OverviewSkeleton } from "@/features/shared/skeletons";
import type {
  AuditActivity,
  CageRecord,
  Counts,
  DailyCage,
  DailyRow,
  FeedAlert,
  FeedStock,
} from "@/features/shared/types";
export function DashboardOverview({
  counts,
  rows,
  cages,
  activities,
  feedAlerts,
  feedStocks,
  dataLoading,
  onNavigate,
  onRefresh,
  onOpenReport,
}: {
  counts: Counts;
  rows: DailyRow[];
  cages: CageRecord[];
  activities: AuditActivity[];
  feedAlerts: FeedAlert[];
  feedStocks: FeedStock[];
  dataLoading: boolean;
  onNavigate: (label: string) => void;
  onRefresh: () => void;
  onOpenReport: (cage?: DailyCage) => void;
}) {
  const unreportedCount = Math.max(0, counts.cages - counts.reports);
  const feedEmpty = counts.feed <= 0;
  const actionLabel: Record<string, string> = {
    insert: "Menambah",
    update: "Mengubah",
    delete: "Menghapus",
  };
  if (dataLoading) return <OverviewSkeleton />;
  if (counts.cages === 0)
    return <EmptyDashboard onNavigate={onNavigate} onRefresh={onRefresh} />;
  const populationSeries = buildPopulationSeries(rows);
  const weekBars = buildWeeklyProduction(rows);
  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#161b19]">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-[#5a6d63]">
            Ringkasan kondisi peternakan Lapas Terbuka Kelas IIB Kendal
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-[#5a6d63] md:block">
            {new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#dfe4e0] text-xs text-[#59615c]"
            onClick={() => onOpenReport()}
          >
            <Plus className="h-3.5 w-3.5" />
            Buat laporan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#dfe4e0] text-xs text-[#59615c]"
            onClick={() => onRefresh()}
            aria-label="Segarkan data"
            title="Segarkan data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Segarkan
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Populasi"
          value={`${formatCount(counts.population)} ekor`}
          meta={`${formatCount(counts.cages)} kandang aktif`}
          icon={PawPrint}
          accent="bg-[#dcefe7] text-[#18734d]"
        />
        <MetricCard
          label="Kandang Aktif"
          value={formatCount(counts.cages)}
          meta={`${formatCount(counts.reports)} sudah lapor hari ini`}
          icon={Warehouse}
          accent="bg-[#dcefe7] text-[#18734d]"
        />
        <MetricCard
          label="Kematian (30 hari)"
          value={`${formatCount(counts.deaths)} ekor`}
          meta="30 hari terakhir"
          icon={HeartPulse}
          accent="bg-[#f6ddd7] text-[#a93a2b]"
        />
        <MetricCard
          label="Produksi Telur (7 hari)"
          value={`${formatCount(counts.production)} butir`}
          meta="7 hari terakhir"
          icon={Egg}
          accent="bg-[#f7e7b8] text-[#7a5c10]"
        />
        <MetricCard
          label="Stok Pakan"
          value={`${formatKg(counts.feed)} kg`}
          meta="saldo berjalan"
          icon={Wheat}
          accent="bg-[#e3e3e3] text-[#606260]"
        />
        <MetricCard
          label="Kelengkapan Laporan"
          value={`${counts.completion}%`}
          meta={`${formatCount(counts.reports)}/${formatCount(counts.cages)} kandang`}
          icon={ClipboardList}
          accent="bg-[#dcefe7] text-[#18734d]"
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Buat laporan",
            desc: "Laporan harian kandang",
            icon: ClipboardList,
            tint: "bg-[#dcefe7] text-[#18734d]",
            run: () => onOpenReport(),
          },
          {
            label: "Catat pakan",
            desc: "Masuk & pemakaian",
            icon: Wheat,
            tint: "bg-[#f7e7b8] text-[#7a5c10]",
            run: () => onNavigate("Pakan"),
          },
          {
            label: "Catat produksi",
            desc: "Hasil harian",
            icon: Egg,
            tint: "bg-[#e8f1f6] text-[#35687f]",
            run: () => onNavigate("Produksi"),
          },
          {
            label: "Data kandang",
            desc: "Kelompok & populasi",
            icon: Warehouse,
            tint: "bg-[#e9e9f2] text-[#4b4f8a]",
            run: () => onNavigate("Kandang & Kelompok"),
          },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.run}
            className="group flex items-center gap-3 rounded-xl border border-[#e2e2df] bg-white p-4 text-left shadow-[0_2px_8px_rgba(31,48,42,0.05)] transition-colors hover:bg-[#f2f6f3]"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.tint}`}
            >
              <action.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#161b19]">
                {action.label}
              </span>
              <span className="block truncate text-xs text-[#5a6d63]">
                {action.desc}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#9db0a4] transition-colors group-hover:text-[#27745b]" />
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {feedAlerts.length > 0 ? (
          <div className="flex items-center gap-4 rounded-lg border border-[#eadfc7] bg-[#fffaf0] px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8a6410] text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1b1e1c]">
                {feedAlerts.length} jenis pakan di bawah ambang batas
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                {feedAlerts
                  .map(
                    alert =>
                      `${alert.name} (${formatKg(alert.stock)} kg ≤ ${formatKg(alert.threshold)} kg)`
                  )
                  .join(" · ")}
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden shrink-0 text-sm font-semibold text-[#8a5a12] sm:flex"
              onClick={() => onNavigate("Pakan")}
            >
              Isi ulang <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : feedEmpty ? (
          <div className="flex items-center gap-4 rounded-lg border border-[#eadfc7] bg-[#fffaf0] px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8a6410] text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1b1e1c]">
                Stok pakan habis ({formatKg(counts.feed)} kg tersisa)
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                Segera lakukan pengisian ulang untuk menjaga ketersediaan pakan.
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden shrink-0 text-sm font-semibold text-[#8a5a12] sm:flex"
              onClick={() => onNavigate("Pakan")}
            >
              Isi ulang <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {unreportedCount > 0 ? (
          <div className="flex items-center gap-4 rounded-lg border border-[#eadfc7] bg-[#fffaf0] px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8a6410] text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1b1e1c]">
                {formatCount(unreportedCount)} kandang belum lapor hari ini
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                Segera lengkapi laporan harian dari kandang yang belum melapor.
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden shrink-0 text-sm font-semibold text-[#8a5a12] sm:flex"
              onClick={() => onNavigate("Laporan Harian")}
            >
              Lihat detail <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {!feedEmpty && feedAlerts.length === 0 && unreportedCount === 0 ? (
          <div className="flex items-center gap-4 rounded-lg border border-[#c9dbca] bg-[#f5faf0] px-5 py-4 lg:col-span-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#27745b] text-white">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1b1e1c]">
                Semua operasional terpantau
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                Stok pakan tersedia dan seluruh kandang aktif sudah melapor hari
                ini.
              </p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-lg font-bold text-[#191e1c]">
              Tren Populasi 30 Hari
            </CardTitle>
            <span className="flex items-center gap-2 text-xs text-[#5a6d63]">
              <CalendarDays className="h-4 w-4" />
              {populationSeries.length
                ? `${formatShortDate(populationSeries[0][0])} — ${formatShortDate(populationSeries[populationSeries.length - 1][0])}`
                : "Belum ada histori"}
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-3">
              <PopulationTrendChart series={populationSeries} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-lg font-bold text-[#191e1c]">
              Produksi Telur Mingguan
            </CardTitle>
            <span className="rounded-full border border-[#dfe4e0] px-3 py-1 text-xs text-[#59615c]">
              4 minggu terakhir
            </span>
          </CardHeader>
          <CardContent>
            <WeeklyProductionChart bars={weekBars} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-lg font-bold text-[#191e1c]">
              Perlu perhatian hari ini
            </CardTitle>
            <Button
              variant="ghost"
              className="text-sm font-semibold text-[#247456]"
              onClick={() => onNavigate("Laporan Harian")}
            >
              Semua kandang <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {cages.filter(cage => cage.status === "Aktif" && !cage.reported)
              .length === 0 ? (
              <p className="rounded-xl bg-[#f5faf0] px-4 py-5 text-center text-sm text-[#27745b]">
                Semua kandang sudah melapor hari ini.
              </p>
            ) : (
              cages
                .filter(cage => cage.status === "Aktif" && !cage.reported)
                .slice(0, 5)
                .map(cage => (
                  <div
                    key={cage.id}
                    className="flex items-center gap-3 rounded-xl border border-[#edf1ed] p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fae7e3] text-xs font-bold text-[#a93a2b]">
                      {cage.code.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#252b27]">
                        {cage.name}
                      </span>
                      <span className="block text-xs text-[#5a6d63]">
                        {formatCount(cage.population)} ekor · belum lapor
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-[#dfe5e1] text-xs text-[#27745b]"
                      onClick={() => onOpenReport(cage)}
                    >
                      Isi laporan
                    </Button>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
        <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-lg font-bold text-[#191e1c]">
              Stok pakan per jenis
            </CardTitle>
            <Button
              variant="ghost"
              className="text-sm font-semibold text-[#247456]"
              onClick={() => onNavigate("Pakan")}
            >
              Kelola pakan <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedStocks.length === 0 ? (
              <p className="rounded-xl bg-[#f8fbf8] px-4 py-5 text-center text-sm text-[#5a6d63]">
                Belum ada data jenis pakan.
              </p>
            ) : (
              feedStocks.slice(0, 6).map(stock => {
                const hasThreshold =
                  stock.threshold != null && stock.threshold > 0;
                const pct = hasThreshold
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        (stock.stock / (stock.threshold as number)) * 100
                      )
                    )
                  : stock.stock > 0
                    ? 100
                    : 0;
                const low =
                  hasThreshold && stock.stock <= (stock.threshold as number);
                return (
                  <div key={stock.feedTypeId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#252b27]">
                        {stock.name}
                      </p>
                      <p className="shrink-0 text-xs text-[#5a6d63]">
                        {formatKg(stock.stock)} kg
                        {hasThreshold
                          ? ` / ambang ${formatKg(stock.threshold as number)} kg`
                          : ""}
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#edf1ed]">
                      <div
                        className={`h-full rounded-full ${low ? "bg-gradient-to-r from-[#a97913] to-[#e0a83c]" : "bg-gradient-to-r from-[#1d5c48] to-[#4cb283]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4 border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold text-[#191e1c]">
            Aktivitas Terbaru
          </CardTitle>
          <Button
            variant="ghost"
            className="text-sm font-semibold text-[#247456]"
            onClick={() => onNavigate("Audit Log")}
          >
            Lihat semua aktivitas <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[760px] text-left text-sm">
              <TableHeader>
                <TableRow className="border-y border-[#edf0ed] bg-[#fbfcfb] text-xs font-semibold text-[#5a6d63] hover:bg-[#fbfcfb]">
                  <TableHead className="px-3 py-3 text-[#5a6d63]">
                    Waktu
                  </TableHead>
                  <TableHead className="px-3 py-3 text-[#5a6d63]">
                    Pengguna
                  </TableHead>
                  <TableHead className="px-3 py-3 text-[#5a6d63]">
                    Aktivitas
                  </TableHead>
                  <TableHead className="px-3 py-3 text-[#5a6d63]">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow className="border-b border-[#edf0ed] last:border-0">
                    <TableCell
                      colSpan={4}
                      className="px-3 py-6 text-center text-xs text-[#5a6d63]"
                    >
                      Belum ada aktivitas tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map(item => (
                    <TableRow
                      key={item.id}
                      className="border-b border-[#edf0ed] last:border-0"
                    >
                      <TableCell className="px-3 py-3 text-xs text-[#5a6d63]">
                        {new Date(item.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        <span className="font-medium text-[#39433e]">
                          {item.actor_name ?? "Pengguna"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-[#444d48]">
                        {actionLabel[item.action] ?? item.action} {item.entity}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-[#5a6d63]">
                        {item.summary ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
