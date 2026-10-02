'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, PlusCircle, Search, Edit, Trash2, CheckCircle2, Clock, XCircle, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TransactionVente, Bien, Acquereur, Notaire, Proprietaire } from '@/types/database.types';
import { useAppStore } from '@/lib/store';
import { DocumentUploader } from '@/components/admin/DocumentUploader';

export const SalesManagement = () => {
  const { biens, proprietaires } = useAppStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [acquereurs, setAcquereurs] = useState<Acquereur[]>([]);
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  // Form states
  const [bienId, setBienId] = useState('');
  const [vendeurId, setVendeurId] = useState('');
  const [acquereurId, setAcquereurId] = useState('');
  const [notaireId, setNotaireId] = useState('');
  const [prixConvenu, setPrixConvenu] = useState<number | ''>('');
  const [fraisAgence, setFraisAgence] = useState<number | ''>('');
  const [statut, setStatut] = useState<'initiee' | 'compromis_signe' | 'acte_final_signe' | 'annulee'>('initiee');
  const [dateCompromis, setDateCompromis] = useState('');
  const [dateActeFinal, setDateActeFinal] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    const [txRes, acqRes, notRes] = await Promise.all([
      supabase.from('transactions_ventes').select('*, acquereurs(*), notaires(*)').order('created_at', { ascending: false }),
      supabase.from('acquereurs').select('*'),
      supabase.from('notaires').select('*'),
    ]);
    
    // We enrich transactions with biens and proprietaires from local store
    if (txRes.data) {
      const enrichedTxs = txRes.data.map(tx => {
        const bien = biens.find(b => b.id === tx.bien_id);
        const proprietaire = proprietaires.find(p => p.id === tx.vendeur_id);
        return {
          ...tx,
          biens: bien,
          proprietaires: proprietaire
        };
      });
      setTransactions(enrichedTxs);
    }
    
    if (acqRes.data) setAcquereurs(acqRes.data);
    if (notRes.data) setNotaires(notRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-select vendeur when bien changes
  useEffect(() => {
    if (bienId) {
      const selectedBien = biens.find(b => b.id === bienId);
      if (selectedBien) {
        setVendeurId(selectedBien.proprietaire_id);
      }
    }
  }, [bienId, biens]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setBienId('');
    setVendeurId('');
    setAcquereurId('');
    setNotaireId('');
    setPrixConvenu('');
    setFraisAgence('');
    setStatut('initiee');
    setDateCompromis('');
    setDateActeFinal('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTransaction(t);
    setBienId(t.bien_id);
    setVendeurId(t.vendeur_id);
    setAcquereurId(t.acquereur_id);
    setNotaireId(t.notaire_id || '');
    setPrixConvenu(t.prix_convenu);
    setFraisAgence(t.frais_agence || '');
    setStatut(t.statut);
    setDateCompromis(t.date_compromis || '');
    setDateActeFinal(t.date_acte_final || '');
    setNotes(t.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      bien_id: bienId,
      vendeur_id: vendeurId,
      acquereur_id: acquereurId,
      notaire_id: notaireId || null,
      prix_convenu: Number(prixConvenu),
      frais_agence: fraisAgence ? Number(fraisAgence) : 0,
      statut,
      date_compromis: dateCompromis || null,
      date_acte_final: dateActeFinal || null,
      notes,
    };

    if (editingTransaction) {
      await supabase.from('transactions_ventes').update(payload).eq('id', editingTransaction.id);
      
      // Update property status based on transaction status
      if (statut === 'acte_final_signe') {
        await supabase.from('biens').update({ statut_vente: 'vendu' }).eq('id', bienId);
      } else if (statut === 'compromis_signe') {
        await supabase.from('biens').update({ statut_vente: 'sous_compromis' }).eq('id', bienId);
      } else if (statut === 'annulee') {
        await supabase.from('biens').update({ statut_vente: 'disponible' }).eq('id', bienId);
      }
    } else {
      await supabase.from('transactions_ventes').insert([payload]);
      await supabase.from('biens').update({ statut_vente: 'sous_compromis' }).eq('id', bienId);
    }
    
    await fetchData();
    setIsSubmitting(false);
    setShowAddModal(false);
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
              <th className="py-3.5 px-4">Prix Convenu</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-4">Chargement...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-slate-500">Aucune vente en cours.</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{t.biens?.code_reference}</p>
                    <p className="text-xs text-slate-500">{t.biens?.commune_quartier}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-bold text-slate-900">Acheteur: {t.acquereurs?.nom_complet}</p>
                    <p className="text-[10px] text-slate-500">Vendeur: {t.proprietaires?.nom_complet}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                    {new Intl.NumberFormat('fr-FR').format(t.prix_convenu)} FCFA
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(t.statut)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleOpenEdit(t)} className="p-1.5 text-slate-500 hover:text-amber-600"><Edit className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))
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
                    <label className="text-xs font-bold text-slate-700">Bien Immobilier *</label>
                    <select required value={bienId} onChange={e => setBienId(e.target.value)} className="w-full p-2 border rounded-xl text-sm">
                      <option value="">Sélectionner un bien...</option>
                      {biens.map(b => <option key={b.id} value={b.id}>{b.code_reference} - {b.commune_quartier}</option>)}
                    </select>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Prix de Vente Convenu (FCFA) *</label>
                    <input required type="number" value={prixConvenu} onChange={e => setPrixConvenu(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-xl text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Frais d'Agence (FCFA)</label>
                    <input type="number" value={fraisAgence} onChange={e => setFraisAgence(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-xl text-sm font-mono" />
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
    </div>
  );
};
