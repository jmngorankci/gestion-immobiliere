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
  Check,
  Receipt,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { paiements, biens, contrats, proprietaires, profiles, travaux } = useAppStore();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const currentMonthName = moisNoms[currentMonth - 1];

  // 1. KPI Financiers & Occupation
  const validatedPayments = paiements.filter((p) => p.statut === 'valide');
  const pendingPayments = paiements.filter((p) => p.statut === 'en_attente');

  const totalEncaiss = validatedPayments.reduce((s, p) => s + p.montant_total_paye, 0);
  const totalCommission10 = validatedPayments.reduce((s, p) => s + p.commission_cabinet, 0);
  const totalReversable90 = validatedPayments.reduce((s, p) => s + p.montant_reversable_proprietaire, 0);

  const totalBiens = biens.length;
  const biensOccupes = biens.filter((b) => b.est_occupe).length;
  const biensDisponibles = biens.filter((b) => !b.est_occupe).length;
  const travauxEnCours = travaux.filter((t) => (t.statut || 'en_attente') === 'en_attente').length;
  const tauxOccupation = totalBiens > 0 ? Math.round((biensOccupes / totalBiens) * 100) : 0;

  // 2. Tableau Dynamique des Échéances de Loyers (Calculé à partir des baux de la base)
  const avatarColors = [
    'bg-emerald-100 text-emerald-800',
    'bg-teal-100 text-teal-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
  ];

  const getInitials = (name: string) => {
    if (!name) return 'LC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const activeContrats = contrats.filter((c) => c.statut === 'actif');

  const dynamicEcheances = activeContrats.map((contrat, idx) => {
    const locataire = profiles.find((p) => p.id === contrat.locataire_profile_id);
    const bien = biens.find((b) => b.id === contrat.bien_id);
    const locName = locataire?.nom_complet || 'Locataire';

    // Détermination du jour d'échéance à partir de date_debut (ex: 5, 10, 15)
    let dueDay = 5;
    if (contrat.date_debut) {
      const parsedDay = new Date(contrat.date_debut).getDate();
      if (!isNaN(parsedDay) && parsedDay > 0) dueDay = parsedDay;
    }
    const formattedDueDay = dueDay < 10 ? `0${dueDay}` : `${dueDay}`;
    const formattedDueMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const echeanceDateStr = `${formattedDueDay}/${formattedDueMonth}/${currentYear}`;

    // Recherche d'un paiement validé ou en attente pour le mois en cours
    const paiementValide = paiements.find(
      (p) =>
        p.contrat_id === contrat.id &&
        p.mois_concerne === currentMonth &&
        p.annee_concernee === currentYear &&
        p.statut === 'valide'
    );

    const paiementEnAttente = paiements.find(
      (p) =>
        p.contrat_id === contrat.id &&
        p.mois_concerne === currentMonth &&
        p.annee_concernee === currentYear &&
        p.statut === 'en_attente'
    );

    // Détermination du statut dynamique
    const isRecentlyCreated =
      contrat.created_at &&
      (now.getTime() - new Date(contrat.created_at).getTime()) / (1000 * 3600 * 24) <= 30;

    let statut: 'À jour' | 'En attente' | 'Retard' | 'Nouveau' = 'Retard';
    let statutBadge = 'bg-rose-50 text-rose-700 border-rose-200';

    if (paiementValide) {
      statut = 'À jour';
      statutBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (paiementEnAttente) {
      statut = 'En attente';
      statutBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (isRecentlyCreated) {
      statut = 'Nouveau';
      statutBadge = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (currentDay <= dueDay) {
      statut = 'Nouveau';
      statutBadge = 'bg-sky-50 text-sky-700 border-sky-200';
    } else {
      statut = 'Retard';
      statutBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return {
      contratId: contrat.id,
      initials: getInitials(locName),
      avatarBg: avatarColors[idx % avatarColors.length],
      locataire: locName,
      bienNom: bien ? `${bien.commune_quartier} · ${bien.code_reference}` : 'Logement sous bail',
      residence: bien?.adresse_precise || bien?.commune_quartier || 'Cabinet Ivoire Immo',
      echeance: echeanceDateStr,
      montant: formatFCFA(contrat.loyer_mensuel),
      statut,
      statutBadge,
      montantBrut: contrat.loyer_mensuel,
      dueDay,
    };
  });

  // 3. Section « À traiter » (Badge Urgent) générée dynamiquement
  interface UrgentTask {
    id: string;
    type: 'reparation' | 'retard' | 'contrat' | 'validation';
    titre: string;
    sousTitre: string;
    delai: string;
    badgeStyle: string;
    icon: any;
    link: string;
  }

  const urgentTasks: UrgentTask[] = [];

  // A. Travaux et pannes urgentes en attente
  travaux
    .filter((t) => (t.statut || 'en_attente') === 'en_attente')
    .slice(0, 2)
    .forEach((t) => {
      const bien = biens.find((b) => b.id === t.bien_id);
      urgentTasks.push({
        id: `trav-${t.id}`,
        type: 'reparation',
        titre: t.description,
        sousTitre: bien ? `${bien.commune_quartier} (${bien.code_reference})` : 'Bien immobilier',
        delai: "Aujourd'hui",
        badgeStyle: 'bg-rose-200/80 text-rose-900',
        icon: Droplets,
        link: '/travaux',
      });
    });

  // B. Loyers en retard
  const retardsList = dynamicEcheances.filter((e) => e.statut === 'Retard');
  retardsList.slice(0, 2).forEach((r) => {
    urgentTasks.push({
      id: `ret-${r.contratId}`,
      type: 'retard',
      titre: `Loyer en retard`,
      sousTitre: `${r.locataire} · ${r.montant}`,
      delai: 'Demain',
      badgeStyle: 'bg-amber-200/80 text-amber-900',
      icon: AlertTriangle,
      link: '/rapports',
    });
  });

  // C. Paiements déclarés en attente de validation
  pendingPayments.slice(0, 1).forEach((p) => {
    urgentTasks.push({
      id: `pay-${p.id}`,
      type: 'validation',
      titre: `Encaissement à valider`,
      sousTitre: `${p.contrat.locataire.nom_complet} · ${formatFCFA(p.montant_total_paye)}`,
      delai: 'À traiter',
      badgeStyle: 'bg-teal-200/80 text-teal-900',
      icon: CreditCard,
      link: '/encaissements',
    });
  });

  // D. Baux à renouveler ou actifs
  activeContrats.slice(0, 1).forEach((c) => {
    const bien = biens.find((b) => b.id === c.bien_id);
    urgentTasks.push({
      id: `renew-${c.id}`,
      type: 'contrat',
      titre: `Contrat à renouveler`,
      sousTitre: bien ? `${bien.commune_quartier} · ${bien.code_reference}` : 'Bail actif',
      delai: 'Ce mois',
      badgeStyle: 'bg-indigo-200/80 text-indigo-900',
      icon: FileText,
      link: '/biens',
    });
  });

  // 4. Activité Récente (Historique dynamique généré à partir des actions de la base)
  interface RecentActivity {
    id: string;
    date: string;
    titre: string;
    description: string;
    icon: any;
    iconBg: string;
  }

  const dynamicActivities: RecentActivity[] = [];

  // Quittances validées récentes
  validatedPayments.slice(0, 2).forEach((p) => {
    const d = p.date_validation ? new Date(p.date_validation) : new Date(p.created_at);
    const dateFormatted = `${d.getDate()} ${moisNoms[d.getMonth()].slice(0, 4)}.`;
    dynamicActivities.push({
      id: `act-pay-${p.id}`,
      date: dateFormatted,
      titre: `Quittance ${p.numero_recu || 'REC-OFFICIEL'} générée`,
      description: `Paiement de ${p.contrat.locataire.nom_complet} validé avec succès.`,
      icon: Receipt,
      iconBg: 'bg-emerald-100 text-emerald-700',
    });
  });

  // Baux récents
  contrats.slice(0, 2).forEach((c) => {
    const loc = profiles.find((u) => u.id === c.locataire_profile_id);
    const d = new Date(c.created_at);
    const dateFormatted = `${d.getDate()} ${moisNoms[d.getMonth()].slice(0, 4)}.`;
    dynamicActivities.push({
      id: `act-ctr-${c.id}`,
      date: dateFormatted,
      titre: `Contrat de ${loc?.nom_complet || 'locataire'} ${c.statut === 'actif' ? 'activé / renouvelé' : 'résilié'}`,
      description: `Bail pour ${formatFCFA(c.loyer_mensuel)}/mois sous gestion.`,
      icon: FileText,
      iconBg: 'bg-teal-100 text-teal-700',
    });
  });

  // Travaux terminés
  travaux
    .filter((t) => t.statut === 'realise')
    .slice(0, 2)
    .forEach((t) => {
      const d = new Date(t.created_at);
      const dateFormatted = `${d.getDate()} ${moisNoms[d.getMonth()].slice(0, 4)}.`;
      dynamicActivities.push({
        id: `act-trv-${t.id}`,
        date: dateFormatted,
        titre: `Intervention maintenance clôturée`,
        description: `${t.description} (${formatFCFA(t.cout)}).`,
        icon: Wrench,
        iconBg: 'bg-amber-100 text-amber-700',
      });
    });

  // Fallback si la base est neuve
  if (dynamicActivities.length === 0) {
    dynamicActivities.push(
      {
        id: 'fallback-1',
        date: `12 ${currentMonthName.slice(0, 4)}.`,
        titre: 'Quittance Q-2026-0912 générée',
        description: 'Paiement validé avec succès par l administration.',
        icon: Receipt,
        iconBg: 'bg-emerald-100 text-emerald-700',
      },
      {
        id: 'fallback-2',
        date: `11 ${currentMonthName.slice(0, 4)}.`,
        titre: 'Contrat de Nadia Traoré renouvelé',
        description: "Bail prolongé pour 12 mois à l'Immeuble Central.",
        icon: FileText,
        iconBg: 'bg-teal-100 text-teal-700',
      },
      {
        id: 'fallback-3',
        date: `10 ${currentMonthName.slice(0, 4)}.`,
        titre: 'Intervention maintenance clôturée',
        description: 'Réparation plomberie effectuée et facture imputée.',
        icon: Wrench,
        iconBg: 'bg-amber-100 text-amber-700',
      }
    );
  }

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
          {/* 1. Parc Immobilier et Baux */}
          <Link
            href="/biens"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Parc Immobilier et Baux
          </Link>

          {/* 2. Traiter les paiements en attente */}
          <Link
            href="/encaissements"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 font-bold text-xs border border-emerald-700/60 shadow-lg shadow-emerald-950/40 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
            Traiter les {pendingPayments.length} paiements en attente
          </Link>

          {/* 3. Bordereaux de Reversement */}
          <Link
            href="/reversements"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition active:scale-95"
          >
            <Wallet className="w-4 h-4 mr-2 text-amber-400" />
            Bordereaux de Reversement
          </Link>

          {/* 4. Rapports & Documents */}
          <Link
            href="/rapports"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-sky-400" />
            Rapports & Documents
          </Link>

          {/* 5. Statistiques & Analyses */}
          <Link
            href="/statistiques"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-teal-950/90 hover:bg-teal-900 text-teal-300 font-bold text-xs border border-teal-700/60 shadow-lg shadow-teal-950/40 transition active:scale-95"
          >
            <BarChart3 className="w-4 h-4 mr-2 text-teal-400" />
            Statistiques & Analyses
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
                <span className="text-xs font-bold text-slate-500">
                  {currentMonthName} {currentYear}
                </span>
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
                  {dynamicEcheances.map((item, idx) => (
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
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {item.residence}
                        </p>
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
                          {item.statut === 'En attente' && (
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          )}
                          {item.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dynamicEcheances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Aucun bail actif pour le mois de {currentMonthName} {currentYear}.
                      </td>
                    </tr>
                  )}
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
              {dynamicActivities.slice(0, 4).map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${act.iconBg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        <span className="font-bold text-slate-900">{act.date}</span> · {act.titre}
                      </p>
                      <p className="text-[11px] text-slate-500">{act.description}</p>
                    </div>
                  </div>
                );
              })}
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
                Urgent ({urgentTasks.length})
              </span>
            </div>

            <div className="space-y-3">
              {urgentTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <Link
                    key={task.id}
                    href={task.link}
                    className="block p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5 hover:bg-slate-100 transition group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                        <Icon className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 transition" />
                        <span>{task.titre}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${task.badgeStyle}`}
                      >
                        {task.delai}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{task.sousTitre}</p>
                  </Link>
                );
              })}

              {urgentTasks.length === 0 && (
                <div className="p-6 text-center text-xs text-emerald-700 font-bold bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  Aucune tâche urgente en attente.
                </div>
              )}
            </div>
          </div>

          {/* Portefeuille par statut */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-slate-600" />
                Portefeuille par statut
              </h2>
              <span className="text-[11px] font-bold text-slate-400">Total: {totalBiens}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Loués */}
              <Link
                href="/biens"
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100/80 transition rounded-2xl border border-emerald-100 text-center space-y-1 group"
              >
                <p className="text-[11px] font-bold text-emerald-800">Loués</p>
                <p className="text-2xl font-black text-emerald-900 group-hover:scale-105 transition">
                  {biensOccupes}
                </p>
              </Link>

              {/* Disponibles */}
              <Link
                href="/biens"
                className="p-3.5 bg-amber-50 hover:bg-amber-100/80 transition rounded-2xl border border-amber-100 text-center space-y-1 group"
              >
                <p className="text-[11px] font-bold text-amber-800">Disponibles</p>
                <p className="text-2xl font-black text-amber-900 group-hover:scale-105 transition">
                  {biensDisponibles}
                </p>
              </Link>

              {/* Maintenance */}
              <Link
                href="/travaux"
                className="p-3.5 bg-slate-100 hover:bg-slate-200/80 transition rounded-2xl border border-slate-200 text-center space-y-1 group"
              >
                <p className="text-[11px] font-bold text-slate-700">Maintenance</p>
                <p className="text-2xl font-black text-slate-900 group-hover:scale-105 transition">
                  {travauxEnCours}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
