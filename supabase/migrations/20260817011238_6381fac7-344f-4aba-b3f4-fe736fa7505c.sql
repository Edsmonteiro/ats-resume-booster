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