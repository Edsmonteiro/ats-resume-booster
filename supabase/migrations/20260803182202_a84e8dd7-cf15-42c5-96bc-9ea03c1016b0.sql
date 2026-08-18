CREATE TABLE public.analises_publicas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  score integer NOT NULL,
  score_antes integer,
  resumo text NOT NULL DEFAULT '',
  cargo_desejado text NOT NULL DEFAULT '',
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.analises_publicas TO anon;
GRANT SELECT ON public.analises_publicas TO authenticated;
GRANT ALL ON public.analises_publicas TO service_role;

ALTER TABLE public.analises_publicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa le analises compartilhadas"
  ON public.analises_publicas FOR SELECT
  TO anon, authenticated
  USING (true);