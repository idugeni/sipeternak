-- Kunci kolom role/status di profiles dari eskalasi mandiri.
-- Diterapkan ke database via migrasi pada 2026-09-12.
CREATE OR REPLACE FUNCTION app.lock_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT app.is_admin() THEN
      RAISE EXCEPTION 'Hanya admin yang dapat mengubah role/status pengguna.';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_lock_profile_privileges ON public.profiles;

CREATE TRIGGER trg_lock_profile_privileges
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION app.lock_profile_privileges();
