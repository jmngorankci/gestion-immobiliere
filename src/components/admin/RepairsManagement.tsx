'use client';

import React, { useState } from 'react';
import { Bien, RepairImputation, TravauxReparation } from '@/types/database.types';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  Wrench,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Building,
  Calendar,
  DollarSign,
  Tag,
  FileText,
} from 'lucide-react';

interface RepairsManagementProps {
  travaux: TravauxReparation[];
  biens: Bien[];
  onAddTravaux: (item: Omit<TravauxReparation, 'id' | 'created_at'>) => Promise<TravauxReparation>;
}

export const RepairsManagement: React.FC<RepairsManagementProps> = ({
  travaux,
  biens,
  onAddTravaux,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [bienId, setBienId] = useState(biens[0]?.id || '');
  const [description, setDescription] = useState('');
  const [cout, setCout] = useState<number>(25000);
  const [dateIntervention, setDateIntervention] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [imputation, setImputation] = useState<RepairImputation>('impute_au_loyer');
  const [loyerImpacteMois, setLoyerImpacteMois] = useState<number>(new Date().getMonth() + 1);
  const [loyerImpacteAnnee, setLoyerImpacteAnnee] = useState<number>(new Date().getFullYear());
  const [prestataireNom, setPrestataireNom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || cout <= 0) {
      alert('Veuillez remplir correctement les champs obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTravaux({
        bien_id: bienId,
        description,
        cout,
        date_intervention: dateIntervention,
        imputation,
        loyer_impacte_mois: imputation === 'impute_au_loyer' ? loyerImpacteMois : null,
        loyer_impacte_annee: imputation === 'impute_au_loyer' ? loyerImpacteAnnee : null,
        justificatif_facture_url: null,
        prestataire_nom: prestataireNom || 'Prestataire Agréé',
        est_regle: true,
      });

      setShowAddModal(false);
      setDescription('');
      setCout(25000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Wrench className="w-6 h-6 mr-2.5 text-emerald-600" />
            Suivi des Travaux, Réparations & Imputations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez les interventions techniques et appliquez automatiquement l'imputation financière sur le loyer ou le reversement propriétaire.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Enregistrer une Réparation
        </button>
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Bien Immobilier</th>
                <th className="py-3.5 px-4">Description de l'Intervention</th>
                <th className="py-3.5 px-4">Date & Prestataire</th>
                <th className="py-3.5 px-4 text-right">Coût Travaux</th>
                <th className="py-3.5 px-4 text-center">Règle d'Imputation</th>
                <th className="py-3.5 px-4 text-center">Impact Loyer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {travaux.map((t) => {
                const targetBien = biens.find((b) => b.id === t.bien_id);
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
                      <p className="font-medium text-slate-800">{t.description}</p>
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
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-base">
                      {formatFCFA(t.cout)}
                    </td>

                    {/* Imputation */}
                    <td className="py-3.5 px-4 text-center">
                      {getImputationBadge(t.imputation)}
                    </td>

                    {/* Impact Loyer */}
                    <td className="py-3.5 px-4 text-center text-xs">
                      {t.imputation === 'impute_au_loyer' && t.loyer_impacte_mois && t.loyer_impacte_annee ? (
                        <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          {formatMonthYearFR(t.loyer_impacte_mois, t.loyer_impacte_annee)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Enregistrement d'une Réparation</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Select Bien */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Bien Immobilier Concerné *
                </label>
                <select
                  value={bienId}
                  onChange={(e) => setBienId(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
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
                    onChange={(e) => setCout(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Date d'Intervention *
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

              {/* Imputation Rule (Critical business requirement) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase flex items-center">
                  <Tag className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Règle d'Imputation Financière *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
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
                        S'ajoute automatiquement au loyer exigible du locataire.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
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
                        Mois d'Impact Loyer
                      </label>
                      <select
                        value={loyerImpacteMois}
                        onChange={(e) => setLoyerImpacteMois(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                        Année d'Impact
                      </label>
                      <input
                        type="number"
                        value={loyerImpacteAnnee}
                        onChange={(e) => setLoyerImpacteAnnee(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg font-mono font-bold"
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
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-700/20"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
