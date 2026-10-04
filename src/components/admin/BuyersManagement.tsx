'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Acquereur } from '@/types/database.types';

export const BuyersManagement = () => {
  const [acquereurs, setAcquereurs] = useState<Acquereur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAcquereur, setEditingAcquereur] = useState<Acquereur | null>(null);

  // Form states
  const [nomComplet, setNomComplet] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [budgetMax, setBudgetMax] = useState<number | ''>('');
  const [apportPersonnel, setApportPersonnel] = useState<number | ''>('');
  const [criteresRecherche, setCriteresRecherche] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const fetchAcquereurs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('acquereurs').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setAcquereurs(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAcquereurs();
  }, []);

  const handleOpenAdd = () => {
    setEditingAcquereur(null);
    setNomComplet('');
    setTelephone('');
    setEmail('');
    setAdresse('');
    setBudgetMax('');
    setApportPersonnel('');
    setCriteresRecherche('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (a: Acquereur) => {
    setEditingAcquereur(a);
    setNomComplet(a.nom_complet);
    setTelephone(a.telephone);
    setEmail(a.email || '');
    setAdresse(a.adresse || '');
    setBudgetMax(a.budget_max || '');
    setApportPersonnel(a.apport_personnel || '');
    setCriteresRecherche(a.criteres_recherche || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      nom_complet: nomComplet,
      telephone,
      email: email || null,
      adresse: adresse || null,
      budget_max: budgetMax === '' ? null : budgetMax,
      apport_personnel: apportPersonnel === '' ? null : apportPersonnel,
      criteres_recherche: criteresRecherche || null,
    };

    if (editingAcquereur) {
      const { error } = await (supabase.from('acquereurs') as any).update(payload).eq('id', editingAcquereur.id);
      if (error) {
        console.error("Erreur lors de la modification de l'acquéreur :", error);
        alert(`Erreur : ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      await fetchAcquereurs();
    } else {
      const { error } = await (supabase.from('acquereurs') as any).insert([payload]);
      if (error) {
        console.error("Erreur lors de l'ajout de l'acquéreur :", error);
        alert(`Erreur : ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      await fetchAcquereurs();
    }
    
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet acquéreur ?')) {
      const { error } = await (supabase.from('acquereurs') as any).delete().eq('id', id);
      if (error) {
        console.error("Erreur suppression acquéreur :", error);
        alert(`Erreur lors de la suppression : ${error.message}`);
        return;
      }
      fetchAcquereurs();
    }
  };

  const filteredAcquereurs = acquereurs.filter(a => 
    a.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.telephone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <UserPlus className="w-6 h-6 mr-2.5 text-emerald-600" />
            Gestion des Acquéreurs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos prospects acheteurs et leurs critères de recherche.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter un Acquéreur
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Acquéreur</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Budget / Apport</th>
              <th className="py-3.5 px-4">Recherche</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-4">Chargement...</td></tr>
            ) : filteredAcquereurs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-slate-500">Aucun acquéreur trouvé.</td></tr>
            ) : (
              filteredAcquereurs.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{a.nom_complet}</td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-bold">{a.telephone}</p>
                    <p className="text-[10px] text-slate-500">{a.email || '-'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-bold text-emerald-600">{a.budget_max ? new Intl.NumberFormat('fr-FR').format(a.budget_max) + ' FCFA' : 'Non défini'}</p>
                    <p className="text-[10px] text-slate-500">Apport: {a.apport_personnel ? new Intl.NumberFormat('fr-FR').format(a.apport_personnel) + ' FCFA' : '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={a.criteres_recherche || ''}>
                    {a.criteres_recherche || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleOpenEdit(a)} className="p-1.5 text-slate-500 hover:text-amber-600 mr-2"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <h3 className="font-bold">{editingAcquereur ? 'Modifier' : 'Ajouter'} un Acquéreur</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Nom Complet *</label>
                    <input required type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Téléphone *</label>
                    <input required type="text" value={telephone} onChange={e => setTelephone(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Adresse</label>
                  <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Budget Max (FCFA)</label>
                    <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-xl text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Apport Personnel</label>
                    <input type="number" value={apportPersonnel} onChange={e => setApportPersonnel(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 border rounded-xl text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Critères de recherche</label>
                  <textarea value={criteresRecherche} onChange={e => setCriteresRecherche(e.target.value)} placeholder="Ex: Villa 4 pièces, Cocody..." className="w-full p-2 border rounded-xl text-sm h-20" />
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
