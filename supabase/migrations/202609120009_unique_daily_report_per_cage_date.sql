-- Satu kandang satu laporan per tanggal. Mencegah kelengkapan >100%
-- akibat insert ganda. Diterapkan ke database via migrasi pada 2026-09-12.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_reports_cage_date_unique'
  ) THEN
    ALTER TABLE public.daily_reports
      ADD CONSTRAINT daily_reports_cage_date_unique UNIQUE (cage_id, report_date);
  END IF;
END $$;
