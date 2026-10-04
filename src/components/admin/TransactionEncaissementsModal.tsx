'use client';

import React, { useState } from 'react';
import {
  TransactionVente,
  Bien,
  Acquereur,
  Proprietaire,
  Notaire,
  EncaissementVente,
  TypeEncaissementVente,
  PaymentMode,
  PaymentStatus,
} from '@/types/database.types';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  X,
  CreditCard,
  PlusCircle,
  Trash2,
  Printer,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  AlertCircle,
  FileCheck2,
  Edit,
  Clock,
  XCircle,
} from 'lucide-react';
import { SaleReceiptModal } from './SaleReceiptModal';
import { EditSalePaymentModal } from './EditSalePaymentModal';

interface TransactionEncaissementsModalProps {
  transaction: TransactionVente & {
    biens?: Bien;
    acquereurs?: Acquereur;
    proprietaires?: Proprietaire;
    notaires?: Notaire | null;
  };
  encaissements: EncaissementVente[];
  onClose: () => void;
  onAddEncaissement: (payload: {
    transaction_vente_id: string;
    montant: number;
    date_encaissement: string;
    type_encaissement: TypeEncaissementVente;
    mode_paiement: PaymentMode;
    reference_paiement?: string;
    notes?: string;
  }) => Promise<void>;
  onDeleteEncaissement: (id: string) => Promise<void>;
  onUpdateEncaissement?: (id: string, updates: Partial<EncaissementVente>) => Promise<void>;
  onValidateEncaissement?: (id: string) => Promise<void>;
}

