'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { MOCK_PROFILES } from '@/lib/mock-data';
import {
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Wrench,
  Wallet,
  ArrowRight,
  Zap,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const { setCurrentUser } = useAppStore();

  const handleSelectAdmin = () => {
    setCurrentUser(MOCK_PROFILES[0]); // Amadou Kouassi (Super Admin)
  };

  const handleSelectTenant = () => {
    setCurrentUser(MOCK_PROFILES[1]); // Fatou Bamba (Locataire)
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white uppercase block">
                Cabinet Ivoire Immo
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                Gestion Locative & Quittances Sécurisées
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Serveur Supabase & App Router Actifs</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center space-y-12">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Architecture Next.js 14+ • Supabase • TypeScript</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Plateforme Complète de <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Gestion Immobilière
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Encaissement de loyers en FCFA avec calcul automatique de commission (10% Cabinet / 90% Propriétaire), validation administrative avant édition de reçu A4 avec QR Code certifié, et suivi des réparations imputables.
          </p>
        </div>

        {/* Dual Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
          {/* Card 1: Espace Cabinet (Desktop/Tablet) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 shadow-2xl transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  Espace Cabinet (Gestionnaire)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Interface de pilotage financier & administratif
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Tableau de bord financier en FCFA (Commissions 10%)
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Module de validation des encaissements en attente
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Enregistrement des réparations avec imputation loyer
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Bordereaux de reversement 90% par propriétaire
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/auth/cabinet"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/20 active:scale-95 transition"
              >
                <span>Connexion Espace Cabinet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Espace Locataire (Mobile First) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-8 shadow-2xl transition duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition">
                  Espace Locataire (Mobile-First)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Portail locataire avec accès attribué par le cabinet
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Statut du loyer (À payer / En attente / Réglé)
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Visualisation du loyer ajusté (Loyer + Réparations)
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Déclaration de règlement Wave / OM / Virement
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Consultation & Téléchargement du reçu validé A4
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/auth/locataire"
                className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-700/20 active:scale-95 transition"
              >
                <span>Connexion Espace Locataire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Cabinet Ivoire Gestion Immobilière SARL • Système de Gestion Locative conforme OHADA
      </footer>
    </div>
  );
}
