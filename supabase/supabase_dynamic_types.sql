-- ==============================================================================
-- MIGRATION: TYPES DE BIENS DYNAMIQUES
-- ==============================================================================

-- 1. Création de la table de paramétrage
CREATE TABLE IF NOT EXISTS public.types_biens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation RLS
ALTER TABLE public.types_biens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access types biens" ON public.types_biens FOR ALL USING (true) WITH CHECK (true);

-- 2. Insertion des valeurs par défaut
INSERT INTO public.types_biens (nom) 
VALUES 
    ('Studio'),
    ('2 Pièces'),
    ('3 Pièces'),
    ('Maison Basse'),
    ('Villa'),
    ('Appartement')
ON CONFLICT (nom) DO NOTHING;

-- 3. Modification de la table biens pour utiliser un VARCHAR au lieu de l'ENUM
-- Cela permet de stocker directement le nom du type (ex: "Terrain", "Studio")
ALTER TABLE public.biens 
  ALTER COLUMN type_bien TYPE VARCHAR(255) USING type_bien::text;

-- Optionnel: Supprimer l'ancien type ENUM (si plus utilisé ailleurs)
-- DROP TYPE IF EXISTS property_type;
