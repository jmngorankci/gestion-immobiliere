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
    resilierContrat,
    supprimerContrat,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'biens' | 'proprietaires' | 'locataires'>('biens');
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
  const [bienLoyer, setBienLoyer] = useState<number>(450000);
  const [bienCommune, setBienCommune] = useState('');
  const [bienAdresse, setBienAdresse] = useState('');
  const [bienPropId, setBienPropId] = useState(proprietaires[0]?.id || '');
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
  const [locBienId, setLocBienId] = useState(biens[0]?.id || '');
  const [locLoyer, setLocLoyer] = useState<number>(450000);
  const [locCaution, setLocCaution] = useState<number>(900000);
  const [locDateDebut, setLocDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [locConditions, setLocConditions] = useState('');

  // Open Add Bien Modal
  const handleOpenAddBien = () => {
    setEditingBien(null);
    const nextCode = `APP-ABJ-${String(biens.length + 1).padStart(3, '0')}`;
    setBienCode(nextCode);
    setBienType('3_pieces');
    setBienLoyer(450000);
    setBienCommune('Cocody Riviera');
    setBienAdresse('Résidence Prestige, 2ème étage');
    setBienPropId(proprietaires[0]?.id || '');
    setBienDescription('');
    setBienPhoto('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80');
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
    if (!bienCode.trim() || !bienCommune.trim() || bienLoyer <= 0) {
      alert('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    if (editingBien) {
      await modifierBien(editingBien.id, {
        code_reference: bienCode,
        type_bien: bienType,
        loyer_mensuel_reference: bienLoyer,
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
        loyer_mensuel_reference: bienLoyer,
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
    setPropTel('+225 ');
    setPropEmail('');
    setPropAdresse('Abidjan, Côte d Ivoire');
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
    setLocTel('+225 ');
    setLocEmail('');
    const targetBien = biens.find((b) => !b.est_occupe) || biens[0];
    setLocBienId(targetBien?.id || '');
    setLocLoyer(targetBien?.loyer_mensuel_reference || 350000);
    setLocCaution((targetBien?.loyer_mensuel_reference || 350000) * 2);
    setLocDateDebut(new Date().toISOString().split('T')[0]);
    setLocConditions('Paiement avant le 05 de chaque mois. Animaux non admis.');
    setShowLocataireModal(true);
  };

  // Submit Locataire & Contrat
  const handleSubmitLocataire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locNom.trim() || !locTel.trim() || !locBienId) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    await ajouterLocataireEtContrat({
      nom_complet: locNom,
      telephone: locTel,
      email: locEmail || undefined,
      bien_id: locBienId,
      loyer_mensuel: locLoyer,
      depot_garantie: locCaution,
      date_debut: locDateDebut,
      conditions_particulieres: locConditions || undefined,
    });

    setShowLocataireModal(false);
  };

  // Filtered lists
  const filteredBiens = biens.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.code_reference.toLowerCase().includes(q) ||
      b.commune_quartier.toLowerCase().includes(q) ||
      b.adresse_precise.toLowerCase().includes(q)
    );
  });

  const filteredProprietaires = proprietaires.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.nom_complet.toLowerCase().includes(q) ||
      p.telephone.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  const filteredContrats = contrats.filter((c) => {
    const loc = profiles.find((u) => u.id === c.locataire_profile_id);
    const bien = biens.find((b) => b.id === c.bien_id);
    const q = searchQuery.toLowerCase();
    return (
      (loc?.nom_complet && loc.nom_complet.toLowerCase().includes(q)) ||
      (bien?.code_reference && bien.code_reference.toLowerCase().includes(q))
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
            Enregistrez, modifiez et administrez vos biens immobiliers, propriétaires bailleurs et contrats de bail locataires.
          </p>
        </div>

        {/* Global Action Button based on Active Tab */}
        <div className="flex items-center space-x-2">
          {activeTab === 'biens' && (
            <button
              onClick={handleOpenAddBien}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              + Nouveau Bien
            </button>
          )}

          {activeTab === 'proprietaires' && (
            <button
              onClick={handleOpenAddProp}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              + Nouveau Propriétaire
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
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('biens')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'biens'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Biens Immobiliers ({biens.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('proprietaires')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'proprietaires'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Propriétaires Bailleurs ({proprietaires.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('locataires')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'locataires'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Locataires & Baux ({contrats.length})</span>
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

      {/* ======================= TAB 1: BIENS IMMOBILIERS ======================= */}
      {activeTab === 'biens' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredBiens.map((bien) => {
            const prop = proprietaires.find((p) => p.id === bien.proprietaire_id);
            const activeLease = contrats.find((c) => c.bien_id === bien.id && c.statut === 'actif');
            const locataire = activeLease
              ? profiles.find((u) => u.id === activeLease.locataire_profile_id)
              : null;

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
                    {bien.est_occupe ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow">
                        Occupé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow">
                        Disponible
                      </span>
                    )}
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
                    {bien.description || 'Bien immobilier sous gestion locative exclusive.'}
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

                    {locataire && (
                      <div className="flex justify-between items-center text-teal-800 bg-teal-50 p-1.5 rounded-lg border border-teal-200">
                        <span>Locataire en place :</span>
                        <span className="font-bold">{locataire.nom_complet}</span>
                      </div>
                    )}
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

      {/* ======================= TAB 2: PROPRIÉTAIRES ======================= */}
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
              </tbody>
            </table>
          </div>
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
                          {isActif ? (
                            <button
                              onClick={() => {
                                if (confirm(`Résilier le contrat de bail pour ${loc?.nom_complet} ?`)) {
                                  resilierContrat(c.id);
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition"
                            >
                              Résilier
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm('Supprimer définitivement ce contrat résilié ?')) {
                                  supprimerContrat(c.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                    onChange={(e) => setBienLoyer(Number(e.target.value))}
                    min={10000}
                    step={5000}
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
                  Nouveau Contrat de Bail & Locataire
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
                      onChange={(e) => setLocLoyer(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Dépôt Garantie (FCFA) *</label>
                    <input
                      type="number"
                      value={locCaution}
                      onChange={(e) => setLocCaution(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Date de Prise d'Effet du Bail *</label>
                  <input
                    type="date"
                    value={locDateDebut}
                    onChange={(e) => setLocDateDebut(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl"
                    required
                  />
                </div>
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
                  Valider le Nouveau Bail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
