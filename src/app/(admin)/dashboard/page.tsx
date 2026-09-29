'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  Wallet,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Wrench,
  FileSpreadsheet,
  Droplets,
  FileText,
  RefreshCw,
  Home,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Calendar,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { paiements, biens, contrats, proprietaires, travaux } = useAppStore();

  const validatedPayments = paiements.filter((p) => p.statut === 'valide');
  const pendingPayments = paiements.filter((p) => p.statut === 'en_attente');

  const totalEncaiss = validatedPayments.reduce((s, p) => s + p.montant_total_paye, 0);
  const totalCommission10 = validatedPayments.reduce((s, p) => s + p.commission_cabinet, 0);
  const totalReversable90 = validatedPayments.reduce((s, p) => s + p.montant_reversable_proprietaire, 0);

  const totalBiens = biens.length;
  const biensOccupes = biens.filter((b) => b.est_occupe).length;
  const tauxOccupation = totalBiens > 0 ? Math.round((biensOccupes / totalBiens) * 100) : 0;

  // Données Échéances de loyers (Septembre 2026)
  const echeancesData = [
    {
      initials: 'JK',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      locataire: 'Jean Kouassi',
      bienNom: 'Résidence Les Palmiers · A12',
      residence: 'Résidence Les Palmiers',
      echeance: '15/09/2026',
      montant: '450 000 FCFA',
      statut: 'À jour',
      statutBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      initials: 'NT',
      avatarBg: 'bg-teal-100 text-teal-800',
      locataire: 'Nadia Traoré',
      bienNom: 'Immeuble Central · B04',
      residence: 'Immeuble Central',
      echeance: '16/09/2026',
      montant: '450 000 FCFA',
      statut: 'À jour',
      statutBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      initials: 'MK',
      avatarBg: 'bg-rose-100 text-rose-800',
      locataire: 'Moussa Koné',
      bienNom: 'Résidence Azur · C07',
      residence: 'Résidence Azur',
      echeance: '17/09/2026',
      montant: '320 000 FCFA',
      statut: 'Retard',
      statutBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      initials: 'CY',
      avatarBg: 'bg-blue-100 text-blue-800',
      locataire: 'Claire Yao',
      bienNom: 'Villa Horizon · V01',
      residence: 'Villa Horizon',
      echeance: '18/09/2026',
      montant: '450 000 FCFA',
      statut: 'Nouveau',
      statutBadge: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Système Centralisé de Gestion Locative</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Vue d'ensemble Financière & Administrative
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Supervisez les encaissements en FCFA, validez les paiements des locataires pour délivrer les reçus officiels avec QR code et éditez les bordereaux de reversement (90/10).
          </p>
        </div>

        {/* Action buttons inside banner */}
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <Link
            href="/encaissements"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Traiter les {pendingPayments.length} paiements en attente
          </Link>
          <Link
            href="/rapports"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700/60 shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-400" />
            Rapports & Documents
          </Link>
          <Link
            href="/reversements"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Bordereaux de Reversement
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Encaissé */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Total Encaissé (Validé)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-900">
            {formatFCFA(totalEncaiss)}
          </p>
          <div className="flex items-center text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {validatedPayments.length} quittances émises
          </div>
        </div>

        {/* Commission 10% Cabinet */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-amber-800">
            <span>Commissions Cabinet (10%)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-extrabold text-amber-900">
            {formatFCFA(totalCommission10)}
          </p>
          <p className="text-[11px] text-slate-500">
            Honoraires de gestion acquis
          </p>
        </div>

        {/* Reversements 90% Propriétaires */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-teal-800">
            <span>Reversements Bailleurs (90%)</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-extrabold text-teal-900">
            {formatFCFA(totalReversable90)}
          </p>
          <p className="text-[11px] text-slate-500">
            Montant net à décaisser aux propriétaires
          </p>
        </div>

        {/* Taux d'occupation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Taux d'Occupation</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-900">
            {tauxOccupation}%
          </p>
          <p className="text-[11px] text-slate-500">
            {biensOccupes} occupés sur {totalBiens} biens au portefeuille
          </p>
        </div>
      </div>

      {/* Main Grid: Left Section (Tableau des Échéances + Activité) & Right Section (À traiter + Portefeuille) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tableau des Échéances de loyers */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                  Tableau des Échéances de loyers
                </h2>
                <span className="text-xs font-bold text-slate-500">Septembre 2026</span>
              </div>

              <Link
                href="/rapports"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                Voir tous les baux <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Locataire</th>
                    <th className="py-3 px-4">Bien</th>
                    <th className="py-3 px-4">Échéance</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {echeancesData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.avatarBg}`}
                          >
                            {item.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{item.locataire}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{item.bienNom}</p>
                        <p className="text-[11px] text-slate-400">{item.residence}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                        {item.echeance}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {item.montant}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${item.statutBadge}`}
                        >
                          {item.statut === 'À jour' && (
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          )}
                          {item.statut === 'Retard' && (
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          )}
                          {item.statut === 'Nouveau' && (
                            <Sparkles className="w-3 h-3 mr-1 text-sky-600" />
                          )}
                          {item.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-600" />
              Activité récente
            </h2>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    <span className="font-bold text-slate-900">12 sept.</span> · Quittance Q-2026-0912 générée
                  </p>
                  <p className="text-[11px] text-slate-500">Paiement validé avec succès par l'administration.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    <span className="font-bold text-slate-900">11 sept.</span> · Contrat de Nadia Traoré renouvelé
                  </p>
                  <p className="text-[11px] text-slate-500">Bail prolongé pour 12 mois à l'Immeuble Central.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    <span className="font-bold text-slate-900">10 sept.</span> · Intervention maintenance clôturée
                  </p>
                  <p className="text-[11px] text-slate-500">Réparation plomberie effectuée et facture imputée.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* À traiter / Urgent */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-900">À traiter</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                Urgent
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5 hover:bg-rose-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-900">
                    <Droplets className="w-4 h-4 text-rose-600" />
                    <span>Fuite d’eau · A12</span>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-200/70 text-rose-900 text-[10px] font-extrabold rounded-md">
                    Aujourd’hui
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Résidence Les Palmiers</p>
              </div>

              {/* Item 2 */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 hover:bg-amber-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Loyer en retard</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-extrabold rounded-md">
                    Demain
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">
                  Moussa Koné · <span className="font-mono text-slate-900">320 000 FCFA</span>
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5 hover:bg-indigo-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Contrat à renouveler</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium">Immeuble Central · B04</p>
              </div>
            </div>
          </div>

          {/* Portefeuille par statut */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-slate-600" />
              Portefeuille par statut
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {/* Loués */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
                <p className="text-[11px] font-bold text-emerald-800">Loués</p>
                <p className="text-2xl font-black text-emerald-900">108</p>
              </div>

              {/* Disponibles */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-center space-y-1">
                <p className="text-[11px] font-bold text-amber-800">Disponibles</p>
                <p className="text-2xl font-black text-amber-900">11</p>
              </div>

              {/* Maintenance */}
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-center space-y-1">
                <p className="text-[11px] font-bold text-slate-700">Maintenance</p>
                <p className="text-2xl font-black text-slate-900">7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
