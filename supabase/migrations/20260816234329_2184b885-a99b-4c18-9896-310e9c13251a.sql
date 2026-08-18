ALTER TABLE public.roadmap_itens
  ADD COLUMN IF NOT EXISTS horas_estimadas numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_feitas numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS concluido_em timestamptz;

CREATE TABLE IF NOT EXISTS public.roadmap_ritmo (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  horas_dia numeric NOT NULL DEFAULT 1,
  dias_semana integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_ritmo TO authenticated;
GRANT ALL ON public.roadmap_ritmo TO service_role;
ALTER TABLE public.roadmap_ritmo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le o proprio ritmo" ON public.roadmap_ritmo
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria o proprio ritmo" ON public.roadmap_ritmo
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza o proprio ritmo" ON public.roadmap_ritmo
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga o proprio ritmo" ON public.roadmap_ritmo
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER roadmap_ritmo_set_updated_at BEFORE UPDATE ON public.roadmap_ritmo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.roadmap_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.roadmap_itens(id) ON DELETE CASCADE,
  horas numeric NOT NULL DEFAULT 0,
  dia date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_sessoes_user_dia_idx ON public.roadmap_sessoes (user_id, dia);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_sessoes TO authenticated;
GRANT ALL ON public.roadmap_sessoes TO service_role;
ALTER TABLE public.roadmap_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le as proprias sessoes" ON public.roadmap_sessoes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria as proprias sessoes" ON public.roadmap_sessoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza as proprias sessoes" ON public.roadmap_sessoes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga as proprias sessoes" ON public.roadmap_sessoes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);