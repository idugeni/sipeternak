-- Applied live as migration: best_p2_views_triggers_rls (20260911201454)
-- Backfills + triggers + views + RLS hardening + composite indexes.
UPDATE public.production_records pr SET unit_snapshot = pt.unit FROM public.production_types pt WHERE pr.unit_snapshot IS NULL AND pr.production_type_id = pt.id;
UPDATE public.feed_transactions SET total_price = quantity * unit_price WHERE total_price IS NULL AND unit_price IS NOT NULL;
UPDATE public.livestock_events SET total_price = (male_count + female_count + unsexed_count) * unit_price WHERE total_price IS NULL AND unit_price IS NOT NULL AND (male_count + female_count + unsexed_count) > 0;

CREATE OR REPLACE FUNCTION app.sync_group_cage_on_transfer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$ BEGIN IF NEW.event_type = 'transfer' AND NEW.destination_cage_id IS NOT NULL THEN UPDATE public.livestock_groups SET cage_id = NEW.destination_cage_id, updated_at = now() WHERE id = NEW.group_id; END IF; RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS trg_sync_group_cage ON public.livestock_events;
CREATE TRIGGER trg_sync_group_cage AFTER INSERT OR UPDATE OF event_type, destination_cage_id ON public.livestock_events FOR EACH ROW EXECUTE FUNCTION app.sync_group_cage_on_transfer();

CREATE OR REPLACE FUNCTION app.stamp_group_ended() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$ BEGIN IF NEW.status = 'closed' AND OLD.status <> 'closed' AND NEW.ended_at IS NULL THEN NEW.ended_at := CURRENT_DATE; END IF; IF NEW.status = 'active' AND OLD.status = 'closed' THEN NEW.ended_at := NULL; END IF; RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS trg_stamp_group_ended ON public.livestock_groups;
CREATE TRIGGER trg_stamp_group_ended BEFORE UPDATE OF status ON public.livestock_groups FOR EACH ROW EXECUTE FUNCTION app.stamp_group_ended();

CREATE OR REPLACE FUNCTION app.fill_unit_snapshot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$ BEGIN IF NEW.unit_snapshot IS NULL THEN SELECT unit INTO NEW.unit_snapshot FROM public.production_types WHERE id = NEW.production_type_id; END IF; RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS trg_fill_unit_snapshot ON public.production_records;
CREATE TRIGGER trg_fill_unit_snapshot BEFORE INSERT OR UPDATE OF production_type_id ON public.production_records FOR EACH ROW EXECUTE FUNCTION app.fill_unit_snapshot();

CREATE OR REPLACE FUNCTION app.fill_total_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$ BEGIN IF NEW.total_price IS NULL AND NEW.unit_price IS NOT NULL THEN IF TG_TABLE_NAME = 'feed_transactions' THEN NEW.total_price := NEW.quantity * NEW.unit_price; ELSIF TG_TABLE_NAME = 'livestock_events' THEN NEW.total_price := (NEW.male_count + NEW.female_count + NEW.unsexed_count) * NEW.unit_price; END IF; END IF; RETURN NEW; END; $fn$;
DROP TRIGGER IF EXISTS trg_fill_total_feed ON public.feed_transactions;
CREATE TRIGGER trg_fill_total_feed BEFORE INSERT OR UPDATE OF quantity, unit_price ON public.feed_transactions FOR EACH ROW EXECUTE FUNCTION app.fill_total_price();
DROP TRIGGER IF EXISTS trg_fill_total_event ON public.livestock_events;
CREATE TRIGGER trg_fill_total_event BEFORE INSERT OR UPDATE OF male_count, female_count, unsexed_count, unit_price ON public.livestock_events FOR EACH ROW EXECUTE FUNCTION app.fill_total_price();

DROP POLICY IF EXISTS audit_insert ON public.audit_log;
CREATE POLICY audit_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (((SELECT app.is_active_user()) AND (actor_id IS NULL OR actor_id = (SELECT auth.uid()))));
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING ((SELECT app.is_active_user()));

CREATE INDEX IF NOT EXISTS idx_feed_txn_feed_date ON public.feed_transactions (feed_type_id, txn_date DESC);
CREATE INDEX IF NOT EXISTS idx_prod_group_date ON public.production_records (group_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON public.livestock_events (group_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_group_date ON public.health_records (group_id, record_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_cage_date_desc ON public.daily_reports (cage_id, report_date DESC);

DROP VIEW IF EXISTS public.v_feed_stock;
CREATE VIEW public.v_feed_stock AS SELECT ft.feed_type_id, f.name AS feed_name, f.unit, f.low_stock_threshold, SUM(CASE WHEN ft.txn_type='in' THEN ft.quantity WHEN ft.txn_type='consumption' THEN -ft.quantity ELSE ft.quantity END) AS stock, SUM(CASE WHEN ft.txn_type='in' THEN COALESCE(ft.total_price,0) ELSE 0 END) AS total_in_value FROM public.feed_transactions ft JOIN public.feed_types f ON f.id = ft.feed_type_id GROUP BY 1,2,3,4;
DROP VIEW IF EXISTS public.v_cage_population;
CREATE VIEW public.v_cage_population AS SELECT c.id AS cage_id, c.code AS cage_code, c.name AS cage_name, c.status AS cage_status, COUNT(g.id) AS groups_count, COALESCE(SUM(g.male_count),0) AS male, COALESCE(SUM(g.female_count),0) AS female, COALESCE(SUM(g.unsexed_count),0) AS unsexed, COALESCE(SUM(g.male_count+g.female_count+g.unsexed_count),0) AS total FROM public.cages c LEFT JOIN public.livestock_groups g ON g.cage_id = c.id AND g.status='active' GROUP BY 1,2,3,4;
DROP VIEW IF EXISTS public.v_production_daily;
CREATE VIEW public.v_production_daily AS SELECT record_date, production_type_id, COALESCE(SUM(quantity),0) AS total_qty, COUNT(*) AS records FROM public.production_records GROUP BY 1,2;
DROP VIEW IF EXISTS public.v_health_open;
CREATE VIEW public.v_health_open AS SELECT * FROM public.health_records WHERE status IN ('open','in_treatment','monitoring');
