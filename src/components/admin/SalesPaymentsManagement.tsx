'use client';

import React, { useState, useEffect } from 'react';
import {
  TransactionVente,
  Bien,
  Acquereur,
  Proprietaire,
  Notaire,
  EncaissementVente,
  TypeEncaissementVente,
  PaymentMode,
  PaymentStatus,
} from '@/types/database.types';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  MOCK_ACQUEREURS,
  MOCK_NOTAIRES,
  MOCK_TRANSACTIONS_VENTES,
  MOCK_ENCAISSEMENTS_VENTES,
} from '@/lib/mock-data';
import {
  Briefcase,
  CreditCard,
  PlusCircle,
  Search,
  Printer,
  Trash2,
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle2,
  FileCheck2,
  Percent,
  Clock,
  Edit,
  XCircle,
} from 'lucide-react';
import { SaleReceiptModal } from './SaleReceiptModal';
import { TransactionEncaissementsModal } from './TransactionEncaissementsModal';
import { EditSalePaymentModal } from './EditSalePaymentModal';

const LOCAL_STORAGE_TX_KEY = 'cabinet_immo_transactions_ventes';
const LOCAL_STORAGE_ENC_KEY = 'cabinet_immo_encaissements_ventes';

export const SalesPaymentsManagement: React.FC = () => {
  const { biens, proprietaires } = useAppStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [encaissements, setEncaissements] = useState<EncaissementVente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('tous');
  const [statusFilter, setStatusFilter] = useState<string>('tous');

  // Modals
  const [selectedTxForModal, setSelectedTxForModal] = useState<any | null>(null);
  const [receiptToView, setReceiptToView] = useState<{
    encaissement: EncaissementVente;
    transaction: any;
  } | null>(null);
  const [activeEncaissementForEdit, setActiveEncaissementForEdit] = useState<{
    encaissement: EncaissementVente;
    transaction: any;
  } | null>(null);
  const [showDirectAddModal, setShowDirectAddModal] = useState(false);

  // Form states for direct add
  const [selectedTxId, setSelectedTxId] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [dateEncaissement, setDateEncaissement] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [typeEncaissement, setTypeEncaissement] =
    useState<TypeEncaissementVente>('acompte_compromis');
  const [modePaiement, setModePaiement] = useState<PaymentMode>('virement');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Load transactions and encaissements
  const loadData = async () => {
    setIsLoading(true);
    let loadedTxs: any[] = [];
    let loadedEncs: EncaissementVente[] = [];

    // 1. Fetch transactions
    try {
      const { data: supaTxs, error: txError } = await supabase
        .from('transactions_ventes')
        .select('*, acquereurs(*), notaires(*)')
        .order('created_at', { ascending: false });

      if (!txError && supaTxs && supaTxs.length > 0) {
        loadedTxs = supaTxs;
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
        loadedTxs = saved ? JSON.parse(saved) : MOCK_TRANSACTIONS_VENTES;
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      loadedTxs = saved ? JSON.parse(saved) : MOCK_TRANSACTIONS_VENTES;
    }

    // Enrich transactions with biens & proprietaires from store
    const enrichedTxs = loadedTxs.map((tx: any) => {
      const bien = biens.find((b) => b.id === tx.bien_id);
      const proprietaire = proprietaires.find((p) => p.id === tx.vendeur_id);
      const acquereur =
        tx.acquereurs ||
        MOCK_ACQUEREURS.find((a) => a.id === tx.acquereur_id) || {
          nom_complet: 'Acquéreur',
          telephone: '-',
        };
      const notaire =
        tx.notaires ||
        MOCK_NOTAIRES.find((n) => n.id === tx.notaire_id) ||
        null;

      return {
        ...tx,
        biens: bien,
        proprietaires: proprietaire,
        acquereurs: acquereur,
        notaires: notaire,
      };
    });
    setTransactions(enrichedTxs);

    // 2. Fetch sales encaissements
    try {
      const { data: supaEncs, error: encError } = await (
        supabase.from('encaissements_ventes') as any
      )
        .select('*')
        .order('date_encaissement', { ascending: false });

      if (!encError && supaEncs && supaEncs.length > 0) {
        loadedEncs = supaEncs;
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_ENC_KEY);
        loadedEncs = saved ? JSON.parse(saved) : MOCK_ENCAISSEMENTS_VENTES;
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_STORAGE_ENC_KEY);
      loadedEncs = saved ? JSON.parse(saved) : MOCK_ENCAISSEMENTS_VENTES;
    }

    setEncaissements(loadedEncs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [biens, proprietaires]);

  // Add Encaissement
  const handleAddEncaissement = async (payload: {
    transaction_vente_id: string;
    montant: number;
    date_encaissement: string;
    type_encaissement: TypeEncaissementVente;
    mode_paiement: PaymentMode;
    reference_paiement?: string;
    notes?: string;
  }) => {
    const nextSeq = encaissements.length + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    const numeroRecu = `REC-VTE-${new Date().getFullYear()}-${seqStr}`;

    const newEnc: EncaissementVente = {
      id: `enc-vte-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      transaction_vente_id: payload.transaction_vente_id,
      montant: payload.montant,
      date_encaissement: payload.date_encaissement,
      type_encaissement: payload.type_encaissement,
      mode_paiement: payload.mode_paiement,
      reference_paiement: payload.reference_paiement || null,
      numero_recu: numeroRecu,
      statut: 'en_attente',
      encaisse_par: 'Cabinet Ivoire Immo',
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
    };

    // Try saving to Supabase
    try {
      await (supabase.from('encaissements_ventes') as any).insert([newEnc]);
    } catch (e) {
      console.warn('Fallback to local storage for encaissements_ventes', e);
    }

    const updated = [newEnc, ...encaissements];
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Update Encaissement
  const handleUpdateEncaissement = async (
    id: string,
    updates: Partial<EncaissementVente>
  ) => {
    try {
      await (supabase.from('encaissements_ventes') as any)
        .update(updates)
        .eq('id', id);
    } catch (e) {
      console.warn('Fallback update encaissement vente locally', e);
    }

    const updated = encaissements.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Validate Encaissement (marks as 'valide' and sets receipt number)
  const handleValidateEncaissement = async (id: string) => {
    const enc = encaissements.find((e) => e.id === id);
    if (!enc) return;

    const numeroRecu =
      enc.numero_recu ||
      `REC-VTE-${new Date().getFullYear()}-${String(encaissements.length).padStart(4, '0')}`;

    const updates: Partial<EncaissementVente> = {
      statut: 'valide',
      numero_recu: numeroRecu,
    };

    try {
      await (supabase.from('encaissements_ventes') as any)
        .update(updates)
        .eq('id', id);
    } catch (e) {
      console.warn('Fallback validate encaissement vente locally', e);
    }

    const updated = encaissements.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Delete Encaissement
  const handleDeleteEncaissement = async (id: string) => {
    try {
      await (supabase.from('encaissements_ventes') as any).delete().eq('id', id);
    } catch (e) {
      console.warn('Fallback delete locally', e);
    }

    const updated = encaissements.filter((e) => e.id !== id);
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Direct modal submit
  const handleDirectAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !montant || Number(montant) <= 0) {
      alert('Veuillez sélectionner une transaction et saisir un montant.');
      return;
    }

    setIsSubmitting(true);
    await handleAddEncaissement({
      transaction_vente_id: selectedTxId,
      montant: Number(montant),
      date_encaissement: dateEncaissement,
      type_encaissement: typeEncaissement,
      mode_paiement: modePaiement,
      reference_paiement: referencePaiement.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);
    setShowDirectAddModal(false);
    setMontant('');
    setSelectedTxId('');
    setReferencePaiement('');
    setNotes('');
  };

  // Calculations
  const totalVolumeVentes = transactions.reduce(
    (sum, t) => sum + Number(t.prix_convenu || 0),
    0
  );

  const totalEncaissePrixVentes = encaissements
    .filter((e) => e.type_encaissement !== 'commission_agence')
    .reduce((sum, e) => sum + Number(e.montant || 0), 0);

  const totalCommissionsEncaissées = encaissements
    .filter((e) => e.type_encaissement === 'commission_agence')
    .reduce((sum, e) => sum + Number(e.montant || 0), 0);

  const totalCommissionsDues = transactions.reduce(
    (sum, t) => sum + Number(t.frais_agence || 0),
    0
  );

  const restePrixVentes = Math.max(0, totalVolumeVentes - totalEncaissePrixVentes);

  // Filtered Encaissements
  const query = searchQuery.toLowerCase().trim();
  const filteredEncaissements = encaissements.filter((enc) => {
    if (statusFilter !== 'tous' && (enc.statut || 'en_attente') !== statusFilter) return false;
    if (typeFilter !== 'tous' && enc.type_encaissement !== typeFilter) return false;

    if (!query) return true;

    const tx = transactions.find((t) => t.id === enc.transaction_vente_id);
    return (
      (enc.numero_recu && enc.numero_recu.toLowerCase().includes(query)) ||
      (enc.reference_paiement && enc.reference_paiement.toLowerCase().includes(query)) ||
      (tx?.biens?.code_reference && tx.biens.code_reference.toLowerCase().includes(query)) ||
      (tx?.acquereurs?.nom_complet && tx.acquereurs.nom_complet.toLowerCase().includes(query))
    );
  });

  const getTypeBadge = (type: TypeEncaissementVente) => {
    switch (type) {
      case 'acompte_compromis':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
            Acompte Compromis
          </span>
        );
      case 'solde_vente':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
            Solde Vente
          </span>
        );
      case 'commission_agence':
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold border border-indigo-200">
            Commission Cabinet
          </span>
        );
      case 'echeance_partielle':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
            Échéance Partielle
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
            Autre
          </span>
        );
    }
  };

  const getStatusBadge = (statut: PaymentStatus = 'en_attente') => {
    switch (statut) {
      case 'valide':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Validé
          </span>
        );
      case 'rejete':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      case 'en_attente':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center">
            <CreditCard className="w-6 h-6 mr-2.5 text-emerald-600" />
            Encaissements des Ventes Immobilières
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des acomptes sur compromis, règlements de solde et encaissements des honoraires de transaction.
          </p>
        </div>

        <button
          onClick={() => {
            if (transactions.length > 0) {
              setSelectedTxId(transactions[0].id);
            }
            setShowDirectAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          + Nouvel Encaissement Vente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume Ventes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
            <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Volume Transactions
          </p>
          <p className="text-xl font-black text-slate-900 font-mono">
            {formatFCFA(totalVolumeVentes)}
          </p>
          <p className="text-[10px] text-slate-500">
            {transactions.length} vente(s) enregistrée(s)
          </p>
        </div>

        {/* Prix Ventes Encaissé */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            Prix Encaissé (Fonds Reçus)
          </p>
          <p className="text-xl font-black text-emerald-700 font-mono">
            {formatFCFA(totalEncaissePrixVentes)}
          </p>
          <p className="text-[10px] text-slate-500">
            Reste à recouvrer : <strong>{formatFCFA(restePrixVentes)}</strong>
          </p>
        </div>

        {/* Commissions Encaissées */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
            <Percent className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Commissions Cabinet Reçues
          </p>
          <p className="text-xl font-black text-indigo-700 font-mono">
            {formatFCFA(totalCommissionsEncaissées)}
          </p>
          <p className="text-[10px] text-slate-500">
            Total dû : {formatFCFA(totalCommissionsDues)}
          </p>
        </div>

        {/* Nombre de versements */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center">
            <FileCheck2 className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Total Versements
          </p>
          <p className="text-xl font-black text-slate-900 font-mono">
            {encaissements.length}
          </p>
          <p className="text-[10px] text-slate-500">
            Quittances émises avec QR Code
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par reçu, bien, acquéreur..."
            className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills and Type Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('tous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'tous'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({encaissements.length})
            </button>
            <button
              onClick={() => setStatusFilter('en_attente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                statusFilter === 'en_attente'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              En attente ({encaissements.filter((e) => (e.statut || 'en_attente') === 'en_attente').length})
            </button>
            <button
              onClick={() => setStatusFilter('valide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center ${
                statusFilter === 'valide'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Validés ({encaissements.filter((e) => e.statut === 'valide').length})
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500">Type :</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="tous">Tous les types</option>
              <option value="acompte_compromis">Acompte Compromis</option>
              <option value="solde_vente">Solde Vente</option>
              <option value="commission_agence">Commission Agence</option>
              <option value="echeance_partielle">Échéance Partielle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Sales Encaissements */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">N° Reçu</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Bien Concerné</th>
                <th className="py-3.5 px-4">Acquéreur / Payeur</th>
                <th className="py-3.5 px-4">Nature du Versement</th>
                <th className="py-3.5 px-4">Mode & Réf.</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Montant Encaissé</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Chargement des encaissements de vente...
                  </td>
                </tr>
              ) : filteredEncaissements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Aucun encaissement de vente trouvé.
                  </td>
                </tr>
              ) : (
                filteredEncaissements.map((enc) => {
                  const tx = transactions.find((t) => t.id === enc.transaction_vente_id);

                  return (
                    <tr key={enc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {enc.statut === 'valide' && enc.numero_recu ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {enc.numero_recu}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {enc.numero_recu || 'En attente'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {formatDateFR(enc.date_encaissement)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {tx?.biens?.code_reference || '-'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {tx?.biens?.commune_quartier || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {tx?.acquereurs?.nom_complet || 'Acquéreur'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {tx?.acquereurs?.telephone || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(enc.type_encaissement)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="capitalize font-semibold block">
                          {enc.mode_paiement.replace('_', ' ')}
                        </span>
                        {enc.reference_paiement && (
                          <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {enc.reference_paiement}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(enc.statut)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatFCFA(enc.montant)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {enc.statut === 'en_attente' ? (
                            <>
                              <button
                                onClick={() =>
                                  setActiveEncaissementForEdit({
                                    encaissement: enc,
                                    transaction: tx,
                                  })
                                }
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition active:scale-95"
                                title="Modifier les détails de cet encaissement"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleValidateEncaissement(enc.id)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition active:scale-95"
                                title="Valider l'encaissement et émettre la quittance"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                                Valider
                              </button>
                            </>
                          ) : enc.statut === 'valide' ? (
                            <button
                              onClick={() => {
                                if (tx) {
                                  setReceiptToView({ encaissement: enc, transaction: tx });
                                }
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
                              title="Imprimer / Télécharger le reçu"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              Reçu
                            </button>
                          ) : null}
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Confirmez-vous la suppression de l'encaissement de ${formatFCFA(
                                    enc.montant
                                  )} ?`
                                )
                              ) {
                                handleDeleteEncaissement(enc.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Direct New Encaissement */}
      {showDirectAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Enregistrer un Encaissement de Vente</h3>
              </div>
              <button
                onClick={() => setShowDirectAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Transaction de Vente Concernée *
                </label>
                <select
                  required
                  value={selectedTxId}
                  onChange={(e) => setSelectedTxId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="">Sélectionner une transaction...</option>
                  {transactions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.biens?.code_reference} - Acheteur : {t.acquereurs?.nom_complet} ({formatFCFA(t.prix_convenu)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Montant Encaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={montant}
                    onChange={(e) =>
                      setMontant(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ex: 12000000"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Date du Versement *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateEncaissement}
                    onChange={(e) => setDateEncaissement(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Type de Règlement *
                  </label>
                  <select
                    value={typeEncaissement}
                    onChange={(e) =>
                      setTypeEncaissement(e.target.value as TypeEncaissementVente)
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="acompte_compromis">Acompte Compromis</option>
                    <option value="echeance_partielle">Échéance Partielle</option>
                    <option value="solde_vente">Solde Prix Vente</option>
                    <option value="commission_agence">Honoraires Commission Agence</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Mode de Règlement *
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as PaymentMode)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque Bancaire</option>
                    <option value="espece">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Référence du Paiement / Chèque
                </label>
                <input
                  type="text"
                  value={referencePaiement}
                  onChange={(e) => setReferencePaiement(e.target.value)}
                  placeholder="Ex: CHQ-55910 ou VIR-SGBCI-881"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations éventuelles..."
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Valider le Règlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reçu officiel modal */}
      {receiptToView && (
        <SaleReceiptModal
          encaissement={receiptToView.encaissement}
          transaction={receiptToView.transaction}
          onClose={() => setReceiptToView(null)}
        />
      )}

      {/* Edit Sale Payment Modal (pour encaissements en attente) */}
      {activeEncaissementForEdit && (
        <EditSalePaymentModal
          encaissement={activeEncaissementForEdit.encaissement}
          transaction={activeEncaissementForEdit.transaction}
          isOpen={!!activeEncaissementForEdit}
          onClose={() => setActiveEncaissementForEdit(null)}
          onSave={async (id, updates) => {
            await handleUpdateEncaissement(id, updates);
            setActiveEncaissementForEdit(null);
          }}
        />
      )}

      {/* Modal Détails Transaction & Encaissements */}
      {selectedTxForModal && (
        <TransactionEncaissementsModal
          transaction={selectedTxForModal}
          encaissements={encaissements}
          onClose={() => setSelectedTxForModal(null)}
          onAddEncaissement={handleAddEncaissement}
          onDeleteEncaissement={handleDeleteEncaissement}
          onUpdateEncaissement={handleUpdateEncaissement}
          onValidateEncaissement={handleValidateEncaissement}
        />
      )}
    </div>
  );
};
