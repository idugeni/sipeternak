import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { ListSkeleton } from "@/features/shared/skeletons";
import { ExportMenu } from "@/components/ExportMenu";
import {
  runExport,
  slugifyFile,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/export";
import { logActivity } from "@/lib/audit";
import type { AppRole } from "@/features/shared/types";
// Label Indonesia untuk kolom database pada dialog tambah/ubah.
const FIELD_LABEL: Record<string, string> = {
  name: "Nama",
  code: "Kode",
  unit: "Satuan",
  low_stock_threshold: "Ambang stok rendah (kg)",
  description: "Deskripsi",
};
export function MasterDataView({
  role,
  generatedBy,
  onSaved,
}: {
  role: AppRole;
  generatedBy?: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  type MasterKey = "livestock_types" | "feed_types" | "production_types";
  const tabs: { key: MasterKey; label: string; fields: string[] }[] = [
    {
      key: "livestock_types",
      label: "Jenis ternak",
      fields: ["name", "code", "description"],
    },
    {
      key: "feed_types",
      label: "Jenis pakan",
      fields: ["name", "unit", "low_stock_threshold", "description"],
    },
    {
      key: "production_types",
      label: "Jenis produksi",
      fields: ["name", "unit"],
    },
  ];
  const [tab, setTab] = useState(tabs[0]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Abaikan respons fetch tab lama yang tiba setelah pindah tab.
  const activeTab = useRef(tab.key);
  activeTab.current = tab.key;
  const load = async (quiet = false) => {
    if (!supabase) {
      setItems([]);
      setLoading(false);
      return;
    }
    const tabKey = tab.key;
    if (!quiet) setLoading(true);
    const { data, error } = await (supabase as any)
      .from(tabKey)
      .select("*")
      .order("name")
      .limit(100);
    if (tabKey !== activeTab.current) return;
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, [tab.key]);
  const openNew = () => {
    setEditingId(null);
    setForm({});
    setOpen(true);
  };
  const doExport = (format: ExportFormat) => {
    const columns: ExportColumn<any>[] = [
      { header: "Nama", value: item => item.name ?? "—" },
      ...tab.fields
        .filter(field => field !== "name")
        .map((field): ExportColumn<any> => ({
          header: FIELD_LABEL[field] ?? field,
          value: item =>
            item[field] === null || item[field] === undefined
              ? "—"
              : String(item[field]),
        })),
    ];
    runExport(
      format,
      slugifyFile(`master-${tab.key}-${Date.now()}`),
      columns,
      items,
      {
        docCode: "MD",
        title: `Master Data — ${tab.label}`,
        subtitle: "Lapas Terbuka Kelas IIB Kendal",
        generatedBy,
      }
    );
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (role !== "admin") {
      toast.error("Master Data hanya dapat dikelola Admin.");
      return;
    }
    setSaving(true);
    try {
      if (!supabase) throw new Error("Layanan data belum terhubung.");
      const payload = {
        ...form,
        ...(tab.key === "feed_types"
          ? { low_stock_threshold: Number(form.low_stock_threshold || 0) }
          : {}),
      };
      const result = editingId
        ? await (supabase as any)
            .from(tab.key)
            .update(payload)
            .eq("id", editingId)
        : await (supabase as any).from(tab.key).insert(payload);
      if (result.error) throw result.error;
      await logActivity({
        action: editingId ? "update" : "insert",
        entity: tab.label,
        entityId: editingId,
        summary: form.name || tab.label,
      });
      toast.success("Master data berhasil disimpan.");
      setForm({});
      setEditingId(null);
      setOpen(false);
      void load(true);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Master data belum dapat disimpan."
      );
    } finally {
      setSaving(false);
    }
  };
  const doRemove = async (item: { id: string; name: string }) => {
    if (role !== "admin") {
      toast.error("Master Data hanya dapat dikelola Admin.");
      return;
    }
    if (!supabase || deleting) return;
    setDeleting(true);
    try {
      // Tolak hapus master yang masih dirujuk data operasional.
      const refs: Record<MasterKey, [string, string][]> = {
        livestock_types: [
          ["cages", "livestock_type_id"],
          ["livestock_groups", "livestock_type_id"],
        ],
        feed_types: [
          ["feed_transactions", "feed_type_id"],
          ["daily_reports", "feed_type_id"],
        ],
        production_types: [
          ["production_records", "production_type_id"],
          ["daily_reports", "production_type_id"],
        ],
      };
      const counts = await Promise.all(
        refs[tab.key].map(([table, column]) =>
          (supabase as any)
            .from(table)
            .select("id", { count: "exact", head: true })
            .eq(column, item.id)
        )
      );
      const linked = counts.reduce((sum, res) => sum + (res.count ?? 0), 0);
      if (linked > 0) {
        toast.error(
          `${tab.label} "${item.name}" dipakai ${linked} data operasional dan tidak dapat dihapus.`
        );
        return;
      }
      const { error } = await (supabase as any)
        .from(tab.key)
        .delete()
        .eq("id", item.id);
      if (error) toast.error(error.message);
      else {
        await logActivity({
          action: "delete",
          entity: tab.label,
          entityId: item.id,
          summary: item.name,
        });
        void load(true);
        onSaved();
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6d63]">
            ADMIN
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#173b32]">
            Master Data
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#5a6d63]">
            Kelola referensi yang digunakan oleh seluruh form operasional.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <ExportMenu
            onExport={doExport}
            disabled={loading || items.length === 0}
          />
          <Button
            className="gap-2 bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={openNew}
            disabled={role !== "admin"}
          >
            <Plus className="h-4 w-4" />
            Tambah Master
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(item => (
          <Button
            key={item.key}
            variant={tab.key === item.key ? "default" : "outline"}
            className={
              tab.key === item.key
                ? "bg-[#27745b] text-white"
                : "border-[#dfe5e1]"
            }
            onClick={() => {
              setTab(item);
              setForm({});
              setEditingId(null);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Card className="mt-5 border-[#dfe7e1] bg-white">
        <CardContent className="p-5">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : (
            <div className="space-y-3">
              {items.length ? (
                items.map(item => (
                  <div
                    key={item.id}
                    className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#edf1ed] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#315844]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#5a6d63]">
                        {item.code || item.unit || item.description || "Aktif"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm(
                          Object.fromEntries(
                            tab.fields.map(field => [
                              field,
                              String(item[field] ?? ""),
                            ])
                          )
                        );
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#b44736]"
                      onClick={() =>
                        setPendingDelete({ id: item.id, name: item.name })
                      }
                    >
                      Hapus
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-[#5a6d63]">
                  Belum ada master data.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={open}
        onOpenChange={next => {
          setOpen(next);
          if (!next) {
            setEditingId(null);
            setForm({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Tambah"} {tab.label}
            </DialogTitle>
            <DialogDescription>
              Perubahan akan digunakan oleh form operasional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {tab.fields.map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`master-${field}`}>
                  {FIELD_LABEL[field] ?? field.replaceAll("_", " ")}
                </Label>
                {field === "description" ? (
                  <Textarea
                    id={`master-${field}`}
                    value={form[field] ?? ""}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  />
                ) : (
                  <Input
                    id={`master-${field}`}
                    type={field === "low_stock_threshold" ? "number" : "text"}
                    value={form[field] ?? ""}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  setForm({});
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#27745b] text-white"
                disabled={saving}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={o => {
          if (!o && !deleting) setPendingDelete(null);
        }}
        title={`Hapus ${pendingDelete?.name ?? "master data"}?`}
        description={`Hapus ${pendingDelete?.name ?? "master data"}? Data yang dihapus tidak dapat dikembalikan.`}
        busy={deleting}
        onConfirm={() => {
          if (pendingDelete) void doRemove(pendingDelete);
        }}
      />
    </div>
  );
}
