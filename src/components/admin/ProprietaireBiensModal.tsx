'use client';

import React, { useState } from 'react';
import { Bien, ContratBail, Profile, Proprietaire } from '@/types/database.types';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  Building2,
  X,
  MapPin,
  Phone,
  Mail,
  Home,
  CreditCard,
  User,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

interface ProprietaireBiensModalProps {
  proprietaire: Proprietaire;
  biens: Bien[];
  contrats: ContratBail[];
  profiles: Profile[];
  isOpen?: boolean;
  onClose: () => void;
  onEditBien?: (bien: Bien) => void;
  onAddBienForProp?: () => void;
  onAddLocataireForBien?: (bien: Bien) => void;
}

export const ProprietaireBiensModal: React.FC<ProprietaireBiensModalProps> = ({
  proprietaire,
  biens,
  contrats,
  profiles,
  onClose,
  onEditBien,
  onAddBienForProp,
  onAddLocataireForBien,
}) => {
  const [filterStatus, setFilterStatus] = useState<'tous' | 'loues' | 'disponibles'>('tous');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const totalBiens = biens.length;
  const louesBiens = biens.filter((b) => b.est_occupe);
  const disponiblesBiens = biens.filter((b) => !b.est_occupe);
  const tauxOccupation = totalBiens > 0 ? Math.round((louesBiens.length / totalBiens) * 100) : 0;

  const totalLoyerMensuel = biens.reduce((sum, b) => sum + (b.loyer_mensuel_reference || 0), 0);
  const loyerActuelEncaisse = louesBiens.reduce((sum, b) => {
    const contrat = contrats.find((c) => c.bien_id === b.id && c.statut === 'actif');
    return sum + (contrat ? contrat.loyer_mensuel : b.loyer_mensuel_reference);
  }, 0);

  // Filtered list
  const filteredBiens = biens.filter((b) => {
    if (filterStatus === 'loues' && !b.est_occupe) return false;
    if (filterStatus === 'disponibles' && b.est_occupe) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const contrat = contrats.find((c) => c.bien_id === b.id && c.statut === 'actif');
    const locataire = contrat ? profiles.find((p) => p.id === contrat.locataire_profile_id) : null;

    return (
      b.code_reference.toLowerCase().includes(q) ||
      b.commune_quartier.toLowerCase().includes(q) ||
      b.adresse_precise.toLowerCase().includes(q) ||
      b.type_bien.toLowerCase().includes(q) ||
      (locataire?.nom_complet && locataire.nom_complet.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Patrimoine Immobilier
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {proprietaire.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{proprietaire.nom_complet}</h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 mt-1">
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {proprietaire.telephone}
                </span>
                {proprietaire.email && (
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {proprietaire.email}
                  </span>
                )}
                {proprietaire.adresse && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    {proprietaire.adresse}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial & Status Summary Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center">
              <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Total Biens
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalBiens}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">En gestion par le cabinet</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Biens Loués
            </p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {louesBiens.length}{' '}
              <span className="text-xs font-semibold text-emerald-600">({tauxOccupation}%)</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Taux d'occupation</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Disponibles
            </p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{disponiblesBiens.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">À la recherche de locataire</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Loyers Actifs
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
              {formatFCFA(loyerActuelEncaisse)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Potentiel : {formatFCFA(totalLoyerMensuel)}/m
            </p>
          </div>
        </div>

        {/* Body Toolbar: Search & Filter Pills */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('tous')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'tous'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous les Biens ({totalBiens})
            </button>
            <button
              onClick={() => setFilterStatus('loues')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center ${
                filterStatus === 'loues'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Loués ({louesBiens.length})
            </button>
            <button
              onClick={() => setFilterStatus('disponibles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center ${
                filterStatus === 'disponibles'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Disponibles ({disponiblesBiens.length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer par réf, commune, locataire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {onAddBienForProp && (
              <button
                onClick={onAddBienForProp}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition active:scale-95 whitespace-nowrap"
                title="Ajouter un nouveau bien à ce propriétaire"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                + Nouveau Bien
              </button>
            )}
          </div>
        </div>

        {/* Biens List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {filteredBiens.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Aucun bien trouvé</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {totalBiens === 0
                  ? 'Ce propriétaire ne possède aucun bien enregistré pour le moment.'
                  : 'Aucun bien ne correspond aux filtres de recherche sélectionnés.'}
              </p>
              {totalBiens === 0 && onAddBienForProp && (
                <button
                  onClick={onAddBienForProp}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Ajouter le premier bien
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBiens.map((bien) => {
                const contrat = contrats.find((c) => c.bien_id === bien.id && c.statut === 'actif');
                const locataire = contrat ? profiles.find((p) => p.id === contrat.locataire_profile_id) : null;
                const loyerEffectif = contrat ? contrat.loyer_mensuel : bien.loyer_mensuel_reference;
                const tauxCom = contrat?.taux_commission ?? 10;
                const comCabinet = Math.round(loyerEffectif * (tauxCom / 100));
                const netBailleur = loyerEffectif - comCabinet;

                return (
                  <div
                    key={bien.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3.5"
                  >
                    {/* Card Top: Code & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {bien.code_reference}
                          </span>
                          <span className="text-xs font-bold text-slate-600 capitalize">
                            {bien.type_bien.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 flex items-center pt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                          <span>{bien.commune_quartier}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 pl-4">{bien.adresse_precise}</p>
                      </div>

                      {/* Status Badge */}
                      {bien.est_occupe ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Loué
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0">
                          <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                          Disponible
                        </span>
                      )}
                    </div>

                    {/* Financial split banner */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Loyer Mensuel :</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {formatFCFA(loyerEffectif)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                        <span>
                          Com. Cabinet ({tauxCom}%) : <strong className="text-rose-600 font-mono">{formatFCFA(comCabinet)}</strong>
                        </span>
                        <span>
                          Net Bailleur : <strong className="text-emerald-800 font-mono">{formatFCFA(netBailleur)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Lease & Tenant Details if rented */}
                    {bien.est_occupe && contrat ? (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center">
                          <UserCheck className="w-3 h-3 mr-1 text-emerald-700" />
                          Locataire en Titre
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">
                            {locataire?.nom_complet || 'Locataire'}
                          </span>
                          <span className="text-slate-600 font-medium">
                            {locataire?.telephone || '-'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Bail actif depuis le : <span className="font-semibold text-slate-700">{formatDateFR(contrat.date_debut)}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
                        <span className="text-xs text-amber-800 font-medium">
                          Aucun contrat de bail actif
                        </span>
                        {onAddLocataireForBien && (
                          <button
                            onClick={() => onAddLocataireForBien(bien)}
                            className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition active:scale-95"
                          >
                            + Nouveau Bail
                          </button>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        {bien.description ? bien.description.slice(0, 35) + '...' : 'Aucune note'}
                      </span>
                      {onEditBien && (
                        <button
                          onClick={() => onEditBien(bien)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-500">
            Mode de versement : <strong className="text-slate-800 capitalize">{proprietaire.mode_versement_prefere.replace('_', ' ')}</strong>
            {proprietaire.rib_ou_numero_compte && (
              <span className="ml-2 font-mono text-slate-700">({proprietaire.rib_ou_numero_compte})</span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
