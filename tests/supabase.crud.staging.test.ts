import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

// Suite CRUD penuh — HANYA lawan database staging/branch, TIDAK PERNAH prod.
// Aktif bila env berikut terisi, jika tidak seluruh suite di-skip:
//   CRUD_STAGING_URL, CRUD_STAGING_KEY,
//   CRUD_PETUGAS_EMAIL, CRUD_PETUGAS_PASSWORD,
//   CRUD_ADMIN_EMAIL, CRUD_ADMIN_PASSWORD
// Alur: petugas buat laporan → verifikasi baca → negatif (hapus/ubah/eskalasi
// ditolak) → admin verifikasi → admin hapus (cleanup) → verifikasi hilang.

const enabled =
  process.env.RUN_CRUD_STAGING === "true" &&
  !!process.env.CRUD_STAGING_URL &&
  !!process.env.CRUD_STAGING_KEY &&
  !!process.env.CRUD_PETUGAS_EMAIL &&
  !!process.env.CRUD_ADMIN_EMAIL;

const MARKER = `E2E-CRUD-${Date.now()}`;
const TEST_DATE = "2020-01-02"; // tanggal lampau: tidak mengotori hitungan hari ini

async function signIn(email: string, password: string) {
  const client = createClient(
    process.env.CRUD_STAGING_URL as string,
    process.env.CRUD_STAGING_KEY as string
  );
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) throw new Error(`Login gagal: ${email}`);
  return client;
}

describe.skipIf(!enabled)("CRUD staging end-to-end", () => {
  let reportId: string | null = null;
  let cageId = "";

  afterAll(async () => {
    // Jaring pengaman: hapus sisa baris uji bila ada yang tertinggal.
    if (!reportId) return;
    const admin = await signIn(
      process.env.CRUD_ADMIN_EMAIL as string,
      process.env.CRUD_ADMIN_PASSWORD as string
    );
    await admin.from("daily_reports").delete().eq("id", reportId);
    await admin.auth.signOut();
  });

  it("petugas membaca kandang aktif", async () => {
    const pet = await signIn(
      process.env.CRUD_PETUGAS_EMAIL as string,
      process.env.CRUD_PETUGAS_PASSWORD as string
    );
    const { data, error } = await pet
      .from("cages")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    await pet.auth.signOut();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    cageId = data?.id as string;
  }, 15_000);

  it("petugas membuat laporan (CREATE + READ)", async () => {
    const pet = await signIn(
      process.env.CRUD_PETUGAS_EMAIL as string,
      process.env.CRUD_PETUGAS_PASSWORD as string
    );
    const { data, error } = await pet
      .from("daily_reports")
      .insert({
        cage_id: cageId,
        report_date: TEST_DATE,
        condition: "Baik",
        mortality: 0,
        production_quantity: 1,
        notes: MARKER,
      })
      .select("id,status")
      .maybeSingle();
    await pet.auth.signOut();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    expect(data?.status).toBe("submitted");
    reportId = data?.id as string;
  }, 15_000);

  it("petugas ditolak hapus, ubah pakan, dan eskalasi role", async () => {
    const pet = await signIn(
      process.env.CRUD_PETUGAS_EMAIL as string,
      process.env.CRUD_PETUGAS_PASSWORD as string
    );
    const { data: me } = await pet.auth.getUser();
    const del = await pet.from("daily_reports").delete().eq("id", reportId);
    expect(del.error).not.toBeNull();
    const { data: oneFeed } = await pet
      .from("feed_transactions")
      .select("id")
      .limit(1)
      .maybeSingle();
    const feed = await pet
      .from("feed_transactions")
      .update({ notes: MARKER })
      .eq("id", oneFeed?.id ?? "00000000-0000-0000-0000-000000000000");
    expect(feed.error).not.toBeNull();
    const esc = await pet
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", me.user?.id ?? "");
    expect(esc.error).not.toBeNull();
    await pet.auth.signOut();
  }, 15_000);

  it("duplikat laporan kandang+tanggal ditolak constraint", async () => {
    const pet = await signIn(
      process.env.CRUD_PETUGAS_EMAIL as string,
      process.env.CRUD_PETUGAS_PASSWORD as string
    );
    const { error } = await pet.from("daily_reports").insert({
      cage_id: cageId,
      report_date: TEST_DATE,
      condition: "Baik",
      mortality: 0,
      notes: MARKER,
    });
    await pet.auth.signOut();
    expect(error).not.toBeNull();
  }, 15_000);

  it("admin verifikasi lalu hapus (UPDATE + DELETE + cleanup)", async () => {
    const admin = await signIn(
      process.env.CRUD_ADMIN_EMAIL as string,
      process.env.CRUD_ADMIN_PASSWORD as string
    );
    const upd = await admin
      .from("daily_reports")
      .update({ status: "verified" })
      .eq("id", reportId as string);
    expect(upd.error).toBeNull();
    const { data: checked } = await admin
      .from("daily_reports")
      .select("status")
      .eq("id", reportId as string)
      .maybeSingle();
    expect(checked?.status).toBe("verified");
    const del = await admin
      .from("daily_reports")
      .delete()
      .eq("id", reportId as string);
    expect(del.error).toBeNull();
    const { data: gone } = await admin
      .from("daily_reports")
      .select("id")
      .eq("id", reportId as string)
      .maybeSingle();
    expect(gone).toBeNull();
    reportId = null;
    await admin.auth.signOut();
  }, 15_000);
});
