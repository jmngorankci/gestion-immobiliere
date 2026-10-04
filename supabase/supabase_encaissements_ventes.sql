-- ==============================================================================
-- SCRIPT SQL : ENCAISSEMENTS DES VENTES & TAUX DE COMMISSION
-- À exécuter dans l'éditeur SQL de Supabase
-- ==============================================================================

-- 1. Ajout de la colonne taux_commission à la table transactions_ventes si absente
ALTER TABLE public.transactions_ventes 
ADD COLUMN IF NOT EXISTS taux_commission numeric DEFAULT 0;

-- 2. Création de la table des encaissements de ventes
CREATE TABLE IF NOT EXISTS public.encaissements_ventes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_vente_id uuid NOT NULL REFERENCES public.transactions_ventes(id) ON DELETE CASCADE,
    montant numeric NOT NULL CHECK (montant > 0),
    date_encaissement date DEFAULT CURRENT_DATE NOT NULL,
    type_encaissement varchar(50) DEFAULT 'acompte_compromis' NOT NULL,
    mode_paiement varchar(50) DEFAULT 'virement' NOT NULL,
    reference_paiement varchar(255),
    numero_recu varchar(100),
    statut varchar(50) DEFAULT 'en_attente' NOT NULL, -- 'en_attente', 'valide', 'rejete'
    encaisse_par varchar(255),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table existait déjà, ajout de la colonne statut
ALTER TABLE public.encaissements_ventes 
ADD COLUMN IF NOT EXISTS statut varchar(50) DEFAULT 'en_attente' NOT NULL;

-- Index pour accélérer les requêtes par transaction
CREATE INDEX IF NOT EXISTS idx_encaissements_ventes_tx 
ON public.encaissements_ventes(transaction_vente_id);

-- Activation RLS
ALTER TABLE public.encaissements_ventes ENABLE ROW LEVEL SECURITY;

-- Politique d'accès pour utilisateurs authentifiés
DROP POLICY IF EXISTS "Acteurs authentifiés peuvent gérer les encaissements de vente" ON public.encaissements_ventes;
CREATE POLICY "Acteurs authentifiés peuvent gérer les encaissements de vente" 
ON public.encaissements_ventes FOR ALL TO authenticated USING (true);
