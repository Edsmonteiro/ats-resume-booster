# Banco de dados — migrations SQL

## `supabase/migrations/20260803174100_7b1e9cf4-7b6f-4d5c-940f-92a5dfc10203.sql`

```sql
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
```

## `supabase/migrations/20260803182202_a84e8dd7-cf15-42c5-96bc-9ea03c1016b0.sql`

```sql
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
```

## `supabase/migrations/20260805161333_794ca71c-ca16-413f-ac15-5f040db6ec3c.sql`

```sql
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
```

## `supabase/migrations/20260805163338_4c7665e5-8616-4400-9ae2-6a769661bae0.sql`

```sql
DROP TABLE IF EXISTS public.assinaturas;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario le a propria assinatura"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;
```

## `supabase/migrations/20260805163356_8001f03d-e0c3-4bd1-bf02-d28f4e89fe53.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;
```

## `supabase/migrations/20260805170342_a5952c8c-6c55-48ce-ba6d-6bdc0a5a3f20.sql`

```sql
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
```

## `supabase/migrations/20260805170840_4a6a1aaf-189a-4be5-8c0d-a44a44cc0793.sql`

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## `supabase/migrations/20260805183041_9a585eda-6ec8-4390-99d2-735265da71f2.sql`

```sql
ALTER TABLE public.preferencias_busca ADD COLUMN IF NOT EXISTS janela_dias integer NOT NULL DEFAULT 30;
ALTER TABLE public.vagas_usuario ADD COLUMN IF NOT EXISTS motivo_remocao text;
ALTER TABLE public.vagas_usuario ADD COLUMN IF NOT EXISTS removida_em timestamptz;
CREATE INDEX IF NOT EXISTS vagas_usuario_status_idx ON public.vagas_usuario (user_id, status);
```

## `supabase/migrations/20260805185310_5325a004-0f59-452f-b345-c7da67d9823c.sql`

```sql
ALTER TABLE public.vagas_usuario ADD COLUMN IF NOT EXISTS aberta_em timestamptz;
```

## `supabase/migrations/20260805185934_38b38f23-77b1-4b8e-9626-606d6e092b36.sql`

```sql
UPDATE public.vagas_usuario vu
SET status = 'nova', motivo_remocao = NULL, removida_em = NULL
FROM public.vagas_encontradas ve
WHERE ve.id = vu.vaga_id
  AND vu.status = 'baixa'
  AND vu.compatibilidade >= 40
  AND lower(ve.titulo) LIKE '%analista%'
  AND lower(ve.titulo) LIKE '%dados%';
```

## `supabase/migrations/20260814165033_83022da6-aa0c-43d0-be2d-3a3439cfcb82.sql`

```sql
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
```

## `supabase/migrations/20260814181822_44edc61d-b41c-44c2-87cb-aefa808cfd0e.sql`

```sql
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.subscriptions FROM anon, authenticated;
REVOKE SELECT ON public.subscriptions FROM anon;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
```

## `supabase/migrations/20260814213219_b1a2fbaf-62ab-46e4-acac-e5cb9741d377.sql`

```sql
ALTER TABLE public.preferencias_busca ADD COLUMN IF NOT EXISTS contratos text[] NOT NULL DEFAULT '{}'::text[];
```

## `supabase/migrations/20260816180303_04f9769d-4c9d-404e-9a38-021afe275d60.sql`

```sql
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
```

## `supabase/migrations/20260816183320_94ac48c7-c080-4cc9-937d-830f1d23a234.sql`

```sql
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
```

## `supabase/migrations/20260816233338_1cfb25ae-0265-45a8-a1ff-e864a2dcba87.sql`

```sql
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
```

## `supabase/migrations/20260816234329_2184b885-a99b-4c18-9896-310e9c13251a.sql`

```sql
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
```

## `supabase/migrations/20260817011238_6381fac7-344f-4aba-b3f4-fe736fa7505c.sql`

```sql
CREATE TABLE public.uso_mensal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recurso text NOT NULL,
  competencia text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, recurso, competencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uso_mensal TO authenticated;
GRANT ALL ON public.uso_mensal TO service_role;

ALTER TABLE public.uso_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uso_mensal_select_own" ON public.uso_mensal FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "uso_mensal_insert_own" ON public.uso_mensal FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uso_mensal_update_own" ON public.uso_mensal FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uso_mensal_delete_own" ON public.uso_mensal FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER uso_mensal_updated_at BEFORE UPDATE ON public.uso_mensal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.consumir_cota(_user_id uuid, _recurso text, _limite integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _comp text := to_char(now(), 'YYYY-MM');
  _qtd integer;
BEGIN
  INSERT INTO public.uso_mensal (user_id, recurso, competencia, quantidade)
  VALUES (_user_id, _recurso, _comp, 1)
  ON CONFLICT (user_id, recurso, competencia)
  DO UPDATE SET quantidade = public.uso_mensal.quantidade + 1, updated_at = now()
  RETURNING quantidade INTO _qtd;

  IF _qtd > _limite THEN
    UPDATE public.uso_mensal SET quantidade = _limite + 1
      WHERE user_id = _user_id AND recurso = _recurso AND competencia = _comp;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
```

## `supabase/migrations/20260817011252_9717295a-2adc-441b-9ed8-d194319a1b56.sql`

```sql
REVOKE EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota(uuid, text, integer) TO service_role;
```
