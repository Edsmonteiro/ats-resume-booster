DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual LIKE '%auth.uid()%')
        OR (with_check IS NOT NULL AND with_check LIKE '%auth.uid()%')
      )
  LOOP
    new_qual := CASE WHEN r.qual IS NULL THEN NULL ELSE replace(r.qual, 'auth.uid()', '(SELECT auth.uid())') END;
    new_check := CASE WHEN r.with_check IS NULL THEN NULL ELSE replace(r.with_check, 'auth.uid()', '(SELECT auth.uid())') END;

    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, new_qual, new_check);
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', r.policyname, r.schemaname, r.tablename, new_qual);
    ELSIF new_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, new_check);
    END IF;
  END LOOP;
END $$;
