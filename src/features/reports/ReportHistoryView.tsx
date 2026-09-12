import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { ListSkeleton } from "@/features/shared/skeletons";
import { ExportMenu } from "@/components/ExportMenu";
import {
  runExport,
  slugifyFile,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/export";
import type { AppRole, CageRecord, DailyRow } from "@/features/shared/types";

export function ReportHistoryView({
  rows,
  cages,
  role,
  dataLoading,
  onRefresh,
  generatedBy,
}: {
  rows: DailyRow[];
  cages: CageRecord[];
  role: AppRole;
  dataLoading: boolean;
  onRefresh: () => void;
  generatedBy?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "approved">("all");
  const [verifying, setVerifying] = useState<string | null>(null);
  const cageName = (cageId: string) =>
    cages.find(cage => cage.id === cageId)?.name ?? "Kandang";
  const filtered = rows
    .filter(row => filter === "all" || (row.status ?? "submitted") === filter)
    .filter(row =>
      `${cageName(row.cage_id)} ${row.condition}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  const doExport = (format: ExportFormat) => {
    const columns: ExportColumn<DailyRow>[] = [
      { header: "Tanggal", value: row => row.report_date },
      { header: "Kandang", value: row => cageName(row.cage_id) },
      { header: "Kondisi", value: row => row.condition },
      {
        header: "Produksi (butir)",
        value: row => row.production_quantity ?? 0,
      },
      { header: "Mortalitas (ekor)", value: row => row.mortality },
      {
        header: "Pakan Dipakai (kg)",
        value: row => row.feed_used ?? "—",
      },
      {
        header: "Status",
        value: row =>
          row.status === "approved" ? "Terverifikasi" : "Menunggu",
      },
    ];
    const filters: string[] = [];
    if (filter !== "all")
      filters.push(
        `Status: ${filter === "approved" ? "Terverifikasi" : "Menunggu"}`
      );
    if (query) filters.push(`Pencarian: ${query}`);
    runExport(
      format,
      slugifyFile(`arsip-laporan-harian-${Date.now()}`),
      columns,
      filtered,
      {
        docCode: "AR",
        title: "Arsip Laporan Harian",
        subtitle: "Lapas Terbuka Kelas IIB Kendal — 30 hari terakhir",
        filters,
        generatedBy,
      }
    );
  };
  const verify = async (row: DailyRow) => {
    if (role !== "admin") {
      toast.error("Hanya Admin yang dapat memverifikasi laporan.");
      return;
    }
    if (!supabase) return;
    setVerifying(row.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.user?.id ?? null,
        })
        .eq("id", row.id);
      if (error) throw error;
      await logActivity({
        action: "update",
        entity: "Laporan Harian",
        entityId: row.id,
        summary: `Verifikasi laporan ${cageName(row.cage_id)} ${row.report_date}`,
      });
      toast.success("Laporan terverifikasi.");
      onRefresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Verifikasi belum dapat disimpan."
      );
    } finally {
      setVerifying(null);
    }
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6d63]">
            INSIGHT
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#161b19]">
            Laporan & Riwayat
          </h2>
          <p className="mt-1 text-sm text-[#5a6d63]">
            Arsip laporan harian 30 hari terakhir beserta status verifikasi.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#dfe5e1] bg-white px-3 py-2 transition-colors focus-within:bg-[#f4f8f4]">
            <Search className="h-4 w-4 shrink-0 text-[#5a6d63]" />
            <input
              aria-label="Cari kandang atau kondisi"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Cari kandang atau kondisi…"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#5a6d63] sm:w-56"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Semua"],
                ["submitted", "Menunggu"],
                ["approved", "Terverifikasi"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                className={
                  filter === value
                    ? "bg-[#27745b] text-white hover:bg-[#1d5c48]"
                    : "border-[#dfe5e1]"
                }
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
            <ExportMenu onExport={doExport} />
          </div>
        </div>
      </div>
      <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
        <CardContent className="p-5">
          {dataLoading ? (
            <ListSkeleton rows={8} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f1d9] text-[#27745b]">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#315844]">
                  {rows.length === 0
                    ? "Belum ada laporan tercatat"
                    : "Tidak ada hasil yang cocok"}
                </p>
                <p className="mt-1 text-xs text-[#5a6d63]">
                  {rows.length === 0
                    ? "Laporan harian yang disimpan akan tampil di sini."
                    : "Coba kata kunci atau filter lain."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[860px] text-left text-sm">
                <TableHeader>
                  <TableRow className="border-y border-[#edf0ed] bg-[#fbfcfb] text-xs font-semibold text-[#5a6d63] hover:bg-[#fbfcfb]">
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Tanggal
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Kandang
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Kondisi
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Produksi
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Status
                    </TableHead>
                    <TableHead className="px-3 py-3 text-right text-[#5a6d63]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(row => {
                    const verified = row.status === "approved";
                    return (
                      <TableRow
                        key={row.id}
                        className="border-b border-[#edf0ed] last:border-0"
                      >
                        <TableCell className="whitespace-nowrap px-3 py-3 text-xs text-[#5a6d63]">
                          {new Date(
                            `${row.report_date}T00:00:00`
                          ).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-medium text-[#39433e]">
                          {cageName(row.cage_id)}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-[#444d48]">
                          {row.condition.charAt(0).toUpperCase() +
                            row.condition.slice(1)}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-[#444d48]">
                          {row.production_quantity ?? 0} butir · mortalitas{" "}
                          {row.mortality} ekor
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${verified ? "bg-[#e1f3e7] text-[#18734d]" : "bg-[#fff5e1] text-[#8a5a12]"}`}
                          >
                            {verified ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}
                            {verified ? "Terverifikasi" : "Menunggu"}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          {!verified && role === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#dfe5e1] text-xs text-[#27745b]"
                              disabled={verifying === row.id}
                              onClick={() => void verify(row)}
                            >
                              {verifying === row.id
                                ? "Memverifikasi…"
                                : "Verifikasi"}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#9db0a4]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
