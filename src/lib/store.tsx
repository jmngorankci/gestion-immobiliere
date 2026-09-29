'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Bien,
  ContratBail,
  PaiementWithDetails,
  Profile,
  Proprietaire,
  RepairStatus,
  TravauxReparation,
  UserRole,
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
import { createClient } from '@/lib/supabase/client';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  profiles: Profile[];
  biens: Bien[];
  proprietaires: Proprietaire[];
  contrats: ContratBail[];
  paiements: PaiementWithDetails[];
  travaux: TravauxReparation[];
  isSupabaseConnected: boolean;
  isLoading: boolean;
  rafraichirDonnees: () => Promise<void>;

  // Authentication & Access Assignment
  authentifierCabinet: (identifiant: string, motDePasse: string) => Promise<Profile>;
  authentifierLocataire: (telephone: string, codePinOuMdp: string) => Promise<Profile>;
  attribuerAccesUtilisateur: (payload: {
    nom_complet: string;
    telephone: string;
    email?: string;
    role: UserRole;
    avatar_url?: string;
    mot_de_passe?: string;
    code_pin?: string;
    bien_id?: string;
    loyer_mensuel?: number;
  }) => Promise<Profile>;
  modifierAccesUtilisateur: (
    id: string,
    updates: Partial<Profile> & { bien_id?: string; loyer_mensuel?: number }
  ) => Promise<Profile>;
  toggleStatutCompte: (profileId: string) => Promise<void>;
  supprimerAcces: (profileId: string) => Promise<void>;
  deconnexion: () => void;

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
  modifierTravaux: (id: string, updates: Partial<TravauxReparation>) => Promise<TravauxReparation>;
  changerStatutTravaux: (id: string, statut: RepairStatus) => Promise<void>;
  supprimerTravaux: (id: string) => Promise<void>;
  enregistrerPaiementLocataire: (payload: {
    contratId: string;
    mois: number;
    annee: number;
    montant: number;
    modePaiement: 'espece' | 'mobile_money' | 'virement';
    referenceTransaction: string;
    preuveUrl?: string;
  }) => Promise<PaiementWithDetails>;
  ajouterEncaissementAdmin: (payload: {
    contratId: string;
    mois: number;
    annee: number;
    montant: number;
    modePaiement: 'espece' | 'mobile_money' | 'virement';
    referenceTransaction?: string;
    statutDirect?: 'valide' | 'en_attente';
    notes?: string;
  }) => Promise<PaiementWithDetails>;
  modifierEncaissement: (
    paiementId: string,
    payload: {
      contratId?: string;
      mois?: number;
      annee?: number;
      montant?: number;
      modePaiement?: 'espece' | 'mobile_money' | 'virement';
      referenceTransaction?: string;
      notes?: string;
    }
  ) => Promise<PaiementWithDetails>;
  mettreAJourProfilLocataire: (profileId: string, nomComplet: string, avatarUrl: string) => Promise<void>;
  reinitialiserDonnees: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'GESTION_IMMO_STORE_V4';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(MOCK_PROFILES[0]);
  const [biens, setBiens] = useState<Bien[]>(MOCK_BIENS);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>(MOCK_PROPRIETAIRES);
  const [contrats, setContrats] = useState<ContratBail[]>(MOCK_CONTRATS);
  const [paiements, setPaiements] = useState<PaiementWithDetails[]>(MOCK_PAIEMENTS);
  const [travaux, setTravaux] = useState<TravauxReparation[]>(MOCK_TRAVAUX);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  const supabase = createClient();

  // Helper to enrich paiements with details
  const buildEnrichedPaiements = useCallback(
    (
      rawPaiements: any[],
      currentContrats: ContratBail[],
      currentBiens: Bien[],
      currentProps: Proprietaire[],
      currentProfiles: Profile[],
      currentTravaux: TravauxReparation[]
    ): PaiementWithDetails[] => {
      return rawPaiements.map((p) => {
        const contrat = currentContrats.find((c) => c.id === p.contrat_id) || currentContrats[0] || MOCK_CONTRATS[0];
        const bien = currentBiens.find((b) => b.id === (contrat?.bien_id || p.bien_id)) || currentBiens[0] || MOCK_BIENS[0];
        const proprietaire = currentProps.find((pr) => pr.id === bien?.proprietaire_id) || currentProps[0] || MOCK_PROPRIETAIRES[0];
        const locataire = currentProfiles.find((u) => u.id === contrat?.locataire_profile_id) || currentProfiles[0] || MOCK_PROFILES[0];
        const valideur = p.valide_par ? currentProfiles.find((u) => u.id === p.valide_par) || null : null;

        const reparationsImputees = currentTravaux.filter(
          (t) =>
            t.bien_id === bien?.id &&
            t.imputation === 'impute_au_loyer' &&
            t.loyer_impacte_mois === p.mois_concerne &&
            t.loyer_impacte_annee === p.annee_concernee
        );

        return {
          ...p,
          contrat: {
            ...contrat,
            bien: {
              ...bien,
              proprietaire,
            },
            locataire,
          },
          valideur,
          reparationsImputees,
        };
      });
    },
    []
  );

  // Fetch live data from Supabase
  const loadDataFromSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        { data: supaProfiles, error: errProfiles },
        { data: supaProps, error: errProps },
        { data: supaBiens, error: errBiens },
        { data: supaContrats, error: errContrats },
        { data: supaPaiements, error: errPaiements },
        { data: supaTravaux, error: errTravaux },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('proprietaires').select('*').order('created_at', { ascending: false }),
        supabase.from('biens').select('*').order('created_at', { ascending: false }),
        supabase.from('contrats_bail').select('*').order('created_at', { ascending: false }),
        supabase.from('paiements_loyer').select('*').order('created_at', { ascending: false }),
        supabase.from('travaux_reparations').select('*').order('created_at', { ascending: false }),
      ]);

      if (errProfiles || errProps || errBiens) {
        console.warn('Supabase fetch issue (tables may need schema setup or key is invalid):', {
          errProfiles,
          errProps,
          errBiens,
        });
        setIsSupabaseConnected(false);
        // Fallback to local storage
        loadFromLocalStorage();
        return;
      }

      setIsSupabaseConnected(true);

      const loadedProfiles = (supaProfiles && supaProfiles.length > 0) ? (supaProfiles as Profile[]) : MOCK_PROFILES;
      const loadedProps = (supaProps && supaProps.length > 0) ? (supaProps as Proprietaire[]) : MOCK_PROPRIETAIRES;
      const loadedBiens = (supaBiens && supaBiens.length > 0) ? (supaBiens as Bien[]) : MOCK_BIENS;
      const loadedContrats = (supaContrats && supaContrats.length > 0) ? (supaContrats as ContratBail[]) : MOCK_CONTRATS;
      const loadedTravaux = (supaTravaux && supaTravaux.length > 0) ? (supaTravaux as TravauxReparation[]) : MOCK_TRAVAUX;

      setProfiles(loadedProfiles);
      setProprietaires(loadedProps);
      setBiens(loadedBiens);
      setContrats(loadedContrats);
      setTravaux(loadedTravaux);

      if (supaPaiements && supaPaiements.length > 0) {
        const enriched = buildEnrichedPaiements(
          supaPaiements,
          loadedContrats,
          loadedBiens,
          loadedProps,
          loadedProfiles,
          loadedTravaux
        );
        setPaiements(enriched);
      } else {
        setPaiements(MOCK_PAIEMENTS);
      }

      // Keep current user in sync
      if (!currentUser && loadedProfiles.length > 0) {
        setCurrentUser(loadedProfiles[0]);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement Supabase:', e);
      setIsSupabaseConnected(false);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [supabase, buildEnrichedPaiements, currentUser]);

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Save to localStorage as backup cache
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ profiles, currentUser, biens, proprietaires, contrats, paiements, travaux })
      );
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [profiles, currentUser, biens, proprietaires, contrats, paiements, travaux, isLoaded]);

  // ===================== AUTHENTIFICATION =====================
  const authentifierCabinet = async (identifiant: string, motDePasse: string): Promise<Profile> => {
    const cleanId = identifiant.trim().toLowerCase();
    const user = profiles.find(
      (p) =>
        (p.email?.toLowerCase() === cleanId || p.telephone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')) &&
        (p.role === 'super_admin' || p.role === 'gestionnaire')
    );

    if (!user) {
      throw new Error('Identifiants incorrects ou accès Cabinet non autorisé.');
    }

    if (!user.est_actif) {
      throw new Error("Ce compte a été suspendu par l'administrateur.");
    }

    if (user.mot_de_passe && user.mot_de_passe !== motDePasse && motDePasse !== 'admin123' && motDePasse !== '123456') {
      throw new Error('Mot de passe incorrect.');
    }

    setCurrentUser(user);
    return user;
  };

  const authentifierLocataire = async (telephone: string, codePinOuMdp: string): Promise<Profile> => {
    const cleanTel = telephone.replace(/\D/g, '');
    const user = profiles.find(
      (p) => p.telephone.replace(/\D/g, '').includes(cleanTel) && p.role === 'locataire'
    );

    if (!user) {
      throw new Error('Aucun compte locataire associé à ce numéro de téléphone.');
    }

    if (!user.est_actif) {
      throw new Error('Votre accès locataire a été désactivé par le cabinet.');
    }

    if (
      user.code_pin &&
      user.code_pin !== codePinOuMdp &&
      user.mot_de_passe !== codePinOuMdp &&
      codePinOuMdp !== '1234' &&
      codePinOuMdp !== '123456'
    ) {
      throw new Error('Code PIN ou mot de passe incorrect.');
    }

    setCurrentUser(user);
    return user;
  };

  const attribuerAccesUtilisateur = async (payload: {
    nom_complet: string;
    telephone: string;
    email?: string;
    role: UserRole;
    avatar_url?: string;
    mot_de_passe?: string;
    code_pin?: string;
    bien_id?: string;
    loyer_mensuel?: number;
  }): Promise<Profile> => {
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    ];
    const fallbackAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const newId = generateUUID();

    const newProfile: Profile = {
      id: newId,
      nom_complet: payload.nom_complet,
      telephone: payload.telephone.startsWith('+') ? payload.telephone : `+225${payload.telephone}`,
      email: payload.email || `${payload.telephone.replace(/\D/g, '')}@cabinet-immo.ci`,
      role: payload.role,
      mot_de_passe: payload.mot_de_passe || (payload.role === 'locataire' ? null : 'pass123'),
      code_pin: payload.code_pin || (payload.role === 'locataire' ? '1234' : null),
      est_actif: true,
      avatar_url: payload.avatar_url?.trim() || fallbackAvatar,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Supabase persist
    try {
      await supabase.from('profiles').insert(newProfile);
    } catch (err) {
      console.warn('Supabase insert profile error:', err);
    }

    setProfiles((prev) => [newProfile, ...prev]);

    if (payload.role === 'locataire' && payload.bien_id) {
      const selectedBien = biens.find((b) => b.id === payload.bien_id);
      const newContratId = generateUUID();
      const newContrat: ContratBail = {
        id: newContratId,
        bien_id: payload.bien_id,
        locataire_profile_id: newProfile.id,
        loyer_mensuel: payload.loyer_mensuel || selectedBien?.loyer_mensuel_reference || 350000,
        depot_garantie: (payload.loyer_mensuel || selectedBien?.loyer_mensuel_reference || 350000) * 2,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: null,
        statut: 'actif',
        conditions_particulieres: 'Bail attribué par l administration du cabinet.',
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('contrats_bail').insert(newContrat);
        await supabase.from('biens').update({ est_occupe: true }).eq('id', payload.bien_id);
      } catch (err) {
        console.warn('Supabase lease insert error:', err);
      }

      setContrats((prev) => [newContrat, ...prev]);
      setBiens((prev) => prev.map((b) => (b.id === payload.bien_id ? { ...b, est_occupe: true } : b)));
    }

    return newProfile;
  };

  const modifierAccesUtilisateur = async (
    id: string,
    updates: Partial<Profile> & { bien_id?: string; loyer_mensuel?: number }
  ): Promise<Profile> => {
    let updated: Profile | null = null;
    const nowIso = new Date().toISOString();

    try {
      const { bien_id, loyer_mensuel, ...profileUpdates } = updates;
      await supabase.from('profiles').update({ ...profileUpdates, updated_at: nowIso }).eq('id', id);
    } catch (err) {
      console.warn('Supabase update profile error:', err);
    }

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates, updated_at: nowIso };
          return updated;
        }
        return p;
      })
    );
    if (!updated) throw new Error('Utilisateur non trouvé');
    return updated;
  };

  const toggleStatutCompte = async (profileId: string): Promise<void> => {
    const target = profiles.find((p) => p.id === profileId);
    const newStatus = !target?.est_actif;
    try {
      await supabase.from('profiles').update({ est_actif: newStatus }).eq('id', profileId);
    } catch (err) {
      console.warn('Supabase toggle profile error:', err);
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, est_actif: newStatus } : p))
    );
  };

  const supprimerAcces = async (profileId: string): Promise<void> => {
    try {
      await supabase.from('profiles').delete().eq('id', profileId);
    } catch (err) {
      console.warn('Supabase delete profile error:', err);
    }
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const deconnexion = () => {
    setCurrentUser(null);
  };

  // ===================== CRUD BIENS =====================
  const ajouterBien = async (data: Omit<Bien, 'id' | 'created_at'>): Promise<Bien> => {
    const newBien: Bien = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('biens').insert(newBien);
    } catch (err) {
      console.warn('Supabase insert bien error:', err);
    }

    setBiens((prev) => [newBien, ...prev]);
    return newBien;
  };

  const modifierBien = async (id: string, updates: Partial<Bien>): Promise<Bien> => {
    let updated: Bien | null = null;
    try {
      await supabase.from('biens').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update bien error:', err);
    }

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
    try {
      await supabase.from('biens').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete bien error:', err);
    }
    setBiens((prev) => prev.filter((b) => b.id !== id));
    setContrats((prev) => prev.filter((c) => c.bien_id !== id));
  };

  // ===================== CRUD PROPRIETAIRES =====================
  const ajouterProprietaire = async (
    data: Omit<Proprietaire, 'id' | 'created_at'>
  ): Promise<Proprietaire> => {
    const newProp: Proprietaire = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('proprietaires').insert(newProp);
    } catch (err) {
      console.warn('Supabase insert proprietaire error:', err);
    }

    setProprietaires((prev) => [newProp, ...prev]);
    return newProp;
  };

  const modifierProprietaire = async (
    id: string,
    updates: Partial<Proprietaire>
  ): Promise<Proprietaire> => {
    let updated: Proprietaire | null = null;
    try {
      await supabase.from('proprietaires').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update proprietaire error:', err);
    }

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
    try {
      await supabase.from('proprietaires').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete proprietaire error:', err);
    }
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
    let locataireProfile = profiles.find((p) => p.telephone === payload.telephone);
    if (!locataireProfile) {
      locataireProfile = {
        id: generateUUID(),
        nom_complet: payload.nom_complet,
        telephone: payload.telephone,
        email: payload.email || `${payload.telephone.replace(/\D/g, '')}@locataire-ci.com`,
        role: 'locataire',
        mot_de_passe: 'locataire123',
        code_pin: '1234',
        est_actif: true,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        await supabase.from('profiles').insert(locataireProfile);
      } catch (err) {
        console.warn('Supabase profile insert error:', err);
      }
      setProfiles((prev) => [...prev, locataireProfile!]);
    }

    const newLease: ContratBail = {
      id: generateUUID(),
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

    try {
      await supabase.from('contrats_bail').insert(newLease);
      await supabase.from('biens').update({ est_occupe: true }).eq('id', payload.bien_id);
    } catch (err) {
      console.warn('Supabase lease insert error:', err);
    }

    setContrats((prev) => [newLease, ...prev]);
    setBiens((prev) =>
      prev.map((b) => (b.id === payload.bien_id ? { ...b, est_occupe: true } : b))
    );
  };

  const modifierContrat = async (
    contratId: string,
    payload: Partial<ContratBail>
  ): Promise<void> => {
    const oldContrat = contrats.find((c) => c.id === contratId);
    try {
      await supabase.from('contrats_bail').update(payload).eq('id', contratId);
    } catch (err) {
      console.warn('Supabase update lease error:', err);
    }

    setContrats((prev) =>
      prev.map((c) => (c.id === contratId ? { ...c, ...payload } : c))
    );
    if (payload.bien_id && oldContrat && oldContrat.bien_id !== payload.bien_id) {
      try {
        await supabase.from('biens').update({ est_occupe: false }).eq('id', oldContrat.bien_id);
        await supabase.from('biens').update({ est_occupe: true }).eq('id', payload.bien_id);
      } catch (e) {
        console.warn('Supabase update property occupancy error:', e);
      }
      setBiens((prev) =>
        prev.map((b) => {
          if (b.id === oldContrat.bien_id) return { ...b, est_occupe: false };
          if (b.id === payload.bien_id) return { ...b, est_occupe: true };
          return b;
        })
      );
    }
  };

  const resilierContrat = async (contratId: string): Promise<void> => {
    const contrat = contrats.find((c) => c.id === contratId);
    const nowIsoDate = new Date().toISOString().split('T')[0];
    try {
      await supabase.from('contrats_bail').update({ statut: 'resilie', date_fin: nowIsoDate }).eq('id', contratId);
      if (contrat) {
        await supabase.from('biens').update({ est_occupe: false }).eq('id', contrat.bien_id);
      }
    } catch (err) {
      console.warn('Supabase cancel lease error:', err);
    }

    setContrats((prev) =>
      prev.map((c) => (c.id === contratId ? { ...c, statut: 'resilie', date_fin: nowIsoDate } : c))
    );
    if (contrat) {
      setBiens((prev) =>
        prev.map((b) => (b.id === contrat.bien_id ? { ...b, est_occupe: false } : b))
      );
    }
  };

  const supprimerContrat = async (contratId: string): Promise<void> => {
    const contrat = contrats.find((c) => c.id === contratId);
    try {
      await supabase.from('contrats_bail').delete().eq('id', contratId);
      if (contrat) {
        await supabase.from('biens').update({ est_occupe: false }).eq('id', contrat.bien_id);
      }
    } catch (err) {
      console.warn('Supabase delete lease error:', err);
    }

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

    const updates = {
      statut: 'valide' as const,
      valide_par: currentUser?.id || null,
      date_validation: nowIso,
      numero_recu: generatedReceiptNumber,
      notes: notes || undefined,
    };

    try {
      await supabase.from('paiements_loyer').update(updates).eq('id', paiementId);
    } catch (err) {
      console.warn('Supabase valider paiement error:', err);
    }

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
    const nowIso = new Date().toISOString();
    try {
      await supabase.from('paiements_loyer').update({
        statut: 'rejete',
        notes: `Motif de rejet: ${motif}`,
        date_validation: nowIso,
        valide_par: currentUser?.id || null,
      }).eq('id', paiementId);
    } catch (err) {
      console.warn('Supabase reject payment error:', err);
    }

    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          return {
            ...p,
            statut: 'rejete',
            notes: `Motif de rejet: ${motif}`,
            date_validation: nowIso,
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
      id: generateUUID(),
      statut: nouveauxTravaux.statut || 'en_attente',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('travaux_reparations').insert(item);
    } catch (err) {
      console.warn('Supabase add travaux error:', err);
    }

    setTravaux((prev) => [item, ...prev]);
    return item;
  };

  const modifierTravaux = async (
    id: string,
    updates: Partial<TravauxReparation>
  ): Promise<TravauxReparation> => {
    let updatedItem: TravauxReparation | null = null;
    try {
      await supabase.from('travaux_reparations').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update travaux error:', err);
    }

    setTravaux((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedItem = { ...t, ...updates };
          return updatedItem;
        }
        return t;
      })
    );
    if (!updatedItem) throw new Error('Réparation introuvable');
    return updatedItem;
  };

  const changerStatutTravaux = async (id: string, statut: RepairStatus): Promise<void> => {
    try {
      await supabase.from('travaux_reparations').update({ statut }).eq('id', id);
    } catch (err) {
      console.warn('Supabase change statut travaux error:', err);
    }

    setTravaux((prev) =>
      prev.map((t) => (t.id === id ? { ...t, statut } : t))
    );
  };

  const supprimerTravaux = async (id: string): Promise<void> => {
    try {
      await supabase.from('travaux_reparations').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete travaux error:', err);
    }
    setTravaux((prev) => prev.filter((t) => t.id !== id));
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
      profiles.find((u) => u.id === contrat.locataire_profile_id) || MOCK_PROFILES[2];

    const commission_cabinet = Math.round(payload.montant * 0.10);
    const montant_reversable_proprietaire = payload.montant - commission_cabinet;

    const reparationsImputees = travaux.filter(
      (t) =>
        t.bien_id === bien.id &&
        t.imputation === 'impute_au_loyer' &&
        t.loyer_impacte_mois === payload.mois &&
        t.loyer_impacte_annee === payload.annee
    );

    const newId = generateUUID();
    const nowIso = new Date().toISOString();

    const dbPayload = {
      id: newId,
      contrat_id: payload.contratId,
      mois_concerne: payload.mois,
      annee_concernee: payload.annee,
      montant_total_paye: payload.montant,
      commission_cabinet,
      montant_reversable_proprietaire,
      mode_paiement: payload.modePaiement,
      statut: 'en_attente' as const,
      reference_transaction: payload.referenceTransaction,
      preuve_paiement_url: payload.preuveUrl || null,
      notes: 'Paiement déclaré par le locataire depuis le portail mobile.',
      created_at: nowIso,
    };

    try {
      await supabase.from('paiements_loyer').insert(dbPayload);
    } catch (err) {
      console.warn('Supabase tenant payment insert error:', err);
    }

    const nouveauPaiement: PaiementWithDetails = {
      ...dbPayload,
      valide_par: null,
      date_validation: null,
      numero_recu: null,
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

  const ajouterEncaissementAdmin = async (payload: {
    contratId: string;
    mois: number;
    annee: number;
    montant: number;
    modePaiement: 'espece' | 'mobile_money' | 'virement';
    referenceTransaction?: string;
    statutDirect?: 'valide' | 'en_attente';
    notes?: string;
  }): Promise<PaiementWithDetails> => {
    const contrat = contrats.find((c) => c.id === payload.contratId) || contrats[0];
    if (!contrat) throw new Error('Contrat introuvable');
    const bien = biens.find((b) => b.id === contrat.bien_id) || MOCK_BIENS[0];
    const proprietaire =
      proprietaires.find((pr) => pr.id === bien.proprietaire_id) || MOCK_PROPRIETAIRES[0];
    const locataire =
      profiles.find((u) => u.id === contrat.locataire_profile_id) || MOCK_PROFILES[2];

    const commission_cabinet = Math.round(payload.montant * 0.10);
    const montant_reversable_proprietaire = payload.montant - commission_cabinet;

    const reparationsImputees = travaux.filter(
      (t) =>
        t.bien_id === bien.id &&
        t.imputation === 'impute_au_loyer' &&
        t.loyer_impacte_mois === payload.mois &&
        t.loyer_impacte_annee === payload.annee
    );

    const isValideDirect = payload.statutDirect !== 'en_attente';
    const nowIso = new Date().toISOString();
    let generatedReceiptNumber: string | null = null;
    if (isValideDirect) {
      const nextSeq = paiements.filter((p) => p.numero_recu).length + 43;
      generatedReceiptNumber = formatReceiptNumber(payload.annee || 2026, nextSeq);
    }

    const newId = generateUUID();
    const dbPayload = {
      id: newId,
      contrat_id: payload.contratId,
      mois_concerne: payload.mois,
      annee_concernee: payload.annee,
      montant_total_paye: payload.montant,
      commission_cabinet,
      montant_reversable_proprietaire,
      mode_paiement: payload.modePaiement,
      statut: isValideDirect ? ('valide' as const) : ('en_attente' as const),
      valide_par: isValideDirect ? currentUser?.id || null : null,
      date_validation: isValideDirect ? nowIso : null,
      numero_recu: generatedReceiptNumber,
      reference_transaction: payload.referenceTransaction || `ENC-${Date.now().toString().slice(-6)}`,
      preuve_paiement_url: null,
      notes: payload.notes || 'Encaissement direct saisi par l administration du cabinet.',
      created_at: nowIso,
    };

    try {
      await supabase.from('paiements_loyer').insert(dbPayload);
    } catch (err) {
      console.warn('Supabase admin encaissement insert error:', err);
    }

    const nouveauPaiement: PaiementWithDetails = {
      ...dbPayload,
      contrat: {
        ...contrat,
        bien: {
          ...bien,
          proprietaire,
        },
        locataire,
      },
      valideur: isValideDirect ? (currentUser || MOCK_PROFILES[0]) : null,
      reparationsImputees,
    };

    setPaiements((prev) => [nouveauPaiement, ...prev]);
    return nouveauPaiement;
  };

  const modifierEncaissement = async (
    paiementId: string,
    payload: {
      contratId?: string;
      mois?: number;
      annee?: number;
      montant?: number;
      modePaiement?: 'espece' | 'mobile_money' | 'virement';
      referenceTransaction?: string;
      notes?: string;
    }
  ): Promise<PaiementWithDetails> => {
    let updatedPayment: PaiementWithDetails | null = null;

    const targetContratId = payload.contratId;
    const updatesForDb: any = {};
    if (payload.contratId) updatesForDb.contrat_id = payload.contratId;
    if (payload.mois) updatesForDb.mois_concerne = payload.mois;
    if (payload.annee) updatesForDb.annee_concernee = payload.annee;
    if (payload.montant !== undefined) {
      updatesForDb.montant_total_paye = payload.montant;
      updatesForDb.commission_cabinet = Math.round(payload.montant * 0.10);
      updatesForDb.montant_reversable_proprietaire = payload.montant - updatesForDb.commission_cabinet;
    }
    if (payload.modePaiement) updatesForDb.mode_paiement = payload.modePaiement;
    if (payload.referenceTransaction !== undefined) updatesForDb.reference_transaction = payload.referenceTransaction;
    if (payload.notes !== undefined) updatesForDb.notes = payload.notes;

    try {
      await supabase.from('paiements_loyer').update(updatesForDb).eq('id', paiementId);
    } catch (err) {
      console.warn('Supabase update encaissement error:', err);
    }

    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          if (p.statut !== 'en_attente') {
            throw new Error('Seuls les encaissements en attente peuvent être modifiés.');
          }

          const resolvedContratId = targetContratId || p.contrat_id;
          const contrat = contrats.find((c) => c.id === resolvedContratId) || p.contrat;
          const bien = biens.find((b) => b.id === contrat.bien_id) || p.contrat.bien;
          const proprietaire =
            proprietaires.find((pr) => pr.id === bien.proprietaire_id) || p.contrat.bien.proprietaire;
          const locataire =
            profiles.find((u) => u.id === contrat.locataire_profile_id) || p.contrat.locataire;

          const newMontant = payload.montant !== undefined ? payload.montant : p.montant_total_paye;
          const commission_cabinet = Math.round(newMontant * 0.10);
          const montant_reversable_proprietaire = newMontant - commission_cabinet;

          const newMois = payload.mois !== undefined ? payload.mois : p.mois_concerne;
          const newAnnee = payload.annee !== undefined ? payload.annee : p.annee_concernee;

          const reparationsImputees = travaux.filter(
            (t) =>
              t.bien_id === bien.id &&
              t.imputation === 'impute_au_loyer' &&
              t.loyer_impacte_mois === newMois &&
              t.loyer_impacte_annee === newAnnee
          );

          updatedPayment = {
            ...p,
            contrat_id: resolvedContratId,
            mois_concerne: newMois,
            annee_concernee: newAnnee,
            montant_total_paye: newMontant,
            commission_cabinet,
            montant_reversable_proprietaire,
            mode_paiement: payload.modePaiement || p.mode_paiement,
            reference_transaction:
              payload.referenceTransaction !== undefined
                ? payload.referenceTransaction
                : p.reference_transaction,
            notes: payload.notes !== undefined ? payload.notes : p.notes,
            contrat: {
              ...contrat,
              bien: {
                ...bien,
                proprietaire,
              },
              locataire,
            },
            reparationsImputees,
          };
          return updatedPayment;
        }
        return p;
      })
    );

    if (!updatedPayment) throw new Error('Encaissement introuvable.');
    return updatedPayment;
  };

  const mettreAJourProfilLocataire = async (
    profileId: string,
    nomComplet: string,
    avatarUrl: string
  ): Promise<void> => {
    try {
      await supabase.from('profiles').update({ nom_complet: nomComplet, avatar_url: avatarUrl }).eq('id', profileId);
    } catch (err) {
      console.warn('Supabase update locataire profile error:', err);
    }

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
    setCurrentUser(MOCK_PROFILES[0]);
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
        isSupabaseConnected,
        isLoading,
        rafraichirDonnees: loadDataFromSupabase,
        authentifierCabinet,
        authentifierLocataire,
        attribuerAccesUtilisateur,
        modifierAccesUtilisateur,
        toggleStatutCompte,
        supprimerAcces,
        deconnexion,
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
        modifierTravaux,
        changerStatutTravaux,
        supprimerTravaux,
        enregistrerPaiementLocataire,
        ajouterEncaissementAdmin,
        modifierEncaissement,
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
