'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Profile, UserRole } from '@/types/database.types';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import {
  Users,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit,
  Trash2,
  Home,
  Copy,
  Smartphone,
  Share2,
} from 'lucide-react';

export default function UtilisateursAccessPage() {
  const {
    profiles,
    biens,
    contrats,
    attribuerAccesUtilisateur,
    modifierAccesUtilisateur,
    toggleStatutCompte,
    supprimerAcces,
    currentUser,
  } = useAppStore();

  const [filterRole, setFilterRole] = useState<string>('tous');
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Form states
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('+225 ');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('locataire');
  const [motDePasse, setMotDePasse] = useState('pass123');
  const [codePin, setCodePin] = useState('1234');
  const [bienId, setBienId] = useState(biens[0]?.id || '');
  const [loyer, setLoyer] = useState<number>(350000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access Credentials Summary Card (for easy sharing by the admin)
  const [generatedCard, setGeneratedCard] = useState<{
    nom: string;
    identifiant: string;
    secret: string;
    espace: string;
    url: string;
  } | null>(null);

  const filteredProfiles = profiles.filter((p) => {
    if (filterRole === 'tous') return true;
    return p.role === filterRole;
  });

  const handleOpenAdd = () => {
    setEditingProfile(null);
    setNom('');
    setTelephone('+225 ');
    setEmail('');
    setRole('locataire');
    setMotDePasse('pass123');
    setCodePin(String(Math.floor(1000 + Math.random() * 9000)));
    const targetBien = biens.find((b) => !b.est_occupe) || biens[0];
    setBienId(targetBien?.id || '');
    setLoyer(targetBien?.loyer_mensuel_reference || 350000);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Profile) => {
    setEditingProfile(p);
    setNom(p.nom_complet);
    setTelephone(p.telephone);
    setEmail(p.email || '');
    setRole(p.role);
    setMotDePasse(p.mot_de_passe || '');
    setCodePin(p.code_pin || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) {
      alert('Veuillez renseigner le nom et le numéro de téléphone.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingProfile) {
        await modifierAccesUtilisateur(editingProfile.id, {
          nom_complet: nom,
          telephone,
          email: email || null,
          role,
          mot_de_passe: motDePasse || null,
          code_pin: codePin || null,
        });
      } else {
        const created = await attribuerAccesUtilisateur({
          nom_complet: nom,
          telephone,
          email: email || undefined,
          role,
          mot_de_passe: motDePasse || undefined,
          code_pin: codePin || undefined,
          bien_id: role === 'locataire' ? bienId : undefined,
          loyer_mensuel: role === 'locataire' ? loyer : undefined,
        });

        // Set shareable credential card
        setGeneratedCard({
          nom: created.nom_complet,
          identifiant: role === 'locataire' ? created.telephone : created.email || created.telephone,
          secret: role === 'locataire' ? (created.code_pin || '1234') : (created.mot_de_passe || 'pass123'),
          espace: role === 'locataire' ? 'Espace Locataire (Mobile)' : 'Espace Cabinet (Gestionnaire)',
          url: role === 'locataire' ? 'http://localhost:3000/auth/locataire' : 'http://localhost:3000/auth/cabinet',
        });
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l opération.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Fiche d accès copiée dans le presse-papier !');
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-700" />
            Super Admin
          </span>
        );
      case 'gestionnaire':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Gestionnaire Cabinet
          </span>
        );
      case 'locataire':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <Smartphone className="w-3.5 h-3.5 mr-1 text-teal-700" />
            Locataire (Mobile)
          </span>
        );
      case 'proprietaire':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Propriétaire Bailleur
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-2.5 text-emerald-600" />
            Administration & Attribution des Accès
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Délivrez et gérez les comptes d'accès pour les collaborateurs du cabinet et les locataires résidents.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          + Attribuer un Nouvel Accès
        </button>
      </div>

      {/* Generated Access Summary Card Alert if any */}
      {generatedCard && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 text-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-300 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-emerald-300">
                  Fiche d'Accès Générée avec Succès !
                </h3>
                <p className="text-xs text-slate-300">
                  Transmettez ces identifiants au bénéficiaire (par SMS, WhatsApp ou Email).
                </p>
              </div>
            </div>

            <button
              onClick={() => setGeneratedCard(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕ Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 font-sans uppercase text-[10px] block">Bénéficiaire :</span>
              <strong className="text-white text-sm">{generatedCard.nom}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans uppercase text-[10px] block">Identifiant / Mobile :</span>
              <strong className="text-emerald-400">{generatedCard.identifiant}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans uppercase text-[10px] block">Mot de passe / PIN :</span>
              <strong className="text-amber-300 text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                {generatedCard.secret}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans uppercase text-[10px] block">Espace cible :</span>
              <span className="text-teal-300">{generatedCard.espace}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() =>
                copyToClipboard(
                  `Cabinet Ivoire Immo - Vos Accès :\nNom : ${generatedCard.nom}\nEspace : ${generatedCard.espace}\nIdentifiant : ${generatedCard.identifiant}\nCode/Mot de passe : ${generatedCard.secret}\nLien : ${generatedCard.url}`
                )
              }
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copier les Accès pour le Locataire
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setFilterRole('tous')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRole === 'tous'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tous les Comptes ({profiles.length})
        </button>

        <button
          onClick={() => setFilterRole('gestionnaire')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRole === 'gestionnaire'
              ? 'bg-emerald-700 text-white shadow'
              : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          Gestionnaires Cabinet ({profiles.filter((p) => p.role === 'gestionnaire').length})
        </button>

        <button
          onClick={() => setFilterRole('locataire')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRole === 'locataire'
              ? 'bg-teal-700 text-white shadow'
              : 'bg-teal-50 text-teal-800'
          }`}
        >
          Locataires Résidents ({profiles.filter((p) => p.role === 'locataire').length})
        </button>

        <button
          onClick={() => setFilterRole('super_admin')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterRole === 'super_admin'
              ? 'bg-purple-700 text-white shadow'
              : 'bg-purple-50 text-purple-800'
          }`}
        >
          Super Admin ({profiles.filter((p) => p.role === 'super_admin').length})
        </button>
      </div>

      {/* Table of Profiles */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Utilisateur</th>
                <th className="py-3.5 px-4">Espace & Rôle</th>
                <th className="py-3.5 px-4">Identifiant de Connexion</th>
                <th className="py-3.5 px-4">Secret (PIN / MDP)</th>
                <th className="py-3.5 px-4">Bien Rattaché</th>
                <th className="py-3.5 px-4 text-center">État Compte</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((p) => {
                const lease = contrats.find((c) => c.locataire_profile_id === p.id && c.statut === 'actif');
                const bien = lease ? biens.find((b) => b.id === lease.bien_id) : null;
                const isLoc = p.role === 'locataire';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.nom_complet}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: {p.id.slice(0, 10)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(p.role)}
                    </td>

                    {/* Identifiant */}
                    <td className="py-3.5 px-4 text-xs font-mono">
                      {isLoc ? (
                        <div>
                          <span className="font-bold text-slate-900">{p.telephone}</span>
                          <span className="text-[10px] text-teal-600 block">Mobile Auth</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900">{p.email || p.telephone}</span>
                          <span className="text-[10px] text-emerald-600 block">Email Professionnel</span>
                        </div>
                      )}
                    </td>

                    {/* Secret Key */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {isLoc ? (
                        <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                          PIN: {p.code_pin || '1234'}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                          {p.mot_de_passe || '••••••••'}
                        </span>
                      )}
                    </td>

                    {/* Bien rattaché */}
                    <td className="py-3.5 px-4 text-xs">
                      {bien ? (
                        <div>
                          <span className="font-bold font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            {bien.code_reference}
                          </span>
                          <p className="text-slate-500 text-[11px] mt-0.5">{bien.commune_quartier}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Non applicable</span>
                      )}
                    </td>

                    {/* État Compte */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleStatutCompte(p.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          p.est_actif
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Cliquer pour basculer l état du compte"
                      >
                        {p.est_actif ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Actif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                            Suspendu
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Modifier les accès"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {p.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer l accès pour ${p.nom_complet} ?`)) {
                                supprimerAcces(p.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Supprimer l accès"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Attribuer / Modifier un Accès */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingProfile ? `Modifier les Accès (${editingProfile.nom_complet})` : 'Délivrer un Nouvel Accès'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nom et Prénoms *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: M. Bamba Siaka"
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Téléphone Mobile (+225) *
                  </label>
                  <input
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+225 07 08 09 10 11"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Email Professionnel / Personnel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@cabinet-immo.ci"
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Espace & Rôle Attribué *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="locataire">Espace Locataire (Mobile First)</option>
                  <option value="gestionnaire">Espace Cabinet - Gestionnaire de Portefeuille</option>
                  <option value="super_admin">Espace Cabinet - Super Administrateur / Direction</option>
                  <option value="proprietaire">Bailleur / Propriétaire</option>
                </select>
              </div>

              {/* Password / PIN depending on role */}
              {role === 'locataire' ? (
                <div className="space-y-1 bg-teal-50/70 p-3 rounded-2xl border border-teal-200">
                  <label className="text-xs font-bold text-teal-900 uppercase flex items-center">
                    <KeyRound className="w-3.5 h-3.5 mr-1" />
                    Code PIN d'Accès Mobile (4 chiffres) *
                  </label>
                  <input
                    type="text"
                    value={codePin}
                    onChange={(e) => setCodePin(e.target.value)}
                    placeholder="1234"
                    maxLength={6}
                    className="w-full text-sm p-2 bg-white border border-teal-300 rounded-xl font-mono font-bold text-teal-900"
                    required
                  />
                  <p className="text-[11px] text-teal-700">
                    Le locataire utilisera son numéro de téléphone et ce code PIN pour se connecter.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center">
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Mot de Passe de Connexion Cabinet *
                  </label>
                  <input
                    type="password"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm p-2 bg-white border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              )}

              {/* If Locataire: Housing assignment & contract */}
              {role === 'locataire' && !editingProfile && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center">
                    <Home className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Bien Immobilier & Contrat de Bail Associé
                  </label>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Sélectionnez le Bien à Assigner</label>
                    <select
                      value={bienId}
                      onChange={(e) => {
                        setBienId(e.target.value);
                        const b = biens.find((item) => item.id === e.target.value);
                        if (b) setLoyer(b.loyer_mensuel_reference);
                      }}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl"
                    >
                      {biens.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code_reference} - {b.commune_quartier} ({formatFCFA(b.loyer_mensuel_reference)}) {b.est_occupe ? '(Déjà occupé)' : '(Libre)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Loyer Contractuel (FCFA)</label>
                    <input
                      type="number"
                      value={loyer}
                      onChange={(e) => setLoyer(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/20 active:scale-95 transition disabled:opacity-60"
                >
                  {isSubmitting ? 'Enregistrement...' : editingProfile ? 'Mettre à jour' : 'Délivrer les Accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
