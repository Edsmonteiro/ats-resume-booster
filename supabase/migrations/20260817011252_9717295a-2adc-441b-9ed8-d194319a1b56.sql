REVOKE EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) TO service_role;