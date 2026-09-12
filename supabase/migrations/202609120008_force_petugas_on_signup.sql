-- Paksa role 'petugas' untuk semua akun baru (kecuali user pertama).
-- Role dari user_metadata diabaikan karena bisa dimanipulasi pendaftar.
-- Diterapkan ke database via migrasi pada 2026-09-12.
CREATE OR REPLACE FUNCTION app.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  user_count int;
  assigned_role public.user_role;
begin
  select count(*) into user_count from public.profiles;
  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := 'petugas';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), assigned_role)
  on conflict (id) do nothing;
  return new;
end;
$function$;
