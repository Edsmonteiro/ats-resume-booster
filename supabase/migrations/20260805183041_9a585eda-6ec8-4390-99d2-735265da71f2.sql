ALTER TABLE public.preferencias_busca ADD COLUMN IF NOT EXISTS janela_dias integer NOT NULL DEFAULT 30;
ALTER TABLE public.vagas_usuario ADD COLUMN IF NOT EXISTS motivo_remocao text;
ALTER TABLE public.vagas_usuario ADD COLUMN IF NOT EXISTS removida_em timestamptz;
CREATE INDEX IF NOT EXISTS vagas_usuario_status_idx ON public.vagas_usuario (user_id, status);