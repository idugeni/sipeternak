import {
  Activity,
  ChevronRight,
  Egg,
  FileBarChart2,
  HeartPulse,
  PawPrint,
  Plus,
  Settings2,
  ShieldCheck,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCount, formatKg } from "@/lib/format";
import { ListSkeleton } from "@/features/shared/skeletons";
import type { AppRole, CageRecord, Counts } from "@/features/shared/types";
export function ModuleView({
  active,
  onOpenReport,
  counts,
  cages,
  role,
  dataLoading,
}: {
  active: string;
  onOpenReport: () => void;
  counts: Counts;
  cages: CageRecord[];
  role: AppRole;
  dataLoading: boolean;
}) {
  const metadata: Record<
    string,
    {
      eyebrow: string;
      title: string;
      description: string;
      icon: typeof Activity;
      action?: string;
    }
  > = {
    "Livestock & Populasi": {
      eyebrow: "WORKSPACE",
      title: "Livestock & populasi",
      description:
        "Kelola populasi berdasarkan kelompok tanpa kehilangan jejak perubahan.",
      icon: PawPrint,
      action: "Tambah kelompok",
    },
    Pakan: {
      eyebrow: "OPERASIONAL",
      title: "Pakan",
      description:
        "Pantau stok masuk, pemakaian harian, dan ambang stok minimum.",
      icon: Wheat,
      action: "Catat transaksi",
    },
    Produksi: {
      eyebrow: "OPERASIONAL",
      title: "Produksi",
      description:
        "Rekam telur dan hasil ternak lain dengan tipe produksi yang dinamis.",
      icon: Egg,
      action: "Catat produksi",
    },
    Kesehatan: {
      eyebrow: "OPERASIONAL",
      title: "Kesehatan",
      description:
        "Tindak lanjuti pemeriksaan, vaksinasi, sakit, dan perawatan ternak.",
      icon: HeartPulse,
      action: "Catat pemeriksaan",
    },
    "Laporan & Riwayat": {
      eyebrow: "INSIGHT",
      title: "Laporan & riwayat",
      description:
        "Baca tren populasi, produksi, pakan, dan mortalitas untuk keputusan yang lebih cepat.",
      icon: FileBarChart2,
      action: "Export laporan",
    },
    "Audit Log": {
      eyebrow: "INSIGHT",
      title: "Audit log",
      description:
        "Jejak perubahan data untuk menjaga akuntabilitas operasional.",
      icon: ShieldCheck,
    },
    "Master Data": {
      eyebrow: "INSIGHT",
      title: "Master data",
      description:
        "Atur tipe ternak, kategori, jenis pakan, dan tipe produksi.",
      icon: Settings2,
      action: "Kelola master data",
    },
  };
  const content = metadata[active] ?? metadata["Laporan & Riwayat"];
  const Icon = content.icon;
  const metric =
    active === "Livestock & Populasi"
      ? `${formatCount(counts.population)} ekor`
      : active === "Kandang & Kelompok"
        ? `${counts.cages} kandang aktif`
        : active === "Pakan"
          ? `${formatKg(counts.feed)} kg`
          : active === "Produksi"
            ? `${formatCount(counts.production)} unit (7 hari)`
            : active === "Kesehatan"
              ? `${formatCount(counts.deaths)} kematian / 30 hari`
              : active === "Laporan & Riwayat"
                ? `${counts.reports} laporan hari ini`
                : active === "Audit Log"
                  ? "Terproteksi"
                  : "Master aktif";
  const dataRows = cages.slice(0, 5).map(cage => ({
    title: cage.name,
    detail: `${cage.type} · ${formatCount(cage.population)} ekor`,
    tag: cage.status,
  }));
  const action = () => {
    if (active === "Laporan Harian") {
      onOpenReport();
      return;
    }
    if (active === "Master Data" && role !== "admin") {
      toast.error("Master Data hanya dapat dikelola Admin.");
      return;
    }
    toast.info(
      `Aksi ${content.action?.toLowerCase() ?? "modul"} siap dihubungkan ke data ${active.toLowerCase()}.`
    );
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6d63]">
            {content.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#173b32]">
            {content.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#5a6d63]">
            {content.description}
          </p>
        </div>
        {content.action ? (
          <Button
            className="w-fit gap-2 bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={action}
          >
            <Plus className="h-4 w-4" />
            {content.action}
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-[#dfe7e1] bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f1d9] text-[#27745b]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-[#5a6d63]">Data terhubung</p>
              <p className="mt-1 text-lg font-semibold text-[#173b32]">
                {dataLoading ? (
                  <span className="inline-block h-6 w-28 animate-pulse rounded-md bg-[#e4ebe4]" />
                ) : (
                  metric
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#dfe7e1] bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f1f6] text-[#35687f]">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-[#5a6d63]">Sumber data</p>
              <p className="mt-1 text-lg font-semibold text-[#173b32]">
                Sistem terpusat
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#dfe7e1] bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7ead1] text-[#8a5a12]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-[#5a6d63]">Akses</p>
              <p className="mt-1 text-lg font-semibold text-[#173b32]">
                {role === "admin" ? "Admin" : "Petugas"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 border-[#dfe7e1] bg-white shadow-[0_10px_30px_rgba(28,63,47,0.04)]">
        <CardHeader>
          <CardTitle className="text-base text-[#173b32]">
            Data {content.title.toLowerCase()}
          </CardTitle>
          <CardDescription className="text-xs text-[#5a6d63]">
            Ringkasan ini mengikuti data yang tersedia dari sumber operasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataLoading ? (
            <ListSkeleton rows={4} />
          ) : dataRows.length ? (
            dataRows.map(row => (
              <div
                key={row.title}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#edf1ed] p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#496155]">
                    {row.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5a6d63]">{row.detail}</p>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit border-[#dbe5dd] text-xs text-[#667b6d]"
                >
                  {row.tag}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit text-[#27745b]"
                  onClick={() => toast.info(`Membuka detail ${row.title}`)}
                >
                  Buka detail <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#c9ddd0] bg-[#f8fbf8] p-8 text-center">
              <p className="text-sm font-semibold text-[#315844]">
                Belum ada data {content.title.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-[#5a6d63]">
                Tambahkan data dari aksi utama modul atau lengkapi master
                kandang terlebih dahulu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
