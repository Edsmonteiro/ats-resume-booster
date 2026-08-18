UPDATE public.vagas_usuario vu
SET status = 'nova', motivo_remocao = NULL, removida_em = NULL
FROM public.vagas_encontradas ve
WHERE ve.id = vu.vaga_id
  AND vu.status = 'baixa'
  AND vu.compatibilidade >= 40
  AND lower(ve.titulo) LIKE '%analista%'
  AND lower(ve.titulo) LIKE '%dados%';