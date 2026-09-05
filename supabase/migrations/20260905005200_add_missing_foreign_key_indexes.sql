CREATE INDEX IF NOT EXISTS candidaturas_vaga_id_idx ON public.candidaturas (vaga_id);
CREATE INDEX IF NOT EXISTS cursos_user_id_idx ON public.cursos (user_id);
CREATE INDEX IF NOT EXISTS preparos_entrevista_candidatura_id_idx ON public.preparos_entrevista (candidatura_id);
CREATE INDEX IF NOT EXISTS preparos_entrevista_vaga_id_idx ON public.preparos_entrevista (vaga_id);
CREATE INDEX IF NOT EXISTS roadmap_itens_user_id_idx ON public.roadmap_itens (user_id);
CREATE INDEX IF NOT EXISTS roadmap_sessoes_item_id_idx ON public.roadmap_sessoes (item_id);
CREATE INDEX IF NOT EXISTS vagas_usuario_vaga_id_idx ON public.vagas_usuario (vaga_id);
