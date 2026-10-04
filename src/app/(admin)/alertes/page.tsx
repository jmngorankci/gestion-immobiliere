'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wrench,
  Building2,
  User,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Send,
  Calendar,
  Check,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AlertesManagementPage() {
  const {
    contrats,
    biens,
    profiles,
    paiements,
    travaux,
    validerPaiement,
    changerStatutTravaux,
  } = useAppStore();

  const [selectedFilter, setSelectedFilter] = useState<'tous' | 'retards' | 'paiements' | 'travaux' | 'vacance'>('tous');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // 1. Détection des retards de paiement (Baux actifs sans paiement validé pour le mois en cours)
  const activeContrats = contrats.filter((c) => c.statut === 'actif');
  const retardsDePaiement = activeContrats
    .map((contrat) => {
      const locataire = profiles.find((p) => p.id === contrat.locataire_profile_id);
      const bien = biens.find((b) => b.id === contrat.bien_id);
      
      // Paiement validé ou en attente pour ce mois
      const paymentThisMonth = paiements.find(
        (p) =>
          p.contrat_id === contrat.id &&
          p.mois_concerne === currentMonth &&
          p.annee_concernee === currentYear &&
          p.statut === 'valide'
      );

      const paymentPendingThisMonth = paiements.find(
        (p) =>
          p.contrat_id === contrat.id &&
          p.mois_concerne === currentMonth &&
          p.annee_concernee === currentYear &&
          p.statut === 'en_attente'
      );

      return {
        contrat,
        locataire,
        bien,
        hasPaid: !!paymentThisMonth,
        hasPending: !!paymentPendingThisMonth,
        loyerDu: contrat.loyer_mensuel,
      };
    })
    .filter((item) => !item.hasPaid);

  // 2. Paiements en attente de validation
  const paiementsEnAttente = paiements.filter((p) => p.statut === 'en_attente');

  // 3. Réparations en attente d'exécution
  const travauxEnAttente = travaux.filter((t) => (t.statut || 'en_attente') === 'en_attente');

  // 4. Biens vacants (sans locataire)
  const biensVacants = biens.filter((b) => !b.est_occupe);

  // Total Alertes
  const totalAlertes =
    retardsDePaiement.length +
    paiementsEnAttente.length +
    travauxEnAttente.length +
    biensVacants.length;

  const totalMontantRetard = retardsDePaiement.reduce((sum, r) => sum + r.loyerDu, 0);

  // Action: Valider un paiement directement
  const handleDirectValidatePayment = async (paiementId: string) => {
    try {
      await validerPaiement(paiementId, 'Validé depuis le centre des alertes.');
      showToast('Paiement validé avec succès ! Reçu officiel REC-2026 généré.');
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la validation.');
    }
  };

  // Action: Marquer une réparation comme réalisée
  const handleMarkRepairDone = async (travauxId: string) => {
    try {
      await changerStatutTravaux(travauxId, 'realise');
      showToast('Réparation marquée comme Réalisée avec succès !');
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du changement de statut.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border-2 border-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold">{successToast}</p>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Espace Cabinet — Centre de Contrôle & Alertes</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center">
            <Bell className="w-7 h-7 mr-3 text-rose-400 animate-bounce" />
            Gestion des Alertes & Événements Critiques
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Identifiez et traitez en temps réel les retards de paiement, les encaissements en attente de vérification, les réparations non effectuées et la vacance locative.
          </p>
        </div>

        {/* Global summary badge */}
        <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
          <div className="bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>{totalAlertes} point(s) nécessitent votre attention</span>
          </div>
          {totalMontantRetard > 0 && (
            <div className="bg-rose-950/80 border border-rose-800/60 px-4 py-2 rounded-xl text-xs font-bold text-rose-300">
              Loyers en attente d&apos;encaissement : <span className="font-mono text-white font-extrabold">{formatFCFA(totalMontantRetard)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards by Alert Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Retards de Paiement */}
        <div
          onClick={() => setSelectedFilter('retards')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedFilter === 'retards'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500'
              : 'bg-white border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Loyers Impayés / Retards</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1">{retardsDePaiement.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">
            {formatFCFA(totalMontantRetard)} pour {formatMonthYearFR(currentMonth, currentYear)}
          </p>
        </div>

        {/* Encaissements en attente */}
        <div
          onClick={() => setSelectedFilter('paiements')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedFilter === 'paiements'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500'
              : 'bg-white border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Encaissements à Valider</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{paiementsEnAttente.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">
            Reçus officiels séquentiels en attente d&apos;émission
          </p>
        </div>

        {/* Travaux en attente */}
        <div
          onClick={() => setSelectedFilter('travaux')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedFilter === 'travaux'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-500'
              : 'bg-white border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Réparations Non Effectuées</span>
              <h3 className="text-2xl font-black text-orange-600 mt-1">{travauxEnAttente.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">
            Interventions techniques avec statut &quot;En attente&quot;
          </p>
        </div>

        {/* Vacance Locative */}
        <div
          onClick={() => setSelectedFilter('vacance')}
          className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedFilter === 'vacance'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500'
              : 'bg-white border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Logements Vacants</span>
              <h3 className="text-2xl font-black text-blue-600 mt-1">{biensVacants.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">
            Biens disponibles sans contrat de bail actif
          </p>
        </div>
      </div>

      {/* Filter Tabs Header */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setSelectedFilter('tous')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedFilter === 'tous'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tous les Événements ({totalAlertes})
        </button>

        <button
          onClick={() => setSelectedFilter('retards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            selectedFilter === 'retards'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Retards de Paiement ({retardsDePaiement.length})</span>
        </button>

        <button
          onClick={() => setSelectedFilter('paiements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            selectedFilter === 'paiements'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Paiements à Valider ({paiementsEnAttente.length})</span>
        </button>

        <button
          onClick={() => setSelectedFilter('travaux')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            selectedFilter === 'travaux'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Réparations en Attente ({travauxEnAttente.length})</span>
        </button>

        <button
          onClick={() => setSelectedFilter('vacance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            selectedFilter === 'vacance'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Biens Vacants ({biensVacants.length})</span>
        </button>
      </div>

      {/* ================= SECTION 1: RETARDS DE PAIEMENT ================= */}
      {(selectedFilter === 'tous' || selectedFilter === 'retards') && retardsDePaiement.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center">
              <span className="w-3 h-3 rounded-full bg-rose-500 mr-2 animate-pulse" />
              Retards de Paiement & Loyers Échus ({retardsDePaiement.length})
            </h2>
            <span className="text-xs text-slate-500">Mois de {formatMonthYearFR(currentMonth, currentYear)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retardsDePaiement.map(({ contrat, locataire, bien, loyerDu, hasPending }) => {
              const cleanPhone = locataire?.telephone ? locataire.telephone.replace(/\D/g, '') : '';
              const whatsappMessage = encodeURIComponent(
                `Bonjour ${locataire?.nom_complet || 'Cher Locataire'},\n\nLe Cabinet Ivoire Immo vous informe que votre loyer du mois de ${formatMonthYearFR(currentMonth, currentYear)} concernant le bien ${bien?.code_reference || ''} (${formatFCFA(loyerDu)}) est en attente de règlement.\n\nMerci de procéder au règlement via Wave, Orange Money ou à l'agence.\nCordialement,\nService Gestion Locative.`
              );

              return (
                <div
                  key={contrat.id}
                  className="bg-white rounded-3xl p-5 border border-rose-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <img
                          src={locataire?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-rose-200 shrink-0"
                        />
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">{locataire?.nom_complet || 'Locataire'}</h3>
                          <p className="text-xs text-slate-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {locataire?.telephone}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-rose-600 text-base block">
                          {formatFCFA(loyerDu)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Loyer Échu</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{bien?.code_reference}</span>
                        <p className="text-[11px] text-slate-500">{bien?.commune_quartier} • {bien?.adresse_precise}</p>
                      </div>
                      {hasPending ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Règlement déclaré en attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Aucun règlement déclaré
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Relance */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      Relancer WhatsApp
                    </a>

                    <a
                      href={`tel:${locataire?.telephone || ''}`}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      title="Appeler le locataire"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    <Link
                      href="/encaissements"
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                      title="Enregistrer un encaissement"
                    >
                      Encaisser
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: PAIEMENTS EN ATTENTE DE VALIDATION ================= */}
      {(selectedFilter === 'tous' || selectedFilter === 'paiements') && paiementsEnAttente.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-2 animate-pulse" />
              Paiements en Attente de Validation & Quittance ({paiementsEnAttente.length})
            </h2>
            <Link href="/encaissements" className="text-xs font-bold text-emerald-600 hover:underline flex items-center">
              Voir tous les encaissements <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paiementsEnAttente.map((p) => {
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Règlement déclaré
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-1">
                          {p.contrat?.locataire?.nom_complet || 'Locataire'}
                        </h3>
                        <p className="text-xs text-slate-500">{p.contrat?.bien?.code_reference} ({p.contrat?.bien?.commune_quartier})</p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-mono font-black text-slate-900 block">
                          {formatFCFA(p.montant_total_paye)}
                        </span>
                        <span className="text-[10px] text-slate-500">Mois: {formatMonthYearFR(p.mois_concerne, p.annee_concernee)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Mode & Réf :</span>
                        <span className="font-bold text-slate-800 capitalize">{p.mode_paiement?.replace('_', ' ')}</span>
                        <span className="font-mono text-slate-500 ml-1.5">({p.reference_transaction || 'Sans réf'})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Déclaré le {formatDateFR(p.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDirectValidatePayment(p.id)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Valider & Émettre Reçu REC-2026
                    </button>

                    <Link
                      href="/encaissements"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION 3: RÉPARATIONS NON EFFECTUÉES ================= */}
      {(selectedFilter === 'tous' || selectedFilter === 'travaux') && travauxEnAttente.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center">
              <span className="w-3 h-3 rounded-full bg-orange-500 mr-2 animate-pulse" />
              Réparations & Travaux Non Effectués ({travauxEnAttente.length})
            </h2>
            <Link href="/travaux" className="text-xs font-bold text-emerald-600 hover:underline flex items-center">
              Voir le module travaux <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travauxEnAttente.map((t) => {
              const targetBien = biens.find((b) => b.id === t.bien_id);

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-5 border border-orange-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />

                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          Intervention en attente
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm mt-1">{t.description}</h3>
                        <p className="text-xs text-slate-500">{targetBien?.code_reference} • {targetBien?.commune_quartier}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-mono font-black text-slate-900 block">
                          {formatFCFA(t.cout)}
                        </span>
                        <span className="text-[10px] text-slate-400">Date: {formatDateFR(t.date_intervention)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Prestataire / Artisan :</span>
                        <span className="font-semibold text-slate-800">{t.prestataire_nom || 'Non assigné'}</span>
                      </div>
                      <span className="capitalize font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {t.imputation.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleMarkRepairDone(t.id)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Marquer comme &quot;Réalisé&quot;
                    </button>

                    <Link
                      href="/travaux"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Gérer
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SECTION 4: BIENS VACANTS ================= */}
      {(selectedFilter === 'tous' || selectedFilter === 'vacance') && biensVacants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              Biens Immobiliers Vacants / Sans Locataire ({biensVacants.length})
            </h2>
            <Link href="/biens" className="text-xs font-bold text-emerald-600 hover:underline flex items-center">
              Parc immobilier <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {biensVacants.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {b.code_reference}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Disponible
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{b.commune_quartier}</h3>
                  <p className="text-xs text-slate-500">{b.adresse_precise}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Loyer Référence</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formatFCFA(b.loyer_mensuel_reference ?? 0)}/mois</span>
                  </div>

                  <Link
                    href="/biens"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Attribuer un Bail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* When All is Clear */}
      {totalAlertes === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Aucune alerte active !</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tous les loyers sont à jour, les paiements ont été validés, les réparations sont traitées et l&apos;ensemble du parc est sous contrôle.
          </p>
        </div>
      )}
    </div>
  );
}
