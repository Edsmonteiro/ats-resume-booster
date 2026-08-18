CREATE TABLE public.roadmap_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habilidade text NOT NULL,
  nivel text NOT NULL DEFAULT 'base',
  porque text NOT NULL DEFAULT '',
  como_comprovar text NOT NULL DEFAULT '',
  esforco text NOT NULL DEFAULT '',
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'a_fazer',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_itens TO authenticated;
GRANT ALL ON public.roadmap_itens TO service_role;
ALTER TABLE public.roadmap_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le os proprios itens do roadmap" ON public.roadmap_itens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria os proprios itens do roadmap" ON public.roadmap_itens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza os proprios itens do roadmap" ON public.roadmap_itens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga os proprios itens do roadmap" ON public.roadmap_itens FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER roadmap_itens_set_updated_at BEFORE UPDATE ON public.roadmap_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cursos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  instituicao text NOT NULL DEFAULT '',
  carga_horaria text NOT NULL DEFAULT '',
  concluido_em text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  aprendizados text NOT NULL DEFAULT '',
  aplicado_em_curriculo boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cursos TO authenticated;
GRANT ALL ON public.cursos TO service_role;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le os proprios cursos" ON public.cursos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria os proprios cursos" ON public.cursos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza os proprios cursos" ON public.cursos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga os proprios cursos" ON public.cursos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER cursos_set_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();