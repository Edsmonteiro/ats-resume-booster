ALTER TABLE public.analises_publicas
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.analises_publicas
  ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS analises_publicas_user_id_idx
  ON public.analises_publicas (user_id);

-- Public links remain readable by their random UUID, but creation/deletion stays server-only.
DROP POLICY IF EXISTS "Qualquer pessoa le analises compartilhadas" ON public.analises_publicas;
CREATE POLICY "Qualquer pessoa le analises compartilhadas"
  ON public.analises_publicas FOR SELECT
  TO anon, authenticated
  USING (true);
