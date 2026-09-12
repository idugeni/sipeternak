-- Applied live as migration: best_p0_integrity_constraints (20260911201330)
-- UNIQUE + CHECK hardening. Pre-flight: no violating rows.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_types_name_key') THEN
    ALTER TABLE public.livestock_types ADD CONSTRAINT livestock_types_name_key UNIQUE (name);
  END IF;
END $$;
ALTER TABLE public.livestock_types ALTER COLUMN code SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_types_name_len') THEN
    ALTER TABLE public.livestock_types ADD CONSTRAINT livestock_types_name_len CHECK (char_length(btrim(name)) >= 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='breeds_type_name_key') THEN
    ALTER TABLE public.breeds ADD CONSTRAINT breeds_type_name_key UNIQUE (livestock_type_id, name);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='breeds_name_len') THEN
    ALTER TABLE public.breeds ADD CONSTRAINT breeds_name_len CHECK (char_length(btrim(name)) >= 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_name_key') THEN
    ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_name_key UNIQUE (name);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_unit_check') THEN
    ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_unit_check CHECK (unit IN ('kg','gram','liter','ml','karung','zak','ball','ikat'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_low_stock_check') THEN
    ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_low_stock_check CHECK (low_stock_threshold >= 0);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_types_name_len') THEN
    ALTER TABLE public.feed_types ADD CONSTRAINT feed_types_name_len CHECK (char_length(btrim(name)) >= 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_types_scoped_key') THEN
    ALTER TABLE public.production_types ADD CONSTRAINT production_types_scoped_key UNIQUE (livestock_type_id, name);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_production_types_global ON public.production_types (name) WHERE livestock_type_id IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_types_unit_check') THEN
    ALTER TABLE public.production_types ADD CONSTRAINT production_types_unit_check CHECK (unit IN ('butir','kg','gram','liter','ml','ekor','lembar','paket'));
  END IF;
END $$;

ALTER TABLE public.cages ALTER COLUMN code SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cages_name_key') THEN
    ALTER TABLE public.cages ADD CONSTRAINT cages_name_key UNIQUE (name);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cages_capacity_check') THEN
    ALTER TABLE public.cages ADD CONSTRAINT cages_capacity_check CHECK (capacity IS NULL OR capacity >= 0);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cages_name_len') THEN
    ALTER TABLE public.cages ADD CONSTRAINT cages_name_len CHECK (char_length(btrim(name)) >= 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_groups_counts_check') THEN
    ALTER TABLE public.livestock_groups ADD CONSTRAINT livestock_groups_counts_check CHECK (male_count >= 0 AND female_count >= 0 AND unsexed_count >= 0);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_groups_cage_name_key') THEN
    ALTER TABLE public.livestock_groups ADD CONSTRAINT livestock_groups_cage_name_key UNIQUE (cage_id, name);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_groups_name_len') THEN
    ALTER TABLE public.livestock_groups ADD CONSTRAINT livestock_groups_name_len CHECK (char_length(btrim(name)) >= 2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_counts_check') THEN
    ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_counts_check CHECK (male_count >= 0 AND female_count >= 0 AND unsexed_count >= 0);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_nonempty_check') THEN
    ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_nonempty_check CHECK ((male_count + female_count + unsexed_count) > 0 OR weight IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_money_check') THEN
    ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_money_check CHECK ((weight IS NULL OR weight >= 0) AND (unit_price IS NULL OR unit_price >= 0) AND (total_price IS NULL OR total_price >= 0));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_transfer_check') THEN
    ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_transfer_check CHECK (((event_type = 'transfer') AND (destination_cage_id IS NOT NULL)) OR ((event_type <> 'transfer') AND (destination_cage_id IS NULL)));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='livestock_events_sale_check') THEN
    ALTER TABLE public.livestock_events ADD CONSTRAINT livestock_events_sale_check CHECK ((event_type <> 'sale') OR (counterparty IS NOT NULL AND btrim(counterparty) <> '' AND total_price IS NOT NULL));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='feed_transactions_location_check') THEN
    ALTER TABLE public.feed_transactions ADD CONSTRAINT feed_transactions_location_check CHECK ((txn_type <> 'consumption') OR (cage_id IS NOT NULL OR group_id IS NOT NULL));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_records_location_check') THEN
    ALTER TABLE public.production_records ADD CONSTRAINT production_records_location_check CHECK (group_id IS NOT NULL OR cage_id IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='production_records_nodup') THEN
    ALTER TABLE public.production_records ADD CONSTRAINT production_records_nodup UNIQUE (group_id, production_type_id, record_date);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_affected_check') THEN
    ALTER TABLE public.health_records ADD CONSTRAINT health_records_affected_check CHECK (affected_count >= 0);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_location_check') THEN
    ALTER TABLE public.health_records ADD CONSTRAINT health_records_location_check CHECK (group_id IS NOT NULL OR cage_id IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='health_records_title_len') THEN
    ALTER TABLE public.health_records ADD CONSTRAINT health_records_title_len CHECK (char_length(btrim(title)) >= 3);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='daily_reports_nonneg_check') THEN
    ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_nonneg_check CHECK (mortality >= 0 AND (feed_used IS NULL OR feed_used >= 0) AND (production_quantity IS NULL OR production_quantity >= 0));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='daily_reports_condition_check') THEN
    ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_condition_check CHECK (condition IN ('baik','sangat baik','perlu perhatian','waspada','buruk','darurat'));
  END IF;
END $$;
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS daily_reports_cage_id_report_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_cage_group_date ON public.daily_reports (cage_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), report_date);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_fullname_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_fullname_len CHECK (char_length(btrim(full_name)) >= 3);
  END IF;
END $$;
