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
  profiles: Profile[];
  biens: Bien[];
  proprietaires: Proprietaire[];
  contrats: ContratBail[];
  paiements: PaiementWithDetails[];
  travaux: TravauxReparation[];
  
  // Bien CRUD
  ajouterBien: (bien: Omit<Bien, 'id' | 'created_at'>) => Promise<Bien>;
  modifierBien: (id: string, bien: Partial<Bien>) => Promise<Bien>;
  supprimerBien: (id: string) => Promise<void>;

  // Proprietaire CRUD
  ajouterProprietaire: (prop: Omit<Proprietaire, 'id' | 'created_at'>) => Promise<Proprietaire>;
  modifierProprietaire: (id: string, prop: Partial<Proprietaire>) => Promise<Proprietaire>;
  supprimerProprietaire: (id: string) => Promise<void>;

  // Locataire & Contrat CRUD
  ajouterLocataireEtContrat: (payload: {
    nom_complet: string;
    telephone: string;
    email?: string;
    bien_id: string;
    loyer_mensuel: number;
    depot_garantie: number;
    date_debut: string;
    conditions_particulieres?: string;
  }) => Promise<void>;
  modifierContrat: (contratId: string, payload: Partial<ContratBail>) => Promise<void>;
  resilierContrat: (contratId: string) => Promise<void>;
  supprimerContrat: (contratId: string) => Promise<void>;

  // Paiements & Travaux Actions
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

