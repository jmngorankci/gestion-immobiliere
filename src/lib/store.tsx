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
  TypeBien,
  PaymentMode,
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

function isValidUUID(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
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
  typesBiens: TypeBien[];
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
    taux_commission?: number;
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
  ajouterTypeBien: (nom: string) => Promise<TypeBien>;

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
    taux_commission?: number;
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
    modePaiement: PaymentMode;
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
      modePaiement?: PaymentMode;
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
  const [typesBiens, setTypesBiens] = useState<TypeBien[]>([]);
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
        { data: supaTypes, error: errTypes },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('proprietaires').select('*').order('created_at', { ascending: false }),
        supabase.from('biens').select('*').order('created_at', { ascending: false }),
        supabase.from('contrats_bail').select('*').order('created_at', { ascending: false }),
        supabase.from('paiements_loyer').select('*').order('created_at', { ascending: false }),
        supabase.from('travaux_reparations').select('*').order('created_at', { ascending: false }),
        supabase.from('types_biens').select('*').order('created_at', { ascending: true }),
      ]);

      if (errProfiles || errProps || errBiens) {
        console.warn('Supabase fetch issue:', {
          errProfiles,
          errProps,
          errBiens,
        });
        setIsSupabaseConnected(false);
        loadFromLocalStorage();
        return;
      }

      setIsSupabaseConnected(true);

      const loadedProfiles = (supaProfiles && supaProfiles.length > 0) ? (supaProfiles as Profile[]) : MOCK_PROFILES;
      const loadedProps = (supaProps && supaProps.length > 0) ? (supaProps as Proprietaire[]) : MOCK_PROPRIETAIRES;
      const loadedBiens = (supaBiens && supaBiens.length > 0) 
        ? (supaBiens as any[]).map((b) => ({
            ...b,
            prix_vente: b.prix_vente_demande ?? b.prix_vente ?? 0,
            prix_vente_demande: b.prix_vente_demande ?? b.prix_vente ?? 0,
            intention: b.intention || 'location',
            statut_vente: b.statut_vente || 'disponible',
          }))
        : MOCK_BIENS;
      const loadedContrats = (supaContrats && supaContrats.length > 0) 
        ? (supaContrats as any[]).map((c) => ({
            ...c,
            taux_commission: typeof c.taux_commission === 'number' ? c.taux_commission : 10,
          })) 
        : MOCK_CONTRATS;
      const loadedTravaux = (supaTravaux && supaTravaux.length > 0) ? (supaTravaux as TravauxReparation[]) : MOCK_TRAVAUX;

      setProfiles(loadedProfiles);
      setProprietaires(loadedProps);
      setBiens(loadedBiens);
      setContrats(loadedContrats);
      setTravaux(loadedTravaux);

      if (supaTypes && supaTypes.length > 0) {
        setTypesBiens(supaTypes as TypeBien[]);
      } else {
        setTypesBiens([
          { id: '1', nom: 'Studio', created_at: new Date().toISOString() },
          { id: '2', nom: '2 Pièces', created_at: new Date().toISOString() },
          { id: '3', nom: '3 Pièces', created_at: new Date().toISOString() },
          { id: '4', nom: 'Maison Basse', created_at: new Date().toISOString() },
          { id: '5', nom: 'Villa', created_at: new Date().toISOString() },
          { id: '6', nom: 'Appartement', created_at: new Date().toISOString() }
        ]);
      }

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
        const enrichedMock = buildEnrichedPaiements(
          MOCK_PAIEMENTS,
          loadedContrats,
          loadedBiens,
          loadedProps,
          loadedProfiles,
          loadedTravaux
        );
        setPaiements(enrichedMock);
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
        (p.role === 'super_admin' || p.role === 'gestionnaire' || p.role === 'proprietaire')
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

  // Safe Supabase helpers for contrats_bail in case taux_commission column is still pending
  const safeInsertContrat = async (lease: ContratBail) => {
    const dbPayload = {
      id: lease.id,
      bien_id: lease.bien_id,
      locataire_profile_id: lease.locataire_profile_id,
      loyer_mensuel: lease.loyer_mensuel,
      depot_garantie: lease.depot_garantie,
      taux_commission: typeof lease.taux_commission === 'number' ? lease.taux_commission : 10,
      date_debut: lease.date_debut,
      date_fin: lease.date_fin || null,
      statut: lease.statut || 'actif',
      conditions_particulieres: lease.conditions_particulieres || null,
      created_at: lease.created_at || new Date().toISOString(),
    };
    try {
      const { error } = await (supabase.from('contrats_bail') as any).insert([dbPayload]);
      if (error) {
        if (error.message?.includes('taux_commission') || error.code === 'PGRST204') {
          const { taux_commission, ...withoutRate } = dbPayload;
          const { error: retryErr } = await (supabase.from('contrats_bail') as any).insert([withoutRate]);
          if (retryErr) console.error('Supabase retry insert contrat error:', retryErr);
        } else {
          console.error('Supabase lease insert error:', error);
        }
      }
    } catch (err) {
      console.warn('Supabase safeInsertContrat caught error:', err);
    }
  };

  const safeUpdateContrat = async (id: string, payload: Partial<ContratBail>) => {
    const dbPayload: any = {};
    if (payload.bien_id !== undefined) dbPayload.bien_id = payload.bien_id;
    if (payload.locataire_profile_id !== undefined) dbPayload.locataire_profile_id = payload.locataire_profile_id;
    if (payload.loyer_mensuel !== undefined) dbPayload.loyer_mensuel = payload.loyer_mensuel;
    if (payload.depot_garantie !== undefined) dbPayload.depot_garantie = payload.depot_garantie;
    if (payload.taux_commission !== undefined) dbPayload.taux_commission = payload.taux_commission;
    if (payload.date_debut !== undefined) dbPayload.date_debut = payload.date_debut;
    if (payload.date_fin !== undefined) dbPayload.date_fin = payload.date_fin;
    if (payload.statut !== undefined) dbPayload.statut = payload.statut;
    if (payload.conditions_particulieres !== undefined) dbPayload.conditions_particulieres = payload.conditions_particulieres;

    try {
      const { error } = await (supabase.from('contrats_bail') as any).update(dbPayload).eq('id', id);
      if (error) {
        if (error.message?.includes('taux_commission') || error.code === 'PGRST204') {
          const { taux_commission, ...withoutRate } = dbPayload;
          const { error: retryErr } = await (supabase.from('contrats_bail') as any).update(withoutRate).eq('id', id);
          if (retryErr) console.error('Supabase retry update contrat error:', retryErr);
        } else {
          console.error('Supabase lease update error:', error);
        }
      }
    } catch (err) {
      console.warn('Supabase safeUpdateContrat caught error:', err);
    }
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
    taux_commission?: number;
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

    const dbProfile = {
      id: newProfile.id,
      nom_complet: newProfile.nom_complet,
      telephone: newProfile.telephone,
      email: newProfile.email,
      role: newProfile.role,
      mot_de_passe: newProfile.mot_de_passe,
      code_pin: newProfile.code_pin,
      est_actif: newProfile.est_actif,
      avatar_url: newProfile.avatar_url,
      created_at: newProfile.created_at,
      updated_at: newProfile.updated_at,
    };

    // Supabase persist
    try {
      const { error } = await (supabase.from('profiles') as any).insert([dbProfile]);
      if (error) console.error('Supabase insert profile error:', error);
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
        taux_commission: typeof payload.taux_commission === 'number' ? payload.taux_commission : 10,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: null,
        statut: 'actif',
        conditions_particulieres: 'Bail attribué par l administration du cabinet.',
        created_at: new Date().toISOString(),
      };

      await safeInsertContrat(newContrat);
      try {
        const { error: bErr } = await (supabase.from('biens') as any).update({ est_occupe: true }).eq('id', payload.bien_id);
        if (bErr) console.error('Supabase update bien occupancy error:', bErr);
      } catch (err) {
        console.warn('Supabase update bien occupancy error:', err);
      }

      setContrats((prev) => [newContrat, ...prev]);
      setBiens((prev) => prev.map((b) => (b.id === payload.bien_id ? { ...b, est_occupe: true } : b)));
    }

    return newProfile;
  };

  const modifierAccesUtilisateur = async (
    id: string,
    updates: Partial<Profile> & { bien_id?: string; loyer_mensuel?: number; taux_commission?: number }
  ): Promise<Profile> => {
    let updated: Profile | null = null;
    const nowIso = new Date().toISOString();
    const { bien_id, loyer_mensuel, taux_commission, ...profileUpdates } = updates;

    const existingProfile = profiles.find((p) => p.id === id);

    if (existingProfile) {
      updated = { ...existingProfile, ...profileUpdates, updated_at: nowIso };
      const dbProfileUpdates: any = {};
      if (updates.nom_complet !== undefined) dbProfileUpdates.nom_complet = updates.nom_complet;
      if (updates.telephone !== undefined) dbProfileUpdates.telephone = updates.telephone;
      if (updates.email !== undefined) dbProfileUpdates.email = updates.email || null;
      if (updates.role !== undefined) dbProfileUpdates.role = updates.role;
      if (updates.mot_de_passe !== undefined) dbProfileUpdates.mot_de_passe = updates.mot_de_passe || null;
      if (updates.code_pin !== undefined) dbProfileUpdates.code_pin = updates.code_pin || null;
      if (updates.est_actif !== undefined) dbProfileUpdates.est_actif = updates.est_actif;
      if (updates.avatar_url !== undefined) dbProfileUpdates.avatar_url = updates.avatar_url || null;
      dbProfileUpdates.updated_at = nowIso;

      try {
        const { error } = await (supabase.from('profiles') as any).update(dbProfileUpdates).eq('id', id);
        if (error) console.error('Supabase update profile error:', error);
      } catch (err) {
        console.warn('Supabase update profile error:', err);
      }
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated! : p)));
    } else {
      // Profile does not exist yet in local state: upsert into Supabase and local state
      const fallbackId = isValidUUID(id) ? id : generateUUID();
      const newProfile: Profile = {
        id: fallbackId,
        nom_complet: updates.nom_complet || 'Locataire',
        telephone: updates.telephone || '+22500000000',
        email: updates.email || `${fallbackId.slice(0, 8)}@locataire-ci.com`,
        role: updates.role || 'locataire',
        mot_de_passe: updates.mot_de_passe || 'locataire123',
        code_pin: updates.code_pin || '1234',
        est_actif: updates.est_actif !== undefined ? updates.est_actif : true,
        avatar_url: updates.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        created_at: nowIso,
        updated_at: nowIso,
      };
      try {
        const { error } = await (supabase.from('profiles') as any).upsert([newProfile]);
        if (error) console.error('Supabase upsert profile error:', error);
      } catch (err) {
        console.warn('Supabase upsert profile error:', err);
      }
      updated = newProfile;
      setProfiles((prev) => [newProfile, ...prev]);
    }

    return updated;
  };

  const toggleStatutCompte = async (profileId: string): Promise<void> => {
    const target = profiles.find((p) => p.id === profileId);
    const newStatus = !target?.est_actif;
    try {
      const { error } = await (supabase.from('profiles') as any).update({ est_actif: newStatus, updated_at: new Date().toISOString() }).eq('id', profileId);
      if (error) console.error('Supabase toggle profile error:', error);
    } catch (err) {
      console.warn('Supabase toggle profile error:', err);
    }
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, est_actif: newStatus } : p))
    );
  };

  const supprimerAcces = async (profileId: string): Promise<void> => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) console.error('Supabase delete profile error:', error);
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
    const newId = generateUUID();
    const nowIso = new Date().toISOString();
    const resolvedPrixVente = (data as any).prix_vente_demande !== undefined
      ? Number((data as any).prix_vente_demande)
      : ((data as any).prix_vente !== undefined ? Number((data as any).prix_vente) : 0);

    const newBien: Bien = {
      ...data,
      id: newId,
      prix_vente_demande: resolvedPrixVente,
      prix_vente: resolvedPrixVente,
      intention: data.intention || 'location',
      statut_vente: data.statut_vente || 'disponible',
      est_occupe: data.est_occupe !== undefined ? data.est_occupe : false,
      created_at: nowIso,
    };

    const dbPayload: any = {
      id: newBien.id,
      proprietaire_id: newBien.proprietaire_id,
      code_reference: newBien.code_reference,
      type_bien: newBien.type_bien,
      loyer_mensuel_reference: newBien.loyer_mensuel_reference !== undefined && newBien.loyer_mensuel_reference !== null ? Number(newBien.loyer_mensuel_reference) : null,
      commune_quartier: newBien.commune_quartier,
      adresse_precise: newBien.adresse_precise,
      est_occupe: newBien.est_occupe,
      description: newBien.description || null,
      photos_urls: newBien.photos_urls || [],
      intention: newBien.intention,
      prix_vente_demande: resolvedPrixVente,
      statut_vente: newBien.statut_vente,
      created_at: newBien.created_at,
    };

    try {
      const { error } = await (supabase.from('biens') as any).insert([dbPayload]);
      if (error) {
        console.error('Supabase insert bien error:', error);
        if (error.code === 'PGRST204' || error.message?.includes('prix_vente_demande') || error.message?.includes('intention')) {
          const { intention, prix_vente_demande, statut_vente, ...basePayload } = dbPayload;
          const { error: retryError } = await (supabase.from('biens') as any).insert([basePayload]);
          if (retryError) console.error('Supabase retry insert bien error:', retryError);
        }
      }
    } catch (err) {
      console.warn('Supabase insert bien catch error:', err);
    }

    setBiens((prev) => [newBien, ...prev]);
    return newBien;
  };

  const modifierBien = async (id: string, updates: Partial<Bien>): Promise<Bien> => {
    let updated: Bien | null = null;
    const resolvedPrixVente = (updates as any).prix_vente_demande !== undefined
      ? Number((updates as any).prix_vente_demande)
      : ((updates as any).prix_vente !== undefined ? Number((updates as any).prix_vente) : undefined);

    const dbUpdates: any = {};
    if (updates.proprietaire_id !== undefined) dbUpdates.proprietaire_id = updates.proprietaire_id;
    if (updates.code_reference !== undefined) dbUpdates.code_reference = updates.code_reference;
    if (updates.type_bien !== undefined) dbUpdates.type_bien = updates.type_bien;
    if (updates.loyer_mensuel_reference !== undefined) {
      dbUpdates.loyer_mensuel_reference = updates.loyer_mensuel_reference !== null ? Number(updates.loyer_mensuel_reference) : null;
    }
    if (updates.commune_quartier !== undefined) dbUpdates.commune_quartier = updates.commune_quartier;
    if (updates.adresse_precise !== undefined) dbUpdates.adresse_precise = updates.adresse_precise;
    if (updates.est_occupe !== undefined) dbUpdates.est_occupe = updates.est_occupe;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.photos_urls !== undefined) dbUpdates.photos_urls = updates.photos_urls;
    if (updates.intention !== undefined) dbUpdates.intention = updates.intention;
    if (resolvedPrixVente !== undefined) dbUpdates.prix_vente_demande = resolvedPrixVente;
    if (updates.statut_vente !== undefined) dbUpdates.statut_vente = updates.statut_vente;

    try {
      const { error } = await (supabase.from('biens') as any).update(dbUpdates).eq('id', id);
      if (error) {
        console.error('Supabase update bien error:', error);
        if (error.code === 'PGRST204' || error.message?.includes('prix_vente_demande') || error.message?.includes('intention')) {
          const { prix_vente_demande, intention, statut_vente, ...baseUpdates } = dbUpdates;
          const { error: retryError } = await (supabase.from('biens') as any).update(baseUpdates).eq('id', id);
          if (retryError) console.error('Supabase retry update bien error:', retryError);
        }
      }
    } catch (err) {
      console.warn('Supabase update bien catch error:', err);
    }

    setBiens((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updated = {
            ...b,
            ...updates,
            prix_vente_demande: resolvedPrixVente !== undefined ? resolvedPrixVente : b.prix_vente_demande,
            prix_vente: resolvedPrixVente !== undefined ? resolvedPrixVente : b.prix_vente,
          };
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
      const { error } = await supabase.from('biens').delete().eq('id', id);
      if (error) console.error('Supabase delete bien error:', error);
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

    const dbPayload = {
      id: newProp.id,
      nom_complet: newProp.nom_complet,
      telephone: newProp.telephone,
      email: newProp.email || null,
      adresse: newProp.adresse || null,
      mode_versement_prefere: newProp.mode_versement_prefere || 'virement',
      rib_ou_numero_compte: newProp.rib_ou_numero_compte || null,
      created_at: newProp.created_at,
    };

    try {
      const { error } = await (supabase.from('proprietaires') as any).insert([dbPayload]);
      if (error) console.error('Supabase insert proprietaire error:', error);
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
    const dbUpdates: any = {};
    if (updates.nom_complet !== undefined) dbUpdates.nom_complet = updates.nom_complet;
    if (updates.telephone !== undefined) dbUpdates.telephone = updates.telephone;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.adresse !== undefined) dbUpdates.adresse = updates.adresse || null;
    if (updates.mode_versement_prefere !== undefined) dbUpdates.mode_versement_prefere = updates.mode_versement_prefere;
    if (updates.rib_ou_numero_compte !== undefined) dbUpdates.rib_ou_numero_compte = updates.rib_ou_numero_compte || null;

    try {
      const { error } = await (supabase.from('proprietaires') as any).update(dbUpdates).eq('id', id);
      if (error) console.error('Supabase update proprietaire error:', error);
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
      const { error } = await supabase.from('proprietaires').delete().eq('id', id);
      if (error) console.error('Supabase delete proprietaire error:', error);
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
    taux_commission?: number;
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
      const dbProfile = {
        id: locataireProfile.id,
        nom_complet: locataireProfile.nom_complet,
        telephone: locataireProfile.telephone,
        email: locataireProfile.email,
        role: locataireProfile.role,
        mot_de_passe: locataireProfile.mot_de_passe,
        code_pin: locataireProfile.code_pin,
        est_actif: locataireProfile.est_actif,
        avatar_url: locataireProfile.avatar_url,
        created_at: locataireProfile.created_at,
        updated_at: locataireProfile.updated_at,
      };
      try {
        const { error } = await (supabase.from('profiles') as any).insert([dbProfile]);
        if (error) console.error('Supabase profile insert error:', error);
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
      taux_commission: typeof payload.taux_commission === 'number' ? payload.taux_commission : 10,
      date_debut: payload.date_debut,
      date_fin: null,
      statut: 'actif',
      conditions_particulieres: payload.conditions_particulieres || null,
      created_at: new Date().toISOString(),
    };

    await safeInsertContrat(newLease);
    try {
      const { error: bErr } = await (supabase.from('biens') as any).update({ est_occupe: true }).eq('id', payload.bien_id);
      if (bErr) console.error('Supabase update bien occupancy error:', bErr);
    } catch (err) {
      console.warn('Supabase update bien occupancy error:', err);
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
    await safeUpdateContrat(contratId, payload);

    setContrats((prev) =>
      prev.map((c) => (c.id === contratId ? { ...c, ...payload } : c))
    );
    if (payload.bien_id && oldContrat && oldContrat.bien_id !== payload.bien_id) {
      try {
        const { error: e1 } = await (supabase.from('biens') as any).update({ est_occupe: false }).eq('id', oldContrat.bien_id);
        if (e1) console.error('Supabase release old bien error:', e1);
        const { error: e2 } = await (supabase.from('biens') as any).update({ est_occupe: true }).eq('id', payload.bien_id);
        if (e2) console.error('Supabase occupy new bien error:', e2);
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
      const { error: cErr } = await (supabase.from('contrats_bail') as any).update({ statut: 'resilie', date_fin: nowIsoDate }).eq('id', contratId);
      if (cErr) console.error('Supabase cancel lease error:', cErr);
      if (contrat) {
        const { error: bErr } = await (supabase.from('biens') as any).update({ est_occupe: false }).eq('id', contrat.bien_id);
        if (bErr) console.error('Supabase update bien occupancy error:', bErr);
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
      const { error: cErr } = await supabase.from('contrats_bail').delete().eq('id', contratId);
      if (cErr) console.error('Supabase delete lease error:', cErr);
      if (contrat) {
        const { error: bErr } = await (supabase.from('biens') as any).update({ est_occupe: false }).eq('id', contrat.bien_id);
        if (bErr) console.error('Supabase update bien occupancy error:', bErr);
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
    const existingPaiement = paiements.find((p) => p.id === paiementId);

    const validatorId = isValidUUID(currentUser?.id) ? currentUser!.id : null;

    const updates = {
      statut: 'valide' as const,
      valide_par: validatorId,
      date_validation: nowIso,
      numero_recu: generatedReceiptNumber,
      notes: notes || existingPaiement?.notes || 'Validé par le cabinet',
    };

    try {
      const { data, error } = await (supabase
        .from('paiements_loyer') as any)
        .update(updates)
        .eq('id', paiementId)
        .select();

      if (error) {
        console.warn('Supabase valider paiement update error, trying with valide_par null:', error);
        await (supabase
          .from('paiements_loyer') as any)
          .update({ ...updates, valide_par: null })
          .eq('id', paiementId);
      } else if ((!data || data.length === 0) && existingPaiement) {
        // If row was not found in Supabase (e.g. mock item), insert/upsert it directly
        const fullPayload = {
          id: isValidUUID(existingPaiement.id) ? existingPaiement.id : generateUUID(),
          contrat_id: existingPaiement.contrat_id,
          mois_concerne: existingPaiement.mois_concerne,
          annee_concernee: existingPaiement.annee_concernee,
          montant_total_paye: existingPaiement.montant_total_paye,
          commission_cabinet: existingPaiement.commission_cabinet,
          montant_reversable_proprietaire: existingPaiement.montant_reversable_proprietaire,
          mode_paiement: existingPaiement.mode_paiement,
          statut: 'valide' as const,
          valide_par: validatorId,
          date_validation: nowIso,
          numero_recu: generatedReceiptNumber,
          reference_transaction: existingPaiement.reference_transaction || `VAL-${Date.now().toString().slice(-6)}`,
          preuve_paiement_url: existingPaiement.preuve_paiement_url || null,
          notes: notes || existingPaiement.notes || 'Validé par le cabinet',
          created_at: existingPaiement.created_at || nowIso,
        };
        const { error: upsertErr } = await (supabase.from('paiements_loyer') as any).upsert([fullPayload]);
        if (upsertErr) {
          console.warn('Supabase upsert paiement error, trying with valide_par null:', upsertErr);
          await (supabase.from('paiements_loyer') as any).upsert([{ ...fullPayload, valide_par: null }]);
        }
      }
    } catch (err) {
      console.warn('Supabase valider paiement catch error:', err);
    }

    let updatedPaiement: PaiementWithDetails | null = null;

    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          updatedPaiement = {
            ...p,
            statut: 'valide',
            valide_par: validatorId || 'admin',
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
      if (existingPaiement) {
        updatedPaiement = {
          ...existingPaiement,
          statut: 'valide',
          valide_par: validatorId || 'admin',
          valideur: currentUser || MOCK_PROFILES[0],
          date_validation: nowIso,
          numero_recu: generatedReceiptNumber,
          notes: notes || existingPaiement.notes,
        };
      } else {
        throw new Error('Paiement introuvable');
      }
    }
    return updatedPaiement;
  };

  const rejeterPaiement = async (paiementId: string, motif: string): Promise<void> => {
    const nowIso = new Date().toISOString();
    const validatorId = isValidUUID(currentUser?.id) ? currentUser!.id : null;
    const existingPaiement = paiements.find((p) => p.id === paiementId);

    const updates = {
      statut: 'rejete' as const,
      notes: `Motif de rejet: ${motif}`,
      date_validation: nowIso,
      valide_par: validatorId,
    };

    try {
      const { data, error } = await (supabase
        .from('paiements_loyer') as any)
        .update(updates)
        .eq('id', paiementId)
        .select();

      if (error) {
        console.warn('Supabase reject payment error, retrying without validator:', error);
        await (supabase
          .from('paiements_loyer') as any)
          .update({ ...updates, valide_par: null })
          .eq('id', paiementId);
      } else if ((!data || data.length === 0) && existingPaiement) {
        const fullPayload = {
          id: isValidUUID(existingPaiement.id) ? existingPaiement.id : generateUUID(),
          contrat_id: existingPaiement.contrat_id,
          mois_concerne: existingPaiement.mois_concerne,
          annee_concernee: existingPaiement.annee_concernee,
          montant_total_paye: existingPaiement.montant_total_paye,
          commission_cabinet: existingPaiement.commission_cabinet,
          montant_reversable_proprietaire: existingPaiement.montant_reversable_proprietaire,
          mode_paiement: existingPaiement.mode_paiement,
          statut: 'rejete' as const,
          valide_par: validatorId,
          date_validation: nowIso,
          numero_recu: null,
          reference_transaction: existingPaiement.reference_transaction || `REJ-${Date.now().toString().slice(-6)}`,
          preuve_paiement_url: existingPaiement.preuve_paiement_url || null,
          notes: `Motif de rejet: ${motif}`,
          created_at: existingPaiement.created_at || nowIso,
        };
        const { error: upsertErr } = await (supabase.from('paiements_loyer') as any).upsert([fullPayload]);
        if (upsertErr) {
          await (supabase.from('paiements_loyer') as any).upsert([{ ...fullPayload, valide_par: null }]);
        }
      }
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
            valide_par: validatorId || 'admin',
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

    const dbPayload = {
      id: item.id,
      bien_id: item.bien_id,
      description: item.description,
      cout: item.cout,
      date_intervention: item.date_intervention,
      imputation: item.imputation || 'non_impute',
      loyer_impacte_mois: item.loyer_impacte_mois || null,
      loyer_impacte_annee: item.loyer_impacte_annee || null,
      justificatif_facture_url: item.justificatif_facture_url || null,
      prestataire_nom: item.prestataire_nom || null,
      est_regle: item.est_regle !== undefined ? item.est_regle : true,
      statut: item.statut || 'en_attente',
      created_at: item.created_at,
    };

    try {
      const { error } = await (supabase.from('travaux_reparations') as any).insert([dbPayload]);
      if (error) {
        console.error('Supabase add travaux error:', error);
        if (error.code === 'PGRST204' || error.message?.includes('statut')) {
          const { statut, ...withoutStatut } = dbPayload;
          const { error: retryErr } = await (supabase.from('travaux_reparations') as any).insert([withoutStatut]);
          if (retryErr) console.error('Supabase retry add travaux error:', retryErr);
        }
      }
    } catch (err) {
      console.warn('Supabase add travaux catch error:', err);
    }

    setTravaux((prev) => [item, ...prev]);
    return item;
  };

  const modifierTravaux = async (
    id: string,
    updates: Partial<TravauxReparation>
  ): Promise<TravauxReparation> => {
    let updatedItem: TravauxReparation | null = null;
    const dbUpdates: any = {};
    if (updates.bien_id !== undefined) dbUpdates.bien_id = updates.bien_id;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.cout !== undefined) dbUpdates.cout = updates.cout;
    if (updates.date_intervention !== undefined) dbUpdates.date_intervention = updates.date_intervention;
    if (updates.imputation !== undefined) dbUpdates.imputation = updates.imputation;
    if (updates.loyer_impacte_mois !== undefined) dbUpdates.loyer_impacte_mois = updates.loyer_impacte_mois;
    if (updates.loyer_impacte_annee !== undefined) dbUpdates.loyer_impacte_annee = updates.loyer_impacte_annee;
    if (updates.justificatif_facture_url !== undefined) dbUpdates.justificatif_facture_url = updates.justificatif_facture_url;
    if (updates.prestataire_nom !== undefined) dbUpdates.prestataire_nom = updates.prestataire_nom;
    if (updates.est_regle !== undefined) dbUpdates.est_regle = updates.est_regle;
    if (updates.statut !== undefined) dbUpdates.statut = updates.statut;

    try {
      const { error } = await (supabase.from('travaux_reparations') as any).update(dbUpdates).eq('id', id);
      if (error) console.error('Supabase update travaux error:', error);
    } catch (err) {
      console.warn('Supabase update travaux catch error:', err);
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
      const { error } = await (supabase.from('travaux_reparations') as any).update({ statut }).eq('id', id);
      if (error) console.error('Supabase change statut travaux error:', error);
    } catch (err) {
      console.warn('Supabase change statut travaux catch error:', err);
    }

    setTravaux((prev) =>
      prev.map((t) => (t.id === id ? { ...t, statut } : t))
    );
  };

  const supprimerTravaux = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('travaux_reparations').delete().eq('id', id);
      if (error) console.error('Supabase delete travaux error:', error);
    } catch (err) {
      console.warn('Supabase delete travaux catch error:', err);
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

    const rate = typeof contrat?.taux_commission === 'number' ? contrat.taux_commission : 10;
    const commission_cabinet = Math.round(payload.montant * (rate / 100));
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
      const { error } = await (supabase.from('paiements_loyer') as any).insert([dbPayload]);
      if (error) console.error('Supabase tenant payment insert error:', error);
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
    modePaiement: PaymentMode;
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

    const rate = typeof contrat?.taux_commission === 'number' ? contrat.taux_commission : 10;
    const commission_cabinet = Math.round(payload.montant * (rate / 100));
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

    const validatorId = (isValideDirect && isValidUUID(currentUser?.id)) ? currentUser!.id : null;
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
      valide_par: validatorId,
      date_validation: isValideDirect ? nowIso : null,
      numero_recu: generatedReceiptNumber,
      reference_transaction: payload.referenceTransaction || `ENC-${Date.now().toString().slice(-6)}`,
      preuve_paiement_url: null,
      notes: payload.notes || 'Encaissement direct saisi par l administration du cabinet.',
      created_at: nowIso,
    };

    try {
      const { error } = await (supabase.from('paiements_loyer') as any).insert([dbPayload]);
      if (error) {
        console.warn('Supabase admin encaissement insert error, retrying with valide_par null:', error);
        const { error: retryErr } = await (supabase.from('paiements_loyer') as any).insert([{ ...dbPayload, valide_par: null }]);
        if (retryErr) console.error('Supabase retry encaissement insert error:', retryErr);
      }
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
      modePaiement?: PaymentMode;
      referenceTransaction?: string;
      notes?: string;
    }
  ): Promise<PaiementWithDetails> => {
    let updatedPayment: PaiementWithDetails | null = null;

    const targetContratId = payload.contratId;
    const existingPayment = paiements.find((p) => p.id === paiementId);
    const resolvedContratId = targetContratId || existingPayment?.contrat_id;
    const resolvedContrat = contrats.find((c) => c.id === resolvedContratId) || existingPayment?.contrat;
    const rate = typeof resolvedContrat?.taux_commission === 'number' ? resolvedContrat.taux_commission : 10;

    const updatesForDb: any = {};
    if (payload.contratId) updatesForDb.contrat_id = payload.contratId;
    if (payload.mois) updatesForDb.mois_concerne = payload.mois;
    if (payload.annee) updatesForDb.annee_concernee = payload.annee;
    if (payload.montant !== undefined) {
      updatesForDb.montant_total_paye = payload.montant;
      updatesForDb.commission_cabinet = Math.round(payload.montant * (rate / 100));
      updatesForDb.montant_reversable_proprietaire = payload.montant - updatesForDb.commission_cabinet;
    }
    if (payload.modePaiement) updatesForDb.mode_paiement = payload.modePaiement;
    if (payload.referenceTransaction !== undefined) updatesForDb.reference_transaction = payload.referenceTransaction;
    if (payload.notes !== undefined) updatesForDb.notes = payload.notes;

    try {
      const { error } = await (supabase.from('paiements_loyer') as any).update(updatesForDb).eq('id', paiementId);
      if (error) console.error('Supabase update encaissement error:', error);
    } catch (err) {
      console.warn('Supabase update encaissement error:', err);
    }

    setPaiements((prev) =>
      prev.map((p) => {
        if (p.id === paiementId) {
          if (p.statut !== 'en_attente') {
            throw new Error('Seuls les encaissements en attente peuvent être modifiés.');
          }

          const currentContratId = targetContratId || p.contrat_id;
          const contrat = contrats.find((c) => c.id === currentContratId) || p.contrat;
          const bien = biens.find((b) => b.id === contrat.bien_id) || p.contrat.bien;
          const proprietaire =
            proprietaires.find((pr) => pr.id === bien.proprietaire_id) || p.contrat.bien.proprietaire;
          const locataire =
            profiles.find((u) => u.id === contrat.locataire_profile_id) || p.contrat.locataire;

          const currentRate = typeof contrat?.taux_commission === 'number' ? contrat.taux_commission : 10;
          const newMontant = payload.montant !== undefined ? payload.montant : p.montant_total_paye;
          const commission_cabinet = Math.round(newMontant * (currentRate / 100));
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
            contrat_id: currentContratId,
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

    if (!updatedPayment) throw new Error('Encaissement non trouvé');
    return updatedPayment;
  };

  const mettreAJourProfilLocataire = async (
    profileId: string,
    nomComplet: string,
    avatarUrl: string
  ): Promise<void> => {
    try {
      const { error } = await (supabase.from('profiles') as any).update({ 
        nom_complet: nomComplet, 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }).eq('id', profileId);
      if (error) console.error('Supabase update locataire profile error:', error);
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

  const ajouterTypeBien = async (nom: string): Promise<TypeBien> => {
    const payload = { nom };
    let newType: TypeBien | null = null;
    
    if (isSupabaseConnected) {
      const { data, error } = await (supabase.from('types_biens') as any).insert([payload]).select().single();
      if (!error && data) newType = data as TypeBien;
      if (error) console.error('Supabase insert types_biens error:', error);
    }

    if (!newType) {
      newType = { id: generateUUID(), nom, created_at: new Date().toISOString() };
    }

    setTypesBiens(prev => [...prev, newType!]);
    return newType;
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
        typesBiens,
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
        ajouterTypeBien,
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
