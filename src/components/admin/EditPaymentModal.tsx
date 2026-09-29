'use client';

import React, { useState, useEffect } from 'react';
import { PaiementWithDetails, PaymentMode } from '@/types/database.types';
import { useAppStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import {
  Edit,
  X,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EditPaymentModalProps {
  paiement: PaiementWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  paiement,
  isOpen,
  onClose,
}) => {
  const { contrats, biens, profiles, modifierEncaissement } = useAppStore();

  const [selectedContratId, setSelectedContratId] = useState<string>('');
  const [mois, setMois] = useState<number>(1);
  const [annee, setAnnee] = useState<number>(2026);
  const [montant, setMontant] = useState<number | ''>('');
  const [modePaiement, setModePaiement] = useState<PaymentMode>('espece');
  const [referenceTransaction, setReferenceTransaction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (paiement) {
      setSelectedContratId(paiement.contrat_id);
      setMois(paiement.mois_concerne);
      setAnnee(paiement.annee_concernee);
      setMontant(paiement.montant_total_paye);
      setModePaiement(paiement.mode_paiement);
      setReferenceTransaction(paiement.reference_transaction || '');
      setNotes(paiement.notes || '');
    }
  }, [paiement]);

  if (!isOpen || !paiement) return null;

  // Seuls les paiements en attente peuvent être modifiés
  if (paiement.statut !== 'en_attente') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">Modification impossible</h3>
          <p className="text-sm text-slate-600">
            Seuls les encaissements ayant le statut <strong>En attente</strong> peuvent être modifiés. Cet encaissement a déjà été validé ou traité.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const selectedContrat = contrats.find((c) => c.id === selectedContratId) || paiement.contrat;
  const tauxCom = typeof selectedContrat?.taux_commission === 'number' ? selectedContrat.taux_commission : 10;
  const numMontant = typeof montant === 'number' ? montant : 0;
  const commission = Math.round(numMontant * (tauxCom / 100));
  const netProprietaire = numMontant - commission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratId) {
      alert('Veuillez sélectionner un locataire / contrat.');
      return;
    }
    if (!montant || numMontant <= 0) {
      alert('Veuillez renseigner un montant valide.');
      return;
    }

    try {
      setIsSubmitting(true);
      await modifierEncaissement(paiement.id, {
        contratId: selectedContratId,
        mois,
        annee,
        montant: numMontant,
        modePaiement,
        referenceTransaction: referenceTransaction.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err?.message || 'Erreur lors de la modification de l encaissement.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Edit className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Modifier l&apos;Encaissement en Attente</h3>
              <p className="text-xs text-slate-400">
                Réf: {paiement.reference_transaction || paiement.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Bail / Locataire */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Locataire & Bien Associé *
            </label>
            <select
              value={selectedContratId}
              onChange={(e) => setSelectedContratId(e.target.value)}
              className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
              required
            >
              {contrats.map((c) => {
                const loc = profiles.find((u) => u.id === c.locataire_profile_id);
                const bien = biens.find((b) => b.id === c.bien_id);
                return (
                  <option key={c.id} value={c.id}>
                    {loc?.nom_complet || 'Locataire'} — {bien?.code_reference} ({bien?.commune_quartier}) - {formatFCFA(c.loyer_mensuel)}/mois
                  </option>
                );
              })}
            </select>
          </div>

          {/* Période (Mois & Année) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Mois concerné *
              </label>
              <select
                value={mois}
                onChange={(e) => setMois(Number(e.target.value))}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold"
                required
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Année *
              </label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
                min={2020}
                max={2035}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Montant Total Encaissé (FCFA) *
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ex: 450000"
              min={1000}
              step={1000}
              className="w-full text-base p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono font-extrabold text-slate-900"
              required
            />
          </div>

          {/* Preview Commission & Net */}
          {numMontant > 0 && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Commission Cabinet ({tauxCom}%) :</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  {formatFCFA(commission)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Net Propriétaire ({100 - tauxCom}%) :</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatFCFA(netProprietaire)}
                </span>
              </div>
            </div>
          )}

          {/* Mode & Réf */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Mode de Règlement *
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as PaymentMode)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold"
                required
              >
                <option value="espece">Espèces</option>
                <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                <option value="virement">Virement Bancaire / Chèque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Référence Transaction
              </label>
              <input
                type="text"
                value={referenceTransaction}
                onChange={(e) => setReferenceTransaction(e.target.value)}
                placeholder="Ex: TX-WAVE-8921"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Notes & Remarques
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes concernant cet encaissement..."
              rows={2}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-700/20 active:scale-95 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Mise à jour...' : 'Sauvegarder les modifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
