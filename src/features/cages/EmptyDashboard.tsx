import { Plus, RefreshCw, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
export function EmptyDashboard({
  onNavigate,
  onRefresh,
}: {
  onNavigate: (label: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#b9d3c3] bg-white p-8 shadow-[0_8px_30px_rgba(31,48,42,0.04)] sm:p-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4f2e8] text-[#27745b]">
          <Warehouse className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-[#173b32]">
          Ruang kerja siap diisi
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#5a6d63]">
          Sistem sudah terhubung, tetapi belum ada kandang atau kelompok ternak.
          Mulai dari master kandang untuk mengaktifkan seluruh alur laporan,
          pakan, produksi, kesehatan, dan audit.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={() => onNavigate("Kandang & Kelompok")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buka Master Kandang
          </Button>
          <Button
            variant="outline"
            className="border-[#dfe5e1]"
            onClick={onRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Muat Ulang Data
          </Button>
        </div>
      </div>
    </div>
  );
}