const LOCAL_STORAGE_KEY = 'GESTION_IMMO_STORE_V3';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(MOCK_PROFILES[0]);
  const [biens, setBiens] = useState<Bien[]>(MOCK_BIENS);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>(MOCK_PROPRIETAIRES);
  const [contrats, setContrats] = useState<ContratBail[]>(MOCK_CONTRATS);
  const [paiements, setPaiements] = useState<PaiementWithDetails[]>(MOCK_PAIEMENTS);
  const [travaux, setTravaux] = useState<TravauxReparation[]>(MOCK_TRAVAUX);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.biens) setBiens(parsed.biens);
        if (parsed.proprietaires) setProprietaires(parsed.proprietaires);
        if (parsed.contrats) setContrats(parsed.contrats);
        if (parsed.paiements) setPaiements(parsed.paiements);
        if (parsed.travaux) setTravaux(parsed.travaux);
      }
    } catch (e) {
      console.warn('Storage load fallback:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ profiles, biens, proprietaires, contrats, paiements, travaux })
      );
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [profiles, biens, proprietaires, contrats, paiements, travaux, isLoaded]);

  // ===================== CRUD BIENS =====================
  const ajouterBien = async (data: Omit<Bien, 'id' | 'created_at'>): Promise<Bien> => {
    const newBien: Bien = {
      ...data,
      id: `bien-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setBiens((prev) => [newBien, ...prev]);
    return newBien;
  };

  const modifierBien = async (id: string, updates: Partial<Bien>): Promise<Bien> => {
    let updated: Bien | null = null;
    setBiens((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updated = { ...b, ...updates };
          return updated;
        }
        return b;
      })
    );
    if (!updated) throw new Error('Bien non trouvé');
    return updated;
  };

  const supprimerBien = async (id: string): Promise<void> => {
    setBiens((prev) => prev.filter((b) => b.id !== id));
    setContrats((prev) => prev.filter((c) => c.bien_id !== id));
  };

  // ===================== CRUD PROPRIETAIRES =====================
  const ajouterProprietaire = async (
    data: Omit<Proprietaire, 'id' | 'created_at'>
  ): Promise<Proprietaire> => {
    const newProp: Proprietaire = {
      ...data,
      id: `prop-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setProprietaires((prev) => [newProp, ...prev]);
    return newProp;
  };

  const modifierProprietaire = async (
    id: string,
    updates: Partial<Proprietaire>
  ): Promise<Proprietaire> => {
    let updated: Proprietaire | null = null;
    setProprietaires((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      })
    );
    if (!updated) throw new Error('Propriétaire non trouvé');
    return updated;
  };

  const supprimerProprietaire = async (id: string): Promise<void> => {
    setProprietaires((prev) => prev.filter((p) => p.id !== id));
  };

  // ===================== CRUD LOCATAIRES & BAUX =====================
  const ajouterLocataireEtContrat = async (payload: {
    nom_complet: string;
    telephone: string;
    email?: string;
    bien_id: string;
    loyer_mensuel: number;
    depot_garantie: number;
    date_debut: string;
    conditions_particulieres?: string;
  }): Promise<void> => {
    // 1. Create or retrieve tenant profile
    let locataireProfile = profiles.find((p) => p.telephone === payload.telephone);
    if (!locataireProfile) {
      locataireProfile = {
        id: `user-loc-${Date.now()}`,
        nom_complet: payload.nom_complet,
        telephone: payload.telephone,
        email: payload.email || `${payload.telephone.replace(/\D/g, '')}@locataire-ci.com`,
        role: 'locataire',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfiles((prev) => [...prev, locataireProfile!]);
    }

    // 2. Create Lease
    const newLease: ContratBail = {
      id: `contrat-${Date.now()}`,
      bien_id: payload.bien_id,
      locataire_profile_id: locataireProfile.id,
      loyer_mensuel: payload.loyer_mensuel,
      depot_garantie: payload.depot_garantie,
      date_debut: payload.date_debut,
      date_fin: null,
      statut: 'actif',
      conditions_particulieres: payload.conditions_particulieres || null,
      created_at: new Date().toISOString(),
    };
    setContrats((prev) => [newLease, ...prev]);

    // 3. Mark property as occupied
    setBiens((prev) =>
      prev.map((b) => (b.id === payload.bien_id ? { ...b, est_occupe: true } : b))
    );
  };

  const modifierContrat = async (
    contratId: string,
    payload: Partial<ContratBail>
  ): Promise<void> => {
    setContrats((prev) =>
      prev.map((c) => (c.id === contratId ? { ...c, ...payload } : c))
    );
  };

  const resilierContrat = async (contratId: string): Promise<void> => {
    const contrat = contrats.find((c) => c.id === contratId);
    setContrats((prev) =>
      prev.map((c) => (c.id === contratId ? { ...c, statut: 'resilie', date_fin: new Date().toISOString().split('T')[0] } : c))
    );
    if (contrat) {
      setBiens((prev) =>
        prev.map((b) => (b.id === contrat.bien_id ? { ...b, est_occupe: false } : b))
      );
    }
  };

  const supprimerContrat = async (contratId: string): Promise<void> => {
    const contrat = contrats.find((c) => c.id === contratId);
    setContrats((prev) => prev.filter((c) => c.id !== contratId));
    if (contrat) {
      setBiens((prev) =>
        prev.map((b) => (b.id === contrat.bien_id ? { ...b, est_occupe: false } : b))
      );
    }
  };

  // ===================== PAIEMENTS & TRAVAUX =====================
  const validerPaiement = async (
    paiementId: string,
    notes?: string
  ): Promise<PaiementWithDetails> => {
    const nextSeq = paiements.filter((p) => p.numero_recu).length + 43;
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

    if (!updatedPaiement) throw new Error('Paiement introuvable');
    return updatedPaiement;
  };

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
      profiles.find((u) => u.id === contrat.locataire_profile_id) || MOCK_PROFILES[1];

    const commission_cabinet = Math.round(payload.montant * 0.10);
    const montant_reversable_proprietaire = payload.montant - commission_cabinet;

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

  const mettreAJourProfilLocataire = async (
    profileId: string,
    nomComplet: string,
    avatarUrl: string
  ): Promise<void> => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, nom_complet: nomComplet, avatar_url: avatarUrl } : p
      )
    );
    if (currentUser && currentUser.id === profileId) {
      setCurrentUser({
        ...currentUser,
        nom_complet: nomComplet,
        avatar_url: avatarUrl,
      });
    }
  };

  const reinitialiserDonnees = () => {
    setProfiles(MOCK_PROFILES);
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
        profiles,
        biens,
        proprietaires,
        contrats,
        paiements,
        travaux,
        ajouterBien,
        modifierBien,
        supprimerBien,
        ajouterProprietaire,
        modifierProprietaire,
        supprimerProprietaire,
        ajouterLocataireEtContrat,
        modifierContrat,
        resilierContrat,
        supprimerContrat,
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
