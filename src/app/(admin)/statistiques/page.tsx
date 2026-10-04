'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import { PropertyType } from '@/types/database.types';
import {
  BarChart3,
  TrendingUp,
  Building2,
  PieChart,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Users,
  Wrench,
  Percent,
  Home,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export default function StatistiquesPage() {
  const { biens, proprietaires, contrats, profiles, paiements, travaux } = useAppStore();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const moisNoms = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc',
  ];
  const moisNomsComplets = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  // ===================== 1. CALCULS DES 4 INDICATEURS CLÉS =====================
  const totalBiens = biens.length;
  const biensOccupes = biens.filter((b) => b.est_occupe).length;
  const biensDisponibles = biens.filter((b) => !b.est_occupe).length;
  const tauxOccupation = totalBiens > 0 ? Math.round((biensOccupes / totalBiens) * 100) : 0;

  // Rendement Brut / Revenu locatif annuel théorique du parc
  const loyerMensuelTotal = biens.reduce((sum, b) => sum + (b.loyer_mensuel_reference ?? 0), 0);
  const revenuAnnuelTheorique = loyerMensuelTotal * 12;

  // Impayés du mois en cours
  const currentMonth = now.getMonth() + 1;
  const activeContrats = contrats.filter((c) => c.statut === 'actif');
  const impayesContrats = activeContrats.filter((contrat) => {
    const hasPaid = paiements.some(
      (p) =>
        p.contrat_id === contrat.id &&
        p.mois_concerne === currentMonth &&
        p.annee_concernee === selectedYear &&
        p.statut === 'valide'
    );
    return !hasPaid;
  });
  const montantTotalImpayes = impayesContrats.reduce((sum, c) => sum + c.loyer_mensuel, 0);
  const loyerAttenduMois = activeContrats.reduce((sum, c) => sum + c.loyer_mensuel, 0);
  const tauxImpayes = loyerAttenduMois > 0 ? ((montantTotalImpayes / loyerAttenduMois) * 100).toFixed(1) : '0';

  // Délai moyen de réparation (Calculé sur les travaux terminés)
  const travauxRealises = travaux.filter((t) => t.statut === 'realise');
  let delaiMoyenJours = 3.8; // Valeur de référence moyenne
  if (travauxRealises.length > 0) {
    let totalJours = 0;
    let countWithDates = 0;
    travauxRealises.forEach((t) => {
      const created = new Date(t.created_at).getTime();
      const intervention = new Date(t.date_intervention).getTime();
      const diffDays = Math.abs(intervention - created) / (1000 * 3600 * 24);
      if (!isNaN(diffDays)) {
        totalJours += Math.max(1, Math.round(diffDays));
        countWithDates++;
      }
    });
    if (countWithDates > 0) {
      delaiMoyenJours = Number((totalJours / countWithDates).toFixed(1));
    }
  }

  // ===================== 2. GRAPHIQUE 1 : OCCUPATION PAR TYPE DE BIEN =====================
  const propertyTypeLabels: Record<PropertyType, string> = {
    studio: 'Studio',
    '2_pieces': '2 Pièces',
    '3_pieces': '3 Pièces',
    appartement: 'Appartement (4+ pièces)',
    villa: 'Villa / Duplex',
    maison_basse: 'Maison Basse',
  };

  const typesList: PropertyType[] = ['studio', '2_pieces', '3_pieces', 'appartement', 'villa', 'maison_basse'];

  const statsByType = typesList.map((type) => {
    const biensOfType = biens.filter((b) => b.type_bien === type);
    const total = biensOfType.length;
    const occupes = biensOfType.filter((b) => b.est_occupe).length;
    const dispo = total - occupes;
    const percentOccup = total > 0 ? Math.round((occupes / total) * 100) : 0;
    const loyerMoyen = total > 0 ? Math.round(biensOfType.reduce((s, b) => s + (b.loyer_mensuel_reference ?? 0), 0) / total) : 0;

    return {
      type,
      label: propertyTypeLabels[type],
      total,
      occupes,
      dispo,
      percentOccup,
      loyerMoyen,
    };
  }).filter((item) => item.total > 0 || totalBiens === 0);

  // ===================== 3. GRAPHIQUE 2 : ÉVOLUTION DES ENCAISSEMENTS PAR MOIS =====================
  // Calcul réel mois par mois pour l'année sélectionnée
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const monthPayments = paiements.filter(
      (p) => p.mois_concerne === m && p.annee_concernee === selectedYear && p.statut === 'valide'
    );

    const totalMontant = monthPayments.reduce((s, p) => s + p.montant_total_paye, 0);
    const commission = monthPayments.reduce((s, p) => s + p.commission_cabinet, 0);
    const reversement = monthPayments.reduce((s, p) => s + p.montant_reversable_proprietaire, 0);
    const nbQuittances = monthPayments.length;

    return {
      moisNum: m,
      moisNom: moisNoms[i],
      moisComplet: moisNomsComplets[i],
      totalMontant,
      commission,
      reversement,
      nbQuittances,
    };
  });

  const maxMonthlyAmount = Math.max(...monthlyData.map((d) => d.totalMontant), 1000000);
  const totalEncaisseAnnee = monthlyData.reduce((sum, d) => sum + d.totalMontant, 0);
  const totalCommissionsAnnee = monthlyData.reduce((sum, d) => sum + d.commission, 0);

  // ===================== 4. STATISTIQUES GÉOGRAPHIQUES =====================
  const communesMap: Record<string, { total: number; occupes: number; loyerTotal: number }> = {};
  biens.forEach((b) => {
    const commune = b.commune_quartier.split(' ')[0] || 'Abidjan';
    if (!communesMap[commune]) {
      communesMap[commune] = { total: 0, occupes: 0, loyerTotal: 0 };
    }
    communesMap[commune].total += 1;
    if (b.est_occupe) communesMap[commune].occupes += 1;
    communesMap[commune].loyerTotal += (b.loyer_mensuel_reference ?? 0);
  });

  const communesStats = Object.entries(communesMap).map(([nom, data]) => ({
    nom,
    total: data.total,
    occupes: data.occupes,
    taux: Math.round((data.occupes / data.total) * 100),
    loyerMoyen: Math.round(data.loyerTotal / data.total),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Pilotage & Décisionnel</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            Statistiques & Analyses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicateurs du patrimoine et de la performance locative.
          </p>
        </div>

        {/* Sélecteur d'année */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-xs font-bold text-slate-600">Année :</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {/* ===================== LES 4 INDICATEURS CLÉS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Taux d’occupation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Taux d'occupation</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900 font-mono">{tauxOccupation}%</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-emerald-700">{biensOccupes} loués</span> sur {totalBiens} biens au parc
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${tauxOccupation}%` }}
            />
          </div>
        </div>

        {/* 2. Rendement brut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Rendement brut</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {formatFCFA(revenuAnnuelTheorique)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Valeur locative brute annuelle
            </p>
          </div>

          <div className="pt-1 flex items-center text-[11px] font-semibold text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {formatFCFA(loyerMensuelTotal)} / mois au plein
          </div>
        </div>

        {/* 3. Impayés */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Impayés</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl font-black text-rose-600 font-mono">
              {formatFCFA(montantTotalImpayes)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-rose-700">{impayesContrats.length} dossier(s)</span> · {tauxImpayes}% du mois
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Number(tauxImpayes))}%` }}
            />
          </div>
        </div>

        {/* 4. Délai moyen réparation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
            <span>Délai moyen réparation</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900 font-mono">
              {delaiMoyenJours} <span className="text-sm font-semibold text-slate-500">jours</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Temps moyen de résolution des incidents
            </p>
          </div>

          <div className="pt-1 flex items-center text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {travauxRealises.length} réparations clôturées
          </div>
        </div>
      </div>

      {/* ===================== GRAPHIQUE 2 : ÉVOLUTION DES ENCAISSEMENTS PAR MOIS ===================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
              Évolution des encaissements par mois ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Montants réels collectés, commissions acquises (10%) et reversements aux bailleurs (90%).
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Loyers Encaissés</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="font-semibold text-rose-600 font-bold">Commissions Cabinet (10% - Rouge)</span>
            </div>
          </div>
        </div>

        {/* Résumé Annuel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Encaissé ({selectedYear})</p>
            <p className="text-xl font-mono font-black text-emerald-700">{formatFCFA(totalEncaisseAnnee)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-800 uppercase">Commissions Net (Rouge)</p>
            <p className="text-xl font-mono font-black text-rose-600">{formatFCFA(totalCommissionsAnnee)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Quittances Émises</p>
            <p className="text-xl font-mono font-black text-slate-900">
              {monthlyData.reduce((s, d) => s + d.nbQuittances, 0)} reçus
            </p>
          </div>
        </div>

        {/* Graphique à barres visuel avec Commission en Rouge */}
        <div className="pt-4">
          <div className="h-64 flex items-end justify-between gap-1.5 sm:gap-3 px-2 border-b border-slate-200">
            {monthlyData.map((m) => {
              const heightPercentTotal = maxMonthlyAmount > 0 ? Math.round((m.totalMontant / maxMonthlyAmount) * 100) : 0;
              const heightPercentCom = maxMonthlyAmount > 0 ? Math.round((m.commission / maxMonthlyAmount) * 100) : 0;
              const hasData = m.totalMontant > 0;

              return (
                <div key={m.moisNum} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-20 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none z-20 bg-slate-950 text-white p-2.5 rounded-xl text-[11px] shadow-xl whitespace-nowrap text-center space-y-0.5 border border-slate-800">
                    <p className="font-bold">{m.moisComplet} {selectedYear}</p>
                    <p className="font-mono text-emerald-400 font-bold">Total : {formatFCFA(m.totalMontant)}</p>
                    <p className="font-mono text-rose-400 font-bold">Commission (10%) : {formatFCFA(m.commission)}</p>
                    <p className="font-mono text-slate-300 text-[10px]">Bailleur (90%) : {formatFCFA(m.reversement)}</p>
                  </div>

                  {/* Dual Bars (Loyers vs Commission Rouge) */}
                  <div className="w-full flex items-end justify-center space-x-1 h-full">
                    {hasData ? (
                      <>
                        {/* Barre Verte : Loyer Encaissé */}
                        <div
                          className="w-1/2 max-w-[20px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md hover:brightness-110 transition shadow-sm"
                          style={{ height: `${Math.max(12, heightPercentTotal)}%` }}
                          title={`Total: ${formatFCFA(m.totalMontant)}`}
                        />
                        {/* Barre Rouge : Commission 10% */}
                        <div
                          className="w-1/2 max-w-[20px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md hover:brightness-110 transition shadow-sm"
                          style={{ height: `${Math.max(8, heightPercentCom * 4)}%` }}
                          title={`Commission: ${formatFCFA(m.commission)}`}
                        />
                      </>
                    ) : (
                      <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg h-2" />
                    )}
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-bold text-slate-600 mt-2">
                    {m.moisNom}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================== GRAPHIQUE 1 : OCCUPATION PAR TYPE D'APPARTEMENTS & BIENS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation par type */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
                Occupation par type de bien
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Répartition des logements occupés vs disponibles par typologie.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {statsByType.map((item) => (
              <div key={item.type} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 font-medium">
                      {formatFCFA(item.loyerMoyen)}/m
                    </span>
                    <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {item.occupes}/{item.total} loués ({item.percentOccup}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2.5 transition-all duration-500"
                    style={{ width: `${item.percentOccup}%` }}
                    title={`Occupés: ${item.occupes}`}
                  />
                  <div
                    className="bg-amber-400 h-2.5 transition-all duration-500"
                    style={{ width: `${100 - item.percentOccup}%` }}
                    title={`Disponibles: ${item.dispo}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par commune & zone géographique */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                Répartition géographique du patrimoine
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Implantation et taux de remplissage par commune.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {communesStats.map((c) => (
              <div key={c.nom} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    {c.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.nom}</p>
                    <p className="text-slate-500 text-[11px]">{c.total} bien(s) sous gestion</p>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-mono font-bold text-slate-900">{formatFCFA(c.loyerMoyen)} moy.</p>
                  <span className="inline-block font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {c.taux}% loué
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
