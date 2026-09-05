DROP POLICY IF EXISTS uso_mensal_insert_own ON public.uso_mensal;
DROP POLICY IF EXISTS uso_mensal_update_own ON public.uso_mensal;
DROP POLICY IF EXISTS uso_mensal_delete_own ON public.uso_mensal;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.uso_mensal FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.uso_mensal FROM anon;
GRANT SELECT ON public.uso_mensal TO authenticated;
GRANT ALL ON public.uso_mensal TO service_role;

REVOKE EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) TO service_role;
