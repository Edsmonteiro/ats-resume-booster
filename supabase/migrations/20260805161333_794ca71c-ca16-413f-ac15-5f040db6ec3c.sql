-- PREFERENCIAS DE BUSCA
CREATE TABLE public.preferencias_busca (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cargos text[] NOT NULL DEFAULT '{}',
  senioridade text NOT NULL DEFAULT 'qualquer',
  cidade text NOT NULL DEFAULT '',
  estado text NOT NULL DEFAULT '',
  modelos text[] NOT NULL DEFAULT '{}',
  salario_minimo integer,
  palavras_evitar text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferencias_busca TO authenticated;
GRANT ALL ON public.preferencias_busca TO service_role;
ALTER TABLE public.preferencias_busca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cada usuario le as proprias preferencias" ON public.preferencias_busca FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria as proprias preferencias" ON public.preferencias_busca FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza as proprias preferencias" ON public.preferencias_busca FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga as proprias preferencias" ON public.preferencias_busca FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER preferencias_busca_updated_at BEFORE UPDATE ON public.preferencias_busca FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CATALOGO DE VAGAS
CREATE TABLE public.vagas_encontradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  titulo text NOT NULL,
  empresa text NOT NULL DEFAULT '',
  local text NOT NULL DEFAULT '',
  modelo text NOT NULL DEFAULT '',
  salario text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  link text NOT NULL,
  fonte text NOT NULL,
  publicada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vagas_encontradas TO authenticated;
GRANT ALL ON public.vagas_encontradas TO service_role;
ALTER TABLE public.vagas_encontradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados leem o catalogo de vagas" ON public.vagas_encontradas FOR SELECT TO authenticated USING (true);
CREATE TRIGGER vagas_encontradas_updated_at BEFORE UPDATE ON public.vagas_encontradas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX vagas_encontradas_created_at_idx ON public.vagas_encontradas (created_at DESC);

-- VAGAS DO USUARIO (RADAR)
CREATE TABLE public.vagas_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaga_id uuid NOT NULL REFERENCES public.vagas_encontradas(id) ON DELETE CASCADE,
  compatibilidade integer NOT NULL DEFAULT 0,
  motivo text NOT NULL DEFAULT '',
  lacunas jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'nova',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vaga_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas_usuario TO authenticated;
GRANT ALL ON public.vagas_usuario TO service_role;
ALTER TABLE public.vagas_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cada usuario le as proprias vagas do radar" ON public.vagas_usuario FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Cada usuario cria as proprias vagas do radar" ON public.vagas_usuario FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario atualiza as proprias vagas do radar" ON public.vagas_usuario FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cada usuario apaga as proprias vagas do radar" ON public.vagas_usuario FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER vagas_usuario_updated_at BEFORE UPDATE ON public.vagas_usuario FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX vagas_usuario_feed_idx ON public.vagas_usuario (user_id, compatibilidade DESC);

-- ASSINATURAS
CREATE TABLE public.assinaturas (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plano text NOT NULL DEFAULT 'mensal',
  status text NOT NULL DEFAULT 'inativa',
  periodo_fim timestamptz,
  provedor text NOT NULL DEFAULT '',
  provedor_customer_id text,
  provedor_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cada usuario le a propria assinatura" ON public.assinaturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER assinaturas_updated_at BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();