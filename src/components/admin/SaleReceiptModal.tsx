'use client';

import React, { useEffect, useState } from 'react';
import { EncaissementVente, TransactionVente, Bien, Acquereur, Proprietaire, Notaire } from '@/types/database.types';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import { Printer, X, CheckCircle2, ShieldCheck, Building2, User, CreditCard } from 'lucide-react';
import QRCode from 'qrcode';

interface SaleReceiptModalProps {
  encaissement: EncaissementVente;
  transaction: TransactionVente & {
    biens?: Bien;
    acquereurs?: Acquereur;
    proprietaires?: Proprietaire;
    notaires?: Notaire | null;
  };
  onClose: () => void;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  encaissement,
  transaction,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const qrData = JSON.stringify({
      recu: encaissement.numero_recu,
      txId: transaction.id,
      bien: transaction.biens?.code_reference,
      acquereur: transaction.acquereurs?.nom_complet,
      montant: encaissement.montant,
      date: encaissement.date_encaissement,
      emetteur: 'Cabinet Ivoire Immo SARL',
    });

    QRCode.toDataURL(qrData, { width: 140, margin: 1 })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Erreur génération QR Code:', err));
  }, [encaissement, transaction]);

  const handlePrint = () => {
    window.print();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'acompte_compromis':
        return 'Acompte légal / Séquestre Compromis de Vente';
      case 'echeance_partielle':
        return 'Versement Partiel / Échéance';
      case 'solde_vente':
        return 'Règlement du Solde du Prix de Vente';
      case 'commission_agence':
        return "Honoraires & Commission d'Agence Immobilière";
      default:
        return 'Règlement Vente Immobilière';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'virement':
        return 'Virement Bancaire';
      case 'cheque':
        return 'Chèque Bancaire / Chèque Certifié';
      case 'espece':
        return 'Espèces (Encaissées au Guichet)';
      case 'mobile_money':
        return 'Mobile Money (Wave / Orange Money)';
      default:
        return mode;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:border-none print:w-full">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Reçu Officiel d'Encaissement de Vente
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimer / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-7 h-7 text-emerald-600" />
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  CABINET IVOIRE IMMO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Gestion Immobilière · Ventes & Transactions · Conseil Juridique
              </p>
              <p className="text-[10px] text-slate-400">
                Cocody Ambassades · Abidjan, Côte d'Ivoire · Tél: +225 27 20 00 00 00
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded-lg border border-emerald-300">
                {encaissement.numero_recu || 'REC-VTE-2026-0001'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Date d'émission : <strong>{formatDateFR(encaissement.date_encaissement)}</strong>
              </p>
            </div>
          </div>

          {/* Receipt Title */}
          <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-800">
              REÇU DE RÈGLEMENT DE VENTE IMMOBILIÈRE
            </h2>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              {getTypeLabel(encaissement.type_encaissement)}
            </p>
          </div>

          {/* Parties & Property Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-500 uppercase text-[10px]">
                Acquéreur (Payeur)
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {transaction.acquereurs?.nom_complet || 'Acquéreur'}
              </p>
              <p className="text-slate-600">
                Tél : {transaction.acquereurs?.telephone || '-'}
              </p>
              <p className="text-slate-600 truncate">
                Adresse : {transaction.acquereurs?.adresse || 'Abidjan'}
              </p>
            </div>

            <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-500 uppercase text-[10px]">
                Bien Immobilier Concerné
              </p>
              <p className="font-bold text-slate-900 text-sm font-mono">
                {transaction.biens?.code_reference || 'REF-BIEN'}
              </p>
              <p className="text-slate-600 truncate font-medium">
                {transaction.biens?.commune_quartier}
              </p>
              <p className="text-slate-500 text-[11px] truncate">
                Vendeur : {transaction.proprietaires?.nom_complet || '-'}
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description du règlement</th>
                  <th className="py-2.5 px-3">Mode & Référence</th>
                  <th className="py-2.5 px-3 text-right">Montant Encaissé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-800">
                      {getTypeLabel(encaissement.type_encaissement)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {encaissement.notes || 'Règlement au titre de la transaction immobilière'}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 block">
                      {getModeLabel(encaissement.mode_paiement)}
                    </span>
                    {encaissement.reference_paiement && (
                      <span className="font-mono text-[11px] text-slate-500">
                        Réf: {encaissement.reference_paiement}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-black text-emerald-700 text-base">
                      {formatFCFA(encaissement.montant)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transaction Overall Context */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-600">Prix de vente convenu : </span>
              <strong className="font-mono text-slate-900 font-bold">
                {formatFCFA(transaction.prix_convenu)}
              </strong>
            </div>
            {transaction.frais_agence > 0 && (
              <div>
                <span className="text-slate-600">Honoraires agence : </span>
                <strong className="font-mono text-indigo-700 font-bold">
                  {formatFCFA(transaction.frais_agence)} ({transaction.taux_commission || 5}%)
                </strong>
              </div>
            )}
            {transaction.notaires && (
              <div>
                <span className="text-slate-600">Étude Notariale : </span>
                <strong className="text-slate-800">
                  {transaction.notaires.etude_nom || transaction.notaires.nom_complet}
                </strong>
              </div>
            )}
          </div>

          {/* Signatures & Security Validation */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
            <div className="space-y-1">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code de validation"
                  className="w-24 h-24 border border-slate-200 rounded-xl p-1 bg-white"
                />
              )}
              <p className="text-[10px] text-slate-400 font-mono">
                Authentification numérique sécurisée
              </p>
            </div>

            <div className="text-right space-y-2">
              <div className="inline-block p-3 rounded-2xl border border-dashed border-emerald-400 bg-emerald-50/40 text-center min-w-[200px]">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Pour le Cabinet Ivoire Immo
                </p>
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic font-bold text-slate-600 text-sm">
                    Cachet & Signature
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono">
                  Quittance officielle libératoire
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
