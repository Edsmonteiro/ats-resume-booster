ALTER TABLE public.preferencias_busca
  ADD COLUMN IF NOT EXISTS alerta_frequencia text NOT NULL DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS ultimo_alerta_em timestamp with time zone;

ALTER TABLE public.preferencias_busca
  ADD CONSTRAINT preferencias_busca_alerta_frequencia_check
  CHECK (alerta_frequencia IN ('nenhum','diario','semanal'));

ALTER TABLE public.vagas_usuario
  ADD COLUMN IF NOT EXISTS recomendacoes jsonb;

CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'radar',
  lida boolean NOT NULL DEFAULT false,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le as proprias notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Cada usuario cria as proprias notificacoes"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cada usuario atualiza as proprias notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cada usuario apaga as proprias notificacoes"
  ON public.notificacoes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX notificacoes_user_id_created_at_idx ON public.notificacoes (user_id, created_at DESC);

CREATE TRIGGER notificacoes_updated_at
  BEFORE UPDATE ON public.notificacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();