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
} from 'lucide-react';
import { PaymentValidationTable } from '@/components/admin/PaymentValidationTable';

export default function AdminDashboardPage() {
  const { paiements, biens, contrats, proprietaires, validerPaiement, rejeterPaiement } = useAppStore();

  const validatedPayments = paiements.filter((p) => p.statut === 'valide');
  const pendingPayments = paiements.filter((p) => p.statut === 'en_attente');

  const totalEncaiss = validatedPayments.reduce((s, p) => s + p.montant_total_paye, 0);
  const totalCommission10 = validatedPayments.reduce((s, p) => s + p.commission_cabinet, 0);
  const totalReversable90 = validatedPayments.reduce((s, p) => s + p.montant_reversable_proprietaire, 0);

  const totalBiens = biens.length;
  const biensOccupes = biens.filter((b) => b.est_occupe).length;
  const tauxOccupation = totalBiens > 0 ? Math.round((biensOccupes / totalBiens) * 100) : 0;

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

        {/* Action button inside banner */}
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <Link
            href="/encaissements"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Traiter les {pendingPayments.length} paiements en attente
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

      {/* Payment Validation Workflow Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Module de Validation des Encaissements & Reçus
            </h2>
            <p className="text-xs text-slate-500">
              Les locataires ne peuvent obtenir de reçu avant validation formelle.
            </p>
          </div>

          <Link
            href="/encaissements"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
          >
            Voir tous les paiements <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <PaymentValidationTable
          paiements={paiements}
          onValidate={validerPaiement}
          onReject={rejeterPaiement}
        />
      </div>
    </div>
  );
}
