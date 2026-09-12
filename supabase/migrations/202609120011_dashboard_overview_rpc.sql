-- Agregat dashboard dalam 1 round-trip, anti-truncation limit.
-- SECURITY INVOKER: berjalan sebagai pemanggil sehingga RLS tetap berlaku.
-- Diterapkan ke database via migrasi pada 2026-09-12.
CREATE OR REPLACE FUNCTION public.dashboard_overview(
  p_today date,
  p_prod_from date,
  p_death_from date
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $fn$
SELECT jsonb_build_object(
  'population', (
    SELECT COALESCE(SUM(male_count + female_count + COALESCE(unsexed_count, 0)), 0)
    FROM public.livestock_groups
  ),
  'cages_active', (
    SELECT COUNT(*) FROM public.cages WHERE status = 'active'
  ),
  'reports_today', (
    SELECT COUNT(*)
    FROM public.daily_reports r
    JOIN public.cages c ON c.id = r.cage_id
    WHERE r.report_date = p_today AND c.status = 'active'
  ),
  'production_7d', (
    SELECT COALESCE(SUM(quantity), 0)
    FROM public.production_records
    WHERE record_date >= p_prod_from
  ),
  'feed_balance', (
    SELECT COALESCE(SUM(
      CASE WHEN txn_type = 'in' THEN quantity ELSE -quantity END
    ), 0)
    FROM public.feed_transactions
  ),
  'deaths_30d', (
    SELECT COUNT(*)
    FROM public.livestock_events
    WHERE event_type = 'death' AND event_date >= p_death_from
  ),
  'feed_by_type', (
    SELECT COALESCE(jsonb_agg(t ORDER BY t.name), '[]'::jsonb)
    FROM (
      SELECT
        ft.id,
        ft.name,
        COALESCE((
          SELECT SUM(
            CASE WHEN tr.txn_type = 'in' THEN tr.quantity ELSE -tr.quantity END
          )
          FROM public.feed_transactions tr
          WHERE tr.feed_type_id = ft.id
        ), 0) AS stock,
        ft.low_stock_threshold AS threshold
      FROM public.feed_types ft
    ) t
  )
);
$fn$;
