'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Lock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AuthHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center z-10">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-sm uppercase tracking-tight text-white block">
              Cabinet Ivoire Immo
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Portail d'Authentification
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          ← Accueil
        </Link>
      </div>

      {/* Center Choice Container */}
      <div className="max-w-4xl w-full mx-auto my-auto space-y-8 z-10 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Sélectionnez votre Espace de Connexion
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Les identifiants et codes d'accès sont délivrés et administrés par le Cabinet de Gestion Immobilière.
          </p>
        </div>

        {/* Dual Space Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          {/* Card 1: Espace Cabinet */}
          <Link
            href="/auth/cabinet"
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-8 shadow-2xl transition duration-300 flex flex-col justify-between group hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Administration & Gestion
                </span>
                <h2 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition mt-0.5">
                  Espace Cabinet
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Connexion par email professionnel pour le Directeur et les Gestionnaires de portefeuille.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Pilotage financier en FCFA & Commissions 10%
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Validation des encaissements & Quittances A4
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Attribution & Gestion des accès utilisateurs
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <div className="w-full py-3.5 px-5 bg-emerald-600 group-hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/20 transition">
                <span>Accéder à l'Espace Cabinet</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Card 2: Espace Locataire */}
          <Link
            href="/auth/locataire"
            className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/60 rounded-3xl p-8 shadow-2xl transition duration-300 flex flex-col justify-between group hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                <Smartphone className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                  Mobile First
                </span>
                <h2 className="text-2xl font-bold text-white group-hover:text-teal-400 transition mt-0.5">
                  Espace Locataire
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Connexion par numéro de téléphone mobile (+225) et code d'accès PIN pour les résidents.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Consultation du statut de loyer en temps réel
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Déclaration des paiements Wave / OM / Virement
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-teal-500 shrink-0" />
                  Téléchargement direct des quittances certifiées
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <div className="w-full py-3.5 px-5 bg-teal-600 group-hover:bg-teal-500 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-teal-700/20 transition">
                <span>Accéder au Portail Locataire</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center text-xs text-slate-500 z-10 py-2">
        Cabinet Ivoire Gestion Immobilière SARL • Système de Gestion Locative conforme OHADA
      </div>
    </div>
  );
}
