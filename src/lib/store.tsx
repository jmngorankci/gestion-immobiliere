'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Bien,
  ContratBail,
  PaiementWithDetails,
  Profile,
  Proprietaire,
  TravauxReparation,
} from '@/types/database.types';
import {
  MOCK_BIENS,
  MOCK_CONTRATS,
  MOCK_PAIEMENTS,
  MOCK_PROFILES,
  MOCK_PROPRIETAIRES,
  MOCK_TRAVAUX,
} from '@/lib/mock-data';
import { formatReceiptNumber } from '@/lib/calculations';

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  biens: Bien[];
  proprietaires: Proprietaire[];
  contrats: ContratBail[];
  paiements: PaiementWithDetails[];
  travaux: TravauxReparation[];
  validerPaiement: (paiementId: string, notes?: string) => Promise<PaiementWithDetails>;
  rejeterPaiement: (paiementId: string, motif: string) => Promise<void>;
  ajouterTravaux: (nouveauxTravaux: Omit<TravauxReparation, 'id' | 'created_at'>) => Promise<TravauxReparation>;
  enregistrerPaiementLocataire: (payload: {
    contratId: string;
    mois: number;
    annee: number;
    montant: number;
    modePaiement: 'espece' | 'mobile_money' | 'virement';
    referenceTransaction: string;
    preuveUrl?: string;
  }) => Promise<PaiementWithDetails>;
  mettreAJourProfilLocataire: (profileId: string, nomComplet: string, avatarUrl: string) => Promise<void>;
  reinitialiserDonnees: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'GESTION_IMMO_STORE_V1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(MOCK_PROFILES[0]); // default admin
  const [biens, setBiens] = useState<Bien[]>(MOCK_BIENS);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>(MOCK_PROPRIETAIRES);
  const [contrats, setContrats] = useState<ContratBail[]>(MOCK_CONTRATS);
  const [paiements, setPaiements] = useState<PaiementWithDetails[]>(MOCK_PAIEMENTS);
  const [travaux, setTravaux] = useState<TravauxReparation[]>(MOCK_TRAVAUX);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.paiements) setPaiements(parsed.paiements);
        if (parsed.travaux) setTravaux(parsed.travaux);
        if (parsed.biens) setBiens(parsed.biens);
        if (parsed.proprietaires) setProprietaires(parsed.proprietaires);
        if (parsed.contrats) setContrats(parsed.contrats);
      }
    } catch (e) {
      console.warn('Storage load fallback:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ biens, proprietaires, contrats, paiements, travaux })
      );
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [biens, proprietaires, contrats, paiements, travaux, isLoaded]);

  /**
   * Action: Validation administrative d'un paiement en attente
   * Attribue un numéro séquentiel unique REC-2026-XXXX, horodate et valideur.
   */
  const validerPaiement = async (
    paiementId: string,
    notes?: string
  ): Promise<PaiementWithDetails> => {
    const nextSeq = paiements.filter((p) => p.numero_recu).length + 43; // realistic sequence
    const generatedReceiptNumber = formatReceiptNumber(2026, nextSeq);
    const nowIso = new Date().toISOString();

    let updatedPaiement: PaiementWithDetails | null = null;

    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          updatedPaiement = {
            ...p,
            statut: 'valide',
            valide_par: currentUser?.id || 'admin',
            valideur: currentUser || MOCK_PROFILES[0],
            date_validation: nowIso,
            numero_recu: generatedReceiptNumber,
            notes: notes || p.notes,
          };
          return updatedPaiement;
        }
        return p;
      })
    );

    if (!updatedPaiement) {
      throw new Error('Paiement introuvable');
    }

    return updatedPaiement;
  };

  /**
   * Action: Rejet d'un paiement en attente
   */
  const rejeterPaiement = async (paiementId: string, motif: string): Promise<void> => {
    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          return {
            ...p,
            statut: 'rejete',
            notes: `Motif de rejet: ${motif}`,
            date_validation: new Date().toISOString(),
            valide_par: currentUser?.id || 'admin',
          };
        }
        return p;
      })
    );
  };

  /**
   * Action: Enregistrement d'une nouvelle réparation avec imputation
   */
  const ajouterTravaux = async (
    nouveauxTravaux: Omit<TravauxReparation, 'id' | 'created_at'>
  ): Promise<TravauxReparation> => {
    const item: TravauxReparation = {
      ...nouveauxTravaux,
      id: `trav-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setTravaux((prev) => [item, ...prev]);
    return item;
  };

  /**
   * Action: Soumission d'un paiement par le locataire
   */
  const enregistrerPaiementLocataire = async (payload: {
    contratId: string;
    mois: number;
    annee: number;
    montant: number;
    modePaiement: 'espece' | 'mobile_money' | 'virement';
    referenceTransaction: string;
    preuveUrl?: string;
  }): Promise<PaiementWithDetails> => {
    const contrat = contrats.find((c) => c.id === payload.contratId) || MOCK_CONTRATS[0];
    const bien = biens.find((b) => b.id === contrat.bien_id) || MOCK_BIENS[0];
    const proprietaire =
      proprietaires.find((pr) => pr.id === bien.proprietaire_id) || MOCK_PROPRIETAIRES[0];
    const locataire =
      MOCK_PROFILES.find((u) => u.id === contrat.locataire_profile_id) || MOCK_PROFILES[1];

    const commission_cabinet = Math.round(payload.montant * 0.10);
    const montant_reversable_proprietaire = payload.montant - commission_cabinet;

    // Find imputed repairs for this month
    const reparationsImputees = travaux.filter(
      (t) =>
        t.bien_id === bien.id &&
        t.imputation === 'impute_au_loyer' &&
        t.loyer_impacte_mois === payload.mois &&
        t.loyer_impacte_annee === payload.annee
    );

    const nouveauPaiement: PaiementWithDetails = {
      id: `pay-${Date.now()}`,
      contrat_id: payload.contratId,
      mois_concerne: payload.mois,
      annee_concernee: payload.annee,
      montant_total_paye: payload.montant,
      commission_cabinet,
      montant_reversable_proprietaire,
      mode_paiement: payload.modePaiement,
      statut: 'en_attente',
      valide_par: null,
      date_validation: null,
      numero_recu: null,
      reference_transaction: payload.referenceTransaction,
      preuve_paiement_url: payload.preuveUrl || null,
      notes: 'Paiement déclaré par le locataire depuis le portail mobile.',
      created_at: new Date().toISOString(),
      contrat: {
        ...contrat,
        bien: {
          ...bien,
          proprietaire,
        },
        locataire,
      },
      valideur: null,
      reparationsImputees,
    };

    setPaiements((prev) => [nouveauPaiement, ...prev]);
    return nouveauPaiement;
  };

  /**
   * Action: Mise à jour du profil locataire (photo & infos)
   */
  const mettreAJourProfilLocataire = async (
    profileId: string,
    nomComplet: string,
    avatarUrl: string
  ): Promise<void> => {
    if (currentUser && currentUser.id === profileId) {
      setCurrentUser({
        ...currentUser,
        nom_complet: nomComplet,
        avatar_url: avatarUrl,
      });
    }
  };

  const reinitialiserDonnees = () => {
    setBiens(MOCK_BIENS);
    setProprietaires(MOCK_PROPRIETAIRES);
    setContrats(MOCK_CONTRATS);
    setPaiements(MOCK_PAIEMENTS);
    setTravaux(MOCK_TRAVAUX);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        biens,
        proprietaires,
        contrats,
        paiements,
        travaux,
        validerPaiement,
        rejeterPaiement,
        ajouterTravaux,
        enregistrerPaiementLocataire,
        mettreAJourProfilLocataire,
        reinitialiserDonnees,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
