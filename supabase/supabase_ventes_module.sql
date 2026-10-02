-- ==============================================================================
-- SCRIPT SQL : MODULE DE GESTION DES VENTES IMMOBILIÈRES
-- À exécuter dans l'éditeur SQL de Supabase
-- ==============================================================================
-- ------------------------------------------------------------------------------
-- 1. Évolution de la table existante "biens"
-- ------------------------------------------------------------------------------
-- Création d'un type enum pour l'intention du bien (si pas déjà géré autrement)
CREATE TYPE public.intention_bien AS ENUM ('location', 'vente', 'mixte');
-- Ajout des nouveaux champs à la table `biens` existante
ALTER TABLE public.biens 
ADD COLUMN intention public.intention_bien DEFAULT 'location',
ADD COLUMN prix_vente_demande numeric DEFAULT 0,
ADD COLUMN statut_vente varchar(50) DEFAULT 'disponible'; 
-- Statuts possibles: 'disponible', 'sous_compromis', 'vendu'
-- Optionnel: rendre le loyer_mensuel_reference nullable s'il s'agit uniquement d'une vente
ALTER TABLE public.biens ALTER COLUMN loyer_mensuel_reference DROP NOT NULL;
-- ------------------------------------------------------------------------------
-- 2. Création de la table "acquereurs"
-- ------------------------------------------------------------------------------
CREATE TABLE public.acquereurs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_complet varchar(255) NOT NULL,
    telephone varchar(50) NOT NULL,
    email varchar(255),
    adresse text,
    budget_max numeric,
    apport_personnel numeric,
    criteres_recherche text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Activation de la sécurité RLS (Row Level Security)
ALTER TABLE public.acquereurs ENABLE ROW LEVEL SECURITY;
-- Politique de base : Les utilisateurs authentifiés peuvent tout faire
CREATE POLICY "Acteurs authentifiés peuvent gérer les acquéreurs" 
ON public.acquereurs FOR ALL TO authenticated USING (true);
-- ------------------------------------------------------------------------------
-- 3. Création de la table "notaires"
-- ------------------------------------------------------------------------------
CREATE TABLE public.notaires (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_complet varchar(255) NOT NULL,
    etude_nom varchar(255), -- Nom du cabinet/étude notarial
    telephone varchar(50) NOT NULL,
    email varchar(255),
    adresse text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Activation RLS
ALTER TABLE public.notaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acteurs authentifiés peuvent gérer les notaires" 
ON public.notaires FOR ALL TO authenticated USING (true);
-- ------------------------------------------------------------------------------
-- 4. Création de la table "transactions_ventes"
-- ------------------------------------------------------------------------------
CREATE TYPE public.statut_transaction_vente AS ENUM (
    'initiee', 
    'compromis_signe', 
    'acte_final_signe', 
    'annulee'
);
CREATE TABLE public.transactions_ventes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bien_id uuid NOT NULL REFERENCES public.biens(id) ON DELETE RESTRICT,
    vendeur_id uuid NOT NULL REFERENCES public.proprietaires(id) ON DELETE RESTRICT,
    acquereur_id uuid NOT NULL REFERENCES public.acquereurs(id) ON DELETE RESTRICT,
    notaire_id uuid REFERENCES public.notaires(id) ON DELETE SET NULL,
    
    prix_convenu numeric NOT NULL,
    frais_agence numeric DEFAULT 0,
    statut public.statut_transaction_vente DEFAULT 'initiee' NOT NULL,
    
    date_compromis date,
    date_acte_final date,
    
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Trigger pour mettre à jour la date de modification `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';
CREATE TRIGGER update_transactions_ventes_modtime
BEFORE UPDATE ON public.transactions_ventes
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
-- Activation RLS
ALTER TABLE public.transactions_ventes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acteurs authentifiés peuvent gérer les transactions" 
ON public.transactions_ventes FOR ALL TO authenticated USING (true);
