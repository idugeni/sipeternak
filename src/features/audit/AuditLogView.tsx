import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListSkeleton } from "@/features/shared/skeletons";
import { ExportMenu } from "@/components/ExportMenu";
import {
  formatStampID,
  runExport,
  slugifyFile,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/export";
import type { AuditActivity } from "@/features/shared/types";

const ACTION_LABEL: Record<string, string> = {
  insert: "Menambah",
  update: "Mengubah",
  delete: "Menghapus",
};

export function AuditLogView({
  activities,
  dataLoading,
  generatedBy,
}: {
  activities: AuditActivity[];
  dataLoading: boolean;
  generatedBy?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = activities.filter(item =>
    `${item.actor_name ?? ""} ${item.entity} ${item.summary ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const doExport = (format: ExportFormat) => {
    const columns: ExportColumn<AuditActivity>[] = [
      {
        header: "Waktu",
        value: item => formatStampID(new Date(item.created_at)),
      },
      { header: "Pengguna", value: item => item.actor_name ?? "Pengguna" },
      {
        header: "Aksi",
        value: item =>
          `${ACTION_LABEL[item.action] ?? item.action} ${item.entity}`,
      },
      { header: "Ringkasan", value: item => item.summary ?? "—" },
    ];
    runExport(
      format,
      slugifyFile(`audit-log-${Date.now()}`),
      columns,
      filtered,
      {
        docCode: "AL",
        title: "Audit Log Aktivitas",
        subtitle: "Lapas Terbuka Kelas IIB Kendal",
        filters: query ? [`Pencarian: ${query}`] : [],
        generatedBy,
      }
    );
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6d63]">
            INSIGHT
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#161b19]">
            Audit Log
          </h2>
          <p className="mt-1 text-sm text-[#5a6d63]">
            Jejak aktivitas pengguna ruang kerja SIPETERNAK.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#dfe5e1] bg-white px-3 py-2 transition-colors focus-within:bg-[#f4f8f4]">
            <Search className="h-4 w-4 shrink-0 text-[#5a6d63]" />
            <input
              aria-label="Cari pengguna, entitas, ringkasan"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Cari pengguna, entitas, ringkasan…"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#5a6d63] sm:w-72"
            />
          </div>
          <ExportMenu onExport={doExport} />
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
                  {activities.length === 0
                    ? "Belum ada aktivitas tercatat"
                    : "Tidak ada hasil yang cocok"}
                </p>
                <p className="mt-1 text-xs text-[#5a6d63]">
                  {activities.length === 0
                    ? "Aktivitas simpan, ubah, dan hapus akan tercatat di sini."
                    : "Coba kata kunci lain."}
                </p>
              </div>
            </div>
          ) : (
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
                      Aksi
                    </TableHead>
                    <TableHead className="px-3 py-3 text-[#5a6d63]">
                      Ringkasan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow
                      key={item.id}
                      className="border-b border-[#edf0ed] last:border-0"
                    >
                      <TableCell className="whitespace-nowrap px-3 py-3 text-xs text-[#5a6d63]">
                        {new Date(item.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="px-3 py-3 font-medium text-[#39433e]">
                        {item.actor_name ?? "Pengguna"}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-[#444d48]">
                        {ACTION_LABEL[item.action] ?? item.action} {item.entity}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-[#5a6d63]">
                        {item.summary ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
