import { describe, expect, it } from "vitest";

describe("Supabase operational data contracts", () => {
  it("blocks anonymous access to all operational and master tables", async () => {
    // docs/DATABASE_STANDARDS.md: anon has zero GRANTs, policies TO authenticated.
    // Every table must reject the publishable key without a user JWT.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(key).toBeTruthy();

    const tables = [
      "livestock_groups",
      "feed_transactions",
      "production_records",
      "health_records",
      "livestock_types",
      "feed_types",
      "production_types",
    ];
    const responses = await Promise.all(
      tables.map(table =>
        fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
        })
      )
    );

    expect(responses.every(response => !response.ok)).toBe(true);
    expect(
      responses.every(response => [401, 403].includes(response.status))
    ).toBe(true);
    const payloads = await Promise.all(
      responses.map(response => response.json())
    );
    expect(payloads.every(payload => payload.code === "42501")).toBe(true);
  }, 15_000);
});
