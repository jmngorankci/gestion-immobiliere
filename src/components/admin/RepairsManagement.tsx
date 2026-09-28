'use client';

import React, { useState } from 'react';
import { Bien, RepairImputation, RepairStatus, TravauxReparation } from '@/types/database.types';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  Wrench,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  RefreshCw,
  Search,
} from 'lucide-react';

interface RepairsManagementProps {
  travaux: TravauxReparation[];
  biens: Bien[];
  onAddTravaux: (item: Omit<TravauxReparation, 'id' | 'created_at'>) => Promise<TravauxReparation>;
  onUpdateTravaux?: (id: string, updates: Partial<TravauxReparation>) => Promise<TravauxReparation>;
  onChangeStatutTravaux?: (id: string, statut: RepairStatus) => Promise<void>;
  onDeleteTravaux?: (id: string) => Promise<void>;
}

export const RepairsManagement: React.FC<RepairsManagementProps> = ({
  travaux,
  biens,
  onAddTravaux,
  onUpdateTravaux,
  onChangeStatutTravaux,
  onDeleteTravaux,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTravaux, setEditingTravaux] = useState<TravauxReparation | null>(null);
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for Add / Edit
  const [bienId, setBienId] = useState('');
  const [description, setDescription] = useState('');
  const [cout, setCout] = useState<number | ''>('');
  const [dateIntervention, setDateIntervention] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [imputation, setImputation] = useState<RepairImputation>('impute_au_loyer');
  const [loyerImpacteMois, setLoyerImpacteMois] = useState<number>(new Date().getMonth() + 1);
  const [loyerImpacteAnnee, setLoyerImpacteAnnee] = useState<number>(new Date().getFullYear());
  const [prestataireNom, setPrestataireNom] = useState('');
  const [statut, setStatut] = useState<RepairStatus>('en_attente');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Add Modal with clean / empty fields
  const handleOpenAdd = () => {
    setEditingTravaux(null);
    setBienId(biens[0]?.id || '');
    setDescription('');
    setCout('');
    setDateIntervention(new Date().toISOString().split('T')[0]);
    setImputation('impute_au_loyer');
    setLoyerImpacteMois(new Date().getMonth() + 1);
    setLoyerImpacteAnnee(new Date().getFullYear());
    setPrestataireNom('');
    setStatut('en_attente');
    setShowAddModal(true);
  };

  // Open Edit Modal prefilled with existing item
  const handleOpenEdit = (t: TravauxReparation) => {
    setEditingTravaux(t);
    setBienId(t.bien_id);
    setDescription(t.description);
    setCout(t.cout);
    setDateIntervention(t.date_intervention);
    setImputation(t.imputation);
    setLoyerImpacteMois(t.loyer_impacte_mois || new Date().getMonth() + 1);
    setLoyerImpacteAnnee(t.loyer_impacte_annee || new Date().getFullYear());
    setPrestataireNom(t.prestataire_nom || '');
    setStatut(t.statut || 'en_attente');
    setShowAddModal(true);
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numCout = typeof cout === 'number' ? cout : 0;
    if (!description.trim() || numCout <= 0 || !bienId) {
      alert('Veuillez remplir correctement tous les champs obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTravaux && onUpdateTravaux) {
        await onUpdateTravaux(editingTravaux.id, {
          bien_id: bienId,
          description,
          cout: numCout,
          date_intervention: dateIntervention,
          imputation,
          loyer_impacte_mois: imputation === 'impute_au_loyer' ? loyerImpacteMois : null,
          loyer_impacte_annee: imputation === 'impute_au_loyer' ? loyerImpacteAnnee : null,
          prestataire_nom: prestataireNom || 'Prestataire Agréé',
          statut,
        });
      } else {
        await onAddTravaux({
          bien_id: bienId,
          description,
          cout: numCout,
          date_intervention: dateIntervention,
          imputation,
          loyer_impacte_mois: imputation === 'impute_au_loyer' ? loyerImpacteMois : null,
          loyer_impacte_annee: imputation === 'impute_au_loyer' ? loyerImpacteAnnee : null,
          justificatif_facture_url: null,
          prestataire_nom: prestataireNom || 'Prestataire Agréé',
          est_regle: statut === 'realise',
          statut,
        });
      }

      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erreur lors de l enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (st: RepairStatus = 'en_attente') => {
    switch (st) {
      case 'realise':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Réalisé
          </span>
        );
      case 'annule':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Annulé
          </span>
        );
      case 'en_attente':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            En attente
          </span>
        );
    }
  };

  const getImputationBadge = (imp: RepairImputation) => {
    switch (imp) {
      case 'impute_au_loyer':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
            Imputé au Loyer Locataire
          </span>
        );
      case 'a_la_charge_proprietaire':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
            Charge Bailleur (Déduit Reversement)
          </span>
        );
      case 'a_la_charge_cabinet':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            Charge Cabinet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Non Imputé
          </span>
        );
    }
  };

  // Filtered list
  const filteredTravaux = travaux.filter((t) => {
    const currentStatut = t.statut || 'en_attente';
    const matchesStatut = filterStatut === 'tous' || currentStatut === filterStatut;
    const targetBien = biens.find((b) => b.id === t.bien_id);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.description.toLowerCase().includes(q) ||
      (t.prestataire_nom && t.prestataire_nom.toLowerCase().includes(q)) ||
      (targetBien?.code_reference && targetBien.code_reference.toLowerCase().includes(q)) ||
      (targetBien?.commune_quartier && targetBien.commune_quartier.toLowerCase().includes(q));

    return matchesStatut && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Wrench className="w-6 h-6 mr-2.5 text-emerald-600" />
            Suivi des Travaux, Réparations & Imputations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez les interventions techniques, modifiez le statut (En attente, Réalisé, Annulé) et appliquez automatiquement l&apos;imputation financière sur les loyers ou reversements.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Enregistrer une Réparation
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par description, bien, artisan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatut('tous')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatut === 'tous'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({travaux.length})
          </button>
          <button
            onClick={() => setFilterStatut('en_attente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              filterStatut === 'en_attente'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            En attente ({travaux.filter((t) => (t.statut || 'en_attente') === 'en_attente').length})
          </button>
          <button
            onClick={() => setFilterStatut('realise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              filterStatut === 'realise'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Réalisé ({travaux.filter((t) => t.statut === 'realise').length})
          </button>
          <button
            onClick={() => setFilterStatut('annule')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              filterStatut === 'annule'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Annulé ({travaux.filter((t) => t.statut === 'annule').length})
          </button>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Bien Immobilier</th>
                <th className="py-3.5 px-4">Description de l&apos;Intervention</th>
                <th className="py-3.5 px-4">Date & Prestataire</th>
                <th className="py-3.5 px-4 text-right">Coût Travaux</th>
                <th className="py-3.5 px-4 text-center">Règle d&apos;Imputation</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTravaux.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Aucune réparation ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTravaux.map((t) => {
                  const targetBien = biens.find((b) => b.id === t.bien_id);
                  const currentStatut = t.statut || 'en_attente';
                  const isMenuOpen = statusMenuOpenId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      {/* Bien */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          {targetBien?.code_reference || 'BIEN'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {targetBien?.commune_quartier}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 text-xs">{t.description}</p>
                      </td>

                      {/* Date & Prestataire */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-semibold text-slate-800">
                          {formatDateFR(t.date_intervention)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t.prestataire_nom || 'Intervenant cabinet'}
                        </p>
                      </td>

                      {/* Cout */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatFCFA(t.cout)}
                      </td>

                      {/* Imputation */}
                      <td className="py-3.5 px-4 text-center">
                        <div>
                          {getImputationBadge(t.imputation)}
                          {t.imputation === 'impute_au_loyer' && t.loyer_impacte_mois && t.loyer_impacte_annee && (
                            <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                              Impact: {formatMonthYearFR(t.loyer_impacte_mois, t.loyer_impacte_annee)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Statut & Changer Statut Dropdown */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setStatusMenuOpenId(isMenuOpen ? null : t.id)}
                            className="inline-flex items-center space-x-1 cursor-pointer hover:opacity-85 transition group"
                            title="Cliquer pour changer le statut"
                          >
                            {getStatusBadge(currentStatut)}
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                          </button>

                          {/* Status Popover Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 z-30 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in duration-150">
                              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                Changer le statut
                              </p>
                              
                              <button
                                type="button"
                                onClick={async () => {
                                  if (onChangeStatutTravaux) {
                                    await onChangeStatutTravaux(t.id, 'en_attente');
                                  }
                                  setStatusMenuOpenId(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-amber-50 transition ${
                                  currentStatut === 'en_attente' ? 'font-bold text-amber-800 bg-amber-50/50' : 'text-slate-700'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>En attente</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (onChangeStatutTravaux) {
                                    await onChangeStatutTravaux(t.id, 'realise');
                                  }
                                  setStatusMenuOpenId(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-emerald-50 transition ${
                                  currentStatut === 'realise' ? 'font-bold text-emerald-800 bg-emerald-50/50' : 'text-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Réalisé</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (onChangeStatutTravaux) {
                                    await onChangeStatutTravaux(t.id, 'annule');
                                  }
                                  setStatusMenuOpenId(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-rose-50 transition ${
                                  currentStatut === 'annule' ? 'font-bold text-rose-800 bg-rose-50/50' : 'text-slate-700'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Annulé</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Bouton Modifier (Icône) */}
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-xl transition active:scale-95"
                            title="Modifier la réparation"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Bouton Supprimer */}
                          {onDeleteTravaux && (
                            <button
                              onClick={async () => {
                                if (confirm(`Confirmez-vous la suppression de cette réparation : "${t.description}" ?`)) {
                                  await onDeleteTravaux(t.id);
                                }
                              }}
                              className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl transition active:scale-95"
                              title="Supprimer la réparation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingTravaux ? 'Modifier la Réparation' : 'Enregistrement d\'une Réparation'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Select Bien */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Bien Immobilier Concerné *
                </label>
                <select
                  value={bienId}
                  onChange={(e) => setBienId(e.target.value)}
                  className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                  required
                >
                  <option value="">-- Choisir un bien immobilier --</option>
                  {biens.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code_reference} - {b.commune_quartier} ({b.adresse_precise})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Description des Travaux / Réparations *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Remplacement du chauffe-eau, réparation serrure..."
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Coût & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Coût Total (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={cout}
                    onChange={(e) => setCout(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 35000"
                    min={1000}
                    step={1000}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Date d&apos;Intervention *
                  </label>
                  <input
                    type="date"
                    value={dateIntervention}
                    onChange={(e) => setDateIntervention(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Statut de la Réparation */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="text-xs font-bold text-slate-700 uppercase block">
                  Statut de l&apos;intervention *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatut('en_attente')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      statut === 'en_attente'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>En attente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatut('realise')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      statut === 'realise'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Réalisé</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatut('annule')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      statut === 'annule'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Annulé</span>
                  </button>
                </div>
              </div>

              {/* Prestataire */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Prestataire / Artisan
                </label>
                <input
                  type="text"
                  value={prestataireNom}
                  onChange={(e) => setPrestataireNom(e.target.value)}
                  placeholder="Ex: Électricité Générale Abidjan"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Imputation Rule */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase flex items-center">
                  <Tag className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Règle d&apos;Imputation Financière *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="imputation"
                      value="impute_au_loyer"
                      checked={imputation === 'impute_au_loyer'}
                      onChange={() => setImputation('impute_au_loyer')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Imputer au Loyer</p>
                      <p className="text-slate-500 text-[11px]">
                        S&apos;ajoute automatiquement au loyer exigible du locataire.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="imputation"
                      value="a_la_charge_proprietaire"
                      checked={imputation === 'a_la_charge_proprietaire'}
                      onChange={() => setImputation('a_la_charge_proprietaire')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Charge Propriétaire</p>
                      <p className="text-slate-500 text-[11px]">
                        Déduit du bordereau de reversement du bailleur.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Target Month if Imputed to Rent */}
                {imputation === 'impute_au_loyer' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-bold text-amber-800">
                        Mois d&apos;Impact Loyer
                      </label>
                      <select
                        value={loyerImpacteMois}
                        onChange={(e) => setLoyerImpacteMois(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                          <option key={m} value={m}>
                            {formatMonthYearFR(m, loyerImpacteAnnee)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-800">
                        Année d&apos;Impact
                      </label>
                      <input
                        type="number"
                        value={loyerImpacteAnnee}
                        onChange={(e) => setLoyerImpacteAnnee(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-700/20 transition"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : editingTravaux
                    ? 'Sauvegarder les modifications'
                    : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
