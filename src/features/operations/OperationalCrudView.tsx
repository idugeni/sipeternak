import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { DateField } from "@/components/ui/date-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NullableSelect } from "@/components/ui/nullable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCount, formatKg, todayLocalIso } from "@/lib/format";
import type { AppRole, CageRecord } from "@/features/shared/types";
type OpsMode = "groups" | "feed" | "production" | "health";
type OpsItem = {
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  meta?: string;
  raw?: Record<string, any>;
};
// Label Indonesia untuk nilai enum database.
const FEED_TXN_LABEL: Record<string, string> = {
  in: "Masuk",
  consumption: "Pemakaian",
  adjustment: "Penyesuaian",
};
const HEALTH_TYPE_LABEL: Record<string, string> = {
  checkup: "Pemeriksaan",
  vaccination: "Vaksinasi",
  illness: "Sakit",
  treatment: "Perawatan",
};

export function OperationalCrudView({
  mode,
  role,
  cages,
  generatedBy,
  onSaved,
}: {
  mode: OpsMode;
  role: AppRole;
  cages: CageRecord[];
  generatedBy?: string;
  onSaved: () => void;
}) {
  const meta = {
    groups: {
      title: "Livestock & populasi",
      eyebrow: "WORKSPACE",
      description:
        "Kelola kelompok ternak, komposisi jantan/betina, dan status kelompok.",
      table: "livestock_groups",
      action: "Tambah kelompok",
    },
    feed: {
      title: "Pakan",
      eyebrow: "OPERASIONAL",
      description:
        "Catat stok masuk, pemakaian, dan penyesuaian pakan dengan jejak transaksi.",
      table: "feed_transactions",
      action: "Catat transaksi",
    },
    production: {
      title: "Produksi",
      eyebrow: "OPERASIONAL",
      description:
        "Rekam hasil produksi berdasarkan tipe produksi dan tanggal pencatatan.",
      table: "production_records",
      action: "Catat produksi",
    },
    health: {
      title: "Kesehatan",
      eyebrow: "OPERASIONAL",
      description:
        "Pantau pemeriksaan, vaksinasi, sakit, dan perawatan ternak.",
      table: "health_records",
      action: "Catat pemeriksaan",
    },
  }[mode];
  const [items, setItems] = useState<OpsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OpsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [lookups, setLookups] = useState<{ id: string; name: string }[]>([]);
  const [pendingDelete, setPendingDelete] = useState<OpsItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [loadingMore, setLoadingMore] = useState(false);
  // Abaikan respons fetch kedaluwarsa agar tidak menimpa daftar terbaru.
  const loadSeq = useRef(0);
  // Selaras RLS: grup & pakan hanya admin; produksi & kesehatan boleh pemilik data.
  const canEdit = (item: OpsItem) => {
    if (role === "admin") return true;
    if (mode === "groups" || mode === "feed") return false;
    const owner = (item.raw as { created_by?: string | null } | undefined)
      ?.created_by;
    return !!owner && !!myId && owner === myId;
  };
  const load = async (nextLimit = limit, quiet = false) => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const seq = ++loadSeq.current;
    const alive = () => seq === loadSeq.current;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      setMyId(userData.user?.id ?? null);
      if (mode === "groups") {
        const { data, error: queryError } = await supabase
          .from("livestock_groups")
          .select("id,name,male_count,female_count,status,started_at,cage_id")
          .order("created_at", { ascending: false })
          .limit(nextLimit);
        if (queryError) throw queryError;
        if (!alive()) return;
        setItems(
          (data ?? []).map(item => ({
            id: item.id,
            title: item.name,
            subtitle: `${Number(item.male_count ?? 0) + Number(item.female_count ?? 0)} ekor · ${Number(item.male_count ?? 0)}J / ${Number(item.female_count ?? 0)}B`,
            status: item.status === "active" ? "Aktif" : "Ditutup",
            meta: item.started_at ?? "",
            raw: item,
          }))
        );
        const { data: types } = await supabase
          .from("livestock_types")
          .select("id,name")
          .eq("is_active", true)
          .order("name")
          .limit(nextLimit);
        setLookups((types ?? []) as { id: string; name: string }[]);
      } else if (mode === "feed") {
        const { data, error: queryError } = await supabase
          .from("feed_transactions")
          .select(
            "id,quantity,txn_type,txn_date,notes,feed_type_id,cage_id,created_by"
          )
          .order("txn_date", { ascending: false })
          .limit(nextLimit);
        if (queryError) throw queryError;
        const { data: feeds } = await supabase
          .from("feed_types")
          .select("id,name")
          .eq("is_active", true)
          .order("name")
          .limit(nextLimit);
        setLookups((feeds ?? []) as { id: string; name: string }[]);
        if (!alive()) return;
        setItems(
          (data ?? []).map(item => ({
            id: item.id,
            title:
              (feeds ?? []).find(feed => feed.id === item.feed_type_id)?.name ??
              "Jenis pakan",
            subtitle: `${formatKg(Number(item.quantity ?? 0))} kg · ${FEED_TXN_LABEL[item.txn_type] ?? item.txn_type}`,
            status: FEED_TXN_LABEL[item.txn_type] ?? item.txn_type,
            meta: item.txn_date,
            raw: item,
          }))
        );
      } else if (mode === "production") {
        const { data, error: queryError } = await supabase
          .from("production_records")
          .select(
            "id,quantity,record_date,notes,production_type_id,cage_id,created_by"
          )
          .order("record_date", { ascending: false })
          .limit(nextLimit);
        if (queryError) throw queryError;
        const { data: types } = await supabase
          .from("production_types")
          .select("id,name")
          .eq("is_active", true)
          .order("name")
          .limit(nextLimit);
        setLookups((types ?? []) as { id: string; name: string }[]);
        if (!alive()) return;
        setItems(
          (data ?? []).map(item => ({
            id: item.id,
            title:
              (types ?? []).find(type => type.id === item.production_type_id)
                ?.name ?? "Tipe produksi",
            subtitle: `${formatCount(Number(item.quantity ?? 0))} unit`,
            status: "Tercatat",
            meta: item.record_date,
            raw: item,
          }))
        );
      } else {
        const { data, error: queryError } = await supabase
          .from("health_records")
          .select(
            "id,title,health_type,affected_count,record_date,description,cage_id,created_by"
          )
          .order("record_date", { ascending: false })
          .limit(nextLimit);
        if (queryError) throw queryError;
        if (!alive()) return;
        setItems(
          (data ?? []).map(item => ({
            id: item.id,
            title: item.title,
            subtitle: `${HEALTH_TYPE_LABEL[item.health_type] ?? item.health_type} · ${item.affected_count ?? 0} ekor terdampak`,
            status: HEALTH_TYPE_LABEL[item.health_type] ?? item.health_type,
            meta: item.record_date,
            raw: item,
          }))
        );
      }
    } catch (err) {
      if (!alive()) return;
      const message =
        err instanceof Error ? err.message : "Data belum dapat dimuat.";
      setError(message);
      toast.error(message);
    } finally {
      if (alive()) setLoading(false);
    }
  };
  useEffect(() => {
    setLimit(100);
    void load(100);
  }, [mode]);
  const loadMore = async () => {
    const next = limit + 100;
    setLimit(next);
    setLoadingMore(true);
    try {
      await load(next, true);
    } finally {
      setLoadingMore(false);
    }
  };
  const doExport = (format: ExportFormat) => {
    const head =
      mode === "groups"
        ? { a: "Nama Kelompok", b: "Komposisi", c: "Status", code: "KP" }
        : mode === "feed"
          ? { a: "Jenis Pakan", b: "Jumlah", c: "Jenis Transaksi", code: "PK" }
          : mode === "production"
            ? { a: "Tipe Produksi", b: "Jumlah", c: "Status", code: "PR" }
            : { a: "Judul", b: "Dampak", c: "Jenis", code: "KS" };
    const columns: ExportColumn<OpsItem>[] = [
      { header: head.a, value: item => item.title },
      { header: head.b, value: item => item.subtitle },
      { header: head.c, value: item => item.status ?? "—" },
      { header: "Tanggal", value: item => item.meta ?? "—" },
    ];
    runExport(
      format,
      slugifyFile(`${meta.title}-${Date.now()}`),
      columns,
      items,
      {
        docCode: head.code,
        title: meta.title,
        subtitle: "Lapas Terbuka Kelas IIB Kendal",
        generatedBy,
      }
    );
  };
  const startAdd = () => {
    setEditing(null);
    setForm(
      mode === "groups"
        ? {
            name: "",
            male: "0",
            female: "0",
            typeId: lookups[0]?.id ?? "",
            cageId: cages[0]?.id ?? "",
            notes: "",
          }
        : mode === "feed"
          ? {
              feedTypeId: lookups[0]?.id ?? "",
              quantity: "",
              txnType: "in",
              date: todayLocalIso(),
              notes: "",
              cageId: cages[0]?.id ?? "",
            }
          : mode === "production"
            ? {
                productionTypeId: lookups[0]?.id ?? "",
                quantity: "",
                date: todayLocalIso(),
                notes: "",
                cageId: cages[0]?.id ?? "",
              }
            : {
                title: "",
                healthType: "checkup",
                affected: "0",
                date: todayLocalIso(),
                description: "",
                cageId: cages[0]?.id ?? "",
              }
    );
    setOpen(true);
  };
  const startEdit = async (item: OpsItem) => {
    if (!canEdit(item)) {
      toast.error(
        mode === "feed"
          ? "Hanya Admin yang dapat mengubah transaksi pakan."
          : "Hanya Admin atau pemilik data yang dapat mengubah."
      );
      return;
    }
    setEditing(item);
    const raw = item.raw ?? {};
    if (mode === "groups")
      setForm({
        name: String(raw.name ?? item.title),
        male: String(raw.male_count ?? 0),
        female: String(raw.female_count ?? 0),
        typeId: String(raw.livestock_type_id ?? lookups[0]?.id ?? ""),
        cageId: String(raw.cage_id ?? cages[0]?.id ?? ""),
        notes: String(raw.notes ?? ""),
      });
    else if (mode === "feed")
      setForm({
        feedTypeId: String(raw.feed_type_id ?? lookups[0]?.id ?? ""),
        quantity: String(raw.quantity ?? ""),
        txnType: String(raw.txn_type ?? "in"),
        date: String(raw.txn_date ?? todayLocalIso()),
        notes: String(raw.notes ?? ""),
        cageId: String(raw.cage_id ?? ""),
      });
    else if (mode === "production")
      setForm({
        productionTypeId: String(
          raw.production_type_id ?? lookups[0]?.id ?? ""
        ),
        quantity: String(raw.quantity ?? ""),
        date: String(raw.record_date ?? todayLocalIso()),
        notes: String(raw.notes ?? ""),
        cageId: String(raw.cage_id ?? ""),
      });
    else
      setForm({
        title: String(raw.title ?? item.title),
        healthType: String(raw.health_type ?? "checkup"),
        affected: String(raw.affected_count ?? 0),
        date: String(raw.record_date ?? todayLocalIso()),
        description: String(raw.description ?? ""),
        cageId: String(raw.cage_id ?? cages[0]?.id ?? ""),
      });
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (role !== "admin" && mode === "groups") {
      toast.error("Perubahan kelompok dibatasi untuk Admin.");
      return;
    }
    if (editing && !canEdit(editing)) {
      toast.error(
        mode === "feed"
          ? "Hanya Admin yang dapat mengubah transaksi pakan."
          : "Hanya Admin atau pemilik data yang dapat mengubah."
      );
      return;
    }
    const isWhole = (value: string) => Number.isInteger(Number(value));
    const isNonNeg = (value: string) =>
      value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
    if (
      mode === "groups" &&
      (!isWhole(form.male ?? "0") || !isWhole(form.female ?? "0"))
    ) {
      toast.error("Jumlah jantan dan betina harus bilangan bulat.");
      return;
    }
    if (
      mode === "groups" &&
      (Number(form.male ?? 0) < 0 || Number(form.female ?? 0) < 0)
    ) {
      toast.error("Jumlah jantan dan betina tidak boleh negatif.");
      return;
    }
    if (mode === "feed") {
      if (!form.feedTypeId) {
        toast.error("Jenis pakan wajib dipilih.");
        return;
      }
      if (!isNonNeg(form.quantity ?? "")) {
        toast.error("Jumlah pakan harus angka nol atau lebih.");
        return;
      }
      // Selaras check constraint DB: pemakaian wajib terikat kandang.
      if (form.txnType === "consumption" && !form.cageId) {
        toast.error("Pemakaian pakan wajib memilih kandang.");
        return;
      }
    }
    if (mode === "production" && !isWhole(form.quantity ?? "0")) {
      toast.error("Jumlah produksi harus bilangan bulat.");
      return;
    }
    // Selaras check constraint DB: produksi & kesehatan wajib terikat kandang.
    if (mode === "production" && !form.cageId) {
      toast.error("Catatan produksi wajib memilih kandang.");
      return;
    }
    if (mode === "health" && !form.cageId) {
      toast.error("Catatan kesehatan wajib memilih kandang.");
      return;
    }
    // Selaras check constraint DB: judul minimal 3 karakter.
    if (mode === "health" && (form.title ?? "").trim().length < 3) {
      toast.error("Judul pemeriksaan minimal 3 karakter.");
      return;
    }
    if (
      mode === "production" &&
      ((form.quantity ?? "") === "" || Number(form.quantity) < 0)
    ) {
      toast.error("Jumlah produksi tidak boleh negatif.");
      return;
    }
    if (mode === "health" && form.affected && !isWhole(form.affected)) {
      toast.error("Jumlah terdampak harus bilangan bulat.");
      return;
    }
    if (mode === "health" && Number(form.affected || 0) < 0) {
      toast.error("Jumlah terdampak tidak boleh negatif.");
      return;
    }
    setSaving(true);
    try {
      if (!supabase) throw new Error("Layanan data belum terhubung.");
      const { data: userData } = await supabase.auth.getUser();
      let result;
      if (mode === "groups") {
        if (!form.typeId || !form.cageId) {
          toast.error("Jenis ternak dan kandang wajib dipilih.");
          return;
        }
        const payload = {
          name: form.name,
          livestock_type_id: form.typeId,
          cage_id: form.cageId,
          male_count: Number(form.male || 0),
          female_count: Number(form.female || 0),
          notes: form.notes || null,
        };
        result = editing
          ? await supabase
              .from("livestock_groups")
              .update(payload)
              .eq("id", editing.id)
          : await supabase.from("livestock_groups").insert(payload);
      } else if (mode === "feed") {
        const payload = {
          feed_type_id: form.feedTypeId,
          cage_id: form.cageId || null,
          txn_type: form.txnType as "in" | "consumption" | "adjustment",
          quantity: Number(form.quantity || 0),
          txn_date: form.date,
          notes: form.notes || null,
          created_by: userData.user?.id ?? null,
        };
        result = editing
          ? await supabase
              .from("feed_transactions")
              .update(payload)
              .eq("id", editing.id)
          : await supabase.from("feed_transactions").insert(payload);
      } else if (mode === "production") {
        const payload = {
          production_type_id: form.productionTypeId,
          cage_id: form.cageId || null,
          quantity: Number(form.quantity || 0),
          record_date: form.date,
          notes: form.notes || null,
          created_by: userData.user?.id ?? null,
        };
        result = editing
          ? await supabase
              .from("production_records")
              .update(payload)
              .eq("id", editing.id)
          : await supabase.from("production_records").insert(payload);
      } else {
        const payload = {
          cage_id: form.cageId || null,
          health_type: form.healthType as
            "checkup" | "illness" | "treatment" | "vaccination",
          title: form.title,
          affected_count: Number(form.affected || 0),
          record_date: form.date,
          description: form.description || null,
          created_by: userData.user?.id ?? null,
        };
        result = editing
          ? await supabase
              .from("health_records")
              .update(payload)
              .eq("id", editing.id)
          : await supabase.from("health_records").insert(payload);
      }
      if (result.error) throw result.error;
      const auditAction = editing ? "update" : ("insert" as const);
      if (mode === "groups")
        await logActivity({
          action: auditAction,
          entity: "Kelompok Ternak",
          entityId: editing?.id ?? null,
          summary: `${form.name} — ${form.male || 0}J/${form.female || 0}B ekor`,
        });
      else if (mode === "feed")
        await logActivity({
          action: auditAction,
          entity: "Pakan",
          entityId: editing?.id ?? null,
          summary: `${form.quantity || 0} kg · ${FEED_TXN_LABEL[form.txnType ?? "in"] ?? form.txnType ?? "in"}`,
        });
      else if (mode === "production")
        await logActivity({
          action: auditAction,
          entity: "Produksi",
          entityId: editing?.id ?? null,
          summary: `${form.quantity || 0} unit`,
        });
      else
        await logActivity({
          action: auditAction,
          entity: "Kesehatan",
          entityId: editing?.id ?? null,
          summary: `${form.title || "Pemeriksaan"} — terdampak ${form.affected || 0} ekor`,
        });
      toast.success(`${meta.title} berhasil disimpan.`);
      setOpen(false);
      // Muat ulang diam-diam: daftar tetap terlihat selama fetch agar tidak
      // berkedip skeleton. onSaved memicu refresh global untuk angka dashboard.
      void load(limit, true);
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Data belum dapat disimpan."
      );
    } finally {
      setSaving(false);
    }
  };
  const doRemove = async (item: OpsItem) => {
    if (role !== "admin") {
      toast.error("Hanya Admin yang dapat menghapus data.");
      return;
    }
    if (!supabase || deleting) return;
    // Kunci selama penghapusan agar klik ganda tidak mengulang DELETE.
    setDeleting(true);
    try {
      const result = await (supabase as any)
        .from(meta.table)
        .delete()
        .eq("id", item.id);
      if (result.error) toast.error(result.error.message);
      else {
        await logActivity({
          action: "delete",
          entity: meta.title,
          entityId: item.id,
          summary: item.title,
        });
        toast.success("Data berhasil dihapus.");
        void load(limit, true);
        onSaved();
      }
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };
  const field = (key: string, label: string, type = "text") => {
    if (type === "date")
      return (
        <div className="space-y-2">
          <Label htmlFor={`ops-${key}`}>{label}</Label>
          <DateField
            id={`ops-${key}`}
            value={form[key] ?? ""}
            onChange={value =>
              setForm(current => ({ ...current, [key]: value }))
            }
            triggerClassName="h-10 w-full focus-visible:border-border focus-visible:bg-[#f4f8f4] focus-visible:ring-0 hover:bg-transparent"
          />
        </div>
      );
    // Hanya pakan (kg) yang boleh desimal — cacah ekor/unit selalu bulat.
    const numberProps =
      type === "number"
        ? key === "quantity" && mode === "feed"
          ? { min: "0", step: "0.1" }
          : { min: "0", step: "1" }
        : {};
    return (
      <div className="space-y-2">
        <Label htmlFor={`ops-${key}`}>{label}</Label>
        <Input
          id={`ops-${key}`}
          type={type}
          value={form[key] ?? ""}
          {...numberProps}
          onChange={event =>
            setForm(current => ({ ...current, [key]: event.target.value }))
          }
          className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
        />
      </div>
    );
  };
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6d63]">
            {meta.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#173b32]">
            {meta.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#5a6d63]">
            {meta.description}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <ExportMenu
            onExport={doExport}
            disabled={loading || items.length === 0}
          />
          <Button
            className="w-fit gap-2 bg-[#27745b] text-white hover:bg-[#1d5c48]"
            onClick={startAdd}
          >
            <Plus className="h-4 w-4" />
            {meta.action}
          </Button>
        </div>
      </div>
      <Card className="border-[#dfe7e1] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#173b32]">
            Data tersimpan
          </CardTitle>
          <CardDescription>Data tersimpan · Terproteksi</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton rows={5} />
          ) : error ? (
            <div className="rounded-xl bg-[#fff4f1] p-5 text-sm text-[#a94637]">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#c9ddd0] bg-[#f8fbf8] p-10 text-center">
              <p className="font-semibold text-[#315844]">Belum ada data</p>
              <p className="mt-1 text-sm text-[#5a6d63]">
                Gunakan tombol utama untuk membuat entri pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#edf1ed] p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#315844]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#5a6d63]">
                      {item.subtitle}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit border-[#dbe5dd]">
                    {item.status}
                  </Badge>
                  <span className="text-xs text-[#5a6d63]">{item.meta}</span>
                  <div className="flex gap-2">
                    {canEdit(item) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void startEdit(item)}
                      >
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#b44736]"
                      onClick={() => setPendingDelete(item)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && items.length >= limit ? (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="border-[#dfe5e1]"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Memuat…" : "Muat lebih banyak"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Tambah"} {meta.title}
            </DialogTitle>
            <DialogDescription>
              Data divalidasi otomatis sesuai peran pengguna.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={save}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {mode === "groups" ? (
              <>
                {field("name", "Nama kelompok *")}
                {field("male", "Jantan", "number")}
                {field("female", "Betina", "number")}
                <div className="space-y-2">
                  <Label>Jenis ternak</Label>
                  <NullableSelect
                    value={form.typeId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        typeId: value,
                      }))
                    }
                    emptyLabel="Pilih jenis"
                    triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  >
                    {lookups.map(lookup => (
                      <SelectItem key={lookup.id} value={lookup.id}>
                        {lookup.name}
                      </SelectItem>
                    ))}
                  </NullableSelect>
                </div>
                <div className="space-y-2">
                  <Label>Kandang</Label>
                  <NullableSelect
                    value={form.cageId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        cageId: value,
                      }))
                    }
                    emptyLabel="Pilih kandang"
                    triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  >
                    {cages.map(cage => (
                      <SelectItem key={cage.id} value={cage.id}>
                        {cage.name}
                      </SelectItem>
                    ))}
                  </NullableSelect>
                </div>
                {field("notes", "Catatan")}
              </>
            ) : mode === "feed" ? (
              <>
                <div className="space-y-2">
                  <Label>Jenis pakan *</Label>
                  <Select
                    value={form.feedTypeId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        feedTypeId: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                      <SelectValue placeholder="Pilih jenis pakan" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.map(lookup => (
                        <SelectItem key={lookup.id} value={lookup.id}>
                          {lookup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {field("quantity", "Jumlah (kg) *", "number")}
                <div className="space-y-2">
                  <Label>
                    Kandang{" "}
                    {form.txnType === "consumption" ? (
                      <span className="text-[#b44736]">
                        (wajib untuk Pemakaian)
                      </span>
                    ) : (
                      <span className="font-normal text-[#5a6d63]">
                        (opsional)
                      </span>
                    )}
                  </Label>
                  <NullableSelect
                    value={form.cageId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        cageId: value,
                      }))
                    }
                    emptyLabel="Semua / tidak terkait"
                    triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  >
                    {cages.map(cage => (
                      <SelectItem key={cage.id} value={cage.id}>
                        {cage.name}
                      </SelectItem>
                    ))}
                  </NullableSelect>
                </div>
                <div className="space-y-2">
                  <Label>Jenis transaksi</Label>
                  <Select
                    value={form.txnType ?? "in"}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        txnType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                      <SelectValue placeholder="Stok masuk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stok masuk</SelectItem>
                      <SelectItem value="consumption">Pemakaian</SelectItem>
                      <SelectItem value="adjustment">Penyesuaian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {field("date", "Tanggal", "date")}
                {field("notes", "Catatan")}
              </>
            ) : mode === "production" ? (
              <>
                <div className="space-y-2">
                  <Label>Tipe produksi *</Label>
                  <Select
                    value={form.productionTypeId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        productionTypeId: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                      <SelectValue placeholder="Pilih tipe produksi" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.map(lookup => (
                        <SelectItem key={lookup.id} value={lookup.id}>
                          {lookup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {field("quantity", "Jumlah *", "number")}
                <div className="space-y-2">
                  <Label>
                    Kandang <span className="text-[#b44736]">*</span>
                  </Label>
                  <NullableSelect
                    value={form.cageId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        cageId: value,
                      }))
                    }
                    emptyLabel="Pilih kandang"
                    triggerId="ops-cageId-production"
                    triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  >
                    {cages.map(cage => (
                      <SelectItem key={cage.id} value={cage.id}>
                        {cage.name}
                      </SelectItem>
                    ))}
                  </NullableSelect>
                </div>
                {field("date", "Tanggal", "date")}
                {field("notes", "Catatan")}
              </>
            ) : (
              <>
                {field("title", "Judul pemeriksaan *")}
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select
                    value={form.healthType ?? "checkup"}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        healthType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0">
                      <SelectValue placeholder="Pemeriksaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkup">Pemeriksaan</SelectItem>
                      <SelectItem value="vaccination">Vaksinasi</SelectItem>
                      <SelectItem value="illness">Sakit</SelectItem>
                      <SelectItem value="treatment">Perawatan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {field("affected", "Jumlah terdampak", "number")}
                <div className="space-y-2">
                  <Label>
                    Kandang <span className="text-[#b44736]">*</span>
                  </Label>
                  <NullableSelect
                    value={form.cageId ?? ""}
                    onValueChange={value =>
                      setForm(current => ({
                        ...current,
                        cageId: value,
                      }))
                    }
                    emptyLabel="Pilih kandang"
                    triggerId="ops-cageId-health"
                    triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                  >
                    {cages.map(cage => (
                      <SelectItem key={cage.id} value={cage.id}>
                        {cage.name}
                      </SelectItem>
                    ))}
                  </NullableSelect>
                </div>
                {field("date", "Tanggal", "date")}
                {field("description", "Deskripsi")}
              </>
            )}
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#27745b] text-white hover:bg-[#1d5c48]"
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
        title={`Hapus ${pendingDelete?.title ?? "data"}?`}
        description={`Hapus ${pendingDelete?.title ?? "data"}? Data yang dihapus tidak dapat dikembalikan.`}
        busy={deleting}
        onConfirm={() => {
          if (pendingDelete) void doRemove(pendingDelete);
        }}
      />
    </div>
  );
}
