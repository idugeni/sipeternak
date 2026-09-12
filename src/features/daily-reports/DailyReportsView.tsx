import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  PawPrint,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { daysAgoLocalIso, formatCount, todayLocalIso } from "@/lib/format";
import { CardsSkeleton } from "@/features/shared/skeletons";
import { ExportMenu } from "@/components/ExportMenu";
import {
  runExport,
  slugifyFile,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/export";
import type { CageRecord, DailyCage, DailyRow } from "@/features/shared/types";
export function DailyReportsView({
  rows,
  cages: realCages,
  dataLoading,
  onOpenReport,
  generatedBy,
}: {
  rows: DailyRow[];
  cages: CageRecord[];
  dataLoading: boolean;
  onOpenReport: (cage?: DailyCage) => void;
  generatedBy?: string;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "complete">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [fromDate, setFromDate] = useState(daysAgoLocalIso(30));
  const [toDate, setToDate] = useState(todayLocalIso());
  const rangeRows = rows.filter(
    row => row.report_date >= fromDate && row.report_date <= toDate
  );
  const cages: DailyCage[] = realCages.map(cage => {
    const report = rangeRows.find(row => row.cage_id === cage.id);
    return {
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
      reported: Boolean(report),
      time: report
        ? `Dilaporkan ${new Date(report.created_at ?? report.report_date).toLocaleString("id-ID")}`
        : "Belum ada laporan pada periode ini",
    };
  });
  const displayCages = cages;
  // Tombol "Belum Lapor" menyelaraskan periode ke hari ini agar daftar
  // yang tampil = kandang yang belum lapor hari ini.
  const showTodayPending = () => {
    const today = todayLocalIso();
    setFromDate(today);
    setToDate(today);
    setFilter("pending");
  };
  // Kartu mengikuti filter periode; ringkasan selalu berbasis hari ini.
  const todayStr = todayLocalIso();
  const reportedTodayIds = new Set(
    rows.filter(row => row.report_date === todayStr).map(row => row.cage_id)
  );
  const activeCages = realCages.filter(cage => cage.status === "Aktif");
  const todayPending = activeCages.filter(
    cage => !reportedTodayIds.has(cage.id)
  ).length;
  const todayComplete = activeCages.length - todayPending;
  const todayTotal = Math.max(1, activeCages.length);
  const todayPct = Math.round((todayComplete / todayTotal) * 100);
  const filtered = displayCages
    .filter(
      cage =>
        filter === "all" ||
        (filter === "pending" ? !cage.reported : cage.reported)
    )
    .filter(cage => cage.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) =>
      sort === "population"
        ? b.population - a.population
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : 0
    );
  const iconFor = (type: string) =>
    type === "goat"
      ? PawPrint
      : type === "cattle"
        ? PawPrint
        : type === "quail"
          ? Activity
          : PawPrint;
  const doExport = (format: ExportFormat) => {
    const columns: ExportColumn<DailyCage>[] = [
      { header: "Kode Kandang", value: cage => cage.code },
      { header: "Nama Kandang", value: cage => cage.name },
      { header: "Populasi (ekor)", value: cage => cage.population },
      {
        header: "Status",
        value: cage => (cage.reported ? "Selesai" : "Belum Lapor"),
      },
      { header: "Waktu", value: cage => cage.time },
    ];
    const filters: string[] = [];
    if (filter !== "all")
      filters.push(
        `Status: ${filter === "pending" ? "Belum Lapor" : "Selesai"}`
      );
    if (query) filters.push(`Pencarian: ${query}`);
    runExport(
      format,
      slugifyFile(`laporan-harian-${fromDate}-${toDate}`),
      columns,
      filtered,
      {
        docCode: "LH",
        title: "Laporan Harian Kandang",
        subtitle: "Lapas Terbuka Kelas IIB Kendal",
        period: `${fromDate} sampai ${toDate}`,
        filters,
        generatedBy,
      }
    );
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#161b19]">
            Daily Reports
          </h2>
          <p className="mt-1 text-sm text-[#5a6d63]">
            Daftar cek laporan harian kandang
          </p>
        </div>
      </div>
      <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dcefe7] text-[#18734d]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-base font-bold text-[#1a1e1c]">
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </p>
            <p className="mt-1 text-xs text-[#5a6d63]">
              Lakukan pengisian laporan harian untuk semua kandang aktif
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#27745b ${todayPct * 3.6}deg, #e8eeea 0deg)`,
              }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#27745b]">
                {todayPct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1d221f]">
                {todayComplete} / {activeCages.length} kandang selesai hari ini
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                {todayPct}% telah dilaporkan
              </p>
            </div>
          </div>
          <Button
            className="gap-2 bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={() => onOpenReport()}
          >
            <ClipboardList className="h-4 w-4" />
            Buat Laporan Harian <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      <div className="mt-5 flex min-w-0 flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            className={`rounded-full px-5 ${filter === "all" ? "bg-[#3f785f] text-white hover:bg-[#2e8069]" : "border-[#dfe5e1] bg-white text-[#5a6d63] hover:bg-[#f2f6f3]"}`}
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Semua
          </Button>
          <Button
            className={`rounded-full px-5 ${filter === "pending" ? "bg-[#3f785f] text-white hover:bg-[#2e8069]" : "border-[#dfe5e1] bg-white text-[#5a6d63] hover:bg-[#f2f6f3]"}`}
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Belum Lapor
          </Button>
          <Button
            className={`rounded-full px-5 ${filter === "complete" ? "bg-[#3f785f] text-white hover:bg-[#2e8069]" : "border-[#dfe5e1] bg-white text-[#5a6d63] hover:bg-[#f2f6f3]"}`}
            variant={filter === "complete" ? "default" : "outline"}
            onClick={() => setFilter("complete")}
          >
            Selesai
          </Button>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-[#dfe5e1] bg-white px-3 py-2 transition-colors focus-within:bg-[#f4f8f4]">
            <Search className="h-4 w-4 shrink-0 text-[#5a6d63]" />
            <input
              aria-label="Cari nama kandang"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Cari nama kandang..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#5a6d63] sm:w-52"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-full border-[#dfe5e1] bg-white text-sm text-[#5a6d63] focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0 sm:w-56">
              <SelectValue placeholder="Urutkan: Nama A-Z" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Urutkan: Nama A-Z</SelectItem>
              <SelectItem value="population">
                Urutkan: Populasi terbesar
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-[#66736b]">
          Dari{" "}
          <DateField
            value={fromDate}
            onChange={setFromDate}
            triggerClassName="ml-1 h-9 w-auto text-xs focus-visible:border-border focus-visible:bg-[#f4f8f4] focus-visible:ring-0 hover:bg-transparent"
          />
        </label>
        <label className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-[#66736b]">
          Sampai{" "}
          <DateField
            value={toDate}
            onChange={setToDate}
            triggerClassName="ml-1 h-9 w-auto text-xs focus-visible:border-border focus-visible:bg-[#f4f8f4] focus-visible:ring-0 hover:bg-transparent"
          />
        </label>
        <div className="ml-auto">
          <ExportMenu onExport={doExport} />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dataLoading ? (
          <CardsSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c9ddd0] bg-white p-10 text-center sm:col-span-2 xl:col-span-4">
            <p className="font-semibold text-[#315844]">
              Tidak ada kandang yang cocok
            </p>
            <p className="mt-1 text-sm text-[#5a6d63]">
              {filter !== "all"
                ? "Tidak ada kandang dengan status ini pada periode yang dipilih. Coba ubah filter atau rentang tanggal."
                : "Coba kata kunci, filter, atau rentang tanggal lain."}
            </p>
          </div>
        ) : (
          filtered.map(cage => {
            const Icon = iconFor(cage.type);
            return (
              <Card
                key={cage.code}
                className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.04)] transition-colors hover:bg-[#f7faf7]"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${cage.reported ? "bg-[#e0f1e7] text-[#18734d]" : "bg-[#fae7e3] text-[#a93a2b]"}`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#252b27]">
                            {cage.name}
                          </p>
                          <p className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#111513]">
                            {formatCount(cage.population)} ekor
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenReport(cage)}
                          className="mt-2 rounded-md p-1 text-[#27302b] transition-colors hover:bg-[#eef3ed]"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                      <span
                        className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cage.reported ? "bg-[#e1f3e7] text-[#18734d]" : "bg-[#fae2de] text-[#a93a2b]"}`}
                      >
                        {cage.reported ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {cage.reported ? "Selesai" : "Belum Lapor"}
                      </span>
                      <p className="mt-3 text-xs text-[#5a6d63]">{cage.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-lg border border-[#e2e2df] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(31,48,42,0.04)] md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${todayPending === 0 ? "bg-[#27745b]" : "bg-[#cb4d39]"}`}
          >
            {todayPending === 0 ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-[#1b201d]">
              {todayPending === 0
                ? "Semua kandang sudah dilaporkan hari ini"
                : `${todayPending} kandang belum dilaporkan hari ini`}
            </p>
            <p className="mt-1 text-xs text-[#5a6d63]">
              {todayPending === 0
                ? "Akurasi data peternakan terjaga. Kerja bagus!"
                : "Segera lakukan pengisian laporan untuk menjaga akurasi data peternakan."}
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 border-[#dfe5e1] text-[#5a6d63] sm:flex-none"
            onClick={showTodayPending}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Lihat Daftar Belum Lapor
          </Button>
          <Button
            className="flex-1 bg-[#27745b] text-white hover:bg-[#1d5c48] sm:flex-none"
            onClick={() => onOpenReport()}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Buat Laporan Sekarang <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
