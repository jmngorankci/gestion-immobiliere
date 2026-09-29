-- ==============================================================================
-- MISE A JOUR DES TABLES & SYNCHRONISATION SUPABASE
-- Executez ce script dans le "SQL Editor" de votre tableau de bord Supabase
-- Projet : bclivwiuljvzecmhevpe
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'gestionnaire', 'locataire', 'proprietaire');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('studio', '2_pieces', '3_pieces', 'maison_basse', 'villa', 'appartement');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE lease_status AS ENUM ('actif', 'resilie');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('espece', 'mobile_money', 'virement');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('en_attente', 'valide', 'rejete');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE repair_imputation AS ENUM ('non_impute', 'impute_au_loyer', 'a_la_charge_proprietaire', 'a_la_charge_cabinet');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE repair_status AS ENUM ('en_attente', 'realise', 'annule');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CREATION DES TABLES SI ELLES N'EXISTENT PAS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'locataire',
    avatar_url TEXT,
    mot_de_passe TEXT,
    code_pin VARCHAR(20),
    est_actif BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.proprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    adresse TEXT,
    mode_versement_prefere VARCHAR(50) DEFAULT 'virement' NOT NULL,
    rib_ou_numero_compte TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.biens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID NOT NULL REFERENCES public.proprietaires(id) ON DELETE CASCADE,
    code_reference VARCHAR(50) UNIQUE NOT NULL,
    type_bien property_type NOT NULL,
    loyer_mensuel_reference NUMERIC(12, 2) NOT NULL,
    commune_quartier VARCHAR(255) NOT NULL,
    adresse_precise TEXT NOT NULL,
    est_occupe BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contrats_bail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bien_id UUID NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
    locataire_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    loyer_mensuel NUMERIC(12, 2) NOT NULL,
    depot_garantie NUMERIC(12, 2) NOT NULL,
    taux_commission NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut lease_status DEFAULT 'actif' NOT NULL,
    conditions_particulieres TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contrats_bail ADD COLUMN IF NOT EXISTS taux_commission NUMERIC(5, 2) DEFAULT 10.00 NOT NULL;

CREATE TABLE IF NOT EXISTS public.paiements_loyer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrat_id UUID NOT NULL REFERENCES public.contrats_bail(id) ON DELETE CASCADE,
    mois_concerne INTEGER NOT NULL CHECK (mois_concerne BETWEEN 1 AND 12),
    annee_concernee INTEGER NOT NULL,
    montant_total_paye NUMERIC(12, 2) NOT NULL,
    commission_cabinet NUMERIC(12, 2) NOT NULL,
    montant_reversable_proprietaire NUMERIC(12, 2) NOT NULL,
    mode_paiement payment_mode NOT NULL,
    statut payment_status DEFAULT 'en_attente' NOT NULL,
    valide_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date_validation TIMESTAMP WITH TIME ZONE,
    numero_recu VARCHAR(50) UNIQUE,
    reference_transaction VARCHAR(100),
    preuve_paiement_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.travaux_reparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bien_id UUID NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cout NUMERIC(12, 2) NOT NULL,
    date_intervention DATE NOT NULL,
    imputation repair_imputation DEFAULT 'non_impute' NOT NULL,
    loyer_impacte_mois INTEGER CHECK (loyer_impacte_mois BETWEEN 1 AND 12),
    loyer_impacte_annee INTEGER,
    justificatif_facture_url TEXT,
    prestataire_nom VARCHAR(255),
    est_regle BOOLEAN DEFAULT TRUE NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AJOUT DES COLONNES MANQUANTES SUR LES TABLES EXISTANTES (MIGRATION SECURISEE)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mot_de_passe TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS code_pin VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS est_actif BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.travaux_reparations ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'en_attente' NOT NULL;
ALTER TABLE public.travaux_reparations ADD COLUMN IF NOT EXISTS justificatif_facture_url TEXT;
ALTER TABLE public.travaux_reparations ADD COLUMN IF NOT EXISTS prestataire_nom VARCHAR(255);

ALTER TABLE public.biens ADD COLUMN IF NOT EXISTS photos_urls TEXT[];
ALTER TABLE public.paiements_loyer ADD COLUMN IF NOT EXISTS preuve_paiement_url TEXT;
ALTER TABLE public.paiements_loyer ADD COLUMN IF NOT EXISTS reference_transaction VARCHAR(100);

