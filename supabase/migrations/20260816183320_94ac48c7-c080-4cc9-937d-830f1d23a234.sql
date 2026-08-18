CREATE TABLE public.conquistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  situacao TEXT NOT NULL DEFAULT '',
  tarefa TEXT NOT NULL DEFAULT '',
  acao TEXT NOT NULL DEFAULT '',
  resultado TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conquistas TO authenticated;
GRANT ALL ON public.conquistas TO service_role;

ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le as proprias conquistas" ON public.conquistas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria as proprias conquistas" ON public.conquistas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza as proprias conquistas" ON public.conquistas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga as proprias conquistas" ON public.conquistas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER conquistas_set_updated_at BEFORE UPDATE ON public.conquistas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX conquistas_user_idx ON public.conquistas (user_id, created_at DESC);