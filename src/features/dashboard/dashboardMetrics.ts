export type DashboardRow = {
  report_date: string;
  population_note?: string | null;
  production_quantity?: number | null;
};

export function filterRowsByDate(
  rows: DashboardRow[],
  fromDate: string,
  toDate: string
) {
  return rows.filter(
    row => row.report_date >= fromDate && row.report_date <= toDate
  );
}

export function buildPopulationSeries(rows: DashboardRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!row.population_note) continue;
    try {
      const parsed = JSON.parse(row.population_note) as { total?: number };
      if (typeof parsed.total !== "number") continue;
      totals.set(
        row.report_date,
        (totals.get(row.report_date) ?? 0) + parsed.total
      );
    } catch {
      // Ignore malformed legacy notes instead of breaking the dashboard.
    }
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30);
}

export function startOfWeekMonday(now = new Date()) {
  const day = (now.getUTCDay() + 6) % 7; // Senin = 0
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - day
  );
}

export function buildWeeklyProduction(rows: DashboardRow[], weeks = 4) {
  // Bucket minggu kalender (Senin–Minggu), 4 minggu terakhir termasuk
  // minggu berjalan yang bisa parsial. Tidak lagi bergantung pada
  // population_note maupun tanggal data pertama.
  const thisMonday = startOfWeekMonday();
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const start = thisMonday - (weeks - 1 - index) * 7 * 86400000;
    return {
      label: formatShortDate(new Date(start).toISOString().slice(0, 10)),
      start,
      end: start + 7 * 86400000,
      value: 0,
    };
  });
  for (const row of rows) {
    const timestamp = new Date(`${row.report_date}T00:00:00Z`).getTime();
    if (!Number.isFinite(timestamp)) continue;
    const index = buckets.findIndex(
      bucket => timestamp >= bucket.start && timestamp < bucket.end
    );
    if (index < 0 || !Number.isFinite(row.production_quantity)) continue;
    buckets[index].value += Number(row.production_quantity);
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00Z`));
}
