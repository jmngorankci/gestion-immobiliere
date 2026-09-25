-- ==============================================================================
-- SCHEMA POSTGRESQL / SUPABASE POUR LE CABINET DE GESTION IMMOBILIERE
-- ID PROJET SUPABASE : bclivwiuljvzecmhevpe
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPES ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'gestionnaire', 'locataire', 'proprietaire');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('studio', '2_pieces', '3_pieces', 'maison_basse', 'villa', 'appartement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lease_status AS ENUM ('actif', 'resilie');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('espece', 'mobile_money', 'virement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('en_attente', 'valide', 'rejete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE repair_imputation AS ENUM ('non_impute', 'impute_au_loyer', 'a_la_charge_proprietaire', 'a_la_charge_cabinet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    role user_role NOT NULL DEFAULT 'locataire',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: proprietaires
CREATE TABLE IF NOT EXISTS public.proprietaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    adresse TEXT,
    mode_versement_prefere VARCHAR(50) DEFAULT 'virement' NOT NULL, -- 'virement', 'mobile_money', 'cheque', 'espece'
    rib_ou_numero_compte TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: biens
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

-- Table: contrats_bail
CREATE TABLE IF NOT EXISTS public.contrats_bail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bien_id UUID NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
    locataire_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    loyer_mensuel NUMERIC(12, 2) NOT NULL,
    depot_garantie NUMERIC(12, 2) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut lease_status DEFAULT 'actif' NOT NULL,
    conditions_particulieres TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: paiements_loyer
CREATE TABLE IF NOT EXISTS public.paiements_loyer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrat_id UUID NOT NULL REFERENCES public.contrats_bail(id) ON DELETE CASCADE,
    mois_concerne INTEGER NOT NULL CHECK (mois_concerne BETWEEN 1 AND 12),
    annee_concernee INTEGER NOT NULL,
    montant_total_paye NUMERIC(12, 2) NOT NULL,
    commission_cabinet NUMERIC(12, 2) NOT NULL, -- 10%
    montant_reversable_proprietaire NUMERIC(12, 2) NOT NULL, -- 90%
    mode_paiement payment_mode NOT NULL,
    statut payment_status DEFAULT 'en_attente' NOT NULL,
    valide_par UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date_validation TIMESTAMP WITH TIME ZONE,
    numero_recu VARCHAR(50) UNIQUE, -- ex: REC-2026-0042
    reference_transaction VARCHAR(100),
    preuve_paiement_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: travaux_reparations
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INDEXES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_biens_proprietaire ON public.biens(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_contrats_bien ON public.contrats_bail(bien_id);
CREATE INDEX IF NOT EXISTS idx_contrats_locataire ON public.contrats_bail(locataire_profile_id);
CREATE INDEX IF NOT EXISTS idx_paiements_contrat ON public.paiements_loyer(contrat_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON public.paiements_loyer(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_recu ON public.paiements_loyer(numero_recu);
CREATE INDEX IF NOT EXISTS idx_travaux_bien ON public.travaux_reparations(bien_id);
CREATE INDEX IF NOT EXISTS idx_travaux_impact ON public.travaux_reparations(loyer_impacte_mois, loyer_impacte_annee);

-- 5. TRIGGER AUTOMATIQUE : CALCUL 10% COMMISSION & 90% REVERSEMENT
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

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats_bail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_loyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travaux_reparations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Lecture / Écriture)
CREATE POLICY "Acces complet admin et gestionnaire" ON public.profiles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'gestionnaire')
    )
);

CREATE POLICY "Lecture profil propre" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Lecture biens pour tous authentifies" ON public.biens
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Lecture contrats propre locataire" ON public.contrats_bail
FOR SELECT TO authenticated
USING (
    locataire_profile_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'gestionnaire')
    )
);

CREATE POLICY "Lecture paiements propre locataire" ON public.paiements_loyer
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.contrats_bail
        WHERE public.contrats_bail.id = public.paiements_loyer.contrat_id
        AND public.contrats_bail.locataire_profile_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'gestionnaire')
    )
);

-- ==============================================================================
-- 7. JEU DE DONNÉES DE DÉMARRAGE (SEED DATA - ABIDJAN)
-- ==============================================================================

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
