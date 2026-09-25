'use client';

import React, { useState } from 'react';
import { PaiementWithDetails } from '@/types/database.types';
import { formatFCFA, formatMonthYearFR, formatDateFR } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Building,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Eye,
  Printer,
} from 'lucide-react';
import { OfficialReceipt } from '@/components/receipt/OfficialReceipt';

interface PaymentValidationModalProps {
  paiement: PaiementWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmValidate: (paiementId: string, notes?: string) => Promise<PaiementWithDetails>;
  onConfirmReject: (paiementId: string, reason: string) => Promise<void>;
}

export const PaymentValidationModal: React.FC<PaymentValidationModalProps> = ({
  paiement,
  isOpen,
  onClose,
  onConfirmValidate,
  onConfirmReject,
}) => {
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedPayment, setValidatedPayment] = useState<PaiementWithDetails | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  if (!isOpen || !paiement) return null;

  const handleValidate = async () => {
    try {
      setIsSubmitting(true);
      const res = await onConfirmValidate(paiement.id, notes);
      setValidatedPayment(res);
      setShowReceiptPreview(true);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Veuillez renseigner un motif de rejet.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirmReject(paiement.id, rejectReason);
      onClose();
    } catch (err) {
      console.error('Rejection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showReceiptPreview && (validatedPayment || paiement.statut === 'valide')) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 flex justify-center items-start">
        <div className="w-full max-w-5xl my-6">
          <OfficialReceipt
            paiement={validatedPayment || paiement}
            onClose={() => {
              setShowReceiptPreview(false);
              onClose();
            }}
          />
        </div>
      </div>
    );
  }

  const commission = paiement.commission_cabinet || Math.round(paiement.montant_total_paye * 0.1);
  const reversement = paiement.montant_reversable_proprietaire || (paiement.montant_total_paye - commission);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Contrôle & Validation d'Encaissement</h3>
              <p className="text-xs text-slate-300">
                Période : {formatMonthYearFR(paiement.mois_concerne, paiement.annee_concernee)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Key Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
                <User className="w-4 h-4 mr-1.5 text-slate-700" />
                Locataire (Preneur)
              </div>
              <p className="font-bold text-slate-900 text-base">
                {paiement.contrat?.locataire?.nom_complet || 'Locataire'}
              </p>
              <p className="text-xs text-slate-600">
                Tél: <span className="font-medium text-slate-800">{paiement.contrat?.locataire?.telephone || '-'}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
                <Building className="w-4 h-4 mr-1.5 text-slate-700" />
                Bien Loué & Bailleur
              </div>
              <p className="font-bold text-slate-900 text-sm">
                {paiement.contrat?.bien?.code_reference} - {paiement.contrat?.bien?.commune_quartier}
              </p>
              <p className="text-xs text-slate-600">
                Bailleur: <span className="font-medium text-slate-800">{paiement.contrat?.bien?.proprietaire?.nom_complet}</span>
              </p>
            </div>
          </div>

          {/* Payment & Financial Split Breakdown */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-medium">Montant Total Déclaré</p>
                <p className="text-2xl font-mono font-extrabold text-emerald-400">
                  {formatFCFA(paiement.montant_total_paye)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  {paiement.mode_paiement?.replace('_', ' ')}
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Réf: {paiement.reference_transaction || 'N/A'}
                </p>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium">Commission Cabinet (10%)</p>
                <p className="text-base font-mono font-bold text-amber-300 mt-0.5">
                  {formatFCFA(commission)}
                </p>
                <p className="text-[10px] text-slate-400">Honoraires de gestion</p>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium">Reversement Propriétaire (90%)</p>
                <p className="text-base font-mono font-bold text-teal-300 mt-0.5">
                  {formatFCFA(reversement)}
                </p>
                <p className="text-[10px] text-slate-400">Bordereau de reversement</p>
              </div>
            </div>
          </div>

          {/* Proof of Payment if available */}
          {paiement.preuve_paiement_url && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase flex items-center">
                <FileText className="w-4 h-4 mr-1 text-slate-600" />
                Justificatif / Preuve de Paiement
              </p>
              <div className="flex items-center space-x-3">
                <img
                  src={paiement.preuve_paiement_url}
                  alt="Preuve de transaction"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(paiement.preuve_paiement_url || '', '_blank')}
                />
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Capture de virement / Mobile Money</p>
                  <a
                    href={paiement.preuve_paiement_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium mt-1"
                  >
                    Ouvrir en plein écran <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Input: Validation Notes or Rejection Reason */}
          {!isRejecting ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Notes de validation (Optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Virement vérifié sur relevé bancaire SGBCI du jour..."
                rows={2}
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2 bg-rose-50 border border-rose-200 rounded-xl p-4">
              <label className="text-xs font-bold text-rose-800 uppercase flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-rose-600" />
                Motif obligatoire du Rejet
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Référence transaction introuvable, montant incomplet, etc."
                rows={2}
                className="w-full text-sm p-3 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {!isRejecting ? (
            <>
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Rejeter l'encaissement
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-700/20 transition disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Validation...' : 'Valider & Générer le Reçu'}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-md transition disabled:opacity-60"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Confirmer le Rejet
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
