'use client';

import React, { useState } from 'react';
import { PaiementWithDetails, PaymentStatus } from '@/types/database.types';
import { formatFCFA, formatDateFR, formatMonthYearFR } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck2,
  Printer,
  Search,
  Filter,
  Eye,
  CreditCard,
  Building,
  User,
  ArrowUpDown,
} from 'lucide-react';
import { PaymentValidationModal } from './PaymentValidationModal';
import { OfficialReceipt } from '@/components/receipt/OfficialReceipt';

interface PaymentValidationTableProps {
  paiements: PaiementWithDetails[];
  onValidate: (paiementId: string, notes?: string) => Promise<PaiementWithDetails>;
  onReject: (paiementId: string, reason: string) => Promise<void>;
}

export const PaymentValidationTable: React.FC<PaymentValidationTableProps> = ({
  paiements,
  onValidate,
  onReject,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePaymentForModal, setActivePaymentForModal] = useState<PaiementWithDetails | null>(null);
  const [activePaymentForReceipt, setActivePaymentForReceipt] = useState<PaiementWithDetails | null>(null);

  const filteredPaiements = paiements.filter((p) => {
    const matchesFilter = selectedFilter === 'tous' || p.statut === selectedFilter;
    const locataireNom = p.contrat?.locataire?.nom_complet?.toLowerCase() || '';
    const bienRef = p.contrat?.bien?.code_reference?.toLowerCase() || '';
    const recuNum = p.numero_recu?.toLowerCase() || '';
    const transRef = p.reference_transaction?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !query ||
      locataireNom.includes(query) ||
      bienRef.includes(query) ||
      recuNum.includes(query) ||
      transRef.includes(query);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'valide':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Validé
          </span>
        );
      case 'en_attente':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            En attente
          </span>
        );
      case 'rejete':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Rejeté
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par locataire, bien, N° reçu ou transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter('tous')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedFilter === 'tous'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({paiements.length})
          </button>
          <button
            onClick={() => setSelectedFilter('en_attente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              selectedFilter === 'en_attente'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3 mr-1" />
            En attente ({paiements.filter((p) => p.statut === 'en_attente').length})
          </button>
          <button
            onClick={() => setSelectedFilter('valide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              selectedFilter === 'valide'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validés ({paiements.filter((p) => p.statut === 'valide').length})
          </button>
          <button
            onClick={() => setSelectedFilter('rejete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
              selectedFilter === 'rejete'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejetés ({paiements.filter((p) => p.statut === 'rejete').length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Locataire & Bien</th>
                <th className="py-3.5 px-4">Période Loyer</th>
                <th className="py-3.5 px-4 text-right">Montant Encaissé</th>
                <th className="py-3.5 px-4 text-center">Mode & Réf</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-center">N° Reçu</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPaiements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                    Aucun encaissement ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredPaiements.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                    {/* Locataire & Bien */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {p.contrat?.locataire?.nom_complet}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Building className="w-3 h-3 mr-1 text-slate-400" />
                        <span className="font-mono font-medium text-slate-700 mr-1">
                          {p.contrat?.bien?.code_reference}
                        </span>
                        • {p.contrat?.bien?.commune_quartier}
                      </div>
                    </td>

                    {/* Mois & Année */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 capitalize">
                        {formatMonthYearFR(p.mois_concerne, p.annee_concernee)}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Déclaré le {formatDateFR(p.created_at)}
                      </p>
                    </td>

                    {/* Montant */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {formatFCFA(p.montant_total_paye)}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Com. 10%: <span className="font-mono font-semibold">{formatFCFA(p.commission_cabinet)}</span>
                      </p>
                    </td>

                    {/* Mode & Réf */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center text-xs capitalize text-slate-700 font-medium">
                        <CreditCard className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {p.mode_paiement?.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] font-mono text-slate-500">
                        {p.reference_transaction || '-'}
                      </p>
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(p.statut)}
                    </td>

                    {/* Numéro Reçu */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {p.numero_recu ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.numero_recu}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">En attente</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {p.statut === 'en_attente' ? (
                          <button
                            onClick={() => setActivePaymentForModal(p)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition active:scale-95"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                            Valider
                          </button>
                        ) : p.statut === 'valide' ? (
                          <button
                            onClick={() => setActivePaymentForReceipt(p)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
                            title="Consulter et Imprimer le Reçu A4"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                            Reçu A4
                          </button>
                        ) : (
                          <button
                            onClick={() => setActivePaymentForModal(p)}
                            className="inline-flex items-center px-2.5 py-1 rounded text-xs text-slate-500 hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Détails
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation / Control Modal */}
      {activePaymentForModal && (
        <PaymentValidationModal
          paiement={activePaymentForModal}
          isOpen={true}
          onClose={() => setActivePaymentForModal(null)}
          onConfirmValidate={onValidate}
          onConfirmReject={onReject}
        />
      )}

      {/* Direct Receipt Preview Modal */}
      {activePaymentForReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 flex justify-center items-start">
          <div className="w-full max-w-5xl my-6">
            <OfficialReceipt
              paiement={activePaymentForReceipt}
              onClose={() => setActivePaymentForReceipt(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
