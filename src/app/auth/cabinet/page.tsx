'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export default function CabinetLoginPage() {
  const router = useRouter();
  const { authentifierCabinet, setCurrentUser, profiles } = useAppStore();

  const [identifiant, setIdentifiant] = useState('direction@cabinet-ivoire-immo.ci');
  const [motDePasse, setMotDePasse] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      const user = await authentifierCabinet(identifiant, motDePasse);
      setSuccessMsg(`Connexion autorisée ! Bienvenue ${user.nom_complet}.`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants invalides pour l espace Cabinet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (email: string, mdp: string) => {
    setIdentifiant(email);
    setMotDePasse(mdp);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand */}
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center z-10 py-2">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-tight text-white">
            Cabinet Ivoire Immo
          </span>
        </Link>

        <Link
          href="/auth/locataire"
          className="text-xs font-bold text-teal-400 hover:text-teal-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
        >
          Accès Locataire →
        </Link>
      </div>

      {/* Center Box */}
      <div className="w-full max-w-md mx-auto my-auto bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Portail Administratif & Financier</span>
          </div>
          <h1 className="text-2xl font-black text-white">Connexion Espace Cabinet</h1>
          <p className="text-xs text-slate-400">
            Réservé à la direction et aux gestionnaires agréés du cabinet.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Professionnel ou Mobile
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                placeholder="direction@cabinet-ivoire-immo.ci"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mot de Passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <span>{isLoading ? 'Vérification...' : 'Ouvrir le Tableau de Bord'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Accounts */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase text-center">
            Comptes Gestionnaires Configurés :
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleQuickSelect('direction@cabinet-ivoire-immo.ci', 'admin123')}
              className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-left transition"
            >
              <div>
                <p className="font-bold text-white">Amadou Kouassi (Directeur)</p>
                <p className="text-[10px] text-slate-500 font-mono">direction@cabinet-ivoire-immo.ci</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Super Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('gestionnaire@cabinet-ivoire-immo.ci', 'agent123')}
              className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-left transition"
            >
              <div>
                <p className="font-bold text-white">Koffi Serge (Gestionnaire)</p>
                <p className="text-[10px] text-slate-500 font-mono">gestionnaire@cabinet-ivoire-immo.ci</p>
              </div>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Gestionnaire
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-xs text-slate-500 py-2">
        Les accès collaborateurs et locataires sont exclusivement créés et administrés par le Cabinet.
      </div>
    </div>
  );
}
