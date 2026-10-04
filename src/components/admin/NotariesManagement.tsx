'use client';

import React, { useState, useEffect } from 'react';
import { Scale, PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Notaire } from '@/types/database.types';

export const NotariesManagement = () => {
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotaire, setEditingNotaire] = useState<Notaire | null>(null);

  // Form states
  const [nomComplet, setNomComplet] = useState('');
  const [etudeNom, setEtudeNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const fetchNotaires = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('notaires').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setNotaires(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotaires();
  }, []);

  const handleOpenAdd = () => {
    setEditingNotaire(null);
    setNomComplet('');
    setEtudeNom('');
    setTelephone('');
    setEmail('');
    setAdresse('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (n: Notaire) => {
    setEditingNotaire(n);
    setNomComplet(n.nom_complet);
    setEtudeNom(n.etude_nom || '');
    setTelephone(n.telephone);
    setEmail(n.email || '');
    setAdresse(n.adresse || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      nom_complet: nomComplet,
      etude_nom: etudeNom || null,
      telephone,
      email: email || null,
      adresse: adresse || null,
    };

    if (editingNotaire) {
      const { error } = await (supabase.from('notaires') as any).update(payload).eq('id', editingNotaire.id);
      if (error) {
        console.error("Erreur lors de la modification du notaire :", error);
        alert(`Erreur : ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      await fetchNotaires();
    } else {
      const { error } = await (supabase.from('notaires') as any).insert([payload]);
      if (error) {
        console.error("Erreur lors de l'ajout du notaire :", error);
        alert(`Erreur : ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      await fetchNotaires();
    }
    
    setIsSubmitting(false);
    setShowAddModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce notaire ?')) {
      const { error } = await (supabase.from('notaires') as any).delete().eq('id', id);
      if (error) {
        console.error("Erreur suppression notaire :", error);
        alert(`Erreur lors de la suppression : ${error.message}`);
        return;
      }
      fetchNotaires();
    }
  };

  const filteredNotaires = notaires.filter(n => 
    n.nom_complet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.etude_nom && n.etude_nom.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Scale className="w-6 h-6 mr-2.5 text-emerald-600" />
            Gestion des Notaires
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez votre carnet d'adresses d'études notariales.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter un Notaire
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou étude..."
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
              <th className="py-3.5 px-4">Maître / Notaire</th>
              <th className="py-3.5 px-4">Étude Notariale</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-4">Chargement...</td></tr>
            ) : filteredNotaires.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-slate-500">Aucun notaire trouvé.</td></tr>
            ) : (
              filteredNotaires.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{n.nom_complet}</td>
                  <td className="py-3 px-4 text-slate-600">{n.etude_nom || '-'}</td>
                  <td className="py-3 px-4">
                    <p className="text-xs text-slate-900">{n.telephone}</p>
                    <p className="text-[10px] text-slate-500">{n.email}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleOpenEdit(n)} className="p-1.5 text-slate-500 hover:text-amber-600 mr-2"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDelete(n.id)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold">{editingNotaire ? 'Modifier' : 'Ajouter'} un Notaire</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Nom Complet *</label>
                <input required type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Nom de l'Étude</label>
                <input type="text" value={etudeNom} onChange={e => setEtudeNom(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Téléphone *</label>
                <input required type="text" value={telephone} onChange={e => setTelephone(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Adresse</label>
                <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} className="w-full p-2 border rounded-xl text-sm" />
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
      )}
    </div>
  );
};
