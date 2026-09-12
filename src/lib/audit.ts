import { supabase } from "@/lib/supabase";

export type AuditAction = "insert" | "update" | "delete";

// Pencatatan tidak pernah melempar error agar tidak menggagalkan aksi
// utama jika insert audit ditolak RLS/jaringan. Mengembalikan promise
// agar pemanggil bisa await sebelum refresh — entri terbaru dijamin
// sudah commit saat daftar aktivitas dimuat ulang.
export function logActivity(input: {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  summary: string;
}): Promise<void> {
  return (async () => {
    try {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const actorName =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Pengguna";
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        actor_name: actorName,
        action: input.action,
        entity: input.entity,
        entity_id: input.entityId ?? null,
        summary: input.summary,
      });
    } catch {
      // Abaikan — audit adalah pelengkap, bukan penentu keberhasilan.
    }
  })();
}
