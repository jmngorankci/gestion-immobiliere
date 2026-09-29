'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Bien, ContratBail, PropertyType, Proprietaire } from '@/types/database.types';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  Building2,
  PlusCircle,
  Users,
  UserCheck,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Home,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
  FileText,
  XCircle,
  Tag,
  List,
  Sparkles,
} from 'lucide-react';

export default function BiensPage() {
  const {
    biens,
    proprietaires,
    contrats,
    profiles,
    ajouterBien,
    modifierBien,
    supprimerBien,
    ajouterProprietaire,
    modifierProprietaire,
    supprimerProprietaire,
    ajouterLocataireEtContrat,
    modifierContrat,
    modifierAccesUtilisateur,
    resilierContrat,
    supprimerContrat,
  } = useAppStore();

  // Tab order requested: Propriétaire -> Biens Immobiliers -> Locataire et Baux -> Liste des Biens
  const [activeTab, setActiveTab] = useState<'proprietaires' | 'biens' | 'locataires' | 'liste-biens'>('proprietaires');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals visibility
  const [showBienModal, setShowBienModal] = useState(false);
  const [editingBien, setEditingBien] = useState<Bien | null>(null);

  const [showPropModal, setShowPropModal] = useState(false);
  const [editingProp, setEditingProp] = useState<Proprietaire | null>(null);

  const [showLocataireModal, setShowLocataireModal] = useState(false);
  const [editingContrat, setEditingContrat] = useState<ContratBail | null>(null);

  // Form states: Bien
  const [bienCode, setBienCode] = useState('');
  const [bienType, setBienType] = useState<PropertyType>('3_pieces');
  const [bienLoyer, setBienLoyer] = useState<number | ''>('');
  const [bienCommune, setBienCommune] = useState('');
  const [bienAdresse, setBienAdresse] = useState('');
  const [bienPropId, setBienPropId] = useState('');
  const [bienDescription, setBienDescription] = useState('');
  const [bienPhoto, setBienPhoto] = useState('');

  // Form states: Proprietaire
  const [propNom, setPropNom] = useState('');
  const [propTel, setPropTel] = useState('');
  const [propEmail, setPropEmail] = useState('');
  const [propAdresse, setPropAdresse] = useState('');
  const [propMode, setPropMode] = useState<'virement' | 'mobile_money' | 'cheque' | 'espece'>('virement');
  const [propRib, setPropRib] = useState('');

  // Form states: Locataire & Bail
  const [locNom, setLocNom] = useState('');
  const [locTel, setLocTel] = useState('');
  const [locEmail, setLocEmail] = useState('');
  const [locBienId, setLocBienId] = useState('');
  const [locLoyer, setLocLoyer] = useState<number | ''>('');
  const [locCaution, setLocCaution] = useState<number | ''>('');
  const [locTauxCommission, setLocTauxCommission] = useState<number | ''>(10);
  const [locDateDebut, setLocDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [locConditions, setLocConditions] = useState('');

  // Open Add Bien Modal
  const handleOpenAddBien = () => {
    setEditingBien(null);
    setBienCode('');
    setBienType('3_pieces');
    setBienLoyer('');
    setBienCommune('');
    setBienAdresse('');
    setBienPropId(proprietaires[0]?.id || '');
    setBienDescription('');
    setBienPhoto('');
    setShowBienModal(true);
  };

  // Open Edit Bien Modal
  const handleOpenEditBien = (b: Bien) => {
    setEditingBien(b);
    setBienCode(b.code_reference);
    setBienType(b.type_bien);
    setBienLoyer(b.loyer_mensuel_reference);
    setBienCommune(b.commune_quartier);
    setBienAdresse(b.adresse_precise);
    setBienPropId(b.proprietaire_id);
    setBienDescription(b.description || '');
    setBienPhoto(b.photos_urls?.[0] || '');
    setShowBienModal(true);
  };

  // Submit Bien (Add or Update)
  const handleSubmitBien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienCode.trim() || !bienCommune.trim() || !bienLoyer || Number(bienLoyer) <= 0 || !bienPropId) {
      alert('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    if (editingBien) {
      await modifierBien(editingBien.id, {
        code_reference: bienCode,
        type_bien: bienType,
        loyer_mensuel_reference: Number(bienLoyer),
        commune_quartier: bienCommune,
        adresse_precise: bienAdresse,
        proprietaire_id: bienPropId,
        description: bienDescription,
        photos_urls: bienPhoto ? [bienPhoto] : [],
      });
    } else {
      await ajouterBien({
        code_reference: bienCode,
        type_bien: bienType,
        loyer_mensuel_reference: Number(bienLoyer),
        commune_quartier: bienCommune,
        adresse_precise: bienAdresse,
        proprietaire_id: bienPropId,
        est_occupe: false,
        description: bienDescription,
        photos_urls: bienPhoto ? [bienPhoto] : [],
      });
    }

    setShowBienModal(false);
  };

  // Open Add Proprietaire Modal
  const handleOpenAddProp = () => {
    setEditingProp(null);
    setPropNom('');
    setPropTel('');
    setPropEmail('');
    setPropAdresse('');
    setPropMode('virement');
    setPropRib('');
    setShowPropModal(true);
  };

  // Open Edit Proprietaire Modal
  const handleOpenEditProp = (p: Proprietaire) => {
    setEditingProp(p);
    setPropNom(p.nom_complet);
    setPropTel(p.telephone);
    setPropEmail(p.email || '');
    setPropAdresse(p.adresse || '');
    setPropMode(p.mode_versement_prefere);
    setPropRib(p.rib_ou_numero_compte || '');
    setShowPropModal(true);
  };

  // Submit Proprietaire
  const handleSubmitProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propNom.trim() || !propTel.trim()) {
      alert('Veuillez saisir le nom et le numéro de téléphone.');
      return;
    }

    if (editingProp) {
      await modifierProprietaire(editingProp.id, {
        nom_complet: propNom,
        telephone: propTel,
        email: propEmail || null,
        adresse: propAdresse || null,
        mode_versement_prefere: propMode,
        rib_ou_numero_compte: propRib || null,
      });
    } else {
      await ajouterProprietaire({
        nom_complet: propNom,
        telephone: propTel,
        email: propEmail || null,
        adresse: propAdresse || null,
        mode_versement_prefere: propMode,
        rib_ou_numero_compte: propRib || null,
      });
    }

    setShowPropModal(false);
  };

  // Open Add Locataire Modal
  const handleOpenAddLocataire = () => {
    setEditingContrat(null);
    setLocNom('');
    setLocTel('');
    setLocEmail('');
    setLocBienId('');
    setLocLoyer('');
    setLocCaution('');
    setLocTauxCommission(10);
    setLocDateDebut(new Date().toISOString().split('T')[0]);
    setLocConditions('');
    setShowLocataireModal(true);
  };

  // Open Edit Locataire Modal
  const handleOpenEditLocataire = (c: ContratBail) => {
    setEditingContrat(c);
    const loc = profiles.find((u) => u.id === c.locataire_profile_id);
    setLocNom(loc?.nom_complet || '');
    setLocTel(loc?.telephone || '');
    setLocEmail(loc?.email || '');
    setLocBienId(c.bien_id);
    setLocLoyer(c.loyer_mensuel);
    setLocCaution(c.depot_garantie);
    setLocTauxCommission(c.taux_commission ?? 10);
    setLocDateDebut(c.date_debut);
    setLocConditions(c.conditions_particulieres || '');
    setShowLocataireModal(true);
  };

  // Submit Locataire & Contrat
  const handleSubmitLocataire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locNom.trim() || !locTel.trim() || !locBienId || !locLoyer || !locCaution) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const appliedCommissionRate = typeof locTauxCommission === 'number' ? locTauxCommission : (Number(locTauxCommission) || 10);

    try {
      if (editingContrat) {
        let locataireId = editingContrat.locataire_profile_id;

        if (locataireId) {
          const updatedProfile = await modifierAccesUtilisateur(locataireId, {
            nom_complet: locNom,
            telephone: locTel,
            email: locEmail || undefined,
            bien_id: locBienId,
            loyer_mensuel: Number(locLoyer),
          });
          if (updatedProfile?.id) {
            locataireId = updatedProfile.id;
          }
        } else {
          const newProfile = await attribuerAccesUtilisateur({
            nom_complet: locNom,
            telephone: locTel,
            email: locEmail || undefined,
            role: 'locataire',
            bien_id: locBienId,
            loyer_mensuel: Number(locLoyer),
            taux_commission: appliedCommissionRate,
          });
          locataireId = newProfile.id;
        }

        await modifierContrat(editingContrat.id, {
          bien_id: locBienId,
          locataire_profile_id: locataireId,
          loyer_mensuel: Number(locLoyer),
          depot_garantie: Number(locCaution),
          taux_commission: appliedCommissionRate,
          date_debut: locDateDebut,
          conditions_particulieres: locConditions || undefined,
        });
      } else {
        await ajouterLocataireEtContrat({
          nom_complet: locNom,
          telephone: locTel,
          email: locEmail || undefined,
          bien_id: locBienId,
          loyer_mensuel: Number(locLoyer),
          depot_garantie: Number(locCaution),
          taux_commission: appliedCommissionRate,
          date_debut: locDateDebut,
          conditions_particulieres: locConditions || undefined,
        });
      }

      setShowLocataireModal(false);
    } catch (err: any) {
      console.error('Erreur enregistrement locataire/bail:', err);
      alert(err?.message || 'Erreur lors de l enregistrement du bail.');
    }
  };

  // Filtered lists
  const query = searchQuery.toLowerCase();

  // All properties filtered
  const filteredAllBiens = biens.filter((b) => {
    return (
      b.code_reference.toLowerCase().includes(query) ||
      b.commune_quartier.toLowerCase().includes(query) ||
      b.adresse_precise.toLowerCase().includes(query)
    );
  });

  // Only AVAILABLE properties filtered (est_occupe === false)
  const availableBiens = filteredAllBiens.filter((b) => !b.est_occupe);

  const filteredProprietaires = proprietaires.filter((p) => {
    return (
      p.nom_complet.toLowerCase().includes(query) ||
      p.telephone.toLowerCase().includes(query) ||
      (p.email && p.email.toLowerCase().includes(query))
    );
  });

  const filteredContrats = contrats.filter((c) => {
    const loc = profiles.find((u) => u.id === c.locataire_profile_id);
    const bien = biens.find((b) => b.id === c.bien_id);
    return (
      (loc?.nom_complet && loc.nom_complet.toLowerCase().includes(query)) ||
      (bien?.code_reference && bien.code_reference.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Main Navigation Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Building2 className="w-7 h-7 mr-2.5 text-emerald-600" />
            Gestion Complète du Parc Immobilier & Baux
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrez, modifiez et administrez vos propriétaires bailleurs, biens immobiliers disponibles, baux et parc complet.
          </p>
        </div>

        {/* Global Action Button based on Active Tab */}
        <div className="flex items-center space-x-2">
          {activeTab === 'proprietaires' && (
            <button
              onClick={handleOpenAddProp}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              + Nouveau Propriétaire
            </button>
          )}

          {(activeTab === 'biens' || activeTab === 'liste-biens') && (
            <button
              onClick={handleOpenAddBien}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              + Nouveau Bien
            </button>
          )}

          {activeTab === 'locataires' && (
            <button
              onClick={handleOpenAddLocataire}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              + Nouveau Bail / Locataire
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Navigation Tabs in requested order: 1. Propriétaire, 2. Biens Immobiliers, 3. Locataire et Baux, 4. Liste des Biens */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {/* 1. Propriétaire */}
          <button
            onClick={() => setActiveTab('proprietaires')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'proprietaires'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Propriétaire ({proprietaires.length})</span>
          </button>

          {/* 2. Biens Immobiliers (Disponibles) */}
          <button
            onClick={() => setActiveTab('biens')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'biens'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Biens Immobiliers ({biens.filter((b) => !b.est_occupe).length} disponibles)</span>
          </button>

          {/* 3. Locataire et Baux */}
          <button
            onClick={() => setActiveTab('locataires')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'locataires'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Locataire et Baux ({contrats.length})</span>
          </button>

          {/* 4. Liste des Biens (Tableau de tous les biens) */}
          <button
            onClick={() => setActiveTab('liste-biens')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'liste-biens'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Liste des Biens ({biens.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* ======================= TAB 1: PROPRIÉTAIRE ======================= */}
      {activeTab === 'proprietaires' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Bailleur / Propriétaire</th>
                  <th className="py-3.5 px-4">Contacts</th>
                  <th className="py-3.5 px-4">Adresse</th>
                  <th className="py-3.5 px-4">Mode de Reversement (90%)</th>
                  <th className="py-3.5 px-4 text-center">Biens Rattachés</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProprietaires.map((p) => {
                  const ownedBiens = biens.filter((b) => b.proprietaire_id === p.id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-base">{p.nom_complet}</div>
                        <p className="text-[10px] font-mono text-slate-400">ID: {p.id.slice(0, 8)}</p>
                      </td>

                      <td className="py-3.5 px-4 text-xs space-y-0.5">
                        <p className="flex items-center text-slate-800 font-medium">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {p.telephone}
                        </p>
                        <p className="flex items-center text-slate-600">
                          <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {p.email || '-'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        {p.adresse || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-bold capitalize text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.mode_versement_prefere.replace('_', ' ')}
                        </span>
                        <p className="font-mono text-[11px] text-slate-500 mt-1">
                          {p.rib_ou_numero_compte || 'RIB non renseigné'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                          {ownedBiens.length} bien(s)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditProp(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer le propriétaire ${p.nom_complet} ?`)) {
                                supprimerProprietaire(p.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProprietaires.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Aucun propriétaire trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: BIENS IMMOBILIERS (SEULEMENT DISPONIBLES) ======================= */}
      {activeTab === 'biens' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Affichage des biens actuellement disponibles à la location ({availableBiens.length})
            </p>
          </div>

          {availableBiens.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Aucun bien disponible actuellement</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tous les biens sont occupés ou aucun bien ne correspond à votre recherche. Consultez l'onglet "Liste des Biens" pour voir l'ensemble du parc.
              </p>
              <button
                onClick={handleOpenAddBien}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Ajouter un nouveau bien
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableBiens.map((bien) => {
                const prop = proprietaires.find((p) => p.id === bien.proprietaire_id);

                return (
                  <div
                    key={bien.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition group"
                  >
                    {/* Photo & Status */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={bien.photos_urls?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                        alt={bien.code_reference}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white shadow">
                        {bien.code_reference}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow">
                          Disponible
                        </span>
                      </div>
                    </div>

                    {/* Body details */}
                    <div className="p-5 space-y-3 flex-1">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{bien.commune_quartier}</h3>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                          {bien.adresse_precise}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {bien.description || 'Bien immobilier sous gestion locative exclusive disponible immédiatement.'}
                      </p>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Loyer mensuel :</span>
                          <span className="font-mono font-extrabold text-slate-900 text-base">
                            {formatFCFA(bien.loyer_mensuel_reference)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Propriétaire :</span>
                          <span className="font-semibold text-slate-800">{prop?.nom_complet || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="capitalize font-semibold text-slate-600">
                        {bien.type_bien.replace('_', ' ')}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditBien(bien)}
                          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Confirmez-vous la suppression du bien ${bien.code_reference} ?`)) {
                              supprimerBien(bien.id);
                            }
                          }}
                          className="p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: LOCATAIRES & BAUX ======================= */}
      {activeTab === 'locataires' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Locataire (Preneur)</th>
                  <th className="py-3.5 px-4">Bien Loué</th>
                  <th className="py-3.5 px-4 text-right">Loyer Contractuel</th>
                  <th className="py-3.5 px-4 text-center">Taux Com.</th>
                  <th className="py-3.5 px-4 text-right">Dépôt Garantie</th>
                  <th className="py-3.5 px-4">Date Début</th>
                  <th className="py-3.5 px-4 text-center">Statut Bail</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContrats.map((c) => {
                  const loc = profiles.find((u) => u.id === c.locataire_profile_id);
                  const bien = biens.find((b) => b.id === c.bien_id);
                  const isActif = c.statut === 'actif';
                  const rate = c.taux_commission ?? 10;
                  const comMensuelle = Math.round(c.loyer_mensuel * (rate / 100));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-base">{loc?.nom_complet || 'Locataire'}</div>
                        <p className="text-xs text-slate-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {loc?.telephone}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {bien?.code_reference}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">{bien?.commune_quartier}</p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-base">
                        {formatFCFA(c.loyer_mensuel)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {rate}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatFCFA(comMensuelle)}/m
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 text-xs">
                        {formatFCFA(c.depot_garantie)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDateFR(c.date_debut)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isActif ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                            Résilié
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditLocataire(c)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Modifier le contrat / locataire"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isActif && (
                            <button
                              onClick={() => {
                                if (confirm(`Résilier le contrat de bail pour ${loc?.nom_complet || 'ce locataire'} ?`)) {
                                  resilierContrat(c.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition"
                            >
                              Résilier
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer définitivement le contrat de bail pour ${loc?.nom_complet || 'ce locataire'} ?`)) {
                                supprimerContrat(c.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Supprimer le contrat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredContrats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      Aucun contrat de bail trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: LISTE DES BIENS (TABLEAU COMPLET) ======================= */}
      {activeTab === 'liste-biens' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code Référence</th>
                  <th className="py-3.5 px-4">Type de Bien</th>
                  <th className="py-3.5 px-4">Commune & Quartier</th>
                  <th className="py-3.5 px-4">Adresse Précise</th>
                  <th className="py-3.5 px-4">Propriétaire</th>
                  <th className="py-3.5 px-4 text-right">Loyer Mensuel</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllBiens.map((bien) => {
                  const prop = proprietaires.find((p) => p.id === bien.proprietaire_id);

                  return (
                    <tr key={bien.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {bien.code_reference}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 capitalize text-xs">
                        {bien.type_bien.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-900 font-bold text-xs">
                        {bien.commune_quartier}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{bien.adresse_precise}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        {prop?.nom_complet || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatFCFA(bien.loyer_mensuel_reference)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {bien.est_occupe ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Occupé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Disponible
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditBien(bien)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Modifier ce bien"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Confirmez-vous la suppression du bien ${bien.code_reference} ?`)) {
                                supprimerBien(bien.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Supprimer ce bien"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAllBiens.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      Aucun bien trouvé dans le parc immobilier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= MODAL: BIEN IMMOBILIER ======================= */}
      {showBienModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Home className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingBien ? `Modifier le Bien (${editingBien.code_reference})` : 'Enregistrer un Nouveau Bien'}
                </h3>
              </div>
              <button
                onClick={() => setShowBienModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBien} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Code Référence *
                  </label>
                  <input
                    type="text"
                    value={bienCode}
                    onChange={(e) => setBienCode(e.target.value)}
                    placeholder="Ex: APP-COC-005"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Type de Bien *
                  </label>
                  <select
                    value={bienType}
                    onChange={(e) => setBienType(e.target.value as PropertyType)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="studio">Studio</option>
                    <option value="2_pieces">2 Pièces</option>
                    <option value="3_pieces">3 Pièces</option>
                    <option value="appartement">Appartement (4+ pièces)</option>
                    <option value="villa">Villa / Duplex</option>
                    <option value="maison_basse">Maison Basse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Loyer Mensuel de Référence (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={bienLoyer}
                    onChange={(e) => setBienLoyer(e.target.value === '' ? '' : Number(e.target.value))}
                    min={10000}
                    step={5000}
                    placeholder="Ex: 450000"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Propriétaire Bailleur *
                  </label>
                  <select
                    value={bienPropId}
                    onChange={(e) => setBienPropId(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choisir un propriétaire --</option>
                    {proprietaires.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom_complet}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Commune & Quartier *
                </label>
                <input
                  type="text"
                  value={bienCommune}
                  onChange={(e) => setBienCommune(e.target.value)}
                  placeholder="Ex: Cocody Riviera Palmeraie, Marcory Zone 4..."
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Adresse Précise *
                </label>
                <input
                  type="text"
                  value={bienAdresse}
                  onChange={(e) => setBienAdresse(e.target.value)}
                  placeholder="Ex: Rue Ministre, Résidence Les Palmes, Porte 12"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Description / Commodités
                </label>
                <textarea
                  value={bienDescription}
                  onChange={(e) => setBienDescription(e.target.value)}
                  placeholder="Ex: Climatisation, piscine, groupe électrogène, parking..."
                  rows={2}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  URL Photo (Optionnel)
                </label>
                <input
                  type="text"
                  value={bienPhoto}
                  onChange={(e) => setBienPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBienModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95"
                >
                  {editingBien ? 'Mettre à jour' : 'Enregistrer le Bien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: PROPRIÉTAIRE ======================= */}
      {showPropModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingProp ? `Modifier ${editingProp.nom_complet}` : 'Enregistrer un Nouveau Propriétaire'}
                </h3>
              </div>
              <button
                onClick={() => setShowPropModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProp} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nom et Prénoms du Bailleur *
                </label>
                <input
                  type="text"
                  value={propNom}
                  onChange={(e) => setPropNom(e.target.value)}
                  placeholder="Ex: El Hadj Ousmane Traoré"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Téléphone (+225) *
                  </label>
                  <input
                    type="text"
                    value={propTel}
                    onChange={(e) => setPropTel(e.target.value)}
                    placeholder="+225 07 01 12 23 34"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={propEmail}
                    onChange={(e) => setPropEmail(e.target.value)}
                    placeholder="bailleur@holding-ci.com"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Adresse Résidentielle
                </label>
                <input
                  type="text"
                  value={propAdresse}
                  onChange={(e) => setPropAdresse(e.target.value)}
                  placeholder="Ex: Cocody Ambassades, Villa 14, Abidjan"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Mode de Reversement Préféré (90%) *
                </label>
                <select
                  value={propMode}
                  onChange={(e) => setPropMode(e.target.value as any)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="virement">Virement Bancaire</option>
                  <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                  <option value="cheque">Chèque Bancaire</option>
                  <option value="espece">Espèces</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  RIB ou N° Compte / Mobile
                </label>
                <input
                  type="text"
                  value={propRib}
                  onChange={(e) => setPropRib(e.target.value)}
                  placeholder="CI034 01001 001234567890 45 (SGBCI)"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPropModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95"
                >
                  {editingProp ? 'Mettre à jour' : 'Enregistrer le Propriétaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: LOCATAIRE & BAIL ======================= */}
      {showLocataireModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingContrat ? 'Modifier le Contrat de Bail & Locataire' : 'Nouveau Contrat de Bail & Locataire'}
                </h3>
              </div>
              <button
                onClick={() => setShowLocataireModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLocataire} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nom et Prénoms du Locataire *
                </label>
                <input
                  type="text"
                  value={locNom}
                  onChange={(e) => setLocNom(e.target.value)}
                  placeholder="Ex: Mme Fatou Bamba"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Téléphone (+225) *
                  </label>
                  <input
                    type="text"
                    value={locTel}
                    onChange={(e) => setLocTel(e.target.value)}
                    placeholder="+225 07 58 49 30 21"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={locEmail}
                    onChange={(e) => setLocEmail(e.target.value)}
                    placeholder="fatou.bamba@gmail.com"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-emerald-900 uppercase">
                  Bien Immobilier & Conditions du Bail
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Sélectionnez le Bien à Louer *</label>
                  <select
                    value={locBienId}
                    onChange={(e) => {
                      setLocBienId(e.target.value);
                      const b = biens.find((item) => item.id === e.target.value);
                      if (b) {
                        setLocLoyer(b.loyer_mensuel_reference);
                        setLocCaution(b.loyer_mensuel_reference * 2);
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    required
                  >
                    <option value="">-- Sélectionner un bien immobilier --</option>
                    {biens.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code_reference} - {b.commune_quartier} ({formatFCFA(b.loyer_mensuel_reference)}/mois) {b.est_occupe ? '(Déjà occupé)' : '(Libre)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Loyer Mensuel (FCFA) *</label>
                    <input
                      type="number"
                      value={locLoyer}
                      onChange={(e) => setLocLoyer(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 450000"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Dépôt Garantie (FCFA) *</label>
                    <input
                      type="number"
                      value={locCaution}
                      onChange={(e) => setLocCaution(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 900000"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Taux Commission Cabinet (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        value={locTauxCommission}
                        onChange={(e) => setLocTauxCommission(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="10"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-rose-600 focus:ring-2 focus:ring-rose-500"
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Date de Prise d'Effet *</label>
                    <input
                      type="date"
                      value={locDateDebut}
                      onChange={(e) => setLocDateDebut(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Simulation de répartition de la commission */}
                {Number(locLoyer) > 0 && (
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Commission Cabinet ({locTauxCommission || 0}%) :</span>
                      <span className="font-mono font-bold text-rose-600">
                        {formatFCFA(Math.round((Number(locLoyer) || 0) * ((Number(locTauxCommission) || 0) / 100)))} / mois
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Net Propriétaire ({100 - (Number(locTauxCommission) || 0)}%) :</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {formatFCFA((Number(locLoyer) || 0) - Math.round((Number(locLoyer) || 0) * ((Number(locTauxCommission) || 0) / 100)))} / mois
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Conditions Particulières
                </label>
                <textarea
                  value={locConditions}
                  onChange={(e) => setLocConditions(e.target.value)}
                  placeholder="Ex: Paiement avant le 05 de chaque mois..."
                  rows={2}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLocataireModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95"
                >
                  {editingContrat ? 'Enregistrer les Modifications' : 'Valider le Nouveau Bail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
