-- Server-owned tables: clients only receive the minimum read privileges they need.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM anon, authenticated;
REVOKE SELECT ON public.subscriptions FROM anon;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.vagas_encontradas FROM anon, authenticated;
REVOKE SELECT ON public.vagas_encontradas FROM anon;
GRANT SELECT ON public.vagas_encontradas TO authenticated;
GRANT ALL ON public.vagas_encontradas TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.analises_publicas FROM anon, authenticated;
GRANT SELECT ON public.analises_publicas TO anon, authenticated;
GRANT ALL ON public.analises_publicas TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.assinaturas FROM anon, authenticated;
REVOKE SELECT ON public.assinaturas FROM anon;
GRANT SELECT ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
