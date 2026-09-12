import { describe, expect, it } from "vitest";
import {
  daysAgoLocalIso,
  formatCount,
  formatKg,
  formatNumber,
  todayLocalIso,
} from "@/lib/format";
import { getPageMeta } from "@/lib/page-meta";

describe("format angka id-ID", () => {
  it("formatCount selalu bulat tanpa koma desimal", () => {
    expect(formatCount(178)).toBe("178");
    expect(formatCount(1234)).toBe("1.234");
    expect(formatCount(0)).toBe("0");
    // Desimal liar (artefak float / data kotor) dibulatkan, tanpa koma.
    expect(formatCount(178.5)).not.toMatch(/,/);
    expect(formatCount(35.700000000004)).not.toMatch(/,/);
  });

  it("formatKg maksimal 1 desimal dan menjinakkan artefak float", () => {
    expect(formatKg(25)).toBe("25");
    expect(formatKg(25.5)).toBe("25,5");
    expect(formatKg(35.700000000004)).toBe("35,7");
    expect(formatKg(12.345)).toBe("12,3");
  });

  it("formatNumber umum tetap tersedia", () => {
    expect(formatNumber(1234)).toBe("1.234");
  });
});

describe("tanggal lokal", () => {
  it("todayLocalIso berformat YYYY-MM-DD zona perangkat", () => {
    expect(todayLocalIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayLocalIso(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("daysAgoLocalIso mundur N hari kalender", () => {
    const today = new Date();
    const seven = new Date(today);
    seven.setDate(today.getDate() - 7);
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = `${seven.getFullYear()}-${pad(seven.getMonth() + 1)}-${pad(seven.getDate())}`;
    expect(daysAgoLocalIso(7)).toBe(expected);
  });
});

describe("template page meta", () => {
  it("memakai pemisah - untuk modul dikenal", () => {
    expect(getPageMeta("Pakan").title).toBe("Pakan - SIPETERNAK");
    expect(getPageMeta("Pakan").description).toContain("pakan");
  });

  it("fallback modul tak dikenal ikut template yang sama", () => {
    const meta = getPageMeta("Modul Misterius");
    expect(meta.title).toBe("Modul Misterius - SIPETERNAK");
    expect(meta.description).toContain("SIPETERNAK");
  });
});