-- 5. TRIGGER COMMISSION (10% CABINET / 90% PROPRIETAIRE)
CREATE OR REPLACE FUNCTION calculate_commission_split_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.commission_cabinet := ROUND(NEW.montant_total_paye * 0.10);
    NEW.montant_reversable_proprietaire := NEW.montant_total_paye - NEW.commission_cabinet;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paiements_commission ON public.paiements_loyer;
CREATE TRIGGER trg_paiements_commission
BEFORE INSERT OR UPDATE OF montant_total_paye ON public.paiements_loyer
FOR EACH ROW
EXECUTE FUNCTION calculate_commission_split_trigger();

-- 6. POLITIQUES RLS PERMISSIVES POUR L'APPLICATION (ANON / PUBLIC)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_bail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_loyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travaux_reparations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
    CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access proprietaires" ON public.proprietaires;
    CREATE POLICY "Public access proprietaires" ON public.proprietaires FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access biens" ON public.biens;
    CREATE POLICY "Public access biens" ON public.biens FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access contrats_bail" ON public.contrats_bail;
    CREATE POLICY "Public access contrats_bail" ON public.contrats_bail FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access paiements_loyer" ON public.paiements_loyer;
    CREATE POLICY "Public access paiements_loyer" ON public.paiements_loyer FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access travaux_reparations" ON public.travaux_reparations;
    CREATE POLICY "Public access travaux_reparations" ON public.travaux_reparations FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN others THEN null; END $$;

-- 7. INSERTION / MISE A JOUR DES COMPTES ET DONNEES DE DEMARRAGE
INSERT INTO public.profiles (id, nom_complet, telephone, email, role, avatar_url, mot_de_passe, code_pin, est_actif)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Kouamé Konan Yves', '+2250700000001', 'admin@cabinet-immo.ci', 'super_admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'admin123', '123456', TRUE),
('00000000-0000-0000-0000-000000000002', 'Awa Diallo', '+2250700000002', 'awa.diallo@cabinet-immo.ci', 'gestionnaire', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 'gestion123', '123456', TRUE),
('00000000-0000-0000-0000-000000000003', 'Jean-Luc Koffi', '+2250707112233', 'jeanluc.koffi@gmail.com', 'locataire', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'locataire123', '1234', TRUE)
ON CONFLICT (id) DO UPDATE SET
    mot_de_passe = EXCLUDED.mot_de_passe,
    code_pin = EXCLUDED.code_pin,
    est_actif = EXCLUDED.est_actif;

INSERT INTO public.proprietaires (id, nom_complet, telephone, email, adresse, mode_versement_prefere, rib_ou_numero_compte)
VALUES 
('11111111-1111-1111-1111-111111111111', 'El Hadj Ousmane Traoré', '+2250701122334', 'ousmane.traore@holding-ci.com', 'Cocody Ambassades, Villa 14, Abidjan', 'virement', 'CI034 01001 001234567890 45 (SGBCI)'),
('22222222-2222-2222-2222-222222222222', 'Mme Marie-Claire Aké', '+2250505566778', 'marieclaire.ake@yahoo.fr', 'Marcory Résidentiel, Rue des Majorettes', 'mobile_money', 'Wave / Orange: +2250505566778')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.biens (id, proprietaire_id, code_reference, type_bien, loyer_mensuel_reference, commune_quartier, adresse_precise, est_occupe, description)
VALUES 
('aaaaaaa1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'APP-COC-001', '3_pieces', 450000, 'Cocody Riviera Palmeraie', 'Résidence Les Palmes, Bât B, Apt 204', TRUE, 'Superbe 3 pièces meublé climatisé avec parking sécurisé.'),
('aaaaaaa2-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'VIL-MAR-002', 'villa', 1200000, 'Marcory Zone 4C', 'Rue Paul Langevin, Villa N° 7', TRUE, 'Villa contemporaine duplex 5 pièces avec piscine et groupe électrogène.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.contrats_bail (id, bien_id, locataire_profile_id, loyer_mensuel, depot_garantie, date_debut, date_fin, statut, conditions_particulieres)
VALUES
('bbbbbbb1-1111-1111-1111-111111111111', 'aaaaaaa1-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 450000, 900000, '2025-01-01', NULL, 'actif', 'Paiement avant le 5 du mois.')
ON CONFLICT (id) DO NOTHING;
