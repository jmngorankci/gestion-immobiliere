export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'super_admin' | 'gestionnaire' | 'locataire' | 'proprietaire';
export type PropertyType = 'studio' | '2_pieces' | '3_pieces' | 'maison_basse' | 'villa' | 'appartement';
export type LeaseStatus = 'actif' | 'resilie';
export type PaymentMode = 'espece' | 'mobile_money' | 'virement';
export type PaymentStatus = 'en_attente' | 'valide' | 'rejete';
export type RepairImputation = 'non_impute' | 'impute_au_loyer' | 'a_la_charge_proprietaire' | 'a_la_charge_cabinet';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nom_complet: string;
          telephone: string;
          role: UserRole;
          avatar_url: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nom_complet: string;
          telephone: string;
          role?: UserRole;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom_complet?: string;
          telephone?: string;
          role?: UserRole;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      proprietaires: {
        Row: {
          id: string;
          nom_complet: string;
          telephone: string;
          email: string | null;
          adresse: string | null;
          mode_versement_prefere: 'virement' | 'mobile_money' | 'cheque' | 'espece';
          rib_ou_numero_compte: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom_complet: string;
          telephone: string;
          email?: string | null;
          adresse?: string | null;
          mode_versement_prefere?: 'virement' | 'mobile_money' | 'cheque' | 'espece';
          rib_ou_numero_compte?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom_complet?: string;
          telephone?: string;
          email?: string | null;
          adresse?: string | null;
          mode_versement_prefere?: 'virement' | 'mobile_money' | 'cheque' | 'espece';
          rib_ou_numero_compte?: string | null;
          created_at?: string;
        };
      };
      biens: {
        Row: {
          id: string;
          proprietaire_id: string;
          code_reference: string;
          type_bien: PropertyType;
          loyer_mensuel_reference: number;
          commune_quartier: string;
          adresse_precise: string;
          est_occupe: boolean;
          description: string | null;
          photos_urls: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proprietaire_id: string;
          code_reference: string;
          type_bien: PropertyType;
          loyer_mensuel_reference: number;
          commune_quartier: string;
          adresse_precise: string;
          est_occupe?: boolean;
          description?: string | null;
          photos_urls?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          proprietaire_id?: string;
          code_reference?: string;
          type_bien?: PropertyType;
          loyer_mensuel_reference?: number;
          commune_quartier?: string;
          adresse_precise?: string;
          est_occupe?: boolean;
          description?: string | null;
          photos_urls?: string[] | null;
          created_at?: string;
        };
      };
      contrats_bail: {
        Row: {
          id: string;
          bien_id: string;
          locataire_profile_id: string;
          loyer_mensuel: number;
          depot_garantie: number;
          date_debut: string;
          date_fin: string | null;
          statut: LeaseStatus;
          conditions_particulieres: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bien_id: string;
          locataire_profile_id: string;
          loyer_mensuel: number;
          depot_garantie: number;
          date_debut: string;
          date_fin?: string | null;
          statut?: LeaseStatus;
          conditions_particulieres?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bien_id?: string;
          locataire_profile_id?: string;
          loyer_mensuel?: number;
          depot_garantie?: number;
          date_debut?: string;
          date_fin?: string | null;
          statut?: LeaseStatus;
          conditions_particulieres?: string | null;
          created_at?: string;
        };
      };
      paiements_loyer: {
        Row: {
          id: string;
          contrat_id: string;
          mois_concerne: number; // 1 to 12
          annee_concernee: number; // ex: 2026
          montant_total_paye: number;
          commission_cabinet: number; // 10%
          montant_reversable_proprietaire: number; // 90%
          mode_paiement: PaymentMode;
          statut: PaymentStatus;
          valide_par: string | null; // profile_id of validator
          date_validation: string | null;
          numero_recu: string | null; // e.g. REC-2026-0001
          reference_transaction: string | null; // e.g. Wave ID / Virement ref
          preuve_paiement_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contrat_id: string;
          mois_concerne: number;
          annee_concernee: number;
          montant_total_paye: number;
          commission_cabinet?: number;
          montant_reversable_proprietaire?: number;
          mode_paiement: PaymentMode;
          statut?: PaymentStatus;
          valide_par?: string | null;
          date_validation?: string | null;
          numero_recu?: string | null;
          reference_transaction?: string | null;
          preuve_paiement_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contrat_id?: string;
          mois_concerne?: number;
          annee_concernee?: number;
          montant_total_paye?: number;
          commission_cabinet?: number;
          montant_reversable_proprietaire?: number;
          mode_paiement?: PaymentMode;
          statut?: PaymentStatus;
          valide_par?: string | null;
          date_validation?: string | null;
          numero_recu?: string | null;
          reference_transaction?: string | null;
          preuve_paiement_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      travaux_reparations: {
        Row: {
          id: string;
          bien_id: string;
          description: string;
          cout: number;
          date_intervention: string;
          imputation: RepairImputation;
          loyer_impacte_mois: number | null;
          loyer_impacte_annee: number | null;
          justificatif_facture_url: string | null;
          prestataire_nom: string | null;
          est_regle: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          bien_id: string;
          description: string;
          cout: number;
          date_intervention: string;
          imputation?: RepairImputation;
          loyer_impacte_mois?: number | null;
          loyer_impacte_annee?: number | null;
          justificatif_facture_url?: string | null;
          prestataire_nom?: string | null;
          est_regle?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          bien_id?: string;
          description?: string;
          cout?: number;
          date_intervention?: string;
          imputation?: RepairImputation;
          loyer_impacte_mois?: number | null;
          loyer_impacte_annee?: number | null;
          justificatif_facture_url?: string | null;
          prestataire_nom?: string | null;
          est_regle?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Convenient joined types for business UI & receipts
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Proprietaire = Database['public']['Tables']['proprietaires']['Row'];
export type Bien = Database['public']['Tables']['biens']['Row'];
export type ContratBail = Database['public']['Tables']['contrats_bail']['Row'];
export type PaiementLoyer = Database['public']['Tables']['paiements_loyer']['Row'];
export type TravauxReparation = Database['public']['Tables']['travaux_reparations']['Row'];

export interface ContratWithDetails extends ContratBail {
  bien: Bien & { proprietaire: Proprietaire };
  locataire: Profile;
}

export interface PaiementWithDetails extends PaiementLoyer {
  contrat: ContratBail & {
    bien: Bien & { proprietaire: Proprietaire };
    locataire: Profile;
  };
  valideur?: Profile | null;
  reparationsImputees?: TravauxReparation[];
}
