'use client';

import React, { useState, useEffect } from 'react';
import {
  EncaissementVente,
  TransactionVente,
  Bien,
  Acquereur,
  Proprietaire,
  TypeEncaissementVente,
  PaymentMode,
  PaymentStatus,
} from '@/types/database.types';
import { formatFCFA } from '@/lib/utils';
import {
  Edit,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface EditSalePaymentModalProps {
  encaissement: EncaissementVente | null;
  transaction?: (TransactionVente & {
    biens?: Bien;
    acquereurs?: Acquereur;
    proprietaires?: Proprietaire;
  }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<EncaissementVente>) => Promise<void>;
}

export const EditSalePaymentModal: React.FC<EditSalePaymentModalProps> = ({
  encaissement,
  transaction,
  isOpen,
  onClose,
  onSave,
}) => {
  const [montant, setMontant] = useState<number | ''>('');
  const [dateEncaissement, setDateEncaissement] = useState('');
  const [typeEncaissement, setTypeEncaissement] =
    useState<TypeEncaissementVente>('acompte_compromis');
  const [modePaiement, setModePaiement] = useState<PaymentMode>('virement');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [statut, setStatut] = useState<PaymentStatus>('en_attente');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (encaissement) {
      setMontant(encaissement.montant);
      setDateEncaissement(encaissement.date_encaissement);
      setTypeEncaissement(encaissement.type_encaissement);
      setModePaiement(encaissement.mode_paiement);
      setReferencePaiement(encaissement.reference_paiement || '');
      setStatut(encaissement.statut || 'en_attente');
      setNotes(encaissement.notes || '');
    }
  }, [encaissement]);

  if (!isOpen || !encaissement) return null;

  // Seuls les encaissements en attente peuvent être modifiés
  if (encaissement.statut !== 'en_attente') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Modification impossible</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seuls les encaissements de vente ayant le statut{' '}
            <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              En attente
            </strong>{' '}
            peuvent être modifiés. Cet encaissement a déjà été validé et sécurisé.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) {
      alert('Veuillez saisir un montant supérieur à 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(encaissement.id, {
        montant: Number(montant),
        date_encaissement: dateEncaissement,
        type_encaissement: typeEncaissement,
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement.trim() || null,
        statut,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      console.error('Erreur modification encaissement vente:', err);
      alert(err?.message || "Erreur lors de la mise à jour de l'encaissement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Modifier l'Encaissement de Vente</h3>
              <p className="text-[11px] text-slate-400">
                Encaissement en attente de confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Transaction Summary Card */}
          {transaction && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-900 font-mono">
                  {transaction.biens?.code_reference} · {transaction.biens?.commune_quartier}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Acheteur : <strong>{transaction.acquereurs?.nom_complet || '-'}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Prix Convenu
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatFCFA(transaction.prix_convenu)}
                </span>
              </div>
            </div>
          )}

          {/* Montant & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Date de Règlement *
              </label>
              <input
                type="date"
                required
                value={dateEncaissement}
                onChange={(e) => setDateEncaissement(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Type & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Nature du Règlement *
              </label>
              <select
                value={typeEncaissement}
                onChange={(e) =>
                  setTypeEncaissement(e.target.value as TypeEncaissementVente)
                }
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="acompte_compromis">Acompte Compromis (Séquestre)</option>
                <option value="echeance_partielle">Échéance / Versement Partiel</option>
                <option value="solde_vente">Solde Prix de Vente</option>
                <option value="commission_agence">Honoraires Commission Agence</option>
                <option value="autre">Autre Règlement</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Mode de Règlement *
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as PaymentMode)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="virement">Virement Bancaire</option>
                <option value="cheque">Chèque Bancaire</option>
                <option value="espece">Espèces</option>
                <option value="mobile_money">Mobile Money (Wave / Orange)</option>
              </select>
            </div>
          </div>

          {/* Référence */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Référence du Paiement / N° Chèque
            </label>
            <input
              type="text"
              value={referencePaiement}
              onChange={(e) => setReferencePaiement(e.target.value)}
              placeholder="Ex: CHQ-BICICI-78192 ou VIR-SGBCI-908234"
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Statut Toggle */}
          <div className="space-y-1 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
            <label className="text-[11px] font-bold text-amber-900 uppercase flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
              Statut de l'Encaissement
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStatut('en_attente')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  statut === 'en_attente'
                    ? 'bg-amber-200 text-amber-900 border-amber-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⏳ Laisser en attente
              </button>
              <button
                type="button"
                onClick={() => setStatut('valide')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  statut === 'valide'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ✓ Valider immédiatement
              </button>
            </div>
            <p className="text-[10px] text-amber-700 mt-1">
              {statut === 'valide'
                ? 'Un numéro de reçu séquentiel sera attribué et la quittance deviendra téléchargeable.'
                : 'L\'encaissement restera modifiable tant qu\'il est en attente.'}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">
              Notes & Commentaires
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations sur le versement..."
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
