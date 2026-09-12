-- Applied live as 3 migrations (20260911202021 / 20260911202032 / 20260911202259):
-- best_p3_index_cleanup: drop redundant leftmost-covered indexes.
DROP INDEX IF EXISTS public.idx_breeds_type; -- covered by breeds_type_name_key(livestock_type_id, name)
DROP INDEX IF EXISTS public.idx_daily_cage; -- covered by idx_daily_cage_date_desc + uniq_daily_cage_group_date
DROP INDEX IF EXISTS public.idx_feed_txn_feed; -- covered by idx_feed_txn_feed_date(feed_type_id, txn_date DESC)
DROP INDEX IF EXISTS public.idx_health_records_group; -- covered by idx_health_group_date(group_id, record_date DESC)
DROP INDEX IF EXISTS public.idx_events_group; -- covered by idx_events_group_date(group_id, event_date DESC)
DROP INDEX IF EXISTS public.idx_production_records_group; -- covered by idx_prod_group_date(group_id, record_date DESC)
DROP INDEX IF EXISTS public.idx_groups_cage; -- covered by livestock_groups_cage_name_key(cage_id, name)
CREATE INDEX IF NOT EXISTS idx_daily_group_date ON public.daily_reports (group_id, report_date DESC);

-- best_p3b_drop_daily_group_single: idx_daily_group_date makes single-col redundant.
DROP INDEX IF EXISTS public.idx_daily_reports_group; -- covered by idx_daily_group_date(group_id, report_date DESC)

-- best_p3c_index_fk_app_settings: cover app_settings_updated_by_fkey (fixes unindexed_foreign_keys lint).
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by ON public.app_settings (updated_by);
