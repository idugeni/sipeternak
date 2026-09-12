-- Applied live as migration: best_p4_views_security_invoker (20260911202645)
-- Views run with querying user's RLS (fixes ERROR lint 0010_security_definer_view).
ALTER VIEW public.v_feed_stock SET (security_invoker = true);
ALTER VIEW public.v_cage_population SET (security_invoker = true);
ALTER VIEW public.v_production_daily SET (security_invoker = true);
ALTER VIEW public.v_health_open SET (security_invoker = true);