export const TransactionEncaissementsModal: React.FC<TransactionEncaissementsModalProps> = ({
  transaction,
  encaissements,
  onClose,
  onAddEncaissement,
  onDeleteEncaissement,
  onUpdateEncaissement,
  onValidateEncaissement,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [montant, setMontant] = useState<number | ''>('');
  const [dateEncaissement, setDateEncaissement] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [typeEncaissement, setTypeEncaissement] =
    useState<TypeEncaissementVente>('acompte_compromis');
  const [modePaiement, setModePaiement] = useState<PaymentMode>('virement');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptToView, setReceiptToView] = useState<EncaissementVente | null>(null);
  const [activeEncaissementForEdit, setActiveEncaissementForEdit] =
    useState<EncaissementVente | null>(null);

  // Financial calculations
  const txEncaissements = encaissements.filter(
    (e) => e.transaction_vente_id === transaction.id
  );

  // Amounts received specifically for property price (excluding pure commission)
  const encaissePrixBien = txEncaissements
    .filter((e) => e.type_encaissement !== 'commission_agence')
    .reduce((sum, e) => sum + Number(e.montant || 0), 0);

  // Amounts received specifically for agency commission
  const encaisseCommission = txEncaissements
    .filter((e) => e.type_encaissement === 'commission_agence')
    .reduce((sum, e) => sum + Number(e.montant || 0), 0);

  const totalEncaisseGlobal = txEncaissements.reduce(
    (sum, e) => sum + Number(e.montant || 0),
    0
  );

  const restePrixBien = Math.max(0, transaction.prix_convenu - encaissePrixBien);
  const resteCommission = Math.max(0, transaction.frais_agence - encaisseCommission);

  const pourcentagePrixBien = transaction.prix_convenu > 0
    ? Math.min(100, Math.round((encaissePrixBien / transaction.prix_convenu) * 100))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) {
      alert('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddEncaissement({
        transaction_vente_id: transaction.id,
        montant: Number(montant),
        date_encaissement: dateEncaissement,
        type_encaissement: typeEncaissement,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setMontant('');
      setReferencePaiement('');
      setNotes('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error("Erreur enregistrement encaissement vente:", err);
      alert(err?.message || "Erreur lors de l'enregistrement de l'encaissement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetAmount = (presetType: 'acompte10' | 'soldeBien' | 'commission') => {
    if (presetType === 'acompte10') {
      const acompte = Math.round(transaction.prix_convenu * 0.1);
      setMontant(acompte);
      setTypeEncaissement('acompte_compromis');
      setNotes('Acompte légal de 10% lors du compromis de vente');
    } else if (presetType === 'soldeBien') {
      setMontant(restePrixBien);
      setTypeEncaissement('solde_vente');
      setNotes('Règlement du solde du prix de vente');
    } else if (presetType === 'commission') {
      setMontant(resteCommission || transaction.frais_agence);
      setTypeEncaissement('commission_agence');
      setNotes('Règlement des honoraires de transaction du cabinet');
    }
    setShowAddForm(true);
  };

  const getTypeBadge = (type: TypeEncaissementVente) => {
    switch (type) {
      case 'acompte_compromis':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
            Acompte Compromis
          </span>
        );
      case 'solde_vente':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
            Solde Vente
          </span>
        );
      case 'commission_agence':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold border border-indigo-200">
            Commission Cabinet
          </span>
        );
      case 'echeance_partielle':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
            Échéance Partielle
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
            Autre
          </span>
        );
    }
  };

  const getStatusBadge = (statut: PaymentStatus = 'en_attente') => {
    switch (statut) {
      case 'valide':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validé
          </span>
        );
      case 'rejete':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      case 'en_attente':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Suivi des Encaissements
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Bien: {transaction.biens?.code_reference}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Vente · {transaction.acquereurs?.nom_complet || 'Acquéreur'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Dashboard */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Prix Convenu */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Prix Total Convenu
              </p>
              <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                {formatFCFA(transaction.prix_convenu)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {transaction.biens?.commune_quartier}
              </p>
            </div>

            {/* Total Encaissé sur le prix */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Prix Bien Encaissé
                </p>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {pourcentagePrixBien}%
                </span>
              </div>
              <p className="text-base font-black text-emerald-700 font-mono mt-0.5">
                {formatFCFA(encaissePrixBien)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Reste: {formatFCFA(restePrixBien)}
              </p>
            </div>

            {/* Commission Cabinet */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Com. Cabinet ({transaction.taux_commission || 5}%)
              </p>
              <p className="text-base font-black text-indigo-700 font-mono mt-0.5">
                {formatFCFA(transaction.frais_agence)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Encaissé : <strong className="text-indigo-800">{formatFCFA(encaisseCommission)}</strong>
              </p>
            </div>

            {/* Total Global Perçu */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total Fonds Reçus
              </p>
              <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                {formatFCFA(totalEncaisseGlobal)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {txEncaissements.length} versement(s)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Progression du recouvrement du prix de vente</span>
              <span>{pourcentagePrixBien}% complété</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pourcentagePrixBien}%` }}
              />
            </div>
          </div>

          {/* Presets & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Raccourcis :</span>
              <button
                type="button"
                onClick={() => setPresetAmount('acompte10')}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold transition"
              >
                + Acompte 10% ({formatFCFA(Math.round(transaction.prix_convenu * 0.1))})
              </button>
              {restePrixBien > 0 && (
                <button
                  type="button"
                  onClick={() => setPresetAmount('soldeBien')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition"
                >
                  + Solde Vente ({formatFCFA(restePrixBien)})
                </button>
              )}
              {resteCommission > 0 && (
                <button
                  type="button"
                  onClick={() => setPresetAmount('commission')}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold transition"
                >
                  + Com. Cabinet ({formatFCFA(resteCommission)})
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              {showAddForm ? 'Masquer formulaire' : 'Nouvel Encaissement'}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* Add Encaissement Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in duration-200"
            >
              <h3 className="text-xs font-bold text-emerald-900 uppercase flex items-center">
                <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                Enregistrer un Versement pour cette Vente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Montant Encaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={montant}
                    onChange={(e) =>
                      setMontant(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ex: 12000000"
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Date d'Encaissement *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateEncaissement}
                    onChange={(e) => setDateEncaissement(e.target.value)}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Type de Règlement *
                  </label>
                  <select
                    value={typeEncaissement}
                    onChange={(e) =>
                      setTypeEncaissement(e.target.value as TypeEncaissementVente)
                    }
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="acompte_compromis">Acompte Compromis (Séquestre)</option>
                    <option value="echeance_partielle">Échéance / Versement Partiel</option>
                    <option value="solde_vente">Solde Prix de Vente</option>
                    <option value="commission_agence">Honoraires Commission Agence</option>
                    <option value="autre">Autre Règlement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Mode de Règlement *
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as PaymentMode)}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque Bancaire</option>
                    <option value="espece">Espèces</option>
                    <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Référence de Transaction / Chèque
                  </label>
                  <input
                    type="text"
                    value={referencePaiement}
                    onChange={(e) => setReferencePaiement(e.target.value)}
                    placeholder="Ex: CHQ-890214 SGBCI ou VIR-78219"
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">
                  Notes / Observations
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Remise de chèque chez le notaire lors de la signature"
                  className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Valider l\'Encaissement'}
                </button>
              </div>
            </form>
          )}

          {/* Table of Encaissements */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Historique des Versements ({txEncaissements.length})
              </h3>
            </div>

            {txEncaissements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Aucun encaissement enregistré</p>
                <p className="text-[11px] text-slate-400">
                  Cliquez sur "Nouvel Encaissement" ou sur un raccourci pour enregistrer le premier versement.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">N° Reçu</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Mode & Référence</th>
                      <th className="py-3 px-3 text-center">Statut</th>
                      <th className="py-3 px-3 text-right">Montant</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {txEncaissements.map((enc) => (
                      <tr key={enc.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-xs">
                          {enc.statut === 'valide' && enc.numero_recu ? (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {enc.numero_recu}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {enc.numero_recu || 'En attente'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {formatDateFR(enc.date_encaissement)}
                        </td>
                        <td className="py-3 px-3">
                          {getTypeBadge(enc.type_encaissement)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="capitalize font-semibold block">
                            {enc.mode_paiement.replace('_', ' ')}
                          </span>
                          {enc.reference_paiement && (
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[150px]">
                              {enc.reference_paiement}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(enc.statut)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {formatFCFA(enc.montant)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {enc.statut === 'en_attente' ? (
                              <>
                                {onUpdateEncaissement && (
                                  <button
                                    onClick={() => setActiveEncaissementForEdit(enc)}
                                    className="inline-flex items-center px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition active:scale-95"
                                    title="Modifier les détails de cet encaissement"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                    Modifier
                                  </button>
                                )}
                                {onValidateEncaissement && (
                                  <button
                                    onClick={() => onValidateEncaissement(enc.id)}
                                    className="inline-flex items-center px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95"
                                    title="Valider l'encaissement et générer le reçu"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                                    Valider
                                  </button>
                                )}
                              </>
                            ) : enc.statut === 'valide' ? (
                              <button
                                onClick={() => setReceiptToView(enc)}
                                className="inline-flex items-center px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
                                title="Afficher et imprimer le reçu officiel"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1" />
                                Reçu
                              </button>
                            ) : null}
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Supprimer l'encaissement de ${formatFCFA(enc.montant)} ?`
                                  )
                                ) {
                                  onDeleteEncaissement(enc.id);
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Supprimer ce versement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Total fonds reçus pour cette transaction :{' '}
            <strong className="text-slate-900 font-mono font-bold">
              {formatFCFA(totalEncaisseGlobal)}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Reçu officiel modal */}
      {receiptToView && (
        <SaleReceiptModal
          encaissement={receiptToView}
          transaction={transaction}
          onClose={() => setReceiptToView(null)}
        />
      )}

      {/* Modal de modification pour encaissement en attente */}
      {activeEncaissementForEdit && onUpdateEncaissement && (
        <EditSalePaymentModal
          encaissement={activeEncaissementForEdit}
          transaction={transaction}
          isOpen={!!activeEncaissementForEdit}
          onClose={() => setActiveEncaissementForEdit(null)}
          onSave={async (id, updates) => {
            await onUpdateEncaissement(id, updates);
            setActiveEncaissementForEdit(null);
          }}
        />
      )}
    </div>
  );
};
