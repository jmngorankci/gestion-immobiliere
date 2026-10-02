-- ==============================================================================
-- MODULE DE GESTION DES DOCUMENTS JUSTIFICATIFS
-- Ce script configure le stockage et la base de données pour les documents
-- ==============================================================================

-- 1. CREATION DE LA TABLE POUR LES METADONNEES DES DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents_justificatifs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nom_fichier VARCHAR(255) NOT NULL,
    type_document VARCHAR(100) NOT NULL, -- ex: piece_identite, titre_foncier, contrat_signe
    fichier_url TEXT NOT NULL,
    taille_bytes BIGINT,
    contrat_bail_id UUID REFERENCES public.contrats_bail(id) ON DELETE CASCADE,
    transaction_vente_id UUID REFERENCES public.transactions_ventes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Un document doit être rattaché soit à un bail soit à une vente
    CONSTRAINT check_document_link CHECK (
        (contrat_bail_id IS NOT NULL AND transaction_vente_id IS NULL) OR 
        (transaction_vente_id IS NOT NULL AND contrat_bail_id IS NULL)
    )
);

-- 2. ACTIVATION DE RLS SUR LA TABLE
ALTER TABLE public.documents_justificatifs ENABLE ROW LEVEL SECURITY;

-- Autoriser l'accès public/anonyme (comme le reste de l'application)
CREATE POLICY "Public access documents" ON public.documents_justificatifs FOR ALL USING (true) WITH CHECK (true);

-- 3. CONFIGURATION DU BUCKET STORAGE (À créer manuellement ou via script)
-- NOTE IMPORTANTE:
-- Les requêtes suivantes créent un bucket dans Supabase Storage.
-- Assurez-vous que l'extension 'storage' est activée ou faites-le via l'interface Supabase :
-- Storage -> New Bucket -> Nom: 'documents_contrats' -> Public: true/false.
-- 
-- Si vous l'exécutez en SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents_contrats', 'documents_contrats', true)
ON CONFLICT (id) DO NOTHING;

-- Autoriser l'upload anonyme dans le bucket
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents_contrats');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'documents_contrats');
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE USING (bucket_id = 'documents_contrats');
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents_contrats');
