'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  Printer,
  Clock,
  ArrowRight,
  Receipt,
  Phone,
  MessageSquare,
  ShieldCheck,
  Search,
  ChevronRight,
  Filter,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export default function RapportsPage() {
  const { biens, proprietaires, contrats, profiles, paiements, travaux } = useAppStore();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeSection, setActiveSection] = useState<'overview' | 'rapport-mensuel' | 'registre-retards' | 'registre-quittances'>('overview');
  const [retardSearch, setRetardSearch] = useState('');

  // 1. Calculs pour le Rapport Mensuel
  const totalBiens = biens.length;
  const occupiedBiens = biens.filter((b) => b.est_occupe).length;
  const occupancyRate = totalBiens > 0 ? Math.round((occupiedBiens / totalBiens) * 100) : 0;

  const activeContrats = contrats.filter((c) => c.statut === 'actif');

  // Paiements pour le mois/année sélectionnés
  const monthPayments = paiements.filter(
    (p) => p.mois_concerne === selectedMonth && p.annee_concernee === selectedYear
  );
  const validatedMonthPayments = monthPayments.filter((p) => p.statut === 'valide');
  const totalEncaisse = validatedMonthPayments.reduce((sum, p) => sum + p.montant_total_paye, 0);
  const totalCommission = validatedMonthPayments.reduce((sum, p) => sum + p.commission_cabinet, 0);
  const totalReversable = validatedMonthPayments.reduce((sum, p) => sum + p.montant_reversable_proprietaire, 0);

  // Incidents et travaux du mois sélectionné
  const monthTravaux = travaux.filter((t) => {
    const d = new Date(t.date_intervention);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const totalTravauxCout = monthTravaux.reduce((sum, t) => sum + t.cout, 0);

  // 2. Calculs pour les Paiements en Retard (Mois sélectionné ou mois courant)
  const unpaidDossiers = activeContrats.map((contrat) => {
    const locataire = profiles.find((u) => u.id === contrat.locataire_profile_id);
    const bien = biens.find((b) => b.id === contrat.bien_id);
    const prop = proprietaires.find((p) => p.id === bien?.proprietaire_id);

    const paiement = paiements.find(
      (p) =>
        p.contrat_id === contrat.id &&
        p.mois_concerne === selectedMonth &&
        p.annee_concernee === selectedYear &&
        p.statut === 'valide'
    );

    const paiementEnAttente = paiements.find(
      (p) =>
        p.contrat_id === contrat.id &&
        p.mois_concerne === selectedMonth &&
        p.annee_concernee === selectedYear &&
        p.statut === 'en_attente'
    );

    return {
      contrat,
      locataire,
      bien,
      prop,
      loyer: contrat.loyer_mensuel,
      isPaid: !!paiement,
      isPending: !!paiementEnAttente,
      paiementDetails: paiement || paiementEnAttente || null,
    };
  }).filter((d) => !d.isPaid);

  const totalRetardAmount = unpaidDossiers.reduce((sum, d) => sum + d.loyer, 0);
  const unpaidCount = unpaidDossiers.length;

  // Formatage texte pour le modèle demandé : "X dossiers · Y FCFA"
  const formattedRetardSummary = `${unpaidCount} dossier${unpaidCount > 1 ? 's' : ''} · ${
    totalRetardAmount >= 1000000
      ? (totalRetardAmount / 1000000).toFixed(1).replace('.', ',') + ' M FCFA'
      : (totalRetardAmount / 1000).toFixed(0) + ' k FCFA'
  }`;

  // 3. Export Excel / CSV de la Liste des Locataires
  const exportLocatairesExcel = () => {
    const headers = [
      'ID Locataire',
      'Nom et Prénoms',
      'Téléphone',
      'Email',
      'Code Bien',
      'Commune & Quartier',
      'Adresse',
      'Loyer Mensuel (FCFA)',
      'Dépôt Garantie (FCFA)',
      'Date Prise Effet',
      'Statut Dossier',
      `Paiement Mois ${selectedMonth}/${selectedYear}`,
    ];

    const rows = contrats.map((c) => {
      const loc = profiles.find((u) => u.id === c.locataire_profile_id);
      const bien = biens.find((b) => b.id === c.bien_id);
      const isPaid = paiements.some(
        (p) =>
          p.contrat_id === c.id &&
          p.mois_concerne === selectedMonth &&
          p.annee_concernee === selectedYear &&
          p.statut === 'valide'
      );

      return [
        loc?.id || c.locataire_profile_id,
        `"${loc?.nom_complet || 'Locataire'}"`,
        `"${loc?.telephone || '-'}"`,
        `"${loc?.email || '-'}"`,
        `"${bien?.code_reference || '-'}"`,
        `"${bien?.commune_quartier || '-'}"`,
        `"${bien?.adresse_precise || '-'}"`,
        c.loyer_mensuel,
        c.depot_garantie,
        c.date_debut,
        c.statut === 'actif' ? 'Actif' : 'Résilié',
        isPaid ? 'A jour' : 'En attente / Retard',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `liste_locataires_cabinet_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export CSV du Registre des Impayés
  const exportRetardsCSV = () => {
    const headers = [
      'Locataire',
      'Téléphone',
      'Email',
      'Bien Loué',
      'Commune',
      'Propriétaire Bailleur',
      'Montant Loyer Impayé (FCFA)',
      'Mois Concerné',
      'Année',
    ];

    const rows = unpaidDossiers.map((d) => [
      `"${d.locataire?.nom_complet || '-'}"`,
      `"${d.locataire?.telephone || '-'}"`,
      `"${d.locataire?.email || '-'}"`,
      `"${d.bien?.code_reference || '-'}"`,
      `"${d.bien?.commune_quartier || '-'}"`,
      `"${d.prop?.nom_complet || '-'}"`,
      d.loyer,
      selectedMonth,
      selectedYear,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registre_retards_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quittances validées avec numéro
  const quittancesList = paiements.filter((p) => p.numero_recu);

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Direction Financière & Gestion Locative</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <FileSpreadsheet className="w-7 h-7 mr-2.5 text-emerald-600" />
            Rapports & Documents
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registres, quittances et exports de gestion.
          </p>
        </div>

        {/* Période sélecteur */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-1" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {moisNoms.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* ===================== LES 3 CARTES DU MODÈLE ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARTE 1: Rapport mensuel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-50 rounded-full group-hover:scale-125 transition pointer-events-none" />
          
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Rapport mensuel</h2>
              <p className="text-xs text-slate-500 mt-1">
                Occupation, loyers, incidents et mouvements.
              </p>
            </div>

            <div className="pt-2 flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {moisNoms[selectedMonth - 1]} {selectedYear}
              </span>
              <span className="text-emerald-700 font-semibold">
                {occupancyRate}% occupé
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveSection('rapport-mensuel')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>Générer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARTE 2: Liste des locataires */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-teal-50 rounded-full group-hover:scale-125 transition pointer-events-none" />

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Liste des locataires</h2>
              <p className="text-xs text-slate-500 mt-1">
                Annuaire et situation des dossiers.
              </p>
            </div>

            <div className="pt-2 flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {contrats.length} baux enregistrés
              </span>
              <span className="text-teal-700 font-semibold">
                {activeContrats.length} actifs
              </span>
            </div>
          </div>

          <button
            onClick={exportLocatairesExcel}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-700/20 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Excel</span>
          </button>
        </div>

        {/* CARTE 3: Paiements en retard */}
        <div className="bg-white rounded-3xl border border-rose-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-rose-50 rounded-full group-hover:scale-125 transition pointer-events-none" />

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Paiements en retard</h2>
              <p className="text-xs font-bold text-rose-600 mt-1">
                {formattedRetardSummary}
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-500">
              Mois de {moisNoms[selectedMonth - 1]} {selectedYear}
            </div>
          </div>

          <button
            onClick={() => setActiveSection('registre-retards')}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-700/20 active:scale-95 transition flex items-center justify-center space-x-2"
          >
            <span>Voir le registre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================== VUE DÉTAILLÉE : RAPPORT MENSUEL ===================== */}
      {activeSection === 'rapport-mensuel' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Bilan Mensuel Officiel
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Rapport de Gestion — {moisNoms[selectedMonth - 1]} {selectedYear}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cabinet Ivoire Immo • Édité le {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Synthèse KPI du Mois */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Taux d'Occupation</p>
              <p className="text-2xl font-black text-slate-900">{occupancyRate}%</p>
              <p className="text-[10px] text-slate-500">{occupiedBiens} sur {totalBiens} biens loués</p>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
              <p className="text-[11px] font-bold text-emerald-800 uppercase">Loyers Encaissés</p>
              <p className="text-2xl font-black text-emerald-700">{formatFCFA(totalEncaisse)}</p>
              <p className="text-[10px] text-emerald-800">{validatedMonthPayments.length} paiements validés</p>
            </div>

            <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-1">
              <p className="text-[11px] font-bold text-teal-800 uppercase">Commissions Cabinet (10%)</p>
              <p className="text-2xl font-black text-teal-700">{formatFCFA(totalCommission)}</p>
              <p className="text-[10px] text-teal-800">Honoraires nets perçus</p>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1">
              <p className="text-[11px] font-bold text-rose-800 uppercase">Incidents & Travaux</p>
              <p className="text-2xl font-black text-rose-700">{formatFCFA(totalTravauxCout)}</p>
              <p className="text-[10px] text-rose-800">{monthTravaux.length} intervention(s)</p>
            </div>
          </div>

          {/* Tableau des Mouvements & Encaissements du Mois */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <Receipt className="w-4 h-4 mr-2 text-emerald-600" />
              Détail des Encaissements et Mouvements Validés
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">N° Reçu</th>
                    <th className="p-3">Locataire</th>
                    <th className="p-3">Bien / Commune</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 text-right">Montant Total</th>
                    <th className="p-3 text-right">Commission (10%)</th>
                    <th className="p-3 text-right">Reversement (90%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedMonthPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {p.numero_recu || 'REC-AUTO'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {p.contrat.locataire.nom_complet}
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.contrat.bien.code_reference} ({p.contrat.bien.commune_quartier})
                      </td>
                      <td className="p-3 uppercase font-semibold text-slate-700">
                        {p.mode_paiement.replace('_', ' ')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatFCFA(p.montant_total_paye)}
                      </td>
                      <td className="p-3 text-right font-mono text-teal-700">
                        {formatFCFA(p.commission_cabinet)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {formatFCFA(p.montant_reversable_proprietaire)}
                      </td>
                    </tr>
                  ))}
                  {validatedMonthPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Aucun encaissement validé pour {moisNoms[selectedMonth - 1]} {selectedYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VUE DÉTAILLÉE : REGISTRE DES PAIEMENTS EN RETARD ===================== */}
      {activeSection === 'registre-retards' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                Suivi du Recouvrement
              </span>
              <h2 className="text-xl font-black text-slate-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-600" />
                Registre des Retards de Loyers — {moisNoms[selectedMonth - 1]} {selectedYear}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {unpaidCount} locataire(s) en attente de régularisation pour un total de {formatFCFA(totalRetardAmount)}.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportRetardsCSV}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition border border-rose-200"
              >
                <Download className="w-4 h-4" />
                <span>Exporter la liste</span>
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Recherche dans les retards */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un locataire ou bien..."
              value={retardSearch}
              onChange={(e) => setRetardSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Tableau détaillé des impayés */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Locataire en Retard</th>
                  <th className="p-3.5">Contact Téléphonique</th>
                  <th className="p-3.5">Logement Occupé</th>
                  <th className="p-3.5">Bailleur Rattaché</th>
                  <th className="p-3.5 text-right">Loyer Mensuel</th>
                  <th className="p-3.5 text-center">État du Dossier</th>
                  <th className="p-3.5 text-right">Action Relance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidDossiers
                  .filter((d) => {
                    const q = retardSearch.toLowerCase();
                    return (
                      d.locataire?.nom_complet.toLowerCase().includes(q) ||
                      d.bien?.code_reference.toLowerCase().includes(q) ||
                      d.locataire?.telephone.includes(q)
                    );
                  })
                  .map((d) => (
                    <tr key={d.contrat.id} className="hover:bg-rose-50/40">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 text-sm">{d.locataire?.nom_complet}</p>
                        <p className="text-[10px] text-slate-500">{d.locataire?.email || 'Email non renseigné'}</p>
                      </td>

                      <td className="p-3.5 font-mono text-slate-800 font-semibold">
                        <div className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {d.locataire?.telephone}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-800">
                          {d.bien?.code_reference}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{d.bien?.commune_quartier}</p>
                      </td>

                      <td className="p-3.5 text-slate-700 font-medium">
                        {d.prop?.nom_complet}
                      </td>

                      <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 text-sm">
                        {formatFCFA(d.loyer)}
                      </td>

                      <td className="p-3.5 text-center">
                        {d.isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 mr-1" />
                            Déclaration en attente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Impayé {moisNoms[selectedMonth - 1]}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <a
                            href={`https://wa.me/${d.locataire?.telephone?.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(
                              d.locataire?.nom_complet || ''
                            )},%20le%20Cabinet%20Ivoire%20Immo%20vous%20rappelle%20que%20votre%20loyer%20de%20${moisNoms[
                              selectedMonth - 1
                            ]}%20(${formatFCFA(d.loyer)})%20pour%20le%20logement%20${d.bien?.code_reference}%20est%20en%20attente%20de%20r%C3%A8glement.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition border border-emerald-200"
                            title="Relance WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${d.locataire?.telephone}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Appeler"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                {unpaidDossiers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-emerald-700 font-bold">
                      🎉 Bravo ! Tous les locataires sont à jour de leurs paiements pour ce mois.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REGISTRE DES QUITTANCES OFFICIELLES ===================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-emerald-600" />
              Registre des Quittances Émises ({quittancesList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Historique des reçus officiels avec numérotation infalsifiable et code de contrôle.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Numéro Quittance</th>
                <th className="p-3">Locataire</th>
                <th className="p-3">Bien / Adresse</th>
                <th className="p-3">Période</th>
                <th className="p-3 text-right">Montant Réglé</th>
                <th className="p-3">Date Validation</th>
                <th className="p-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quittancesList.slice(0, 8).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-emerald-700">
                    {p.numero_recu}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">
                    {p.contrat.locataire.nom_complet}
                  </td>
                  <td className="p-3 text-slate-600">
                    {p.contrat.bien.code_reference} ({p.contrat.bien.commune_quartier})
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {moisNoms[p.mois_concerne - 1]} {p.annee_concernee}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatFCFA(p.montant_total_paye)}
                  </td>
                  <td className="p-3 text-slate-500">
                    {p.date_validation ? formatDateFR(p.date_validation) : '-'}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Validée
                    </span>
                  </td>
                </tr>
              ))}
              {quittancesList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Aucune quittance émise pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
