'use client';

import React, { useState } from 'react';
import { ContratBail, PaymentMode } from '@/types/database.types';
import { useAppStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import {
  CreditCard,
  X,
  Building,
  User,
  Calendar,
  CheckCircle2,
  FileCheck2,
  DollarSign,
  FileText,
} from 'lucide-react';

interface NewPaymentModalProps {
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

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ isOpen, onClose }) => {
  const { contrats, biens, profiles, ajouterEncaissementAdmin } = useAppStore();

  const activeContracts = contrats.filter((c) => c.statut === 'actif');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedContratId, setSelectedContratId] = useState<string>('');
  const [mois, setMois] = useState<number>(currentMonth);
  const [annee, setAnnee] = useState<number>(currentYear);
  const [montant, setMontant] = useState<number | ''>('');
  const [modePaiement, setModePaiement] = useState<PaymentMode>('espece');
  const [referenceTransaction, setReferenceTransaction] = useState<string>('');
  const [statutDirect, setStatutDirect] = useState<'valide' | 'en_attente'>('valide');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleContractChange = (contratId: string) => {
    setSelectedContratId(contratId);
    const contrat = contrats.find((c) => c.id === contratId);
    if (contrat) {
      setMontant(contrat.loyer_mensuel);
    }
  };

  const numMontant = typeof montant === 'number' ? montant : 0;
  const commission = Math.round(numMontant * 0.1);
  const netProprietaire = numMontant - commission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContratId) {
      alert('Veuillez sélectionner un locataire / contrat de bail.');
      return;
    }
    if (!montant || numMontant <= 0) {
      alert('Veuillez saisir un montant d encaissement valide.');
      return;
    }

    try {
      setIsSubmitting(true);
      await ajouterEncaissementAdmin({
        contratId: selectedContratId,
        mois,
        annee,
        montant: numMontant,
        modePaiement,
        referenceTransaction: referenceTransaction.trim() || undefined,
        statutDirect,
        notes: notes.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err?.message || 'Erreur lors de l enregistrement de l encaissement.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">Enregistrer un Nouvel Encaissement</h3>
              <p className="text-xs text-slate-400">
                Saisie manuelle d&apos;un règlement de loyer (Espèces, Wave, Virement...)
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Sélection du Contrat / Locataire & Bien */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Locataire & Bien Associé *
            </label>
            <select
              value={selectedContratId}
              onChange={(e) => handleContractChange(e.target.value)}
              className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
              required
            >
              <option value="">-- Sélectionner le bail / locataire --</option>
              {activeContracts.map((c) => {
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
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
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
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Montant Encaissé */}
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
              className="w-full text-base p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-extrabold text-slate-900"
              required
            />
          </div>

          {/* Répartition automatique Preview */}
          {numMontant > 0 && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Commission Cabinet (10%) :</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {formatFCFA(commission)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Net Propriétaire (90%) :</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatFCFA(netProprietaire)}
                </span>
              </div>
            </div>
          )}

          {/* Mode de Paiement & Réf Transaction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Mode de Règlement *
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as PaymentMode)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              >
                <option value="espece">Espèces (Au guichet)</option>
                <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                <option value="virement">Virement Bancaire / Chèque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Référence / Reçu externe
              </label>
              <input
                type="text"
                value={referenceTransaction}
                onChange={(e) => setReferenceTransaction(e.target.value)}
                placeholder="Ex: TX-WAVE-8921 / CHQ 4589"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Option de validation directe */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="text-xs font-bold text-slate-700 uppercase block">
              Traitement du règlement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatutDirect('valide')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  statutDirect === 'valide'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider & Générer Reçu</span>
              </button>

              <button
                type="button"
                onClick={() => setStatutDirect('en_attente')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  statutDirect === 'en_attente'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Mettre En Attente</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {statutDirect === 'valide'
                ? 'Le reçu officiel REC-2026-XXXX avec QR Code sera immédiatement généré et imprimable.'
                : 'L encaissement apparaîtra avec le statut "En attente" pour validation ultérieure.'}
            </p>
          </div>

          {/* Notes / Remarques */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Notes / Remarques (Optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Règlement remis en main propre à l agence..."
              rows={2}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center space-x-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer l Encaissement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
