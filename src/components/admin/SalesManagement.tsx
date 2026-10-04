'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  CreditCard,
  Printer,
  TrendingUp,
  Camera,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  TransactionVente,
  Bien,
  Acquereur,
  Notaire,
  Proprietaire,
  EncaissementVente,
  TypeEncaissementVente,
  PaymentMode,
} from '@/types/database.types';
import { useAppStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import { DocumentUploader } from '@/components/admin/DocumentUploader';
import { TransactionEncaissementsModal } from './TransactionEncaissementsModal';
import { MOCK_ENCAISSEMENTS_VENTES } from '@/lib/mock-data';

const LOCAL_STORAGE_ENC_KEY = 'cabinet_immo_encaissements_ventes';

export const SalesManagement = () => {
  const { biens, proprietaires } = useAppStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [acquereurs, setAcquereurs] = useState<Acquereur[]>([]);
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  const [encaissements, setEncaissements] = useState<EncaissementVente[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [selectedTxForEncaissements, setSelectedTxForEncaissements] = useState<any | null>(null);

  // Form states
  const [bienId, setBienId] = useState('');
  const [vendeurId, setVendeurId] = useState('');
  const [acquereurId, setAcquereurId] = useState('');
  const [notaireId, setNotaireId] = useState('');
  const [prixConvenu, setPrixConvenu] = useState<number | ''>('');
  const [tauxCommission, setTauxCommission] = useState<number | ''>(5);
  const [fraisAgence, setFraisAgence] = useState<number | ''>('');
  const [statut, setStatut] = useState<
    'initiee' | 'compromis_signe' | 'acte_final_signe' | 'annulee'
  >('initiee');
  const [dateCompromis, setDateCompromis] = useState('');
  const [dateActeFinal, setDateActeFinal] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ventePhoto, setVentePhoto] = useState('');
  const [isUploadingVentePhoto, setIsUploadingVentePhoto] = useState(false);
  const [showPhotoPromptVente, setShowPhotoPromptVente] = useState(false);
  const venteFileInputRef = React.useRef<HTMLInputElement>(null);
  const venteCameraInputRef = React.useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    const [txRes, acqRes, notRes, encRes] = await Promise.all([
      supabase
        .from('transactions_ventes')
        .select('*, acquereurs(*), notaires(*)')
        .order('created_at', { ascending: false }),
      supabase.from('acquereurs').select('*'),
      supabase.from('notaires').select('*'),
      (supabase.from('encaissements_ventes') as any)
        .select('*')
        .order('date_encaissement', { ascending: false }),
    ]);

    // We enrich transactions with biens and proprietaires from local store
    if (txRes.data) {
      const enrichedTxs = (txRes.data as any[]).map((tx: any) => {
        const bien = biens.find((b) => b.id === tx.bien_id);
        const proprietaire = proprietaires.find((p) => p.id === tx.vendeur_id);
        return {
          ...tx,
          biens: bien,
          proprietaires: proprietaire,
        };
      });
      setTransactions(enrichedTxs);
    }

    if (acqRes.data) setAcquereurs(acqRes.data);
    if (notRes.data) setNotaires(notRes.data);

    // Encaissements
    if (encRes.data && encRes.data.length > 0) {
      setEncaissements(encRes.data);
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_ENC_KEY);
      setEncaissements(saved ? JSON.parse(saved) : MOCK_ENCAISSEMENTS_VENTES);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [biens, proprietaires]);

  // When prixConvenu or tauxCommission changes, automatically recalculate fraisAgence
  const handlePrixChange = (val: number | '') => {
    setPrixConvenu(val);
    if (val !== '' && tauxCommission !== '') {
      setFraisAgence(Math.round(Number(val) * (Number(tauxCommission) / 100)));
    }
  };

  const handleTauxChange = (val: number | '') => {
    setTauxCommission(val);
    if (prixConvenu !== '' && val !== '') {
      setFraisAgence(Math.round(Number(prixConvenu) * (Number(val) / 100)));
    }
  };

  // Auto-select vendeur and pre-fill asking price when bien changes
  useEffect(() => {
    if (bienId) {
      const selectedBien = biens.find((b) => b.id === bienId);
      if (selectedBien) {
        setVendeurId(selectedBien.proprietaire_id);
        if (!editingTransaction && (prixConvenu === '' || prixConvenu === 0)) {
          const prix =
            selectedBien.prix_vente_demande || (selectedBien as any).prix_vente;
          if (prix) {
            setPrixConvenu(prix);
            const rate = tauxCommission !== '' ? Number(tauxCommission) : 5;
            setFraisAgence(Math.round(Number(prix) * (rate / 100)));
          }
        }
      }
    }
  }, [bienId, biens, editingTransaction]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setBienId('');
    setVendeurId('');
    setAcquereurId('');
    setNotaireId('');
    setPrixConvenu('');
    setTauxCommission(5);
    setFraisAgence('');
    setStatut('initiee');
    setDateCompromis('');
    setDateActeFinal('');
    setNotes('');
    setVentePhoto('');
    setShowPhotoPromptVente(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTransaction(t);
    setBienId(t.bien_id);
    setVendeurId(t.vendeur_id);
    setAcquereurId(t.acquereur_id);
    setNotaireId(t.notaire_id || '');
    setPrixConvenu(t.prix_convenu);

    const rate =
      t.taux_commission ??
      (t.frais_agence && t.prix_convenu
        ? Number(((t.frais_agence / t.prix_convenu) * 100).toFixed(1))
        : 5);
    setTauxCommission(rate);
    setFraisAgence(t.frais_agence || '');
    setStatut(t.statut);
    setDateCompromis(t.date_compromis || '');
    setDateActeFinal(t.date_acte_final || '');
    setNotes(t.notes || '');
    setVentePhoto(t.biens?.photos_urls?.[0] || '');
    setShowPhotoPromptVente(false);
    setShowAddModal(true);
  };

  // Add Encaissement handler for TransactionEncaissementsModal
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

    try {
      await (supabase.from('encaissements_ventes') as any).insert([newEnc]);
    } catch (e) {
      console.warn('Fallback to local storage for encaissement vente', e);
    }

    const updated = [newEnc, ...encaissements];
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Update Encaissement handler for TransactionEncaissementsModal
  const handleUpdateEncaissement = async (
    id: string,
    updates: Partial<EncaissementVente>
  ) => {
    try {
      await (supabase.from('encaissements_ventes') as any)
        .update(updates)
        .eq('id', id);
    } catch (e) {
      console.warn('Fallback update locally', e);
    }

    const updated = encaissements.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Validate Encaissement handler (marks as 'valide' and sets receipt number)
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
      console.warn('Fallback validate locally', e);
    }

    const updated = encaissements.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    setEncaissements(updated);
    localStorage.setItem(LOCAL_STORAGE_ENC_KEY, JSON.stringify(updated));
  };

  // Delete Encaissement handler
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

  const handleVentePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVentePhoto(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `vente_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `photos_ventes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents_contrats')
      .upload(filePath, file);

    if (uploadError) {
      alert("Erreur lors de l'upload du fichier: " + uploadError.message);
      setIsUploadingVentePhoto(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents_contrats')
      .getPublicUrl(filePath);

    setVentePhoto(publicUrl);
    setIsUploadingVentePhoto(false);
    if (venteFileInputRef.current) venteFileInputRef.current.value = '';
    if (venteCameraInputRef.current) venteCameraInputRef.current.value = '';
  };

  const saveTransactionCore = async () => {
    setIsSubmitting(true);

    const payload = {
      bien_id: bienId,
      vendeur_id: vendeurId,
      acquereur_id: acquereurId,
      notaire_id: notaireId || null,
      prix_convenu: Number(prixConvenu),
      frais_agence: fraisAgence ? Number(fraisAgence) : 0,
      taux_commission: tauxCommission !== '' ? Number(tauxCommission) : 5,
      statut,
      date_compromis: dateCompromis || null,
      date_acte_final: dateActeFinal || null,
      notes,
    };

    let targetTxId = editingTransaction?.id;

    if (editingTransaction) {
      const { error: txError } = await (
        supabase.from('transactions_ventes') as any
      )
        .update(payload)
        .eq('id', editingTransaction.id);
      if (txError) {
        console.error(
          'Erreur lors de la mise à jour de la transaction :',
          txError
        );
        alert(`Erreur : ${txError.message}`);
        setIsSubmitting(false);
        return;
      }

      // Update property status based on transaction status
      if (statut === 'acte_final_signe') {
        await (supabase.from('biens') as any)
          .update({ statut_vente: 'vendu' })
          .eq('id', bienId);
      } else if (statut === 'compromis_signe') {
        await (supabase.from('biens') as any)
          .update({ statut_vente: 'sous_compromis' })
          .eq('id', bienId);
      } else if (statut === 'annulee') {
        await (supabase.from('biens') as any)
          .update({ statut_vente: 'disponible' })
          .eq('id', bienId);
      }
    } else {
      const { data: insertedData, error: txError } = await (
        supabase.from('transactions_ventes') as any
      ).insert([payload]).select();
      if (txError) {
        console.error(
          'Erreur lors de la création de la transaction :',
          txError
        );
        alert(`Erreur : ${txError.message}`);
        setIsSubmitting(false);
        return;
      }
      targetTxId = insertedData?.[0]?.id;

      await (supabase.from('biens') as any)
        .update({ statut_vente: 'sous_compromis' })
        .eq('id', bienId);
    }

    // Save photo to documents_justificatifs if provided
    if (ventePhoto && targetTxId) {
      try {
        await (supabase.from('documents_justificatifs') as any).insert([
          {
            nom_fichier: `Photo_Vente_${Date.now()}`,
            type_document: 'autre',
            fichier_url: ventePhoto,
            transaction_vente_id: targetTxId,
          },
        ]);
      } catch (docErr) {
        console.warn('Erreur enregistrement document vente', docErr);
      }
    }

    await fetchData();
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bienId || !vendeurId || !acquereurId || !prixConvenu) {
      alert('Veuillez remplir tous les champs obligatoires (Bien, Acquéreur, Prix).');
      return;
    }

    // Si aucune photo n'a été ajoutée, demander confirmation avant de fermer
    if (!ventePhoto || ventePhoto.trim() === '') {
      setShowPhotoPromptVente(true);
      return;
    }

    await saveTransactionCore();
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'initiee': return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">Initiée</span>;
      case 'compromis_signe': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">Compromis Signé</span>;
      case 'acte_final_signe': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Acte Final Signé</span>;
      case 'annulee': return <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">Annulée</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Briefcase className="w-6 h-6 mr-2.5 text-emerald-600" />
            Transactions de Vente
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez le pipeline des ventes immobilières, de l'offre à l'acte final.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Nouvelle Vente
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Bien</th>
              <th className="py-3.5 px-4">Acquéreur / Vendeur</th>
              <th className="py-3.5 px-4">Prix & Commission</th>
              <th className="py-3.5 px-4">Recouvrement</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-4 text-slate-400">Chargement...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-500">Aucune vente en cours.</td></tr>
            ) : (
              transactions.map((t) => {
                const txEncs = encaissements.filter((e) => e.transaction_vente_id === t.id);
                const encaisseBien = txEncs
                  .filter((e) => e.type_encaissement !== 'commission_agence')
                  .reduce((s, e) => s + Number(e.montant || 0), 0);
                const pct = t.prix_convenu > 0
                  ? Math.min(100, Math.round((encaisseBien / t.prix_convenu) * 100))
                  : 0;

                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{t.biens?.code_reference}</p>
                      <p className="text-xs text-slate-500">{t.biens?.commune_quartier}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-bold text-slate-900">Acheteur: {t.acquereurs?.nom_complet}</p>
                      <p className="text-[10px] text-slate-500">Vendeur: {t.proprietaires?.nom_complet}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {formatFCFA(t.prix_convenu)}
                      </div>
                      <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                        Com. ({t.taux_commission || 5}%) : {formatFCFA(t.frais_agence)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-mono font-bold text-emerald-700 text-xs">
                            {formatFCFA(encaisseBien)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Reste: {formatFCFA(Math.max(0, t.prix_convenu - encaisseBien))}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(t.statut)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedTxForEncaissements(t)}
                          className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-xs transition"
                          title="Gérer les encaissements de cette vente"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Encaissements ({txEncs.length})
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4"/>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <h3 className="font-bold">{editingTransaction ? 'Modifier' : 'Initier'} une Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Bien Immobilier *</label>
                      <span className="text-[10px] text-slate-400 font-medium">Vente & Mixte uniquement</span>
                    </div>
                    {(() => {
                      const eligibleVenteBiens = biens.filter(
                        (b) => b.intention === 'vente' || b.intention === 'mixte' || b.id === bienId
                      );
                      return (
                        <>
                          <select
                            required
                            value={bienId}
                            onChange={(e) => setBienId(e.target.value)}
                            className="w-full p-2 border rounded-xl text-sm"
                          >
                            <option value="">Sélectionner un bien...</option>
                            {eligibleVenteBiens.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.code_reference} - {b.commune_quartier} [{b.intention === 'mixte' ? 'Mixte' : 'Vente'}]
                                {b.prix_vente_demande ? ` (${new Intl.NumberFormat('fr-FR').format(b.prix_vente_demande)} FCFA)` : ''}
                              </option>
                            ))}
                          </select>
                          {eligibleVenteBiens.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1">
                              Aucun bien enregistré avec intention "Vente" ou "Mixte".
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Vendeur (Automatique) *</label>
                    <select disabled required value={vendeurId} className="w-full p-2 border rounded-xl text-sm bg-slate-100">
                      <option value="">-</option>
                      {proprietaires.map(p => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Acquéreur *</label>
                    <select required value={acquereurId} onChange={e => setAcquereurId(e.target.value)} className="w-full p-2 border rounded-xl text-sm">
                      <option value="">Sélectionner...</option>
                      {acquereurs.map(a => <option key={a.id} value={a.id}>{a.nom_complet}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Notaire Instrumentaire</label>
                    <select value={notaireId} onChange={e => setNotaireId(e.target.value)} className="w-full p-2 border rounded-xl text-sm">
                      <option value="">Sélectionner (optionnel)...</option>
                      {notaires.map(n => <option key={n.id} value={n.id}>{n.nom_complet} ({n.etude_nom})</option>)}
                    </select>
                  </div>
                </div>

                {/* 3-Column Grid: Prix, Taux de commission, Frais d'agence */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase">Prix Convenu (FCFA) *</label>
                    <input
                      required
                      type="number"
                      value={prixConvenu}
                      onChange={(e) => handlePrixChange(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ex: 120000000"
                      className="w-full p-2 border rounded-xl text-sm font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase">Taux Commission (%) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={tauxCommission}
                      onChange={(e) => handleTauxChange(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="5"
                      className="w-full p-2 border rounded-xl text-sm font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase">Commission Cabinet (FCFA)</label>
                    <input
                      type="number"
                      value={fraisAgence}
                      onChange={(e) => setFraisAgence(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Calculée..."
                      className="w-full p-2 border rounded-xl text-sm font-mono font-bold text-emerald-700 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Statut</label>
                    <select value={statut} onChange={e => setStatut(e.target.value as any)} className="w-full p-2 border rounded-xl text-sm bg-slate-50">
                      <option value="initiee">1. Initiée</option>
                      <option value="compromis_signe">2. Compromis Signé</option>
                      <option value="acte_final_signe">3. Acte Final Signé</option>
                      <option value="annulee">X. Annulée</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Date de Compromis</label>
                    <input type="date" value={dateCompromis} onChange={e => setDateCompromis(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Date Acte Final</label>
                    <input type="date" value={dateActeFinal} onChange={e => setDateActeFinal(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Notes / Conditions Suspensive</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-xl text-sm h-16" />
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-200" id="photo-vente-section">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                    <span>Photo / Justificatif de la Vente (Compromis, Acte, Bien)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Recommandé</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ventePhoto}
                      onChange={(e) => setVentePhoto(e.target.value)}
                      placeholder="Lien URL de la photo ou du document..."
                      className="flex-1 w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => venteFileInputRef.current?.click()}
                      disabled={isUploadingVentePhoto}
                      className="inline-flex items-center px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm disabled:opacity-50 h-[38px]"
                    >
                      📁 Parcourir
                    </button>
                    <button
                      type="button"
                      onClick={() => venteCameraInputRef.current?.click()}
                      disabled={isUploadingVentePhoto}
                      className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 shadow-sm disabled:opacity-50 h-[38px]"
                    >
                      {isUploadingVentePhoto ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                      Photo
                    </button>
                  </div>

                  {ventePhoto && (
                    <div className="relative mt-2 w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                      <img src={ventePhoto} alt="Aperçu document vente" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setVentePhoto('')}
                        className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full text-xs shadow-md hover:bg-rose-500 transition"
                        title="Supprimer la photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <input type="file" ref={venteFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleVentePhotoUpload} />
                  <input type="file" ref={venteCameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleVentePhotoUpload} />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <DocumentUploader transactionVenteId={editingTransaction?.id} />
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-xl">Annuler</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-xl">
                    {isSubmitting ? 'En cours...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CONFIRMATION AJOUT PHOTO VENTE ======================= */}
      {showPhotoPromptVente && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Camera className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ajouter une photo ou document ?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aucune photo ou document (compromis, acte, bien) n'a été rattaché à cette vente. Souhaitez-vous en ajouter avant que la saisie ne se ferme ?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoPromptVente(false);
                  const section = document.getElementById('photo-vente-section');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  setTimeout(() => {
                    venteFileInputRef.current?.click();
                  }, 150);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 mr-1.5" />
                Oui, ajouter une photo
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPhotoPromptVente(false);
                  saveTransactionCore();
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
              >
                Non, enregistrer sans photo
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPhotoPromptVente(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium pt-1 cursor-pointer"
            >
              Revenir au formulaire
            </button>
          </div>
        </div>
      )}

      {/* Transaction Encaissements Modal */}
      {selectedTxForEncaissements && (
        <TransactionEncaissementsModal
          transaction={selectedTxForEncaissements}
          encaissements={encaissements}
          onClose={() => setSelectedTxForEncaissements(null)}
          onAddEncaissement={handleAddEncaissement}
          onDeleteEncaissement={handleDeleteEncaissement}
          onUpdateEncaissement={handleUpdateEncaissement}
          onValidateEncaissement={handleValidateEncaissement}
        />
      )}
    </div>
  );
};
