import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NullableSelect } from "@/components/ui/nullable-select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AppRole, CageRecord } from "@/features/shared/types";
export function CageDialog({
  open,
  onOpenChange,
  role,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AppRole;
  editing: CageRecord | null;
  onSaved: () => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "maintenance">(
    "active"
  );
  const [notes, setNotes] = useState("");
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCode(editing?.code ?? "");
    setName(editing?.name ?? "");
    setTypeId(editing?.livestockTypeId ?? "");
    setLocation(editing?.location ?? "");
    setCapacity(editing?.capacity ? String(editing.capacity) : "");
    setStatus(
      editing?.status === "Nonaktif"
        ? "inactive"
        : editing?.status === "Pemeliharaan"
          ? "maintenance"
          : "active"
    );
    setNotes(editing?.notes ?? "");
    if (supabase)
      void supabase
        .from("livestock_types")
        .select("id,name")
        .eq("is_active", true)
        .order("name")
        .limit(100)
        .then(({ data }) =>
          setTypes((data ?? []) as { id: string; name: string }[])
        );
  }, [open, editing]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kandang wajib diisi.");
      return;
    }
    if (!code.trim()) {
      toast.error("Kode kandang wajib diisi (sudah NOT NULL + UNIQUE).");
      return;
    }
    if (role !== "admin") {
      toast.error("Hanya Admin yang dapat mengubah master kandang.");
      return;
    }
    setSaving(true);
    try {
      if (!supabase) throw new Error("Layanan data belum terhubung.");
      const payload = {
        code: code.trim(),
        name: name.trim(),
        livestock_type_id: typeId || null,
        location: location.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        status,
        notes: notes.trim() || null,
      };
      const result = editing
        ? await supabase.from("cages").update(payload).eq("id", editing.id)
        : await supabase.from("cages").insert(payload);
      if (result.error) throw result.error;
      await logActivity({
        action: editing ? "update" : "insert",
        entity: "Kandang",
        entityId: editing?.id ?? null,
        summary: `${payload.code} — ${payload.name}`,
      });
      toast.success(
        editing ? "Data kandang diperbarui." : "Kandang baru ditambahkan."
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Data kandang belum dapat disimpan."
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kandang" : "Tambah Kandang"}
            </DialogTitle>
            <DialogDescription>
              Kelola identitas, status, dan kapasitas kandang.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="cage-code">Kode kandang</Label>
              <Input
                id="cage-code"
                value={code}
                onChange={event => setCode(event.target.value)}
                placeholder="K-01"
                className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cage-name">Nama kandang *</Label>
              <Input
                id="cage-name"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Kandang Ayam Petelur A"
                className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cage-type">Jenis ternak</Label>
              <NullableSelect
                value={typeId}
                onValueChange={setTypeId}
                emptyLabel="Belum dipilih"
                triggerId="cage-type"
                triggerClassName="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              >
                {types.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </NullableSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cage-status">Status</Label>
              <Select
                value={status}
                onValueChange={value =>
                  setStatus(value as "active" | "inactive" | "maintenance")
                }
              >
                <SelectTrigger
                  id="cage-status"
                  className="h-10 w-full border-[#dfe5e1] bg-white text-sm focus-visible:border-[#dfe5e1] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                >
                  <SelectValue placeholder="Aktif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cage-location">Lokasi</Label>
              <Input
                id="cage-location"
                value={location}
                onChange={event => setLocation(event.target.value)}
                placeholder="Blok A"
                className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cage-capacity">Kapasitas</Label>
              <Input
                id="cage-capacity"
                type="number"
                min="0"
                value={capacity}
                onChange={event => setCapacity(event.target.value)}
                placeholder="500"
                className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cage-notes">Catatan</Label>
              <Textarea
                id="cage-notes"
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Catatan operasional kandang"
                className="focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              {editing && role === "admin" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mr-auto text-[#b44736] hover:text-[#8f1d17]"
                  disabled={saving || deleting}
                  onClick={() => setConfirmingDelete(true)}
                >
                  Hapus
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#27745b] text-white hover:bg-[#1d5c48]"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editing ? "Simpan Perubahan" : "Tambah Kandang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Hapus ${editing?.name ?? "kandang"}?`}
        description="Kandang yang memiliki kelompok, laporan, atau transaksi terkait tidak dapat dihapus. Data yang dihapus tidak dapat dikembalikan."
        busy={deleting}
        onConfirm={() => void doRemove()}
      />
    </>
  );
  async function doRemove() {
    if (!editing || !supabase) return;
    if (role !== "admin") {
      toast.error("Hanya Admin yang dapat menghapus kandang.");
      return;
    }
    if (deleting) return;
    setDeleting(true);
    try {
      // Tolak hapus kandang yang masih punya jejak operasional.
      const linked = await Promise.all([
        supabase
          .from("livestock_groups")
          .select("id", { count: "exact", head: true })
          .eq("cage_id", editing.id),
        supabase
          .from("daily_reports")
          .select("id", { count: "exact", head: true })
          .eq("cage_id", editing.id),
        supabase
          .from("feed_transactions")
          .select("id", { count: "exact", head: true })
          .eq("cage_id", editing.id),
        supabase
          .from("production_records")
          .select("id", { count: "exact", head: true })
          .eq("cage_id", editing.id),
        supabase
          .from("health_records")
          .select("id", { count: "exact", head: true })
          .eq("cage_id", editing.id),
      ]);
      const linkedCount = linked.reduce(
        (sum, res) => sum + (res.count ?? 0),
        0
      );
      if (linkedCount > 0) {
        toast.error(
          `Kandang memiliki ${linkedCount} data terkait — ubah Status menjadi Nonaktif sebagai gantinya.`
        );
        return;
      }
      const { error } = await supabase
        .from("cages")
        .delete()
        .eq("id", editing.id);
      if (error) throw error;
      await logActivity({
        action: "delete",
        entity: "Kandang",
        entityId: editing.id,
        summary: `${editing.code} — ${editing.name}`,
      });
      toast.success("Kandang berhasil dihapus.");
      setConfirmingDelete(false);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Kandang belum dapat dihapus."
      );
    } finally {
      setDeleting(false);
    }
  }
}
