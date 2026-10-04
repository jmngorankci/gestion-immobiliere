-- ==============================================================================
-- CORRECTION RLS : MODULE DE GESTION DES VENTES
-- ==============================================================================
-- L'application n'utilise pas l'authentification native Supabase pour l'instant,
-- il faut donc autoriser l'accès public (anonyme) aux nouvelles tables pour que 
-- les enregistrements fonctionnent correctement, comme pour les autres tables.

-- 1. Correction RLS pour "acquereurs"
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent gérer les acquéreurs" ON public.acquereurs;
CREATE POLICY "Public access acquereurs" ON public.acquereurs FOR ALL USING (true) WITH CHECK (true);

-- 2. Correction RLS pour "notaires"
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent gérer les notaires" ON public.notaires;
CREATE POLICY "Public access notaires" ON public.notaires FOR ALL USING (true) WITH CHECK (true);

-- 3. Correction RLS pour "transactions_ventes"
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent gérer les transactions" ON public.transactions_ventes;
CREATE POLICY "Public access transactions_ventes" ON public.transactions_ventes FOR ALL USING (true) WITH CHECK (true);
