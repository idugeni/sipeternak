-- Applied live as migration: best_p1_missing_columns (20260911201436)
-- Missing columns + new table + FK hardening (RESTRICT for history safety).
-- Note: audit_log had legacy actions 'CREATE'/'UPDATE'; normalized to lowercase before CHECK.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.breeds ADD COLUMN IF NOT EXISTS code text;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='breeds_code_key') THEN ALTER TABLE public.breeds ADD CONSTRAINT breeds_code_key UNIQUE (code); END IF; END $$;

ALTER TABLE public.feed_types ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.feed_types ADD COLUMN IF NOT EXISTS price_per_unit numeric(14,2) NOT NULL DEFAULT 0;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_price_check') THEN ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_price_check CHECK (price_per_unit >= 0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_sku_key') THEN ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_sku_key UNIQUE (sku); END IF; END $$;

ALTER TABLE public.production_types ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.cages ADD COLUMN IF NOT EXISTS length_m numeric(8,2);
ALTER TABLE public.cages ADD COLUMN IF NOT EXISTS width_m numeric(8,2);
ALTER TABLE public.cages ADD COLUMN IF NOT EXISTS photo_url text;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cages_dims_check') THEN ALTER TABLE public.cages ADD CONSTRAINT cages_dims_check CHECK ((length_m IS NULL OR length_m >= 0) AND (width_m IS NULL OR width_m >= 0)); END IF; END $$;

ALTER TABLE public.livestock_groups ADD COLUMN IF NOT EXISTS ended_at date;
ALTER TABLE public.livestock_groups ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.livestock_groups ADD COLUMN IF NOT EXISTS birth_batch text;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_groups_dates_check') THEN ALTER TABLE public.livestock_groups ADD CONSTRAINT livestock_groups_dates_check CHECK (ended_at IS NULL OR ended_at >= started_at); END IF; END $$;

ALTER TABLE public.feed_transactions ADD COLUMN IF NOT EXISTS unit_price numeric(14,2);
ALTER TABLE public.feed_transactions ADD COLUMN IF NOT EXISTS total_price numeric(16,2);
ALTER TABLE public.feed_transactions ADD COLUMN IF NOT EXISTS supplier text;
ALTER TABLE public.feed_transactions ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE public.feed_transactions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_transactions_price_check') THEN ALTER TABLE public.feed_transactions ADD CONSTRAINT feed_transactions_price_check CHECK ((unit_price IS NULL OR unit_price >= 0) AND (total_price IS NULL OR total_price >= 0)); END IF; END $$;
DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.feed_transactions;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.feed_transactions FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS quality_grade text;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS weight_kg numeric(12,2);
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS unit_snapshot text;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_records_grade_check') THEN ALTER TABLE public.production_records ADD CONSTRAINT production_records_grade_check CHECK (quality_grade IS NULL OR quality_grade IN ('A','B','C','BS','reject')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_records_weight_check') THEN ALTER TABLE public.production_records ADD CONSTRAINT production_records_weight_check CHECK (weight_kg IS NULL OR weight_kg >= 0); END IF; END $$;
DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.production_records;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.production_records FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS severity text;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS veterinarian text;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS dosage text;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS cost numeric(14,2);
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS follow_up_date date;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS resolved_at date;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_severity_check') THEN ALTER TABLE public.health_records ADD CONSTRAINT health_records_severity_check CHECK (severity IS NULL OR severity IN ('ringan','sedang','berat','kritis')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_status_check') THEN ALTER TABLE public.health_records ADD CONSTRAINT health_records_status_check CHECK (status IN ('open','in_treatment','resolved','monitoring')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_cost_check') THEN ALTER TABLE public.health_records ADD CONSTRAINT health_records_cost_check CHECK (cost IS NULL OR cost >= 0); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_dates_check') THEN ALTER TABLE public.health_records ADD CONSTRAINT health_records_dates_check CHECK ((follow_up_date IS NULL OR follow_up_date >= record_date) AND (resolved_at IS NULL OR resolved_at >= record_date)); END IF; END $$;
DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.health_records;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.health_records FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

ALTER TABLE public.livestock_events ADD COLUMN IF NOT EXISTS weight_unit text NOT NULL DEFAULT 'kg';
ALTER TABLE public.livestock_events ADD COLUMN IF NOT EXISTS invoice_no text;
ALTER TABLE public.livestock_events ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.livestock_events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_weight_unit_check') THEN ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_weight_unit_check CHECK (weight_unit IN ('kg','gram','ekor')); END IF; END $$;
DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.livestock_events;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.livestock_events FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.daily_reports ADD COLUMN IF NOT EXISTS weather text;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='daily_reports_status_check') THEN ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_status_check CHECK (status IN ('draft','submitted','approved')); END IF; END $$;
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON public.daily_reports (status);
CREATE INDEX IF NOT EXISTS idx_daily_reports_reviewed_by ON public.daily_reports (reviewed_by);

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_agent text;
UPDATE public.audit_log SET action = CASE WHEN action='CREATE' THEN 'insert' WHEN action='UPDATE' THEN 'update' ELSE lower(action) END WHERE action IN ('CREATE','UPDATE');
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='audit_log_action_check') THEN ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_action_check CHECK (action IN ('insert','update','delete','login','logout','approve','export','import','create','other')); END IF; END $$;

ALTER TABLE public.breeds DROP CONSTRAINT IF EXISTS breeds_livestock_type_id_fkey;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='breeds_livestock_type_id_fkey') THEN ALTER TABLE public.breeds ADD CONSTRAINT breeds_livestock_type_id_fkey FOREIGN KEY (livestock_type_id) REFERENCES public.livestock_types(id) ON DELETE RESTRICT; END IF; END $$;
ALTER TABLE public.livestock_events DROP CONSTRAINT IF EXISTS livestock_events_group_id_fkey;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_group_id_fkey') THEN ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.livestock_groups(id) ON DELETE RESTRICT; END IF; END $$;

CREATE TABLE IF NOT EXISTS public.livestock_individuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.livestock_groups(id) ON DELETE CASCADE,
  eartag text NOT NULL,
  sex text NOT NULL CHECK (sex IN ('male','female','unsexed')),
  birth_date date,
  weight numeric(12,2) CHECK (weight IS NULL OR weight >= 0),
  status text NOT NULL DEFAULT 'alive' CHECK (status IN ('alive','sick','dead','sold','transferred')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, eartag)
);
ALTER TABLE public.livestock_individuals ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.livestock_individuals;
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON public.livestock_individuals FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();
CREATE INDEX IF NOT EXISTS idx_individuals_group ON public.livestock_individuals (group_id);
CREATE INDEX IF NOT EXISTS idx_individuals_status ON public.livestock_individuals (status);
DROP POLICY IF EXISTS individuals_select ON public.livestock_individuals;
CREATE POLICY individuals_select ON public.livestock_individuals FOR SELECT TO authenticated USING ((SELECT app.is_active_user()));
DROP POLICY IF EXISTS individuals_ins ON public.livestock_individuals;
CREATE POLICY individuals_ins ON public.livestock_individuals FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_active_user()));
DROP POLICY IF EXISTS individuals_upd ON public.livestock_individuals;
CREATE POLICY individuals_upd ON public.livestock_individuals FOR UPDATE TO authenticated USING ((SELECT app.is_active_user())) WITH CHECK ((SELECT app.is_active_user()));
DROP POLICY IF EXISTS individuals_del ON public.livestock_individuals;
CREATE POLICY individuals_del ON public.livestock_individuals FOR DELETE TO authenticated USING ((SELECT app.is_admin()));
