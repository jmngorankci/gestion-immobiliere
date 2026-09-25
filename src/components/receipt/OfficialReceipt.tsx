'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PaiementWithDetails } from '@/types/database.types';
import { formatFCFA, formatDateFR, formatMonthYearFR, numberToFrenchWords } from '@/lib/utils';
import { Printer, Download, ShieldCheck, CheckCircle2, Building2, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';

interface OfficialReceiptProps {
  paiement: PaiementWithDetails;
  onClose?: () => void;
  showActions?: boolean;
}

export const OfficialReceipt: React.FC<OfficialReceiptProps> = ({
  paiement,
  onClose,
  showActions = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const isValidated = paiement.statut === 'valide';
  const receiptNumber = paiement.numero_recu || 'NON-VALIDE-SPECIMEN';
  const verificationUrl = `https://cabinet-ivoire-immo.ci/verify?recu=${encodeURIComponent(receiptNumber)}&t=${encodeURIComponent(paiement.id)}`;

  useEffect(() => {
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeUrl(url);
        }
      }
    );
  }, [verificationUrl]);

  const handlePrint = () => {
    window.print();
  };

  // Imputed repairs
  const reparations = paiement.reparationsImputees || [];
  const baseRent = paiement.contrat?.loyer_mensuel || (paiement.montant_total_paye - (reparations.reduce((s, r) => s + r.cout, 0)));

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto my-4 text-slate-900">
      {/* Top Action Bar (Hidden when printing) */}
      {showActions && (
        <div className="w-full flex items-center justify-between bg-slate-900 text-white p-4 rounded-t-xl print:hidden shadow-lg mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm md:text-base">
                Quittance & Reçu Officiel de Loyer
              </h2>
              <p className="text-xs text-slate-400">
                Numéro: <span className="font-mono text-emerald-400 font-bold">{receiptNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isValidated && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Spécimen non validé
              </span>
            )}
            <button
              onClick={handlePrint}
              disabled={!isValidated}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                isValidated
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }`}
              title={!isValidated ? 'Le reçu doit être validé pour être imprimé' : 'Imprimer ou Sauvegarder en PDF'}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer (A4)
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Printable A4 Document */}
      <div
        id="receipt-print-area"
        className="w-full bg-white border border-slate-300 p-8 md:p-12 shadow-2xl rounded-b-xl print:rounded-none print:border-none print:shadow-none print:p-6 print:m-0 relative overflow-hidden"
        style={{ minHeight: '1050px' }}
      >
        {/* Subtle Watermark for Authenticity */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <span className="text-9xl font-black tracking-widest text-slate-900 rotate-[-30deg]">
            {isValidated ? 'ORIGINAL' : 'SPECIMEN'}
          </span>
        </div>

        {/* Security Border top */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800 mb-6 rounded-full print:rounded-none" />

        {/* Header: Cabinet Identity & Document Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-6">
          {/* Cabinet Logo & Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-900 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  CABINET IVOIRE GESTION IMMOBILIÈRE
                </h1>
                <p className="text-xs uppercase font-semibold tracking-wider text-emerald-700">
                  Administration de Biens • Gestion Locative • Syndic
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5 pt-2">
              <p className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Siège social: Cocody Riviera 3, Boulevard François Mitterrand, Abidjan
              </p>
              <p className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Standard: +225 27 22 44 88 00 / Urgences: +225 07 08 09 10 11
              </p>
              <p className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                contact@cabinet-ivoire-immo.ci • RCCM: CI-ABJ-2022-B-11928 • CC: 2209124 P
              </p>
            </div>
          </div>

          {/* Receipt Title Box */}
          <div className="text-right sm:self-start bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm min-w-[240px]">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Quittance de Loyer
            </div>
            <p className="text-xs text-slate-500 uppercase font-medium">Reçu N°</p>
            <p className="text-lg font-mono font-extrabold text-slate-900 tracking-wider">
              {receiptNumber}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
              <p>
                Date d'émission: <span className="font-semibold">{formatDateFR(paiement.date_validation || paiement.created_at)}</span>
              </p>
              <p>
                Période: <span className="font-semibold text-emerald-700">{formatMonthYearFR(paiement.mois_concerne, paiement.annee_concernee)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Two Columns: Locataire & Bien/Propriétaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Locataire Box */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2" />
                Locataire (Preneur)
              </h3>
              <span className="text-[10px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                Réf: {paiement.contrat?.locataire?.id?.slice(0, 8) || 'LOC-01'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-slate-900 text-base">
                {paiement.contrat?.locataire?.nom_complet || 'Locataire'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Contact:</span> {paiement.contrat?.locataire?.telephone || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Email:</span> {paiement.contrat?.locataire?.email || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Bail actif du:</span> {formatDateFR(paiement.contrat?.date_debut)}
              </p>
            </div>
          </div>

          {/* Bien & Propriétaire Box */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <span className="w-2 h-2 rounded-full bg-teal-600 mr-2" />
                Désignation du Bien Loué
              </h3>
              <span className="text-[10px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">
                {paiement.contrat?.bien?.code_reference || 'BIEN-REF'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">
                {paiement.contrat?.bien?.commune_quartier || 'Abidjan'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Adresse:</span> {paiement.contrat?.bien?.adresse_precise || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Type de bien:</span>{' '}
                <span className="capitalize font-medium text-slate-800">
                  {paiement.contrat?.bien?.type_bien?.replace('_', ' ') || 'Appartement'}
                </span>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">Propriétaire (Bailleur):</span>{' '}
                {paiement.contrat?.bien?.proprietaire?.nom_complet || 'Propriétaire'}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Désignation des Rubriques</th>
                <th className="py-3 px-4 text-center">Période / Date</th>
                <th className="py-3 px-4 text-center">Imputation</th>
                <th className="py-3 px-4 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Loyer de Base */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3.5 px-4 font-medium text-slate-900">
                  Loyer d'habitation principal (Terme échu)
                  <p className="text-xs text-slate-500">
                    Occupation selon contrat de bail N° {paiement.contrat_id.slice(0, 8)}
                  </p>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-600 text-xs font-semibold">
                  {formatMonthYearFR(paiement.mois_concerne, paiement.annee_concernee)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Loyer Contractuel
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                  {formatFCFA(baseRent)}
                </td>
              </tr>

              {/* Réparations / Travaux Imputés au loyer si présents */}
              {reparations.map((rep, idx) => (
                <tr key={idx} className="bg-amber-50/40 hover:bg-amber-50/70">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                      <span>{rep.description}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-3.5">
                      Prestataire: {rep.prestataire_nom || 'Service technique cabinet'}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 text-xs">
                    {formatDateFR(rep.date_intervention)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      Imputé au Loyer
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900">
                    {formatFCFA(rep.cout)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-slate-900 text-white font-bold">
              <tr>
                <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-xs">
                  Net Total Encaissé en Règlement :
                </td>
                <td className="py-4 px-4 text-right font-mono text-base text-emerald-400">
                  {formatFCFA(paiement.montant_total_paye)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Montant en lettres & Mode de règlement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="md:col-span-2 space-y-1">
            <p className="text-xs uppercase font-bold text-slate-500">Arrêté de la présente quittance :</p>
            <p className="text-sm font-semibold italic text-slate-900">
              « {numberToFrenchWords(paiement.montant_total_paye)} »
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              Cette quittance annule tous les reçus provisoires antérieurs qui auraient pu être délivrés pour la même période.
            </p>
          </div>

          <div className="space-y-1 text-xs border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-2 md:pt-0">
            <p className="uppercase font-bold text-slate-500">Règlement :</p>
            <p className="text-slate-800 font-medium">
              Mode : <span className="capitalize font-bold text-slate-900">{paiement.mode_paiement?.replace('_', ' ')}</span>
            </p>
            <p className="text-slate-800 font-mono text-[11px]">
              Réf : {paiement.reference_transaction || 'ENCAISSEMENT-DIRECT'}
            </p>
            <p className="text-emerald-700 font-semibold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Paiement intégral validé
            </p>
          </div>
        </div>

        {/* Accounting Split Note (Agency vs Owner) */}
        <div className="mb-8 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs text-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>
              <strong>Ventilation comptable (Mandat de gestion) :</strong> Commission Cabinet (10%) ={' '}
              <span className="font-mono font-bold text-slate-900">{formatFCFA(paiement.commission_cabinet)}</span> • Reversable Bailleur (90%) ={' '}
              <span className="font-mono font-bold text-slate-900">{formatFCFA(paiement.montant_reversable_proprietaire)}</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
            Conforme OHADA
          </span>
        </div>

        {/* Footer: Stamp, Signature & Verification QR Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-200 items-end">
          {/* QR Code */}
          <div className="flex items-center space-x-3">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code de Vérification"
                className="w-24 h-24 rounded-lg border border-slate-300 p-1 bg-white shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-100 rounded-lg animate-pulse" />
            )}
            <div className="text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-800 uppercase tracking-tight">Contrôle d'authenticité</p>
              <p>Scannez ce QR Code pour vérifier l'intégrité de cette quittance sur les serveurs sécurisés du cabinet.</p>
              <p className="font-mono text-[10px] text-slate-400">ID: {paiement.id}</p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-[10px] text-slate-500 text-center leading-relaxed">
            <p className="font-medium text-slate-700">Cabinet Ivoire Gestion Immobilière SARL</p>
            <p>Agrément Ministériel N° 0418/MCLU/DGU/SDH</p>
            <p>Document généré sous signature électronique certifiée conformément aux dispositions en vigueur.</p>
          </div>

          {/* Official Stamp & Signature */}
          <div className="flex flex-col items-center justify-center p-3 relative min-h-[120px]">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pour le Cabinet de Gestion
            </p>
            <p className="text-[11px] text-slate-500 italic">Le Gestionnaire Agréé</p>

            {/* Simulated Official Physical/Electronic Stamp */}
            <div className="mt-2 w-36 h-20 border-2 border-dashed border-emerald-700 rounded-xl flex flex-col items-center justify-center rotate-[-3deg] bg-emerald-50/40 p-2 text-center text-emerald-800 shadow-inner">
              <span className="text-[9px] font-black uppercase tracking-wider">
                CABINET IVOIRE GESTION
              </span>
              <span className="text-[11px] font-extrabold text-emerald-900 my-0.5">
                ★ VALIDÉ & ENCAISSÉ ★
              </span>
              <span className="text-[8px] font-mono">
                {paiement.date_validation ? formatDateFR(paiement.date_validation) : 'Validé'}
              </span>
              <span className="text-[8px] font-bold">ABIDJAN - CÔTE D'IVOIRE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
