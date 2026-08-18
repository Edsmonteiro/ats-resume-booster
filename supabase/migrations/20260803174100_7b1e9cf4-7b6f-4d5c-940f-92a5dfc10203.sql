CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  cargo_desejado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le o proprio perfil" ON public.perfis
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Cada usuario cria o proprio perfil" ON public.perfis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Cada usuario atualiza o proprio perfil" ON public.perfis
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Cada usuario apaga o proprio perfil" ON public.perfis
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER perfis_updated_at BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.dados_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculo TEXT NOT NULL DEFAULT '',
  analise JSONB,
  historico JSONB NOT NULL DEFAULT '[]'::jsonb,
  vagas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dados_usuario TO authenticated;
GRANT ALL ON public.dados_usuario TO service_role;
ALTER TABLE public.dados_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le os proprios dados" ON public.dados_usuario
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria os proprios dados" ON public.dados_usuario
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza os proprios dados" ON public.dados_usuario
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga os proprios dados" ON public.dados_usuario
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER dados_usuario_updated_at BEFORE UPDATE ON public.dados_usuario
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();