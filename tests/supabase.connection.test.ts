import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it("blocks anonymous access to the protected livestock types endpoint", async () => {
    // docs/DATABASE_STANDARDS.md: anon has zero direct GRANTs, all policies are
    // TO authenticated. Publishable key alone (anon role, no JWT) must be
    // denied — this proves the endpoint is protected, not open.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const response = await fetch(
      `${url}/rest/v1/livestock_types?select=id&limit=1`,
      {
        headers: {
          apikey: key as string,
          Authorization: `Bearer ${key}`,
        },
      }
    );

    expect(response.ok).toBe(false);
    expect([401, 403]).toContain(response.status);
    const payload = await response.json();
    expect(payload.code).toBe("42501");
  }, 15_000);
});
