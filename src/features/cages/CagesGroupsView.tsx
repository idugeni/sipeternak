import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ChevronRight,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole, CageRecord } from "@/features/shared/types";
import { ListSkeleton } from "@/features/shared/skeletons";
import { ExportMenu } from "@/components/ExportMenu";
import {
  runExport,
  slugifyFile,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/export";
import { CageDialog } from "@/features/cages/CageDialog";
export function CagesGroupsView({
  cages: realCages,
  role,
  dataLoading,
  onSaved,
  generatedBy,
}: {
  cages: CageRecord[];
  role: AppRole;
  dataLoading: boolean;
  onSaved: () => void;
  generatedBy?: string;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cageDialogOpen, setCageDialogOpen] = useState(false);
  const [editingCage, setEditingCage] = useState<CageRecord | null>(null);
  const sourceCages = realCages;
  const filtered = sourceCages
    .filter(cage => typeFilter === "all" || cage.type === typeFilter)
    .filter(cage => statusFilter === "all" || cage.status === statusFilter)
    .filter(cage =>
      `${cage.name} ${cage.type}`.toLowerCase().includes(query.toLowerCase())
    );
  const reset = () => {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter(
    num =>
      totalPages <= 7 ||
      num === 1 ||
      num === totalPages ||
      Math.abs(num - safePage) <= 1
  );
  const exportCsv = (format: ExportFormat) => {
    const columns: ExportColumn<CageRecord>[] = [
      { header: "Kode", value: cage => cage.code },
      { header: "Nama Kandang", value: cage => cage.name },
      { header: "Jenis Ternak", value: cage => cage.type },
      { header: "Jantan (ekor)", value: cage => cage.male },
      { header: "Betina (ekor)", value: cage => cage.female },
      {
        header: "Total Populasi (ekor)",
        value: cage => cage.male + cage.female,
      },
      { header: "Status", value: cage => cage.status },
      { header: "Lokasi", value: cage => cage.location ?? "—" },
      { header: "Kapasitas (ekor)", value: cage => cage.capacity ?? "—" },
      { header: "Terakhir Lapor", value: cage => cage.last },
    ];
    const filters: string[] = [];
    if (typeFilter !== "all") filters.push(`Jenis: ${typeFilter}`);
    if (statusFilter !== "all") filters.push(`Status: ${statusFilter}`);
    if (query) filters.push(`Pencarian: ${query}`);
    runExport(
      format,
      slugifyFile(`data-kandang-kelompok-${Date.now()}`),
      columns,
      filtered,
      {
        docCode: "KD",
        title: "Data Kandang dan Kelompok Ternak",
        subtitle: "Lapas Terbuka Kelas IIB Kendal",
        filters,
        generatedBy,
      }
    );
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-[#161b19]">
            Cages & Groups
          </h2>
          <p className="mt-1 text-sm text-[#5a6d63]">
            Kelola data kandang dan kelompok ternak di Lapas Terbuka Kelas IIB
            Kendal
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-[#dfe5e1] bg-white px-3 py-2 transition-colors focus-within:bg-[#f4f8f4]">
            <Search className="h-4 w-4 shrink-0 text-[#5a6d63]" />
            <input
              aria-label="Cari kandang, jenis ternak, atau lokasi"
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari kandang, jenis ternak, atau lokasi..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#5a6d63] sm:w-72"
            />
          </div>
          <Button
            className="gap-2 bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={() => {
              if (role !== "admin") {
                toast.error("Hanya Admin yang dapat mengubah master kandang.");
                return;
              }
              setEditingCage(null);
              setCageDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Kandang
          </Button>
        </div>
      </div>
      <Card className="border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.35fr]">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#202622]">
                Jenis Ternak
              </Label>
              <Select
                value={typeFilter}
                onValueChange={value => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 w-full border-[#dfe5e1] bg-white text-sm text-[#4f5a53] focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                  <SelectValue placeholder="Semua jenis ternak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua jenis ternak</SelectItem>
                  {[
                    "Ayam Hias",
                    "Ayam Petelur",
                    "Kambing PE",
                    "Sapi",
                    "Puyuh",
                  ].map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#202622]">
                Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 w-full border-[#dfe5e1] bg-white text-sm text-[#4f5a53] focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-l-0 border-[#e1e6e2] pt-1 lg:border-l lg:pl-8">
              <div>
                <p className="text-sm text-[#616c65]">
                  Filter aktif:{" "}
                  <span className="ml-2 inline-flex rounded-full bg-[#e4f3e9] px-3 py-1 text-xs font-medium text-[#26734d]">
                    {typeFilter === "all" && statusFilter === "all"
                      ? "Semua data"
                      : `${filtered.length} data`}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 border-[#dfe5e1] text-sm font-semibold text-[#1f2823]"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-5 border-[#e2e2df] bg-white shadow-[0_2px_8px_rgba(31,48,42,0.05)]">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-[#191e1c]">
              Daftar Kandang dan Kelompok Ternak
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[#5a6d63]">
              {filtered.length} kandang ditemukan
            </CardDescription>
          </div>
          <ExportMenu onExport={exportCsv} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[820px] text-left text-sm">
              <TableHeader>
                <TableRow className="bg-[#f7f8f7] text-sm font-semibold text-[#222824] hover:bg-[#f7f8f7]">
                  <TableHead className="rounded-l-md px-3 py-4 text-[#222824]">
                    Nama Kandang{" "}
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 rotate-45 text-[#5a6d63]" />
                  </TableHead>
                  <TableHead className="px-3 py-4 text-[#222824]">
                    Jenis Ternak{" "}
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 rotate-45 text-[#5a6d63]" />
                  </TableHead>
                  <TableHead className="px-3 py-4 text-[#222824]">
                    Populasi
                    <br />
                    (Jantan/Betina){" "}
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 rotate-45 text-[#5a6d63]" />
                  </TableHead>
                  <TableHead className="px-3 py-4 text-[#222824]">
                    Status{" "}
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 rotate-45 text-[#5a6d63]" />
                  </TableHead>
                  <TableHead className="px-3 py-4 text-[#222824]">
                    Terakhir Lapor{" "}
                    <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 rotate-45 text-[#5a6d63]" />
                  </TableHead>
                  <TableHead className="rounded-r-md px-3 py-4 text-right text-[#222824]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-3 py-4">
                      <ListSkeleton rows={6} />
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map(cage => (
                    <TableRow
                      key={cage.id}
                      className="border-b border-[#edf0ed] last:border-0"
                    >
                      <TableCell className="px-3 py-4 font-semibold text-[#1b211e]">
                        {cage.name}
                      </TableCell>
                      <TableCell className="px-3 py-4 text-[#454f49]">
                        {cage.type}
                      </TableCell>
                      <TableCell className="px-3 py-4 text-[#454f49]">
                        {cage.male}J / {cage.female}B
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cage.status === "Aktif" ? "bg-[#e2f4e8] text-[#197044]" : "bg-[#fae3df] text-[#ba3f32]"}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${cage.status === "Aktif" ? "bg-[#18734d]" : "bg-[#a93a2b]"}`}
                          />
                          {cage.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <p className="text-[#343d38]">{cage.last}</p>
                        <p className="mt-1 text-xs text-[#5a6d63]">
                          {cage.date}
                        </p>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-[#dfe5e1] text-[#1d2922]"
                          onClick={() => {
                            if (role !== "admin") {
                              toast.info(`Detail ${cage.name}`);
                              return;
                            }
                            setEditingCage(cage as CageRecord);
                            setCageDialogOpen(true);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!dataLoading && filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#5a6d63]">
                Tidak ada kandang yang sesuai dengan filter.
              </div>
            ) : null}
          </div>
          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-[#edf0ed] pt-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[#626b65]">
              {filtered.length === 0
                ? "Tidak ada data"
                : `Menampilkan ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} dari ${filtered.length} data`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-[#dfe5e1]"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              {pageNumbers.map(item => (
                <Button
                  key={item}
                  size="icon"
                  variant={safePage === item ? "default" : "outline"}
                  className={
                    safePage === item
                      ? "bg-[#27745b] text-white hover:bg-[#1d5c48]"
                      : "border-[#dfe5e1]"
                  }
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="border-[#dfe5e1]"
                disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <CageDialog
        open={cageDialogOpen}
        onOpenChange={setCageDialogOpen}
        role={role}
        editing={editingCage}
        onSaved={onSaved}
      />
    </div>
  );
}
