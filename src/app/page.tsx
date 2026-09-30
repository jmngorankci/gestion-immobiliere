'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { UserRole, Profile } from '@/types/database.types';
import { MOCK_PROFILES } from '@/lib/mock-data';
import {
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Home,
  Briefcase,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export default function RootAuthPage() {
  const router = useRouter();
  const {
    authentifierCabinet,
    authentifierLocataire,
    attribuerAccesUtilisateur,
    setCurrentUser,
    profiles,
    isSupabaseConnected,
  } = useAppStore();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Selected space / portal: 'cabinet' | 'locataire' | 'proprietaire'
  const [activeSpace, setActiveSpace] = useState<'cabinet' | 'locataire' | 'proprietaire'>('cabinet');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('gestionnaire');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPin, setRegPin] = useState('1234');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-adapt register role when activeSpace changes
  const handleSpaceChange = (space: 'cabinet' | 'locataire' | 'proprietaire') => {
    setActiveSpace(space);
    setErrorMsg('');
    setSuccessMsg('');
    if (space === 'cabinet') {
      setRegRole('gestionnaire');
      setLoginIdentifier('');
      setLoginPassword('');
    } else if (space === 'locataire') {
      setRegRole('locataire');
      setLoginIdentifier('+2250758493021');
      setLoginPassword('1234');
    } else {
      setRegRole('proprietaire');
      setLoginIdentifier('koffi.kouakou@gmail.com');
      setLoginPassword('admin123');
    }
  };

  // Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg(
        activeSpace === 'locataire'
          ? 'Veuillez renseigner votre numéro de téléphone.'
          : 'Veuillez renseigner votre email ou numéro de téléphone.'
      );
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMsg('Veuillez saisir votre mot de passe ou code PIN.');
      return;
    }

    try {
      setIsLoading(true);
      let user: Profile;

      if (activeSpace === 'locataire') {
        user = await authentifierLocataire(loginIdentifier, loginPassword);
        setSuccessMsg(`Connexion réussie ! Bienvenue ${user.nom_complet}.`);
        setTimeout(() => {
          router.push('/portal');
        }, 500);
      } else {
        user = await authentifierCabinet(loginIdentifier, loginPassword);
        setSuccessMsg(`Connexion réussie ! Bienvenue ${user.nom_complet}.`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Identifiants invalides pour l'espace sélectionné.");
    } finally {
      setIsLoading(false);
    }
  };

  // Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!regPhone.trim()) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    if (activeSpace === 'locataire') {
      if (!regPin.trim() || regPin.length < 4) {
        setErrorMsg('Le code PIN locataire doit comporter au moins 4 chiffres.');
        return;
      }
    } else {
      if (!regPassword || regPassword.length < 4) {
        setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setErrorMsg('Les mots de passe saisis ne correspondent pas.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const newProfile = await attribuerAccesUtilisateur({
        nom_complet: regFullName.trim(),
        telephone: regPhone.trim(),
        email: regEmail.trim() || undefined,
        role: regRole,
        mot_de_passe: activeSpace === 'locataire' ? regPin : regPassword,
        code_pin: activeSpace === 'locataire' ? regPin : undefined,
      });

      setCurrentUser(newProfile);
      setSuccessMsg(`Compte créé avec succès ! Bienvenue ${newProfile.nom_complet}.`);

      setTimeout(() => {
        if (newProfile.role === 'locataire') {
          router.push('/portal');
        } else {
          router.push('/dashboard');
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login
  const handleQuickLogin = (profile: Profile) => {
    setErrorMsg('');
    setSuccessMsg(`Connexion rapide en tant que ${profile.nom_complet}...`);
    setCurrentUser(profile);
    setTimeout(() => {
      if (profile.role === 'locataire') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-emerald-600/15 via-teal-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-sm sm:text-base tracking-tight text-white uppercase block">
                Cabinet Ivoire Immo
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold hidden sm:inline-block">
                Gestion Locative & Quittances Certifiées OHADA
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-medium">
                {isSupabaseConnected ? 'Supabase Connecté' : 'Mode Résilient'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Section */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto z-10 flex flex-col items-center">
        {/* Title & Badge */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Portail Central d'Accès Sécurisé</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {authMode === 'login' ? 'Espace de Connexion' : 'Création de Compte'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            {authMode === 'login'
              ? 'Connectez-vous à votre espace cabinet, locataire ou bailleur.'
              : 'Enregistrez votre profil pour accéder aux services de gestion locative.'}
          </p>
        </div>

        {/* Main Card Container */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          {/* Top Switcher: Connexion vs Créer un compte */}
          <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Se Connecter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un Compte</span>
            </button>
          </div>

          {/* Space Selector: Cabinet vs Locataire vs Propriétaire */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Type de profil :
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSpaceChange('cabinet')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  activeSpace === 'cabinet'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Briefcase className={`w-5 h-5 ${activeSpace === 'cabinet' ? 'text-emerald-400' : ''}`} />
                <span className="text-xs font-bold">Cabinet</span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Gestion</span>
              </button>

              <button
                type="button"
                onClick={() => handleSpaceChange('locataire')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  activeSpace === 'locataire'
                    ? 'border-teal-500 bg-teal-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Smartphone className={`w-5 h-5 ${activeSpace === 'locataire' ? 'text-teal-400' : ''}`} />
                <span className="text-xs font-bold">Locataire</span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => handleSpaceChange('proprietaire')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  activeSpace === 'proprietaire'
                    ? 'border-amber-500 bg-amber-500/15 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Home className={`w-5 h-5 ${activeSpace === 'proprietaire' ? 'text-amber-400' : ''}`} />
                <span className="text-xs font-bold">Bailleur</span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Propriétaire</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  {activeSpace === 'locataire'
                    ? 'Numéro de Téléphone (+225)'
                    : 'Email professionnel ou Téléphone'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    {activeSpace === 'locataire' ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type={activeSpace === 'locataire' ? 'tel' : 'text'}
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={
                      activeSpace === 'locataire'
                        ? '+225 07 58 49 30 21'
                        : activeSpace === 'cabinet'
                        ? 'directeur@cabinet-immo.ci'
                        : 'koffi.kouakou@gmail.com'
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Password or PIN field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">
                    {activeSpace === 'locataire' ? "Code PIN ou Mot de passe" : 'Mot de passe'}
                  </label>
                  {activeSpace === 'locataire' && (
                    <span className="text-[10px] text-teal-400 font-medium">Défaut: 1234</span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    {activeSpace === 'locataire' ? (
                      <KeyRound className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type={showPassword ? 'text' : activeSpace === 'locataire' ? 'password' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={activeSpace === 'locataire' ? '••••' : '••••••••'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/25 active:scale-98 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </span>
                ) : (
                  <>
                    <span>Accéder à mon Espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM: REGISTER */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Nom complet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Ex: Yao Kouassi Marc"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Téléphone Mobile (+225)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Email (optionnel pour locataire, obligatoire pour cabinet) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Adresse Email {activeSpace === 'locataire' ? '(Optionnel)' : ''}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required={activeSpace !== 'locataire'}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nom@exemple.ci"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Passwords / PIN */}
              {activeSpace === 'locataire' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Code PIN d'accès (4 chiffres)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="Ex: 1234"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Mot de passe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Confirmer</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/25 active:scale-98 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Création du compte...</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Créer et Activer mon Compte</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo 1-Click Access Section */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accès Rapide Démo (1 Clic)</span>
              </span>
              <span className="text-[10px] text-slate-500">Comptes pré-configurés</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profiles.slice(0, 4).map((p) => {
                const isLoc = p.role === 'locataire';
                const isProp = p.role === 'proprietaire';
                const isAdmin = p.role === 'super_admin' || p.role === 'gestionnaire';

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickLogin(p)}
                    className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950 transition flex items-center space-x-3 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.nom_complet} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-emerald-400">
                          {p.nom_complet.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition">
                        {p.nom_complet}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate capitalize flex items-center space-x-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAdmin
                              ? 'bg-emerald-400'
                              : isLoc
                              ? 'bg-teal-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span>{p.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid Below */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mt-8">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Quittances Certifiées</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Génération A4 avec QR code sécurisé et intégrité des données.</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Paiements Wave & OM</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Déclaration instantanée et suivi des statuts en direct.</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Reversements Bailleurs</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Commissions automatiques et bordereaux financiers par bien.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500 z-10">
        Cabinet Ivoire Gestion Immobilière SARL • Système de Gestion Locative conforme OHADA
      </footer>
    </div>
  );
}
