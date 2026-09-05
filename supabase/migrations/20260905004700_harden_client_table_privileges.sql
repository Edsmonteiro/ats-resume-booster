-- Anonymous clients only need access to intentionally public shared analyses.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.analises_publicas TO anon;

-- End-user clients never need schema-level/destructive table capabilities.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Preserve the intended authenticated read paths on server-owned tables.
GRANT SELECT ON public.analises_publicas TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.vagas_encontradas TO authenticated;
GRANT SELECT ON public.assinaturas TO authenticated;
GRANT SELECT ON public.uso_mensal TO authenticated;
