'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { calculateLoyerDuMois } from '@/lib/calculations';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  Home,
  CreditCard,
  FileCheck2,
  Clock,
  User,
  Wrench,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Camera,
  LogOut,
  Building,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { OfficialReceipt } from '@/components/receipt/OfficialReceipt';
import { PaiementWithDetails } from '@/types/database.types';

export const TenantDashboard: React.FC = () => {
  const {
    currentUser,
    contrats,
    biens,
    paiements,
    travaux,
    enregistrerPaiementLocataire,
    mettreAJourProfilLocataire,
    setCurrentUser,
    deconnexion,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'loyer' | 'recus' | 'travaux' | 'profil'>('loyer');
  const [selectedReceipt, setSelectedReceipt] = useState<PaiementWithDetails | null>(null);

  // Form states for payment submission
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMode, setPayMode] = useState<'mobile_money' | 'virement' | 'espece'>('mobile_money');
  const [transRef, setTransRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile update state
  const [editName, setEditName] = useState(currentUser?.nom_complet || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  // Tenant's active lease
  const tenantContrat = contrats.find(
    (c) => c.locataire_profile_id === currentUser?.id && c.statut === 'actif'
  ) || contrats[0];

  const tenantBien = biens.find((b) => b.id === tenantContrat?.bien_id) || biens[0];

  // Current month & year
  const currentMonth = 9; // September
  const currentYear = 2026;

  // Imputed repairs for current month
  const repairsForCurrentMonth = travaux.filter(
    (t) =>
      t.bien_id === tenantBien.id &&
      t.imputation === 'impute_au_loyer' &&
      t.loyer_impacte_mois === currentMonth &&
      t.loyer_impacte_annee === currentYear
  );

  const rentBreakdown = calculateLoyerDuMois(
    tenantContrat?.loyer_mensuel || 450000,
    repairsForCurrentMonth
  );

  // Current month payment status
  const currentPayment = paiements.find(
    (p) =>
      p.contrat_id === tenantContrat?.id &&
      p.mois_concerne === currentMonth &&
      p.annee_concernee === currentYear
  );

  // Tenant's payment history
  const tenantPayments = paiements.filter(
    (p) => p.contrat?.locataire?.id === currentUser?.id || p.contrat_id === tenantContrat?.id
  );

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transRef.trim()) {
      alert('Veuillez saisir le numéro ou la référence de la transaction.');
      return;
    }

    try {
      setIsSubmitting(true);
      await enregistrerPaiementLocataire({
        contratId: tenantContrat.id,
        mois: currentMonth,
        annee: currentYear,
        montant: rentBreakdown.montantTotalExige,
        modePaiement: payMode,
        referenceTransaction: transRef,
        preuveUrl:
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      });
      setShowPayModal(false);
      setTransRef('');
      alert('Votre déclaration de paiement a bien été transmise au cabinet pour validation !');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    await mettreAJourProfilLocataire(currentUser.id, editName, avatarUrl);
    alert('Profil mis à jour avec succès.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto shadow-2xl relative pb-20">
      {/* Top Mobile Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Avatar"
            className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover"
          />
          <div>
            <h1 className="font-bold text-sm text-white">{currentUser?.nom_complet || 'Espace Locataire'}</h1>
            <p className="text-[11px] text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Bail en cours • {tenantBien.code_reference}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            deconnexion();
            window.location.href = '/auth/locataire';
          }}
          className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="p-4 space-y-4 flex-1">
        {/* TAB: LOYER & PAIEMENT */}
        {activeTab === 'loyer' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Rent Status Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Loyer du mois
                  </span>
                  <h2 className="text-xl font-bold text-white capitalize">
                    {formatMonthYearFR(currentMonth, currentYear)}
                  </h2>
                </div>

                {currentPayment?.statut === 'valide' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Réglé & Validé
                  </span>
                ) : currentPayment?.statut === 'en_attente' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    En attente de validation
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    À Payer
                  </span>
                )}
              </div>

              {/* Total Rent Amount & Breakdown */}
              <div className="pt-2 border-t border-slate-700/60">
                <p className="text-xs text-slate-400">Montant Total Exigible</p>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-3xl font-mono font-extrabold text-emerald-400">
                    {formatFCFA(rentBreakdown.montantTotalExige)}
                  </span>
                </div>

                {/* Imputed Repairs details alert if any */}
                {rentBreakdown.totalTravauxImputes > 0 && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center text-amber-400 font-bold">
                      <Wrench className="w-4 h-4 mr-1.5" />
                      Réparation imputée au loyer :
                    </div>
                    {rentBreakdown.travauxImputes.map((rep, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                        <span>• {rep.description}</span>
                        <span className="font-mono font-bold text-amber-300">
                          +{formatFCFA(rep.cout)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-amber-500/20 flex justify-between text-[11px] text-slate-400">
                      <span>Loyer de base : {formatFCFA(rentBreakdown.loyerBase)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment CTA or Receipt Access */}
              <div className="pt-2">
                {currentPayment?.statut === 'valide' ? (
                  <button
                    onClick={() => setSelectedReceipt(currentPayment)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/30 transition active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Consulter / Télécharger la Quittance</span>
                  </button>
                ) : currentPayment?.statut === 'en_attente' ? (
                  <div className="p-3 bg-slate-800/80 rounded-xl text-center text-xs text-slate-300">
                    <p className="font-semibold text-amber-300">Paiement en cours de contrôle</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Réf: {currentPayment.reference_transaction} • Quittance disponible dès validation.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Déclarer mon Paiement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Property Summary Box */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center text-slate-400 font-bold uppercase">
                <Building className="w-4 h-4 mr-1.5 text-emerald-400" />
                Mon Logement
              </div>
              <p className="font-bold text-white text-sm">
                {tenantBien.commune_quartier}
              </p>
              <p className="text-slate-400">{tenantBien.adresse_precise}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px]">
                <div>
                  <span className="text-slate-500">Loyer contractuel:</span>
                  <p className="font-mono font-bold text-white">{formatFCFA(tenantContrat.loyer_mensuel)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Dépôt de garantie:</span>
                  <p className="font-mono font-bold text-white">{formatFCFA(tenantContrat.depot_garantie)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REÇUS & QUITTANCES */}
        {activeTab === 'recus' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Mes Quittances Officielles
            </h2>

            {tenantPayments.map((p) => {
              const isVal = p.statut === 'valide';
              return (
                <div
                  key={p.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white capitalize">
                      {formatMonthYearFR(p.mois_concerne, p.annee_concernee)}
                    </p>
                    <p className="text-xs font-mono text-emerald-400 font-bold">
                      {formatFCFA(p.montant_total_paye)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isVal ? `Quittance N° ${p.numero_recu}` : 'En cours de validation'}
                    </p>
                  </div>

                  {isVal ? (
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Reçu A4
                    </button>
                  ) : (
                    <span className="text-xs text-amber-400 italic">En attente</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: TRAVAUX IMPUTÉS */}
        {activeTab === 'travaux' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Réparations sur le Logement
            </h2>
            {repairsForCurrentMonth.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 text-center text-xs text-slate-400">
                Aucune réparation imputée pour ce mois.
              </div>
            ) : (
              repairsForCurrentMonth.map((t) => (
                <div key={t.id} className="bg-slate-800 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-xs">{t.description}</h3>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {formatFCFA(t.cout)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Intervention: {formatDateFR(t.date_intervention)} • {t.prestataire_nom}
                  </p>
                  <p className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                    Imputé sur le loyer de {formatMonthYearFR(t.loyer_impacte_mois || 9, t.loyer_impacte_annee || 2026)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: PROFIL */}
        {activeTab === 'profil' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <img
                    src={avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-full border-4 border-emerald-500 object-cover shadow-lg"
                  />
                  <button
                    onClick={() => {
                      const newUrl = prompt('Entrez l URL de votre photo :', avatarUrl);
                      if (newUrl) setAvatarUrl(newUrl);
                    }}
                    className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow hover:bg-emerald-400 transition"
                    title="Changer la photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-bold text-white text-base">{currentUser?.nom_complet}</h3>
                <p className="text-xs text-slate-400">{currentUser?.telephone}</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Nom Complet</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white mt-1 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition active:scale-95"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Declaration Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom duration-200 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Déclarer un Règlement</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendPayment} className="space-y-4">
              <div className="bg-slate-800/80 p-3 rounded-xl">
                <p className="text-xs text-slate-400">Montant à régler :</p>
                <p className="text-2xl font-mono font-extrabold text-emerald-400">
                  {formatFCFA(rentBreakdown.montantTotalExige)}
                </p>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Moyen de Paiement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMode('mobile_money')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      payMode === 'mobile_money'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Wave / OM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('virement')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      payMode === 'virement'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Virement
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode('espece')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      payMode === 'espece'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Espèces
                  </button>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  ID Transaction / Référence Reçu *
                </label>
                <input
                  type="text"
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  placeholder="Ex: WAVE-CI-98421034"
                  className="w-full text-sm p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {isSubmitting ? 'Envoi...' : 'Transmettre au Cabinet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Full Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 flex justify-center items-start">
          <div className="w-full max-w-4xl my-4">
            <OfficialReceipt
              paiement={selectedReceipt}
              onClose={() => setSelectedReceipt(null)}
            />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-2 flex justify-around items-center z-40">
        <button
          onClick={() => setActiveTab('loyer')}
          className={`flex flex-col items-center p-2 rounded-xl text-xs transition ${
            activeTab === 'loyer' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Loyer</span>
        </button>

        <button
          onClick={() => setActiveTab('recus')}
          className={`flex flex-col items-center p-2 rounded-xl text-xs transition ${
            activeTab === 'recus' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Quittances</span>
        </button>

        <button
          onClick={() => setActiveTab('travaux')}
          className={`flex flex-col items-center p-2 rounded-xl text-xs transition ${
            activeTab === 'travaux' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] mt-1">Travaux</span>
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center p-2 rounded-xl text-xs transition ${
            activeTab === 'profil' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1">Profil</span>
        </button>
      </div>
    </div>
  );
};
