'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  Smartphone,
  Phone,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building2,
  Lock,
} from 'lucide-react';

export default function TenantLoginPage() {
  const router = useRouter();
  const { authentifierLocataire, profiles } = useAppStore();

  const [telephone, setTelephone] = useState('+2250758493021');
  const [codePin, setCodePin] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      const user = await authentifierLocataire(telephone, codePin);
      setSuccessMsg(`Authentification réussie ! Bienvenue ${user.nom_complet}.`);
      setTimeout(() => {
        router.push('/portal');
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Numéro de téléphone ou code PIN introuvable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (tel: string, pin: string) => {
    setTelephone(tel);
    setCodePin(pin);
  };

  const locataires = profiles.filter((p) => p.role === 'locataire');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 relative overflow-hidden max-w-md mx-auto shadow-2xl">
      {/* Background Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex justify-between items-center z-10 py-2">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs uppercase tracking-tight text-white">
            Portail Locataire
          </span>
        </Link>

        <Link
          href="/auth/cabinet"
          className="text-[11px] font-bold text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg"
        >
          Espace Cabinet →
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-5 my-auto z-10">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white">Accès Espace Locataire</h1>
          <p className="text-xs text-slate-400">
            Consultez votre statut de loyer, déclarez vos règlements et téléchargez vos quittances officielles.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Numéro de Téléphone Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+225 07 58 49 30 21"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Code PIN ou Mot de Passe
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={codePin}
                onChange={(e) => setCodePin(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            <span>{isLoading ? 'Connexion...' : 'Accéder à mon Espace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Accounts List */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-center">
            Locataires avec Accès Attribués :
          </p>
          <div className="space-y-1">
            {locataires.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleQuickSelect(loc.telephone, loc.code_pin || '1234')}
                className="w-full p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs transition"
              >
                <div className="text-left">
                  <p className="font-bold text-white text-xs">{loc.nom_complet}</p>
                  <p className="text-[10px] font-mono text-slate-400">{loc.telephone}</p>
                </div>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800 font-bold">
                  PIN: {loc.code_pin || '1234'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 py-2 space-y-1">
        <p className="flex items-center justify-center">
          <Lock className="w-3 h-3 mr-1" />
          Accès délivré exclusivement par le Cabinet de Gestion.
        </p>
      </div>
    </div>
  );
}
