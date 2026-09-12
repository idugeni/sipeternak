import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PawPrint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { formatCount, todayLocalIso } from "@/lib/format";
import type { DailyCage } from "@/features/shared/types";
export function DailyReportPanel({
  open,
  onOpenChange,
  cage,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cage: DailyCage;
  onSaved: () => void;
}) {
  const [condition, setCondition] = useState("baik");
  const [male, setMale] = useState("");
  const [female, setFemale] = useState(String(cage.population));
  const [feedUsed, setFeedUsed] = useState("");
  const [feedType, setFeedType] = useState("Konsentrat Layer");
  const [feedTypeOptions, setFeedTypeOptions] = useState<string[]>([
    "Konsentrat Layer",
  ]);
  const [production, setProduction] = useState("");
  const [mortality, setMortality] = useState("0");
  const [deathReason, setDeathReason] = useState("Sakit");
  const [weather, setWeather] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const resetForCage = (population: number, feedNames: string[]) => {
    setCondition("baik");
    setMale("");
    setFemale(String(population));
    setFeedUsed("");
    setFeedType(current =>
      feedNames.includes(current)
        ? current
        : (feedNames[0] ?? "Konsentrat Layer")
    );
    setProduction("");
    setMortality("0");
    setDeathReason("Sakit");
    setWeather("");
    setNotes("");
  };
  useEffect(() => {
    if (!open || !supabase) return;
    let cancelled = false;
    const cageId = cage.id;
    const population = cage.population;
    void (async () => {
      const [{ data: feedRows }, { data }] = await Promise.all([
        supabase
          .from("feed_types")
          .select("id,name")
          .eq("is_active", true)
          .order("name")
          .limit(100),
        cageId
          ? supabase
              .from("daily_reports")
              .select(
                "condition,population_note,feed_used,feed_type_id,mortality,mortality_cause,production_quantity,weather,notes"
              )
              .eq("cage_id", cageId)
              .eq("report_date", todayLocalIso())
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      const feeds = ((feedRows ?? []).filter(item => item.name) ?? []) as {
        id: string;
        name: string;
      }[];
      const feedNames = feeds.map(item => item.name);
      if (feedNames.length) setFeedTypeOptions(feedNames);
      // Terapkan semua nilai form sekaligus agar tidak berkedip bertahap.
      if (!data) {
        resetForCage(population, feedNames);
        return;
      }
      let pop: { male?: number; female?: number } = {};
      try {
        pop = JSON.parse(
          (data as { population_note?: string }).population_note ?? "{}"
        );
      } catch {
        pop = {};
      }
      const feedName = data.feed_type_id
        ? (feeds.find(feed => feed.id === data.feed_type_id)?.name ?? null)
        : null;
      if (cancelled) return;
      setCondition(
        typeof data.condition === "string" && data.condition
          ? data.condition
          : "baik"
      );
      setMale(String(pop.male ?? ""));
      setFemale(String(pop.female ?? population));
      setFeedUsed(data.feed_used == null ? "" : String(data.feed_used));
      setFeedType(
        feedName && feedNames.includes(feedName)
          ? feedName
          : (feedNames[0] ?? "Konsentrat Layer")
      );
      setProduction(
        data.production_quantity == null ? "" : String(data.production_quantity)
      );
      setMortality(String(data.mortality ?? 0));
      setDeathReason(
        typeof (data as { mortality_cause?: unknown }).mortality_cause ===
          "string" && (data as { mortality_cause: string }).mortality_cause
          ? (data as { mortality_cause: string }).mortality_cause
          : "Sakit"
      );
      setWeather(typeof data.weather === "string" ? data.weather : "");
      setNotes(typeof data.notes === "string" ? data.notes : "");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cage.id]);
  useEffect(() => {
    // Kunci scroll body selama panel terbuka.
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !condition ||
      Number(male) < 0 ||
      Number(female) < 0 ||
      Number(feedUsed) < 0 ||
      Number(mortality) < 0 ||
      Number(production) < 0
    ) {
      toast.error("Periksa kembali nilai laporan.");
      return;
    }
    if (
      ![male, female, mortality, production].every(value =>
        Number.isInteger(Number(value))
      )
    ) {
      toast.error("Jumlah ekor dan butir harus bilangan bulat.");
      return;
    }
    setSaving(true);
    try {
      if (!supabase || !cage.id) throw new Error("Data kandang belum lengkap.");
      const { data: userData } = await supabase.auth.getUser();
      const [{ data: feedTypeRecord }, { data: productionType }] =
        await Promise.all([
          supabase
            .from("feed_types")
            .select("id")
            .eq("name", feedType)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("production_types")
            .select("id")
            .eq("name", "Telur")
            .limit(1)
            .maybeSingle(),
        ]);
      const { data: existing } = await supabase
        .from("daily_reports")
        .select("id,status")
        .eq("cage_id", cage.id)
        .eq("report_date", todayLocalIso())
        .limit(1)
        .maybeSingle();
      if (existing?.status === "approved") {
        toast.error(
          `${cage.name} sudah terverifikasi dan dikunci. Hubungi Admin untuk koreksi.`
        );
        return;
      }
      const payload = {
        cage_id: cage.id,
        report_date: todayLocalIso(),
        condition,
        population_note: JSON.stringify({
          male: Number(male),
          female: Number(female),
          total: totalPopulation,
        }),
        feed_used: Number(feedUsed),
        feed_type_id: feedTypeRecord?.id ?? null,
        mortality: Number(mortality),
        mortality_cause: deathReason || null,
        production_quantity: Number(production),
        production_type_id: productionType?.id ?? null,
        notes: notes || null,
        weather: weather || null,
        created_by: userData.user?.id ?? null,
      };
      // Satu kandang satu laporan per hari: koreksi menimpa yang belum terverifikasi.
      const { error } = existing
        ? await supabase
            .from("daily_reports")
            .update(payload)
            .eq("id", existing.id)
        : await supabase.from("daily_reports").insert(payload);
      if (error) throw error;
      await logActivity({
        action: existing ? "update" : "insert",
        entity: "Laporan Harian",
        summary: `${cage.name} · ${production} butir · mortalitas ${mortality} ekor`,
      });
      toast.success(
        existing
          ? `Laporan ${cage.name} berhasil diperbarui.`
          : `Laporan ${cage.name} berhasil disimpan.`
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Laporan belum dapat disimpan."
      );
    } finally {
      setSaving(false);
    }
  };
  const totalPopulation = Number(male || 0) + Number(female || 0);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Tutup panel laporan"
        className="absolute inset-0 bg-[#17231f]/55 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <aside className="relative flex h-full w-full max-w-[650px] flex-col bg-white shadow-[-18px_0_45px_rgba(20,39,31,0.18)]">
        <div className="flex items-start justify-between border-b border-[#e5e8e5] px-6 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.035em] text-[#171c19]">
              Laporan Harian Kandang
            </h2>
            <p className="mt-1 text-sm text-[#5a6d63]">
              Isi data hasil monitoring kondisi kandang hari ini
            </p>
          </div>
          <button
            aria-label="Tutup"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-[#343b37] transition-colors hover:bg-[#f1f4f1]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-4 border-b border-[#eef0ee] px-6 py-5 sm:px-7">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#8a6410] text-white">
            <PawPrint className="h-8 w-8" />
          </span>
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#161b18]">
              {cage.name}
            </h3>
            <p className="mt-1 text-lg text-[#5a6d63]">
              {cage.type === "chicken"
                ? "Ayam Petelur"
                : cage.type === "goat"
                  ? "Kambing"
                  : cage.type === "cattle"
                    ? "Sapi"
                    : "Puyuh"}{" "}
              · {formatCount(cage.population)} ekor
            </p>
          </div>
        </div>
        <form
          onSubmit={save}
          className="flex-1 overflow-y-auto px-6 py-5 sm:px-7"
        >
          <ReportSectionTitle title="Kondisi dan Populasi" />
          <div className="grid grid-cols-1 gap-4 border-b border-[#eef0ee] pb-5 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr]">
            <div className="space-y-2">
              <Label htmlFor="condition-panel">
                Kondisi Kandang <span className="text-[#c94937]">*</span>
              </Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger
                  id="condition-panel"
                  className="h-12 w-full border-[#55a486] bg-[#f8fcfa] text-sm text-[#29332d] focus-visible:border-[#55a486] focus-visible:bg-[#eef4ef] focus-visible:ring-0"
                >
                  <SelectValue placeholder="Baik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baik">Baik</SelectItem>
                  <SelectItem value="sangat baik">Sangat baik</SelectItem>
                  <SelectItem value="perlu perhatian">
                    Perlu perhatian
                  </SelectItem>
                  <SelectItem value="waspada">Waspada</SelectItem>
                  <SelectItem value="buruk">Buruk</SelectItem>
                  <SelectItem value="darurat">Darurat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ReportNumberField
              id="male-panel"
              label="Jantan (ekor)"
              value={male}
              onChange={setMale}
            />
            <ReportNumberField
              id="female-panel"
              label="Betina (ekor)"
              value={female}
              onChange={setFemale}
            />
            <div className="space-y-2">
              <Label htmlFor="weather-panel">Cuaca</Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger
                  id="weather-panel"
                  className="h-12 w-full border-[#dbe2dc] bg-white text-sm text-[#29332d] focus-visible:border-[#dbe2dc] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                >
                  <SelectValue placeholder="Pilih cuaca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cerah">Cerah</SelectItem>
                  <SelectItem value="Berawan">Berawan</SelectItem>
                  <SelectItem value="Hujan">Hujan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="-mt-4 mb-5 text-right text-xs text-[#5a6d63]">
            Total populasi terpantau:{" "}
            <span className="font-semibold text-[#28775b]">
              {formatCount(totalPopulation)} ekor
            </span>
          </p>
          <ReportSectionTitle title="Pakan" />
          <div className="grid grid-cols-1 gap-4 border-b border-[#eef0ee] pb-5 sm:grid-cols-[1fr_1.35fr]">
            <div className="space-y-2">
              <Label htmlFor="feed-panel">
                Jumlah Pakan Diberikan <span className="text-[#c94937]">*</span>
              </Label>
              <div className="flex">
                <Input
                  id="feed-panel"
                  type="number"
                  min="0"
                  step="0.1"
                  value={feedUsed}
                  onChange={event => setFeedUsed(event.target.value)}
                  className="h-12 rounded-r-none focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                />
                <span className="flex h-12 items-center rounded-r-md border border-l-0 border-[#dbe2dc] bg-[#f6f8f6] px-4 text-sm text-[#69736c]">
                  kg
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feed-type-panel">
                Jenis Pakan <span className="text-[#c94937]">*</span>
              </Label>
              <Select value={feedType} onValueChange={setFeedType}>
                <SelectTrigger
                  id="feed-type-panel"
                  className="h-12 w-full border-[#dbe2dc] bg-white text-sm text-[#29332d] focus-visible:border-[#dbe2dc] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                >
                  <SelectValue placeholder="Pilih jenis pakan" />
                </SelectTrigger>
                <SelectContent>
                  {feedTypeOptions.map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ReportSectionTitle title="Produksi dan Kematian" />
          <div className="grid grid-cols-1 gap-4 border-b border-[#eef0ee] pb-5 sm:grid-cols-[1fr_0.75fr_1.25fr]">
            <div className="space-y-2">
              <Label htmlFor="production-panel">
                Telur Terkumpul <span className="text-[#c94937]">*</span>
              </Label>
              <div className="flex">
                <Input
                  id="production-panel"
                  type="number"
                  min="0"
                  step="1"
                  value={production}
                  onChange={event => setProduction(event.target.value)}
                  className="h-12 rounded-r-none focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                />
                <span className="flex h-12 items-center rounded-r-md border border-l-0 border-[#dbe2dc] bg-[#f6f8f6] px-4 text-sm text-[#69736c]">
                  butir
                </span>
              </div>
            </div>
            <ReportNumberField
              id="mortality-panel"
              label="Kematian (ekor)"
              value={mortality}
              onChange={setMortality}
            />
            <div className="space-y-2">
              <Label htmlFor="death-reason-panel">
                Sebab Kematian <span className="text-[#c94937]">*</span>
              </Label>
              <Select value={deathReason} onValueChange={setDeathReason}>
                <SelectTrigger
                  id="death-reason-panel"
                  className="h-12 w-full border-[#dbe2dc] bg-white text-sm text-[#29332d] focus-visible:border-[#dbe2dc] focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
                >
                  <SelectValue placeholder="Sakit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Usia">Usia</SelectItem>
                  <SelectItem value="Kecelakaan">Kecelakaan</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ReportSectionTitle title="Catatan Tambahan" />
          <div className="space-y-2">
            <Label htmlFor="notes-panel">Catatan</Label>
            <Textarea
              id="notes-panel"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Tambahkan catatan kondisi kandang hari ini..."
              maxLength={500}
              className="min-h-[120px] resize-none focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
            />
            <p className="text-right text-xs text-[#5a6d63]">
              {notes.length}/500
            </p>
          </div>
        </form>
        <div className="flex min-w-0 flex-col gap-3 border-t border-[#e5e8e5] bg-white px-6 py-5 sm:flex-row sm:px-7">
          <Button
            type="button"
            variant="outline"
            className="h-13 flex-1 border-[#ccd5ce] text-base font-semibold text-[#1e3229]"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={event => {
              const form = event.currentTarget.parentElement
                ?.previousElementSibling as HTMLFormElement | null;
              form?.requestSubmit();
            }}
            className="h-13 flex-1 bg-[#27745b] text-base font-semibold text-white hover:bg-[#1d5c48]"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            {saving ? "Menyimpan..." : "Simpan Laporan"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
export function ReportSectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 mt-1 flex items-center gap-3">
      <h4 className="shrink-0 text-base font-bold text-[#161b18]">{title}</h4>
      <div className="h-px flex-1 bg-[#e2e6e2]" />
    </div>
  );
}
export function ReportNumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} <span className="text-[#c94937]">*</span>
      </Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-12 focus-visible:border-input focus-visible:bg-[#f4f8f4] focus-visible:ring-0"
      />
    </div>
  );
}
