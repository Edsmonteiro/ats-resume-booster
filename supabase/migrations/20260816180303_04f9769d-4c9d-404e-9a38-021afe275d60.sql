CREATE TABLE public.extensao_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  dispositivo text NOT NULL DEFAULT 'Extensão do navegador',
  ultimo_uso_em timestamp with time zone,
  revogado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extensao_tokens TO authenticated;
GRANT ALL ON public.extensao_tokens TO service_role;

ALTER TABLE public.extensao_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le os proprios tokens da extensao"
  ON public.extensao_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Cada usuario cria os proprios tokens da extensao"
  ON public.extensao_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cada usuario atualiza os proprios tokens da extensao"
  ON public.extensao_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cada usuario apaga os proprios tokens da extensao"
  ON public.extensao_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER extensao_tokens_updated_at
  BEFORE UPDATE ON public.extensao_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX extensao_tokens_user_idx ON public.extensao_tokens (user_id);