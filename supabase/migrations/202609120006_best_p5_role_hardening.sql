-- Applied live as migration: best_p5_role_hardening (20260911203004)
-- Keuangan & mutasi: UPDATE hanya admin.
DROP POLICY IF EXISTS feed_transactions_upd ON public.feed_transactions;
CREATE POLICY feed_transactions_upd ON public.feed_transactions FOR UPDATE TO authenticated USING ((SELECT app.is_admin())) WITH CHECK ((SELECT app.is_admin()));
DROP POLICY IF EXISTS livestock_events_upd ON public.livestock_events;
CREATE POLICY livestock_events_upd ON public.livestock_events FOR UPDATE TO authenticated USING ((SELECT app.is_admin())) WITH CHECK ((SELECT app.is_admin()));
-- Produksi, kesehatan, harian: UPDATE admin ATAU pemilik data.
DROP POLICY IF EXISTS production_records_upd ON public.production_records;
CREATE POLICY production_records_upd ON public.production_records FOR UPDATE TO authenticated USING (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid()))))) WITH CHECK (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid())))));
DROP POLICY IF EXISTS health_records_upd ON public.health_records;
CREATE POLICY health_records_upd ON public.health_records FOR UPDATE TO authenticated USING (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid()))))) WITH CHECK (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid())))));
DROP POLICY IF EXISTS daily_reports_upd ON public.daily_reports;
CREATE POLICY daily_reports_upd ON public.daily_reports FOR UPDATE TO authenticated USING (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid()))))) WITH CHECK (((SELECT app.is_admin()) OR ((SELECT app.is_active_user()) AND (created_by = (SELECT auth.uid())))));
-- Individu ternak: tulis hanya admin (konsisten dengan livestock_groups).
DROP POLICY IF EXISTS individuals_ins ON public.livestock_individuals;
CREATE POLICY individuals_ins ON public.livestock_individuals FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_admin()));
DROP POLICY IF EXISTS individuals_upd ON public.livestock_individuals;
CREATE POLICY individuals_upd ON public.livestock_individuals FOR UPDATE TO authenticated USING ((SELECT app.is_admin())) WITH CHECK ((SELECT app.is_admin()));
