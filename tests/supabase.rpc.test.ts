import { describe, expect, it } from "vitest";

describe("dashboard_overview RPC", () => {
  it("denies anonymous callers (no table grants, RLS enforced)", async () => {
    // Tanpa JWT: peran anon tidak punya GRANT ke tabel operasional,
    // sehingga agregat wajib ditolak — bukan angka bocor.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/rest/v1/rpc/dashboard_overview`, {
      method: "POST",
      headers: {
        apikey: key as string,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_today: "2026-09-12",
        p_prod_from: "2026-09-05",
        p_death_from: "2026-08-13",
      }),
    });

    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
    const payload = await response.json();
    expect(payload.code).toBe("42501");
  }, 15_000);
});
