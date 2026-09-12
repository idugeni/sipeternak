-- Hanya admin yang boleh mengubah status/verifikasi laporan harian.
-- Mencegah petugas memverifikasi laporannya sendiri (RLS update
-- membolehkan pemilik ubah barisnya). Diterapkan pada 2026-09-12.
CREATE OR REPLACE FUNCTION app.lock_report_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
    OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    IF NOT app.is_admin() THEN
      RAISE EXCEPTION 'Hanya admin yang dapat memverifikasi laporan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_lock_report_review ON public.daily_reports;

CREATE TRIGGER trg_lock_report_review
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION app.lock_report_review();
