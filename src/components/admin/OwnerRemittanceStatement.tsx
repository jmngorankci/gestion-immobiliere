'use client';

import React, { useState } from 'react';
import { Bien, ContratBail, PaiementWithDetails, Proprietaire, TravauxReparation } from '@/types/database.types';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  Building2,
  Download,
  Printer,
  User,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

interface OwnerRemittanceStatementProps {
  proprietaires: Proprietaire[];
  biens: Bien[];
  contrats: ContratBail[];
  paiements: PaiementWithDetails[];
  travaux: TravauxReparation[];
}

export const OwnerRemittanceStatement: React.FC<OwnerRemittanceStatementProps> = ({
  proprietaires,
  biens,
  contrats,
  paiements,
  travaux,
}) => {
  const [selectedPropId, setSelectedPropId] = useState<string>(proprietaires[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const selectedOwner = proprietaires.find((p) => p.id === selectedPropId) || proprietaires[0];
  const ownerBiens = biens.filter((b) => b.proprietaire_id === selectedOwner?.id);
  const ownerBienIds = ownerBiens.map((b) => b.id);

  // Validated payments for this owner in this period
  const validatedPaymentsForPeriod = paiements.filter((p) => {
    return (
      p.statut === 'valide' &&
      p.mois_concerne === selectedMonth &&
      p.annee_concernee === selectedYear &&
      ownerBienIds.includes(p.contrat?.bien_id)
    );
  });

  // Owner chargeable repairs for this month
  const ownerRepairs = travaux.filter((t) => {
    return (
      ownerBienIds.includes(t.bien_id) &&
      t.imputation === 'a_la_charge_proprietaire'
    );
  });

  const totalEncaissBrut = validatedPaymentsForPeriod.reduce((sum, p) => sum + p.montant_total_paye, 0);
  const totalCommissionCabinet = validatedPaymentsForPeriod.reduce((sum, p) => sum + p.commission_cabinet, 0);
  const totalTravauxDeduits = ownerRepairs.reduce((sum, t) => sum + t.cout, 0);
  const netReversable = totalEncaissBrut - totalCommissionCabinet - totalTravauxDeduits;

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Wallet className="w-6 h-6 mr-2.5 text-emerald-600" />
            Bordereaux de Reversement Propriétaires
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrêté de compte mensuel, déduction des honoraires de gestion (10%) et des travaux imputables au bailleur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Select Owner */}
          <select
            value={selectedPropId}
            onChange={(e) => setSelectedPropId(e.target.value)}
            className="text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
          >
            {proprietaires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom_complet}
              </option>
            ))}
          </select>

          {/* Select Month */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {formatMonthYearFR(m, selectedYear)}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow transition"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer Bordereau
          </button>
        </div>
      </div>

      {/* Printable Bordereau Container */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 md:p-12 shadow-xl print:shadow-none print:border-none print:p-4">
        {/* Bordereau Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <h1 className="text-lg font-bold text-slate-900 uppercase">
                CABINET IVOIRE GESTION IMMOBILIÈRE
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Département Comptabilité Mandats • Abidjan, Côte d'Ivoire
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-right min-w-[240px]">
            <p className="text-xs uppercase font-bold text-emerald-800">
              Bordereau de Reversement Mensuel
            </p>
            <p className="text-base font-bold text-slate-900">
              Période : {formatMonthYearFR(selectedMonth, selectedYear)}
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Réf : REV-{selectedYear}-{String(selectedMonth).padStart(2, '0')}-{selectedOwner?.id.slice(-4).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Owner Profile Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Bailleur / Mandant</p>
            <p className="text-base font-bold text-slate-900">{selectedOwner?.nom_complet}</p>
            <p className="text-xs text-slate-600">{selectedOwner?.adresse}</p>
            <p className="text-xs text-slate-600">Tél: {selectedOwner?.telephone} • Email: {selectedOwner?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Mode de Paiement & Compte</p>
            <p className="font-semibold text-slate-800 capitalize">
              {selectedOwner?.mode_versement_prefere?.replace('_', ' ')}
            </p>
            <p className="text-xs font-mono text-slate-700 bg-white p-1.5 rounded border border-slate-200 mt-1">
              {selectedOwner?.rib_ou_numero_compte || 'Coordonnées bancaires au dossier'}
            </p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Loyers Bruts Encaissés</p>
            <p className="text-xl font-mono font-bold text-slate-900 mt-1">
              {formatFCFA(totalEncaissBrut)}
            </p>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-800 uppercase">Commission Cabinet (10%)</p>
            <p className="text-xl font-mono font-bold text-amber-900 mt-1">
              - {formatFCFA(totalCommissionCabinet)}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500 uppercase">Travaux Déductibles</p>
            <p className="text-xl font-mono font-bold text-rose-700 mt-1">
              - {formatFCFA(totalTravauxDeduits)}
            </p>
          </div>

          <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-lg shadow-emerald-700/20">
            <p className="text-xs font-semibold uppercase text-emerald-100">Net à Reverser (90% - Trav.)</p>
            <p className="text-2xl font-mono font-black text-white mt-1">
              {formatFCFA(Math.max(0, netReversable))}
            </p>
          </div>
        </div>

        {/* Breakdown of Collected Rents */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Détail des Encaissements Validés pour le Mandant
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Bien Immobilier</th>
                  <th className="py-2.5 px-4">Locataire</th>
                  <th className="py-2.5 px-4">N° Quittance</th>
                  <th className="py-2.5 px-4 text-right">Loyer Encaissé</th>
                  <th className="py-2.5 px-4 text-right">Com. 10%</th>
                  <th className="py-2.5 px-4 text-right">Reversable Brut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validatedPaymentsForPeriod.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                      Aucun encaissement validé pour cette période.
                    </td>
                  </tr>
                ) : (
                  validatedPaymentsForPeriod.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {p.contrat?.bien?.code_reference} - {p.contrat?.bien?.commune_quartier}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.contrat?.locataire?.nom_complet}</td>
                      <td className="py-3 px-4 font-mono text-xs text-emerald-800 font-bold">{p.numero_recu}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{formatFCFA(p.montant_total_paye)}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800">{formatFCFA(p.commission_cabinet)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 font-bold">
                        {formatFCFA(p.montant_reversable_proprietaire)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deducted Repairs Table if any */}
        {ownerRepairs.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700">
              2. Travaux & Réparations à la Charge du Bailleur (Déductions)
            </h3>
            <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-rose-100/60 text-rose-900 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Bien Concerné</th>
                    <th className="py-2.5 px-4">Description de l'Intervention</th>
                    <th className="py-2.5 px-4">Date & Facture</th>
                    <th className="py-2.5 px-4 text-right">Montant Déduit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {ownerRepairs.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {ownerBiens.find((b) => b.id === r.bien_id)?.code_reference}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{r.description}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-500">{formatDateFR(r.date_intervention)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-800">
                        - {formatFCFA(r.cout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-8 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-700 uppercase">Le Mandataire (Cabinet)</p>
            <p className="text-slate-500">Comptabilité & Gestion Locative</p>
            <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 italic text-[11px]">
              Cachet & Signature
            </div>
          </div>

          <div className="space-y-1 text-right">
            <p className="font-bold text-slate-700 uppercase">Le Bailleur (Bénéficiaire)</p>
            <p className="text-slate-500">Pour acquit et décharge</p>
            <div className="h-16 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 italic text-[11px]">
              Bon pour accord
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
