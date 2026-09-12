import { describe, expect, it } from "vitest";
import {
  buildPopulationSeries,
  buildWeeklyProduction,
  filterRowsByDate,
  formatShortDate,
  startOfWeekMonday,
} from "@/features/dashboard/dashboardMetrics";

describe("dashboard metrics", () => {
  const rows = [
    {
      report_date: "2026-08-13",
      population_note: JSON.stringify({ total: 100 }),
      production_quantity: 10,
    },
    {
      report_date: "2026-08-14",
      population_note: JSON.stringify({ total: 105 }),
      production_quantity: 11,
    },
    {
      report_date: "2026-08-20",
      population_note: JSON.stringify({ total: 108 }),
      production_quantity: 12,
    },
    {
      report_date: "2026-09-11",
      population_note: JSON.stringify({ total: 120 }),
      production_quantity: 14,
    },
  ];

  it("filters reports inclusively by date range", () => {
    expect(filterRowsByDate(rows, "2026-08-14", "2026-08-20")).toHaveLength(2);
    expect(filterRowsByDate(rows, "2026-08-21", "2026-09-10")).toHaveLength(0);
  });

  it("builds a sorted population series from report notes", () => {
    expect(buildPopulationSeries(rows)).toEqual([
      ["2026-08-13", 100],
      ["2026-08-14", 105],
      ["2026-08-20", 108],
      ["2026-09-11", 120],
    ]);
  });

  it("aggregates production into four calendar weeks (Mon-Sun)", () => {
    const monday = startOfWeekMonday();
    const iso = (ts: number) => new Date(ts).toISOString().slice(0, 10);
    const weekly = [
      { report_date: iso(monday - 21 * 86400000), production_quantity: 10 },
      { report_date: iso(monday - 13 * 86400000), production_quantity: 11 },
      { report_date: iso(monday - 6 * 86400000), production_quantity: 12 },
      { report_date: iso(monday), production_quantity: 14 },
      { report_date: iso(monday - 60 * 86400000), production_quantity: 999 },
    ];
    const result = buildWeeklyProduction(weekly);
    expect(result.map(bar => bar.value)).toEqual([10, 11, 12, 14]);
    expect(result).toHaveLength(4);
    expect(result[0].label).toBe(formatShortDate(iso(monday - 21 * 86400000)));
  });
});
