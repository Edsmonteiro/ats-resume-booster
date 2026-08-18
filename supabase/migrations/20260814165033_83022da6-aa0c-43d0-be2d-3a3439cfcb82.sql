CREATE TABLE public.candidaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas_encontradas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  empresa text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  fonte text NOT NULL DEFAULT '',
  local text NOT NULL DEFAULT '',
  compatibilidade integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'interessado',
  notas text NOT NULL DEFAULT '',
  requisitos text NOT NULL DEFAULT '',
  enviada_em timestamp with time zone,
  proximo_passo_em timestamp with time zone,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidaturas TO authenticated;
GRANT ALL ON public.candidaturas TO service_role;

ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le as proprias candidaturas" ON public.candidaturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria as proprias candidaturas" ON public.candidaturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza as proprias candidaturas" ON public.candidaturas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga as proprias candidaturas" ON public.candidaturas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER candidaturas_updated_at BEFORE UPDATE ON public.candidaturas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX candidaturas_user_status_idx ON public.candidaturas (user_id, status);

CREATE TABLE public.preparos_entrevista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas_encontradas(id) ON DELETE SET NULL,
  candidatura_id uuid REFERENCES public.candidaturas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  empresa text NOT NULL DEFAULT '',
  roteiro jsonb NOT NULL DEFAULT '{}'::jsonb,
  respostas jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preparos_entrevista TO authenticated;
GRANT ALL ON public.preparos_entrevista TO service_role;

ALTER TABLE public.preparos_entrevista ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le os proprios preparos" ON public.preparos_entrevista FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria os proprios preparos" ON public.preparos_entrevista FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza os proprios preparos" ON public.preparos_entrevista FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga os proprios preparos" ON public.preparos_entrevista FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER preparos_entrevista_updated_at BEFORE UPDATE ON public.preparos_entrevista FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX preparos_entrevista_user_idx ON public.preparos_entrevista (user_id);